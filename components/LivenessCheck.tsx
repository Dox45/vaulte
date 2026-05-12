// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import type { LogEntry } from "@/app/page";

// interface Props {
//   sessionId: string;
//   apiBase: string;
//   onComplete: (result: Record<string, unknown>) => void;
//   addLog: (level: LogEntry["level"], msg: string) => void;
// }

// type Phase = "init" | "blink" | "turn" | "capturing" | "submitting" | "done" | "error";

// // Blink: EAR must drop by this absolute amount from rolling average (~9% of 0.019 baseline)
// const BLINK_DROP_DELTA   = 0.003;
// // Blink: EAR must recover this much from the dip bottom to confirm blink complete
// const BLINK_REOPEN_DELTA = 0.002;
// // Rolling window size for stable open-eye average
// const EAR_WINDOW = 8;

// // Head turn: nose must move ≥10% of frame width from personal resting baseline
// const HEAD_TURN_DELTA     = 0.10;
// const BASELINE_FRAMES     = 20;
// const TURN_SUSTAIN_FRAMES = 3;

// export default function LivenessCheck({ sessionId, apiBase, onComplete, addLog }: Props) {
//   const videoRef         = useRef<HTMLVideoElement>(null);
//   const canvasRef        = useRef<HTMLCanvasElement>(null);
//   const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
//   const streamRef        = useRef<MediaStream | null>(null);
//   const animFrameRef     = useRef<number>(0);

//   const [phase, setPhase]                     = useState<Phase>("init");
//   const [blinkDetected, setBlinkDetected]     = useState(false);
//   const [headTurnDetected, setHeadTurnDetected] = useState(false);
//   const [capturedFrame, setCapturedFrame]     = useState<string | null>(null);
//   const [error, setError]                     = useState<string | null>(null);
//   const [faceDetected, setFaceDetected]       = useState(false);
//   const [landmarkCount, setLandmarkCount]     = useState(0);
//   const [apiResponse, setApiResponse]         = useState<Record<string, unknown> | null>(null);
//   const [turnProgress, setTurnProgress]       = useState(0);
//   const [calibrating, setCalibrating]         = useState(true);

//   const blinkRef = useRef(false);
//   const turnRef  = useRef(false);
//   const phaseRef = useRef<Phase>("init");

//   // ── Blink refs ─────────────────────────────────────────────────────────────
//   type BlinkState = "open" | "dipping";
//   const blinkStateRef = useRef<BlinkState>("open");
//   const earWindowRef  = useRef<number[]>([]);   // rolling EAR history
//   const dipMinEAR     = useRef<number>(9999);   // lowest point during dip

//   // ── Head turn refs ─────────────────────────────────────────────────────────
//   const noseBaselineRef        = useRef<number | null>(null);
//   const baselineFramesRef      = useRef<number>(0);
//   const noseBaselineSamplesRef = useRef<number[]>([]);
//   const turnSustainRef         = useRef<number>(0);

//   // ── Blink detection ────────────────────────────────────────────────────────
//   const detectBlink = useCallback((landmarks: { x: number; y: number; z: number }[]): boolean => {
//     const leftEAR  = Math.abs(landmarks[159].y - landmarks[145].y);
//     const rightEAR = Math.abs(landmarks[386].y - landmarks[374].y);
//     const ear      = (leftEAR + rightEAR) / 2;

//     // Maintain rolling window
//     earWindowRef.current.push(ear);
//     if (earWindowRef.current.length > EAR_WINDOW) earWindowRef.current.shift();

//     // Need full window before detecting
//     if (earWindowRef.current.length < EAR_WINDOW) return false;

//     // Rolling average of all-but-last-frame = stable open-eye reference
//     const prev    = earWindowRef.current.slice(0, -1);
//     const avg     = prev.reduce((a, b) => a + b, 0) / prev.length;
//     const drop    = avg - ear;
//     const state   = blinkStateRef.current;

//     console.log(`EAR: ${ear.toFixed(4)} | avg: ${avg.toFixed(4)} | drop: ${drop.toFixed(4)} | state: ${state}`);

//     // Mark calibration done after first full window
//     if (calibrating) setCalibrating(false);

//     if (state === "open") {
//       if (drop > BLINK_DROP_DELTA) {
//         blinkStateRef.current = "dipping";
//         dipMinEAR.current     = ear;
//       }
//       return false;
//     }

//     if (state === "dipping") {
//       dipMinEAR.current = Math.min(dipMinEAR.current, ear);

//       if (ear > dipMinEAR.current + BLINK_REOPEN_DELTA) {
//         // Recovered from dip — confirmed blink
//         blinkStateRef.current = "open";
//         dipMinEAR.current     = 9999;
//         return true;
//       }

//       // Safety: if EAR somehow shoots back above avg without triggering reopen check
//       if (ear >= avg * 0.98) {
//         blinkStateRef.current = "open";
//         dipMinEAR.current     = 9999;
//       }
//       return false;
//     }

//     return false;
//   }, [calibrating]);

//   // ── Head turn detection ────────────────────────────────────────────────────
//   const detectHeadTurn = useCallback((landmarks: { x: number; y: number; z: number }[]): { turned: boolean; progress: number } => {
//     const noseX = landmarks[1].x;

//     if (noseBaselineRef.current === null) {
//       noseBaselineSamplesRef.current.push(noseX);
//       baselineFramesRef.current += 1;
//       if (baselineFramesRef.current >= BASELINE_FRAMES) {
//         const sorted = [...noseBaselineSamplesRef.current].sort((a, b) => a - b);
//         noseBaselineRef.current = sorted[Math.floor(sorted.length / 2)];
//       }
//       return { turned: false, progress: 0 };
//     }

//     const delta    = Math.abs(noseX - noseBaselineRef.current);
//     const progress = Math.min(delta / HEAD_TURN_DELTA, 1);

