"use client";
import { useState, useCallback } from "react";
import LivenessCheck from "@/components/LivenessCheck";
import VoiceChallenge from "@/components/VoiceChallenge";
import IdentityVerify from "@/components/IdentityVerify";
import SessionLog from "@/components/SessionLog";
import { generateSessionId } from "@/lib/utils";

type Step = "idle" | "liveness" | "voice" | "identity" | "done";

export interface LogEntry {
  ts: string;
  level: "info" | "success" | "error" | "warn";
  msg: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>("idle");
  const [sessionId] = useState(generateSessionId());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [livenessResult, setLivenessResult] = useState<Record<string, unknown> | null>(null);
  const [voiceResult, setVoiceResult] = useState<Record<string, unknown> | null>(null);
  const [apiBase, setApiBase] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");
  const [stepFailure, setStepFailure] = useState<{ step: Step; message: string } | null>(null);

  const addLog = useCallback((level: LogEntry["level"], msg: string) => {
    setLogs(prev => [
      ...prev,
      { ts: new Date().toISOString().split("T")[1].slice(0, 12), level, msg },
    ]);
  }, []);

  const handleLivenessComplete = useCallback((result: Record<string, unknown>) => {
    setLivenessResult(result);
    if (result.liveness_passed !== true) {
      const msg = (result.message as string) || "Liveness check failed. Please try again.";
      setLogs(prev => [...prev, { ts: new Date().toISOString().split("T")[1].slice(0, 12), level: "error", msg: `Liveness failed — ${msg}` }]);
      setStepFailure({ step: "liveness", message: msg });
      return;
    }
    setLogs(prev => [...prev, { ts: new Date().toISOString().split("T")[1].slice(0, 12), level: "success", msg: `Liveness passed ✓` }]);
    setStepFailure(null);
    setStep("voice");
  }, []);

  const handleVoiceComplete = useCallback((result: Record<string, unknown>) => {
    setVoiceResult(result);
    if (result.voice_passed !== true) {
      const msg = (result.message as string) || "Voice verification failed. Please try again.";
      setLogs(prev => [...prev, { ts: new Date().toISOString().split("T")[1].slice(0, 12), level: "error", msg: `Voice failed — ${msg}` }]);
      setStepFailure({ step: "voice", message: msg });
      return;
    }
    setLogs(prev => [...prev, { ts: new Date().toISOString().split("T")[1].slice(0, 12), level: "success", msg: `Voice passed ✓` }]);
    setStepFailure(null);
    setStep("identity");
  }, []);

  const handleIdentityComplete = useCallback((result: Record<string, unknown>) => {
    if (result.identity_passed !== true) {
      const msg = (result.message as string) || "Identity verification failed. Please try again.";
      setLogs(prev => [...prev, { ts: new Date().toISOString().split("T")[1].slice(0, 12), level: "error", msg: `Identity failed — ${msg}` }]);
      setStepFailure({ step: "identity", message: msg });
      return;
    }
    setLogs(prev => [...prev, { ts: new Date().toISOString().split("T")[1].slice(0, 12), level: "success", msg: `Identity passed ✓` }]);
    setStepFailure(null);
    setStep("done");
  }, []);

  const handleBegin = useCallback(() => {
    setLogs(prev => [...prev, {
      ts: new Date().toISOString().split("T")[1].slice(0, 12),
      level: "info",
      msg: `Session started: ${sessionId}`,
    }]);
    setStep("liveness");
  }, [sessionId]);

  const handleReset = useCallback(() => {
    setStep("idle");
    setLivenessResult(null);
    setVoiceResult(null);
    setLogs([]);
    setStepFailure(null);
  }, []);

  const handleRetry = useCallback(() => {
    // Re-mount the current step component by briefly going idle then back
    const currentStep = stepFailure?.step ?? step;
    setStepFailure(null);
    setStep("idle");
    setTimeout(() => setStep(currentStep), 50);
  }, [stepFailure, step]);

