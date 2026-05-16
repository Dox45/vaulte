"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Network,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Building,
  BarChart3,
  Lock,
  Scale,
  GitBranch,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StripeHeroVisual } from "./StripeHeroVisual";

export function BenchmarkLandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  return (
    <div className="min-h-screen bg-[#ffffff] text-[#151d1e] font-sans antialiased selection:bg-[#635bff]/20">
      {/* TopNavBar */}
     

<nav className="sticky top-0 z-50 w-full bg-[#ffffff]/80 backdrop-blur-xl border-b border-[#b9cacb]/30">
  <div className="flex justify-between items-center h-16 w-full px-4 sm:px-6 md:px-[64px] max-w-7xl mx-auto">

    {/* Left */}
    <div className="flex items-center gap-4 md:gap-[4rem]">
      <span className="text-[20px] sm:text-[24px] font-bold tracking-tight text-[#151d1e] whitespace-nowrap">
        Benchmark
      </span>

      <div className="hidden md:flex gap-[1.5rem]">
        <a
          href="/docs"
          className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
        >
          Docs
        </a>

        <a
          href="/api"
          className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
        >
          API Reference
        </a>
      </div>
    </div>

    {/* Desktop */}
    <div className="hidden lg:flex items-center gap-[1.25rem]">
      <button
        onClick={() => router.push('/signin')}
        className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
      >
        Vendor Sign In
      </button>

      <button
        onClick={() => router.push('/signup')}
        className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
      >
        Vendor Sign Up
      </button>

      <div className="w-px h-6 bg-[#b9cacb]/50 mx-1"></div>

      <button
        onClick={() => router.push('/developer/signin')}
        className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
      >
        Developer Log In
      </button>

      <button
        onClick={() => router.push('/developer/signup')}
        className="bg-[#635bff] text-[#ffffff] px-[1.25rem] py-[0.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono"
      >
        Get API Key
      </button>
    </div>

    {/* Mobile Menu Button */}
    <button
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className="lg:hidden flex flex-col justify-center gap-1.5"
    >
      <span className="w-5 h-px bg-[#151d1e]" />
      <span className="w-5 h-px bg-[#151d1e]" />
      <span className="w-5 h-px bg-[#151d1e]" />
    </button>
  </div>

  {/* Mobile Dropdown */}
  {mobileMenuOpen && (
    <div className="lg:hidden border-t border-[#b9cacb]/30 bg-white/95 backdrop-blur-xl px-4 py-5">
      <div className="flex flex-col gap-4">

        <a
          href="/docs"
          className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
        >
          Docs
        </a>

        <a
          href="/api"
          className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
        >
          API Reference
        </a>

        <div className="w-full h-px bg-[#b9cacb]/30 my-1" />

        <button
          onClick={() => router.push('/signin')}
          className="text-left text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
        >
          Vendor Sign In
        </button>

        <button
          onClick={() => router.push('/signup')}
          className="text-left text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
        >
          Vendor Sign Up
        </button>

        <button
          onClick={() => router.push('/developer/signin')}
          className="text-left text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
        >
          Developer Log In
        </button>

        <button
          onClick={() => router.push('/developer/signup')}
          className="mt-2 bg-[#635bff] text-[#ffffff] px-[1.25rem] py-[0.75rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] transition-all font-mono w-full"
        >
          Get API Key
        </button>
      </div>
    </div>
  )}
</nav>

      {/* Main Container */}
      <main
        className="min-h-screen"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      >
        {/* Hero Section */}
        <section className="relative py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[4rem] items-start relative z-10 pt-4">
            <div className="flex flex-col gap-[1.5rem] pt-6 md:pt-20">
              <h1 className="text-[48px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#151d1e]">
                The Infrastructure <span className="text-[#635bff]">For Credible Commerce In Africa</span>
              </h1>
              <p className="text-[18px] leading-[1.6] tracking-[-0.01em] text-[#3b494b] max-w-lg">
                Powered by Squad's API stack, Benchmark solves the <strong className="text-[#151d1e]">₦5.2 billion e-commerce fraud problem</strong> by verifying vendors before they receive a single payment.
              </p>
              <div className="flex flex-wrap gap-[1.5rem] mt-[1rem]">
                <button
                  onClick={() => router.push('/developer/signup')}
                  className="bg-[#635bff] text-[#ffffff] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono">
                  Integrate SDK →
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="border border-[#b9cacb] text-[#151d1e] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg hover:bg-[#e7eff0] transition-all font-mono">
                  Become a Vendor
                </button>
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="absolute inset-0 bg-[#635bff]/20 blur-[120px] rounded-full"></div>
              <StripeHeroVisual />
            </div>
          </div>
        </section>

        {/* The Problem Section - New */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto border-t border-[#b9cacb]/30">
          <div className="text-center max-w-3xl mx-auto mb-[4rem]">
            <span className="text-[12px] font-medium text-[#635bff] uppercase tracking-[0.05em] font-mono">The Trust Gap</span>
            <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.03em] text-[#151d1e] mt-2">
              Every day, Nigerians send money to vendors they cannot verify — and receive nothing.
            </h2>
            <p className="text-[16px] text-[#3b494b] mt-4">
              Payment processing works. Squad, Paystack, and Flutterwave handle the transaction flawlessly. But <strong>none of them tell you if the vendor is real</strong>. That's the infrastructure gap Benchmark closes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2.5rem]">
            <div className="bg-white/50 p-6 rounded-xl border border-[#b9cacb]/20">
              <div className="text-3xl font-bold text-[#635bff]">₦5.2B</div>
              <p className="text-[#3b494b] text-sm mt-2">Lost to e-commerce fraud in Nigeria (2023, NITDA)</p>
            </div>
            <div className="bg-white/50 p-6 rounded-xl border border-[#b9cacb]/20">
              <div className="text-3xl font-bold text-[#635bff]">63%</div>
              <p className="text-[#3b494b] text-sm mt-2">of online shoppers report being defrauded at least once</p>
            </div>
            <div className="bg-white/50 p-6 rounded-xl border border-[#b9cacb]/20">
              <div className="text-3xl font-bold text-[#635bff]">2M+</div>
              <p className="text-[#3b494b] text-sm mt-2">Informal social commerce vendors with no verification layer</p>
            </div>
          </div>
        </section>

        {/* Three Parts */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex flex-col gap-[1rem] mb-[4rem] text-center">
            <span className="text-[12px] font-medium text-[#635bff] uppercase tracking-[0.05em] font-mono">
              The Three Layers
            </span>
            <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.03em] text-[#151d1e]">
              Identity. Escrow. Trust Score.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2.5rem]">
            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[2.5rem] flex flex-col gap-[1.5rem] rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-[#635bff]/20 flex items-center justify-center text-[#635bff]">
                <UserCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-[24px] font-bold leading-[1.3] text-[#151d1e]">1. Identity Verification</h3>
              <p className="text-[14px] leading-[1.5] text-[#3b494b]">
                AI-powered liveness detection + government ID comparison. A vendor proves they are a real person before receiving any payment. Computer vision ensures no deepfakes or static images.
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[2.5rem] flex flex-col gap-[1.5rem] rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-[#635bff]/20 flex items-center justify-center text-[#635bff]">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-[24px] font-bold leading-[1.3] text-[#151d1e]">2. Escrow on Squad</h3>
              <p className="text-[14px] leading-[1.5] text-[#3b494b]">
                Every payment is held in a dedicated Squad virtual account. The vendor never touches the money until the buyer confirms delivery or 72 hours pass. No delivery, no fraud pathway.
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[2.5rem] flex flex-col gap-[1.5rem] rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-[#635bff]/20 flex items-center justify-center text-[#635bff]">
                <BarChart3 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-[24px] font-bold leading-[1.3] text-[#151d1e]">3. Live Trust Score</h3>
              <p className="text-[14px] leading-[1.5] text-[#3b494b]">
                Every completed transaction, dispute, and on-time delivery updates a vendor's portable trust score. Buyers see it. Platforms use it. Vendors earn it.
              </p>
            </div>
          </div>
        </section>

        {/* Squad Integration Deep Dive */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto bg-[#edf5f6]/30 rounded-3xl my-8">
          <div className="flex flex-col gap-[1rem] mb-[4rem] text-center">
            <span className="text-[12px] font-medium text-[#635bff] uppercase tracking-[0.05em] font-mono">
              Load-Bearing Infrastructure
            </span>
            <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.03em] text-[#151d1e]">
              How Squad Powers Benchmark
            </h2>
            <p className="text-[16px] text-[#3b494b] max-w-2xl mx-auto">
              Squad is not a decorative integration. Remove Squad and Benchmark does not function. Here's exactly how:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { api: "Virtual Accounts", job: "Every escrow gets a dedicated Squad VA. Buyer pays in, money sits until delivery confirmation." },
              { api: "Payment Initiation", job: "Checkout URLs generated by Squad's transaction initiate endpoint. Benchmark wraps and delivers in one API call." },
              { api: "Webhooks", job: "`charge_successful` webhook triggers the entire AI anomaly detection pipeline. Without it, no analysis runs." },
              { api: "Transfer API", job: "On delivery confirmation, Squad's payout endpoint releases funds to vendor bank account automatically." },
              { api: "Refund API", job: "When an AI-classified dispute is upheld (85%+ confidence), Squad refund fires without human decision." },
              { api: "Account Lookup", job: "Validates vendor payout accounts during onboarding to prevent misdirected funds." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-[#b9cacb]/30">
                <code className="text-[#635bff] font-mono text-sm font-bold">{item.api}</code>
                <p className="text-[#3b494b] text-sm mt-1">{item.job}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI Technical Depth */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[80px] items-center">
            <div className="flex flex-col gap-[1.5rem]">
              <span className="text-[12px] font-medium text-[#635bff] uppercase tracking-[0.05em] font-mono">AI Technical Depth (30% of score)</span>
              <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.03em] text-[#151d1e]">
                Three Production AI Models
              </h2>
              <ul className="flex flex-col gap-[1rem]">
                <li className="flex items-start gap-[1rem] text-[14px] leading-[1.5] text-[#151d1e]">
                  <CheckCircle2 className="w-5 h-5 text-[#635bff] shrink-0 mt-0.5" />
                  <span><strong className="font-mono">Face Liveness + Document Verification</strong> — Computer vision compares live webcam feed against NIN slip. Detects blinks, head turns, deepfake variance.</span>
                </li>
                <li className="flex items-start gap-[1rem] text-[14px] leading-[1.5] text-[#151d1e]">
                  <CheckCircle2 className="w-5 h-5 text-[#635bff] shrink-0 mt-0.5" />
                  <span><strong className="font-mono">Behavioral Anomaly Detection (Isolation Forest)</strong> — Runs on every incoming payment webhook. Flags unusual velocity, amounts, or hours. Freezes vendor score and triggers review.</span>
                </li>
                <li className="flex items-start gap-[1rem] text-[14px] leading-[1.5] text-[#151d1e]">
                  <CheckCircle2 className="w-5 h-5 text-[#635bff] shrink-0 mt-0.5" />
                  <span><strong className="font-mono">NLP Dispute Classifier (distilBERT)</strong> — Classifies buyer dispute text into categories (non-delivery, counterfeit). Above 85% confidence, resolution and refund are automatic via Squad API.</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#ffffff] rounded-xl overflow-hidden border border-[#b9cacb]/30 shadow-[0_0_20px_rgba(99,91,255,0.15)]">
              <div className="flex items-center gap-[0.5rem] px-[1.5rem] py-[1rem] bg-[#e7eff0] border-b border-[#b9cacb]/30">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]/70"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#eac324]/70"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#635bff]/70"></div>
                <span className="ml-[1rem] text-[12px] font-mono text-[#3b494b]">anomaly_detection.py</span>
              </div>
              <div className="p-[2.5rem] text-[14px] leading-relaxed font-mono bg-[#edf5f6] overflow-x-auto">
                <pre className="text-[#151d1e] whitespace-pre-wrap text-xs">
{`from sklearn.ensemble import IsolationForest
import numpy as np

# Real-time anomaly detection on Squad webhook payload
def detect_anomaly(transaction_history, new_event):
    model = IsolationForest(contamination=0.1, random_state=42)
    features = extract_features(transaction_history)
    model.fit(features)
    prediction = model.predict([new_event])
    return "anomaly" if prediction[0] == -1 else "normal"`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* SDK Section */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex flex-col gap-[1rem] mb-[4rem] text-center">
            <span className="text-[12px] font-medium text-[#635bff] uppercase tracking-[0.05em] font-mono">For Developers</span>
            <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.03em] text-[#151d1e]">
              `npm install squadbenchjs`
            </h2>
            <p className="text-[16px] text-[#3b494b] max-w-2xl mx-auto">
              The official JavaScript SDK. Any marketplace, logistics platform, or cooperative can integrate the entire trust and escrow infrastructure in an afternoon.
            </p>
          </div>
          <div className="bg-[#ffffff] rounded-xl overflow-hidden border border-[#b9cacb]/30 shadow-[0_0_20px_rgba(99,91,255,0.15)] max-w-3xl mx-auto">
            <div className="flex items-center gap-[0.5rem] px-[1.5rem] py-[1rem] bg-[#e7eff0] border-b border-[#b9cacb]/30">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]/70"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#eac324]/70"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#635bff]/70"></div>
              <span className="ml-[1rem] text-[12px] font-mono text-[#3b494b]">example.js</span>
            </div>
            <div className="p-[2rem] text-[14px] leading-relaxed font-mono bg-[#edf5f6] overflow-x-auto">
              <pre className="text-[#151d1e] whitespace-pre-wrap text-xs">
{`const Benchmark = require('squadbenchjs');

const benchmark = new Benchmark({
  apiKey: process.env.BENCHMARK_API_KEY,
});

// Create an escrow transaction on behalf of a verified vendor
const escrow = await benchmark.b2b.createEscrow({
  vendor_id: 'vendor-uuid',
  amount: 45000,
  item_description: 'Samsung Galaxy A54',
  buyer_phone: '+2348099999999',
});

console.log(escrow.checkout_url);
// Returns Squad checkout URL, wrapped in Benchmark's trust layer`}
              </pre>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <button onClick={() => router.push('/docs')} className="text-[#635bff] font-mono text-sm underline">Read full SDK docs →</button>
          </div>
        </section>


        {/* CTA */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto text-center">
          <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[80px] rounded-3xl flex flex-col items-center gap-[2.5rem]">
            <h2 className="text-[48px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#151d1e] max-w-2xl">
              Start Using Benchmark Now!
            </h2>
            <div className="flex flex-wrap justify-center gap-[1.5rem]">
              <button onClick={() => router.push('/developer/signup')} className="bg-[#635bff] text-[#ffffff] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono">
                Get API Key
              </button>
              <button onClick={() => router.push('/signup')} className="border border-[#b9cacb] text-[#151d1e] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg hover:bg-[#e7eff0] transition-all font-mono">
                Become a Verified Vendor
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#ffffff] border-t border-[#b9cacb]/30 py-[4rem] mt-[80px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-[1.5rem] w-full px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex flex-col gap-[0.5rem] items-center md:items-start">
            <span className="font-mono text-[14px] font-bold text-[#151d1e]">Benchmark</span>
            <p className="text-[12px] font-medium text-[#3b494b] uppercase tracking-[0.05em] font-mono">© 2026 Benchmark Infrastructure. Built for the high-performance web.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-[2.5rem]">
            <a href="/docs" className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all">Docs</a>
            <a href="https://github.com/your-org/squadbenchjs" className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all">GitHub</a>
            <a href="#" className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all">Status</a>
            <a href="#" className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}