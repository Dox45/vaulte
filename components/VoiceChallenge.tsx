"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { LogEntry } from "@/app/page";

interface Props {
  sessionId: string;
  apiBase: string;
  endpoints?: {
    start?: string;
    verify?: string;
  };
  onComplete: (result: Record<string, unknown>) => void;
  addLog: (level: LogEntry["level"], msg: string) => void;
}


type Phase = "starting" | "ready" | "recording" | "processing" | "verifying" | "done" | "error";

const RECORD_DURATION_MS = 10000;
const TARGET_SAMPLE_RATE = 16000;

// ─── PCM helpers ─────────────────────────────────────────────────────────────

/** Downsample a Float32 buffer from nativeSR → targetSR */
function downsampleBuffer(buf: Float32Array, nativeSR: number, targetSR: number): Float32Array {
  if (nativeSR === targetSR) return buf;
  const ratio  = nativeSR / targetSR;
  const length = Math.round(buf.length / ratio);
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const idx = Math.min(Math.floor(i * ratio), buf.length - 1);
    result[i] = buf[idx];
  }
  return result;
}

/** Convert Float32 samples (−1…1) to Int16 PCM bytes */
function float32ToPCM16(buf: Float32Array): ArrayBuffer {
  const ab  = new ArrayBuffer(buf.length * 2);
  const view = new DataView(ab);
  for (let i = 0; i < buf.length; i++) {
    const s = Math.max(-1, Math.min(1, buf[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return ab;
}

export default function VoiceChallenge({ 
  sessionId, 
  apiBase, 
  endpoints = { start: "/vendor/voice/start", verify: "/vendor/voice/verify" },
  onComplete, 
  addLog 
}: Props) {

  const [phase, setPhase]                     = useState<Phase>("starting");
  const [challengePhrase, setChallengePhrase] = useState<string>("");
  const [transcript, setTranscript]           = useState<string>("");
  const [confidence, setConfidence]           = useState<number>(0);
  const [timeLeft, setTimeLeft]               = useState(RECORD_DURATION_MS / 1000);
  const [error, setError]                     = useState<string | null>(null);
  const [waveHeights, setWaveHeights]         = useState<number[]>(Array(20).fill(4));
  const [apiResponse, setApiResponse]         = useState<Record<string, unknown> | null>(null);
  const [useSimulation, setUseSimulation]     = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");

  const socketRef          = useRef<WebSocket | null>(null);
  const streamRef          = useRef<MediaStream | null>(null);
  const audioCtxRef        = useRef<AudioContext | null>(null);
  const processorRef       = useRef<ScriptProcessorNode | null>(null);
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const finalConfidenceRef = useRef<number>(0);
  const terminateTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminatedRef      = useRef(false);
  const verifiedRef        = useRef(false);
  const stoppedRef         = useRef(false);
  const verifyRef          = useRef<((t: string, c: number, m: boolean) => Promise<void>) | null>(null);

  // ─── Waveform ──────────────────────────────────────────────────────────────

  const startWaveform = useCallback(() => {
    waveRef.current = setInterval(() => {
      setWaveHeights(Array(20).fill(0).map(() => Math.random() * 28 + 4));
    }, 80);
  }, []);

  const stopWaveform = useCallback(() => {
    if (waveRef.current) { clearInterval(waveRef.current); waveRef.current = null; }
    setWaveHeights(Array(20).fill(4));
  }, []);

  // ─── Stop audio pipeline ─────────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // ─── Verify (idempotent) ─────────────────────────────────────────────────

  const verify = useCallback(async (t: string, c: number, multiSpeaker: boolean) => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    if (terminateTimerRef.current) { clearTimeout(terminateTimerRef.current); terminateTimerRef.current = null; }
    setPhase("verifying");
    try {
      addLog("info", `POST ${endpoints.verify} — transcript: "${t}"`);
      const res = await fetch(`${apiBase}${endpoints.verify}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id:                 sessionId,
          transcript:                 t,
          audio_confidence:           c,
          multiple_speakers_detected: multiSpeaker,
        }),
      });
      const data = await res.json();
      setApiResponse(data);
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      addLog("success", `Voice verify → ${res.status} OK`);
      setPhase("done");
      onComplete(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      addLog("error", `Voice verify failed: ${msg}`);
      setError(msg);
      setPhase("error");
    }
  }, [sessionId, apiBase, addLog, onComplete]);

  useEffect(() => { verifyRef.current = verify; }, [verify]);

  // ─── Terminate WS ────────────────────────────────────────────────────────

  const terminateSession = useCallback(() => {
    if (terminatedRef.current) return;
    terminatedRef.current = true;
    stopAudio();
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      verifyRef.current?.(finalTranscriptRef.current, finalConfidenceRef.current, false);
      return;
    }
    addLog("info", "Sending Terminate to AssemblyAI");
    ws.send(JSON.stringify({ type: "Terminate" }));
    terminateTimerRef.current = setTimeout(() => {
      addLog("warn", "Termination timeout — force-verifying");
      ws.close();
      verifyRef.current?.(finalTranscriptRef.current, finalConfidenceRef.current, false);
    }, 4000);
  }, [addLog, stopAudio]);

  // ─── Mount: fetch challenge phrase ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${apiBase}${endpoints.start}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
        setChallengePhrase(data.challenge_phrase);
        setTimeout(() => addLog("success", `Challenge phrase: "${data.challenge_phrase}"`), 0);
        setPhase("ready");
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to start session";
        setTimeout(() => addLog("error", `Voice start failed: ${msg}`), 0);
        setUseSimulation(true);
        setChallengePhrase("I am verifying my Vault account today");
        setPhase("ready");
        setTimeout(() => addLog("warn", "Simulation mode — enter transcript manually"), 0);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Start recording ─────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    terminatedRef.current = false;
    verifiedRef.current   = false;
    stoppedRef.current    = false;
    finalTranscriptRef.current = "";
    finalConfidenceRef.current = 0;
    setTranscript("");
    setConfidence(0);
    setError(null);

    // ── Simulation path ──
    if (useSimulation) {
      setPhase("recording");
      setTimeLeft(RECORD_DURATION_MS / 1000);
      startWaveform();
      addLog("info", "[SIM] Recording started");
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current!); stopWaveform(); setPhase("processing"); return 0; }
          return t - 1;
        });
      }, 1000);
      return;
    }

    // ── Real path: PCM16 via Web Audio API ──
    try {
      addLog("info", "Fetching fresh token...");
      const tokenRes  = await fetch(`${apiBase}${endpoints.start}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.detail || `HTTP ${tokenRes.status}`);
      const wsUrl: string = tokenData.websocket_url;
      addLog("info", "Token obtained — opening WebSocket");

      // Mic stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // AudioContext — prefer 16kHz, fallback to device native rate
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new AudioCtx({ sampleRate: TARGET_SAMPLE_RATE });
      audioCtxRef.current = ctx;
      const nativeSR = ctx.sampleRate;
      addLog("info", `AudioContext SR: ${nativeSR} Hz`);

      // ScriptProcessor: 4096-sample buffer → ~256ms chunks at 16kHz
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(processor);
      processor.connect(ctx.destination); // must be connected to fire onaudioprocess

      // WebSocket
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      socketRef.current = ws;
      ws.onerror = () => addLog("error", "WebSocket error");
      ws.onclose = (e) => addLog("info", `WS closed — code: ${e.code}`);

      ws.onmessage = ({ data: raw }) => {
        try {
          const msg = JSON.parse(raw as string);
          addLog("info", `WS ← ${JSON.stringify(msg)}`);
          if (msg.error) { addLog("error", `AssemblyAI error: ${msg.error}`); return; }
          if (msg.type === "Turn") {
            const text: string = msg.transcript ?? "";
            const conf: number = msg.end_of_turn_confidence ?? msg.confidence ?? 1.0;
            if (text) {
              finalTranscriptRef.current = text;
              finalConfidenceRef.current = conf;
              setTranscript(text);
              setConfidence(conf);
              addLog("success", `Transcript: "${text}"`);
            }
          } else if (msg.type === "Termination") {
            addLog("info", "Termination received — verifying");
            if (terminateTimerRef.current) { clearTimeout(terminateTimerRef.current); terminateTimerRef.current = null; }
            ws.close();
            verifyRef.current?.(finalTranscriptRef.current, finalConfidenceRef.current, false);
          }
        } catch { /* ignore */ }
      };

      ws.onopen = () => {
        addLog("info", `WebSocket connected — streaming PCM16 @ ${TARGET_SAMPLE_RATE} Hz`);

        // Send PCM16 chunks from ScriptProcessor
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input    = e.inputBuffer.getChannelData(0);
          const downsampled = downsampleBuffer(input, nativeSR, TARGET_SAMPLE_RATE);
          const pcm      = float32ToPCM16(downsampled);
          ws.send(pcm);
        };

        setPhase("recording");
        setTimeLeft(RECORD_DURATION_MS / 1000);
        startWaveform();
        addLog("info", "Recording started — speak the phrase");

        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            const next = prev - 1;
            if (next <= 0 && !stoppedRef.current) {
              stoppedRef.current = true;
              clearInterval(timerRef.current!);
              stopWaveform();
              terminateSession();
              setPhase("processing");
              return 0;
            }
            return next > 0 ? next : 0;
          });
        }, 1000);
      };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start recording";
      addLog("error", msg);
      setError(msg);
      setPhase("error");
    }
  }, [sessionId, apiBase, addLog, useSimulation, startWaveform, stopWaveform, terminateSession]);

  // ─── Phase helpers ────────────────────────────────────────────────────────

  const phaseProgress: Record<Phase, number> = {
    starting: 5, ready: 20, recording: 55, processing: 70, verifying: 88, done: 100, error: 0,
  };

  const phaseLabel: Record<Phase, string> = {
    starting:   "Starting voice session...",
    ready:      "Ready — press record",
    recording:  `Recording — ${timeLeft}s remaining`,
    processing: "Processing audio...",
    verifying:  "Verifying transcript...",
    done:       "Voice challenge complete",
    error:      "Error occurred",
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeup" style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "6px" }}>
          Voice Challenge
        </h2>
        <p style={{ color: "var(--vault-text-dim)", fontSize: "12px" }}>
          Real-time voice transcription via AssemblyAI — step 2 of 3
        </p>
      </div>

      {useSimulation && (
        <div style={{ padding: "10px 14px", border: "1px solid var(--vault-amber)", borderRadius: "2px", background: "rgba(255,171,0,0.06)", fontSize: "11px", color: "var(--vault-amber)", marginBottom: "20px", letterSpacing: "0.04em" }}>
          ⚠ SIMULATION MODE — Backend unreachable. Enter transcript manually.
        </div>
      )}

      {challengePhrase && (
        <div style={{ padding: "20px 24px", border: "1px solid var(--vault-green)", borderRadius: "2px", background: "rgba(0,230,118,0.04)", marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", letterSpacing: "0.1em", marginBottom: "10px" }}>SPEAK THIS PHRASE EXACTLY</div>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(16px, 5vw, 22px)", color: "var(--vault-white)", margin: 0, lineHeight: 1.4 }}>
            &ldquo;{challengePhrase}&rdquo;
          </p>
        </div>
      )}

      {/* Waveform */}
      <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "24px", padding: "12px", border: "1px solid var(--vault-border)", borderRadius: "2px", background: "var(--vault-surface)" }}>
        {phase === "recording" ? (
          waveHeights.map((h, i) => (
            <div key={i} style={{ width: "3px", height: `${h}px`, background: "var(--vault-green)", borderRadius: "2px", transition: "height 0.08s ease", boxShadow: "0 0 6px var(--vault-green)" }} />
          ))
        ) : (
          <div style={{ fontSize: "11px", color: "var(--vault-text-dim)", letterSpacing: "0.08em" }}>
            {phase === "starting"                             ? "INITIALIZING..."  :
             phase === "ready"                               ? "AWAITING INPUT"   :
             phase === "processing" || phase === "verifying" ? "PROCESSING..."    : "—"}
          </div>
        )}
      </div>

      {/* Live transcript */}
      {(phase === "recording" || phase === "processing" || phase === "verifying" || phase === "done") && (
        <div style={{ padding: "12px 16px", border: "1px solid var(--vault-border)", borderRadius: "2px", background: "var(--vault-surface)", marginBottom: "20px", minHeight: "60px" }}>
          <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", letterSpacing: "0.1em", marginBottom: "8px" }}>TRANSCRIPT</div>
          <p
            className={phase === "recording" ? "cursor-blink" : ""}
            style={{ fontSize: "13px", color: transcript ? "var(--vault-white)" : "var(--vault-muted)", margin: 0 }}
          >
            {transcript || "Listening..."}
          </p>
          {confidence > 0 && (
            <div style={{ fontSize: "10px", color: "var(--vault-green)", marginTop: "6px" }}>
              confidence: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
      )}

      {/* Sim mode manual input */}
      {useSimulation && (phase === "processing" || phase === "ready" || phase === "recording") && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "10px", color: "var(--vault-text-dim)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
            MANUAL TRANSCRIPT INPUT
          </label>
          <input
            value={manualTranscript}
            onChange={e => setManualTranscript(e.target.value)}
            placeholder={challengePhrase}
            style={{ width: "100%", background: "var(--vault-surface)", border: "1px solid var(--vault-border)", color: "var(--vault-white)", fontSize: "13px", padding: "10px 14px", borderRadius: "1px", fontFamily: "DM Mono", outline: "none" }}
          />
          <button
            className="vault-btn vault-btn-primary"
            style={{ marginTop: "10px", fontSize: "11px" }}
            disabled={!manualTranscript.trim()}
            onClick={() => verify(manualTranscript, 0.88, false)}
          >
            SUBMIT TRANSCRIPT
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--vault-text-dim)", letterSpacing: "0.08em" }}>
            {phaseLabel[phase].toUpperCase()}
          </span>
          <span style={{ fontSize: "11px", color: "var(--vault-green)" }}>{phaseProgress[phase]}%</span>
        </div>
        <div style={{ height: "2px", background: "var(--vault-border)", borderRadius: "1px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${phaseProgress[phase]}%`, background: "linear-gradient(90deg, var(--vault-green), #69ffb4)", transition: "width 0.6s ease" }} />
        </div>
      </div>

      {phase === "ready" && !useSimulation && (
        <button
          className="vault-btn vault-btn-primary"
          onClick={startRecording}
          style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", padding: "14px 28px" }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--vault-red)", boxShadow: "0 0 8px var(--vault-red)" }} />
          START RECORDING
        </button>
      )}

      {phase === "recording" && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--vault-red)", boxShadow: "0 0 12px var(--vault-red)" }} className="recording-pulse" />
          <span style={{ fontSize: "12px", color: "var(--vault-white)", letterSpacing: "0.06em" }}>
            RECORDING — {timeLeft}s
          </span>
        </div>
      )}

      {error && phase === "error" && (
        <div style={{ padding: "12px 16px", border: "1px solid var(--vault-red)", borderRadius: "2px", background: "rgba(255,61,87,0.06)", fontSize: "12px", color: "var(--vault-red)", marginTop: "16px" }}>
          {error}
          {apiResponse && (
            <pre style={{ marginTop: "8px", fontSize: "10px", whiteSpace: "pre-wrap", color: "var(--vault-white)" }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}