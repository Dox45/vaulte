"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { LogEntry } from "@/app/page";

interface Props {
  sessionId: string;
  apiBase: string;
  onComplete: (result: Record<string, unknown>) => void;
  addLog: (level: LogEntry["level"], msg: string) => void;
}

type Phase = "init" | "blink" | "turn" | "capturing" | "submitting" | "done" | "error";

// Blink: EAR must drop by this absolute amount from rolling average (~9% of 0.019 baseline)
const BLINK_DROP_DELTA   = 0.003;
// Blink: EAR must recover this much from the dip bottom to confirm blink complete
const BLINK_REOPEN_DELTA = 0.002;
// Rolling window size for stable open-eye average
const EAR_WINDOW = 8;

// Head turn: nose must move ≥10% of frame width from personal resting baseline
const HEAD_TURN_DELTA     = 0.10;
const BASELINE_FRAMES     = 20;
const TURN_SUSTAIN_FRAMES = 3;

export default function LivenessCheck({ sessionId, apiBase, onComplete, addLog }: Props) {
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const animFrameRef     = useRef<number>(0);

  const [phase, setPhase]                     = useState<Phase>("init");
  const [blinkDetected, setBlinkDetected]     = useState(false);
  const [headTurnDetected, setHeadTurnDetected] = useState(false);
  const [capturedFrame, setCapturedFrame]     = useState<string | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [faceDetected, setFaceDetected]       = useState(false);
  const [landmarkCount, setLandmarkCount]     = useState(0);
  const [apiResponse, setApiResponse]         = useState<Record<string, unknown> | null>(null);
  const [turnProgress, setTurnProgress]       = useState(0);
  const [calibrating, setCalibrating]         = useState(true);

  const blinkRef = useRef(false);
  const turnRef  = useRef(false);
  const phaseRef = useRef<Phase>("init");

  // ── Blink refs ─────────────────────────────────────────────────────────────
  type BlinkState = "open" | "dipping";
  const blinkStateRef = useRef<BlinkState>("open");
  const earWindowRef  = useRef<number[]>([]);   // rolling EAR history
  const dipMinEAR     = useRef<number>(9999);   // lowest point during dip

  // ── Head turn refs ─────────────────────────────────────────────────────────
  const noseBaselineRef        = useRef<number | null>(null);
  const baselineFramesRef      = useRef<number>(0);
  const noseBaselineSamplesRef = useRef<number[]>([]);
  const turnSustainRef         = useRef<number>(0);

  // ── Blink detection ────────────────────────────────────────────────────────
  const detectBlink = useCallback((landmarks: { x: number; y: number; z: number }[]): boolean => {
    const leftEAR  = Math.abs(landmarks[159].y - landmarks[145].y);
    const rightEAR = Math.abs(landmarks[386].y - landmarks[374].y);
    const ear      = (leftEAR + rightEAR) / 2;

    // Maintain rolling window
    earWindowRef.current.push(ear);
    if (earWindowRef.current.length > EAR_WINDOW) earWindowRef.current.shift();

    // Need full window before detecting
    if (earWindowRef.current.length < EAR_WINDOW) return false;

    // Rolling average of all-but-last-frame = stable open-eye reference
    const prev    = earWindowRef.current.slice(0, -1);
    const avg     = prev.reduce((a, b) => a + b, 0) / prev.length;
    const drop    = avg - ear;
    const state   = blinkStateRef.current;

    console.log(`EAR: ${ear.toFixed(4)} | avg: ${avg.toFixed(4)} | drop: ${drop.toFixed(4)} | state: ${state}`);

    // Mark calibration done after first full window
    if (calibrating) setCalibrating(false);

    if (state === "open") {
      if (drop > BLINK_DROP_DELTA) {
        blinkStateRef.current = "dipping";
        dipMinEAR.current     = ear;
      }
      return false;
    }

    if (state === "dipping") {
      dipMinEAR.current = Math.min(dipMinEAR.current, ear);

      if (ear > dipMinEAR.current + BLINK_REOPEN_DELTA) {
        // Recovered from dip — confirmed blink
        blinkStateRef.current = "open";
        dipMinEAR.current     = 9999;
        return true;
      }

      // Safety: if EAR somehow shoots back above avg without triggering reopen check
      if (ear >= avg * 0.98) {
        blinkStateRef.current = "open";
        dipMinEAR.current     = 9999;
      }
      return false;
    }

    return false;
  }, [calibrating]);

  // ── Head turn detection ────────────────────────────────────────────────────
  const detectHeadTurn = useCallback((landmarks: { x: number; y: number; z: number }[]): { turned: boolean; progress: number } => {
    const noseX = landmarks[1].x;

    if (noseBaselineRef.current === null) {
      noseBaselineSamplesRef.current.push(noseX);
      baselineFramesRef.current += 1;
      if (baselineFramesRef.current >= BASELINE_FRAMES) {
        const sorted = [...noseBaselineSamplesRef.current].sort((a, b) => a - b);
        noseBaselineRef.current = sorted[Math.floor(sorted.length / 2)];
      }
      return { turned: false, progress: 0 };
    }

    const delta    = Math.abs(noseX - noseBaselineRef.current);
    const progress = Math.min(delta / HEAD_TURN_DELTA, 1);

    turnSustainRef.current = delta >= HEAD_TURN_DELTA ? turnSustainRef.current + 1 : 0;

    return { turned: turnSustainRef.current >= TURN_SUSTAIN_FRAMES, progress };
  }, []);

  // ── Canvas overlay ─────────────────────────────────────────────────────────
  const drawOverlay = useCallback((landmarks: { x: number; y: number; z: number }[], hasFace: boolean) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const faceOval = [10,338,297,332,284,251,389,356,454,323,361,288,
      397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,
      234,127,162,21,54,103,67,109];

    ctx.beginPath();
    faceOval.forEach((idx, i) => {
      const lm = landmarks[idx];
      if (i === 0) ctx.moveTo(lm.x * canvas.width, lm.y * canvas.height);
      else         ctx.lineTo(lm.x * canvas.width, lm.y * canvas.height);
    });
    ctx.closePath();
    ctx.strokeStyle = hasFace ? "#00e676" : "rgba(0,230,118,0.25)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    [[159, 145], [386, 374]].forEach(([u, l]) => {
      [u, l].forEach(idx => {
        ctx.beginPath();
        ctx.arc(landmarks[idx].x * canvas.width, landmarks[idx].y * canvas.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#00e676";
        ctx.fill();
      });
    });

    const nose = landmarks[1];
    ctx.beginPath();
    ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00e676";
    ctx.fill();

    if (noseBaselineRef.current !== null && phaseRef.current === "turn") {
      const baseX = noseBaselineRef.current * canvas.width;
      ctx.beginPath();
      ctx.moveTo(baseX, 0);
      ctx.lineTo(baseX, canvas.height);
      ctx.strokeStyle = "rgba(0,230,118,0.2)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, []);

  // ── Capture + submit ───────────────────────────────────────────────────────
  const captureAndSubmit = useCallback(async (blink: boolean, turn: boolean) => {
    setPhase("capturing");
    phaseRef.current = "capturing";

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const frameB64 = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedFrame(frameB64);
    addLog("info", `Frame captured — ${canvas.width}×${canvas.height}px`);

    setPhase("submitting");
    phaseRef.current = "submitting";

    try {
      addLog("info", `POST ${apiBase}/vendor/liveness`);
      const res = await fetch(`${apiBase}/vendor/liveness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id:         sessionId,
          frame_base64:       frameB64,
          blink_detected:     blink,
          head_turn_detected: turn,
        }),
      });
      const data = await res.json();
      setApiResponse(data);
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      addLog("success", `Liveness API → ${res.status} OK`);
      setPhase("done");
      phaseRef.current = "done";
      onComplete(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLog("error", `Liveness API failed: ${msg}`);
      setError(msg);
      setPhase("error");
      phaseRef.current = "error";
    }
  }, [sessionId, apiBase, addLog, onComplete]);

  // ── MediaPipe init ─────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const loadScript = (src: string) =>
          new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = src;
            s.crossOrigin = "anonymous";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(s);
          });

        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        if (!active) return;

        // Acquire camera stream independently so we can capture frames.
        // Try with preferred constraints first, then fall back to bare video.
        let stream: MediaStream;
        // Check if mediaDevices API exists (fails on non-secure contexts)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API unavailable — ensure the page is served over HTTPS or localhost");
        }

        // Enumerate devices first so we can give a clear error message
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        addLog("info", `Found ${videoDevices.length} camera device(s): ${videoDevices.map(d => d.label || "(unlabeled)").join(", ") || "none"}`);

        if (videoDevices.length === 0) {
          throw new Error("No camera found. Please connect a webcam and reload the page.");
        }

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: { ideal: "user" } },
          });
        } catch {
          addLog("warn", "Preferred camera constraints failed — retrying with bare video");
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        addLog("info", "Camera stream acquired");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        const fm  = new win.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        fm.onResults((results: { multiFaceLandmarks?: { x: number; y: number; z: number }[][] }) => {
          if (!active) return;

          const hasFace = !!(results.multiFaceLandmarks?.length);
          setFaceDetected(hasFace);
          if (!hasFace) return;

          const lms = results.multiFaceLandmarks![0];
          setLandmarkCount(lms.length);
          drawOverlay(lms, hasFace);

          const currentPhase = phaseRef.current;
          if (currentPhase !== "blink" && currentPhase !== "turn") return;

          if (currentPhase === "blink" && !blinkRef.current) {
            const didBlink = detectBlink(lms);
            if (didBlink) {
              blinkRef.current = true;
              setBlinkDetected(true);
              addLog("success", "Blink confirmed ✓");

              noseBaselineRef.current       = null;
              baselineFramesRef.current     = 0;
              noseBaselineSamplesRef.current = [];
              turnSustainRef.current        = 0;
              setTurnProgress(0);

              phaseRef.current = "turn";
              setPhase("turn");
            }
            return;
          }

          if (currentPhase === "turn" && !turnRef.current) {
            const { turned, progress } = detectHeadTurn(lms);
            setTurnProgress(Math.round(progress * 100));
            if (turned) {
              turnRef.current = true;
              setHeadTurnDetected(true);
              addLog("success", "Head turn confirmed ✓");
              captureAndSubmit(true, true);
            }
          }
        });

        // Use requestVideoFrameCallback / rAF loop instead of MediaPipe Camera
        // utility to avoid a second competing getUserMedia call.
        const sendFrame = async () => {
          if (!active) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            await fm.send({ image: videoRef.current });
          }
          animFrameRef.current = requestAnimationFrame(() => { sendFrame(); });
        };
        animFrameRef.current = requestAnimationFrame(() => { sendFrame(); });

        addLog("info", "MediaPipe initialized — warming up...");
        setPhase("blink");
        phaseRef.current = "blink";
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Camera error";
        addLog("error", msg);
        setError(msg);
        setPhase("error");
      }
    }

    init();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phaseLabel = {
    init:       "Initializing camera...",
    blink:      calibrating ? "Hold still — warming up..." : "Blink naturally when ready",
    turn:       noseBaselineRef.current === null ? "Hold still — calibrating..." : "Turn your head left or right",
    capturing:  "Capturing frame...",
    submitting: "Submitting to API...",
    done:       "Complete",
    error:      "Error occurred",
  }[phase];

  const progressPct = { init: 0, blink: 20, turn: 50, capturing: 70, submitting: 85, done: 100, error: 0 }[phase];

  return (
    <div className="animate-fadeup" style={{ maxWidth: "620px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "6px" }}>
          Liveness Check
        </h2>
        <p style={{ color: "var(--vault-text-dim)", fontSize: "12px" }}>
          Face detection using MediaPipe FaceMesh — step 1 of 2
        </p>
      </div>

      <div style={{ position: "relative", marginBottom: "24px", borderRadius: "2px", overflow: "hidden", border: "1px solid var(--vault-border)", background: "#000", aspectRatio: "4/3", maxWidth: "480px" }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: phase === "done" || phase === "submitting" ? "none" : "block" }} />
        <canvas ref={overlayCanvasRef} width={640} height={480}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "scaleX(-1)", pointerEvents: "none", display: phase === "done" || phase === "submitting" ? "none" : "block" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {capturedFrame && (phase === "done" || phase === "submitting") && (
          <img src={capturedFrame} alt="captured" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        )}

        <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "2px", backdropFilter: "blur(4px)" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: faceDetected ? "var(--vault-green)" : "var(--vault-red)", boxShadow: faceDetected ? "0 0 8px var(--vault-green)" : "none" }} />
          <span style={{ fontSize: "10px", color: "var(--vault-white)", letterSpacing: "0.05em" }}>
            {faceDetected ? `${landmarkCount} landmarks` : "NO FACE"}
          </span>
        </div>

        {phase === "blink" && calibrating && (
          <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,171,0,0.15)", border: "1px solid var(--vault-amber)", padding: "3px 8px", borderRadius: "2px" }}>
            <span style={{ fontSize: "9px", color: "var(--vault-amber)", letterSpacing: "0.1em" }}>WARMING UP</span>
          </div>
        )}

        {phase === "turn" && noseBaselineRef.current !== null && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "rgba(0,0,0,0.4)" }}>
            <div style={{ height: "100%", width: `${turnProgress}%`, background: "var(--vault-green)", transition: "width 0.05s ease", boxShadow: "0 0 6px var(--vault-green)" }} />
          </div>
        )}

        {(phase === "submitting" || phase === "capturing") && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
            <div style={{ textAlign: "center" }}>
              <div className="animate-spin-slow" style={{ width: "32px", height: "32px", border: "2px solid var(--vault-border)", borderTop: "2px solid var(--vault-green)", borderRadius: "50%", margin: "0 auto 12px" }} />
              <span style={{ fontSize: "11px", color: "var(--vault-green)", letterSpacing: "0.1em" }}>{phaseLabel?.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--vault-text-dim)", letterSpacing: "0.08em" }}>{phaseLabel?.toUpperCase()}</span>
          <span style={{ fontSize: "11px", color: "var(--vault-green)" }}>{progressPct}%</span>
        </div>
        <div style={{ height: "2px", background: "var(--vault-border)", borderRadius: "1px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, var(--vault-green), #69ffb4)", transition: "width 0.6s ease", borderRadius: "1px" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {([
          { done: blinkDetected,    label: "Blink detected", icon: "◎", prog: undefined },
          { done: headTurnDetected, label: "Head turn",      icon: "↔", prog: phase === "turn" ? turnProgress : undefined },
        ] as const).map(item => (
          <div key={item.label} style={{ flex: 1, padding: "12px 16px", border: "1px solid", borderColor: item.done ? "var(--vault-green)" : "var(--vault-border)", borderRadius: "2px", background: item.done ? "rgba(0,230,118,0.06)" : "transparent", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s" }}>
            <span style={{ fontSize: "18px", color: item.done ? "var(--vault-green)" : "var(--vault-muted)" }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "11px", color: item.done ? "var(--vault-green)" : "var(--vault-text-dim)", letterSpacing: "0.05em", display: "block" }}>{item.label}</span>
              {item.prog !== undefined && !item.done && (
                <div style={{ height: "2px", background: "var(--vault-border)", marginTop: "5px", borderRadius: "1px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${item.prog}%`, background: "var(--vault-green)", transition: "width 0.05s ease" }} />
                </div>
              )}
            </div>
            {item.done && <span style={{ fontSize: "11px", color: "var(--vault-green)" }}>✓</span>}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", border: "1px solid var(--vault-red)", borderRadius: "2px", background: "rgba(255,61,87,0.06)", fontSize: "12px", color: "var(--vault-red)", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {apiResponse && phase === "error" && (
        <div style={{ padding: "12px 16px", border: "1px solid var(--vault-border)", borderRadius: "2px", background: "var(--vault-surface)", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", marginBottom: "8px", letterSpacing: "0.1em" }}>API RESPONSE</div>
          <pre style={{ fontSize: "11px", color: "var(--vault-white)", margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(apiResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}