//     turnSustainRef.current = delta >= HEAD_TURN_DELTA ? turnSustainRef.current + 1 : 0;

//     return { turned: turnSustainRef.current >= TURN_SUSTAIN_FRAMES, progress };
//   }, []);

//   // ── Canvas overlay ─────────────────────────────────────────────────────────
//   const drawOverlay = useCallback((landmarks: { x: number; y: number; z: number }[], hasFace: boolean) => {
//     const canvas = overlayCanvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     const faceOval = [10,338,297,332,284,251,389,356,454,323,361,288,
//       397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,
//       234,127,162,21,54,103,67,109];

//     ctx.beginPath();
//     faceOval.forEach((idx, i) => {
//       const lm = landmarks[idx];
//       if (i === 0) ctx.moveTo(lm.x * canvas.width, lm.y * canvas.height);
//       else         ctx.lineTo(lm.x * canvas.width, lm.y * canvas.height);
//     });
//     ctx.closePath();
//     ctx.strokeStyle = hasFace ? "#00e676" : "rgba(0,230,118,0.25)";
//     ctx.lineWidth   = 1.5;
//     ctx.stroke();

//     [[159, 145], [386, 374]].forEach(([u, l]) => {
//       [u, l].forEach(idx => {
//         ctx.beginPath();
//         ctx.arc(landmarks[idx].x * canvas.width, landmarks[idx].y * canvas.height, 3, 0, Math.PI * 2);
//         ctx.fillStyle = "#00e676";
//         ctx.fill();
//       });
//     });

//     const nose = landmarks[1];
//     ctx.beginPath();
//     ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 4, 0, Math.PI * 2);
//     ctx.fillStyle = "#00e676";
//     ctx.fill();

//     if (noseBaselineRef.current !== null && phaseRef.current === "turn") {
//       const baseX = noseBaselineRef.current * canvas.width;
//       ctx.beginPath();
//       ctx.moveTo(baseX, 0);
//       ctx.lineTo(baseX, canvas.height);
//       ctx.strokeStyle = "rgba(0,230,118,0.2)";
//       ctx.lineWidth   = 1;
//       ctx.setLineDash([4, 4]);
//       ctx.stroke();
//       ctx.setLineDash([]);
//     }
//   }, []);

//   // ── Capture + submit ───────────────────────────────────────────────────────
//   const captureAndSubmit = useCallback(async (blink: boolean, turn: boolean) => {
//     setPhase("capturing");
//     phaseRef.current = "capturing";

//     const video  = videoRef.current;
//     const canvas = canvasRef.current;
//     if (!video || !canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;
//     canvas.width  = video.videoWidth;
//     canvas.height = video.videoHeight;
//     ctx.drawImage(video, 0, 0);
//     const frameB64 = canvas.toDataURL("image/jpeg", 0.85);
//     setCapturedFrame(frameB64);
//     addLog("info", `Frame captured — ${canvas.width}×${canvas.height}px`);

//     setPhase("submitting");
//     phaseRef.current = "submitting";

//     try {
//       addLog("info", `POST ${apiBase}/vendor/liveness`);
//       const res = await fetch(`${apiBase}/vendor/liveness`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           session_id:         sessionId,
//           frame_base64:       frameB64,
//           blink_detected:     blink,
//           head_turn_detected: turn,
//         }),
//       });
//       const data = await res.json();
//       setApiResponse(data);
//       if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
//       addLog("success", `Liveness API → ${res.status} OK`);
//       setPhase("done");
//       phaseRef.current = "done";
//       onComplete(data);
//     } catch (err: unknown) {
//       const msg = err instanceof Error ? err.message : "Unknown error";
//       addLog("error", `Liveness API failed: ${msg}`);
//       setError(msg);
//       setPhase("error");
//       phaseRef.current = "error";
//     }
//   }, [sessionId, apiBase, addLog, onComplete]);

//   // ── MediaPipe init ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     let active = true;

//     async function init() {
//       try {
//         const loadScript = (src: string) =>
//           new Promise<void>((resolve, reject) => {
//             const s = document.createElement("script");
//             s.src = src;
//             s.crossOrigin = "anonymous";
//             s.onload = () => resolve();
//             s.onerror = () => reject(new Error(`Failed to load ${src}`));
//             document.head.appendChild(s);
//           });

//         await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
//         await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
//         if (!active) return;

//         // Acquire camera stream independently so we can capture frames.
//         // Try with preferred constraints first, then fall back to bare video.
//         let stream: MediaStream;
//         // Check if mediaDevices API exists (fails on non-secure contexts)
//         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//           throw new Error("Camera API unavailable — ensure the page is served over HTTPS or localhost");
//         }

//         // Enumerate devices first so we can give a clear error message
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const videoDevices = devices.filter(d => d.kind === "videoinput");
//         addLog("info", `Found ${videoDevices.length} camera device(s): ${videoDevices.map(d => d.label || "(unlabeled)").join(", ") || "none"}`);

//         if (videoDevices.length === 0) {
//           throw new Error("No camera found. Please connect a webcam and reload the page.");
//         }

//         try {
//           stream = await navigator.mediaDevices.getUserMedia({
//             video: { width: 640, height: 480, facingMode: { ideal: "user" } },
//           });
//         } catch {
//           addLog("warn", "Preferred camera constraints failed — retrying with bare video");
//           stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         }

//         if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
//         streamRef.current = stream;
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           await videoRef.current.play().catch(() => {});
//         }
//         addLog("info", "Camera stream acquired");

//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const win = window as any;
//         const fm  = new win.FaceMesh({
//           locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//         });
//         fm.setOptions({
//           maxNumFaces: 1,
//           refineLandmarks: true,
//           minDetectionConfidence: 0.6,
//           minTrackingConfidence: 0.6,
//         });

//         fm.onResults((results: { multiFaceLandmarks?: { x: number; y: number; z: number }[][] }) => {
//           if (!active) return;

