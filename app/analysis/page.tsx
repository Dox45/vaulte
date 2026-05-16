// "use client";

// /**
//  * Fraud & Anomaly Detection Dashboard
//  * Drop-in Next.js page — add to your app/fraud/page.jsx or pages/fraud.jsx
//  *
//  * Connects to the Python FastAPI backend (default: http://localhost:8000)
//  * Override via NEXT_PUBLIC_FRAUD_API_URL env variable.
//  */

// import { useState, useEffect, useRef, useCallback } from "react";

// // ─── Config ───────────────────────────────────────────────────────────────────
// const API = process.env.NEXT_PUBLIC_FRAUD_API_URL || "http://localhost:8000";
// const WS  = API.replace(/^http/, "ws") + "/ws/live";

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const fmt = (n) =>
//   n >= 1_000_000
//     ? `₦${(n / 1_000_000).toFixed(2)}M`
//     : n >= 1_000
//     ? `₦${(n / 1_000).toFixed(1)}K`
//     : `₦${n?.toFixed(0) ?? 0}`;

// const pct = (n) => `${(n * 100).toFixed(1)}%`;

// const TIER_META = {
//   CRITICAL: { color: "#FF2D55", bg: "rgba(255,45,85,0.12)", glow: "0 0 12px rgba(255,45,85,0.5)", label: "CRITICAL" },
//   HIGH:     { color: "#FF9500", bg: "rgba(255,149,0,0.10)",  glow: "0 0 10px rgba(255,149,0,0.4)",  label: "HIGH"     },
//   MEDIUM:   { color: "#FFD60A", bg: "rgba(255,214,10,0.10)", glow: "0 0 8px rgba(255,214,10,0.3)",  label: "MEDIUM"   },
//   LOW:      { color: "#30D158", bg: "rgba(48,209,88,0.08)",  glow: "none",                           label: "LOW"      },
// };

// const FLAG_LABELS = {
//   IMPOSSIBLE_VELOCITY: "Impossible Velocity",
//   HIGH_VELOCITY:       "High Velocity",
//   UNUSUAL_AMOUNT:      "Unusual Amount",
//   VOLUME_SPIKE:        "Volume Spike",
//   OFF_HOURS:           "Off-Hours",
//   HIGH_RISK_GEO:       "High-Risk Geo",
//   STRUCTURED_AMOUNT:   "Structured Amount",
//   ML_ANOMALY:          "ML Anomaly",
// };

// const SIGNAL_LABELS = {
//   velocity:         "Velocity",
//   amount_deviation: "Amt Deviation",
//   frequency:        "Frequency",
//   geo_risk:         "Geo Risk",
//   ml_score:         "ML Score",
//   off_hours:        "Off-Hours",
//   round_number:     "Round Amt",
// };

// // ─── Mini Components ──────────────────────────────────────────────────────────

// function RiskBadge({ tier, size = "sm" }) {
//   const m = TIER_META[tier] || TIER_META.LOW;
//   const pad = size === "sm" ? "2px 8px" : "4px 14px";
//   const fs  = size === "sm" ? "10px" : "12px";
//   return (
//     <span style={{
//       display: "inline-flex", alignItems: "center", gap: 4,
//       background: m.bg, border: `1px solid ${m.color}`,
//       borderRadius: 4, padding: pad, fontSize: fs,
//       fontFamily: "'JetBrains Mono', monospace",
//       fontWeight: 700, color: m.color, boxShadow: m.glow,
//       letterSpacing: "0.06em", whiteSpace: "nowrap",
//     }}>
//       <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
//       {m.label}
//     </span>
//   );
// }

// function ScoreBar({ value, color }) {
//   return (
//     <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
//       <div style={{
//         height: "100%", width: `${(value * 100).toFixed(1)}%`,
//         background: `linear-gradient(90deg, ${color}99, ${color})`,
//         borderRadius: 3, transition: "width 0.6s ease",
//       }} />
//     </div>
//   );
// }

// function Metric({ label, value, sub, accent, pulse }) {
//   return (
//     <div style={{
//       background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
//       borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden",
//     }}>
//       {pulse && (
//         <span style={{
//           position: "absolute", top: 14, right: 14, width: 8, height: 8,
//           borderRadius: "50%", background: accent,
//           boxShadow: `0 0 6px ${accent}`,
//           animation: "pulse 1.4s infinite",
//         }} />
//       )}
//       <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
//       <div style={{ fontSize: 28, fontWeight: 800, color: accent || "#fff", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
//       {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
//     </div>
//   );
// }

