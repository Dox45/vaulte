"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/vendors/login/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request OTP");

      setOtpToken(data.data.otp_token);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/vendors/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp_token: otpToken, otp_code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify OTP");

      // Save token
      localStorage.setItem("vendor_token", data.data.token);
      
      // Redirect
      router.push("/vendor/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff] text-[#121c2b] font-sans antialiased overflow-x-hidden selection:bg-[#635bff]/20">
      <main className="flex-grow flex items-center justify-center px-[32px] py-[4rem] relative">
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none overflow-hidden">
          <div className="grid grid-cols-12 w-full h-full">
            <div className="border-l border-[#777587] col-start-3"></div>
            <div className="border-l border-[#777587] col-start-6"></div>
            <div className="border-l border-[#777587] col-start-9"></div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[420px] mx-auto flex flex-col gap-[40px]">
          <header className="text-center flex flex-col gap-[8px]">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.01em] text-[#121c2b]">Welcome Back,</h1>
            </Link>
            <p className="text-[15px] leading-[24px] text-[#464555]">Sign in to your Storefront</p>
          </header>

          <div className="bg-[#ffffff] border border-[#c7c4d8] rounded-[8px] p-[40px] shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="flex flex-col gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-medium leading-[16px] tracking-[0.02em] text-[#121c2b]">Phone Number</label>
                  <input 
                    className="w-full h-[48px] px-[16px] border border-[#c7c4d8] rounded-[4px] bg-[#ffffff] text-[#121c2b] text-[15px] focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] outline-none transition-colors" 
                    placeholder="08012345678" required type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" disabled={loading}
                  className="w-full h-[48px] bg-[#635bff] hover:bg-[#4c42e9] text-[#ffffff] text-[13px] font-medium tracking-[0.02em] rounded-[4px] flex items-center justify-center transition-all mt-[16px] active:scale-[0.98] shadow-sm disabled:opacity-70"
                >
                  {loading ? "Sending OTP..." : "Continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-medium leading-[16px] tracking-[0.02em] text-[#121c2b]">Enter 6-digit OTP</label>
                  <input 
                    className="w-full h-[48px] px-[16px] border border-[#c7c4d8] rounded-[4px] bg-[#ffffff] text-[#121c2b] text-[15px] focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] outline-none transition-colors tracking-widest text-center text-lg font-mono" 
                    placeholder="123456" required type="text" maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" disabled={loading}
                  className="w-full h-[48px] bg-[#635bff] hover:bg-[#4c42e9] text-[#ffffff] text-[13px] font-medium tracking-[0.02em] rounded-[4px] flex items-center justify-center transition-all mt-[16px] active:scale-[0.98] shadow-sm disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Sign In"}
                </button>
              </form>
            )}
          </div>

          <div className="text-center">
            <p className="text-[15px] leading-[24px] text-[#464555]">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#635bff] hover:text-[#493ee5] transition-colors underline underline-offset-4 font-medium">Create one</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
