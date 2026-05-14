"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DeveloperSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({ company_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/v1/developer/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sign up");

      // Store JWT
      localStorage.setItem("developer_token", data.data.token);
      
      // Show API key
      setApiKey(data.data.api_key);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (apiKey) {
    return (
      <main className="theme-professional min-h-screen bg-[#f0f4f8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-indigo-100 p-10 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Vaulte</h1>
          <p className="text-slate-600 mb-6 text-sm">Your developer account has been created. Here is your master API key. <strong className="text-rose-500">Copy it now, it will not be shown again.</strong></p>
          
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-sm break-all mb-8 select-all">
            {apiKey}
          </div>

          <button 
            onClick={() => router.push('/developer/dashboard')}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="theme-professional min-h-screen bg-[#f0f4f8] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px]"></div>
      
      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-white/50 p-10 rounded-[2rem] shadow-2xl shadow-indigo-100/50 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-xl shadow-lg">
            <span className="text-white font-black text-xl">V</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Developer Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Infrastructure Access</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all"
              value={formData.company_name}
              onChange={e => setFormData({...formData, company_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required
              minLength={8}
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
          >
            {loading ? "Creating account..." : "Generate API Keys"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account? <Link href="/developer/signin" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
