"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Plus, 
  ShieldAlert, 
  Store, 
  Tag, 
  LayoutGrid, 
  Settings as SettingsIcon,
  ChevronLeft,
  Menu,
  ExternalLink
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function VendorDashboard() {
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "settings">("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!vendor) return null;

  const isVerified = vendor.verification_status === 'passed';

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-sans text-[#111827]">
      
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-[220px]" : "w-16"
        } transition-all duration-300 bg-white border-r border-[#e5e7eb] flex flex-col overflow-hidden fixed lg:sticky top-0 h-screen z-50`}
      >
        {/* Header Section */}
        <div className={`px-4 py-6 flex flex-col ${isSidebarOpen ? "" : "items-center"} min-h-[110px]`}>
          
          {/* Closed State Toggle (At the very top) */}
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-50 mb-4"
              title="Open sidebar"
            >
              <Menu size={20} />
            </button>
          )}

          <div className={`flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"} w-full`}>
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                  <div className="w-6 h-6 bg-[#635bff] text-white flex items-center justify-center rounded text-[10px] font-bold flex-shrink-0">
                    AS
                  </div>
                  <span className="text-[14px] font-semibold tracking-tight">Ada's Store</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50 flex-shrink-0"
                  title="Close sidebar"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            ) : (
              <div className="w-8 h-8 bg-[#635bff] text-white flex items-center justify-center rounded-lg text-[12px] font-bold shadow-sm shadow-indigo-100">
                AS
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-[#e5e7eb] mx-4 mb-4"></div>

        <nav className={`flex-1 ${isSidebarOpen ? "px-2" : "px-0 flex flex-col items-center"}`}>
          {isSidebarOpen && (
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</span>
            </div>
          )}
          
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center rounded-md text-[13px] font-medium transition-colors mb-1 ${
              isSidebarOpen ? "w-full gap-3 px-3 h-8" : "w-10 h-10 justify-center"
            } ${
              activeTab === "dashboard" 
                ? "bg-[#f0eeff] text-[#635bff]" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
            title="Dashboard"
          >
            <LayoutGrid size={16} />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex items-center rounded-md text-[13px] font-medium transition-colors mb-1 ${
              isSidebarOpen ? "w-full gap-3 px-3 h-8" : "w-10 h-10 justify-center"
            } ${
              activeTab === "products" 
                ? "bg-[#f0eeff] text-[#635bff]" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
            title="Products"
          >
            <Tag size={16} />
            {isSidebarOpen && <span>Products</span>}
          </button>

          <button 
            onClick={() => setActiveTab("settings")}
            className={`flex items-center rounded-md text-[13px] font-medium transition-colors ${
              isSidebarOpen ? "w-full gap-3 px-3 h-8" : "w-10 h-10 justify-center"
            } ${
              activeTab === "settings" 
                ? "bg-[#f0eeff] text-[#635bff]" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
            title="Settings"
          >
            <SettingsIcon size={16} />
            {isSidebarOpen && <span>Settings</span>}
          </button>
        </nav>

        <div className={`p-4 ${isSidebarOpen ? "" : "flex justify-center"}`}>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-2 text-[12px] font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors ${
              isSidebarOpen ? "w-full px-3 py-2" : "w-10 h-10 justify-center"
            }`}
            title="Logout"
          >
            <LogOut size={14} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex flex-col">
            <h1 className="text-[15px] font-semibold text-gray-900 leading-tight">
              Welcome back, {vendor.business_name}
            </h1>
            <p className="text-[11px] text-gray-400 font-medium capitalize">
              {activeTab}
            </p>
          </div>
          <a 
            href={`/store/${vendor.vendor_id}`} 
            target="_blank" 
            rel="noreferrer" 
            className="text-[13px] font-medium text-[#635bff] hover:underline flex items-center gap-1"
          >
            View Storefront <ExternalLink size={12} />
          </a>
        </header>

        <main className="p-4 lg:p-8 overflow-auto">
          {activeTab === "dashboard" ? (
            <div className="max-w-5xl space-y-6">
              
              {/* Professional Architectural Alert */}
              {!isVerified && (
                <div className="bg-white border border-[#e5e7eb] flex items-stretch shadow-sm mb-8">
                  <div className="w-1.5 bg-[#111827]"></div>
                  <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[#fef2f2] text-[#991b1b] text-[9px] font-bold uppercase tracking-widest rounded-[2px] border border-red-100">
                          Restricted Mode
                        </span>
                        <h3 className="text-[14px] font-bold text-gray-900 tracking-tight">Identity Verification Required</h3>
                      </div>
                      <p className="text-[13px] text-gray-500 leading-relaxed max-w-lg">
                        Complete your identity check to unlock full store capabilities, including product management, inventory tracking, and automated payouts.
                      </p>
                    </div>
                    <button 
                      onClick={handleVerify} 
                      className="bg-[#111827] text-white px-5 py-2.5 rounded-[4px] text-[13px] font-bold hover:bg-gray-800 transition-all cursor-pointer whitespace-nowrap shadow-sm active:scale-[0.98]"
                    >
                      Verify Now
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Strip */}
              <div className="bg-white border border-[#e5e7eb] rounded-md flex overflow-hidden">
                <div className="flex-1 p-4 border-r border-[#e5e7eb]">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Trust Score</div>
                  <div className="text-[20px] font-semibold">{vendor.trust_score} <span className="text-[14px] text-gray-400 font-normal">/ 100</span></div>
                </div>
                <div className="flex-1 p-4 border-r border-[#e5e7eb]">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Products</div>
                  <div className="text-[20px] font-semibold">{products.length}</div>
                </div>
                <div className="flex-1 p-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isVerified ? "bg-green-500" : "bg-amber-500"}`}></div>
                    <div className="text-[20px] font-semibold">{isVerified ? "Active" : "Pending"}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#e5e7eb] p-6 rounded-md shadow-sm">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-4 uppercase tracking-wider">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveTab("products")}
                      className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-md hover:border-[#111827] hover:bg-gray-50 transition-all group text-left"
                    >
                      <span className="text-[13px] font-medium text-gray-700">Add new product</span>
                      <Plus size={14} className="text-gray-400 group-hover:text-gray-900" />
                    </button>
                    <button 
                      onClick={() => setActiveTab("settings")}
                      className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-md hover:border-[#111827] hover:bg-gray-50 transition-all group text-left"
                    >
                      <span className="text-[13px] font-medium text-gray-700">Store settings</span>
                      <SettingsIcon size={14} className="text-gray-400 group-hover:text-gray-900" />
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#e5e7eb] p-6 rounded-md shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 mb-1 uppercase tracking-wider">Storefront Link</h3>
                    <p className="text-[12px] text-gray-400 mb-4">Share this link with your customers to start selling.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-gray-50 border border-[#e5e7eb] rounded text-[11px] text-gray-600 truncate">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/store/{vendor.vendor_id}
                    </code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/${vendor.vendor_id}`)}
                      className="px-3 py-2 bg-gray-900 text-white text-[11px] font-bold rounded hover:bg-gray-800 transition-colors"
                    >
                      COPY
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "products" ? (
            <div className="max-w-5xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold tracking-tight">Product Management</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Product List */}
                <div className="lg:col-span-3 bg-white border border-[#e5e7eb] rounded-md flex flex-col shadow-sm">
                  <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Inventory ({products.length})</h2>
                  </div>
                  <div className="flex-1 overflow-auto max-h-[600px]">
                    {products.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Tag size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-[13px]">No products listed yet.</p>
                      </div>
                    ) : (
                      products.map((p, idx) => (
                        <div key={p.id} className={`px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${idx !== products.length - 1 ? "border-b border-[#e5e7eb]" : ""}`}>
                          <div className="min-w-0 pr-4">
                            <div className="text-[14px] font-bold text-gray-900 truncate">{p.name}</div>
                            <div className="text-[12px] text-gray-500 truncate mt-0.5">{p.description}</div>
                          </div>
                          <div className="text-[14px] font-bold text-gray-900 whitespace-nowrap bg-gray-50 px-3 py-1 rounded border border-[#e5e7eb]">
                            ₦{parseFloat(p.price).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Product Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-[#e5e7eb] rounded-md p-6 shadow-sm sticky top-24">
                    <h2 className="text-[14px] font-bold mb-6 uppercase tracking-wider">List New Product</h2>
                    <form onSubmit={handleAddProduct} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Product Name</label>
                        <input 
                          type="text" required disabled={!isVerified}
                          placeholder="e.g. Premium Silk Scarf"
                          className="w-full h-10 border border-[#e5e7eb] rounded-md px-4 text-[13px] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] disabled:bg-gray-50 transition-all"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detailed Description</label>
                        <textarea 
                          required disabled={!isVerified}
                          placeholder="Describe your product's key features..."
                          className="w-full h-24 border border-[#e5e7eb] rounded-md px-4 py-3 text-[13px] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] disabled:bg-gray-50 resize-none transition-all"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Selling Price (₦)</label>
                        <input 
                          type="number" required disabled={!isVerified}
                          placeholder="0.00"
                          className="w-full h-10 border border-[#e5e7eb] rounded-md px-4 text-[13px] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] disabled:bg-gray-50 transition-all font-mono"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={addingProduct || !isVerified}
                        className="w-full h-11 bg-[#111827] text-white text-[13px] font-bold rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 shadow-sm mt-2 active:scale-[0.98]"
                      >
                        {addingProduct ? "Processing..." : "Publish Product"}
                      </button>
                      {!isVerified && (
                        <p className="text-[11px] text-red-500 text-center font-medium">
                          Verification required to list products.
                        </p>
                      )}
                    </form>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="max-w-2xl bg-white border border-[#e5e7eb] rounded-md">
              <div className="px-4 py-3 border-b border-[#e5e7eb]">
                <h2 className="text-[14px] font-semibold">Store Settings</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Store Name</label>
                  <input 
                    type="text" defaultValue={vendor.business_name}
                    className="w-full h-10 border border-[#e5e7eb] rounded-md px-3 text-[14px] bg-gray-50 cursor-not-allowed"
                    readOnly
                  />
                  <p className="mt-1 text-[11px] text-gray-400 italic">Contact support to change your legal business name.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Vendor ID</label>
                  <code className="block w-full p-2 bg-gray-50 border border-[#e5e7eb] rounded text-[12px] text-gray-600">
                    {vendor.vendor_id}
                  </code>
                </div>
                <div className="pt-4 border-t border-[#e5e7eb]">
                  <button className="h-9 px-4 bg-[#635bff] text-white text-[13px] font-medium rounded-md opacity-50 cursor-not-allowed">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
