"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Metrics {
  partner?: { company_name: string; tier?: string };
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
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("developer_token");
    if (!token) {
      router.push("/developer/signin");
      return;
    }

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/developer/dashboard/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMetrics(data.data);
        setWebhookUrl(data.data.webhook?.callback_url || "");
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
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNewApiKey(data.data.api_key);
        setCopiedKey(false);
      } else {
        alert(data.message || "Failed to roll key");
      }
    } catch (err) {
      alert("Error rolling API key");
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ callback_url: webhookUrl }),
      });
      if (!res.ok) throw new Error("Invalid URL");
      alert("Webhook successfully saved!");
    } catch (err) {
      alert("Failed to save webhook configuration");
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    router.push("/developer/signin");
  };

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#635bff] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-500">Connecting to Benchmark Core...</span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  // Safe usage parsing
  const limit = metrics.api_usage?.limit || 10000;
  const made = metrics.api_usage?.made || 0;
  const usagePercent = Math.min(Math.round((made / limit) * 100), 100);

  // Deriving rates matching design placeholders dynamically
  const successRate = metrics.verifications?.total > 0 
    ? ((metrics.verifications.completed / metrics.verifications.total) * 100).toFixed(2)
    : "99.96";
  
  const errorRate = metrics.verifications?.total > 0 
    ? (((metrics.verifications.failed + metrics.verifications.expired) / metrics.verifications.total) * 100).toFixed(2)
    : "0.04";

  const companyName = metrics.partner?.company_name || "Workspace Admin";
  const subscriptionTier = metrics.partner?.tier || "Free Tier";
  
  // Format tier name cleanly
  const formattedTier = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1).toLowerCase() + (subscriptionTier.toLowerCase().includes('tier') ? '' : ' Tier');
  const avatarChars = companyName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'JD';

  return (
    <div className="flex min-h-screen bg-[#f9fafb] font-sans text-[#111827]">
      

      {/* Sidebar Shell — uses sidebarOpen for full open/close on ALL screen sizes */}
      <aside className={`w-64 border-r border-[#e5e7eb] bg-white flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Brand Tag */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-gray-100">
          <h1 className="text-base font-bold tracking-tight text-gray-900">Benchmark</h1>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none shrink-0"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
          </button>
        </div>

        {/* Navigation Core Links */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5">
          <button
            onClick={() => { setActiveTab("dashboard"); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-colors group ${activeTab === 'dashboard' ? 'bg-indigo-50 text-[#635bff]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <svg className={`h-4 w-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#635bff]' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab("keys"); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-colors group ${activeTab === 'keys' ? 'bg-indigo-50 text-[#635bff]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <svg className={`h-4 w-4 shrink-0 ${activeTab === 'keys' ? 'text-[#635bff]' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            <span>API Keys</span>
          </button>

          <button
            onClick={() => { setActiveTab("webhooks"); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-colors group ${activeTab === 'webhooks' ? 'bg-indigo-50 text-[#635bff]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <svg className={`h-4 w-4 shrink-0 ${activeTab === 'webhooks' ? 'text-[#635bff]' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
            <span>Webhooks</span>
          </button>

          <button
            onClick={() => { setActiveTab("logs"); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-colors group ${activeTab === 'logs' ? 'bg-indigo-50 text-[#635bff]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <svg className={`h-4 w-4 shrink-0 ${activeTab === 'logs' ? 'text-[#635bff]' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Logs</span>
          </button>

          <button
            onClick={() => { setActiveTab("settings"); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-colors group ${activeTab === 'settings' ? 'bg-indigo-50 text-[#635bff]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <svg className={`h-4 w-4 shrink-0 ${activeTab === 'settings' ? 'text-[#635bff]' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>Settings</span>
          </button>
        </nav>


        {/* Developer Badge Footer */}
        <div className="px-3 py-3 border-t border-[#e5e7eb] relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center shrink-0 min-w-0 pr-2">
              <div className="h-7 w-7 rounded-full bg-[#635bff] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {avatarChars}
              </div>
              <div className="ml-2.5 truncate">
                <p className="text-[13px] font-medium text-gray-700 truncate leading-tight">{companyName}</p>
                <p className="text-[11px] text-gray-500 truncate leading-tight">{formattedTier}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
              title="Sign out securely"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Dimmed backdrop when sidebar is open on small screens */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/30 lg:hidden"
        />
      )}

      {/* Main Container Core */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Top bar — always visible, hamburger only shows when sidebar is closed */}
        <div className="sticky top-0 z-20 flex items-center gap-3 p-4 border-b border-gray-200 bg-white/80 backdrop-blur-md">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none shrink-0"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          )}
          <div className={`min-w-0 ${!sidebarOpen ? 'border-l border-gray-200 pl-3' : ''}`}>
            <h2 className="text-sm font-semibold text-gray-900 truncate">Welcome back, {companyName}</h2>
            <p className="text-xs text-gray-500 truncate">Your Secure Commerce telemetry processing looks fully operational.</p>
          </div>
        </div>

        {/* Content Shell */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          


          {/* Conditional Layout Routing per tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              
              {/* Metric Overview Row */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* Simulated Avg Latency */}
                <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Latency</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                      -12ms
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <p className="text-3xl font-semibold text-gray-900 tracking-tight">42ms</p>
                  </div>
                </div>

                {/* Simulated / Real Error Rate */}
                <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Error Rate</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-100">
                      +{errorRate}%
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <p className="text-3xl font-semibold text-gray-900 tracking-tight">{errorRate}%</p>
                  </div>
                </div>

                {/* Simulated / Real Success Rate */}
                <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                      99.9%
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <p className="text-3xl font-semibold text-gray-900 tracking-tight">{successRate}%</p>
                  </div>
                </div>

              </section>



              {/* Lists Layout section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Active Key Status list container */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
                      <h3 className="text-sm font-semibold text-gray-900">Active API Keys</h3>
                      <button onClick={() => setActiveTab("keys")} className="text-xs font-semibold text-[#635bff] hover:underline">
                        Manage Key Secret
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      
                      {/* Primary App integration entry */}
                      <div className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                        <div className="flex flex-col gap-0.5 truncate pr-2">
                          <p className="text-xs font-semibold text-gray-900">Production Secret Token</p>
                          <p className="text-[11px] text-gray-500 font-mono truncate">
                            {newApiKey ? `${newApiKey.slice(0, 16)}...` : "sk_live_...****************"}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-700 uppercase tracking-wide border border-green-100 shrink-0">
                          Active Ready
                        </span>
                      </div>

                      {/* Hardcoded auxiliary placeholders matching stitch */}
                      <div className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                        <div className="flex flex-col gap-0.5 truncate pr-2">
                          <p className="text-xs font-semibold text-gray-900">Staging Debug Tunnel</p>
                          <p className="text-[11px] text-gray-400 font-mono truncate">sk_test_...a982</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-gray-50 text-gray-500 uppercase tracking-wide border border-gray-200 shrink-0">
                          Test Node
                        </span>
                      </div>

                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
                    <button 
                      type="button" 
                      onClick={handleRollKey} 
                      className="text-xs font-medium text-gray-600 hover:text-[#635bff] transition-colors inline-flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      <span>Instantly Roll Legacy API Keys</span>
                    </button>
                  </div>
                </div>

                {/* Webhook Targets List Container */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
                      <h3 className="text-sm font-semibold text-gray-900">Webhook Interceptors</h3>
                      <span className="text-[10px] font-mono text-gray-400">SSL Enabled</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      
                      {/* Dynamic Primary hook configured route */}
                      <div className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center truncate pr-2">
                          <div className={`h-2 w-2 rounded-full ${webhookUrl ? 'bg-green-500' : 'bg-amber-400'} mr-3 shrink-0`}></div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {webhookUrl || "No endpoint active yet"}
                            </p>
                            <p className="text-[10px] text-gray-400">Push status destination bound</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-500 shrink-0">
                          {webhookUrl ? "200 OK" : "IDLE"}
                        </span>
                      </div>

                      {/* Hardcoded auxiliary placeholders matching stitch */}
                      <div className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center truncate pr-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-3 shrink-0"></div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-gray-900 truncate">checkout.session.completed</p>
                            <p className="text-[10px] text-gray-400">Triggered 2m ago</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">200 OK</span>
                      </div>

                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-center">
                    <button 
                      type="button" 
                      onClick={() => setActiveTab("webhooks")}
                      className="text-xs font-medium text-[#635bff] hover:underline"
                    >
                      Update Delivery Address Target →
                    </button>
                  </div>
                </div>

              </div>

              {/* Complete Metric Status Array block */}
              <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e7eb] bg-white">
                  <h3 className="text-sm font-semibold text-gray-900">Verification Processing Pipelines</h3>
                  <p className="text-[11px] text-gray-500">Aggregated telemetry payload verification counters</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-2.5">Pipeline Step</th>
                        <th className="px-6 py-2.5">Evaluated Counts</th>
                        <th className="px-6 py-2.5">Integrity Metric</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">Total Checkouts Logged</td>
                        <td className="px-6 py-3 font-mono text-[#635bff] font-semibold">{metrics.verifications?.total || 0}</td>
                        <td className="px-6 py-3"><span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">Tracked</span></td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">Successful Clearances</td>
                        <td className="px-6 py-3 font-mono text-gray-900">{metrics.verifications?.completed || 0}</td>
                        <td className="px-6 py-3"><span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 font-semibold rounded border border-green-100">Optimal</span></td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">Pending Execution Wait</td>
                        <td className="px-6 py-3 font-mono text-gray-500">{(metrics.verifications?.pending || 0) + (metrics.verifications?.processing || 0)}</td>
                        <td className="px-6 py-3"><span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100">Queueing</span></td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">Failed / Authentication Expirations</td>
                        <td className="px-6 py-3 font-mono text-red-600">{(metrics.verifications?.failed || 0) + (metrics.verifications?.expired || 0)}</td>
                        <td className="px-6 py-3"><span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 rounded border border-red-100">Dropped</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Dedicated Tab 2: API Keys Management Core */}
          {activeTab === "keys" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-900">Master Secret Handshakes</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Authenticate outbound REST requests by appending the generated production string token inside standard application header packets.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col gap-1.5 max-w-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Authorization Signature</span>
                <code className="text-xs sm:text-sm font-mono font-bold text-[#635bff]">X-Api-Key: sk_live_...</code>
              </div>

              <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">Immediate Security Revocation</span>
                  <span className="text-[11px] text-gray-400">Instantly demotes older active access chains.</span>
                </div>
                <button
                  type="button"
                  onClick={handleRollKey}
                  className="h-10 px-4 rounded-lg bg-[#635bff] hover:bg-[#4e44e7] text-white font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 shrink-0 active:scale-[0.99]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  <span>Roll Authorization Credentials</span>
                </button>
              </div>

              {newApiKey && (
                <div className="mt-2 p-5 rounded-lg bg-gray-900 border border-gray-800 flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Success: Secret Master Array Reconstructed
                    </span>
                    <span className="text-[10px] text-gray-400">Store this safely.</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-black/40 border border-gray-800">
                    <span className="text-xs sm:text-sm font-mono text-gray-100 select-all break-all">{newApiKey}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(newApiKey)}
                      className="h-8 px-3 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors shrink-0 flex items-center justify-center gap-1"
                    >
                      <span>{copiedKey ? "Copied!" : "Copy String"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dedicated Tab 3: Webhooks Transport Controls */}
          {activeTab === "webhooks" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-900">Asynchronous Webhook Receivers</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Register a secure HTTPS target callback URI to automatically listen for real-time status shifts when pending transactions resolve.
                </p>
              </div>

              <div className="flex flex-col gap-2 max-w-xl">
                <label htmlFor="webhookConfigInput" className="text-xs font-semibold text-gray-700">
                  Target Transport Destination URL
                </label>
                <input
                  id="webhookConfigInput"
                  type="url"
                  placeholder="https://api.merchant.com/v1/webhooks/receiver"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-xs sm:text-sm outline-none focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]/20 transition-all"
                />
                <span className="text-[11px] text-gray-400">Payload notifications will automatically emit standard post strings directly to this address.</span>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-start">
                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  disabled={savingWebhook}
                  className="h-10 px-5 rounded-lg bg-[#635bff] hover:bg-[#4e44e7] text-white font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  <span>{savingWebhook ? "Persisting routing settings..." : "Commit Webhook Setup"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Auxiliary Simple tab placeholder for Logs list */}
          {activeTab === "logs" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-8 text-center flex flex-col items-center justify-center gap-2">
              <svg className="w-8 h-8 text-gray-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <h3 className="text-sm font-semibold text-gray-700">Real-time Node Log Transport Idle</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                No outbound debug streams captured during the initial polling execution interval. Traces will route instantly when active API handshakes resume.
              </p>
            </div>
          )}

          {/* Simple Tab 5: Settings placeholder matching stitch layout items */}
          {activeTab === "settings" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-gray-900">Workspace Configurations</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage developer access credentials, root company properties, and subscription active tier settings.
              </p>
              
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col gap-2 mt-2">
                <span className="text-xs font-semibold text-gray-700">Registered Root Entity</span>
                <p className="text-sm text-gray-900 font-medium">{companyName}</p>
                <span className="text-[11px] text-gray-400 mt-1">Tier Level: <strong className="text-[#635bff]">{formattedTier}</strong></span>
              </div>
            </div>
          )}

          {/* Simple Clean Canvas Footer shell */}
          <footer className="mt-16 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-600">Benchmark Security</span>
              <span>• High Performance Telemetry Core</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="#" className="hover:text-gray-600 transition-colors">API References</Link>
              <Link href="#" className="hover:text-gray-600 transition-colors">System Diagnostics</Link>
              <Link href="#" className="hover:text-gray-600 transition-colors">Transport SLA</Link>
            </div>
          </footer>

        </main>
      </div>

    </div>
  );
}
