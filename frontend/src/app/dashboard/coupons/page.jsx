"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Ticket, Truck, Eye, Calendar, CalendarDays, Settings, Percent, Package, X } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { couponsService, freeShippingRulesService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 20;
const TABS = [
  { id: "coupons", label: "Coupons" },
  { id: "freeshipping", label: "Free Shipping Rules" },
];

const COUPON_TYPES = [
  { value: "PRODUCT_DISCOUNT", label: "Product Discount" },
  { value: "MIN_PRODUCT_QUANTITY", label: "Minimum Product Quantity" },
  { value: "SHIPPING_DISCOUNT", label: "Shipping Discount" },
  { value: "CART_TOTAL_DISCOUNT", label: "Cart Total Discount" },
  { value: "FIRST_TIME_USER", label: "First Time User" },
  { value: "USER_SPECIFIC", label: "User Specific" },
];

const inp = "w-full min-w-0 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-white transition-all";
const lbl = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

function toLocalDatetime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── View Modal ────────────────────────────────────────────────────────
function CouponViewModal({ open, item, type, onClose }) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${type === 'coupons' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
              {type === 'coupons' ? <Ticket size={17} className="text-indigo-600" /> : <Truck size={17} className="text-emerald-600" />}
            </div>
            <p className="font-bold text-slate-800">{type === 'coupons' ? 'Coupon Details' : 'Free Shipping Rule Details'}</p>
          </div>
          <button style={{cursor: 'pointer'}} onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
             <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {type === 'coupons' ? (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coupon Code</p>
                   <h2 className="text-3xl font-black text-[#00694C] uppercase tracking-wide">{item.code}</h2>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   <span className={`px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-md ${item.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                     {item.active ? 'Active' : 'Inactive'}
                   </span>
                   {item.is_expired ? <span className="text-xs text-red-500 font-bold">EXPIRED</span> : <span className="text-xs text-green-600 font-bold">VALID</span>}
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                    <p className="text-sm font-semibold text-slate-800">{item.type_display || item.type}</p>
                 </div>
                 <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider mb-1">Discount</p>
                    <p className="text-lg font-black text-amber-600">
                      {item.discount_type === "FLAT" ? `€${parseFloat(item.discount_amount).toFixed(2)}` : `${item.discount_percent}% OFF`}
                    </p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Usage</p>
                    <p className="text-sm font-semibold text-slate-800">{item.used_count || 0} / {item.usage_limit || "Unlimited"}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Quantity</p>
                    <p className="text-sm font-semibold text-slate-800">{item.min_quantity_required || 1}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target User</p>
                    <p className="text-sm font-semibold text-slate-800">{item.target_user_type || "All Users"}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                   <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                     <CalendarDays size={16} className="text-blue-500" />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Valid From</p>
                     <p className="text-sm font-semibold text-slate-800">{item.valid_from ? new Date(item.valid_from).toLocaleString() : "—"}</p>
                   </div>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                   <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                     <Calendar size={16} className="text-orange-500" />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expires At</p>
                     <p className="text-sm font-semibold text-slate-800">{item.expires_at ? new Date(item.expires_at).toLocaleString() : "—"}</p>
                   </div>
                 </div>
               </div>

               {item.applicable_products_data?.length > 0 && (
                 <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                   <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                     <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Package size={14} /> Applicable Products ({item.applicable_products_data.length})</h4>
                   </div>
                   <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white p-2">
                     {item.applicable_products_data.map((prod, idx) => (
                        <div key={idx} className="text-sm font-semibold text-slate-700 px-3 py-1.5">{prod.name}</div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rule Name</p>
                 <h2 className="text-2xl font-black text-slate-800">{item.name || "Unnamed Rule"}</h2>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Threshold Amount</p>
                    <p className="text-2xl font-black text-emerald-700">€{parseFloat(item.threshold_amount).toFixed(2)}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <div className="mt-1">
                      <span className={`px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-md ${item.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <button style={{cursor: 'pointer'}} onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Coupon Form ────────────────────────────────────────────── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function CouponForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  // Derive initial applicable_products IDs from applicable_products_data or applicable_products
  const initProductIds = (() => {
    if (initial.applicable_products_data?.length)
      return initial.applicable_products_data.map(p => p.id);
    if (initial.applicable_products?.length)
      return initial.applicable_products;
    return [];
  })();

  const [v, setV] = useState({
    code: "", type: "PRODUCT_DISCOUNT",
    discount_type: "PERCENT",
    discount_percent: "", discount_amount: "",
    min_quantity_required: "1",
    min_cart_total: "", usage_limit: "", active: "true", valid_from: "", expires_at: "",
    ...initial,
    discount_type: initial.discount_type || "PERCENT",
    discount_percent: initial.discount_percent != null ? String(initial.discount_percent) : "",
    discount_amount:  initial.discount_amount  != null ? String(initial.discount_amount)  : "",
    active: String(initial.active ?? true),
    usage_limit: initial.usage_limit != null ? String(initial.usage_limit) : "",
    valid_from: toLocalDatetime(initial.valid_from),
    expires_at: toLocalDatetime(initial.expires_at),
  });

  const [selectedProductIds, setSelectedProductIds] = useState(initProductIds);
  const [products, setProducts]   = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const set = (k, val) => setV(p => ({ ...p, [k]: val }));

  // Load products list once
  useState(() => {
    setProdLoading(true);
    fetch(`${API_BASE}/products/products/?page_size=200`)
      .then(r => r.json())
      .then(d => setProducts(d.results || d))
      .catch(() => {})
      .finally(() => setProdLoading(false));
  });

  const toggleProduct = (id) =>
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        code:                 v.code,
        type:                 v.type,
        discount_type:        v.discount_type,
        discount_percent:     v.discount_type === "PERCENT" ? (v.discount_percent || 0) : 0,
        discount_amount:      v.discount_type === "FLAT"    ? (v.discount_amount  || 0) : 0,
        min_quantity_required: parseInt(v.min_quantity_required) || 1,
        min_cart_total:       v.min_cart_total || null,
        usage_limit:          v.usage_limit ? parseInt(v.usage_limit) : null,
        active:               v.active === "true",
        valid_from:           v.valid_from ? new Date(v.valid_from).toISOString() : null,
        expires_at:           v.expires_at ? new Date(v.expires_at).toISOString() : null,
        applicable_products:  selectedProductIds,
        target_user_type:     v.target_user_type || null,
      });
    } finally { setSubmitting(false); }
  };

  const btnBase = "px-4 py-2.5 text-sm rounded-xl border transition-all cursor-pointer font-bold shadow-sm";
  const btnActive = `${btnBase} bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-500/20`;
  const btnInactive = `${btnBase} bg-white border-slate-200 text-slate-500 hover:bg-slate-50`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Setup */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-4 h-4 text-slate-400" /> Coupon Configuration
           </h3>

           <div><label className={lbl}>Coupon Code *</label><input required className={inp + " uppercase font-black tracking-widest text-[#00694C]"} value={v.code} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="e.g., SAVE20" /></div>
           
           <div>
             <label className={lbl}>Coupon Type *</label>
             <SearchableSelect required value={v.type} onChange={val => set("type", val)} options={COUPON_TYPES} />
           </div>

           <div>
             <label className={lbl}>Target User Type</label>
             <SearchableSelect
               value={v.target_user_type || ""}
               onChange={val => set("target_user_type", val)}
               options={[
                 { value: "", label: "All Users" },
                 { value: "CUSTOMER", label: "Normal Users" },
                 { value: "WHOLESALE", label: "Wholesale Users" },
                 { value: "RESTAURANT", label: "Restaurant Users" },
               ]}
             />
           </div>

           <div>
             <label className={lbl}>Discount Type *</label>
             <div className="flex gap-3">
               <button style={{cursor: 'pointer'}} type="button" className={`flex-1 ${v.discount_type === "PERCENT" ? btnActive : btnInactive}`} onClick={() => set("discount_type", "PERCENT")}>% Percentage</button>
               <button style={{cursor: 'pointer'}} type="button" className={`flex-1 ${v.discount_type === "FLAT" ? btnActive : btnInactive}`} onClick={() => set("discount_type", "FLAT")}>€ Flat Amount</button>
             </div>
           </div>

           {v.discount_type === "PERCENT" ? (
             <div><label className={lbl}>Discount % *</label><input required type="number" min="0" max="100" step="0.01" className={`${inp} text-amber-600 font-bold bg-amber-50/30`} value={v.discount_percent} onChange={e => set("discount_percent", e.target.value)} placeholder="e.g., 20" /></div>
           ) : (
             <div><label className={lbl}>Flat Discount Amount (€) *</label><input required type="number" min="0" step="0.01" className={`${inp} text-amber-600 font-bold bg-amber-50/30`} value={v.discount_amount} onChange={e => set("discount_amount", e.target.value)} placeholder="e.g., 50" /></div>
           )}

           <div className="grid grid-cols-2 gap-4">
             <div><label className={lbl}>Min Quantity</label><input type="number" min="1" className={inp} value={v.min_quantity_required} onChange={e => set("min_quantity_required", e.target.value)} /></div>
             <div><label className={lbl}>Usage Limit</label><input type="number" min="1" className={inp} value={v.usage_limit} onChange={e => set("usage_limit", e.target.value)} placeholder="Unlimited" /></div>
           </div>

           {v.type === "CART_TOTAL_DISCOUNT" && (
             <div><label className={lbl}>Min Cart Total (€)</label><input type="number" min="0" step="0.01" className={inp} value={v.min_cart_total || ""} onChange={e => set("min_cart_total", e.target.value)} placeholder="0.00" /></div>
           )}
        </div>

        {/* RIGHT COLUMN: Limits & Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-slate-400" /> Active Period & Products
           </h3>

           <div className="grid grid-cols-2 gap-4">
             <div><label className={lbl}>Valid From *</label><input required type="datetime-local" className={`${inp} cursor-pointer`} value={v.valid_from} onChange={e => set("valid_from", e.target.value)} /></div>
             <div><label className={lbl}>Expires At *</label><input required type="datetime-local" className={`${inp} cursor-pointer`} value={v.expires_at} onChange={e => set("expires_at", e.target.value)} /></div>
           </div>

           <div>
             <label className={lbl}>Status</label>
             <SearchableSelect value={v.active} onChange={val => set("active", val)} options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
           </div>

           <div className="flex flex-col flex-1 mt-2">
             <label className={lbl}>Applicable Products <span className="text-slate-400 font-normal lowercase">(leave empty = all products)</span></label>
             {prodLoading ? (
               <div className="p-4 text-center text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">Loading products...</div>
             ) : (
               <div className="border border-slate-200 rounded-xl bg-slate-50 h-48 overflow-y-auto divide-y divide-slate-100 shadow-inner p-1">
                 {products.map(p => (
                   <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white rounded-lg transition-colors">
                     <input
                       type="checkbox"
                       checked={selectedProductIds.includes(p.id)}
                       onChange={() => toggleProduct(p.id)}
                       className="w-4 h-4 text-[#00694C] bg-slate-100 border-slate-300 rounded focus:ring-[#00694C] focus:ring-2"
                     />
                     <span className="text-sm font-medium text-slate-700">{p.name}</span>
                   </label>
                 ))}
                 {products.length === 0 && <p className="text-xs text-slate-400 px-3 py-2">No products found.</p>}
               </div>
             )}
             {selectedProductIds.length > 0 && (
               <p className="text-xs font-bold text-indigo-600 mt-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 inline-block w-fit">
                  {selectedProductIds.length} product(s) selected
               </p>
             )}
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-5 border-t border-slate-200">
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="px-8 py-3 text-sm font-black tracking-wide bg-[#00694C] text-white rounded-xl hover:bg-[#085041] disabled:opacity-50 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto">
          {submitting ? "SAVING..." : submitLabel.toUpperCase()}
        </button>
      </div>
    </form>
  );
}

/* ─── Free Shipping Rule Form ────────────────────────────────── */
function FreeShippingForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [threshold, setThreshold] = useState(initial.threshold_amount || "");
  const [active, setActive] = useState(String(initial.active ?? true));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, threshold_amount: threshold, active: active === "true" });
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div><label className={lbl}>Rule Name</label><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Free shipping over €500" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div><label className={lbl}>Threshold Amount (€) *</label><input required type="number" min="0" step="0.01" className={`${inp} text-emerald-700 font-bold bg-emerald-50/50`} value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="e.g., 500" /></div>
          <div>
            <label className={lbl}>Status</label>
            <SearchableSelect
              value={active}
              onChange={setActive}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="px-8 py-3 text-sm font-black tracking-wide bg-[#00694C] text-white rounded-xl hover:bg-[#085041] disabled:opacity-50 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto">
          {submitting ? "SAVING..." : submitLabel.toUpperCase()}
        </button>
      </div>
    </form>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CouponsPage() {
  const toast = useToastContext();
  const [tab, setTab] = useState("coupons");
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [viewModal, setViewModal] = useState({ open: false, item: null, type: "coupons" });
  const [confirm, setConfirm] = useState({ open: false, item: null, tab: null });

  const coupons = useModel(couponsService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const freeShipping = useModel(freeShippingRulesService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const couponColumns = [
    { key: "code", label: "Code", render: (v) => <span className="font-bold text-[#00694C] cursor-pointer hover:underline">{v}</span> },
    { key: "type_display", label: "Type" },
    { key: "discount_percent", label: "Discount", render: (v, row) => (
      <span className="font-bold text-amber-600">
        {row.discount_type === "FLAT" ? `€${parseFloat(row.discount_amount).toFixed(2)}` : `${v}% OFF`}
      </span>
    )},
    { key: "usage_limit", label: "Usage", render: (v, row) => v != null ? <span className="text-xs font-semibold">{row.used_count}/{v}</span> : <span className="text-xs text-slate-400 font-medium">Unlimited</span> },
    { key: "active", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-bold tracking-wide ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
    { key: "is_expired", label: "Expired", render: (v) => v ? <span className="text-xs text-red-500 font-bold uppercase">Expired</span> : <span className="text-xs text-green-600 font-bold uppercase">Valid</span> },
    { key: "valid_from", label: "Valid From", render: formatDate },
    { key: "expires_at", label: "Expires", render: formatDate },
  ];

  const freeShippingColumns = [
    { key: "name", label: "Name", render: (v) => v ? <span className="font-bold text-[#00694C] cursor-pointer hover:underline">{v}</span> : <span className="text-slate-400 text-xs font-medium cursor-pointer hover:underline">Unnamed</span> },
    { key: "threshold_amount", label: "Threshold (€)", render: (v) => <span className="font-bold text-slate-700">€{parseFloat(v).toLocaleString()}</span> },
    { key: "applicable_categories", label: "Categories", render: (v) => v?.length ? <span className="font-medium text-slate-700">{v.map(c => c.name).join(", ")}</span> : <span className="text-slate-400 text-xs font-medium bg-slate-50 px-2 py-1 rounded">All categories</span> },
    { key: "active", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-bold tracking-wide ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
    { key: "created_at", label: "Created", render: formatDate },
  ];

  const getModel = () => tab === "coupons" ? coupons : freeShipping;
  const getColumns = () => tab === "coupons" ? couponColumns : freeShippingColumns;
  const getLabel = () => tab === "coupons" ? "Coupon" : "Free Shipping Rule";

  const handleSave = async (data) => {
    const model = getModel();
    if (modal.mode === "edit") await model.update(modal.item.id, data);
    else await model.create(data);
  };

  const handleDelete = async () => {
    try {
      const model = confirm.tab === "coupons" ? coupons : freeShipping;
      await model.remove(confirm.item.id);
      setConfirm({ open: false, item: null, tab: null });
    } catch (e) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const actions = (row) => (
    <div className="flex items-center gap-1">
      <button style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, item: row, type: tab }); }} className="p-1.5 rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
      <button style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setModal({ open: true, mode: "edit", item: row }); }} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"><Pencil className="w-4 h-4" /></button>
      <button style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setConfirm({ open: true, item: row, tab }); }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  return (
    <Container title="Coupons & Promotions" description="Manage discount coupons and free shipping rules">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
          {TABS.map(t => (
            <button style={{cursor: 'pointer'}} key={t.id} onClick={() => { setTab(t.id); setModal({ open: false, mode: "create", item: null }); setConfirm({ open: false, item: null, tab: null }); }} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === t.id ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
        <button style={{cursor: 'pointer'}} onClick={() => setModal({ open: true, mode: "create", item: null })} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add {getLabel()}
        </button>
      </div>

      <DataTable
        key={tab}
        columns={getColumns()}
        data={getModel().data}
        loading={getModel().loading}
        actions={actions}
        serverSide
        totalItems={getModel().totalCount}
        currentPage={getModel().params.page || 1}
        pageSize={PAGE_SIZE}
        searchable
        searchValue={getModel().params.search || ""}
        onSearch={(q) => { getModel().setSearch(q); getModel().setPage(1); }}
        onPageChange={getModel().setPage}
        onRowClick={(row) => setViewModal({ open: true, item: row, type: tab })}
        emptyMessage={`No ${tab === "coupons" ? "coupons" : "free shipping rules"} found`}
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: "create", item: null })} title={`${modal.mode === "edit" ? "Edit" : "Add"} ${getLabel()}`} maxWidth={tab === "coupons" ? "max-w-5xl" : "max-w-2xl"}>
        {tab === "coupons" ? (
          <CouponForm initial={modal.mode === "edit" ? modal.item : {}} onSubmit={handleSave} submitLabel={modal.mode === "edit" ? "Update" : "Create"} />
        ) : (
          <FreeShippingForm initial={modal.mode === "edit" ? modal.item : {}} onSubmit={handleSave} submitLabel={modal.mode === "edit" ? "Update" : "Create"} />
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, item: null, tab: null })} onConfirm={handleDelete} title={`Delete ${getLabel()}`} message={`Are you sure you want to delete ${confirm.tab === "coupons" ? `"${confirm.item?.code}"` : "this rule"}? This action cannot be undone.`} />
      
      <CouponViewModal open={viewModal.open} item={viewModal.item} type={viewModal.type} onClose={() => setViewModal({ open: false, item: null, type: tab })} />
    </Container>
  );
}
