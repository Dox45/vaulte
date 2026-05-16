import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
export type ChallengeStep = "blink" | "turn_left" | "turn_right" | "nod" | "smile";

interface LogEntry {
  ts: string;
  level: "info" | "success" | "error" | "warn";
  msg: string;
}

interface Props {
  sessionId: string;
  apiBase: string;
  endpoints?: {
    challenge?: string;
    submit?: string;
  };
  onComplete: (result: Record<string, unknown>) => void;
  onError?: (code: string, detail: string, scores?: VerificationScores) => void;
  addLog: (level: LogEntry["level"], msg: string) => void;
}

// ── Server response shapes ─────────────────────────────────────────────────────

interface VerificationScores {
  sequence_match: number;
  timing_score: number;
  frame_quality: number;
  brightness: number;
  noise: number;
  head_stability: number;
  ear_movement: number;
  composite: number;
}

/** Structured error returned by verify_challenge failures */
interface LivenessErrorBody {
  error_code: string;
  detail: string;
  scores?: VerificationScores;
}

/** FastAPI Pydantic validation error item */
interface PydanticErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
}

/** Success response */
interface LivenessSuccessBody {
  success: boolean;
  liveness_passed: boolean;
  message: string;
  flagged: boolean;
  flag_reason: string;
  elapsed_ms: number;
  scores?: VerificationScores;
}

type Phase =
  | "fetching_challenge"
  | "calibrating"
  | "challenge"
  | "capturing"
  | "submitting"
  | "done"
  | "error";

// ── Detection constants ────────────────────────────────────────────────────────
const BLINK_DROP_DELTA = 0.003;
const BLINK_REOPEN_DELTA = 0.002;
const EAR_WINDOW = 8;
const NOD_DELTA = 0.08;
const HEAD_TURN_DELTA = 0.06;      // easier to trigger — was 0.10
const TURN_SUSTAIN_FRAMES = 2;     // fewer frames to hold — was 3
const BASELINE_FRAMES = 15;        // faster baseline lock — was 20
const ENTROPY_SAMPLE_INTERVAL = 5;

// ── Challenge step metadata ────────────────────────────────────────────────────
const STEP_META: Record<ChallengeStep, { label: string; icon: string; hint: string }> = {
  blink: { label: "Blink", icon: "◎", hint: "Blink both eyes naturally" },
  turn_left: { label: "Turn Left", icon: "←", hint: "Turn your head to the left" },
  turn_right: { label: "Turn Right", icon: "→", hint: "Turn your head to the right" },
  nod: { label: "Nod", icon: "↕", hint: "Nod your head up and down" },
  smile: { label: "Open mouth", icon: "◡", hint: "Give a natural smile with mouth open" },
};

// ── Error code → user-facing message ──────────────────────────────────────────
const ERROR_USER_MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: "Session expired — please refresh and try again.",
  NONCE_MISMATCH: "Security token mismatch — please restart the check.",
  SESSION_EXPIRED: "The challenge timed out — please try again.",
  COMPLETED_TOO_FAST: "Completed too quickly — please follow each step naturally.",
  SEQUENCE_MISMATCH: "Steps were performed in the wrong order — please try again.",
  FRAME_TIMING_ANOMALY: "Video quality issue detected — ensure your camera is working.",
  LOW_ENTROPY: "Liveness signal too weak — try better lighting and natural movement.",
};

