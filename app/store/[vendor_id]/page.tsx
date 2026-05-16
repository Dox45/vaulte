// "use client";

// import { useState, useEffect } from "react";
// import { useParams } from "next/navigation";
// import { ShieldCheck, ShieldAlert, Store, ShoppingBag } from "lucide-react";
// import Link from "next/link";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// export default function Storefront() {
//   const params = useParams();
//   const vendorId = params.vendor_id as string;
  
//   const [storeData, setStoreData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!vendorId) return;

//     fetch(`${API_BASE}/api/commerce/store/${vendorId}`)
//       .then(res => res.json())
//       .then(data => {
//         if (data.status === 'error') throw new Error(data.message);
//         setStoreData(data.data);
//       })
//       .catch(err => setError(err.message))
//       .finally(() => setLoading(false));
//   }, [vendorId]);

//   if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">Loading Storefront...</div>;
//   if (error) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] text-rose-500 font-bold">{error}</div>;
//   if (!storeData) return null;

//   const { vendor, products } = storeData;
//   const isVerified = vendor.verification_status === 'passed';

//   return (
//     <main className="theme-professional min-h-screen bg-[#f0f4f8] font-sans pb-20">
//       {/* Store Header Banner */}
//       <div className="bg-slate-900 text-white py-16 px-6">
//         <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
//           <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-800">
//             <Store size={40} className="text-white" />
//           </div>
//           <div className="flex-1">
//             <h1 className="text-4xl font-black mb-2">{vendor.business_name}</h1>
//             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
//               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-sm font-medium border border-slate-700">
//                 <span className="text-slate-400">Trust Score:</span> 
//                 <span className="text-white font-bold">{vendor.trust_score}/100</span>
//               </div>
//               <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${isVerified ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30' : 'bg-rose-900/50 text-rose-400 border-rose-500/30'}`}>
//                 {isVerified ? <ShieldCheck size={16}/> : <ShieldAlert size={16}/>}
//                 {isVerified ? 'Identity Verified' : 'Unverified Seller'}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-5xl mx-auto px-6 mt-[-2rem] relative z-10">
//         <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-xl shadow-indigo-100/50 min-h-[400px]">
//           <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
//             <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
//               <ShoppingBag className="text-indigo-500" /> Products
//             </h2>
//             <span className="text-slate-500 font-medium text-sm">{products.length} Items</span>
//           </div>