// function SignalRadar({ signals }) {
//   const entries = Object.entries(signals || {});
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//       {entries.map(([key, val]) => {
//         const color = val > 0.7 ? "#FF2D55" : val > 0.4 ? "#FF9500" : val > 0.2 ? "#FFD60A" : "#30D158";
//         return (
//           <div key={key}>
//             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//               <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>{SIGNAL_LABELS[key] || key}</span>
//               <span style={{ fontSize: 11, color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{(val * 100).toFixed(0)}%</span>
//             </div>
//             <ScoreBar value={val} color={color} />
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function TxnRow({ txn, onClick, isSelected }) {
//   const a = txn.analysis;
//   const m = TIER_META[a.risk_tier] || TIER_META.LOW;
//   const dt = new Date(txn.timestamp * 1000);
//   const time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

//   return (
//     <div onClick={() => onClick(txn)} style={{
//       display: "grid", gridTemplateColumns: "90px 1fr 80px 90px 90px",
//       alignItems: "center", gap: 12, padding: "10px 16px",
//       background: isSelected ? "rgba(255,255,255,0.06)" : "transparent",
//       borderLeft: `2px solid ${isSelected ? m.color : "transparent"}`,
//       borderBottom: "1px solid rgba(255,255,255,0.04)",
//       cursor: "pointer", transition: "background 0.15s",
//     }}
//       onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
//       onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
//     >
//       <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>{time}</span>
//       <div>
//         <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{txn.merchant_name}</div>
//         <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>{txn.card_id} · {txn.geo?.city}</div>
//       </div>
//       <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(txn.amount)}</span>
//       <RiskBadge tier={a.risk_tier} />
//       <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//         <ScoreBar value={a.risk_score} color={m.color} />
//         <span style={{ fontSize: 10, color: m.color, fontFamily: "'JetBrains Mono', monospace", minWidth: 28 }}>{(a.risk_score * 100).toFixed(0)}%</span>
//       </div>
//     </div>
//   );
// }

// function DetailPanel({ txn, onClose }) {
//   if (!txn) return null;
//   const a = txn.analysis;
//   const m = TIER_META[a.risk_tier] || TIER_META.LOW;

//   return (
//     <div style={{
//       background: "rgba(10,10,18,0.98)", border: `1px solid ${m.color}33`,
//       borderRadius: 14, padding: 24, backdropFilter: "blur(20px)",
//     }}>
//       {/* Header */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
//         <div>
//           <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{txn.id}</div>
//           <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>{txn.merchant_name}</div>
//           <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{txn.merchant_category} · {txn.geo?.city}, {txn.geo?.country}</div>
//         </div>
//         <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
//       </div>

//       {/* Amount + Risk */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
//         <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 14 }}>
//           <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>AMOUNT</div>
//           <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(txn.amount)}</div>
//         </div>
//         <div style={{ background: m.bg, border: `1px solid ${m.color}44`, borderRadius: 8, padding: 14 }}>
//           <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>RISK SCORE</div>
//           <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: "'Space Grotesk', sans-serif" }}>{(a.risk_score * 100).toFixed(1)}%</div>
//         </div>
//       </div>

//       {/* Flags */}
//       {a.flags?.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, letterSpacing: "0.1em" }}>TRIGGERED FLAGS</div>
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//             {a.flags.map((f) => (
//               <span key={f} style={{
//                 background: "rgba(255,45,85,0.12)", border: "1px solid rgba(255,45,85,0.4)",
//                 borderRadius: 4, padding: "4px 8px", fontSize: 10,
//                 color: "#FF2D55", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
//               }}>{FLAG_LABELS[f] || f}</span>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Signal Breakdown */}
//       <div style={{ marginBottom: 20 }}>
//         <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, letterSpacing: "0.1em" }}>SIGNAL BREAKDOWN</div>
//         <SignalRadar signals={a.signals} />
//       </div>

//       {/* Behavioral Details */}
//       <div>
//         <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, letterSpacing: "0.1em" }}>BEHAVIORAL CONTEXT</div>
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
//           {[
//             ["Card ID", txn.card_id],
//             ["Location", `${txn.geo?.city}, ${txn.geo?.country}`],
//             ["Geo Risk", pct(txn.geo?.risk || 0)],
//             ["ML Anomaly", pct(a.ml_anomaly_score || 0)],
//             ["Velocity (km/h)", a.velocity_details?.km_per_hour?.toLocaleString() || "—"],
//             ["Impossible Move", a.velocity_details?.impossible ? "⚠ YES" : "No"],
//             ["Txns/hr (merchant)", a.frequency_details?.count_last_hour ?? "—"],
//             ["Expected/hr", a.frequency_details?.expected_hourly ?? "—"],
//             ["Volume Ratio", a.frequency_details?.ratio ? `${a.frequency_details.ratio}×` : "—"],
//             ["Off-Hours", a.off_hours ? "⚠ YES" : "No"],
//             ["Round Amount", a.round_amount ? "⚠ YES" : "No"],
//             ["DateTime", new Date(txn.timestamp * 1000).toLocaleString()],
//           ].map(([k, v]) => (
//             <div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 10px" }}>
//               <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{k}</div>
//               <div style={{ fontSize: 12, color: String(v).includes("⚠") ? "#FF9500" : "rgba(255,255,255,0.85)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{String(v)}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function HourlyChart({ data }) {
//   if (!data || Object.keys(data).length === 0) return null;
//   const hours = Array.from({ length: 24 }, (_, i) => i);
//   const maxTotal = Math.max(...hours.map((h) => data[h]?.total || 0), 1);

//   return (
//     <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 60, padding: "0 4px" }}>
//       {hours.map((h) => {
//         const total = data[h]?.total || 0;
//         const flagged = data[h]?.flagged || 0;
//         const totalH = (total / maxTotal) * 56;
//         const flaggedH = total > 0 ? (flagged / total) * totalH : 0;
//         return (
//           <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 56, position: "relative" }}>
//             <div style={{ width: "100%", height: totalH, background: "rgba(255,255,255,0.12)", borderRadius: "2px 2px 0 0", position: "relative", overflow: "hidden" }}>
//               <div style={{ position: "absolute", bottom: 0, width: "100%", height: flaggedH, background: "#FF2D55", opacity: 0.8 }} />
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function FlagChart({ data }) {
//   if (!data || Object.keys(data).length === 0) return null;
//   const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
//   const max = Math.max(...entries.map(([, v]) => v), 1);
//   const colors = ["#FF2D55", "#FF9500", "#FFD60A", "#BF5AF2", "#32ADE6", "#30D158"];

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//       {entries.map(([flag, count], i) => (
//         <div key={flag}>
//           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//             <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>{FLAG_LABELS[flag] || flag}</span>
//             <span style={{ fontSize: 10, color: colors[i], fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{count}</span>
//           </div>
//           <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
//             <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: colors[i], borderRadius: 3, transition: "width 0.8s ease" }} />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// // ─── Main Dashboard ───────────────────────────────────────────────────────────

// export default function FraudDashboard() {
//   const [metrics, setMetrics] = useState(null);
//   const [liveTransactions, setLiveTransactions] = useState([]);
//   const [selectedTxn, setSelectedTxn] = useState(null);
//   const [wsStatus, setWsStatus] = useState("connecting");
//   const [filter, setFilter] = useState("ALL");
//   const [tickCount, setTickCount] = useState(0);
//   const [lastTxnTime, setLastTxnTime] = useState(null);
//   const [apiError, setApiError] = useState(null);

//   const wsRef = useRef(null);
//   const metricsInterval = useRef(null);

//   // Fetch full metrics
//   const fetchMetrics = useCallback(async () => {
//     try {
//       const res = await fetch(`${API}/metrics`);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const data = await res.json();
//       setMetrics(data);
//       setApiError(null);
//     } catch (e) {
//       setApiError("Cannot reach API. Start the Python backend on port 8000.");
//     }
//   }, []);

//   // WebSocket live feed
//   useEffect(() => {
//     function connect() {
//       const ws = new WebSocket(WS);
//       wsRef.current = ws;

//       ws.onopen = () => setWsStatus("live");
//       ws.onclose = () => {
//         setWsStatus("reconnecting");
//         setTimeout(connect, 3000);
//       };
//       ws.onerror = () => setWsStatus("error");
//       ws.onmessage = (e) => {
//         const msg = JSON.parse(e.data);
//         if (msg.type === "transaction") {
//           const txn = msg.data;
//           setLiveTransactions((prev) => [txn, ...prev].slice(0, 300));
//           setLastTxnTime(Date.now());
//           setTickCount((c) => c + 1);
//         }
//       };
//     }
//     connect();
//     return () => wsRef.current?.close();
//   }, []);

//   // Poll metrics every 5s
//   useEffect(() => {
//     fetchMetrics();
//     metricsInterval.current = setInterval(fetchMetrics, 5000);
//     return () => clearInterval(metricsInterval.current);
//   }, [fetchMetrics]);

//   const displayTxns = liveTransactions.filter((t) =>
//     filter === "ALL" ? true : t.analysis?.risk_tier === filter
//   );

//   const liveSummary = {
//     total:    liveTransactions.length,
//     flagged:  liveTransactions.filter((t) => ["HIGH","CRITICAL"].includes(t.analysis?.risk_tier)).length,
//     critical: liveTransactions.filter((t) => t.analysis?.risk_tier === "CRITICAL").length,
//   };

//   const m = metrics;

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
//         * { box-sizing: border-box; margin: 0; padding: 0; }
//         body { background: #07070f; }
//         ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
//         @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
//         @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
//         @keyframes scanline { 0%{top:-100%} 100%{top:200%} }
//         @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
//         .txn-enter { animation: fadeInUp 0.25s ease both; }
//       `}</style>

//       <div style={{
//         minHeight: "100vh", background: "#07070f", color: "#fff",
//         fontFamily: "'Space Grotesk', sans-serif",
//         backgroundImage: `
//           radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,45,85,0.07) 0%, transparent 60%),
//           linear-gradient(180deg, rgba(255,45,85,0.03) 0%, transparent 30%)
//         `,
//       }}>

//         {/* Topbar */}
//         <div style={{
//           borderBottom: "1px solid rgba(255,255,255,0.07)",
//           padding: "0 32px",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//           height: 58, backdropFilter: "blur(10px)",
//           background: "rgba(7,7,15,0.8)", position: "sticky", top: 0, zIndex: 100,
//         }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             <div style={{
//               width: 32, height: 32, borderRadius: 8,
//               background: "linear-gradient(135deg, #FF2D55, #FF6B35)",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               fontSize: 15, boxShadow: "0 0 16px rgba(255,45,85,0.4)",
//             }}>⚡</div>
//             <div>
//               <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>SentinelIQ</div>
//               <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>FRAUD DETECTION ENGINE</div>
//             </div>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
//             {/* WS Status */}
//             <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//               <span style={{
//                 width: 7, height: 7, borderRadius: "50%",
//                 background: wsStatus === "live" ? "#30D158" : wsStatus === "connecting" ? "#FFD60A" : "#FF2D55",
//                 boxShadow: wsStatus === "live" ? "0 0 6px #30D158" : "none",
//                 display: "block", animation: wsStatus === "live" ? "pulse 2s infinite" : "none",
//               }} />
//               <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>
//                 {wsStatus === "live" ? "Live Feed" : wsStatus === "connecting" ? "Connecting…" : "Reconnecting…"}
//               </span>
//             </div>

//             <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
//               {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
//             </div>
//           </div>
//         </div>

//         {/* API Error Banner */}
//         {apiError && (
//           <div style={{ background: "rgba(255,45,85,0.12)", borderBottom: "1px solid rgba(255,45,85,0.3)", padding: "10px 32px", display: "flex", alignItems: "center", gap: 10 }}>
//             <span style={{ color: "#FF2D55", fontSize: 13 }}>⚠</span>
//             <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>{apiError}</span>
//             <code style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>python main.py</code>
//           </div>
//         )}

//         <div style={{ padding: "28px 32px", maxWidth: 1600, margin: "0 auto" }}>

//           {/* ── KPI Row ─────────────────────────────────────────────────────── */}
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
//             <Metric label="Total Transactions" value={(m?.total_transactions || liveSummary.total).toLocaleString()} sub="across all merchants" accent="#fff" />
//             <Metric label="Flagged" value={(m?.flagged_count || liveSummary.flagged).toLocaleString()} sub={`${pct(m?.flag_rate || (liveSummary.flagged / Math.max(liveSummary.total, 1)))} of volume`} accent="#FF9500" pulse />
//             <Metric label="Critical Alerts" value={(m?.critical_count || liveSummary.critical).toLocaleString()} sub="immediate review needed" accent="#FF2D55" pulse />
//             <Metric label="Suspicious Volume" value={fmt(m?.flagged_volume || 0)} sub={`of ${fmt(m?.total_volume || 0)} total`} accent="#FF2D55" />
//             <Metric label="Avg Risk Score" value={`${((m?.avg_risk_score || 0) * 100).toFixed(1)}%`} sub="composite anomaly score" accent="#BF5AF2" />
//             <Metric label="Live Txns" value={tickCount.toLocaleString()} sub="streamed this session" accent="#32ADE6" pulse />
//           </div>

//           {/* ── Main Grid ───────────────────────────────────────────────────── */}
//           <div style={{ display: "grid", gridTemplateColumns: selectedTxn ? "1fr 380px" : "1fr 320px", gap: 20, alignItems: "start" }}>

//             {/* Left Column */}
//             <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

//               {/* Transaction Feed */}
//               <div style={{
//                 background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
//                 borderRadius: 14, overflow: "hidden",
//               }}>
//                 {/* Feed Header */}
//                 <div style={{
//                   display: "flex", alignItems: "center", justifyContent: "space-between",
//                   padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
//                 }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                     <div style={{ fontWeight: 700, fontSize: 13 }}>Live Transaction Feed</div>
//                     {wsStatus === "live" && (
//                       <span style={{
//                         background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.3)",
//                         borderRadius: 4, padding: "2px 7px", fontSize: 9,
//                         color: "#30D158", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
//                         animation: "blink 2s infinite",
//                       }}>● LIVE</span>
//                     )}
//                   </div>
//                   {/* Filter Tabs */}
//                   <div style={{ display: "flex", gap: 4 }}>
//                     {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((f) => (
//                       <button key={f} onClick={() => setFilter(f)} style={{
//                         background: filter === f ? "rgba(255,255,255,0.1)" : "transparent",
//                         border: `1px solid ${filter === f ? "rgba(255,255,255,0.2)" : "transparent"}`,
//                         borderRadius: 6, padding: "4px 10px", fontSize: 10,
//                         color: filter === f ? "#fff" : "rgba(255,255,255,0.35)",
//                         cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
//                         letterSpacing: "0.05em",
//                       }}>{f}</button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Table Header */}
//                 <div style={{
//                   display: "grid", gridTemplateColumns: "90px 1fr 80px 90px 90px",
//                   gap: 12, padding: "8px 16px",
//                   borderBottom: "1px solid rgba(255,255,255,0.05)",
//                   fontSize: 9, color: "rgba(255,255,255,0.25)",
//                   fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
//                 }}>
//                   <span>TIME</span><span>MERCHANT / CARD</span><span style={{ textAlign: "right" }}>AMOUNT</span><span>RISK</span><span>SCORE</span>
//                 </div>

//                 {/* Transaction List */}
//                 <div style={{ maxHeight: 480, overflowY: "auto" }}>
//                   {displayTxns.length === 0 ? (
//                     <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
//                       Waiting for transactions…
//                     </div>
//                   ) : (
//                     displayTxns.slice(0, 100).map((txn, i) => (
//                       <div key={txn.id} className={i < 3 ? "txn-enter" : ""}>
//                         <TxnRow txn={txn} onClick={setSelectedTxn} isSelected={selectedTxn?.id === txn.id} />
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

//               {/* Bottom analytics row */}
//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

//                 {/* Hourly Heatmap */}
//                 <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
//                   <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Transaction Activity</div>
//                   <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
//                     Hourly distribution · <span style={{ color: "#FF2D55" }}>■</span> flagged
//                   </div>
//                   <HourlyChart data={m?.hourly_distribution} />
//                   <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
//                     <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>00:00</span>
//                     <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>12:00</span>
//                     <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>23:00</span>
//                   </div>
//                 </div>

//                 {/* Flag Frequency */}
//                 <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
//                   <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Anomaly Signal Frequency</div>
//                   <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
//                     Top triggered detection rules
//                   </div>
//                   <FlagChart data={m?.flag_frequency} />
//                 </div>
//               </div>
//             </div>

//             {/* Right Column */}
//             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

//               {/* Detail Panel */}
//               {selectedTxn ? (
//                 <DetailPanel txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
//               ) : (
//                 /* Merchant Leaderboard */
//                 <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
//                   <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Merchant Risk Exposure</div>
//                   <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>Click a transaction to inspect</div>
//                   {m?.merchant_summary ? (
//                     Object.entries(m.merchant_summary).map(([id, s]) => {
//                       const flagRate = s.count > 0 ? s.flagged / s.count : 0;
//                       const color = flagRate > 0.3 ? "#FF2D55" : flagRate > 0.15 ? "#FF9500" : "#30D158";
//                       return (
//                         <div key={id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
//                           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
//                             <span style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</span>
//                             <span style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{pct(flagRate)} flagged</span>
//                           </div>
//                           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
//                             <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>{s.count} txns · {fmt(s.amount)}</span>
//                             <span style={{ fontSize: 10, color: "#FF2D55", fontFamily: "'JetBrains Mono', monospace" }}>{s.flagged} alerts</span>
//                           </div>
//                           <ScoreBar value={flagRate} color={color} />
//                         </div>
//                       );
//                     })
//                   ) : (
//                     <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>Loading…</div>
//                   )}
//                 </div>
//               )}

//               {/* Critical Queue */}
//               <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,45,85,0.15)", borderRadius: 14, overflow: "hidden" }}>
//                 <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,45,85,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
//                   <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF2D55", boxShadow: "0 0 6px #FF2D55", display: "block", animation: "pulse 1.2s infinite" }} />
//                   <span style={{ fontWeight: 700, fontSize: 12 }}>Critical Alert Queue</span>
//                 </div>
//                 <div style={{ maxHeight: 280, overflowY: "auto" }}>
//                   {(m?.top_flagged || liveTransactions.filter((t) => t.analysis?.risk_tier === "CRITICAL"))
//                     .slice(0, 8)
//                     .map((t) => (
//                       <div key={t.id} onClick={() => setSelectedTxn(t)} style={{
//                         padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
//                         cursor: "pointer", transition: "background 0.15s",
//                       }}
//                         onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,45,85,0.05)"; }}
//                         onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
//                       >
//                         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//                           <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{t.merchant_name || t.name}</span>
//                           <span style={{ fontSize: 11, color: "#FF2D55", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{fmt(t.amount)}</span>
//                         </div>
//                         <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
//                           {(t.flags || t.analysis?.flags || []).slice(0, 3).map((f) => (
//                             <span key={f} style={{ fontSize: 9, color: "rgba(255,45,85,0.8)", fontFamily: "'JetBrains Mono', monospace" }}>#{f}</span>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                   {(m?.top_flagged?.length === 0 && liveSummary.critical === 0) && (
//                     <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>No critical alerts yet</div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div style={{
//           borderTop: "1px solid rgba(255,255,255,0.05)", margin: "0 32px",
//           padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center",
//         }}>
//           <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
//             SentinelIQ · Isolation Forest + Behavioral Profiling + Geo-Velocity Analysis
//           </span>
//           <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
//             API: {API} · {wsStatus.toUpperCase()}
//           </span>
//         </div>
//       </div>
//     </>
//   );
// }


"use client";

/**
 * Bench Analysis — Fraud & Anomaly Detection Dashboard
 * Drop-in Next.js page — add to your app/fraud/page.jsx or pages/fraud.jsx
 *
 * Connects to the Python FastAPI backend (default: http://localhost:8000)
 * Override via NEXT_PUBLIC_FRAUD_API_URL env variable.
 */

import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_FRAUD_API_URL || "http://localhost:8000";
const WS  = API.replace(/^http/, "ws") + "/ws/live";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  navy:       "#0A1628",
  navyMid:    "#0F2044",
  navyLight:  "#1A3560",
  blue:       "#1B5FCC",
  blueBright: "#2B72E8",
  blueAccent: "#4A90FF",
  white:      "#FFFFFF",
  offWhite:   "#F4F7FC",
  slate:      "#E8EDF5",
  muted:      "#8FA3BF",
  mutedDark:  "#5B7499",
  border:     "rgba(27,95,204,0.15)",
  borderHard: "rgba(27,95,204,0.28)",
  critical:   "#D92B3A",
  criticalBg: "rgba(217,43,58,0.08)",
  high:       "#E07B1A",
  highBg:     "rgba(224,123,26,0.08)",
  medium:     "#C9A820",
  mediumBg:   "rgba(201,168,32,0.08)",
  safe:       "#1A9E5C",
  safeBg:     "rgba(26,158,92,0.08)",
};

const fmt = (n) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(1)}K`
    : `₦${n?.toFixed(0) ?? 0}`;

const pct = (n) => `${(n * 100).toFixed(1)}%`;

const TIER_META = {
  CRITICAL: { color: T.critical, bg: T.criticalBg, border: "rgba(217,43,58,0.25)", label: "CRITICAL" },
  HIGH:     { color: T.high,     bg: T.highBg,     border: "rgba(224,123,26,0.25)", label: "HIGH"     },
  MEDIUM:   { color: T.medium,   bg: T.mediumBg,   border: "rgba(201,168,32,0.25)", label: "MEDIUM"   },
  LOW:      { color: T.safe,     bg: T.safeBg,     border: "rgba(26,158,92,0.25)",  label: "LOW"      },
};

const FLAG_LABELS = {
  IMPOSSIBLE_VELOCITY: "Impossible Velocity",
  HIGH_VELOCITY:       "High Velocity",
  UNUSUAL_AMOUNT:      "Unusual Amount",
  VOLUME_SPIKE:        "Volume Spike",
  OFF_HOURS:           "Off-Hours Activity",
  HIGH_RISK_GEO:       "High-Risk Geography",
  STRUCTURED_AMOUNT:   "Structured Amount",
  ML_ANOMALY:          "ML Anomaly",
};

const SIGNAL_LABELS = {
  velocity:         "Velocity",
  amount_deviation: "Amt Deviation",
  frequency:        "Frequency",
  geo_risk:         "Geo Risk",
  ml_score:         "ML Score",
  off_hours:        "Off-Hours",
  round_number:     "Round Amt",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ tier }) {
  const m = TIER_META[tier] || TIER_META.LOW;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: m.bg, border: `1px solid ${m.border}`,
      borderRadius: 3, padding: "2px 9px",
      fontSize: 9.5, fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 600, color: m.color, letterSpacing: "0.07em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function Bar({ value, color }) {
  return (
    <div style={{ width: "100%", height: 4, background: "rgba(27,95,204,0.1)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.min((value || 0) * 100, 100).toFixed(1)}%`,
        background: color, borderRadius: 2, transition: "width 0.5s ease",
      }} />
    </div>
  );
}

