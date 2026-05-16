// app/api/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Copy, Check, BookOpen, Code, Users, Shield, Zap } from "lucide-react";

export default function ApiReferencePage() {
  const router = useRouter();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const sections = [
    { id: "vendors", title: "Vendors API", icon: Users },
    { id: "escrow", title: "Escrow API", icon: Shield },
    { id: "b2b", title: "B2B API", icon: BookOpen },
    { id: "webhooks", title: "Webhooks", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#151d1e] font-sans antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-[#ffffff]/80 backdrop-blur-xl border-b border-[#b9cacb]/30">
        <div className="flex justify-between items-center h-16 w-full px-[20px] md:px-[64px] max-w-7xl mx-auto">
          <div className="flex items-center gap-[4rem]">
            <span onClick={() => router.push('/')} className="text-[24px] font-bold tracking-tight text-[#151d1e] cursor-pointer">
              Benchmark
            </span>
            <div className="hidden md:flex gap-[1.5rem]">
              <a href="/docs" className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors">
                Docs
              </a>
              <a href="/api" className="text-[14px] tracking-wide text-[#635bff] font-medium transition-colors">
                API Reference
              </a>
            </div>
          </div>
          <div className="flex items-center gap-[1.5rem]">
            <button onClick={() => router.push('/developer/signin')} className="text-[14px] tracking-wide text-[#3b494b] hover:text-[#151d1e] transition-colors">
              Developer Log In
            </button>
            <button onClick={() => router.push('/developer/signup')} className="bg-[#635bff] text-[#ffffff] px-[1.5rem] py-[0.5rem] text-[12px] font-medium tracking-[0.05em] uppercase rounded-lg shadow-[0_0_20px_rgba(99,91,255,0.15)] hover:shadow-[0_0_30px_rgba(99,91,255,0.3)] transition-all font-mono">
              Get API Key
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#edf5f6]/30 border-b border-[#b9cacb]/30">
        <div className="max-w-7xl mx-auto px-[20px] md:px-[64px] py-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#151d1e] mb-4">
            API Reference
          </h1>
          <p className="text-lg text-[#3b494b] max-w-2xl">
            Complete documentation for the Benchmark API and <code className="bg-[#ffffff] px-2 py-0.5 rounded text-[#635bff] font-mono text-sm">squadbenchjs</code> SDK.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <code className="bg-[#ffffff] px-4 py-2 rounded-lg border border-[#b9cacb]/30 font-mono text-sm">
              npm install squadbenchjs
            </code>
            <button onClick={() => router.push('/developer/signup')} className="text-[#635bff] font-mono text-sm underline">
              Get your API key →
            </button>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto px-[20px] md:px-[64px] py-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 pr-8 sticky top-24 h-fit">
          <nav className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#3b494b] tracking-wider mb-2">Endpoints</span>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="flex items-center gap-2 text-[#3b494b] text-sm py-2 px-3 rounded-lg hover:bg-[#edf5f6] hover:text-[#151d1e] transition-colors">
                <section.icon className="w-3.5 h-3.5" />
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 lg:pl-8">
          {/* Vendors API */}
          <section id="vendors" className="mb-12 scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-[#635bff]" />
              <h2 className="text-2xl font-bold text-[#151d1e]">Vendors API</h2>
            </div>
            <p className="text-[#3b494b] mb-6">Endpoints for vendor registration, verification, and trust score management.</p>

            {/* POST /vendors/register */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="font-mono text-sm">/vendors/register</code>
                </div>
                <button onClick={() => copyToClipboard("POST /vendors/register", "vendors-register")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "vendors-register" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">Register a new vendor and initiate the verification process.</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Request Body
{
  "business_name": "Chukwu Electronics",    // required
  "category": "Electronics",                // required
  "phone": "+2348012345678",                // required
  "nin": "12345678901",                     // required
  "payout_account_number": "0123456789",    // required
  "payout_bank_code": "000013",             // required
  "location_state": "Lagos"                 // required
}

// Response
{
  "vendor": {
    "id": "vendor_uuid",
    "business_name": "Chukwu Electronics",
    "trust_score": 72,
    "score_tier": "Verified Seller"
  },
  "token": "jwt_token",
  "api_key": "vendor_api_key"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* POST /vendors/verification/start */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-[#635bff] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="font-mono text-sm">/vendors/verification/start</code>
                </div>
                <button onClick={() => copyToClipboard("POST /vendors/verification/start", "vendors-start")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "vendors-start" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">Start the AI liveness verification session. Returns a session ID for frame submission.</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Request (requires vendor JWT token)
{
  "redirect_url": "https://your-app.com/verification-callback"
}

// Response
{
  "session_id": "sess_123456",
  "instructions": {
    "blink_required": true,
    "head_turn_required": true
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* GET /vendors/:id/score */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-sky-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">GET</span>
                  <code className="font-mono text-sm">/vendors/:id/score</code>
                </div>
                <button onClick={() => copyToClipboard("GET /vendors/:id/score", "vendors-score")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "vendors-score" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">Get a vendor's current trust score and badge tier.</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Response
{
  "business_name": "Chukwu Electronics",
  "trust_score": 82,
  "score_tier": "Trusted Seller",
  "badge_svg_url": "https://api.benchmark.dev/badges/trusted-seller.svg"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Escrow API */}
          <section id="escrow" className="mb-12 scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-[#635bff]" />
              <h2 className="text-2xl font-bold text-[#151d1e]">Escrow API</h2>
            </div>
            <p className="text-[#3b494b] mb-6">Endpoints for creating and managing escrow transactions powered by Squad virtual accounts.</p>

            {/* POST /escrow/create */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="font-mono text-sm">/escrow/create</code>
                </div>
                <button onClick={() => copyToClipboard("POST /escrow/create", "escrow-create")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "escrow-create" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">Create a new escrow transaction. Generates a Squad checkout URL.</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Request Body
{
  "vendor_id": "vendor_uuid",           // required
  "amount": 45000,                      // required (in NGN)
  "item_description": "Samsung Galaxy A54", // required
  "buyer_phone": "+2348099999999",      // required
  "buyer_email": "buyer@example.com"    // optional
}

// Response
{
  "transaction_id": "txn_123456",
  "checkout_url": "https://checkout.squadco.com/pay/...",
  "confirmation_token": "confirm_token",
  "squad_va_account": "1234567890",
  "expires_at": "2026-05-20T12:00:00Z"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* POST /escrow/confirm-delivery */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="font-mono text-sm">/escrow/confirm-delivery</code>
                </div>
                <button onClick={() => copyToClipboard("POST /escrow/confirm-delivery", "escrow-delivery")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "escrow-delivery" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">Confirm delivery and trigger fund release to vendor via Squad Transfer API.</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Request Body
{
  "confirmation_token": "confirm_token",  // required
  "delivery_proof_url": "https://..."     // optional
}

// Response
{
  "escrow_status": "released",
  "transfer_reference": "trf_789012",
  "released_at": "2026-05-16T14:30:00Z"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* POST /escrow/dispute */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="font-mono text-sm">/escrow/dispute</code>
                </div>
                <button onClick={() => copyToClipboard("POST /escrow/dispute", "escrow-dispute")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "escrow-dispute" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">Submit a dispute. AI (distilBERT) classifies and auto-resolves if confidence {`>85%.`}</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Request Body
{
  "transaction_id": "txn_123456",        // required
  "reason": "I never received my package. Seller stopped responding."  // required
}

// Response
{
  "dispute_id": "disp_123",
  "category": "non-delivery",
  "confidence": 0.91,
  "status": "auto-resolved",
  "refund_triggered": true
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* B2B API */}
          <section id="b2b" className="mb-12 scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-[#635bff]" />
              <h2 className="text-2xl font-bold text-[#151d1e]">B2B API</h2>
            </div>
            <p className="text-[#3b494b] mb-6">For marketplaces and platforms — manage vendors and escrow programmatically.</p>

            {/* POST /b2b/escrow/create */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="font-mono text-sm">/b2b/escrow/create</code>
                </div>
                <button onClick={() => copyToClipboard("POST /b2b/escrow/create", "b2b-create")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "b2b-create" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">Create an escrow on behalf of a verified vendor (requires platform API key).</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Request Body
{
  "vendor_id": "vendor_uuid",           // required
  "amount": 25000,                      // required
  "item_description": "Order #12345",   // required
  "buyer_phone": "+2348088888888",      // required
  "buyer_email": "buyer@marketplace.com" // optional
}

// Response (same as /escrow/create)
{
  "transaction_id": "txn_789012",
  "checkout_url": "https://checkout.squadco.com/pay/...",
  "confirmation_token": "confirm_token"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* GET /b2b/vendors */}
            <div className="border border-[#b9cacb]/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-sky-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">GET</span>
                  <code className="font-mono text-sm">/b2b/vendors</code>
                </div>
                <button onClick={() => copyToClipboard("GET /b2b/vendors", "b2b-vendors")} className="text-[#3b494b] hover:text-[#635bff] transition-colors">
                  {copiedEndpoint === "b2b-vendors" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#3b494b] mb-3">List verified vendors with optional filters.</p>
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Query Parameters
?category=Electronics
&location_state=Lagos
&badge=Trusted Seller
&page=1
&limit=20

// Response
{
  "vendors": [...],
  "count": 47,
  "page": 1,
  "total_pages": 3
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="mb-12 scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-[#635bff]" />
              <h2 className="text-2xl font-bold text-[#151d1e]">Webhooks</h2>
            </div>
            <p className="text-[#3b494b] mb-6">Squad webhooks forwarded by Benchmark. Always validate signatures.</p>

            <div className="border border-[#b9cacb]/30 rounded-lg overflow-hidden">
              <div className="bg-[#edf5f6] px-4 py-3 border-b border-[#b9cacb]/30">
                <code className="font-mono text-sm">POST /webhook (configured in your dashboard)</code>
              </div>
              <div className="p-4">
                <div className="bg-[#151d1e] rounded-lg p-4 overflow-x-auto mb-4">
                  <pre className="text-[#e7eff0] font-mono text-xs whitespace-pre-wrap">
{`// Event: charge.successful (payment received into escrow)
{
  "event": "charge.successful",
  "transaction_id": "txn_123456",
  "amount": 45000,
  "currency": "NGN",
  "squad_reference": "sq_ref_123",
  "customer_phone": "+2348099999999"
}

// Event: transfer.success (funds released to vendor)
{
  "event": "transfer.success",
  "transaction_id": "txn_123456",
  "transfer_reference": "trf_789012",
  "amount": 45000,
  "vendor_account": "0123456789"
}

// Event: dispute.resolved (AI decision made)
{
  "event": "dispute.resolved",
  "dispute_id": "disp_123",
  "transaction_id": "txn_123456",
  "resolution": "buyer_wins",
  "confidence": 0.91,
  "auto_resolved": true
}`}
                  </pre>
                </div>
                <div className="bg-[#edf5f6] p-3 rounded-lg">
                  <p className="text-xs font-mono text-[#3b494b] mb-1">⚠️ Always validate webhook signatures:</p>
                  <code className="text-xs font-mono">const isValid = benchmark.webhooks.validate(rawBody, req.headers['x-squad-signature']);</code>
                </div>
              </div>
            </div>
          </section>

          {/* SDK Methods Summary */}
          <div className="bg-[#635bff]/5 border border-[#635bff]/20 rounded-lg p-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-[#635bff]" />
              <h3 className="font-bold text-[#151d1e]">SDK Methods Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><code className="text-[#635bff]">benchmark.vendors.register()</code> — Register vendor</div>
              <div><code className="text-[#635bff]">benchmark.vendors.startVerification()</code> — Start AI liveness</div>
              <div><code className="text-[#635bff]">benchmark.vendors.submitFrame()</code> — Submit face frame</div>
              <div><code className="text-[#635bff]">benchmark.vendors.completeVerification()</code> — Complete check</div>
              <div><code className="text-[#635bff]">benchmark.vendors.getScore()</code> — Get trust score</div>
              <div><code className="text-[#635bff]">benchmark.vendors.getBadge()</code> — Get SVG badge</div>
              <div><code className="text-[#635bff]">benchmark.escrow.create()</code> — Create escrow</div>
              <div><code className="text-[#635bff]">benchmark.escrow.confirmDelivery()</code> — Release funds</div>
              <div><code className="text-[#635bff]">benchmark.escrow.dispute()</code> — Submit dispute (AI)</div>
              <div><code className="text-[#635bff]">benchmark.b2b.createEscrow()</code> — Platform escrow</div>
              <div><code className="text-[#635bff]">benchmark.b2b.listVendors()</code> — List vendors</div>
              <div><code className="text-[#635bff]">benchmark.webhooks.validate()</code> — Verify signatures</div>
            </div>
          </div>
        </main>
      </div>

      <footer className="bg-[#ffffff] border-t border-[#b9cacb]/30 py-[2rem] mt-[80px]">
        <div className="text-center text-[12px] font-mono text-[#3b494b]">
          © 2026 Benchmark Infrastructure. Built for Squad Hackathon 3.0 — Challenge 01: Proof of Life
        </div>
      </footer>
    </div>
  );
}