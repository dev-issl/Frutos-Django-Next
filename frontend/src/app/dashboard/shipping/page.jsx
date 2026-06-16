"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, Trash2, Truck, Tag, Layers } from "lucide-react";
import useSWR from "swr";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { shippingMethodsService, shippingCategoriesService, shippingTiersService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 15;
const TABS = [
  { id: "methods", label: "Shipping Methods", icon: Truck },
  { id: "categories", label: "Shipping Categories", icon: Tag },
  { id: "tiers", label: "Pricing Tiers", icon: Layers },
];

const inp = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

/* ─── Method Form ─────────────────────────────────────────── */
function MethodForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [v, setV] = useState({
    name: "", description: "", price: "", delivery_estimated_time: "",
    max_weight: "", max_quantity: "", preferred_pricing_type: "quantity", is_active: "true",
    is_wholesale_only: false,
    ...initial, 
    is_active: String(initial.is_active ?? true),
    is_wholesale_only: Boolean(initial.is_wholesale_only ?? false),
  });
  const set = (k, val) => setV(p => ({ ...p, [k]: val }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...v, price: v.price || "0", is_active: v.is_active === "true", max_weight: v.max_weight || null, max_quantity: v.max_quantity ? parseInt(v.max_quantity) : null, is_wholesale_only: v.is_wholesale_only }); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>Method Name *</label><input required className={inp} value={v.name} onChange={e => set("name", e.target.value)} placeholder="e.g., Standard Shipping" /></div>
        <div><label className={lbl}>Base Price (৳) *</label><input required type="number" min="0" step="0.01" className={inp} value={v.price} onChange={e => set("price", e.target.value)} placeholder="0.00" /></div>
        <div><label className={lbl}>Estimated Delivery Time</label><input className={inp} value={v.delivery_estimated_time || ""} onChange={e => set("delivery_estimated_time", e.target.value)} placeholder="e.g., 3–5 business days" /></div>
        <div>
          <label className={lbl}>Preferred Pricing Type</label>
          <SearchableSelect
            value={v.preferred_pricing_type}
            onChange={val => set("preferred_pricing_type", val)}
            options={[
              { value: "quantity", label: "Quantity-based" },
              { value: "weight", label: "Weight-based" },
            ]}
          />
        </div>
        <div><label className={lbl}>Max Weight (kg)</label><input type="number" min="0" step="0.01" className={inp} value={v.max_weight || ""} onChange={e => set("max_weight", e.target.value)} placeholder="Blank = no limit" /></div>
        <div><label className={lbl}>Max Quantity</label><input type="number" min="0" className={inp} value={v.max_quantity || ""} onChange={e => set("max_quantity", e.target.value)} placeholder="Blank = no limit" /></div>
        <div>
          <label className={lbl}>Status</label>
          <SearchableSelect
            value={v.is_active}
            onChange={val => set("is_active", val)}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
        </div>
      </div>
      <div><label className={lbl}>Description</label><textarea rows={2} className={inp + " resize-none"} value={v.description || ""} onChange={e => set("description", e.target.value)} /></div>
      <label className="flex items-center gap-2.5 cursor-pointer pt-1">
        <input type="checkbox" checked={v.is_wholesale_only} onChange={e => set("is_wholesale_only", e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
        <span className="text-sm text-slate-700 font-medium">Wholesale Only (Hide from retail customers)</span>
      </label>
      <div className="flex justify-end pt-1"><button type="submit" className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">{submitLabel}</button></div>
    </form>
  );
}

/* ─── Category Form ─────────────────────────────────────────── */
function CategoryForm({ initial = {}, allMethods = [], onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [desc, setDesc] = useState(initial.description || "");
  const [selected, setSelected] = useState(
    (initial.allowed_shipping_methods || []).map(m => (typeof m === "object" ? m.id : m))
  );
  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ name, description: desc, allowed_shipping_methods: selected }); }} className="space-y-4">
      <div><label className={lbl}>Category Name *</label><input required className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Electronics, Heavy Items, Fragile" /></div>
      <div><label className={lbl}>Description</label><textarea rows={2} className={inp + " resize-none"} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What product types belong here?" /></div>
      <div>
        <label className={lbl}>Allowed Shipping Methods <span className="text-slate-400 font-normal text-xs">(leave all unchecked = allow all)</span></label>
        <div className="border border-slate-200 rounded-md divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {allMethods.length === 0 && <p className="text-xs text-slate-400 p-3">No methods available.</p>}
          {allMethods.map(m => (
            <label key={m.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} className="rounded border-gray-300" />
              <span className="text-sm text-slate-700 flex-1">{m.name}</span>
              <span className="text-xs text-slate-400">৳{Number(m.price || 0).toLocaleString()}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-1"><button type="submit" className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">{submitLabel}</button></div>
    </form>
  );
}

/* ─── Tier Form ─────────────────────────────────────────────── */
function TierForm({ initial = {}, allMethods = [], onSubmit, onAddAnother, submitLabel = "Save" }) {
  const [v, setV] = useState({
    shipping_method: "", pricing_type: "quantity",
    min_quantity: "1", max_quantity: "", min_weight: "0", max_weight: "",
    base_price: "", has_incremental_pricing: false,
    increment_per_unit: "", increment_unit_size: "1.0", priority: "0",
    ...initial,
    shipping_method: String(initial.shipping_method?.id ?? initial.shipping_method ?? ""),
    has_incremental_pricing: Boolean(initial.has_incremental_pricing),
  });
  const set = (k, val) => setV(p => ({ ...p, [k]: val }));
  const isQty = v.pricing_type === "quantity";
  const buildData = () => ({
    shipping_method: Number(v.shipping_method),
    pricing_type: v.pricing_type,
    base_price: v.base_price,
    has_incremental_pricing: v.has_incremental_pricing,
    increment_per_unit: v.has_incremental_pricing ? (v.increment_per_unit || null) : null,
    increment_unit_size: v.has_incremental_pricing ? (v.increment_unit_size || "1.0") : "1.0",
    priority: parseInt(v.priority) || 0,
    ...(isQty
      ? { min_quantity: parseInt(v.min_quantity) || 0, max_quantity: v.max_quantity ? parseInt(v.max_quantity) : null, min_weight: null, max_weight: null }
      : { min_weight: parseFloat(v.min_weight) || 0, max_weight: v.max_weight ? parseFloat(v.max_weight) : null, min_quantity: null, max_quantity: null }),
  });
  const submit = e => { e.preventDefault(); onSubmit(buildData()); };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div className="sm:col-span-2">
          <label className={lbl}>Shipping Method *</label>
          <SearchableSelect
            required
            value={v.shipping_method}
            onChange={val => set("shipping_method", val)}
            placeholder="Select method…"
            options={allMethods.map(m => ({ value: m.id, label: `${m.name} — ৳${Number(m.price || 0).toLocaleString()}` }))}
          />
          <p className="text-[11px] text-slate-500 mt-1">Select the shipping method this pricing rule applies to.</p>
        </div>
        <div>
          <label className={lbl}>Pricing Type</label>
          <SearchableSelect
            value={v.pricing_type}
            onChange={val => set("pricing_type", val)}
            options={[
              { value: "quantity", label: "Quantity-based" },
              { value: "weight", label: "Weight-based" },
            ]}
          />
          <p className="text-[11px] text-slate-500 mt-1">Is this rule calculated by item count or total weight?</p>
        </div>
        <div>
          <label className={lbl}>Base Price (৳) *</label>
          <input required type="number" min="0" step="0.01" className={inp} value={v.base_price} onChange={e => set("base_price", e.target.value)} placeholder="0.00" />
          <p className="text-[11px] text-slate-500 mt-1">The fixed charge when an order falls into this range.</p>
        </div>
        
        {isQty ? (
          <>
            <div>
              <label className={lbl}>Min Quantity *</label>
              <input required type="number" min="0" className={inp} value={v.min_quantity} onChange={e => set("min_quantity", e.target.value)} />
              <p className="text-[11px] text-slate-500 mt-1">Order must have at least this many items.</p>
            </div>
            <div>
              <label className={lbl}>Max Quantity <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
              <input type="number" min="0" className={inp} value={v.max_quantity || ""} onChange={e => set("max_quantity", e.target.value)} />
              <p className="text-[11px] text-slate-500 mt-1">Leave blank if there is no upper limit.</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={lbl}>Min Weight (kg) *</label>
              <input required type="number" min="0" step="0.01" className={inp} value={v.min_weight} onChange={e => set("min_weight", e.target.value)} />
              <p className="text-[11px] text-slate-500 mt-1">Order must weigh at least this much (in kg).</p>
            </div>
            <div>
              <label className={lbl}>Max Weight (kg) <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
              <input type="number" min="0" step="0.01" className={inp} value={v.max_weight || ""} onChange={e => set("max_weight", e.target.value)} />
              <p className="text-[11px] text-slate-500 mt-1">Leave blank if there is no upper limit.</p>
            </div>
          </>
        )}
        
        <div className="sm:col-span-2">
          <label className={lbl}>Priority <span className="text-slate-400 font-normal text-xs">(higher = preferred)</span></label>
          <input type="number" min="0" className={inp} value={v.priority} onChange={e => set("priority", e.target.value)} />
          <p className="text-[11px] text-slate-500 mt-1">If multiple tiers match an order, the one with the highest priority is used.</p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={v.has_incremental_pricing} onChange={e => set("has_incremental_pricing", e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
          <span className="text-sm font-medium text-slate-800">Enable incremental pricing above the minimum</span>
        </label>
        <p className="text-[11px] text-slate-500 mt-1 ml-7">E.g., Charge an extra ৳50 for every 1 kg above the minimum weight.</p>
        
        {v.has_incremental_pricing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7 mt-3 border-l-2 border-emerald-200">
            <div>
              <label className={lbl}>Rate per additional {isQty ? "item" : "kg"} (৳) *</label>
              <input required type="number" min="0" step="0.01" className={inp} value={v.increment_per_unit || ""} onChange={e => set("increment_per_unit", e.target.value)} />
              <p className="text-[11px] text-slate-500 mt-1">How much to add to the base price.</p>
            </div>
            <div>
              <label className={lbl}>Charge per every N {isQty ? "items" : "kg"}</label>
              <input type="number" min="0.01" step="0.01" className={inp} value={v.increment_unit_size} onChange={e => set("increment_unit_size", e.target.value)} placeholder="1.0" />
              <p className="text-[11px] text-slate-500 mt-1">The step size (e.g. 1.0 means charge per every 1 {isQty ? "item" : "kg"}).</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3">
        {onAddAnother && (
          <button type="button" onClick={e => { e.preventDefault(); onAddAnother(buildData()); }} className="px-4 py-2 text-sm font-medium border border-gray-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors">
            Save &amp; Add Another
          </button>
        )}
        <button type="submit" className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">{submitLabel}</button>
      </div>
    </form>
  );
}

/* ─── Tiers Grouped View (admin-like) ────────────────────── */
function TiersGroupedView({ allMethods, tiers, loading, filterMethod, setFilterMethod, onAddForMethod, onEdit, onDelete }) {
  const [collapsed, setCollapsed] = useState({});
  const toggleCollapse = id => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  const visibleMethods = filterMethod
    ? allMethods.filter(m => String(m.id) === filterMethod)
    : allMethods;

  if (loading) {
    return <div className="py-8 text-center text-sm text-slate-400">Loading tiers…</div>;
  }

  if (allMethods.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-400">No shipping methods found. Add a method first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <select
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none w-full sm:w-72"
          value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
        >
          <option value="">All Shipping Methods</option>
          {allMethods.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
        </select>
        {filterMethod && (
          <button onClick={() => setFilterMethod("")} className="text-xs text-slate-400 hover:text-slate-600 underline whitespace-nowrap">Clear filter</button>
        )}
      </div>

      {visibleMethods.map(method => {
        const methodTiers = tiers.filter(t => String(t.shipping_method?.id ?? t.shipping_method) === String(method.id));
        const isOpen = !collapsed[method.id];
        return (
          <div key={method.id} className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Method header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer group" onClick={() => toggleCollapse(method.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="text-slate-400 group-hover:text-slate-600 transition-transform duration-150"
                  style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  onClick={e => { e.stopPropagation(); toggleCollapse(method.id); }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="min-w-0">
                  <span className="font-medium text-sm text-slate-800">{method.name}</span>
                  <span className="ml-2 text-xs text-slate-400">Base ৳{Number(method.price || 0).toLocaleString()}</span>
                  {method.delivery_estimated_time && <span className="ml-2 text-xs text-slate-400">· {method.delivery_estimated_time}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-slate-600">
                  {methodTiers.length} tier{methodTiers.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onAddForMethod(method); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#00694C] text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Tier
                </button>
              </div>
            </div>

            {/* Tiers table */}
            {isOpen && (
              <div className="divide-y divide-gray-100">
                {methodTiers.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-slate-400 italic text-center">
                    No pricing tiers. Click <span className="font-medium text-slate-500">Add Tier</span> to create one.
                  </div>
                ) : (
                  <>
                    {/* Header row */}
                    <div className="hidden sm:grid grid-cols-[90px_100px_160px_120px_90px_80px_auto] gap-3 px-4 py-2 bg-slate-50/80 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      <span>Type</span><span>Range</span><span>Base Price</span><span>Incremental</span><span>Rate/unit</span><span>Priority</span><span className="text-right">Actions</span>
                    </div>
                    {methodTiers.map(tier => (
                      <div key={tier.id} className="grid grid-cols-1 sm:grid-cols-[90px_100px_160px_120px_90px_80px_auto] gap-x-3 gap-y-1 px-4 py-3 items-center text-sm text-slate-700 hover:bg-slate-50/50 transition-colors">
                        <span className="text-xs font-medium">{tier.pricing_type === 'weight' ? 'Weight' : 'Qty'}</span>
                        <span className="text-xs">{tier.applicable_range || '—'}</span>
                        <span className="font-medium text-slate-800">৳{Number(tier.base_price || 0).toLocaleString()}</span>
                        <span>{tier.has_incremental_pricing ? <span className="text-xs text-emerald-600 font-medium">✓ Yes</span> : <span className="text-xs text-slate-400">No</span>}</span>
                        <span className="text-xs">{tier.has_incremental_pricing && tier.increment_per_unit ? `৳${Number(tier.increment_per_unit).toLocaleString()}` : '—'}</span>
                        <span className="text-xs text-slate-400">{tier.priority ?? 0}</span>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => onEdit(tier)} className="db-icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDelete(tier)} className="db-icon-btn danger"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {visibleMethods.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-400">
          No methods match the selected filter.
        </div>
      )}
    </div>
  );
}

function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function ShippingPage() {
  const toast = useToastContext();
  const [tab, setTab] = useState("methods");

  const methodsModel = useModel(shippingMethodsService, { defaultParams: { page_size: PAGE_SIZE } });
  const catsModel = useModel(shippingCategoriesService, { defaultParams: { page_size: PAGE_SIZE } });
  const tiersModel = useModel(shippingTiersService, { defaultParams: { page_size: 200 } });

  const [mCreate, setMCreate] = useState(false);
  const [mEdit, setMEdit] = useState(null);
  const [mView, setMView] = useState(null);
  const [mDel, setMDel] = useState(null);
  const [cCreate, setCCreate] = useState(false);
  const [cEdit, setCEdit] = useState(null);
  const [cView, setCView] = useState(null);
  const [cDel, setCDel] = useState(null);
  // tCreate: false | true | { method: methodObj } (pre-filled method)
  const [tCreate, setTCreate] = useState(false);
  const [tCreateKey, setTCreateKey] = useState(0);
  const [tEdit, setTEdit] = useState(null);
  const [tDel, setTDel] = useState(null);
  const [filterMethod, setFilterMethod] = useState("");

  const { data: allMethodsRaw } = useSWR(
    "all-shipping-methods-dropdown",
    () => shippingMethodsService.list({ page_size: 200 }),
    { revalidateOnFocus: false }
  );
  const allMethods = allMethodsRaw?.results || (Array.isArray(allMethodsRaw) ? allMethodsRaw : []);

  const withToast = async (fn, msg, onClose) => {
    try { await fn(); toast.success(msg); onClose(); } catch (e) { toast.error(e?.message || "Error"); }
  };

  const handleCreateMethod = v => withToast(() => methodsModel.create(v), "Method created", () => setMCreate(false));
  const handleEditMethod = v => withToast(() => methodsModel.patch(mEdit.id, v), "Method updated", () => setMEdit(null));
  const handleDeleteMethod = () => withToast(() => methodsModel.remove(mDel.id), "Method deleted", () => setMDel(null));
  const handleCreateCat = v => withToast(() => catsModel.create(v), "Category created", () => setCCreate(false));
  const handleEditCat = v => withToast(() => catsModel.patch(cEdit.id, v), "Category updated", () => setCEdit(null));
  const handleDeleteCat = () => withToast(() => catsModel.remove(cDel.id), "Category deleted", () => setCDel(null));
  const handleCreateTier = v => withToast(() => tiersModel.create(v), "Tier created", () => setTCreate(false));
  const handleCreateTierAndMore = async (v) => {
    try {
      await tiersModel.create(v);
      toast.success("Tier created");
      setTCreate({ method: { id: v.shipping_method } });
      setTCreateKey(k => k + 1);
    } catch (e) {
      toast.error(e?.message || "Error creating tier");
    }
  };
  const tCreateInitial = tCreate && typeof tCreate === 'object' && tCreate.method
    ? { shipping_method: tCreate.method }
    : {};
  const handleEditTier = v => withToast(() => tiersModel.patch(tEdit.id, v), "Tier updated", () => setTEdit(null));
  const handleDeleteTier = () => withToast(() => tiersModel.remove(tDel.id), "Tier deleted", () => setTDel(null));

  const methodCols = [
    { key: "name", label: "Method Name", render: (v, row) => (
        <div className="flex items-center gap-2">
            <span>{v}</span>
            {row.is_wholesale_only && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">Wholesale Only</span>}
        </div>
    ) },
    { key: "price", label: "Base Price", render: v => `৳${Number(v || 0).toLocaleString()}` },
    { key: "delivery_estimated_time", label: "Delivery", render: v => v || "—" },
    { key: "preferred_pricing_type", label: "Pricing", render: v => v === "weight" ? "By Weight" : "By Quantity" },
    { key: "is_active", label: "Status", render: v => <ActiveBadge active={v} /> },
  ];
  const catCols = [
    { key: "name", label: "Category Name" },
    { key: "description", label: "Description", render: v => v ? <span className="block max-w-[300px] truncate" title={v}>{v}</span> : "—" },
    { key: "allowed_shipping_methods", label: "Methods", render: v => <span className="font-medium">{Array.isArray(v) ? v.length : 0} method(s)</span> },
  ];

  const ab = (row, onV, onE, onD) => (
    <div className="flex items-center justify-end gap-1">
      {onV && <button onClick={() => onV(row)} className="db-icon-btn"><Eye className="w-3.5 h-3.5" /></button>}
      <button onClick={() => onE(row)} className="db-icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={() => onD(row)} className="db-icon-btn danger"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <Container
      title="Shipping Management"
      description="Manage shipping methods, categories and pricing tiers"
      actions={
        tab === "methods" ? <button onClick={() => setMCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors"><Plus className="w-4 h-4" /> Add Method</button>
        : tab === "categories" ? <button onClick={() => setCCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors"><Plus className="w-4 h-4" /> Add Category</button>
        : <button onClick={() => setTCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors"><Plus className="w-4 h-4" /> Add Tier</button>

      }
    >
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {TABS.map(t => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => { setTab(t.id); setMCreate(false); setMEdit(null); setMView(null); setMDel(null); setCCreate(false); setCEdit(null); setCView(null); setCDel(null); setTCreate(false); setTEdit(null); setTDel(null); }} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-gray-900 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <Icon className="w-4 h-4" />{t.label}
          </button>
        ); })}
      </div>

      {tab === "methods" && (
        <DataTable columns={methodCols} data={methodsModel.data} serverSide totalItems={methodsModel.totalCount}
          currentPage={methodsModel.params.page} pageSize={PAGE_SIZE}
          onSearch={q => { methodsModel.setSearch(q); methodsModel.setPage(1); }} onPageChange={methodsModel.setPage}
          loading={methodsModel.loading} searchable actions={row => ab(row, setMView, setMEdit, setMDel)} />
      )}
      {tab === "categories" && (
        <DataTable columns={catCols} data={catsModel.data} serverSide totalItems={catsModel.totalCount}
          currentPage={catsModel.params.page} pageSize={PAGE_SIZE}
          onSearch={q => { catsModel.setSearch(q); catsModel.setPage(1); }} onPageChange={catsModel.setPage}
          loading={catsModel.loading} searchable actions={row => ab(row, setCView, setCEdit, setCDel)} />
      )}
      {tab === "tiers" && (
        <TiersGroupedView
          allMethods={allMethods}
          tiers={tiersModel.data || []}
          loading={tiersModel.loading}
          filterMethod={filterMethod}
          setFilterMethod={setFilterMethod}
          onAddForMethod={method => { setTCreate({ method }); }}
          onEdit={setTEdit}
          onDelete={setTDel}
        />
      )}

      {/* Method Modals */}
      <Modal open={mCreate} onClose={() => setMCreate(false)} title="Add Shipping Method" maxWidth="max-w-2xl">
        <MethodForm onSubmit={handleCreateMethod} submitLabel="Create Method" />
      </Modal>
      <Modal open={!!mEdit} onClose={() => setMEdit(null)} title="Edit Shipping Method" maxWidth="max-w-2xl">
        {mEdit && <MethodForm initial={mEdit} onSubmit={handleEditMethod} submitLabel="Save Changes" />}
      </Modal>
      <Modal open={!!mView} onClose={() => setMView(null)} title="Method Details" maxWidth="max-w-2xl">
        {mView && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[["Name",mView.name],["Base Price",`৳${Number(mView.price||0).toLocaleString()}`],["Delivery",mView.delivery_estimated_time||"—"],["Pricing",mView.preferred_pricing_type==="weight"?"By Weight":"By Quantity"],["Max Weight",mView.max_weight?`${mView.max_weight} kg`:"No limit"],["Max Qty",mView.max_quantity||"No limit"],["Status",mView.is_active?"Active":"Inactive"],["Wholesale Only",mView.is_wholesale_only?"Yes":"No"]].map(([k,val])=>(
                <div key={k} className="bg-slate-50 rounded-md p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="text-sm font-medium text-slate-800">{String(val)}</p>
                </div>
              ))}
            </div>
            {mView.description && <p className="text-sm text-slate-500 italic">{mView.description}</p>}
            {([...(mView.quantity_tiers||[]),...(mView.weight_tiers||[])].length>0)&&(
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Pricing Tiers</p>
                <div className="space-y-1.5">
                  {[...(mView.quantity_tiers||[]),...(mView.weight_tiers||[])].map((t,i)=>(
                    <div key={i} className="flex justify-between items-center text-sm px-3 py-2 bg-slate-50 rounded-md">
                      <span className="text-xs text-slate-500">{t.applicable_range}</span>
                      <span className="font-medium text-slate-800">৳{Number(t.base_price||0).toLocaleString()}</span>
                      {t.has_incremental_pricing&&<span className="text-xs text-emerald-600">+ incremental</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!mDel} onClose={() => setMDel(null)} onConfirm={handleDeleteMethod} title="Delete Shipping Method" message={`Delete "${mDel?.name}"?`} />

      {/* Category Modals */}
      <Modal open={cCreate} onClose={() => setCCreate(false)} title="Add Shipping Category" maxWidth="max-w-xl">
        <CategoryForm allMethods={allMethods} onSubmit={handleCreateCat} submitLabel="Create Category" />
      </Modal>
      <Modal open={!!cEdit} onClose={() => setCEdit(null)} title="Edit Shipping Category" maxWidth="max-w-xl">
        {cEdit && <CategoryForm initial={cEdit} allMethods={allMethods} onSubmit={handleEditCat} submitLabel="Save Changes" />}
      </Modal>
      <Modal open={!!cView} onClose={() => setCView(null)} title="Category Details" maxWidth="max-w-lg">
        {cView && (
          <div className="space-y-3">
            <p className="text-base font-semibold text-slate-800">{cView.name}</p>
            {cView.description && <p className="text-sm text-slate-500">{cView.description}</p>}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1.5">Allowed Methods ({(cView.allowed_shipping_methods||[]).length === 0 ? "All" : (cView.allowed_shipping_methods||[]).length})</p>
              {(cView.allowed_shipping_methods||[]).length === 0
                ? <p className="text-sm text-slate-400 italic">No restrictions — all active methods are allowed.</p>
                : <div className="space-y-1.5">{(cView.allowed_shipping_methods||[]).map(m=>(
                    <div key={m.id} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-md text-sm">
                      <span className="text-slate-700">{m.name}</span>
                      <span className="text-slate-400">৳{Number(m.price||0).toLocaleString()}</span>
                    </div>
                  ))}</div>
              }
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!cDel} onClose={() => setCDel(null)} onConfirm={handleDeleteCat} title="Delete Category" message={`Delete "${cDel?.name}"?`} />

      {/* Tier Modals */}
      <Modal open={!!tCreate} onClose={() => setTCreate(false)} title="Add Pricing Tier" maxWidth="max-w-2xl">
        <TierForm key={tCreateKey} initial={tCreateInitial} allMethods={allMethods} onSubmit={handleCreateTier} onAddAnother={handleCreateTierAndMore} submitLabel="Create Tier" />
      </Modal>
      <Modal open={!!tEdit} onClose={() => setTEdit(null)} title="Edit Pricing Tier" maxWidth="max-w-2xl">
        {tEdit && <TierForm initial={tEdit} allMethods={allMethods} onSubmit={handleEditTier} submitLabel="Save Changes" />}
      </Modal>
      <ConfirmDialog open={!!tDel} onClose={() => setTDel(null)} onConfirm={handleDeleteTier} title="Delete Pricing Tier" message="Delete this pricing tier?" />
    </Container>
  );
}


