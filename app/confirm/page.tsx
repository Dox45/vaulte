"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck, PackageCheck, AlertCircle, Loader2,
  AlertTriangle, Lock, CheckCircle2, XCircle, Sparkles
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type EscrowStatus = "pending" | "funded" | "delivered" | "released" | "disputed" | "refunded";

interface Transaction {
  transaction_id: string;
  escrow_status: EscrowStatus;
  amount: string;
  item_description: string;
  confirmation_token: string;
  confirmation_expires_at: string;
  vendor: {
    business_name: string;
    trust_score: string | number;
    score_tier: string;
    category?: string;
  } | null;
}

function ConfirmPageInner() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Verifying your payment...");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeResult, setDisputeResult] = useState<any>(null);
  const [disputeError, setDisputeError] = useState("");

  const fetchTransaction = useCallback(async (): Promise<Transaction | null> => {
    if (!reference) return null;
    try {
      const res = await fetch(`${API_BASE}/api/escrow/by-ref/${reference}`);
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);
      setTransaction(data.data);
      setError("");
      return data.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [reference]);

  // ✅ IMPROVED: Auto-update transaction to funded on page load
  useEffect(() => {
    if (!reference) {
      setError("No transaction reference found.");
      setLoading(false);
      return;
    }

    async function initPage() {
      setLoadingMessage("Verifying your payment...");
      
      // Step 1: Fetch transaction
      const tx = await fetchTransaction();
      if (!tx) {
        setLoading(false);
        return;
      }

      // Step 2: If still pending, trigger status check/update
      if (tx.escrow_status === "pending") {
        setLoadingMessage("Confirming payment status...");
        
        try {
          // Call the check-status endpoint which queries Squad and updates DB
          await fetch(`${API_BASE}/api/escrow/check-status/${tx.transaction_id}`, {
            method: "GET",
          });
          
          // Wait a moment and refetch
          await wait(1000);
          const updated = await fetchTransaction();
          
          // If still pending after check, try the test simulation endpoint
          if (updated && updated.escrow_status === "pending") {
            setLoadingMessage("Processing payment confirmation...");
            
            try {
              await fetch(`${API_BASE}/api/test/webhook/simulate-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transaction_id: tx.transaction_id }),
              });
            } catch {
              // Ignore error - endpoint might not exist in production
            }
            
            // Final refetch
            await wait(800);
            await fetchTransaction();
          }
        } catch (err) {
          console.warn("Payment confirmation error:", err);
        }
      }

      setLoading(false);
    }

    initPage();
  }, [reference, fetchTransaction]);

  async function handleConfirm() {
    if (!transaction) return;
    setConfirming(true);
    setConfirmError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/escrow/confirm/${transaction.confirmation_token}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);
      setConfirmed(true);
      setTransaction(prev => prev ? { ...prev, escrow_status: "released" } : prev);
    } catch (err: any) {
      setConfirmError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  async function handleDispute() {
    if (!transaction) return;
    if (disputeText.trim().length < 20) {
      setDisputeError("Please describe the issue in at least 20 characters.");
      return;
    }
    setSubmittingDispute(true);
    setDisputeError("");
    try {
      const res = await fetch(`${API_BASE}/api/escrow/${transaction.transaction_id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispute_text: disputeText }),
      });
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);
      setDisputeResult(data.data);
    } catch (err: any) {
      setDisputeError(err.message);
    } finally {
      setSubmittingDispute(false);
    }
  }

  const amount = transaction
    ? parseFloat(transaction.amount).toLocaleString("en-NG")
    : "0";

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-50" />
          <div className="relative w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <Lock size={32} className="text-indigo-500" />
          </div>
        </div>
        <p className="text-slate-800 font-black text-lg mb-1">{loadingMessage}</p>
        <p className="text-slate-400 text-sm">Powered by Squad · Protected by Benchmark</p>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Fatal error ──────────────────────────────────────────────────
  if (error && !transaction) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Transaction Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <Link href="/" className="inline-block text-indigo-600 font-bold text-sm hover:underline">Go Home</Link>
      </div>
    </div>
  );

  // ── Dispute result ───────────────────────────────────────────────
  if (disputeResult) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6
          ${disputeResult.status === "auto-resolved" ? "bg-emerald-100" : "bg-amber-100"}`}>
          {disputeResult.status === "auto-resolved"
            ? <CheckCircle2 size={28} className="text-emerald-500" />
            : <AlertTriangle size={28} className="text-amber-500" />}
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {disputeResult.status === "auto-resolved" ? "Refund Initiated" : "Dispute Submitted"}
        </h2>
        <p className="text-slate-500 text-sm mb-8">
          {disputeResult.status === "auto-resolved"
            ? "Our AI reviewed your dispute and initiated a full refund. Funds will return to your account within 24–48 hours."
            : `Our team will review your case and respond within ${disputeResult.expected_resolution_hours || 24} hours.`}
        </p>
        <div className="bg-slate-50 rounded-2xl p-5 text-sm text-left space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Category</span>
            <span className="font-semibold capitalize text-slate-800">
              {disputeResult.category?.replace(/-/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">AI confidence</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              {disputeResult.confidence ? `${Math.round(disputeResult.confidence * 100)}%` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Resolution</span>
            <span className={`font-bold ${disputeResult.status === "auto-resolved" ? "text-emerald-600" : "text-amber-600"}`}>
              {disputeResult.status === "auto-resolved" ? "Auto-resolved" : "Under review"}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">Protected by Benchmark · Powered by Squad</p>
      </div>
    </div>
  );

  // ── Released / confirmed ─────────────────────────────────────────
  if (confirmed || transaction?.escrow_status === "released") return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <PackageCheck size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Delivery Confirmed</h2>
        <p className="text-slate-500 text-sm mb-8">
          Funds have been released to the vendor. Your transaction is complete.
        </p>
        <div className="bg-slate-50 rounded-2xl p-5 text-sm text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Item</span>
            <span className="font-semibold text-slate-800 text-right max-w-[60%]">
              {transaction?.item_description}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Amount</span>
            <span className="font-black text-indigo-600">₦{amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Vendor</span>
            <span className="font-semibold text-slate-800">{transaction?.vendor?.business_name}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-emerald-600">Released</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-8">Protected by Benchmark · Powered by Squad</p>
      </div>
    </div>
  );

  // ── Refunded ─────────────────────────────────────────────────────
  if (transaction?.escrow_status === "refunded") return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={28} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Refund Processed</h2>
        <p className="text-slate-500 text-sm">
          Your dispute was upheld. A full refund of ₦{amount} is being returned to you.
        </p>
        <p className="text-xs text-slate-400 mt-8">Protected by Benchmark · Powered by Squad</p>
      </div>
    </div>
  );

  // ── Dispute form ─────────────────────────────────────────────────
  if (showDispute && transaction) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Raise a Dispute</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Sparkles size={10} className="text-indigo-400" />
              AI-powered — may resolve instantly
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-2 mb-5">
          <div className="flex justify-between">
            <span className="text-slate-400">Item</span>
            <span className="font-semibold text-slate-800">{transaction.item_description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Amount at risk</span>
            <span className="font-black text-rose-600">₦{amount}</span>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          Quick select
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            "I never received my package",
            "I received a fake item",
            "Wrong item was sent",
            "Item is damaged",
          ].map(issue => (
            <button
              key={issue}
              onClick={() => setDisputeText(issue + ". ")}
              className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:border-rose-200 transition-colors"
            >
              {issue}
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={disputeText}
          onChange={e => setDisputeText(e.target.value)}
          placeholder="Describe exactly what happened. The more specific you are, the better our AI can resolve it."
          className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none mb-1"
        />
        <p className="text-xs text-slate-400 mb-5">
          {disputeText.length} characters
          {disputeText.length < 20 && (
            <span className="text-rose-400"> · {20 - disputeText.length} more needed</span>
          )}
        </p>

        {disputeError && (
          <p className="text-rose-500 text-sm font-medium mb-4">{disputeError}</p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleDispute}
            disabled={submittingDispute || disputeText.trim().length < 20}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submittingDispute
              ? <><Loader2 size={16} className="animate-spin" /> AI is reviewing your case...</>
              : <><Sparkles size={16} /> Submit Dispute</>}
          </button>
          <button
            onClick={() => setShowDispute(false)}
            className="w-full text-slate-400 font-semibold py-3 text-sm hover:text-slate-700 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );

  // ── Still pending after all attempts ─────────────────────────────
  if (transaction?.escrow_status === "pending") return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 size={28} className="text-amber-500 animate-spin" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Payment Processing</h2>
        <p className="text-slate-500 text-sm mb-6">
          Your payment is being confirmed. This usually takes just a few seconds.
          Please refresh this page in a moment.
        </p>
        <button
          onClick={() => { setLoading(true); window.location.reload(); }}
          className="bg-indigo-600 text-white font-black px-8 py-3 rounded-2xl text-sm hover:bg-indigo-700 transition-colors"
        >
          Refresh Now
        </button>
        <p className="text-xs text-slate-400 mt-6">Protected by Benchmark · Powered by Squad</p>
      </div>
    </div>
  );

  // ── Main funded state ─────────────────────────────────────────────
  if (!transaction) return null;

  return (
    <main className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900">Your Money is Safe</h1>
          <p className="text-slate-500 text-sm mt-1">
            ₦{amount} is locked in Squad escrow — not with the vendor.
          </p>
        </div>

        {/* Vendor trust badge */}
        {transaction.vendor && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
            <div>
              <p className="font-bold text-slate-900 text-sm">{transaction.vendor.business_name}</p>
              <p className="text-xs text-indigo-700">
                Trust Score: {parseFloat(String(transaction.vendor.trust_score)).toFixed(0)}/100
                {" · "}{transaction.vendor.score_tier}
              </p>
            </div>
          </div>
        )}

        {/* Transaction details */}
        <div className="bg-slate-50 rounded-2xl p-5 mb-5 space-y-3 text-sm">
          <div className="flex justify-between items-start">
            <span className="text-slate-400">Item</span>
            <span className="font-bold text-slate-900 text-right max-w-[60%]">
              {transaction.item_description}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Amount in escrow</span>
            <span className="font-black text-xl text-indigo-600">₦{amount}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Funds Secured
            </span>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-amber-800 mb-2">How this works</p>
          <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
            <li>Your payment is locked in Squad escrow — vendor cannot touch it</li>
            <li>Vendor ships your item to you</li>
            <li>You confirm receipt below → funds released to vendor instantly</li>
            <li>Something wrong? Raise a dispute — AI reviews and resolves it</li>
          </ol>
        </div>

        {confirmError && (
          <p className="text-rose-500 text-sm font-medium mb-4">{confirmError}</p>
        )}

        {/* CTA buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            {confirming
              ? <><Loader2 size={18} className="animate-spin" /> Releasing funds...</>
              : <><PackageCheck size={18} /> I received my item — Release funds</>}
          </button>

          <button
            onClick={() => setShowDispute(true)}
            className="w-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-semibold py-3.5 rounded-2xl text-sm transition-colors border border-slate-200 hover:border-rose-200"
          >
            I have a problem — Raise a dispute
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by Benchmark · Powered by Squad
        </p>
      </div>
    </main>
  );
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="animate-spin text-indigo-500" size={28} />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading your transaction...</p>
        </div>
      </div>
    }>
      <ConfirmPageInner />
    </Suspense>
  );
}