// ── Score label helpers ────────────────────────────────────────────────────────
function scoreBar(value: number): string {
  const filled = Math.round(value * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function scoreLabel(value: number): string {
  if (value >= 0.8) return "PASS";
  if (value >= 0.5) return "WEAK";
  return "FAIL";
}

function formatScores(scores: VerificationScores): string[] {
  return [
    `  composite     [${scoreBar(scores.composite)}] ${(scores.composite * 100).toFixed(0)}% ${scoreLabel(scores.composite)}`,
    `  sequence      [${scoreBar(scores.sequence_match)}] ${(scores.sequence_match * 100).toFixed(0)}% ${scoreLabel(scores.sequence_match)}`,
    `  timing        [${scoreBar(scores.timing_score)}] ${(scores.timing_score * 100).toFixed(0)}% ${scoreLabel(scores.timing_score)}`,
    `  frame quality [${scoreBar(scores.frame_quality)}] ${(scores.frame_quality * 100).toFixed(0)}% ${scoreLabel(scores.frame_quality)}`,
    `  brightness    [${scoreBar(scores.brightness)}] ${(scores.brightness * 100).toFixed(0)}% ${scoreLabel(scores.brightness)}`,
    `  noise         [${scoreBar(scores.noise)}] ${(scores.noise * 100).toFixed(0)}% ${scoreLabel(scores.noise)}`,
    `  head stability[${scoreBar(scores.head_stability)}] ${(scores.head_stability * 100).toFixed(0)}% ${scoreLabel(scores.head_stability)}`,
    `  eye movement  [${scoreBar(scores.ear_movement)}] ${(scores.ear_movement * 100).toFixed(0)}% ${scoreLabel(scores.ear_movement)}`,
  ];
}

// ── Entropy helpers ────────────────────────────────────────────────────────────
function computeVariance(arr: number[]): number {
  if (!Array.isArray(arr) || arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
}

function sampleFrameEntropy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { brightness: number; noise: number } {
  const pw = 32, ph = 32;
  const px = Math.floor((width - pw) / 2);
  const py = Math.floor((height - ph) / 2);
  const imageData = ctx.getImageData(px, py, pw, ph);
  const pixels = imageData.data;

  let brightness = 0;
  const samples: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const lum = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
    brightness += lum;
    samples.push(lum);
  }
  brightness /= samples.length;
  const mean = brightness;
  const noise = Math.sqrt(
    samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length
  );
  return { brightness, noise };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function LivenessCheck({
  sessionId,
  apiBase,
  endpoints = {
    challenge: "/vendor/liveness/challenge",
    submit: "/vendor/liveness",
  },
  onComplete,
  onError,
  addLog,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const entropyCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  // ── Server challenge state ─────────────────────────────────────────────────
  const [challengeSequence, setChallengeSequence] = useState<ChallengeStep[]>([]);
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

  // ── Security: frame timestamps + entropy ──────────────────────────────────
  const frameTimestampsRef = useRef<number[]>([]);
  const frameCountRef = useRef<number>(0);
  const brightnessHistoryRef = useRef<number[]>([]);
  const noiseHistoryRef = useRef<number[]>([]);
  const noseXHistoryRef = useRef<number[]>([]);
  const earHistoryRef = useRef<number[]>([]);

  // ── Challenge latency ──────────────────────────────────────────────────────
  const stepStartTimeRef = useRef<number>(Date.now());
  const blinkLatencyMsRef = useRef<number>(0);
  const turnLatencyMsRef = useRef<number>(0);

  // ── Calibration ────────────────────────────────────────────────────────────
  const calibratingRef = useRef(true);

  // ── Step 0: fetch server challenge ─────────────────────────────────────────
  useEffect(() => {
    async function fetchChallenge() {
      const url = `${apiBase}${endpoints?.challenge ?? "/vendor/liveness/challenge"}`;
      addLog("info", `GET ${url}`);
      try {
        const res = await fetch(url, {
          headers: {
            "ngrok-skip-browser-warning": "1",
            "X-Session-Id": sessionId,
          },
          mode: "cors",
        });

        const raw = await res.json();
        addLog("info", `Challenge response shape: ${JSON.stringify(Object.keys(raw))}`);

        if (!res.ok) {
          throw new Error(`Challenge fetch failed: HTTP ${res.status} — ${JSON.stringify(raw)}`);
        }

        // Support both flat { sequence, nonce } and wrapped { data: { sequence, nonce } }
        const payload = raw?.data ?? raw;

        if (!Array.isArray(payload?.sequence) || payload.sequence.length === 0) {
          throw new Error(
            `Invalid challenge sequence — got: ${JSON.stringify(payload?.sequence)}`
          );
        }
        if (!payload?.nonce || typeof payload.nonce !== "string") {
          throw new Error(`Invalid nonce — got: ${JSON.stringify(payload?.nonce)}`);
        }

        sequenceRef.current = payload.sequence;
        nonceRef.current = payload.nonce;
        setChallengeSequence(payload.sequence);

        addLog("success", `Challenge received | seq=[${payload.sequence.join(",")}] | nonce=${payload.nonce.slice(0, 8)}...`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to fetch challenge";
        addLog("error", `Challenge fetch error: ${msg}`);
        setError(msg);
        setPhase("error");
        phaseRef.current = "error";
      }
    }
    fetchChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Blink detection ────────────────────────────────────────────────────────
  const detectBlink = useCallback(
    (lms: { x: number; y: number; z: number }[]): boolean => {
      if (!lms || lms.length < 387) return false;

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
    },
    []
  );

  // ── Head turn / nod detection ──────────────────────────────────────────────
  const detectHeadMotion = useCallback(
    (
      lms: { x: number; y: number; z: number }[],
      step: ChallengeStep
    ): { detected: boolean; progress: number } => {
      if (!lms || lms.length < 2) return { detected: false, progress: 0 };

      const noseX = lms[1].x;
      const noseY = lms[1].y;

      noseXHistoryRef.current.push(noseX);
      if (noseXHistoryRef.current.length > 60) noseXHistoryRef.current.shift();

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

      const baseX = noseBaselineXRef.current;
      const baseY = noseBaselineYRef.current ?? 0.5;
      const deltaX = Math.abs(noseX - baseX);
      const deltaY = Math.abs(noseY - baseY);
      let progress = 0;

      if (step === "turn_left" || step === "turn_right") {
        const directionOk =
          step === "turn_left"
            ? noseX < baseX - HEAD_TURN_DELTA * 0.2
            : noseX > baseX + HEAD_TURN_DELTA * 0.2;
        progress = Math.min(deltaX / HEAD_TURN_DELTA, 1);
        turnSustainRef.current =
          deltaX >= HEAD_TURN_DELTA && directionOk ? turnSustainRef.current + 1 : 0;
      } else if (step === "nod") {
        progress = Math.min(deltaY / NOD_DELTA, 1);
        turnSustainRef.current = deltaY >= NOD_DELTA ? turnSustainRef.current + 1 : 0;
      }

      return { detected: turnSustainRef.current >= TURN_SUSTAIN_FRAMES, progress };
    },
    []
  );

  // ── Smile detection ────────────────────────────────────────────────────────
  // const detectSmile = useCallback(
  //   (lms: { x: number; y: number; z: number }[]): boolean => {
  //     if (!lms || lms.length < 292) return false;
  //     const mouthWidth = Math.abs(lms[291].x - lms[61].x);
  //     const mouthHeight = Math.abs(lms[14].y - lms[13].y);
  //     return mouthWidth / (mouthHeight + 0.001) > 4.5;
  //   },
  //   []
  // );

  const detectSmile = useCallback(
  (lms: { x: number; y: number; z: number }[]): boolean => {
    if (!lms || lms.length < 292) return false;
    
    const mouthWidth = Math.abs(lms[291].x - lms[61].x);
    const mouthHeight = Math.abs(lms[14].y - lms[13].y);
    const ratio = mouthWidth / (mouthHeight + 0.001);
    const mouthOpen = mouthHeight > 0.03; // must open mouth noticeably
    
    return ratio > 3.5 && mouthOpen;
  },
  []
);
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
  const drawOverlay = useCallback(
    (
      lms: { x: number; y: number; z: number }[],
      hasFace: boolean,
      step: ChallengeStep | null
    ) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas || !lms || lms.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const faceOval = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
        379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
        234, 127, 162, 21, 54, 103, 67, 109,
      ];

      ctx.beginPath();
      faceOval.forEach((idx, i) => {
        const lm = lms[idx];
        if (!lm) return;
        if (i === 0) ctx.moveTo(lm.x * canvas.width, lm.y * canvas.height);
        else ctx.lineTo(lm.x * canvas.width, lm.y * canvas.height);
      });
      ctx.closePath();
      ctx.strokeStyle = hasFace ? "#00e676" : "rgba(0,230,118,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      [[159, 145], [386, 374]].forEach(([u, l]) => {
        [u, l].forEach(idx => {
          const lm = lms[idx];
          if (!lm) return;
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#00e676";
          ctx.fill();
        });
      });

      const nose = lms[1];
      if (nose) {
        ctx.beginPath();
        ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00e676";
        ctx.fill();
      }

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
    },
    []
  );

  // ── Advance to next challenge step ─────────────────────────────────────────
  const advanceStep = useCallback((completedStep: ChallengeStep) => {
    const newCompleted = [...completedStepsRef.current, completedStep];
    completedStepsRef.current = newCompleted;
    setCompletedSteps(newCompleted);

    const nextIdx = stepIdxRef.current + 1;
    const seq = sequenceRef.current;

    if (!Array.isArray(seq) || nextIdx >= seq.length) {
      addLog("success", `All ${seq?.length ?? 0} challenges complete ✓`);
      captureAndSubmit(newCompleted);
      return;
    }

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
    addLog("info", `Step ${nextIdx + 1}/${seq.length}: ${seq[nextIdx]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Capture + submit ───────────────────────────────────────────────────────
  const captureAndSubmit = useCallback(
    async (completed: ChallengeStep[]) => {
      setPhase("capturing");
      phaseRef.current = "capturing";

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        addLog("error", "Canvas or video ref missing at capture time");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const frameB64 = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedFrame(frameB64);
      addLog("info", `Frame captured — ${canvas.width}×${canvas.height}px | ~${Math.round((frameB64.length * 3) / 4 / 1024)}KB`);

      setPhase("submitting");
      phaseRef.current = "submitting";

      // ── Build entropy payload ──────────────────────────────────────────────
      const entropy = {
        brightnessVariance: computeVariance(brightnessHistoryRef.current),
        noiseVariance: computeVariance(noiseHistoryRef.current),
        headStabilityVariance: computeVariance(noseXHistoryRef.current),
        earMicroVariance: computeVariance(earHistoryRef.current.slice(-30)),
        blinkLatencyMs: blinkLatencyMsRef.current,
        turnLatencyMs: turnLatencyMsRef.current,
      };

      const timestamps = frameTimestampsRef.current;

      // ── Pre-flight diagnostics ─────────────────────────────────────────────
      addLog("info", `── Payload diagnostics ──────────────────────`);
      addLog("info", `  session_id:          ${sessionId}`);
      addLog("info", `  nonce:               ${nonceRef.current.slice(0, 8)}... (${nonceRef.current.length} chars)`);
      addLog("info", `  completed_sequence:  [${completed.join(", ")}] (${completed.length} steps)`);
      addLog("info", `  frame_timestamps_ms: ${timestamps.length} entries | first=${timestamps[0]} | last=${timestamps.at(-1)} | span=${((timestamps.at(-1) ?? 0) - (timestamps[0] ?? 0))}ms`);
      addLog("info", `  frame_base64:        ${Math.round((frameB64.length * 3) / 4 / 1024)}KB`);
      addLog("info", `  entropy.bv:          ${entropy.brightnessVariance.toFixed(4)}`);
      addLog("info", `  entropy.nv:          ${entropy.noiseVariance.toFixed(4)}`);
      addLog("info", `  entropy.hv:          ${entropy.headStabilityVariance.toFixed(6)}`);
      addLog("info", `  entropy.ear:         ${entropy.earMicroVariance.toFixed(6)}`);
      addLog("info", `  entropy.blinkMs:     ${entropy.blinkLatencyMs}`);
      addLog("info", `  entropy.turnMs:      ${entropy.turnLatencyMs}`);
      addLog("info", `────────────────────────────────────────────`);

      const body = JSON.stringify({
        session_id: sessionId,
        nonce: nonceRef.current,
        frame_base64: frameB64,
        completed_sequence: completed,
        frame_timestamps_ms: timestamps,
        entropy,
        blink_detected: completed.includes("blink"),
        head_turn_detected: completed.some(s => s.startsWith("turn_")),
      });

      const submitUrl = `${apiBase}${endpoints?.submit ?? "/vendor/liveness"}`;
      addLog("info", `POST ${submitUrl}`);

      try {
        const res = await fetch(submitUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
            "X-Session-Id": sessionId,
          },
          mode: "cors",
          body,
        });

        // Always parse the body — we need it for both success and error paths
        let data: unknown;
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          addLog("warn", `Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
          throw new Error(`Unexpected response format — HTTP ${res.status}`);
        }

        // ── Error path ───────────────────────────────────────────────────────
        if (!res.ok) {
          const errData = data as Record<string, unknown>;

          // Case 1: Our structured LivenessErrorBody { error_code, detail, scores }
          if (typeof errData?.error_code === "string") {
            const structured = errData as unknown as LivenessErrorBody;
            const userMsg = ERROR_USER_MESSAGES[structured.error_code] ?? structured.detail;

            addLog("error", `── Liveness verification failed ─────────────`);
            addLog("error", `  error_code: ${structured.error_code}`);
            addLog("error", `  detail:     ${structured.detail}`);
            addLog("error", `  http:       ${res.status}`);

            if (structured.scores) {
              addLog("warn", `── Verification scores ───────────────────────`);
              formatScores(structured.scores).forEach(line => addLog("warn", line));
              addLog("warn", `─────────────────────────────────────────────`);
            }

            onError?.(structured.error_code, structured.detail, structured.scores);
            throw new Error(userMsg);
          }

          // Case 2: FastAPI Pydantic validation error { detail: PydanticErrorItem[] }
          if (Array.isArray(errData?.detail)) {
            const items = errData.detail as PydanticErrorItem[];
            addLog("error", `── Pydantic validation error (HTTP ${res.status}) ──`);
            items.forEach(item => {
              const field = item.loc.join(".");
              addLog("error", `  field: ${field}`);
              addLog("error", `  msg:   ${item.msg}`);
              addLog("error", `  type:  ${item.type}`);
              if (item.input !== undefined) {
                addLog("error", `  input: ${JSON.stringify(item.input).slice(0, 120)}`);
              }
            });
            addLog("error", `─────────────────────────────────────────────`);

            const summary = items
              .map(e => `${e.loc.slice(-1)[0]}: ${e.msg}`)
              .join(" | ");
            throw new Error(`Payload rejected: ${summary}`);
          }

          // Case 3: Plain string detail
          if (typeof errData?.detail === "string") {
            addLog("error", `Server error ${res.status}: ${errData.detail}`);
            throw new Error(errData.detail);
          }

          // Case 4: Unknown shape — dump everything
          addLog("error", `Unknown error shape (HTTP ${res.status}): ${JSON.stringify(errData).slice(0, 300)}`);
          throw new Error(`HTTP ${res.status} — see logs for details`);
        }

        // ── Success path ─────────────────────────────────────────────────────
        const successData = data as LivenessSuccessBody;
        addLog("success", `── Liveness passed (HTTP ${res.status}) ──────────`);
        addLog("success", `  message:    ${successData.message}`);
        addLog("success", `  elapsed_ms: ${successData.elapsed_ms}`);
        if (successData.flagged) {
          addLog("warn", `  flagged:    true — ${successData.flag_reason}`);
        }
        if (successData.scores) {
          addLog("info", `── Verification scores ───────────────────────`);
          formatScores(successData.scores).forEach(line => addLog("info", line));
          addLog("info", `─────────────────────────────────────────────`);
        }

        setPhase("done");
        phaseRef.current = "done";
        onComplete(data as Record<string, unknown>);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        // Only log here if it wasn't already logged in the structured error blocks above
        if (!msg.startsWith("Payload rejected") && !msg.startsWith("HTTP ") && !Object.values(ERROR_USER_MESSAGES).includes(msg)) {
          addLog("error", `Fetch error: ${msg}`);
        }
        setError(msg);
        setPhase("error");
        phaseRef.current = "error";
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, apiBase, addLog, onComplete, onError]
  );

  // ── MediaPipe init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!Array.isArray(challengeSequence) || challengeSequence.length === 0) return;

    let active = true;

    async function init() {
      try {
        const loadScript = (src: string) =>
          new Promise<void>((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
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

          frameTimestampsRef.current.push(Date.now());
          frameCountRef.current++;

          if (frameCountRef.current % ENTROPY_SAMPLE_INTERVAL === 0) sampleEntropy();

          if (!hasFace) return;

          const lms = results.multiFaceLandmarks?.[0];
          if (!lms || lms.length === 0) return;

          const currentPhase = phaseRef.current;
          const seq = sequenceRef.current;
          const currentStep: ChallengeStep | null =
            Array.isArray(seq) && seq.length > 0 && stepIdxRef.current < seq.length
              ? seq[stepIdxRef.current]
              : null;

          drawOverlay(lms, hasFace, currentStep);

          if (currentPhase === "calibrating") {
            if (frameCountRef.current >= EAR_WINDOW + 2) {
              calibratingRef.current = false;
              phaseRef.current = "challenge";
              setPhase("challenge");
              stepStartTimeRef.current = Date.now();
              addLog("info", `Challenge start: step 1/${seq?.length ?? 0} → ${seq?.[0] ?? "?"}`);
            }
            return;
          }

          if (currentPhase !== "challenge" || !currentStep) return;

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
  const safeSequence: ChallengeStep[] = Array.isArray(challengeSequence) ? challengeSequence : [];
  const totalSteps = safeSequence.length;
  const currentStep: ChallengeStep | null =
    totalSteps > 0 && currentStepIdx < totalSteps ? safeSequence[currentStepIdx] : null;
  const stepMeta = currentStep ? STEP_META[currentStep] : null;

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
          fontFamily: "'Syne', sans-serif", fontSize: "28px",
          fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "6px",
        }}>
          Liveness Check
        </h2>
        <p style={{ color: "var(--vault-text-dim)", fontSize: "12px" }}>
          Face detection using MediaPipe FaceMesh —{" "}
          {totalSteps > 0 ? `${totalSteps}-step challenge` : "loading challenge..."}
        </p>
      </div>

      {/* Challenge sequence indicator */}
      {safeSequence.length > 0 && phase !== "fetching_challenge" && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center" }}>
          {safeSequence.map((step, idx) => {
            const done = idx < completedSteps.length;
            const current = idx === currentStepIdx && phase === "challenge";
            const meta = STEP_META[step];
            return (
              <div
                key={idx}
                style={{
                  flex: 1, padding: "10px 8px",
                  border: "1px solid",
                  borderColor: done
                    ? "var(--vault-green)"
                    : current
                      ? "rgba(0,230,118,0.6)"
                      : "var(--vault-border)",
                  borderRadius: "2px",
                  background: done
                    ? "rgba(0,230,118,0.08)"
                    : current
                      ? "rgba(0,230,118,0.04)"
                      : "transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  transition: "all 0.3s",
                  opacity: idx > completedSteps.length + (phase === "challenge" ? 0 : -1) ? 0.35 : 1,
                }}
              >
                <span style={{
                  fontSize: "16px",
                  color: done || current ? "var(--vault-green)" : "var(--vault-muted)",
                }}>
                  {done ? "✓" : meta.icon}
                </span>
                <span style={{
                  fontSize: "9px", letterSpacing: "0.08em",
                  color: done || current ? "var(--vault-green)" : "var(--vault-text-dim)",
                }}>
                  {meta.label.toUpperCase()}
                </span>
                {current && !done && phase === "challenge" && (
                  <div style={{
                    width: "100%", height: "2px",
                    background: "var(--vault-border)", borderRadius: "1px", overflow: "hidden",
                  }}>
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
        background: "#000", aspectRatio: "4/3", maxWidth: "480px",
      }}>
        <video
          ref={videoRef} autoPlay playsInline muted
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: "scaleX(-1)", display: showVideo ? "block" : "none",
          }}
        />
        <canvas
          ref={overlayCanvasRef} width={640} height={480}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            transform: "scaleX(-1)", pointerEvents: "none",
            display: showVideo ? "block" : "none",
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <canvas ref={entropyCanvasRef} style={{ display: "none" }} />

        {capturedFrame && !showVideo && (
          <img
            src={capturedFrame} alt="captured"
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
        )}

        {/* Face indicator */}
        <div style={{
          position: "absolute", top: "10px", left: "10px",
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(0,0,0,0.6)", padding: "4px 10px",
          borderRadius: "2px", backdropFilter: "blur(4px)",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: faceDetected ? "var(--vault-green)" : "var(--vault-red)",
            boxShadow: faceDetected ? "0 0 8px var(--vault-green)" : "none",
          }} />
          <span style={{ fontSize: "10px", color: "var(--vault-white)", letterSpacing: "0.05em" }}>
            {faceDetected ? "FACE DETECTED" : "NO FACE"}
          </span>
        </div>

        {/* Step badge */}
        {phase === "challenge" && stepMeta && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(0,0,0,0.75)", border: "1px solid rgba(0,230,118,0.4)",
            padding: "5px 10px", borderRadius: "2px", backdropFilter: "blur(4px)",
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
            padding: "3px 8px", borderRadius: "2px",
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
            backdropFilter: "blur(2px)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div
                className="animate-spin-slow"
                style={{
                  width: "32px", height: "32px",
                  border: "2px solid var(--vault-border)",
                  borderTop: "2px solid var(--vault-green)",
                  borderRadius: "50%", margin: "0 auto 12px",
                }}
              />
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
            {Math.round(progressPct ?? 0)}%
          </span>
        </div>
        <div style={{ height: "2px", background: "var(--vault-border)", borderRadius: "1px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progressPct ?? 0}%`,
            background: "linear-gradient(90deg, var(--vault-green), #69ffb4)",
            transition: "width 0.6s ease",
            borderRadius: "1px",
          }} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: "12px 16px", border: "1px solid var(--vault-red)",
          borderRadius: "2px", background: "rgba(255,61,87,0.06)",
          fontSize: "12px", color: "var(--vault-red)", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}