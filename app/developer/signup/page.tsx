"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DeveloperSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    password: "",
    platform_type: "single",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = apiKey;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  const platformDescriptions: Record<string, string> = {
    single: "Manage your own trusted store, KYC liveness, and locked escrow checkouts.",
    multi: "Onboard multiple vendors with automatic settlements and split payments.",
  };

  // API Key success screen
  if (apiKey) {
    return (
      <main
        className="flex flex-col min-h-screen antialiased"
        style={{ backgroundColor: '#f9f9ff', color: '#121c2b', fontFamily: "'Inter', 'Geist', sans-serif" }}
      >
        <div className="flex flex-col items-center justify-center px-4 flex-grow">
          <div className="relative z-10 w-full max-w-md">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <h1
                className="text-[32px] font-extrabold tracking-tight mb-1"
                style={{ fontFamily: "'Geist', sans-serif", color: '#121c2b' }}
              >
                Benchmark
              </h1>
              <p style={{ color: '#777587', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                Welcome aboard.
              </p>
            </div>

            {/* Card */}
            <div
              className="p-8 shadow-sm"
              style={{ backgroundColor: '#ffffff', border: '1px solid #c7c4d8' }}
            >
              <div className="flex flex-col items-center gap-5">
                {/* Success Icon */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(99, 91, 255, 0.08)' }}
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#635bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                {/* Title & Description */}
                <div className="text-center">
                  <h2
                    className="text-[22px] font-semibold mb-1.5"
                    style={{ fontFamily: "'Geist', sans-serif", color: '#121c2b' }}
                  >
                    Account Created
                  </h2>
                  <p className="text-[13px] leading-[20px]" style={{ color: '#464555', fontFamily: "'Inter', sans-serif" }}>
                    Your developer account is ready. Here is your master API key.
                  </p>
                  <p className="text-[12px] mt-1.5" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    Copy it now — it will not be shown again.
                  </p>
                </div>

                {/* API Key Display */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[11px] uppercase tracking-[0.1em]"
                      style={{ color: '#777587', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                    >
                      API Key
                    </span>
                    {copied && (
                      <span
                        className="text-[11px]"
                        style={{ color: '#635bff', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                      >
                        Copied!
                      </span>
                    )}
                  </div>
                  <div
                    className="relative w-full rounded-[4px] overflow-hidden"
                    style={{ backgroundColor: '#121c2b' }}
                  >
                    <div
                      className="p-4 pr-12 font-mono text-[13px] leading-[20px] break-all select-all"
                      style={{
                        color: '#c3c0ff',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {apiKey}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-[4px] transition-colors"
                      style={{ color: copied ? '#635bff' : '#777587' }}
                      onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = '#c3c0ff'; }}
                      onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = '#777587'; }}
                      title="Copy API key"
                    >
                      {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => router.push('/developer/dashboard')}
                  className="w-full h-12 flex items-center justify-center transition-opacity active:scale-[0.98] mt-1"
                  style={{
                    backgroundColor: '#635bff',
                    color: '#ffffff',
                    borderRadius: '4px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col min-h-screen antialiased"
      style={{ backgroundColor: '#f9f9ff', color: '#121c2b', fontFamily: "'Inter', 'Geist', sans-serif" }}
    >
      <div className="flex flex-col items-center px-4 py-16 sm:py-24 flex-grow" style={{ backgroundColor: '#f9f9ff' }}>
        <div className="relative z-10 w-full max-w-lg">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <h1
                className="text-[32px] font-extrabold tracking-tight mb-2"
                style={{ fontFamily: "'Geist', sans-serif", color: '#121c2b' }}
              >
                Benchmark
              </h1>
            </Link>
            <p style={{ color: '#464555', fontFamily: "'Inter', sans-serif", fontSize: '15px' }}>
              High performance infrastructure testing.
            </p>
          </div>

          {/* Registration Card */}
          <div
            className="p-8 shadow-sm"
            style={{ backgroundColor: '#ffffff', border: '1px solid #c7c4d8' }}
          >
            {error && (
              <div
                className="mb-6 p-4 text-sm"
                style={{
                  backgroundColor: '#ffdad6',
                  border: '1px solid #ba1a1a',
                  color: '#93000a',
                  borderRadius: '4px',
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5">
                {/* Business Name */}
                <div>
                  <label
                    htmlFor="business-name"
                    className="block mb-1.5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      color: '#121c2b',
                    }}
                  >
                    Business Name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    required
                    placeholder="Acme Infrastructure"
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full h-12 px-4 outline-none transition-all"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #777587',
                      borderRadius: '4px',
                      color: '#121c2b',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#635bff';
                      e.target.style.boxShadow = '0 0 0 1px #635bff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#777587';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Work Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-1.5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      color: '#121c2b',
                    }}
                  >
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="dev@benchmark.sh"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 px-4 outline-none transition-all"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #777587',
                      borderRadius: '4px',
                      color: '#121c2b',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#635bff';
                      e.target.style.boxShadow = '0 0 0 1px #635bff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#777587';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-1.5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      color: '#121c2b',
                    }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-12 px-4 pr-12 outline-none transition-all"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #777587',
                        borderRadius: '4px',
                        color: '#121c2b',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '15px',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#635bff';
                        e.target.style.boxShadow = '0 0 0 1px #635bff';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#777587';
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
              </div>

              {/* Platform Architecture Selection */}
              <div className="pt-2">
                <label
                  htmlFor="platform-selection"
                  className="block mb-1.5"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    color: '#121c2b',
                  }}
                >
                  Platform Architecture Selection
                </label>
                <select
                  id="platform-selection"
                  value={formData.platform_type}
                  onChange={e => setFormData({ ...formData, platform_type: e.target.value })}
                  className="w-full h-12 px-4 outline-none transition-all appearance-none"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #777587',
                    borderRadius: '4px',
                    color: '#121c2b',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '15px',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#635bff';
                    e.target.style.boxShadow = '0 0 0 1px #635bff';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#777587';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="single">Single-Vendor Storefront</option>
                  <option value="multi">Multi-Vendor Marketplace</option>
                </select>
                <p
                  className="mt-2 text-[12px] leading-[18px]"
                  style={{
                    color: '#777587',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {platformDescriptions[formData.platform_type]}
                </p>
              </div>

              {/* Create Account Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit as any}
                className="w-full h-12 flex items-center justify-center transition-all duration-200 mt-4 active:scale-[0.98]"
                style={{
                  backgroundColor: '#635bff',
                  color: '#ffffff',
                  borderRadius: '4px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: '1px solid #c7c4d8' }}></div>
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="px-4"
                    style={{
                      backgroundColor: '#ffffff',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase' as const,
                      color: '#464555',
                    }}
                  >
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Auth Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-11 transition-colors duration-200"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #777587',
                    borderRadius: '4px',
                    color: '#121c2b',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e7eeff')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  GitHub
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-11 transition-colors duration-200"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #777587',
                    borderRadius: '4px',
                    color: '#121c2b',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e7eeff')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                color: '#464555',
              }}
            >
              Already have an account?{" "}
              <Link
                href="/developer/signin"
                className="underline underline-offset-4 transition-colors"
                style={{ color: '#493ee5', textDecorationColor: 'rgba(73, 62, 229, 0.3)' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #c7c4d8', backgroundColor: '#ffffff' }}>
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-8 max-w-[1440px] mx-auto w-full">
          <div className="mb-4 md:mb-0">
            <span
              className="text-lg font-black"
              style={{ fontFamily: "'Geist', sans-serif", color: '#121c2b' }}
            >
              Benchmark
            </span>
            <p
              className="mt-1"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                color: '#464555',
              }}
            >
              © 2026 Benchmark. Built for performance.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {['Changelog', 'API Reference', 'Status', 'Privacy Policy', 'Terms'].map(link => (
              <a
                key={link}
                href="#"
                className="transition-colors duration-200 hover:underline underline-offset-4"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#464555',
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#493ee5')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#464555')}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
