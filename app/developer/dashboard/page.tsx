"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, LogOut, CheckCircle2, ShieldAlert, Clock, Code2, Link2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Metrics {
  api_usage: { made: number; limit: number };
  webhook: { callback_url: string | null };
  verifications: { total: number; completed: number; failed: number; pending: number; processing: number; expired: number };
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("developer_token");
    if (!token) {
      router.push("/developer/signin");
      return;
    }

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/developer/dashboard/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMetrics(data.data);
        setWebhookUrl(data.data.webhook.callback_url || "");
      } catch (err) {
        localStorage.removeItem("developer_token");
        router.push("/developer/signin");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [router]);

  const handleRollKey = async () => {
    if (!confirm("Are you sure? Your old API key will stop working immediately.")) return;
    
    const token = localStorage.getItem("developer_token");
    try {
      const res = await fetch(`${API_BASE}/v1/developer/auth/api-keys/roll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNewApiKey(data.data.api_key);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error rolling key");
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    const token = localStorage.getItem("developer_token");
    try {
      const res = await fetch(`${API_BASE}/v1/developer/dashboard/webhook`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ callback_url: webhookUrl })
      });
      if (!res.ok) throw new Error("Invalid URL");
      alert("Webhook saved!");
    } catch (err) {
      alert("Failed to save webhook");
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    router.push("/developer/signin");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">Loading...</div>;
  if (!metrics) return null;

  return (
    <main className="theme-professional min-h-screen bg-[#f0f4f8] p-6 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 flex items-center justify-center rounded-xl shadow-lg">
              <span className="text-white font-black text-2xl">V</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Developer Dashboard</h1>
              <p className="text-sm text-slate-500 font-medium">Manage your infrastructure API</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-4">
                  <Code2 size={18} /> <span className="text-sm font-bold uppercase tracking-wider">API Calls</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{metrics.api_usage.made.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-2">Limit: {metrics.api_usage.limit.toLocaleString()}</div>
                <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    // style={{ width: `\${Math.min((metrics.api_usage.made / metrics.api_usage.limit) * 100, 100)}%\` }}
                    style={{
                          width: `${Math.min(
                            (metrics.api_usage.made / metrics.api_usage.limit) * 100,
                            100
                          )}%`
                        }}
                    ></div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-4">
                  <CheckCircle2 size={18} className="text-emerald-500" /> <span className="text-sm font-bold uppercase tracking-wider">Verified</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{metrics.verifications.completed.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-2">Successful sessions</div>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-4">
                  <Clock size={18} className="text-amber-500" /> <span className="text-sm font-bold uppercase tracking-wider">Pending</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{metrics.verifications.pending.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-2">Awaiting completion</div>
              </div>
            </div>

            {/* Verification Breakdown */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-8 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Verification Activity</h2>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <span className="text-sm font-medium text-slate-500">Total Sessions Created</span>
                <span className="font-bold text-slate-900">{metrics.verifications.total}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-2"><CheckCircle2 size={16}/> Completed</span>
                <span className="font-bold text-slate-900">{metrics.verifications.completed}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <span className="text-sm font-medium text-amber-600 flex items-center gap-2"><Clock size={16}/> In Progress</span>
                <span className="font-bold text-slate-900">{metrics.verifications.processing + metrics.verifications.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-rose-600 flex items-center gap-2"><ShieldAlert size={16}/> Failed / Expired</span>
                <span className="font-bold text-slate-900">{metrics.verifications.failed + metrics.verifications.expired}</span>
              </div>
            </div>

          </div>

          {/* Right Sidebar - Keys & Config */}
          <div className="space-y-8">
            
            {/* API Keys */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2">API Credentials</h2>
              <p className="text-xs text-slate-400 mb-6">Use this key in the <code className="text-indigo-400 bg-indigo-900/30 px-1 rounded">X-Api-Key</code> header to authenticate API requests.</p>
              
              {newApiKey ? (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">New API Key (Copy Now!)</label>
                  <div className="flex items-center gap-2 bg-black/50 p-3 rounded-xl border border-emerald-500/30">
                    <code className="text-emerald-400 text-sm font-mono truncate flex-1">{newApiKey}</code>
                    <button onClick={() => copyToClipboard(newApiKey)} className="text-slate-400 hover:text-white transition-colors">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current API Key</label>
                  <div className="bg-black/30 p-3 rounded-xl border border-slate-800 text-slate-500 font-mono text-sm">
                    sk_************************************
                  </div>
                </div>
              )}

              <button 
                onClick={handleRollKey}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Roll API Key
              </button>
            </div>

            {/* Webhooks */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-8 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Link2 size={20} className="text-indigo-500"/> Webhooks</h2>
              <p className="text-xs text-slate-500 mb-6">Receive async updates when verification sessions complete or fail.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Callback URL</label>
                  <input 
                    type="url" 
                    placeholder="https://api.yourdomain.com/webhooks/vaulte"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all text-sm"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSaveWebhook}
                  disabled={savingWebhook}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-200"
                >
                  {savingWebhook ? "Saving..." : "Save Config"}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
