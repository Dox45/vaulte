"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DisputePage() {
  const params = useParams();
  const transactionId = params.transaction_id as string;

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (text.length < 20) { setError("Please describe the issue in at least 20 characters."); return; }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/escrow/${transactionId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispute_text: text }),
      });
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);
      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center">
        <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 mb-2">
          {result.status === "auto-resolved" ? "Dispute Resolved" : "Dispute Submitted"}
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          {result.status === "auto-resolved"
            ? "Your refund has been processed automatically."
            : `Our team will review within ${result.expected_resolution_hours} hours.`}
        </p>
        <div className="bg-slate-50 rounded-2xl p-4 text-sm text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Category</span>
            <span className="font-semibold capitalize">{result.category?.replace(/-/g, " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className="font-semibold text-amber-600 capitalize">{result.status}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <AlertTriangle size={32} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">Raise a Dispute</h1>
        <p className="text-slate-500 text-sm mb-6">
          Describe the problem clearly. Our AI will classify it and may resolve it automatically.
        </p>
        <textarea
          rows={5}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. I never received my package. The seller stopped responding after I paid..."
          className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">{text.length}/20 minimum characters</p>
        {error && <p className="text-rose-500 text-sm font-medium mt-3">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 size={18} className="animate-spin" /> Submitting...</>
            : "Submit Dispute"
          }
        </button>
      </div>
    </main>
  );
}