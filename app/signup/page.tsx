"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banks, setBanks] = useState([]);
  
  const [formData, setFormData] = useState({
    business_name: "",
    category: "",
    phone: "",
    payout_account_number: "",
    payout_bank_code: ""
  });

  useEffect(() => {
    // Fetch banks
    fetch(`${API_BASE}/api/vendors/banks`)
      .then(res => res.json())
      .then(data => setBanks(data.data?.banks || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/vendors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Registration failed");

      // Save vendor token
      localStorage.setItem("vendor_token", data.data.token);
      
      // Redirect to vendor dashboard
      router.push("/vendor/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff] text-[#151d1e] font-sans antialiased overflow-x-hidden selection:bg-[#635bff]/20">
      <main className="flex-grow flex items-center justify-center px-[32px] py-[4rem] relative">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden">
          <div className="grid grid-cols-12 w-full h-full">
            <div className="border-l border-[#6a7a7b] col-start-2"></div>
            <div className="border-l border-[#6a7a7b] col-start-4"></div>
            <div className="border-l border-[#6a7a7b] col-start-6"></div>
            <div className="border-l border-[#6a7a7b] col-start-8"></div>
            <div className="border-l border-[#6a7a7b] col-start-10"></div>
            <div className="border-l border-[#6a7a7b] col-start-12"></div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="flex flex-col items-center mb-[2.5rem]">
            <Link href="/" className="inline-block text-center hover:opacity-90 transition-opacity">
              <h1 className="text-[24px] font-extrabold tracking-tight text-[#151d1e]">Get started</h1>
            </Link>
            <p className="text-[#3b494b] mt-[0.5rem] text-[14px] font-semibold tracking-[0.02em]">
              Start selling in minutes.
            </p>
          </div>

          <div className="bg-[#ffffff] border border-[#b9cacb] p-[2.5rem] rounded-[8px] shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-[1.5rem]">
              <div>
                <label className="text-[14px] font-semibold tracking-[0.02em] text-[#151d1e] mb-[0.5rem] block">Business Name</label>
                <input 
                  className="w-full px-[1.5rem] py-[1rem] border border-[#b9cacb] focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] outline-none rounded-[4px] transition-all placeholder:text-[#6a7a7b] text-[16px]" 
                  placeholder="Acme Corp" required type="text"
                  value={formData.business_name}
                  onChange={e => setFormData({...formData, business_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[14px] font-semibold tracking-[0.02em] text-[#151d1e] mb-[0.5rem] block">Category</label>
                <select 
                  className="w-full px-[1.5rem] py-[1rem] border border-[#b9cacb] focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] outline-none rounded-[4px] transition-all text-[16px] bg-white" 
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[14px] font-semibold tracking-[0.02em] text-[#151d1e] mb-[0.5rem] block">Phone Number (Login ID)</label>
                <input 
                  className="w-full px-[1.5rem] py-[1rem] border border-[#b9cacb] focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] outline-none rounded-[4px] transition-all placeholder:text-[#6a7a7b] text-[16px]" 
                  placeholder="08012345678" required type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[14px] font-semibold tracking-[0.02em] text-[#151d1e] mb-[0.5rem] block">Bank</label>
                <select 
                  className="w-full px-[1.5rem] py-[1rem] border border-[#b9cacb] focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] outline-none rounded-[4px] transition-all text-[16px] bg-white" 
                  required
                  value={formData.payout_bank_code}
                  onChange={e => setFormData({...formData, payout_bank_code: e.target.value})}
                >
                  <option value="">Select Bank</option>
                  {banks.map((b: any) => (
                    <option key={b.bank_code} value={b.bank_code}>{b.bank_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[14px] font-semibold tracking-[0.02em] text-[#151d1e] mb-[0.5rem] block">Account Number</label>
                <input 
                  className="w-full px-[1.5rem] py-[1rem] border border-[#b9cacb] focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] outline-none rounded-[4px] transition-all placeholder:text-[#6a7a7b] text-[16px]" 
                  placeholder="1234567890" required type="text"
                  value={formData.payout_account_number}
                  onChange={e => setFormData({...formData, payout_account_number: e.target.value})}
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#ffffff] py-[1.5rem] rounded-[4px] text-[14px] font-semibold tracking-[0.02em] active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-70"
              >
                {loading ? "Registering..." : "Create Store"}
              </button>
            </form>
          </div>

          <div className="mt-[2.5rem] text-center">
            <p className="text-[#3b494b] text-[14px] font-semibold tracking-[0.02em]">
              Already selling? <Link href="/signin" className="text-[#151d1e] hover:text-[#635bff] transition-colors underline underline-offset-4 decoration-[#b9cacb]">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
