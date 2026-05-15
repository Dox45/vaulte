"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import LivenessCheck from "@/components/LivenessCheck";
import VoiceChallenge from "@/components/VoiceChallenge";
import IdentityVerify from "@/components/IdentityVerify";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type VerificationStep = "identity" | "liveness" | "voice" | "completed" | "error";

export default function VerificationPage() {
  const { token } = useParams();
  const [step, setStep] = useState<VerificationStep>("identity");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ level: "info" | "success" | "error" | "warn"; msg: string; time: string }[]>([]);

  const addLog = useCallback((level: any, msg: string) => {
    setLogs(prev => [{ level, msg, time: new Date().toLocaleTimeString() }, ...prev]);
  }, []);

  useEffect(() => {
    async function validateSession() {
      try {
        const res = await fetch(`${API_BASE}/v1/verify/session/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Invalid or expired session");
        
        if (data.status === "completed") {
          setStep("completed");
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setStep("error");
        setLoading(false);
      }
    }
    if (token) validateSession();
  }, [token]);

  const handleIdentityComplete = () => {
    setStep("liveness");
  };

  const handleLivenessComplete = () => {
    setStep("voice");
  };

  const handleVoiceComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/verify/session/${token}/complete`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Finalization failed");
      setStep("completed");
    } catch (err: any) {
      setError(err.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="theme-professional min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Securing Connection...</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="theme-professional min-h-screen flex items-center justify-center bg-[#f0f4f8] p-6">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-red-100 p-10 rounded-2xl shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Session Error</h1>
          <p className="text-slate-500 mb-8">{error || "This verification link is invalid or has expired."}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === "completed") {
    return (
      <div className="theme-professional min-h-screen flex items-center justify-center bg-[#f0f4f8] p-6">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-indigo-100 p-10 rounded-3xl shadow-2xl text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Identity Verified</h1>
          <p className="text-slate-600 mb-10 leading-relaxed">Your verification is complete. The requesting partner has been notified of your status.</p>
          <div className="pt-6 border-t border-slate-100">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Secure Infrastructure by Benchmark</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="theme-professional min-h-screen bg-[#f0f4f8] text-slate-900 selection:bg-indigo-100 font-sans">
      {/* Background Orbs for Glassmorphism */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <nav className="h-20 border-b border-indigo-100/50 flex items-center px-8 lg:px-16 justify-between backdrop-blur-md sticky top-0 z-50 bg-white/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-200">
            <span className="text-white font-black text-xl">V</span>
          </div>
          <div>
            <span className="font-bold tracking-tight text-xl text-slate-900">Benchmark <span className="text-indigo-600">Verify</span></span>
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Secure Protocol 2.0</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted</div>
            <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Session Active
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_380px] gap-12 p-8 lg:p-16 relative z-10">
        {/* Main Interface */}
        <section className="flex flex-col">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-10 shadow-2xl shadow-indigo-100/50 relative overflow-hidden">
            {/* Step Indicator */}
            <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
              {[
                { id: "identity", label: "Identity", active: step === "identity" },
                { id: "liveness", label: "Liveness", active: step === "liveness" },
                { id: "voice", label: "Voice", active: step === "voice" }
              ].map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 shrink-0">
                  <div className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                    s.active 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                    : "bg-slate-100 text-slate-400"
                  }`}>
                    {idx + 1}. {s.label}
                  </div>
                  {idx < 2 && <div className="w-4 h-[2px] bg-slate-100"></div>}
                </div>
              ))}
            </div>

            <div className="min-h-[450px]">
              {step === "identity" && (
                <IdentityVerify 
                  sessionId={token as string} 
                  apiBase={API_BASE} 
                  endpoint={`/v1/verify/session/${token}/identity`}
                  onComplete={handleIdentityComplete}
                  addLog={addLog}
                />
              )}

              {step === "liveness" && (
                <LivenessCheck 
                  sessionId={token as string} 
                  apiBase={API_BASE} 
                  endpoints={{
                    challenge: `/v1/verify/session/${token}/liveness/challenge`,
                    submit: `/v1/verify/session/${token}/liveness`
                  }}
                  onComplete={handleLivenessComplete}
                  addLog={addLog}
                />
              )}

              {step === "voice" && (
                <VoiceChallenge 
                  sessionId={token as string} 
                  apiBase={API_BASE} 
                  endpoints={{
                    start: `/v1/verify/session/${token}/voice/start`,
                    verify: `/v1/verify/session/${token}/voice/verify`
                  }}
                  onComplete={handleVoiceComplete}
                  addLog={addLog}
                />
              )}
            </div>
          </div>
        </section>

        {/* Sidebar Logs */}
        <aside className="hidden lg:flex flex-col gap-8">
          <div className="bg-white/40 backdrop-blur-xl border border-white/50 p-8 rounded-[2rem] flex-1 max-h-[650px] flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Session Events</h3>
              <div className="px-2 py-1 bg-white/50 rounded-md text-[9px] font-mono text-slate-400 uppercase">Realtime</div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-5 pr-4 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="animate-fadeup">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      log.level === 'error' ? 'text-rose-500' : 
                      log.level === 'success' ? 'text-emerald-500' : 
                      'text-indigo-500'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed bg-white/30 p-3 rounded-xl border border-white/40 shadow-sm">
                    {log.msg}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                  System idle...
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200">
            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Security Protocol</div>
                <div className="text-xs font-bold">AES-256 Multi-layer</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @font-face {
          font-family: 'Sans';
          src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        }

        body {
          background-color: #f0f4f8 !important;
        }

        /* Override dark mode defaults for professional theme */
        .theme-professional .benchmark-btn-primary {
          background: #6366f1 !important;
          color: white !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
        }

        .theme-professional input {
          background: white !important;
          border: 1px solid rgba(99, 102, 241, 0.2) !important;
          border-radius: 12px !important;
          color: #1a202c !important;
        }
      `}</style>
    </main>
  );
}