//           const hasFace = !!(results.multiFaceLandmarks?.length);
//           setFaceDetected(hasFace);
//           if (!hasFace) return;

//           const lms = results.multiFaceLandmarks![0];
//           setLandmarkCount(lms.length);
//           drawOverlay(lms, hasFace);

//           const currentPhase = phaseRef.current;
//           if (currentPhase !== "blink" && currentPhase !== "turn") return;

//           if (currentPhase === "blink" && !blinkRef.current) {
//             const didBlink = detectBlink(lms);
//             if (didBlink) {
//               blinkRef.current = true;
//               setBlinkDetected(true);
//               addLog("success", "Blink confirmed ✓");

//               noseBaselineRef.current       = null;
//               baselineFramesRef.current     = 0;
//               noseBaselineSamplesRef.current = [];
//               turnSustainRef.current        = 0;
//               setTurnProgress(0);

//               phaseRef.current = "turn";
//               setPhase("turn");
//             }
//             return;
//           }

//           if (currentPhase === "turn" && !turnRef.current) {
//             const { turned, progress } = detectHeadTurn(lms);
//             setTurnProgress(Math.round(progress * 100));
//             if (turned) {
//               turnRef.current = true;
//               setHeadTurnDetected(true);
//               addLog("success", "Head turn confirmed ✓");
//               captureAndSubmit(true, true);
//             }
//           }
//         });

//         // Use requestVideoFrameCallback / rAF loop instead of MediaPipe Camera
//         // utility to avoid a second competing getUserMedia call.
//         const sendFrame = async () => {
//           if (!active) return;
//           if (videoRef.current && videoRef.current.readyState >= 2) {
//             await fm.send({ image: videoRef.current });
//           }
//           animFrameRef.current = requestAnimationFrame(() => { sendFrame(); });
//         };
//         animFrameRef.current = requestAnimationFrame(() => { sendFrame(); });

//         addLog("info", "MediaPipe initialized — warming up...");
//         setPhase("blink");
//         phaseRef.current = "blink";
//       } catch (err: unknown) {
//         const msg = err instanceof Error ? err.message : "Camera error";
//         addLog("error", msg);
//         setError(msg);
//         setPhase("error");
//       }
//     }

//     init();
//     return () => {
//       active = false;
//       streamRef.current?.getTracks().forEach(t => t.stop());
//       cancelAnimationFrame(animFrameRef.current);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const phaseLabel = {
//     init:       "Initializing camera...",
//     blink:      calibrating ? "Hold still — warming up..." : "Blink naturally when ready",
//     turn:       noseBaselineRef.current === null ? "Hold still — calibrating..." : "Turn your head left or right",
//     capturing:  "Capturing frame...",
//     submitting: "Submitting to API...",
//     done:       "Complete",
//     error:      "Error occurred",
//   }[phase];

//   const progressPct = { init: 0, blink: 20, turn: 50, capturing: 70, submitting: 85, done: 100, error: 0 }[phase];

//   return (
//     <div className="animate-fadeup" style={{ maxWidth: "100%", width: "100%" }}>
//       <div style={{ marginBottom: "24px" }}>
//         <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "6px" }}>
//           Liveness Check
//         </h2>
//         <p style={{ color: "var(--vault-text-dim)", fontSize: "12px" }}>
//           Face detection using MediaPipe FaceMesh — step 1 of 2
//         </p>
//       </div>

//       <div style={{ position: "relative", marginBottom: "24px", borderRadius: "2px", overflow: "hidden", border: "1px solid var(--vault-border)", background: "#000", aspectRatio: "4/3", maxWidth: "480px" }}>
//         <video ref={videoRef} autoPlay playsInline muted
//           style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: phase === "done" || phase === "submitting" ? "none" : "block" }} />
//         <canvas ref={overlayCanvasRef} width={640} height={480}
//           style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "scaleX(-1)", pointerEvents: "none", display: phase === "done" || phase === "submitting" ? "none" : "block" }} />
//         <canvas ref={canvasRef} style={{ display: "none" }} />

//         {capturedFrame && (phase === "done" || phase === "submitting") && (
//           <img src={capturedFrame} alt="captured" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
//         )}

//         <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "2px", backdropFilter: "blur(4px)" }}>
//           <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: faceDetected ? "var(--vault-green)" : "var(--vault-red)", boxShadow: faceDetected ? "0 0 8px var(--vault-green)" : "none" }} />
//           <span style={{ fontSize: "10px", color: "var(--vault-white)", letterSpacing: "0.05em" }}>
//             {faceDetected ? `${landmarkCount} landmarks` : "NO FACE"}
//           </span>
//         </div>

//         {phase === "blink" && calibrating && (
//           <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,171,0,0.15)", border: "1px solid var(--vault-amber)", padding: "3px 8px", borderRadius: "2px" }}>
//             <span style={{ fontSize: "9px", color: "var(--vault-amber)", letterSpacing: "0.1em" }}>WARMING UP</span>
//           </div>
//         )}

//         {phase === "turn" && noseBaselineRef.current !== null && (
//           <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "rgba(0,0,0,0.4)" }}>
//             <div style={{ height: "100%", width: `${turnProgress}%`, background: "var(--vault-green)", transition: "width 0.05s ease", boxShadow: "0 0 6px var(--vault-green)" }} />
//           </div>
//         )}

//         {(phase === "submitting" || phase === "capturing") && (
//           <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
//             <div style={{ textAlign: "center" }}>
//               <div className="animate-spin-slow" style={{ width: "32px", height: "32px", border: "2px solid var(--vault-border)", borderTop: "2px solid var(--vault-green)", borderRadius: "50%", margin: "0 auto 12px" }} />
//               <span style={{ fontSize: "11px", color: "var(--vault-green)", letterSpacing: "0.1em" }}>{phaseLabel?.toUpperCase()}</span>
//             </div>
//           </div>
//         )}
//       </div>

