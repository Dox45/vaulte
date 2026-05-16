"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck, PackageCheck, AlertCircle, Loader2,
  Clock, AlertTriangle, Lock, CheckCircle2, XCircle
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Types ───────────────────────────────────────────────────────
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

// ─── Main Page ────────────────────────────────────────────────────
export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeResult, setDisputeResult] = useState<any>(null);
  const [disputeError, setDisputeError] = useState("");

  

  const fetchTransaction = useCallback(async () => {
    if (!reference) return;
    try {
      const res = await fetch(`${API_BASE}/api/escrow/by-ref/${reference}`);
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);
      setTransaction(data.data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reference]);

  // Initial fetch
  useEffect(() => {
    if (!reference) { setError("No transaction reference found."); setLoading(false); return; }
    fetchTransaction();
  }, [fetchTransaction]);

  // Poll every 4 seconds while pending — Squad webhook may take a moment
  useEffect(() => {
    if (!transaction || transaction.escrow_status !== "pending") return;
    const interval = setInterval(fetchTransaction, 4000);
    return () => clearInterval(interval);
  }, [transaction, fetchTransaction]);

  // Add this function to the confirm page
const checkPaymentStatusManually = useCallback(async () => {
  if (!transaction?.transaction_id) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/escrow/check-status/${transaction.transaction_id}`);
    const data = await res.json();
    
    if (data.data?.escrow_status === 'funded' && transaction.escrow_status === 'pending') {
      // Refresh the transaction data
      await fetchTransaction();
    }
  } catch (err) {
    console.error('Manual status check failed:', err);
  }
}, [transaction?.transaction_id, transaction?.escrow_status, fetchTransaction]);

// Add this to your existing polling effect - try manual check after 10 seconds
useEffect(() => {
  if (!transaction || transaction.escrow_status !== "pending") return;
  
  const interval = setInterval(fetchTransaction, 4000);
  const manualCheckTimeout = setTimeout(() => {
    const manualInterval = setInterval(checkPaymentStatusManually, 8000);
    return () => clearInterval(manualInterval);
  }, 10000);
  
  return () => {
    clearInterval(interval);
    clearTimeout(manualCheckTimeout);
  };
}, [transaction, fetchTransaction, checkPaymentStatusManually]);

  async function handleConfirm() {
    if (!transaction) return;
    setConfirming(true);
    setConfirmError("");
    try {
      const res = await fetch(`${API_BASE}/api/escrow/confirm/${transaction.confirmation_token}`, { method: "POST" });
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
    if (disputeText.trim().length < 20) { setDisputeError("Please describe the issue in at least 20 characters."); return; }
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

  const amount = transaction ? parseFloat(transaction.amount).toLocaleString("en-NG") : "0";

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
        </div>
        <p className="text-slate-500 text-sm font-medium">Loading your transaction...</p>
      </div>
    </div>
  );

  // ── Fatal error ──
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

  // ── Dispute result screen ──
  if (disputeResult) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${disputeResult.status === "auto-resolved" ? "bg-emerald-100" : "bg-amber-100"}`}>
          {disputeResult.status === "auto-resolved"
            ? <CheckCircle2 size={28} className="text-emerald-500" />
            : <AlertTriangle size={28} className="text-amber-500" />
          }
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
            <span className="text-slate-400">Dispute category</span>
            <span className="font-semibold capitalize text-slate-800">
              {disputeResult.category?.replace(/-/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">AI confidence</span>
            <span className="font-semibold text-slate-800">
              {disputeResult.confidence ? `${Math.round(disputeResult.confidence * 100)}%` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Resolution</span>
            <span className={`font-bold capitalize ${disputeResult.status === "auto-resolved" ? "text-emerald-600" : "text-amber-600"}`}>
              {disputeResult.status === "auto-resolved" ? "Auto-resolved" : "Under review"}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400">Protected by Benchmark · Powered by Squad</p>
      </div>
    </div>
  );

  // ── Released / confirmed ──
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
            <span className="font-semibold text-slate-800 text-right max-w-[60%]">{transaction?.item_description}</span>
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

  // ── Refunded ──
  if (transaction?.escrow_status === "refunded") return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={28} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Refund Processed</h2>
        <p className="text-slate-500 text-sm">Your dispute was upheld. A full refund of ₦{amount} is being returned to you.</p>
        <p className="text-xs text-slate-400 mt-8">Protected by Benchmark · Powered by Squad</p>
      </div>
    </div>
  );

  // ── PENDING — payment not yet confirmed by webhook ──
  if (transaction?.escrow_status === "pending") return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Confirmation</h2>
          <p className="text-slate-500 text-sm">
            Your payment is being verified. This page refreshes automatically every few seconds.
          </p>
        </div>

        {/* Escrow explanation */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <Lock size={18} className="text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-indigo-900 text-sm">Your money is protected</p>
              <p className="text-indigo-700 text-xs mt-0.5">
                Once confirmed, ₦{amount} will be held in a Squad escrow account — not with the vendor.
                Funds only release when you confirm you've received your item.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-indigo-900 text-sm">You are in control</p>
              <p className="text-indigo-700 text-xs mt-0.5">
                If anything goes wrong, you can raise a dispute and our AI will review it immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Order details */}
        <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Item</span>
            <span className="font-semibold text-slate-800 text-right max-w-[55%]">{transaction.item_description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Amount</span>
            <span className="font-black text-indigo-600">₦{amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Vendor</span>
            <span className="font-semibold text-slate-800">{transaction.vendor?.business_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-amber-500 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Confirming
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 size={12} className="animate-spin" />
          Checking payment status automatically...
        </div>
      </div>
    </div>
  );

  // ── DISPUTE FORM — shown inline when user clicks "I have a problem" ──
  if (showDispute && transaction) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Raise a Dispute</h1>
            <p className="text-xs text-slate-400">Our AI will review and may resolve it instantly</p>
          </div>
        </div>

        {/* Context */}
        <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Item</span>
            <span className="font-semibold text-slate-800">{transaction.item_description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Amount at risk</span>
            <span className="font-black text-rose-600">₦{amount}</span>
          </div>
        </div>

        {/* Common categories as quick-fill */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Common issues</p>
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
          placeholder="Describe exactly what happened. Be as specific as possible — our AI uses this to determine your resolution."
          className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none mb-1"
        />
        <p className="text-xs text-slate-400 mb-4">
          {disputeText.length} characters {disputeText.length < 20 && `(${20 - disputeText.length} more needed)`}
        </p>

        {disputeError && <p className="text-rose-500 text-sm font-medium mb-4">{disputeError}</p>}

        <div className="space-y-3">
          <button
            onClick={handleDispute}
            disabled={submittingDispute || disputeText.trim().length < 20}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submittingDispute
              ? <><Loader2 size={16} className="animate-spin" /> AI is reviewing your case...</>
              : "Submit Dispute"
            }
          </button>

          <button
            onClick={() => setShowDispute(false)}
            className="w-full text-slate-500 font-semibold py-3 text-sm hover:text-slate-800 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );

  // ── FUNDED — main confirm screen ──
  if (!transaction) return null;

  return (
    <main className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Your Money is Safe</h1>
          <p className="text-slate-500 text-sm mt-1">
            ₦{amount} is held in escrow — not with the vendor.
          </p>
        </div>

        {/* Trust badge */}
        {transaction.vendor && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-indigo-600" />
            </div>
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
        <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-3 text-sm">
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Funds Secured
            </span>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-amber-800 mb-2">How this works</p>
          <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
            <li>Your payment is locked in a Squad escrow account</li>
            <li>The vendor ships your item</li>
            <li>You confirm delivery — funds release to vendor</li>
            <li>Problem? Raise a dispute — AI reviews it instantly</li>
          </ol>
        </div>

        {confirmError && (
          <p className="text-rose-500 text-sm font-medium mb-4">{confirmError}</p>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
          >
            {confirming
              ? <><Loader2 size={18} className="animate-spin" /> Releasing funds...</>
              : <><PackageCheck size={18} /> I received my item — Release funds</>
            }
          </button>

          <button
            onClick={() => setShowDispute(true)}
            className="w-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold py-4 rounded-2xl text-sm transition-colors border border-slate-200 hover:border-rose-200"
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