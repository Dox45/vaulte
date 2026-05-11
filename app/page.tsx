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

  // Stable ref — never recreated, so child components calling addLog during
  // their own render/effect cycle won't trigger a parent re-render mid-render.
  const addLog = useCallback((level: LogEntry["level"], msg: string) => {
    setLogs(prev => [
      ...prev,
      { ts: new Date().toISOString().split("T")[1].slice(0, 12), level, msg },
    ]);
  }, []); // empty deps — setLogs from useState is always stable

  const handleLivenessComplete = useCallback((result: Record<string, unknown>) => {
    setLivenessResult(result);
    setLogs(prev => [...prev, {
      ts: new Date().toISOString().split("T")[1].slice(0, 12),
      level: "success",
      msg: `Liveness check passed — ${JSON.stringify(result)}`,
    }]);
    setStep("voice");
  }, []);

  const handleVoiceComplete = useCallback((result: Record<string, unknown>) => {
    setVoiceResult(result);
    setLogs(prev => [...prev, {
      ts: new Date().toISOString().split("T")[1].slice(0, 12),
      level: "success",
      msg: `Voice challenge verified — ${JSON.stringify(result)}`,
    }]);
    setStep("identity");
  }, []);

  const handleIdentityComplete = useCallback((result: Record<string, unknown>) => {
    setLogs(prev => [...prev, {
      ts: new Date().toISOString().split("T")[1].slice(0, 12),
      level: "success",
      msg: `Identity verification complete — ${JSON.stringify(result)}`,
    }]);
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
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "var(--vault-black)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--vault-border)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="2" fill="var(--vault-green)" />
            <path d="M7 7h14v8l-7 6-7-6V7z" stroke="#0a0a0a" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="13" r="2" fill="#0a0a0a" />
          </svg>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.02em", color: "var(--vault-white)" }}>
            VAULT
          </span>
          <span style={{ color: "var(--vault-text-dim)", fontSize: "11px", letterSpacing: "0.1em", borderLeft: "1px solid var(--vault-border)", paddingLeft: "16px" }}>
            VENDOR VERIFICATION
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ fontSize: "11px", color: "var(--vault-text-dim)" }}>
            SESSION{" "}
            <span style={{ color: "var(--vault-green)", fontFamily: "DM Mono" }}>
              {sessionId.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div>
            <input
              value={apiBase}
              onChange={e => setApiBase(e.target.value)}
              style={{
                background: "transparent",
                border: "1px solid var(--vault-border)",
                color: "var(--vault-text-dim)",
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "1px",
                fontFamily: "DM Mono",
                width: "240px",
                outline: "none",
              }}
              placeholder="API base URL"
            />
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: "calc(100vh - 57px)" }}>
        {/* Main area */}
        <div style={{ padding: "48px", borderRight: "1px solid var(--vault-border)" }}>
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "48px" }}>
            {[
              { id: "liveness", label: "01 — LIVENESS", active: step === "liveness", done: ["voice", "identity", "done"].includes(step) },
              { id: "voice", label: "02 — VOICE", active: step === "voice", done: ["identity", "done"].includes(step) },
              { id: "identity", label: "03 — IDENTITY", active: step === "identity", done: step === "done" },
              { id: "done", label: "04 — COMPLETE", active: step === "done", done: false },
            ].map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <div style={{ width: "48px", height: "1px", background: s.done || s.active ? "var(--vault-green)" : "var(--vault-border)", transition: "background 0.5s" }} />
                )}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  border: "1px solid",
                  borderColor: s.active ? "var(--vault-green)" : s.done ? "var(--vault-green)" : "var(--vault-border)",
                  borderRadius: "1px",
                  background: s.active ? "var(--vault-green-dim, rgba(0,230,118,0.08))" : "transparent",
                  transition: "all 0.3s",
                }}>
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: s.done ? "var(--vault-green)" : s.active ? "var(--vault-green)" : "var(--vault-muted)",
                    boxShadow: (s.active || s.done) ? "0 0 8px var(--vault-green)" : "none",
                    transition: "all 0.3s",
                  }} />
                  <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: s.active || s.done ? "var(--vault-green)" : "var(--vault-text-dim)" }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Content */}
          {step === "idle" && (
            <div className="animate-fadeup" style={{ maxWidth: "520px" }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "52px", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "20px", color: "var(--vault-white)" }}>
                Verify your<br />
                <span style={{ color: "var(--vault-green)" }}>identity</span>
              </h1>
              <p style={{ color: "var(--vault-text-dim)", fontSize: "13px", lineHeight: 1.7, marginBottom: "40px", maxWidth: "400px" }}>
                Complete a 2-step biometric check. Your face liveness and voice will be verified against your submitted details.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
                {[
                  ["→", "Face liveness detection via MediaPipe FaceMesh"],
                  ["→", "Blink & head-turn gesture confirmation"],
                  ["→", "Real-time voice challenge via AssemblyAI"],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--vault-text-dim)" }}>
                    <span style={{ color: "var(--vault-green)" }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <button
                className="vault-btn vault-btn-primary"
                onClick={handleBegin}
                style={{ fontSize: "12px", letterSpacing: "0.1em", padding: "14px 32px" }}
              >
                BEGIN VERIFICATION
              </button>
            </div>
          )}

          {step === "liveness" && (
            <LivenessCheck
              sessionId={sessionId}
              apiBase={apiBase}
              onComplete={handleLivenessComplete}
              addLog={addLog}
            />
          )}

          {step === "voice" && (
            <VoiceChallenge
              sessionId={sessionId}
              apiBase={apiBase}
              onComplete={handleVoiceComplete}
              addLog={addLog}
            />
          )}

          {step === "identity" && (
            <IdentityVerify
              sessionId={sessionId}
              apiBase={apiBase}
              onComplete={handleIdentityComplete}
              addLog={addLog}
            />
          )}

          {step === "done" && (
            <div className="animate-fadeup" style={{ maxWidth: "520px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", border: "1px solid var(--vault-green)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,230,118,0.08)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--vault-green)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Verification Complete</h2>
                  <p style={{ color: "var(--vault-text-dim)", fontSize: "12px", margin: "4px 0 0" }}>Liveness + voice challenge passed</p>
                </div>
              </div>

              <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "2px", padding: "20px", marginBottom: "24px" }}>
                <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", letterSpacing: "0.1em", marginBottom: "12px" }}>LIVENESS RESPONSE</div>
                <pre style={{ fontSize: "11px", color: "var(--vault-green)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(livenessResult, null, 2)}
                </pre>
              </div>

              <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "2px", padding: "20px", marginBottom: "32px" }}>
                <div style={{ fontSize: "10px", color: "var(--vault-text-dim)", letterSpacing: "0.1em", marginBottom: "12px" }}>VOICE RESPONSE</div>
                <pre style={{ fontSize: "11px", color: "var(--vault-green)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(voiceResult, null, 2)}
                </pre>
              </div>

              <button
                className="vault-btn vault-btn-ghost"
                onClick={handleReset}
                style={{ fontSize: "11px" }}
              >
                RESET SESSION
              </button>
            </div>
          )}
        </div>

        {/* Log panel */}
        <SessionLog logs={logs} sessionId={sessionId} step={step} />
      </div>
    </main>
  );
}