//       <div style={{ marginBottom: "24px" }}>
//         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
//           <span style={{ fontSize: "11px", color: "var(--vault-text-dim)", letterSpacing: "0.08em" }}>{phaseLabel?.toUpperCase()}</span>
//           <span style={{ fontSize: "11px", color: "var(--vault-green)" }}>{progressPct}%</span>
//         </div>
//         <div style={{ height: "2px", background: "var(--vault-border)", borderRadius: "1px", overflow: "hidden" }}>
//           <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, var(--vault-green), #69ffb4)", transition: "width 0.6s ease", borderRadius: "1px" }} />
//         </div>
//       </div>

//       <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
//         {([
//           { done: blinkDetected,    label: "Blink detected", icon: "◎", prog: undefined },
//           { done: headTurnDetected, label: "Head turn",      icon: "↔", prog: phase === "turn" ? turnProgress : undefined },
//         ] as const).map(item => (
//           <div key={item.label} style={{ flex: 1, padding: "12px 16px", border: "1px solid", borderColor: item.done ? "var(--vault-green)" : "var(--vault-border)", borderRadius: "2px", background: item.done ? "rgba(0,230,118,0.06)" : "transparent", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s" }}>
//             <span style={{ fontSize: "18px", color: item.done ? "var(--vault-green)" : "var(--vault-muted)" }}>{item.icon}</span>
//             <div style={{ flex: 1 }}>
//               <span style={{ fontSize: "11px", color: item.done ? "var(--vault-green)" : "var(--vault-text-dim)", letterSpacing: "0.05em", display: "block" }}>{item.label}</span>
//               {item.prog !== undefined && !item.done && (
//                 <div style={{ height: "2px", background: "var(--vault-border)", marginTop: "5px", borderRadius: "1px", overflow: "hidden" }}>
//                   <div style={{ height: "100%", width: `${item.prog}%`, background: "var(--vault-green)", transition: "width 0.05s ease" }} />
//                 </div>
//               )}
//             </div>
//             {item.done && <span style={{ fontSize: "11px", color: "var(--vault-green)" }}>✓</span>}
//           </div>
//         ))}
//       </div>

//       {error && (
//         <div style={{ padding: "12px 16px", border: "1px solid var(--vault-red)", borderRadius: "2px", background: "rgba(255,61,87,0.06)", fontSize: "12px", color: "var(--vault-red)", marginBottom: "16px" }}>
//           {error}
//         </div>
//       )}