function KpiCard({ label, value, sub, color, pulse }) {
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: "18px 22px", position: "relative", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(10,22,40,0.055)",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "10px 10px 0 0" }} />
      {pulse && <span style={{ position: "absolute", top: 15, right: 15, width: 7, height: 7, borderRadius: "50%", background: color, animation: "baPulse 1.6s infinite" }} />}
      <div style={{ fontSize: 9.5, color: T.mutedDark, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color === T.blue ? T.navy : color, fontFamily: "'Sora', sans-serif", lineHeight: 1, letterSpacing: "-0.025em" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 7, fontFamily: "'IBM Plex Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

function TxnRow({ txn, onClick, isSelected }) {
  const a = txn.analysis;
  const m = TIER_META[a.risk_tier] || TIER_META.LOW;
  const time = new Date(txn.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div onClick={() => onClick(txn)} style={{
      display: "grid", gridTemplateColumns: "80px 1fr 90px 96px 88px",
      alignItems: "center", gap: 12, padding: "9px 18px",
      background: isSelected ? "rgba(27,95,204,0.055)" : "transparent",
      borderLeft: `3px solid ${isSelected ? T.blue : "transparent"}`,
      borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "background 0.12s",
    }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(27,95,204,0.028)"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{time}</span>
      <div>
        <div style={{ fontSize: 12, color: T.navy, fontWeight: 600 }}>{txn.merchant_name}</div>
        <div style={{ fontSize: 9.5, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>{txn.card_id} · {txn.geo?.city}</div>
      </div>
      <span style={{ fontSize: 11.5, color: T.navy, fontWeight: 700, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(txn.amount)}</span>
      <RiskBadge tier={a.risk_tier} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1 }}><Bar value={a.risk_score} color={m.color} /></div>
        <span style={{ fontSize: 10, color: m.color, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, minWidth: 28 }}>{(a.risk_score * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function DetailPanel({ txn, onClose }) {
  if (!txn) return null;
  const a = txn.analysis;
  const m = TIER_META[a.risk_tier] || TIER_META.LOW;
  return (
    <div style={{ background: T.white, border: `1px solid ${T.borderHard}`, borderRadius: 12, padding: 26, boxShadow: "0 4px 24px rgba(10,22,40,0.10)" }}>
      <div style={{ height: 4, background: m.color, borderRadius: "8px 8px 0 0", margin: "-26px -26px 20px" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>{txn.id}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.navy, letterSpacing: "-0.02em" }}>{txn.merchant_name}</div>
          <div style={{ fontSize: 11, color: T.mutedDark, marginTop: 3 }}>{txn.merchant_category} · {txn.geo?.city}, {txn.geo?.country}</div>
        </div>
        <button onClick={onClose} style={{ background: T.slate, border: `1px solid ${T.border}`, color: T.mutedDark, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ background: T.offWhite, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 9.5, color: T.muted, marginBottom: 5, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>AMOUNT</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{fmt(txn.amount)}</div>
        </div>
        <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 9.5, color: T.muted, marginBottom: 5, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>RISK SCORE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{(a.risk_score * 100).toFixed(1)}%</div>
        </div>
      </div>

      {a.flags?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9.5, color: T.mutedDark, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 9, letterSpacing: "0.1em" }}>TRIGGERED FLAGS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {a.flags.map((f) => (
              <span key={f} style={{ background: T.criticalBg, border: "1px solid rgba(217,43,58,0.22)", borderRadius: 3, padding: "3px 8px", fontSize: 9.5, color: T.critical, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{FLAG_LABELS[f] || f}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9.5, color: T.mutedDark, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12, letterSpacing: "0.1em" }}>SIGNAL BREAKDOWN</div>
        {Object.entries(a.signals || {}).map(([key, val]) => {
          const c = val > 0.7 ? T.critical : val > 0.4 ? T.high : val > 0.2 ? T.medium : T.safe;
          return (
            <div key={key} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, color: T.mutedDark, fontFamily: "'IBM Plex Mono', monospace" }}>{SIGNAL_LABELS[key] || key}</span>
                <span style={{ fontSize: 10.5, color: c, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{(val * 100).toFixed(0)}%</span>
              </div>
              <Bar value={val} color={c} />
            </div>
          );
        })}
      </div>

      <div>
        <div style={{ fontSize: 9.5, color: T.mutedDark, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10, letterSpacing: "0.1em" }}>BEHAVIOURAL CONTEXT</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {[
            ["Card ID",            txn.card_id],
            ["Location",           `${txn.geo?.city}, ${txn.geo?.country}`],
            ["Geo Risk",           pct(txn.geo?.risk || 0)],
            ["ML Anomaly",         pct(a.ml_anomaly_score || 0)],
            ["Velocity (km/h)",    a.velocity_details?.km_per_hour?.toLocaleString() || "—"],
            ["Impossible Move",    a.velocity_details?.impossible ? "⚠ YES" : "No"],
            ["Txns/hr",            a.frequency_details?.count_last_hour ?? "—"],
            ["Expected/hr",        a.frequency_details?.expected_hourly ?? "—"],
            ["Volume Ratio",       a.frequency_details?.ratio ? `${a.frequency_details.ratio}×` : "—"],
            ["Off-Hours",          a.off_hours ? "⚠ YES" : "No"],
            ["Round Amount",       a.round_amount ? "⚠ YES" : "No"],
            ["DateTime",           new Date(txn.timestamp * 1000).toLocaleString()],
          ].map(([k, v]) => (
            <div key={k} style={{ background: T.offWhite, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", color: String(v).includes("⚠") ? T.critical : T.navy }}>{String(v)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HourlyChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxTotal = Math.max(...hours.map((h) => data[h]?.total || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56, padding: "0 2px" }}>
      {hours.map((h) => {
        const total = data[h]?.total || 0;
        const flagged = data[h]?.flagged || 0;
        const totalH = (total / maxTotal) * 52;
        const flaggedH = total > 0 ? (flagged / total) * totalH : 0;
        return (
          <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 52 }}>
            <div style={{ width: "100%", height: totalH, background: "rgba(27,95,204,0.15)", borderRadius: "2px 2px 0 0", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: flaggedH, background: T.critical, opacity: 0.72 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlagChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const colors = [T.critical, T.high, T.medium, T.blue, T.blueAccent, T.safe];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {entries.map(([flag, count], i) => (
        <div key={flag}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: T.mutedDark, fontFamily: "'IBM Plex Mono', monospace" }}>{FLAG_LABELS[flag] || flag}</span>
            <span style={{ fontSize: 10, color: colors[i], fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{count}</span>
          </div>
          <div style={{ height: 4, background: "rgba(27,95,204,0.1)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: colors[i], borderRadius: 2, transition: "width 0.8s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BenchAnalysisDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [wsStatus, setWsStatus] = useState("connecting");
  const [filter, setFilter] = useState("ALL");
  const [tickCount, setTickCount] = useState(0);
  const [apiError, setApiError] = useState(null);
  const wsRef = useRef(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API}/metrics`);
      if (!res.ok) throw new Error();
      setMetrics(await res.json());
      setApiError(null);
    } catch {
      setApiError("Cannot reach API — start the Python backend on port 8000.");
    }
  }, []);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS);
      wsRef.current = ws;
      ws.onopen  = () => setWsStatus("live");
      ws.onclose = () => { setWsStatus("reconnecting"); setTimeout(connect, 3000); };
      ws.onerror = () => setWsStatus("error");
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "transaction") {
          setLiveTransactions((p) => [msg.data, ...p].slice(0, 300));
          setTickCount((c) => c + 1);
        }
      };
    }
    connect();
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  const m = metrics;
  const displayTxns = liveTransactions.filter((t) => filter === "ALL" || t.analysis?.risk_tier === filter);
  const liveSummary = {
    total:    liveTransactions.length,
    flagged:  liveTransactions.filter((t) => ["HIGH","CRITICAL"].includes(t.analysis?.risk_tier)).length,
    critical: liveTransactions.filter((t) => t.analysis?.risk_tier === "CRITICAL").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${T.offWhite}; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${T.slate}; }
        ::-webkit-scrollbar-thumb { background: rgba(27,95,204,0.22); border-radius: 3px; }
        @keyframes baPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(1.55)} }
        @keyframes baFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes baBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .ba-enter { animation: baFadeUp 0.22s ease both; }
      `}</style>

      <div style={{ minHeight: "100vh", background: T.offWhite, color: T.navy, fontFamily: "'Sora', sans-serif" }}>

        {/* ── Topbar ────────────────────────────────────────────────────────── */}
        <div style={{
          background: T.navy, borderBottom: `1px solid ${T.navyLight}`,
          padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 56, position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Logo mark — two stacked blue bars */}
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
              {[16, 22, 14, 20].map((h, i) => (
                <div key={i} style={{ width: 4, height: h, background: i % 2 === 0 ? T.blueAccent : T.blue, borderRadius: 1.5 }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700, fontSize: 16.5, color: T.white, letterSpacing: "-0.03em" }}>bench</span>
              <span style={{ fontWeight: 300, fontSize: 16.5, color: T.blueAccent, letterSpacing: "-0.03em" }}>analysis</span>
            </div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Fraud Intelligence
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", display: "block",
                background: wsStatus === "live" ? "#22C55E" : wsStatus === "connecting" ? "#F59E0B" : T.critical,
                animation: wsStatus === "live" ? "baPulse 2s infinite" : "none",
              }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em" }}>
                {wsStatus === "live" ? "LIVE" : wsStatus === "connecting" ? "CONNECTING" : "RECONNECTING"}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "'IBM Plex Mono', monospace" }}>
              {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
            <div style={{ background: "rgba(74,144,255,0.14)", border: "1px solid rgba(74,144,255,0.28)", borderRadius: 4, padding: "3px 10px", fontSize: 10, color: T.blueAccent, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
              {tickCount.toLocaleString()} events
            </div>
          </div>
        </div>

        {/* ── Breadcrumb bar ───────────────────────────────────────────────── */}
        <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 32px", height: 37, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10.5, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>Monitoring</span>
          <span style={{ fontSize: 10.5, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>/</span>
          <span style={{ fontSize: 10.5, color: T.blue, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>Transaction Anomaly Detection</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
            Isolation Forest · Geo-Velocity · Behavioural Profiling
          </span>
        </div>

        {/* ── API Error ────────────────────────────────────────────────────── */}
        {apiError && (
          <div style={{ background: "rgba(217,43,58,0.05)", borderBottom: "1px solid rgba(217,43,58,0.18)", padding: "9px 32px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: T.critical, fontSize: 12 }}>⚠</span>
            <span style={{ fontSize: 11.5, color: T.critical, fontFamily: "'IBM Plex Mono', monospace" }}>{apiError}</span>
            <code style={{ fontSize: 10.5, color: T.muted, marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace" }}>python main.py</code>
          </div>
        )}

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: "24px 32px", maxWidth: 1640, margin: "0 auto" }}>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(172px, 1fr))", gap: 12, marginBottom: 22 }}>
            <KpiCard label="Total Transactions"  value={(m?.total_transactions || liveSummary.total).toLocaleString()} sub="across all merchants"    color={T.blue}     />
            <KpiCard label="Flagged"             value={(m?.flagged_count || liveSummary.flagged).toLocaleString()} sub={pct(m?.flag_rate || (liveSummary.flagged / Math.max(liveSummary.total,1)))} color={T.high} pulse />
            <KpiCard label="Critical Alerts"     value={(m?.critical_count || liveSummary.critical).toLocaleString()} sub="immediate review required" color={T.critical}  pulse />
            <KpiCard label="Suspicious Volume"   value={fmt(m?.flagged_volume || 0)} sub={`of ${fmt(m?.total_volume || 0)} total`}      color={T.critical}  />
            <KpiCard label="Avg Risk Score"      value={`${((m?.avg_risk_score || 0) * 100).toFixed(1)}%`} sub="composite anomaly score"        color={T.blue}     />
            <KpiCard label="Session Events"      value={tickCount.toLocaleString()} sub="streamed this session"                          color={T.safe}     pulse />
          </div>

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: selectedTxn ? "1fr 390px" : "1fr 310px", gap: 18, alignItems: "start" }}>

            {/* LEFT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Feed card */}
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(10,22,40,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 3, height: 16, background: T.blue, borderRadius: 2 }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: T.navy, letterSpacing: "-0.01em" }}>Live Transaction Feed</span>
                    {wsStatus === "live" && (
                      <span style={{ background: "rgba(26,158,92,0.1)", border: "1px solid rgba(26,158,92,0.28)", borderRadius: 3, padding: "2px 7px", fontSize: 9, color: T.safe, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", animation: "baBlink 2s infinite" }}>● LIVE</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map((f) => {
                      const active = filter === f;
                      const fc = { CRITICAL: T.critical, HIGH: T.high, MEDIUM: T.medium, LOW: T.safe, ALL: T.blue }[f];
                      return (
                        <button key={f} onClick={() => setFilter(f)} style={{
                          background: active ? fc : "transparent",
                          border: `1px solid ${active ? fc : T.border}`,
                          borderRadius: 4, padding: "3px 10px", fontSize: 9.5,
                          color: active ? "#fff" : T.mutedDark, cursor: "pointer",
                          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: "0.06em", transition: "all 0.12s",
                        }}>{f}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Column labels */}
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 90px 96px 88px", gap: 12, padding: "7px 18px", borderBottom: `1px solid ${T.border}`, background: T.offWhite, fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>
                  <span>TIME</span><span>MERCHANT / CARD</span><span style={{ textAlign: "right" }}>AMOUNT</span><span>RISK TIER</span><span>SCORE</span>
                </div>

                <div style={{ maxHeight: 460, overflowY: "auto" }}>
                  {displayTxns.length === 0
                    ? <div style={{ padding: "48px 20px", textAlign: "center", color: T.muted, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Waiting for transaction data…</div>
                    : displayTxns.slice(0, 100).map((txn, i) => (
                        <div key={txn.id} className={i < 3 ? "ba-enter" : ""}>
                          <TxnRow txn={txn} onClick={setSelectedTxn} isSelected={selectedTxn?.id === txn.id} />
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Analytics row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(10,22,40,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 3, height: 14, background: T.blue, borderRadius: 2 }} />
                    <span style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>Transaction Activity</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 14 }}>Hourly · <span style={{ color: T.critical }}>■</span> flagged</div>
                  <HourlyChart data={m?.hourly_distribution} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                    {["00:00","06:00","12:00","18:00","23:00"].map((l) => <span key={l} style={{ fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{l}</span>)}
                  </div>
                </div>

                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(10,22,40,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 3, height: 14, background: T.critical, borderRadius: 2 }} />
                    <span style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>Anomaly Signal Frequency</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 14 }}>Top triggered detection rules</div>
                  <FlagChart data={m?.flag_frequency} />
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {selectedTxn ? (
                <DetailPanel txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
              ) : (
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(10,22,40,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 3, height: 14, background: T.blue, borderRadius: 2 }} />
                    <span style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>Merchant Risk Exposure</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 16 }}>Click any transaction to inspect</div>
                  {m?.merchant_summary
                    ? Object.entries(m.merchant_summary).map(([id, s]) => {
                        const fr = s.count > 0 ? s.flagged / s.count : 0;
                        const c = fr > 0.3 ? T.critical : fr > 0.15 ? T.high : T.safe;
                        return (
                          <div key={id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{s.name}</span>
                              <span style={{ fontSize: 10, color: c, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{pct(fr)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{s.count} txns · {fmt(s.amount)}</span>
                              <span style={{ fontSize: 10, color: T.critical, fontFamily: "'IBM Plex Mono', monospace" }}>{s.flagged} alerts</span>
                            </div>
                            <Bar value={fr} color={c} />
                          </div>
                        );
                      })
                    : <div style={{ color: T.muted, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Loading…</div>
                  }
                </div>
              )}

              {/* Critical queue */}
              <div style={{ background: T.white, border: "1px solid rgba(217,43,58,0.2)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(10,22,40,0.04)" }}>
                <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(217,43,58,0.11)", display: "flex", alignItems: "center", gap: 8, background: "rgba(217,43,58,0.025)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.critical, display: "block", animation: "baPulse 1.4s infinite" }} />
                  <span style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>Critical Alert Queue</span>
                  {liveSummary.critical > 0 && (
                    <span style={{ marginLeft: "auto", background: T.critical, color: "#fff", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{liveSummary.critical}</span>
                  )}
                </div>
                <div style={{ maxHeight: 270, overflowY: "auto" }}>
                  {(m?.top_flagged || liveTransactions.filter((t) => t.analysis?.risk_tier === "CRITICAL"))
                    .slice(0, 8)
                    .map((t) => (
                      <div key={t.id} onClick={() => setSelectedTxn(t)} style={{ padding: "10px 18px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "background 0.12s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(217,43,58,0.035)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.navy }}>{t.merchant_name || t.name}</span>
                          <span style={{ fontSize: 11, color: T.critical, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{fmt(t.amount)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {(t.flags || t.analysis?.flags || []).slice(0, 3).map((f) => (
                            <span key={f} style={{ fontSize: 9, color: T.critical, fontFamily: "'IBM Plex Mono', monospace", opacity: 0.72 }}>#{f}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  {liveSummary.critical === 0 && !m?.top_flagged?.length && (
                    <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>No critical alerts</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${T.border}`, margin: "0 32px", padding: "12px 0", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>Bench Analysis · Isolation Forest + Geo-Velocity + Behavioural Profiling</span>
          <span style={{ fontSize: 10, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{API} · {wsStatus.toUpperCase()}</span>
        </div>
      </div>
    </>
  );
}