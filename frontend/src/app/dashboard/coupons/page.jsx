"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Ticket, Truck } from "lucide-react";
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

const inp = "w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

function toLocalDatetime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─── Coupon Form ────────────────────────────────────────────── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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
      });
    } finally { setSubmitting(false); }
  };

  const btnBase = "px-3 py-2 text-sm rounded-md border transition-colors cursor-pointer";
  const btnActive = `${btnBase} bg-white border-gray-400 text-slate-800 font-semibold`;
  const btnInactive = `${btnBase} bg-transparent border-gray-300 text-slate-500`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Code + Type */}
        <div><label className={lbl}>Coupon Code *</label><input required className={inp + " uppercase"} value={v.code} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="e.g., SAVE20" /></div>
        <div>
          <label className={lbl}>Coupon Type *</label>
          <SearchableSelect required value={v.type} onChange={val => set("type", val)} options={COUPON_TYPES} />
        </div>

        {/* Discount type toggle */}
        <div className="sm:col-span-2">
          <label className={lbl}>Discount Type *</label>
          <div className="flex gap-2">
            <button style={{cursor: 'pointer'}} type="button" className={v.discount_type === "PERCENT" ? btnActive : btnInactive} onClick={() => set("discount_type", "PERCENT")}>% Percentage</button>
            <button style={{cursor: 'pointer'}} type="button" className={v.discount_type === "FLAT"    ? btnActive : btnInactive} onClick={() => set("discount_type", "FLAT")}>€ Flat Amount</button>
          </div>
        </div>

        {/* Conditional discount field */}
        {v.discount_type === "PERCENT" ? (
          <div><label className={lbl}>Discount % *</label><input required type="number" min="0" max="100" step="0.01" className={inp} value={v.discount_percent} onChange={e => set("discount_percent", e.target.value)} placeholder="e.g., 20" /></div>
        ) : (
          <div><label className={lbl}>Flat Discount Amount (€) *</label><input required type="number" min="0" step="0.01" className={inp} value={v.discount_amount} onChange={e => set("discount_amount", e.target.value)} placeholder="e.g., 50" /></div>
        )}

        {/* Min quantity + usage limit */}
        <div><label className={lbl}>Min Quantity</label><input type="number" min="1" className={inp} value={v.min_quantity_required} onChange={e => set("min_quantity_required", e.target.value)} /></div>
        <div><label className={lbl}>Usage Limit</label><input type="number" min="1" className={inp} value={v.usage_limit} onChange={e => set("usage_limit", e.target.value)} placeholder="Unlimited" /></div>

        {/* Min cart total — only for CART_TOTAL_DISCOUNT */}
        {v.type === "CART_TOTAL_DISCOUNT" && (
          <div><label className={lbl}>Min Cart Total (€)</label><input type="number" min="0" step="0.01" className={inp} value={v.min_cart_total || ""} onChange={e => set("min_cart_total", e.target.value)} placeholder="0.00" /></div>
        )}

        {/* Status + dates */}
        <div>
          <label className={lbl}>Status</label>
          <SearchableSelect value={v.active} onChange={val => set("active", val)} options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
        </div>
        <div><label className={lbl}>Valid From *</label><input required type="datetime-local" className={`${inp} cursor-pointer`} value={v.valid_from} onChange={e => set("valid_from", e.target.value)} /></div>
        <div><label className={lbl}>Expires At *</label><input required type="datetime-local" className={`${inp} cursor-pointer`} value={v.expires_at} onChange={e => set("expires_at", e.target.value)} /></div>
      </div>

      {/* Applicable Products */}
      <div>
        <label className={lbl}>Applicable Products <span className="text-slate-400 font-normal">(leave empty = all products)</span></label>
        {prodLoading ? (
          <p className="text-xs text-slate-400 py-2">Loading products…</p>
        ) : (
          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto divide-y divide-gray-100">
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="accent-green-600"
                />
                <span className="text-sm text-gray-800">{p.name}</span>
              </label>
            ))}
            {products.length === 0 && <p className="text-xs text-slate-400 px-3 py-2">No products found.</p>}
          </div>
        )}
        {selectedProductIds.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">{selectedProductIds.length} product(s) selected</p>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50">
          {submitting ? "Saving..." : submitLabel}
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>Rule Name</label><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Free shipping over €500" /></div>
        <div><label className={lbl}>Threshold Amount (€) *</label><input required type="number" min="0" step="0.01" className={inp} value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="e.g., 500" /></div>
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
      <div className="flex justify-end pt-1">
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50">
          {submitting ? "Saving..." : submitLabel}
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
    { key: "code", label: "Code", render: (v) => <code className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded">{v}</code> },
    { key: "type_display", label: "Type" },
    { key: "discount_percent", label: "Discount", render: (v, row) => (
      <span className="font-medium text-green-600">
        {row.discount_type === "FLAT" ? `€${parseFloat(row.discount_amount).toFixed(2)}` : `${v}%`}
      </span>
    )},
    { key: "usage_limit", label: "Usage", render: (v, row) => v != null ? <span className="text-xs">{row.used_count}/{v}</span> : <span className="text-xs text-slate-400">Unlimited</span> },
    { key: "active", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
    { key: "is_expired", label: "Expired", render: (v) => v ? <span className="text-xs text-red-500 font-medium">Expired</span> : <span className="text-xs text-green-600">Valid</span> },
    { key: "valid_from", label: "Valid From", render: formatDate },
    { key: "expires_at", label: "Expires", render: formatDate },
  ];

  const freeShippingColumns = [
    { key: "name", label: "Name", render: (v) => v || <span className="text-slate-400 text-xs">Unnamed</span> },
    { key: "threshold_amount", label: "Threshold (€)", render: (v) => <span className="font-medium">€{parseFloat(v).toLocaleString()}</span> },
    { key: "applicable_categories", label: "Categories", render: (v) => v?.length ? v.map(c => c.name).join(", ") : <span className="text-slate-400 text-xs">All categories</span> },
    { key: "active", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
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
      <button style={{cursor: 'pointer'}} onClick={() => setModal({ open: true, mode: "edit", item: row })} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
      <button style={{cursor: 'pointer'}} onClick={() => setConfirm({ open: true, item: row, tab })} className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
        emptyMessage={`No ${tab === "coupons" ? "coupons" : "free shipping rules"} found`}
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: "create", item: null })} title={`${modal.mode === "edit" ? "Edit" : "Add"} ${getLabel()}`}>
        {tab === "coupons" ? (
          <CouponForm initial={modal.mode === "edit" ? modal.item : {}} onSubmit={handleSave} submitLabel={modal.mode === "edit" ? "Update" : "Create"} />
        ) : (
          <FreeShippingForm initial={modal.mode === "edit" ? modal.item : {}} onSubmit={handleSave} submitLabel={modal.mode === "edit" ? "Update" : "Create"} />
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, item: null, tab: null })} onConfirm={handleDelete} title={`Delete ${getLabel()}`} message={`Are you sure you want to delete ${confirm.tab === "coupons" ? `"${confirm.item?.code}"` : "this rule"}? This action cannot be undone.`} />
    </Container>
  );
}
