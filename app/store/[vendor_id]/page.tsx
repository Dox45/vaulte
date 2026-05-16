"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, ShieldAlert, Store, ShoppingBag, X } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Storefront() {
  const params = useParams();
  const vendorId = params.vendor_id as string;

  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Buy modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");

  useEffect(() => {
    if (!vendorId) return;
    fetch(`${API_BASE}/api/commerce/store/${vendorId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "error") throw new Error(data.message);
        setStoreData(data.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [vendorId]);

  // This is the only new function — calls your existing escrow endpoint
  async function handleBuy() {
    if (!buyerPhone) { setBuyError("Phone number is required"); return; }
    setBuying(true);
    setBuyError("");

    try {
      const res = await fetch(`${API_BASE}/api/escrow/create-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          amount: selectedProduct.price,
          item_description: selectedProduct.name,
          buyer_phone: buyerPhone,
          buyer_email: buyerEmail,
        }),
      });

      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);

      // Redirect buyer to Squad checkout page
      window.location.href = data.data.checkout_url;
    } catch (err: any) {
      setBuyError(err.message);
      setBuying(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">Loading Storefront...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] text-rose-500 font-bold">{error}</div>;
  if (!storeData) return null;

  const { vendor, products } = storeData;
  const isVerified = vendor.verification_status === "passed";

  return (
    <main className="theme-professional min-h-screen bg-[#f0f4f8] font-sans pb-20">
      {/* Store Header — unchanged */}
      <div className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-800">
            <Store size={40} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-black mb-2">{vendor.business_name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-sm font-medium border border-slate-700">
                <span className="text-slate-400">Trust Score:</span>
                <span className="text-white font-bold">{vendor.trust_score}/100</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${isVerified ? "bg-emerald-900/50 text-emerald-400 border-emerald-500/30" : "bg-rose-900/50 text-rose-400 border-rose-500/30"}`}>
                {isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                {isVerified ? "Identity Verified" : "Unverified Seller"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products — only the Buy button changes */}
      <div className="max-w-5xl mx-auto px-6 mt-[-2rem] relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-xl shadow-indigo-100/50 min-h-[400px]">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="text-indigo-500" /> Products
            </h2>
            <span className="text-slate-500 font-medium text-sm">{products.length} Items</span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Store size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">This store doesn't have any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p: any) => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col h-full hover:shadow-lg hover:border-indigo-200 transition-all group">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200">
                    <span className="font-black text-2xl text-slate-900">₦{parseFloat(p.price).toLocaleString()}</span>
                    {/* Only change: onClick opens modal */}
                    <button
                      onClick={() => { setSelectedProduct(p); setBuyError(""); }}
                      className="bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-slate-500 font-medium">
          Powered by <Link href="/" className="text-indigo-600 font-bold hover:underline">Benchmark Commerce Infrastructure</Link>
        </p>
      </div>

      {/* Buy Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedProduct.name}</h3>
                <p className="text-2xl font-black text-indigo-600 mt-1">
                  ₦{parseFloat(selectedProduct.price).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X size={24} />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-sm text-emerald-800">
              <ShieldCheck size={16} className="inline mr-1.5" />
              Your payment is held in escrow. Funds release only after you confirm delivery.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Your Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+2348012345678"
                  value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400 mt-1">You'll receive a delivery confirmation link here</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (optional)</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={buyerEmail}
                  onChange={e => setBuyerEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {buyError && (
              <p className="text-rose-500 text-sm font-medium mt-4">{buyError}</p>
            )}

            <button
              onClick={handleBuy}
              disabled={buying}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-lg transition-colors"
            >
              {buying ? "Creating secure escrow..." : `Pay ₦${parseFloat(selectedProduct.price).toLocaleString()} Safely`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}