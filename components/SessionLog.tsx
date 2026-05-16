"use client";
import { useEffect, useRef } from "react";

inteface LogEntry {
  ts: string;
  level: "info" | "success" | "error" | "warn";
  msg: string;
}

interface Props {
  logs: LogEntry[];
  sessionId: string;
  step: string;
}

const levelColors = {
  info: "var(--benchmark-text-dim)",
  success: "var(--benchmark-green)",
  error: "var(--benchmark-red)",
  warn: "var(--benchmark-amber)",
};

const levelPrefixes = {
  info: "  INFO",
  success: "    OK",
  error: " ERROR",
  warn: "  WARN",
};

export default function SessionLog({ logs, sessionId, step }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--benchmark-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: "var(--benchmark-text-dim)", letterSpacing: "0.12em" }}>SESSION LOG</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: step !== "idle" && step !== "done" ? "var(--benchmark-green)" : "var(--benchmark-muted)", boxShadow: step !== "idle" && step !== "done" ? "0 0 8px var(--benchmark-green)" : "none" }} />
          <span style={{ fontSize: "10px", color: "var(--benchmark-text-dim)", letterSpacing: "0.08em" }}>
            {step === "idle" ? "IDLE" : step === "done" ? "COMPLETE" : "ACTIVE"}
          </span>
        </div>
      </div>

      {/* Session info */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--benchmark-border)", flexShrink: 0 }}>
        <div style={{ fontSize: "10px", color: "var(--benchmark-text-dim)", marginBottom: "4px", letterSpacing: "0.08em" }}>SESSION ID</div>
        <div style={{ fontSize: "11px", color: "var(--benchmark-white)", fontFamily: "DM Mono", wordBreak: "break-all" }}>{sessionId}</div>
      </div>

      {/* Logs */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
        {logs.length === 0 ? (
          <div style={{ padding: "0 20px", fontSize: "11px", color: "var(--benchmark-muted)", letterSpacing: "0.04em" }}>
            // No events yet
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ padding: "3px 20px", display: "flex", gap: "8px", fontFamily: "DM Mono", fontSize: "11px", lineHeight: 1.6 }}>
              <span style={{ color: "var(--benchmark-muted)", flexShrink: 0, fontSize: "10px" }}>{log.ts}</span>
              <span style={{ color: levelColors[log.level], flexShrink: 0, fontSize: "10px", minWidth: "44px", textAlign: "right" }}>{levelPrefixes[log.level]}</span>
              <span style={{ color: log.level === "success" ? "var(--benchmark-white)" : levelColors[log.level], wordBreak: "break-word" }}>{log.msg}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--benchmark-border)", flexShrink: 0 }}>
        <div style={{ fontSize: "10px", color: "var(--benchmark-muted)", letterSpacing: "0.06em" }}>
          BENCHMARK API v1 · {logs.length} events
        </div>
      </div>
    </div>
  );
}
