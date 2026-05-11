"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { LogEntry } from "@/app/page";

interface Props {
  sessionId: string;
  apiBase: string;
  onComplete: (result: Record<string, unknown>) => void;
  addLog: (level: LogEntry["level"], msg: string) => void;
}

type Phase = "starting" | "ready" | "recording" | "processing" | "verifying" | "done" | "error";

const RECORD_DURATION_MS = 8000;
const SAMPLE_RATE = 16000;
// AssemblyAI requires chunks between 50ms and 1000ms.
// 250ms is safe and gives good latency.
const CHUNK_MS = 250;

export default function VoiceChallenge({ sessionId, apiBase, onComplete, addLog }: Props) {
  const [phase, setPhase]                       = useState<Phase>("starting");
  const [challengePhrase, setChallengePhrase]   = useState<string>("");
  const [transcript, setTranscript]             = useState<string>("");
  const [confidence, setConfidence]             = useState<number>(0);
  const [timeLeft, setTimeLeft]                 = useState(RECORD_DURATION_MS / 1000);
  const [error, setError]                       = useState<string | null>(null);
  const [waveHeights, setWaveHeights]           = useState<number[]>(Array(20).fill(4));
  const [apiResponse, setApiResponse]           = useState<Record<string, unknown> | null>(null);
  const [useSimulation, setUseSimulation]       = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");

  const socketRef          = useRef<WebSocket | null>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const streamRef          = useRef<MediaStream | null>(null);
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const finalConfidenceRef = useRef<number>(0);
  const terminateTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminatedRef      = useRef(false);
  const verifiedRef        = useRef(false);
  const stoppedRef         = useRef(false); // prevents double-fire from interval
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

  // ─── Cleanup mic + recorder ───────────────────────────────────────────────

  const stopMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // ─── Verify (idempotent) ──────────────────────────────────────────────────

  const verify = useCallback(async (t: string, c: number, multiSpeaker: boolean) => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    if (terminateTimerRef.current) {
      clearTimeout(terminateTimerRef.current);
      terminateTimerRef.current = null;
    }

    setPhase("verifying");
    try {
      addLog("info", `POST /vendor/voice/verify — transcript: "${t}"`);
      const res = await fetch(`${apiBase}/vendor/voice/verify`, {
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

  // ─── Terminate WS (idempotent) ────────────────────────────────────────────

  const terminateSession = useCallback(() => {
    if (terminatedRef.current) return;
    terminatedRef.current = true;

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
  }, [addLog]);

  // ─── Mount: fetch challenge phrase ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${apiBase}/vendor/voice/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
        setChallengePhrase(data.challenge_phrase);
        // Schedule log after render, not during
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

  // ─── Start recording ──────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    // Reset all state and guards
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
          if (t <= 1) {
            clearInterval(timerRef.current!);
            stopWaveform();
            setPhase("processing");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return;
    }

    // ── Real path ──
    try {
      // Fresh token at click time
      addLog("info", "Fetching fresh token...");
      const tokenRes  = await fetch(`${apiBase}/vendor/voice/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.detail || `HTTP ${tokenRes.status}`);
      const freshWsUrl: string = tokenData.websocket_url;
      addLog("info", "Token obtained — opening WebSocket");

      // Request mic before opening socket so permission prompt doesn't delay connection
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ws = new WebSocket(freshWsUrl);
      socketRef.current = ws;

      ws.onerror = () => addLog("error", "WebSocket error");
      ws.onclose = (e) => addLog("info", `WS closed — code: ${e.code}`);

      ws.onmessage = ({ data: raw }) => {
        try {
          const msg = JSON.parse(raw as string);
          addLog("info", `WS ← ${JSON.stringify(msg)}`);

          if (msg.error) {
            addLog("error", `AssemblyAI error: ${msg.error}`);
            return;
          }

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
            if (terminateTimerRef.current) {
              clearTimeout(terminateTimerRef.current);
              terminateTimerRef.current = null;
            }
            ws.close();
            verifyRef.current?.(finalTranscriptRef.current, finalConfidenceRef.current, false);
          }
        } catch { /* ignore */ }
      };

      ws.onopen = () => {
        addLog("info", "WebSocket connected — starting MediaRecorder");

        // Use native MediaRecorder with timeslice to guarantee chunk size.
        // opus at 16kHz produces ~1.5kB per 250ms chunk — well within limits.
        // We pick the first supported mimeType from the list.
        const mimeType = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "",
        ].find(m => m === "" || MediaRecorder.isTypeSupported(m)) ?? "";

        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined,
        );
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            e.data.arrayBuffer().then(buf => {
              if (ws.readyState === WebSocket.OPEN) ws.send(buf);
            });
          }
        };

        recorder.onerror = (e) => addLog("error", `MediaRecorder error: ${e}`);

        // timeslice = CHUNK_MS: browser fires ondataavailable every 250ms
        recorder.start(CHUNK_MS);

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
              stopMediaRecorder();
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
  }, [sessionId, apiBase, addLog, useSimulation, startWaveform, stopWaveform, stopMediaRecorder, terminateSession]);

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
          Real-time voice transcription via AssemblyAI — step 2 of 2
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
          <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "22px", color: "var(--vault-white)", margin: 0, lineHeight: 1.4 }}>
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