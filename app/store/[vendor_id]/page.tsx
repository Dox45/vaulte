"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, ShieldAlert, Store, ShoppingBag } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Storefront() {
  const params = useParams();
  const vendorId = params.vendor_id as string;
  
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vendorId) return;

    fetch(`${API_BASE}/api/commerce/store/${vendorId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'error') throw new Error(data.message);
        setStoreData(data.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">Loading Storefront...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] text-rose-500 font-bold">{error}</div>;
  if (!storeData) return null;

  const { vendor, products } = storeData;
  const isVerified = vendor.verification_status === 'passed';

  return (
    <main className="theme-professional min-h-screen bg-[#f0f4f8] font-sans pb-20">
      {/* Store Header Banner */}
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
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${isVerified ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30' : 'bg-rose-900/50 text-rose-400 border-rose-500/30'}`}>
                {isVerified ? <ShieldCheck size={16}/> : <ShieldAlert size={16}/>}
                {isVerified ? 'Identity Verified' : 'Unverified Seller'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                    <button className="bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
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
        <p className="text-sm text-slate-500 font-medium">Powered by <Link href="/" className="text-indigo-600 font-bold hover:underline">Vaulte Commerce Infrastructure</Link></p>
      </div>
    </main>
  );
}
