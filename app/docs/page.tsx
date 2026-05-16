"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Package, Shield, UserCheck, Zap, BookOpen, Code, ArrowRight } from "lucide-react";

export default function DocsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#151d1e] font-sans antialiased selection:bg-[#635bff]/20">
      {/* Navigation - Same as landing but simplified */}
      <nav className="sticky top-0 z-50 w-full bg-[#ffffff]/80 backdrop-blur-xl border-b border-[#b9cacb]/30">
        <div className="flex justify-between items-center h-16 w-full px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex items-center gap-[4rem]">
            <span onClick={() => router.push('/')} className="text-[24px] font-bold tracking-tight text-[#151d1e] cursor-pointer">
              Benchmark
            </span>
            <div className="hidden md:flex gap-[1.5rem]">
              <a href="/docs" className="text-[14px] tracking-wide text-[#635bff] font-medium transition-colors">Docs</a>
              <a href="/api" className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors">API Reference</a>
            </div>
          </div>
          <div className="flex items-center gap-[1.5rem]">
            <button onClick={() => router.push('/developer/signin')} className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors">Developer Log In</button>
            <button onClick={() => router.push('/developer/signup')} className="bg-[#635bff] text-[#ffffff] px-[1.5rem] py-[0.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono">Get API Key</button>
          </div>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto px-[20px] md:px-[64px] py-12">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 pr-8 border-r border-[#b9cacb]/30">
          <nav className="sticky top-24 flex flex-col gap-2">
            <span className="text-[10px] font-mono font-bold uppercase text-[#3b494b] tracking-wider mb-2">Getting Started</span>
            <a href="#intro" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Introduction</a>
            <a href="#installation" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Installation</a>
            <a href="#quickstart" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Quick Start</a>
            <span className="text-[10px] font-mono font-bold uppercase text-[#3b494b] tracking-wider mt-4 mb-2">Core Concepts</span>
            <a href="#vendors" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Vendors API</a>
            <a href="#escrow" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Escrow API</a>
            <a href="#b2b" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">B2B API</a>
            <a href="#webhooks" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Webhooks</a>
            <span className="text-[10px] font-mono font-bold uppercase text-[#3b494b] tracking-wider mt-4 mb-2">Resources</span>
            <a href="#errors" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Error Handling</a>
            <a href="#security" className="text-[#151d1e] text-sm py-1 hover:text-[#635bff]">Security</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pl-0 md:pl-12">
          <div className="prose prose-slate max-w-none">
            <div id="intro" className="mb-16">
              <h1 className="text-4xl font-extrabold tracking-tight text-[#151d1e] mb-4">Documentation</h1>
              <p className="text-lg text-[#3b494b]">Official JavaScript SDK for Benchmark — secure escrow, vendor trust verification, and payment infrastructure for e-commerce platforms.</p>
              <div className="bg-[#edf5f6] p-4 rounded-lg my-6 border border-[#b9cacb]/30">
                <code className="text-sm">npm install squadbenchjs</code>
              </div>
            </div>

            <div id="installation" className="mb-16">
              <h2 className="text-2xl font-bold text-[#151d1e] mb-4">Installation</h2>
              <div className="bg-[#edf5f6] p-4 rounded-lg">
                <code className="text-sm">npm install squadbenchjs</code>
              </div>
            </div>

            <div id="quickstart" className="mb-16">
              <h2 className="text-2xl font-bold text-[#151d1e] mb-4">Quick Start</h2>
              <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
{`const Benchmark = require('squadbenchjs');

const benchmark = new Benchmark({
  apiKey: process.env.BENCHMARK_API_KEY,
  baseUrl: 'https://api.benchmark.dev',
  webhookSecret: process.env.BENCHMARK_WEBHOOK_SECRET,
});`}
                </pre>
              </div>
              <h3 className="text-xl font-bold mt-6 mb-2">For Marketplaces and Platforms</h3>
              <p className="mb-4">Create a developer account, generate your API key, and start creating escrow transactions.</p>
              <h3 className="text-xl font-bold mt-6 mb-2">For Vendors</h3>
              <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
{`const Benchmark = require('squadbenchjs');

const benchmark = new Benchmark({
  baseUrl: 'https://api.benchmark.dev',
});

const { vendor, token } = await benchmark.vendors.register({
  business_name: 'Chukwu Electronics',
  category: 'Electronics',
  phone: '+2348012345678',
  payout_account_number: '0123456789',
  payout_bank_code: '000013',
  location_state: 'Lagos',
});`}
                </pre>
              </div>
            </div>

            <div id="vendors" className="mb-16">
              <h2 className="text-2xl font-bold text-[#151d1e] mb-4">Vendors API</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Register Vendor</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`await benchmark.vendors.register({
  business_name: 'Chukwu Electronics',
  category: 'Electronics',
  phone: '+2348012345678',
  nin: '12345678901',
  payout_account_number: '0123456789',
  payout_bank_code: '000013',
  location_state: 'Lagos',
});`}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Start Verification</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`const { session_id } = await benchmark.vendors.startVerification();`}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Get Vendor Score</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`const score = await benchmark.vendors.getScore('vendor-uuid');`}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Get Vendor Badge (SVG)</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`const svgMarkup = await benchmark.vendors.getBadge('vendor-uuid');`}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div id="escrow" className="mb-16">
              <h2 className="text-2xl font-bold text-[#151d1e] mb-4">Escrow API</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Create Escrow Transaction</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`const escrow = await benchmark.escrow.create({
  vendor_id: 'vendor-uuid',
  amount: 45000,
  item_description: 'Samsung Galaxy A54',
  buyer_phone: '+2348099999999',
});

console.log(escrow.checkout_url);`}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Confirm Delivery</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`await benchmark.escrow.confirmDelivery(confirmationToken);`}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Submit Dispute (AI-Powered)</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`const dispute = await benchmark.escrow.dispute(transactionId, 'I never received my package.');`}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div id="b2b" className="mb-16">
              <h2 className="text-2xl font-bold text-[#151d1e] mb-4">B2B API (For Marketplaces)</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Create Escrow on Behalf of Vendor</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`const escrow = await benchmark.b2b.createEscrow({
  vendor_id: 'vendor-uuid',
  amount: 25000,
  item_description: 'Order #12345',
  buyer_phone: '+2348088888888',
});`}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">List Verified Vendors</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`const { vendors } = await benchmark.b2b.listVendors({
  category: 'Electronics',
  location_state: 'Lagos',
  page: 1,
  limit: 20,
});`}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Programmatic Fund Release</h3>
                  <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{`await benchmark.b2b.releaseEscrow(transactionId, confirmationToken);`}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div id="webhooks" className="mb-16">
              <h2 className="text-2xl font-bold text-[#151d1e] mb-4">Webhooks</h2>
              <div className="bg-[#edf5f6] p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
{`app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const valid = benchmark.webhooks.validate(
    req.body.toString(),
    req.headers['x-squad-signature']
  );

  if (!valid) return res.status(401).send('Invalid signature');

  const event = benchmark.webhooks.parse(req.body);

  switch (event.event) {
    case 'charge.successful':
      // Trigger AI anomaly detection pipeline
      break;
    case 'transfer.success':
      // Vendor funds released
      break;
  }

  res.sendStatus(200);
});`}
                </pre>
              </div>
            </div>

            <div className="bg-[#635bff]/5 border border-[#635bff]/20 rounded-lg p-8 my-12 text-center">
              <h3 className="text-xl font-bold text-[#151d1e] mb-2">Ready to integrate?</h3>
              <p className="text-[#3b494b] mb-4">Get your API key and start protecting transactions in minutes.</p>
              <button onClick={() => router.push('/developer/signup')} className="bg-[#635bff] text-white px-6 py-2 rounded-lg font-mono text-sm inline-flex items-center gap-2">Get API Key <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        </main>
      </div>

      <footer className="bg-[#ffffff] border-t border-[#b9cacb]/30 py-[2rem] mt-[80px]">
        <div className="text-center text-[12px] font-mono text-[#3b494b]">
          © 2026 Benchmark Infrastructure. Built for Squad Hackathon 3.0.
        </div>
      </footer>
    </div>
  );
}