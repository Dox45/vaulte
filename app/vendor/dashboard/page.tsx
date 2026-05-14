"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, ShieldCheck, ShieldAlert, Store, Tag } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function VendorDashboard() {
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "" });
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vendor_token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const fetchData = async () => {
      try {
        const [scoreRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/api/vendors/me/score`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/commerce/products`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!scoreRes.ok) throw new Error("Failed to fetch score");
        
        const scoreData = await scoreRes.json();
        const prodData = await prodRes.json();
        
        setVendor(scoreData.data);
        setProducts(prodData.data || []);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("vendor_token");
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleVerify = async () => {
    const token = localStorage.getItem("vendor_token");
    try {
      const res = await fetch(`${API_BASE}/api/vendors/verify-internal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start verification");

      window.location.href = data.data.hosted_url;
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vendor.verification_status !== 'passed') {
      alert("You must verify your identity before adding products.");
      return;
    }

    setAddingProduct(true);
    const token = localStorage.getItem("vendor_token");
    try {
      const res = await fetch(`${API_BASE}/api/commerce/products`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setProducts([data.data, ...products]);
      setNewProduct({ name: "", description: "", price: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    router.push("/signin");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">Loading...</div>;
  if (!vendor) return null;

  const isVerified = vendor.verification_status === 'passed';

  return (
    <main className="theme-professional min-h-screen bg-[#f0f4f8] p-6 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 flex items-center justify-center rounded-xl shadow-lg text-white">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{vendor.business_name} Dashboard</h1>
              <p className="text-sm text-slate-500 font-medium">Manage your Storefront</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href={`/store/${vendor.vendor_id}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline">
              View Public Storefront
            </a>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-lg">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Verification Alert */}
            {!isVerified && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="text-amber-500" size={32} />
                  <div>
                    <h2 className="text-lg font-bold text-amber-900">Identity Verification Required</h2>
                    <p className="text-sm text-amber-700">You must verify your identity before you can add products to your storefront.</p>
                  </div>
                </div>
                <button 
                  onClick={handleVerify}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md whitespace-nowrap transition-colors"
                >
                  Verify Now
                </button>
              </div>
            )}

            {/* Products List */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-8 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Tag size={20} className="text-indigo-500"/> Your Products</h2>
              
              {products.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p>You haven't listed any products yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map(p => (
                    <div key={p.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-white flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                      </div>
                      <div className="font-black text-indigo-600 text-lg">
                        ₦{parseFloat(p.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar - Score & Add Product */}
          <div className="space-y-8">
            
            {/* Trust Score */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Trust Score</h2>
              <div className="text-5xl font-black text-white mb-2">
                {vendor.trust_score} <span className="text-2xl text-slate-500">/ 100</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-500/30">
                {isVerified ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
                {vendor.score_tier}
              </div>
            </div>

            {/* Add Product Form */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-8 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Plus size={20} className="text-indigo-500"/> Add Product</h2>
              
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name</label>
                  <input 
                    type="text" 
                    required disabled={!isVerified}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all text-sm disabled:opacity-50"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    required disabled={!isVerified}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all text-sm disabled:opacity-50 min-h-[80px]"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price (₦)</label>
                  <input 
                    type="number" min="0" step="0.01"
                    required disabled={!isVerified}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all text-sm disabled:opacity-50"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={addingProduct || !isVerified}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-200"
                >
                  {addingProduct ? "Adding..." : "List Product"}
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
