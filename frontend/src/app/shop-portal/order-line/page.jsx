"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Search, Loader2, Save, ShoppingCart, Info, Check } from "lucide-react";
import { useToastContext } from "@/app/dashboard/_components/Toaster";

export default function OrderLinePage() {
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState("fv"); // 'fv' or 'grocery'
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState({}); // { [productId]: { classA: 0, classB: 0, qty: 0, notes: "" } }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products
  const { data: rawData, isLoading } = useSWR(
    "/api/products/products/?page_size=500",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const products = Array.isArray(rawData) ? rawData : (rawData?.results || []);

  // Basic categorization logic based on typical grocery/produce division
  // If your categories have specific names (like "Fruits & Vegetables"), adjust this filter
  const isFV = (product) => {
    const cat = product?.category?.name?.toLowerCase() || "";
    const isFruitOrVeg = cat.includes("fruit") || cat.includes("vegetable") || cat.includes("produce");
    // Fallback logic if categories aren't explicitly named:
    // For this example, we assume we have a way to distinguish.
    // If not, we'll just mock a basic split or use the above heuristic.
    return isFruitOrVeg || (!cat && product.name.toLowerCase().match(/apple|orange|banana|tomato|potato|onion|lettuce|carrot/));
  };

  const fvProducts = products.filter(isFV);
  const groceryProducts = products.filter(p => !isFV(p));

  const displayedProducts = (activeTab === "fv" ? fvProducts : groceryProducts).filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateItem = (productId, field, value) => {
    setOrderItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const calculateTotalItems = () => {
    let count = 0;
    Object.values(orderItems).forEach(item => {
      if (item.classA > 0) count += parseInt(item.classA);
      if (item.classB > 0) count += parseInt(item.classB);
      if (item.qty > 0) count += parseInt(item.qty);
    });
    return count;
  };

  const handleSubmitOrder = async () => {
    const total = calculateTotalItems();
    if (total === 0) {
      toast.error("Please add at least one item to the order.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Normally this would be a POST to your actual order creation endpoint
      // Example: await api.post("/api/orders/", { items: orderItems, ... });
      
      // Simulating network delay for now
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success("Order created successfully!");
      setOrderItems({});
    } catch (error) {
      toast.error(error?.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 shrink-0">
        <h1 className="text-2xl font-serif text-[#004A3A] font-medium tracking-tight mb-4">Create Manual Order</h1>
        
        <div className="flex justify-between items-end">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("fv")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === "fv" 
                  ? "bg-white text-[#00694C] shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Fruits & Vegetables
            </button>
            <button
              onClick={() => setActiveTab("grocery")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === "grocery" 
                  ? "bg-white text-[#00694C] shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Grocery
            </button>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 focus:border-[#00694C] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 text-[#00694C] animate-spin" />
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No products found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or category.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-24">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Product Name</th>
                  {activeTab === "fv" ? (
                    <>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Class A Qty</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Class B Qty</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Unit</th>
                    </>
                  ) : (
                    <>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Quantity</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Unit</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Freehand Details</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        {product.thumbnail_url ? (
                          <img src={product.thumbnail_url} alt="" className="w-10 h-10 rounded-md object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category?.name || "Uncategorized"}</p>
                        </div>
                      </div>
                    </td>
                    
                    {activeTab === "fv" ? (
                      <>
                        <td className="py-3 px-6 text-center">
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            value={orderItems[product.id]?.classA || ""}
                            onChange={(e) => handleUpdateItem(product.id, "classA", e.target.value)}
                            className="w-20 px-3 py-1.5 text-sm text-center border border-slate-200 rounded-md focus:outline-none focus:border-[#00694C]"
                          />
                        </td>
                        <td className="py-3 px-6 text-center">
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            value={orderItems[product.id]?.classB || ""}
                            onChange={(e) => handleUpdateItem(product.id, "classB", e.target.value)}
                            className="w-20 px-3 py-1.5 text-sm text-center border border-slate-200 rounded-md focus:outline-none focus:border-[#00694C]"
                          />
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-sm text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">{product.unit || "kg"}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-6 text-center">
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            value={orderItems[product.id]?.qty || ""}
                            onChange={(e) => handleUpdateItem(product.id, "qty", e.target.value)}
                            className="w-20 px-3 py-1.5 text-sm text-center border border-slate-200 rounded-md focus:outline-none focus:border-[#00694C]"
                          />
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-sm text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">{product.unit || "pcs"}</span>
                        </td>
                        <td className="py-3 px-6">
                          <input 
                            type="text" 
                            placeholder="Optional notes..."
                            value={orderItems[product.id]?.notes || ""}
                            onChange={(e) => handleUpdateItem(product.id, "notes", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#00694C]"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 right-0 md:left-64 left-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center z-10">
        <div className="flex items-center gap-4 px-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Items</p>
            <p className="text-lg font-black text-slate-800">{calculateTotalItems()}</p>
          </div>
        </div>
        
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || calculateTotalItems() === 0}
          className="flex items-center gap-2 bg-[#00694C] hover:bg-[#005940] text-white px-8 py-3 rounded-lg font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </button>
      </div>
    </div>
  );
}
