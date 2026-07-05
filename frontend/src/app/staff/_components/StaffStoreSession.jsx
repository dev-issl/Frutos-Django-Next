"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import {
  Package, ShoppingCart, MapPin, Search, Loader2, ArrowLeft,
  RefreshCw, ReceiptText, StoreIcon, Store as StoreIcon2, ClipboardCheck,
} from "lucide-react";
import AdminCreateOrder from "@/app/dashboard/orders/_components/AdminCreateOrder";
import { Store as LucideStore } from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatDuration(ms) {
  if (!ms || ms < 0) return "0m";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function formatAMPM(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, "0")}:${m} ${ampm}`;
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Order status badge ───────────────────────────────────────────────────────
const ORDER_STATUS_STYLES = {
  PENDING:    "bg-amber-50 text-amber-700 border border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 border border-blue-200",
  SHIPPED:    "bg-indigo-50 text-indigo-700 border border-indigo-200",
  DELIVERED:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED:  "bg-red-50 text-red-700 border border-red-200",
};
function OrderStatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${ORDER_STATUS_STYLES[s] || "bg-slate-100 text-slate-600"}`}>
      {s.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

// ─── Store Details Tab ─────────────────────────────────────────────────────────
function StoreDetailsTab({ store, currentActiveShift, onCheckIn, isCheckingIn }) {
  const isCheckedIntoThisStore = String(currentActiveShift?.store) === String(store?.id) || currentActiveShift?.store_name === store?.name;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <StoreIcon2 className="w-5 h-5 text-[#00694C]" />
            <h3 className="font-bold text-[#004A3A]">Store Information</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Name</span>
              <span className="font-bold text-slate-800">{store?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Location</span>
              <span className="font-semibold text-slate-700 text-right max-w-[200px]">{store?.address || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-slate-500">Opening Hours</span>
              <span className="font-semibold text-slate-700">
                {store?.openTime && store?.closeTime ? `${formatAMPM(store.openTime)} - ${formatAMPM(store.closeTime)}` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Action */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#E4EFDA] flex items-center justify-center mb-4">
            <ClipboardCheck className="w-8 h-8 text-[#00694C]" />
          </div>
          <h3 className="font-bold text-xl text-[#004A3A] mb-2">Ready to work?</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-[250px]">
            {isCheckedIntoThisStore 
              ? "You are currently checked into this store. Your shift is active!"
              : currentActiveShift 
                ? "You are checked into a different store. Leave your active shift first."
                : "Check in to start your shift and record your attendance for this store."}
          </p>
          
          <button
            onClick={() => onCheckIn(store.id)}
            disabled={isCheckingIn || currentActiveShift}
            className={`w-full max-w-[250px] py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isCheckedIntoThisStore
                ? "bg-emerald-100 text-emerald-700 cursor-default"
                : currentActiveShift
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-[#00694C] hover:bg-[#005940] text-white cursor-pointer shadow-md hover:shadow-lg"
            }`}
          >
            {isCheckingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            {isCheckedIntoThisStore 
              ? "Shift Active" 
              : isCheckingIn 
                ? "Starting Shift..." 
                : "Start Shift Here"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function StoreProductsTab({ storeId, storeName }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  const { data: rawData, isLoading, mutate } = useSWR(
    storeId ? `/api/products/products/?store=${storeId}&page_size=200` : null,
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );
  const allProducts = rawData?.results || (Array.isArray(rawData) ? rawData : []);
  const categories = [...new Set(allProducts.map(p => p.category?.name).filter(Boolean))];
  const filtered = allProducts.filter(p => {
    const ms = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const mc = !selectedCat || p.category?.name === selectedCat;
    return ms && mc;
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#00694C] animate-spin mb-3" />
      <p className="text-slate-500 text-sm">Loading products...</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 focus:border-[#00694C] transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => setSelectedCat("")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${!selectedCat ? "bg-[#00694C] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-[#00694C]/30"}`}>
            All ({allProducts.length})
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat === selectedCat ? "" : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${selectedCat === cat ? "bg-[#00694C] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-[#00694C]/30"}`}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={() => mutate()} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No products found for {storeName}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                {p.thumbnail_url
                  ? <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-slate-200" /></div>}
                {p.stock <= 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 mb-1">{p.name}</h3>
                <p className="text-[11px] text-slate-400 mb-2">{p.category?.name || "—"}</p>
                <div className="flex items-center justify-between">
                  <div>
                    {p.discount_price
                      ? <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-[#00694C]">€{Number(p.discount_price).toFixed(2)}</span><span className="text-[11px] text-slate-400 line-through">€{Number(p.price).toFixed(2)}</span></div>
                      : <span className="text-sm font-bold text-[#004A3A]">€{Number(p.price).toFixed(2)}</span>}
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.stock > 10 ? "bg-emerald-50 text-emerald-700" : p.stock > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    {p.stock > 0 ? `${p.stock}` : "Out"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Order History Tab ────────────────────────────────────────────────────────
function StoreOrderHistoryTab({ profile }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    `/api/staff/me/orders/${statusFilter ? `?status=${statusFilter}` : ""}`,
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );
  const orders = data?.results || [];
  const stats = data?.stats || {};

  const statCards = [
    { label: "Total",      value: stats.total || 0,      color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200",  key: "" },
    { label: "Pending",    value: stats.pending || 0,    color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  key: "PENDING" },
    { label: "Processing", value: stats.processing || 0, color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   key: "PROCESSING" },
    { label: "Delivered",  value: stats.delivered || 0,  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",key: "DELIVERED" },
    { label: "Cancelled",  value: stats.cancelled || 0,  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",    key: "CANCELLED" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        {statCards.map(card => (
          <button key={card.label} onClick={() => setStatusFilter(card.key)}
            className={`${card.bg} border ${card.border} rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-sm ${statusFilter === card.key ? "ring-2 ring-[#00694C]/30 shadow-sm" : ""}`}>
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{card.label}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Orders created by you{statusFilter ? ` · ${statusFilter.toLowerCase()}` : ""}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
          {profile?.can_create_orders && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00694C] hover:bg-[#00593E] text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm">
              <ShoppingCart className="w-4 h-4" /> Create Order
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-[#00694C] animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ReceiptText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No orders found</p>
          {statusFilter && <p className="text-slate-400 text-sm mt-1">Try clearing the status filter</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Order #","Customer","Total","Status","Payment","Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-[#004A3A] text-xs">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700 text-xs">{order.customer_name || "—"}</div>
                    <div className="text-slate-400 text-[11px]">{order.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">€{Number(order.total_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.payment_status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(order.ordered_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Create Manual Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-2xl text-slate-400 hover:text-slate-600 cursor-pointer leading-none">×</button>
            </div>
            <div className="p-6"><AdminCreateOrder onSuccess={() => { setShowCreate(false); mutate(); }} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session Timer ────────────────────────────────────────────────────────────
function SessionTimer({ sessionStartTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!sessionStartTime) return;
    const t = setInterval(() => setElapsed(Date.now() - sessionStartTime), 1000);
    return () => clearInterval(t);
  }, [sessionStartTime]);
  return <span className="text-white font-mono font-bold text-sm tabular-nums">{formatDuration(elapsed)}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StaffStoreSession({ store, profile, sessionStartTime, currentActiveShift, onBack, onCheckIn, isCheckingIn }) {
  const [activeTab, setActiveTab] = useState("details");
  const tabs = [
    { id: "details",  label: "Store Details", icon: StoreIcon },
    { id: "products", label: "Products", icon: Package },
    { id: "orders",   label: "My Orders", icon: ShoppingCart },
  ];

  const { data: rawProducts } = useSWR(
    store?.id ? `/api/products/products/?store=${store.id}&page_size=200` : null,
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );
  const totalProducts = rawProducts?.count || rawProducts?.results?.length || (Array.isArray(rawProducts) ? rawProducts.length : 0);

  const { data: staffData } = useSWR(
    store?.id ? `/api/staff/store/${store.id}/staff/` : null,
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );
  const totalStaff = staffData?.length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Store Header */}
      <div className="bg-gradient-to-r from-[#00694C] to-[#00896A] rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-5 flex items-center gap-5">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/20">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden border border-white/20 shrink-0">
            {store?.image
              ? <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
              : <LucideStore className="w-7 h-7 text-white/80" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white font-serif font-bold text-xl leading-tight truncate">{store?.name}</h2>
              {currentActiveShift && (
                <span className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />ACTIVE
                </span>
              )}
            </div>
            {store?.address && (
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{store.address}</span>
              </div>
            )}
          </div>
          
          {/* Stats on the right */}
          <div className="hidden sm:flex items-center gap-8 shrink-0 border-l border-white/10 pl-8">
            <div className="text-center">
               <div className="text-white/60 text-[9px] font-bold uppercase tracking-widest mb-1">Active Staff</div>
               <div className="text-white font-serif font-bold text-2xl leading-none tabular-nums">{totalStaff}</div>
            </div>
            <div className="text-center">
               <div className="text-white/60 text-[9px] font-bold uppercase tracking-widest mb-1">Products</div>
               <div className="text-white font-serif font-bold text-2xl leading-none tabular-nums">{totalProducts}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 db-scroll">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id ? 'bg-[#00694C] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-[#00694C]/30'}`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && <StoreDetailsTab store={store} currentActiveShift={currentActiveShift} onCheckIn={onCheckIn} isCheckingIn={isCheckingIn} />}
      {activeTab === "products" && <StoreProductsTab storeId={store?.id} storeName={store?.name} />}
      {activeTab === "orders" && <StoreOrderHistoryTab profile={profile} />}
    </div>
  );
}