//           {products.length === 0 ? (
//             <div className="text-center py-20 text-slate-400">
//               <Store size={48} className="mx-auto mb-4 opacity-20" />
//               <p className="text-lg">This store doesn't have any products yet.</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {products.map((p: any) => (
//                 <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col h-full hover:shadow-lg hover:border-indigo-200 transition-all group">
//                   <div className="flex-1">
//                     <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
//                     <p className="text-sm text-slate-600 mb-6 leading-relaxed">{p.description}</p>
//                   </div>
//                   <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200">
//                     <span className="font-black text-2xl text-slate-900">₦{parseFloat(p.price).toLocaleString()}</span>
//                     <button className="bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
//                       Buy
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="text-center mt-12">
//         <p className="text-sm text-slate-500 font-medium">Powered by <Link href="/" className="text-indigo-600 font-bold hover:underline">Benchmark Commerce Infrastructure</Link></p>
//       </div>
//     </main>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Store,
  ShoppingBag,
  ShoppingCart,
  Star,
  Award,
  Tag,
  MapPin,
  Package,
  PackageOpen,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Vendor {
  id: string;
  business_name: string;
  verification_status: string;
  trust_score: number;
  score_tier: string;
  category: string;
  location_state: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface StoreData {
  vendor: Vendor;
  products: Product[];
}

const PRODUCT_ICONS = [
  "📦", "🛍️", "🎁", "🏷️", "🛒", "📱", "💻", "🎧", "⌚", "📷",
];

export default function Storefront() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.vendor_id as string;

  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) return;
    fetch(`${API_BASE}/api/commerce/store/${vendorId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "error") throw new Error(data.message);
        setStoreData(data.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const handleBuy = (product: Product) => {
    setCartCount((c) => c + 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
    // TODO: wire to your escrow / order creation endpoint
    // router.push(`/checkout/${product.id}?vendor=${vendorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-slate-500 text-sm font-medium tracking-wide">Loading storefront…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-6">
        <div className="max-w-sm w-full bg-white border border-rose-100 rounded-2xl p-10 text-center shadow-xl">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-rose-400" />
          </div>
          <h2 className="font-bold text-xl text-slate-900 mb-2">Store not found</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Link href="/" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (!storeData) return null;

  const { vendor, products } = storeData;
  const isVerified = vendor.verification_status === "passed";

  return (
    <main className="min-h-screen bg-[#f0f4f8] font-sans pb-24">

      {/* ── Top nav ── */}
      <nav className="bg-[#0f172a] px-4 sm:px-8 h-14 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
          <span className="text-white font-semibold text-sm hidden sm:block">Benchmark Commerce</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white text-xs font-medium transition">Browse</Link>
          <button className="relative bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <ShoppingCart size={14} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] px-4 sm:px-8 pt-10 pb-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
            <Store size={36} className="text-indigo-300" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
              {vendor.business_name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isVerified
                  ? "bg-emerald-900/40 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-900/40 text-rose-400 border-rose-500/30"
              }`}>
                {isVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                {isVerified ? "Identity Verified" : "Unverified Seller"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-900/40 text-indigo-300 border border-indigo-500/30">
                <Star size={11} /> {vendor.trust_score}/100 Trust
              </span>
              {vendor.score_tier && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-500/20">
                  <Award size={11} /> {vendor.score_tier} Seller
                </span>
              )}
              {vendor.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-400 border border-white/10">
                  <Tag size={11} /> {vendor.category}
                </span>
              )}
              {vendor.location_state && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-400 border border-white/10">
                  <MapPin size={11} /> {vendor.location_state}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards (overlap hero) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-[-1.75rem] relative z-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Products listed", value: products.length },
            { label: "Trust score", value: `${vendor.trust_score}/100` },
            { label: "Seller tier", value: vendor.score_tier || "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center shadow-sm">
              <div className="text-lg sm:text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-8">

        {/* Trust banner */}
        <div className={`flex items-start gap-3 p-4 rounded-xl mb-8 border text-sm ${
          isVerified
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-amber-50 border-amber-100 text-amber-800"
        }`}>
          {isVerified
            ? <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            : <ShieldAlert size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          }
          <p className="leading-relaxed">
            {isVerified
              ? <><strong>Verified seller</strong> — Identity, liveness, and voice checks passed. Your purchase is protected by Benchmark escrow.</>
              : <><strong>Unverified seller</strong> — This seller has not completed identity verification. Proceed with caution.</>
            }
          </p>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package size={20} className="text-indigo-500" />
            Products
          </h2>
          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium">
            {products.length} item{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
            <PackageOpen size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No products listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-md transition-all duration-200 group"
              >
                {/* Product image area */}
                <div className="h-44 bg-slate-50 border-b border-slate-100 flex items-center justify-center text-5xl relative">
                  {PRODUCT_ICONS[i % PRODUCT_ICONS.length]}
                  {i === 0 && (
                    <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>

                {/* Product info */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-indigo-600 transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-5">
                    {product.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-xl font-black text-slate-900">
                        ₦{parseFloat(product.price).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">NGN</div>
                    </div>
                    <button
                      onClick={() => handleBuy(product)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                        addedId === product.id
                          ? "bg-emerald-500 text-white scale-95"
                          : "bg-slate-900 hover:bg-indigo-600 text-white"
                      }`}
                    >
                      {addedId === product.id ? (
                        <><ShieldCheck size={13} /> Added!</>
                      ) : (
                        <><ShoppingCart size={13} /> Buy now</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="text-center mt-16 text-xs text-slate-400 font-medium">
        Secured by{" "}
        <Link href="/" className="text-indigo-600 hover:underline font-semibold">
          Benchmark Verify
        </Link>{" "}
        — identity-verified commerce infrastructure
      </div>
    </main>
  );
}