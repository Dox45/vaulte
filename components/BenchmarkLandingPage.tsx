"use client";

import React from "react";
import { 
  UserCheck, 
  Network, 
  ShieldCheck, 
  CheckCircle2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StripeHeroVisual } from "./StripeHeroVisual";

export function BenchmarkLandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#151d1e] font-sans antialiased selection:bg-[#635bff]/20">
      {/* TopNavBar */}
      <nav className="sticky top-0 z-50 w-full bg-[#ffffff]/80 backdrop-blur-xl border-b border-[#b9cacb]/30">
        <div className="flex justify-between items-center h-16 w-full px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex items-center gap-[4rem]">
            <span className="text-[24px] font-bold tracking-tight text-[#151d1e]">
              Benchmark
            </span>
            <div className="hidden md:flex gap-[1.5rem]">
              <a 
                href="#docs" 
                className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
              >
                Docs
              </a>
              <a 
                href="#api" 
                className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
              >
                API Reference
              </a>
              <a 
                href="#pricing" 
                className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors"
              >
                Pricing
              </a>
            </div>
          </div>
          <div className="flex items-center gap-[1.5rem]">
            <button 
              onClick={() => router.push('/signin')}
              className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors">
              Sign In
            </button>
            <button 
              onClick={() => router.push('/signup')}
              className="bg-[#635bff] text-[#ffffff] px-[1.5rem] py-[0.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono">
              Get API Key
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container with subtle background grid */}
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
                The E-commerce API for <span className="text-[#635bff]">High-Growth</span> Teams
              </h1>
              <p className="text-[18px] leading-[1.6] tracking-[-0.01em] text-[#3b494b] max-w-lg">
                Build secure, scalable e-commerce sites without the complexity of virtual accounts, vendor verification, or infrastructure security. Just code.
              </p>
              <div className="flex flex-wrap gap-[1.5rem] mt-[1rem]">
                <button 
                  onClick={() => router.push('/signup')}
                  className="bg-[#635bff] text-[#ffffff] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono">
                  Get Started for Free
                </button>
                <button className="border border-[#b9cacb] text-[#151d1e] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg hover:bg-[#e7eff0] transition-all font-mono">
                  Read the Docs
                </button>
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="absolute inset-0 bg-[#635bff]/20 blur-[120px] rounded-full"></div>
              <StripeHeroVisual />
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex flex-col gap-[1rem] mb-[4rem]">
            <span className="text-[12px] font-medium text-[#635bff] uppercase tracking-[0.05em] font-mono">
              Infrastructure
            </span>
            <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.03em] text-[#151d1e]">
              Enterprise capabilities, simplified.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2.5rem]">
            {/* Card 1 */}
            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)] p-[2.5rem] flex flex-col gap-[1.5rem] group hover:translate-y-[-4px] transition-transform duration-300 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-[#635bff]/20 flex items-center justify-center text-[#635bff]">
                <UserCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-[24px] font-bold leading-[1.3] tracking-[-0.02em] text-[#151d1e]">
                Identity &amp; Verification
              </h3>
              <p className="text-[14px] leading-[1.5] text-[#3b494b]">
                Automated face and voice verification handled via API. Scale global onboarding without legal friction or manual checks.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)] p-[2.5rem] flex flex-col gap-[1.5rem] group hover:translate-y-[-4px] transition-transform duration-300 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-[#635bff]/20 flex items-center justify-center text-[#635bff]">
                <Network className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-[24px] font-bold leading-[1.3] tracking-[-0.02em] text-[#151d1e]">
                Virtual Infrastructure
              </h3>
              <p className="text-[14px] leading-[1.5] text-[#3b494b]">
                No more managing complex virtual account ledgers. Our dynamic vaulting system handles multi-currency distributions instantly.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)] p-[2.5rem] flex flex-col gap-[1.5rem] group hover:translate-y-[-4px] transition-transform duration-300 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-[#635bff]/20 flex items-center justify-center text-[#635bff]">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-[24px] font-bold leading-[1.3] tracking-[-0.02em] text-[#151d1e]">
                Hardened Security
              </h3>
              <p className="text-[14px] leading-[1.5] text-[#3b494b]">
                Enterprise-grade protection built into every endpoint. Zero-trust architecture ensures data integrity at every step of the transaction.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Section */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[80px] items-center">
            <div className="flex flex-col gap-[1.5rem]">
              <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.03em] text-[#151d1e]">
                Developer First. Always.
              </h2>
              <p className="text-[18px] leading-[1.6] tracking-[-0.01em] text-[#3b494b]">
                Our SDK is designed to get out of your way. With predictable REST patterns and type-safe payloads, you&apos;ll go from <code className="font-mono text-[#635bff]">init</code> to <code className="font-mono text-[#635bff]">production</code> in minutes.
              </p>
              <ul className="flex flex-col gap-[1rem] mt-[1rem]">
                <li className="flex items-center gap-[1rem] text-[14px] leading-[1.5] text-[#151d1e]">
                  <CheckCircle2 className="w-5 h-5 text-[#635bff] shrink-0" />
                  Native TypeScript Support
                </li>
                <li className="flex items-center gap-[1rem] text-[14px] leading-[1.5] text-[#151d1e]">
                  <CheckCircle2 className="w-5 h-5 text-[#635bff] shrink-0" />
                  Webhooks for Every Lifecycle Event
                </li>
                <li className="flex items-center gap-[1rem] text-[14px] leading-[1.5] text-[#151d1e]">
                  <CheckCircle2 className="w-5 h-5 text-[#635bff] shrink-0" />
                  Deterministic Error Handling
                </li>
              </ul>
            </div>
            <div className="bg-[#ffffff] rounded-xl overflow-hidden border border-[#b9cacb]/30 shadow-[0_0_20px_rgba(99,91,255,0.15)]">
              <div className="flex items-center gap-[0.5rem] px-[1.5rem] py-[1rem] bg-[#e7eff0] border-b border-[#b9cacb]/30">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]/70"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#eac324]/70"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#635bff]/70"></div>
                <span className="ml-[1rem] text-[12px] font-mono text-[#3b494b]">
                  transaction_service.js
                </span>
              </div>
              <div className="p-[2.5rem] text-[14px] leading-relaxed font-mono bg-[#edf5f6] overflow-x-auto">
                <div className="text-[#151d1e] whitespace-pre">
                  <div><span className="text-[#635bff]">const</span> benchmark = <span className="text-[#635bff] font-semibold">require</span>(<span className="text-[#715c00]">&apos;@benchmark/sdk&apos;</span>);</div>
                  <br />
                  <div><span className="text-[#6a7a7b]">// Create a new secure transaction</span></div>
                  <div><span className="text-[#635bff]">const</span> response = <span className="text-[#635bff]">await</span> benchmark.transactions.<span className="text-[#635bff] font-semibold">create</span>({"{"}</div>
                  <div>  amount: <span className="text-[#635bff] font-semibold">15000</span>,</div>
                  <div>  currency: <span className="text-[#715c00]">&apos;USD&apos;</span>,</div>
                  <div>  verify_identity: <span className="text-[#635bff]">true</span>,</div>
                  <div>  metadata: {"{"}</div>
                  <div>    order_id: <span className="text-[#715c00]">&apos;BC-9173&apos;</span></div>
                  <div>  {"}"}</div>
                  <div>{"});"}</div>
                  <br />
                  <div><span className="text-[#6a7a7b]">// Output response</span></div>
                  <div>console.<span className="text-[#635bff] font-semibold">log</span>(response.status); <span className="text-[#6a7a7b]">// =&gt; &apos;confirmed&apos;</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-[80px] px-[20px] md:px-[64px] max-w-7xl mx-auto text-center">
          <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)] p-[80px] rounded-3xl flex flex-col items-center gap-[2.5rem]">
            <h2 className="text-[48px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#151d1e] max-w-2xl">
              Ready to upgrade your commerce infrastructure?
            </h2>
            <div className="flex flex-wrap justify-center gap-[1.5rem]">
              <button className="bg-[#635bff] text-[#ffffff] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono">
                Get Started for Free
              </button>
              <button className="border border-[#b9cacb] text-[#151d1e] px-[2.5rem] py-[1.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg hover:bg-[#e7eff0] transition-all font-mono">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#ffffff] border-t border-[#b9cacb]/30 py-[4rem] mt-[80px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-[1.5rem] w-full px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex flex-col gap-[0.5rem] items-center md:items-start">
            <span className="font-mono text-[14px] font-bold text-[#151d1e]">
              Benchmark
            </span>
            <p className="text-[12px] font-medium text-[#3b494b] uppercase tracking-[0.05em] font-mono">
              © 2026 Benchmark Infrastructure. Built for the high-performance web.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-[2.5rem]">
            <a 
              href="#status" 
              className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all"
            >
              Status
            </a>
            <a 
              href="#github" 
              className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all"
            >
              GitHub
            </a>
            <a 
              href="#changelog" 
              className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all"
            >
              Changelog
            </a>
            <a 
              href="#privacy" 
              className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all"
            >
              Privacy
            </a>
            <a 
              href="#terms" 
              className="text-[12px] font-medium uppercase tracking-[0.05em] font-mono text-[#3b494b] hover:text-[#635bff] hover:underline underline-offset-4 transition-all"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