  return (
    <main style={{ minHeight: "100vh", background: "var(--vault-black)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--vault-border)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="2" fill="var(--vault-green)" />
            <path d="M7 7h14v8l-7 6-7-6V7z" stroke="#0a0a0a" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="13" r="2" fill="#0a0a0a" />
          </svg>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.02em", color: "var(--vault-white)" }}>
            VAULT
          </span>
          <span style={{ color: "var(--vault-text-dim)", fontSize: "10px", letterSpacing: "0.1em", borderLeft: "1px solid var(--vault-border)", paddingLeft: "12px" }}>
            VENDOR VERIFICATION
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "10px", color: "var(--vault-text-dim)" }}>
            SESSION{" "}
            <span style={{ color: "var(--vault-green)", fontFamily: "DM Mono" }}>
              {sessionId.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <input
            value={apiBase}
            onChange={e => setApiBase(e.target.value)}
            style={{
              background: "transparent",
              border: "1px solid var(--vault-border)",
              color: "var(--vault-text-dim)",
              fontSize: "10px",
              padding: "4px 8px",
              borderRadius: "1px",
              fontFamily: "DM Mono",
              width: "min(220px, 100%)",
              outline: "none",
            }}
            placeholder="API base URL"
          />
        </div>
      </header>

      <div className="vault-main-grid">
        {/* Main area */}
        <div style={{ padding: "24px 16px", overflowY: "auto" }}>

          {/* Step indicator — scrollable on mobile */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            marginBottom: "32px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}>
            {[
              { id: "liveness", label: "01 — LIVENESS", active: step === "liveness", done: ["voice", "identity", "done"].includes(step) },
              { id: "voice",    label: "02 — VOICE",    active: step === "voice",    done: ["identity", "done"].includes(step) },
              { id: "identity", label: "03 — IDENTITY", active: step === "identity", done: step === "done" },
              { id: "done",     label: "04 — COMPLETE", active: step === "done",     done: false },
            ].map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                {i > 0 && (
                  <div style={{ width: "32px", height: "1px", background: s.done || s.active ? "var(--vault-green)" : "var(--vault-border)", transition: "background 0.5s" }} />
                )}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 10px",
                  border: "1px solid",
                  borderColor: s.active ? "var(--vault-green)" : s.done ? "var(--vault-green)" : "var(--vault-border)",
                  borderRadius: "1px",
                  background: s.active ? "var(--vault-green-dim)" : "transparent",
                  transition: "all 0.3s",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: s.done ? "var(--vault-green)" : s.active ? "var(--vault-green)" : "var(--vault-muted)",
                    boxShadow: (s.active || s.done) ? "0 0 8px var(--vault-green)" : "none",
                    transition: "all 0.3s",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "9px", letterSpacing: "0.08em", color: s.active || s.done ? "var(--vault-green)" : "var(--vault-text-dim)" }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Content */}
          {step === "idle" && (
            <div className="animate-fadeup" style={{ maxWidth: "520px" }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 8vw, 52px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "16px", color: "var(--vault-white)" }}>
                Verify your<br />
                <span style={{ color: "var(--vault-green)" }}>identity</span>
              </h1>
              <p style={{ color: "var(--vault-text-dim)", fontSize: "13px", lineHeight: 1.7, marginBottom: "32px", maxWidth: "400px" }}>
                Complete a 2-step biometric check. Your face liveness and voice will be verified against your submitted details.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
                {[
                  ["→", "Face liveness detection via MediaPipe FaceMesh"],
                  ["→", "Blink & head-turn gesture confirmation"],
                  ["→", "Real-time voice challenge via AssemblyAI"],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: "10px", fontSize: "12px", color: "var(--vault-text-dim)" }}>
                    <span style={{ color: "var(--vault-green)" }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <button
                className="vault-btn vault-btn-primary"
                onClick={handleBegin}
              >
                BEGIN VERIFICATION
              </button>
            </div>
          )}

          {step === "liveness" && (
            <>
              {stepFailure?.step === "liveness" ? (
                <StepFailureBanner message={stepFailure.message} onRetry={handleRetry} onReset={handleReset} />
              ) : (
                <LivenessCheck sessionId={sessionId} apiBase={apiBase} onComplete={handleLivenessComplete} addLog={addLog} />
              )}
            </>
          )}

          {step === "voice" && (
            <>
              {stepFailure?.step === "voice" ? (
                <StepFailureBanner message={stepFailure.message} onRetry={handleRetry} onReset={handleReset} />
              ) : (
                <VoiceChallenge sessionId={sessionId} apiBase={apiBase} onComplete={handleVoiceComplete} addLog={addLog} />
              )}
            </>
          )}

          {step === "identity" && (
            <>
              {stepFailure?.step === "identity" ? (
                <StepFailureBanner message={stepFailure.message} onRetry={handleRetry} onReset={handleReset} />
              ) : (
                <IdentityVerify sessionId={sessionId} apiBase={apiBase} onComplete={handleIdentityComplete} addLog={addLog} />
              )}
            </>
          )}

          {step === "done" && (
            <div className="animate-fadeup" style={{ maxWidth: "520px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "1px solid var(--vault-green)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,230,118,0.08)", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--vault-green)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Verification Complete</h2>
                  <p style={{ color: "var(--vault-text-dim)", fontSize: "12px", margin: "4px 0 0" }}>Liveness + voice challenge passed</p>
                </div>
              </div>

              <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "2px", padding: "16px", marginBottom: "16px", overflowX: "auto" }}>
                <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", letterSpacing: "0.1em", marginBottom: "10px" }}>LIVENESS RESPONSE</div>
                <pre style={{ fontSize: "11px", color: "var(--vault-green)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(livenessResult, null, 2)}
                </pre>
              </div>

              <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "2px", padding: "16px", marginBottom: "28px", overflowX: "auto" }}>
                <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", letterSpacing: "0.1em", marginBottom: "10px" }}>VOICE RESPONSE</div>
                <pre style={{ fontSize: "11px", color: "var(--vault-green)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(voiceResult, null, 2)}
                </pre>
              </div>

              <button className="vault-btn vault-btn-ghost" onClick={handleReset}>
                RESET SESSION
              </button>
            </div>
          )}
        </div>

        {/* Log panel */}
        <div className="vault-log-panel">
          <SessionLog logs={logs} sessionId={sessionId} step={step} />
        </div>
      </div>
    </main>
  );
}

// ─── Step Failure Banner ─────────────────────────────────────────────────────

function StepFailureBanner({
  message,
  onRetry,
  onReset,
}: {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <div className="animate-fadeup" style={{ maxWidth: "520px" }}>
      <div style={{
        padding: "28px",
        border: "1px solid var(--vault-red)",
        borderRadius: "2px",
        background: "rgba(255,61,87,0.06)",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            border: "1px solid var(--vault-red)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,61,87,0.1)", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--vault-red)" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--vault-red)" }}>
              Verification Failed
            </h3>
            <p style={{ color: "var(--vault-text-dim)", fontSize: "12px", margin: "4px 0 0" }}>
              This step did not pass
            </p>
          </div>
        </div>

        <div style={{
          background: "rgba(255,61,87,0.08)",
          border: "1px solid rgba(255,61,87,0.2)",
          borderRadius: "2px",
          padding: "12px 14px",
          fontSize: "12px",
          color: "var(--vault-red)",
          lineHeight: 1.6,
          marginBottom: "20px",
        }}>
          {message}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="vault-btn vault-btn-primary"
            onClick={onRetry}
            style={{ flex: 1, minWidth: "120px" }}
          >
            TRY AGAIN
          </button>
          <button
            className="vault-btn vault-btn-ghost"
            onClick={onReset}
            style={{ flex: 1, minWidth: "120px" }}
          >
            RESTART SESSION
          </button>
        </div>
      </div>
    </div>
  );
}