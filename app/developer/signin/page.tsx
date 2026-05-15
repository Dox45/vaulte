"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DeveloperSignin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/v1/developer/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sign in");

      // Store JWT
      localStorage.setItem("developer_token", data.data.token);
      
      router.push('/developer/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-10 antialiased"
      style={{ backgroundColor: '#f9f9ff', color: '#121c2b', fontFamily: "'Geist', 'Inter', sans-serif" }}
    >
      <div className="w-full max-w-[420px] mx-auto flex flex-col gap-10">
        {/* Header */}
        <header className="text-center flex flex-col gap-2">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.01em]"
              style={{ fontFamily: "'Geist', sans-serif", color: '#121c2b' }}
            >
              Benchmark
            </h1>
          </Link>
          <p className="text-[15px] leading-[24px]"
            style={{ color: '#464555', fontFamily: "'Geist', sans-serif" }}
          >
            Sign in to your account
          </p>
        </header>

        {/* Login Card */}
        <div className="p-10 shadow-sm"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #c7c4d8',
            borderRadius: '4px',
          }}
        >
          {error && (
            <div className="mb-6 p-4 text-sm rounded-[4px]"
              style={{ backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', color: '#93000a' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-[13px] font-medium leading-[16px] tracking-[0.02em]"
                style={{ color: '#121c2b', fontFamily: "'Geist', sans-serif" }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full h-12 px-4 outline-none transition-colors"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #c7c4d8',
                  borderRadius: '2px',
                  color: '#121c2b',
                  fontFamily: "'Geist', sans-serif",
                  fontSize: '15px',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#635bff';
                  e.target.style.boxShadow = '0 0 0 1px #635bff';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#c7c4d8';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-[13px] font-medium leading-[16px] tracking-[0.02em]"
                  style={{ color: '#121c2b', fontFamily: "'Geist', sans-serif" }}
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-[13px] font-medium leading-[16px] tracking-[0.02em] transition-colors hover:opacity-80"
                  style={{ color: '#635bff', fontFamily: "'Geist', sans-serif" }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full h-12 px-4 pr-12 outline-none transition-colors"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #c7c4d8',
                    borderRadius: '2px',
                    color: '#121c2b',
                    fontFamily: "'Geist', sans-serif",
                    fontSize: '15px',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#635bff';
                    e.target.style.boxShadow = '0 0 0 1px #635bff';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#c7c4d8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: '#777587' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#464555')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#777587')}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center transition-opacity mt-4 active:scale-[0.98]"
              style={{
                backgroundColor: '#635bff',
                color: '#ffffff',
                borderRadius: '2px',
                fontFamily: "'Geist', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-6 my-2">
            <div className="flex-grow" style={{ borderTop: '1px solid #c7c4d8' }}></div>
            <span
              className="flex-shrink-0 px-4"
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                color: '#777587',
                backgroundColor: '#ffffff',
              }}
            >
              OR CONTINUE WITH
            </span>
            <div className="flex-grow" style={{ borderTop: '1px solid #c7c4d8' }}></div>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              className="w-full h-12 flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #c7c4d8',
                borderRadius: '2px',
                color: '#121c2b',
                fontFamily: "'Geist', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
              </svg>
              GitHub
            </button>
            <button
              type="button"
              className="w-full h-12 flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #c7c4d8',
                borderRadius: '2px',
                color: '#121c2b',
                fontFamily: "'Geist', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-[15px] leading-[24px]" style={{ color: '#464555', fontFamily: "'Geist', sans-serif" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/developer/signup"
              className="underline underline-offset-4 transition-colors"
              style={{ color: '#635bff', fontFamily: "'Geist', sans-serif", fontSize: '13px', fontWeight: 500 }}
            >
              Create one
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