//       {apiResponse && phase === "error" && (
//         <div style={{ padding: "12px 16px", border: "1px solid var(--vault-border)", borderRadius: "2px", background: "var(--vault-surface)", marginBottom: "16px" }}>
//           <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", marginBottom: "8px", letterSpacing: "0.1em" }}>API RESPONSE</div>
//           <pre style={{ fontSize: "11px", color: "var(--vault-white)", margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(apiResponse, null, 2)}</pre>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";
/**
 * LivenessCheck.tsx — hardened liveness verification
 * ────────────────────────────────────────────────────
 * Security improvements over v1:
 *
 * 1. Server-driven challenge sequence  — client fetches sequence from server;
 *    never decides its own challenge order. Attacker can't pre-record.
 *
 * 2. Nonce binding                     — every submission includes the server
 *    nonce; replayed submissions are rejected server-side.
 *
 * 3. Frame timestamp collection        — every processed frame's epoch-ms is
 *    recorded and sent; server validates inter-frame delta distribution to
 *    detect looped / sped-up video.
 *
 * 4. Pixel entropy measurement         — brightness + noise variance tracked
 *    across frames; pre-recorded videos have unnaturally stable values.
 *
 * 5. Passive head/eye micro-movement   — head stability variance and EAR
 *    micro-variance collected; static photos and smooth deepfakes fail these.
 *
 * 6. Challenge latency tracking        — time from instruction shown to action
 *    taken; bots respond in <100ms, humans take 300-1500ms.
 *
 * 7. Dynamic instruction UI            — shows the current challenge step so
 *    the user knows what to do, while preventing pre-recording of a single
 *    known sequence.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { LogEntry } from "@/app/page";

// ── Types ──────────────────────────────────────────────────────────────────────
export type ChallengeStep = "blink" | "turn_left" | "turn_right" | "nod" | "smile";

interface Props {
  sessionId: string;
  apiBase: string;
  onComplete: (result: Record<string, unknown>) => void;
  addLog: (level: LogEntry["level"], msg: string) => void;
}

type Phase =
  | "fetching_challenge"  // GET /liveness/challenge
  | "calibrating"         // MediaPipe warming up
  | "challenge"           // executing current step
  | "capturing"
  | "submitting"
  | "done"
  | "error";

// ── Detection constants ────────────────────────────────────────────────────────
const BLINK_DROP_DELTA = 0.003;
const BLINK_REOPEN_DELTA = 0.002;
const EAR_WINDOW = 8;

const HEAD_TURN_DELTA = 0.10;
const NOD_DELTA = 0.08;   // vertical nose movement
const BASELINE_FRAMES = 20;
const TURN_SUSTAIN_FRAMES = 3;

const ENTROPY_SAMPLE_INTERVAL = 5;  // sample every N processed frames

// ── Challenge step metadata ────────────────────────────────────────────────────
const STEP_META: Record<ChallengeStep, { label: string; icon: string; hint: string }> = {
  blink: { label: "Blink", icon: "◎", hint: "Blink both eyes naturally" },
  turn_left: { label: "Turn Left", icon: "←", hint: "Turn your head to the left" },
  turn_right: { label: "Turn Right", icon: "→", hint: "Turn your head to the right" },
  nod: { label: "Nod", icon: "↕", hint: "Nod your head up and down" },
  smile: { label: "Smile", icon: "◡", hint: "Give a natural smile" },
};

// ── Entropy helpers ────────────────────────────────────────────────────────────
function computeVariance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
}

function sampleFrameEntropy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { brightness: number; noise: number } {
  // Sample a 32×32 patch from the centre for speed
  const pw = 32, ph = 32;
  const px = Math.floor((width - pw) / 2);
  const py = Math.floor((height - ph) / 2);
  const imageData = ctx.getImageData(px, py, pw, ph);
  const pixels = imageData.data;

  let brightness = 0;
  const samples: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const lum = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
    brightness += lum;
    samples.push(lum);
  }
  brightness /= samples.length;

  const mean = brightness;
  const noise = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);

  return { brightness, noise };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function LivenessCheck({ sessionId, apiBase, onComplete, addLog }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const entropyCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  // ── Server challenge state ─────────────────────────────────────────────────
  const [challengeSequence, setChallengeSequence] = useState<ChallengeStep[]>([]);
  const [nonce, setNonce] = useState<string>("");
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<ChallengeStep[]>([]);
  const completedStepsRef = useRef<ChallengeStep[]>([]);

  // ── Detection state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("fetching_challenge");
  const [faceDetected, setFaceDetected] = useState(false);
  const [turnProgress, setTurnProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  const phaseRef = useRef<Phase>("fetching_challenge");
  const stepIdxRef = useRef<number>(0);
  const sequenceRef = useRef<ChallengeStep[]>([]);
  const nonceRef = useRef<string>("");

  // ── Blink detection refs ───────────────────────────────────────────────────
  type BlinkState = "open" | "dipping";
  const blinkStateRef = useRef<BlinkState>("open");
  const earWindowRef = useRef<number[]>([]);
  const dipMinEAR = useRef<number>(9999);

  // ── Head/nod turn refs ─────────────────────────────────────────────────────
  const noseBaselineXRef = useRef<number | null>(null);
  const noseBaselineYRef = useRef<number | null>(null);
  const baselineFramesRef = useRef<number>(0);
  const noseBaselineSamplesRef = useRef<{ x: number; y: number }[]>([]);
  const turnSustainRef = useRef<number>(0);

  // ── Security: frame timestamps ─────────────────────────────────────────────
  const frameTimestampsRef = useRef<number[]>([]);
  const frameCountRef = useRef<number>(0);

  // ── Security: entropy collection ──────────────────────────────────────────
  const brightnessHistoryRef = useRef<number[]>([]);
  const noiseHistoryRef = useRef<number[]>([]);
  const noseXHistoryRef = useRef<number[]>([]);
  const earHistoryRef = useRef<number[]>([]);

  // ── Security: challenge latency ────────────────────────────────────────────
  const stepStartTimeRef = useRef<number>(Date.now());
  const blinkLatencyMsRef = useRef<number>(0);
  const turnLatencyMsRef = useRef<number>(0);

  // ── Calibration ────────────────────────────────────────────────────────────
  const [calibrating, setCalibrating] = useState(true);
  const calibratingRef = useRef(true);

  // ── Step 0: fetch server challenge ─────────────────────────────────────────
  useEffect(() => {
    async function fetchChallenge() {
      try {
        addLog("info", `GET ${apiBase}/vendor/liveness/challenge`);
        const res = await fetch(`${apiBase}/vendor/liveness/challenge?session_id=${sessionId}`, {
          headers: { "ngrok-skip-browser-warning": "1" },
          mode: "cors"
        });
        if (!res.ok) throw new Error(`Challenge fetch failed: HTTP ${res.status}`);
        const data = await res.json() as { sequence: ChallengeStep[]; nonce: string };

        setChallengeSequence(data.sequence);
        setNonce(data.nonce);
        nonceRef.current = data.nonce;
        sequenceRef.current = data.sequence;

        addLog("info", `Challenge received | seq=[${data.sequence.join(",")}]`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to fetch challenge";
        addLog("error", msg);
        setError(msg);
        setPhase("error");
        phaseRef.current = "error";
      }
    }
    fetchChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Blink detection ────────────────────────────────────────────────────────
  const detectBlink = useCallback((lms: { x: number; y: number; z: number }[]): boolean => {
    const leftEAR = Math.abs(lms[159].y - lms[145].y);
    const rightEAR = Math.abs(lms[386].y - lms[374].y);
    const ear = (leftEAR + rightEAR) / 2;

    earHistoryRef.current.push(ear);
    if (earHistoryRef.current.length > 60) earHistoryRef.current.shift();

    earWindowRef.current.push(ear);
    if (earWindowRef.current.length > EAR_WINDOW) earWindowRef.current.shift();
    if (earWindowRef.current.length < EAR_WINDOW) return false;

    const prev = earWindowRef.current.slice(0, -1);
    const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
    const drop = avg - ear;
    const state = blinkStateRef.current;

    if (state === "open") {
      if (drop > BLINK_DROP_DELTA) {
        blinkStateRef.current = "dipping";
        dipMinEAR.current = ear;
      }
      return false;
    }

    if (state === "dipping") {
      dipMinEAR.current = Math.min(dipMinEAR.current, ear);
      if (ear > dipMinEAR.current + BLINK_REOPEN_DELTA) {
        blinkStateRef.current = "open";
        dipMinEAR.current = 9999;
        return true;
      }
      if (ear >= avg * 0.98) {
        blinkStateRef.current = "open";
        dipMinEAR.current = 9999;
      }
    }
    return false;
  }, []);

  // ── Head turn / nod detection ──────────────────────────────────────────────
  const detectHeadMotion = useCallback((
    lms: { x: number; y: number; z: number }[],
    step: ChallengeStep
  ): { detected: boolean; progress: number } => {
    const noseX = lms[1].x;
    const noseY = lms[1].y;

    noseXHistoryRef.current.push(noseX);
    if (noseXHistoryRef.current.length > 60) noseXHistoryRef.current.shift();

    // Build baseline
    if (noseBaselineXRef.current === null) {
      noseBaselineSamplesRef.current.push({ x: noseX, y: noseY });
      baselineFramesRef.current++;
      if (baselineFramesRef.current >= BASELINE_FRAMES) {
        const sortedX = [...noseBaselineSamplesRef.current].map(s => s.x).sort((a, b) => a - b);
        const sortedY = [...noseBaselineSamplesRef.current].map(s => s.y).sort((a, b) => a - b);
        noseBaselineXRef.current = sortedX[Math.floor(sortedX.length / 2)];
        noseBaselineYRef.current = sortedY[Math.floor(sortedY.length / 2)];
      }
      return { detected: false, progress: 0 };
    }

    const baseX = noseBaselineXRef.current!;
    const baseY = noseBaselineYRef.current!;
    const deltaX = Math.abs(noseX - baseX);
    const deltaY = Math.abs(noseY - baseY);

    let progress = 0;

    if (step === "turn_left" || step === "turn_right") {
      const directionOk =
        step === "turn_left" ? noseX < baseX - HEAD_TURN_DELTA * 0.5 :
          step === "turn_right" ? noseX > baseX + HEAD_TURN_DELTA * 0.5 : true;
      progress = Math.min(deltaX / HEAD_TURN_DELTA, 1);
      turnSustainRef.current = (deltaX >= HEAD_TURN_DELTA && directionOk)
        ? turnSustainRef.current + 1 : 0;
    } else if (step === "nod") {
      progress = Math.min(deltaY / NOD_DELTA, 1);
      turnSustainRef.current = deltaY >= NOD_DELTA ? turnSustainRef.current + 1 : 0;
    }

    return {
      detected: turnSustainRef.current >= TURN_SUSTAIN_FRAMES,
      progress,
    };
  }, []);

  // ── Smile detection (landmark-based mouth width ratio) ────────────────────
  const detectSmile = useCallback((lms: { x: number; y: number; z: number }[]): boolean => {
    // Mouth corners: 61 (left), 291 (right); lip top: 13; lip bottom: 14
    const mouthWidth = Math.abs(lms[291].x - lms[61].x);
    const mouthHeight = Math.abs(lms[14].y - lms[13].y);
    // Smiling increases mouth width relative to height
    const ratio = mouthWidth / (mouthHeight + 0.001);
    return ratio > 4.5;   // empirically tuned threshold
  }, []);

  // ── Entropy sampling ───────────────────────────────────────────────────────
  const sampleEntropy = useCallback(() => {
    const canvas = entropyCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const { brightness, noise } = sampleFrameEntropy(ctx, canvas.width, canvas.height);
    brightnessHistoryRef.current.push(brightness);
    noiseHistoryRef.current.push(noise);
    if (brightnessHistoryRef.current.length > 100) {
      brightnessHistoryRef.current.shift();
      noiseHistoryRef.current.shift();
    }
  }, []);

  // ── Canvas overlay ─────────────────────────────────────────────────────────
  const drawOverlay = useCallback((
    lms: { x: number; y: number; z: number }[],
    hasFace: boolean,
    step: ChallengeStep | null
  ) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
      234, 127, 162, 21, 54, 103, 67, 109];

    ctx.beginPath();
    faceOval.forEach((idx, i) => {
      const lm = lms[idx];
      if (i === 0) ctx.moveTo(lm.x * canvas.width, lm.y * canvas.height);
      else ctx.lineTo(lm.x * canvas.width, lm.y * canvas.height);
    });
    ctx.closePath();
    ctx.strokeStyle = hasFace ? "#00e676" : "rgba(0,230,118,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eye landmarks
    [[159, 145], [386, 374]].forEach(([u, l]) => {
      [u, l].forEach(idx => {
        ctx.beginPath();
        ctx.arc(lms[idx].x * canvas.width, lms[idx].y * canvas.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#00e676";
        ctx.fill();
      });
    });

    // Nose tip
    const nose = lms[1];
    ctx.beginPath();
    ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00e676";
    ctx.fill();

    // Baseline crosshair for head motion steps
    if (noseBaselineXRef.current !== null && step && step !== "blink" && step !== "smile") {
      const baseX = noseBaselineXRef.current * canvas.width;
      const baseY = (noseBaselineYRef.current ?? 0.5) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(baseX, 0);
      ctx.lineTo(baseX, canvas.height);
      ctx.strokeStyle = "rgba(0,230,118,0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(baseX, baseY, 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,230,118,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, []);

  // ── Advance to next challenge step ─────────────────────────────────────────
  const advanceStep = useCallback((completedStep: ChallengeStep) => {
    const newCompleted = [...completedStepsRef.current, completedStep];
    completedStepsRef.current = newCompleted;
    setCompletedSteps(newCompleted);

    const nextIdx = stepIdxRef.current + 1;
    const seq = sequenceRef.current;

    if (nextIdx >= seq.length) {
      // All steps done — capture and submit
      addLog("success", `All ${seq.length} challenges complete ✓`);
      captureAndSubmit(newCompleted);
      return;
    }

    // Reset motion baseline for next step
    noseBaselineXRef.current = null;
    noseBaselineYRef.current = null;
    baselineFramesRef.current = 0;
    noseBaselineSamplesRef.current = [];
    turnSustainRef.current = 0;
    blinkStateRef.current = "open";
    dipMinEAR.current = 9999;
    setTurnProgress(0);
    stepStartTimeRef.current = Date.now();

    stepIdxRef.current = nextIdx;
    setCurrentStepIdx(nextIdx);
    addLog("info", `Challenge step ${nextIdx + 1}/${seq.length}: ${seq[nextIdx]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Capture + submit ───────────────────────────────────────────────────────
  const captureAndSubmit = useCallback(async (completed: ChallengeStep[]) => {
    setPhase("capturing");
    phaseRef.current = "capturing";

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const frameB64 = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedFrame(frameB64);
    addLog("info", `Frame captured — ${canvas.width}×${canvas.height}px`);

    setPhase("submitting");
    phaseRef.current = "submitting";

    // Build entropy payload
    const entropy = {
      brightnessVariance: computeVariance(brightnessHistoryRef.current),
      noiseVariance: computeVariance(noiseHistoryRef.current),
      headStabilityVariance: computeVariance(noseXHistoryRef.current),
      earMicroVariance: computeVariance(earHistoryRef.current.slice(-30)),
      blinkLatencyMs: blinkLatencyMsRef.current,
      turnLatencyMs: turnLatencyMsRef.current,
    };

    addLog("info", `Entropy: bv=${entropy.brightnessVariance.toFixed(3)} nv=${entropy.noiseVariance.toFixed(3)} hv=${entropy.headStabilityVariance.toFixed(6)}`);
    addLog("info", `Frame timestamps collected: ${frameTimestampsRef.current.length}`);

    try {
      addLog("info", `POST ${apiBase}/vendor/liveness`);
      const res = await fetch(`${apiBase}/vendor/liveness`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1"
        },
        mode: "cors",
        body: JSON.stringify({
          session_id: sessionId,
          nonce: nonceRef.current,
          frame_base64: frameB64,
          completed_sequence: completed,
          frame_timestamps_ms: frameTimestampsRef.current,
          entropy,
          // legacy compat fields
          blink_detected: completed.includes("blink"),
          head_turn_detected: completed.some(s => s.startsWith("turn_")),
        }),
      });

      const data = await res.json();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, apiBase, addLog, onComplete]);

  // ── MediaPipe init (runs after challenge is fetched) ──────────────────────
  useEffect(() => {
    // Wait until we have a challenge sequence
    if (challengeSequence.length === 0) return;

    let active = true;

    async function init() {
      try {
        const loadScript = (src: string) =>
          new Promise<void>((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement("script");
            s.src = src; s.crossOrigin = "anonymous";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(s);
          });

        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        if (!active) return;

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API unavailable — page must be served over HTTPS or localhost");
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        addLog("info", `Found ${videoDevices.length} camera(s)`);
        if (videoDevices.length === 0) throw new Error("No camera found");

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: { ideal: "user" } },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => { });
        }
        addLog("info", "Camera stream acquired");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        const fm = new win.FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
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

          // Record frame timestamp for timing analysis
          frameTimestampsRef.current.push(Date.now());
          frameCountRef.current++;

          // Sample entropy every N frames
          if (frameCountRef.current % ENTROPY_SAMPLE_INTERVAL === 0) sampleEntropy();

          if (!hasFace) return;
          const lms = results.multiFaceLandmarks![0];

          const currentPhase = phaseRef.current;
          const currentStep = sequenceRef.current[stepIdxRef.current] ?? null;

          drawOverlay(lms, hasFace, currentStep);

          if (currentPhase === "calibrating") {
            // Just warming up — count frames until stable
            if (frameCountRef.current >= EAR_WINDOW + 2) {
              calibratingRef.current = false;
              setCalibrating(false);
              phaseRef.current = "challenge";
              setPhase("challenge");
              stepStartTimeRef.current = Date.now();
              addLog("info", `Challenge start: step 1/${sequenceRef.current.length} → ${sequenceRef.current[0]}`);
            }
            return;
          }

          if (currentPhase !== "challenge") return;
          if (!currentStep) return;

          // ── Execute current challenge step ────────────────────────────────
          if (currentStep === "blink") {
            if (detectBlink(lms)) {
              blinkLatencyMsRef.current = Date.now() - stepStartTimeRef.current;
              addLog("success", `Blink ✓ (${blinkLatencyMsRef.current}ms)`);
              advanceStep("blink");
            }
            return;
          }

          if (currentStep === "smile") {
            if (detectSmile(lms)) {
              turnLatencyMsRef.current = Date.now() - stepStartTimeRef.current;
              addLog("success", `Smile ✓ (${turnLatencyMsRef.current}ms)`);
              advanceStep("smile");
            }
            return;
          }

          // turn_left | turn_right | nod
          const { detected, progress } = detectHeadMotion(lms, currentStep);
          setTurnProgress(Math.round(progress * 100));
          if (detected) {
            turnLatencyMsRef.current = Date.now() - stepStartTimeRef.current;
            addLog("success", `${currentStep} ✓ (${turnLatencyMsRef.current}ms)`);
            advanceStep(currentStep);
          }
        });

        const sendFrame = async () => {
          if (!active) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            await fm.send({ image: videoRef.current });
          }
          animFrameRef.current = requestAnimationFrame(sendFrame);
        };
        animFrameRef.current = requestAnimationFrame(sendFrame);

        addLog("info", "MediaPipe ready — warming up...");
        phaseRef.current = "calibrating";
        setPhase("calibrating");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Camera error";
        addLog("error", msg);
        setError(msg);
        setPhase("error");
        phaseRef.current = "error";
      }
    }

    init();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeSequence]);

  // ── Derived UI values ──────────────────────────────────────────────────────
  const currentStep = challengeSequence[currentStepIdx] ?? null;
  const stepMeta = currentStep ? STEP_META[currentStep] : null;
  const totalSteps = challengeSequence.length;

  const phaseLabel = {
    fetching_challenge: "Fetching challenge...",
    calibrating: "Hold still — warming up...",
    challenge: stepMeta ? stepMeta.hint : "Follow the instructions",
    capturing: "Capturing frame...",
    submitting: "Submitting to API...",
    done: "Complete",
    error: "Error occurred",
  }[phase];

  const progressPct = {
    fetching_challenge: 5,
    calibrating: 15,
    challenge: 20 + (completedSteps.length / Math.max(totalSteps, 1)) * 50,
    capturing: 75,
    submitting: 88,
    done: 100,
    error: 0,
  }[phase];

  const showVideo = !["capturing", "submitting", "done"].includes(phase) || !capturedFrame;

  return (
    <div className="animate-fadeup" style={{ maxWidth: "100%", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "28px", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: "6px"
        }}>
          Liveness Check
        </h2>
        <p style={{ color: "var(--vault-text-dim)", fontSize: "12px" }}>
          Face detection using MediaPipe FaceMesh — {totalSteps > 0 ? `${totalSteps}-step challenge` : "loading challenge..."}
        </p>
      </div>

      {/* Challenge sequence indicator */}
      {challengeSequence.length > 0 && phase !== "fetching_challenge" && (
        <div style={{
          display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center"
        }}>
          {challengeSequence.map((step, idx) => {
            const done = idx < completedSteps.length;
            const current = idx === currentStepIdx && phase === "challenge";
            const meta = STEP_META[step];
            return (
              <div key={idx} style={{
                flex: 1, padding: "10px 8px",
                border: "1px solid",
                borderColor: done ? "var(--vault-green)"
                  : current ? "rgba(0,230,118,0.6)"
                    : "var(--vault-border)",
                borderRadius: "2px",
                background: done ? "rgba(0,230,118,0.08)"
                  : current ? "rgba(0,230,118,0.04)"
                    : "transparent",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                transition: "all 0.3s",
                opacity: idx > completedSteps.length + (phase === "challenge" ? 0 : -1) ? 0.35 : 1,
              }}>
                <span style={{
                  fontSize: "16px",
                  color: done ? "var(--vault-green)" : current ? "var(--vault-green)" : "var(--vault-muted)"
                }}>
                  {done ? "✓" : meta.icon}
                </span>
                <span style={{
                  fontSize: "9px", letterSpacing: "0.08em",
                  color: done ? "var(--vault-green)" : current ? "var(--vault-green)" : "var(--vault-text-dim)"
                }}>
                  {meta.label.toUpperCase()}
                </span>
                {current && !done && phase === "challenge" && (
                  <div style={{ width: "100%", height: "2px", background: "var(--vault-border)", borderRadius: "1px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${currentStep && !["blink", "smile"].includes(currentStep) ? turnProgress : 0}%`,
                      background: "var(--vault-green)",
                      transition: "width 0.05s ease",
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video panel */}
      <div style={{
        position: "relative", marginBottom: "24px", borderRadius: "2px",
        overflow: "hidden", border: "1px solid var(--vault-border)",
        background: "#000", aspectRatio: "4/3", maxWidth: "480px"
      }}>
        <video ref={videoRef} autoPlay playsInline muted style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: "scaleX(-1)",
          display: showVideo ? "block" : "none"
        }} />
        <canvas ref={overlayCanvasRef} width={640} height={480} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          transform: "scaleX(-1)", pointerEvents: "none",
          display: showVideo ? "block" : "none"
        }} />
        {/* Hidden canvases for capture + entropy */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <canvas ref={entropyCanvasRef} style={{ display: "none" }} />

        {capturedFrame && !showVideo && (
          <img src={capturedFrame} alt="captured" style={{
            width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)"
          }} />
        )}

        {/* Face indicator */}
        <div style={{
          position: "absolute", top: "10px", left: "10px",
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(0,0,0,0.6)", padding: "4px 10px",
          borderRadius: "2px", backdropFilter: "blur(4px)"
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: faceDetected ? "var(--vault-green)" : "var(--vault-red)",
            boxShadow: faceDetected ? "0 0 8px var(--vault-green)" : "none"
          }} />
          <span style={{ fontSize: "10px", color: "var(--vault-white)", letterSpacing: "0.05em" }}>
            {faceDetected ? "FACE DETECTED" : "NO FACE"}
          </span>
        </div>

        {/* Current step badge */}
        {phase === "challenge" && stepMeta && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(0,0,0,0.75)", border: "1px solid rgba(0,230,118,0.4)",
            padding: "5px 10px", borderRadius: "2px", backdropFilter: "blur(4px)"
          }}>
            <span style={{ fontSize: "10px", color: "var(--vault-green)", letterSpacing: "0.1em" }}>
              {stepMeta.icon} {stepMeta.label.toUpperCase()}
            </span>
          </div>
        )}

        {/* Calibration badge */}
        {phase === "calibrating" && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(255,171,0,0.15)", border: "1px solid var(--vault-amber)",
            padding: "3px 8px", borderRadius: "2px"
          }}>
            <span style={{ fontSize: "9px", color: "var(--vault-amber)", letterSpacing: "0.1em" }}>
              WARMING UP
            </span>
          </div>
        )}

        {/* Submitting overlay */}
        {(phase === "submitting" || phase === "capturing") && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(2px)"
          }}>
            <div style={{ textAlign: "center" }}>
              <div className="animate-spin-slow" style={{
                width: "32px", height: "32px",
                border: "2px solid var(--vault-border)",
                borderTop: "2px solid var(--vault-green)",
                borderRadius: "50%", margin: "0 auto 12px"
              }} />
              <span style={{ fontSize: "11px", color: "var(--vault-green)", letterSpacing: "0.1em" }}>
                {phaseLabel?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--vault-text-dim)", letterSpacing: "0.08em" }}>
            {phaseLabel?.toUpperCase()}
          </span>
          <span style={{ fontSize: "11px", color: "var(--vault-green)" }}>
            {Math.round(progressPct)}%
          </span>
        </div>
        <div style={{ height: "2px", background: "var(--vault-border)", borderRadius: "1px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, var(--vault-green), #69ffb4)",
            transition: "width 0.6s ease",
            borderRadius: "1px"
          }} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: "12px 16px", border: "1px solid var(--vault-red)",
          borderRadius: "2px", background: "rgba(255,61,87,0.06)",
          fontSize: "12px", color: "var(--vault-red)", marginBottom: "16px"
        }}>
          {error}
        </div>
      )}
    </div>
  );
}