


"use client";

import { useState } from "react";
import {
  Plus, Eye, Pencil, Trash2, X, Upload,
  Loader2, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import Container      from "@/app/dashboard/_components/Container";
import DataTable      from "@/app/dashboard/_components/DataTable";
import Modal          from "@/app/dashboard/_components/Modal";
import ConfirmDialog  from "@/app/dashboard/_components/ConfirmDialog";
import { useModel }   from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import {
  productsService, brandsService, colorsService,
  sizesService, subcategoriesService, categoriesService, shopsService,
} from "@/app/dashboard/_lib/services";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api   from "@/app/dashboard/_lib/api";

const PAGE_SIZE = 20;

const columns = [
  { key: "thumbnail_url", label: "", sortable: false, render: (v) => v ? (
    <img src={v} alt="" className="w-8 h-8 rounded object-cover" />
  ) : (
    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
    </div>
  )},
  { key: "name",           label: "Name" },
  { key: "price",          label: "Price",      render: (v) => `€${Number(v).toLocaleString()}` },
  { key: "discount_price", label: "Sale Price",  render: (v) => v ? `€${Number(v).toLocaleString()}` : "—" },
  { key: "stock",          label: "Stock" },
  { key: "shop",           label: "Shop",       render: (v) => v?.name || "—" },
  { key: "category",       label: "Category",   render: (v) => v?.name || "—" },
  { key: "is_active",      label: "Status",     render: (v) => v ? "active" : "inactive", type: "status" },
];

const TABS = [
  { id: "basic",       label: "Basic Info" },
  { id: "description", label: "Description" },
  { id: "nutritional", label: "Nutritional" },
  { id: "pricing",     label: "Pricing & Stock" },
  { id: "wholesale",   label: "Wholesale" },
  { id: "media",       label: "Media" },
  { id: "specs",       label: "Specifications" },
];

// ── Shared styles ──────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

// ── Product Form ───────────────────────────────────────────────
function ProductForm({
  initialValues, onSubmit, submitLabel = "Save",
  categories, brands, colors: propColors, sizes: propSizes, subcategories, shops,
}) {
  const [form, setForm] = useState({
    name: "", slug: "", description: "", nutritional_info: "",
    origin: "", unit: "", wholesale_unit: "", badge: "", badge_color: "",
    price: "", discount_price: "", wholesale_price: "",
    minimum_purchase: "", affiliate_commission_rate: "",
    stock: "", is_active: "true",
    weight: "", length: "", width: "", height: "",
    shop: "", brand: "", category: "", sub_category: "", shipping_category: "",
    colors: [], sizes: [],
    ...initialValues,
    shop:              initialValues?.shop?.id               || initialValues?.shop               || "",
    brand:             initialValues?.brand?.id              || initialValues?.brand              || "",
    category:          initialValues?.category?.id           || initialValues?.category           || "",
    sub_category:      initialValues?.sub_category?.id       || initialValues?.sub_category       || "",
    shipping_category: initialValues?.shipping_category?.id  || initialValues?.shipping_category  || "",
    colors:            initialValues?.colors?.map(c => c.id || c) || [],
    sizes:             initialValues?.sizes?.map(s => s.id  || s) || [],
    is_active:         String(initialValues?.is_active ?? true),
  });

  const [specs,            setSpecs]            = useState(initialValues?.specifications || []);
  const [thumbnail,        setThumbnail]        = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialValues?.thumbnail_url || "");
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [existingImages,   setExistingImages]   = useState(initialValues?.additional_images || []);
  const [removeImageIds,   setRemoveImageIds]   = useState([]);
  const [submitting,       setSubmitting]       = useState(false);
  const [error,            setError]            = useState("");
  const [showPhysical,     setShowPhysical]     = useState(false);
  const [activeTab,        setActiveTab]        = useState("basic");

  // Colors / Sizes (prop + inline-created)
  const [localColors, setLocalColors] = useState([]);
  const [localSizes,  setLocalSizes]  = useState([]);
  const colors = [...(propColors || []), ...localColors];
  const sizes  = [...(propSizes  || []), ...localSizes];

  // Quick-add color
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex,  setNewColorHex]  = useState("#000000");
  const [addingColor,  setAddingColor]  = useState(false);

  // Quick-add size
  const [showAddSize, setShowAddSize] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");
  const [addingSize,  setAddingSize]  = useState(false);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleMulti  = (key, id)    => setForm(prev => {
    const arr = prev[key] || [];
    return { ...prev, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
  });

  const handleAddColor = async () => {
    if (!newColorName.trim()) return;
    setAddingColor(true);
    try {
      const created = await colorsService.create({ name: newColorName.trim(), hex_code: newColorHex });
      const item = created?.id ? created : { id: created, name: newColorName.trim(), hex_code: newColorHex };
      setLocalColors(prev => [...prev, item]);
      setForm(prev => ({ ...prev, colors: [...prev.colors, item.id] }));
      setNewColorName(""); setNewColorHex("#000000"); setShowAddColor(false);
    } catch { } finally { setAddingColor(false); }
  };

  const handleAddSize = async () => {
    if (!newSizeName.trim()) return;
    setAddingSize(true);
    try {
      const created = await sizesService.create({ name: newSizeName.trim() });
      const item = created?.id ? created : { id: created, name: newSizeName.trim() };
      setLocalSizes(prev => [...prev, item]);
      setForm(prev => ({ ...prev, sizes: [...prev.sizes, item.id] }));
      setNewSizeName(""); setShowAddSize(false);
    } catch { } finally { setAddingSize(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const payload = {
        name:                     form.name,
        slug:                     form.slug || undefined,
        description:              form.description || "",
        nutritional_info:         form.nutritional_info || "",
        origin:                   form.origin || "",
        unit:                     form.unit || "",
        wholesale_unit:           form.wholesale_unit || "",
        badge:                    form.badge || "",
        badge_color:              form.badge_color || "",
        price:                    form.price,
        discount_price:           form.discount_price  || null,
        wholesale_price:          form.wholesale_price || null,
        minimum_purchase:         form.minimum_purchase || null,
        affiliate_commission_rate: form.affiliate_commission_rate || "",
        stock:                    form.stock || 0,
        is_active:                form.is_active === "true",
        weight:                   form.weight || null,
        length:                   form.length || null,
        width:                    form.width  || null,
        height:                   form.height || null,
        shop:                     form.shop              || null,
        brand:                    form.brand             || null,
        category:                 form.category          || null,
        sub_category:             form.sub_category      || null,
        shipping_category:        form.shipping_category || null,
        colors:                   form.colors,
        sizes:                    form.sizes,
      };

      const needsFormData = thumbnail || additionalImages.length > 0 || removeImageIds.length > 0 || thumbnailRemoved;
      if (needsFormData) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          if (Array.isArray(v)) { v.forEach(item => fd.append(k, item)); }
          else { fd.append(k, v); }
        });
        if (thumbnail)              fd.append("thumbnail", thumbnail);
        if (thumbnailRemoved && !thumbnail) fd.append("thumbnail", "");
        additionalImages.forEach(f => fd.append("additional_images", f));
        removeImageIds.forEach(id  => fd.append("remove_image_ids", id));
        const validSpecs = specs.filter(s => s.name && s.value);
        if (validSpecs.length > 0) fd.append("specifications_json", JSON.stringify(validSpecs));
        await onSubmit(fd);
      } else {
        const clean = Object.fromEntries(
          Object.entries(payload).filter(([, v]) => Array.isArray(v) || (v !== null && v !== undefined))
        );
        const validSpecs = specs.filter(s => s.name && s.value);
        if (validSpecs.length > 0) clean.specifications = validSpecs;
        await onSubmit(clean);
      }
    } catch (err) {
      let msg = "Something went wrong";
      if (err?.data) {
        const d = err.data;
        if (d.detail) msg = d.detail;
        else {
          const parts = Object.entries(d).map(([f, e]) => `${f.replace(/_/g, " ")}: ${Array.isArray(e) ? e[0] : e}`);
          msg = parts.join(" · ") || err.message || "Bad Request";
        }
      } else if (err?.message) msg = err.message;
      setError(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-2">

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 flex-wrap mb-4" style={{ borderBottom: "2px solid #f1f5f9", paddingBottom: "0" }}>
        {TABS.map(t => (
          <button style={{cursor: 'pointer'}} key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "700",
              borderRadius: "8px 8px 0 0",
              border: "none",
              cursor: "pointer",
              marginBottom: "-2px",
              borderBottom: activeTab === t.id ? "2px solid #0f172a" : "2px solid transparent",
              background: activeTab === t.id ? "#f8fafc" : "transparent",
              color: activeTab === t.id ? "#0f172a" : "#94a3b8",
              transition: "all 0.15s",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Basic Info ── */}
      {activeTab === "basic" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Product Name <span className="text-red-500">*</span></label>
              <input required className={inputCls} value={form.name}
                onChange={e => handleChange("name", e.target.value)} placeholder="e.g., Organic Apple" />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} value={form.slug}
                onChange={e => handleChange("slug", e.target.value)} placeholder="auto-generated" />
            </div>
            <div>
              <label className={labelCls}>Origin</label>
              <input className={inputCls} value={form.origin || ""}
                onChange={e => handleChange("origin", e.target.value)} placeholder="e.g., Spain" />
            </div>
            <div>
              <label className={labelCls}>Display Unit</label>
              <select className={inputCls} value={form.unit || ""} onChange={e => handleChange("unit", e.target.value)}>
                <option value="">Select a unit...</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="box">box</option>
                <option value="pcs">pcs</option>
                <option value="pack">pack</option>
                <option value="dozen">dozen</option>
                <option value="case">case</option>
                <option value="pallet">pallet</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Badge Label</label>
              <input className={inputCls} value={form.badge || ""}
                onChange={e => handleChange("badge", e.target.value)} placeholder="e.g., NEW, ORGANIC" />
            </div>
            <div>
              <label className={labelCls}>Badge Color</label>
              <input className={inputCls} value={form.badge_color || ""}
                onChange={e => handleChange("badge_color", e.target.value)} placeholder="e.g., bg-green-500" />
            </div>
            <div>
              <label className={labelCls}>Status <span className="text-red-500">*</span></label>
              <SearchableSelect required value={form.is_active} onChange={v => handleChange("is_active", v)}
                options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
            </div>
          </div>

          {/* Business */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className={labelCls}>Shop <span className="text-red-500">*</span></label>
              <SearchableSelect required value={form.shop} onChange={v => handleChange("shop", v)}
                placeholder="Select shop..." options={shops.map(s => ({ value: s.id, label: s.name }))} />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <SearchableSelect value={form.brand} onChange={v => handleChange("brand", v)}
                placeholder="Select brand..." options={brands.map(b => ({ value: b.id, label: b.name }))} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <SearchableSelect value={form.category} onChange={v => handleChange("category", v)}
                placeholder="Select category..." options={categories.map(c => ({ value: c.id, label: c.name }))} />
            </div>
            <div>
              <label className={labelCls}>Sub-Category</label>
              <SearchableSelect value={form.sub_category} onChange={v => handleChange("sub_category", v)}
                placeholder="Select sub-category..."
                options={(subcategories || [])
                  .filter(s => !form.category || String(s.category) === String(form.category))
                  .map(s => ({ value: s.id, label: s.name }))} />
            </div>
            <div>
              <label className={labelCls}>Shipping Category</label>
              <SearchableSelect value={form.shipping_category} onChange={v => handleChange("shipping_category", v)}
                placeholder="Select shipping category..."
                options={categories.map(c => ({ value: c.id, label: c.name }))} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Description ── */}
      {activeTab === "description" && (
        <div>
          <label className={labelCls}>Product Description</label>
          <textarea value={form.description} onChange={e => handleChange("description", e.target.value)}
            rows={12} className={`${inputCls} resize-y`} placeholder="Full product description... HTML supported." />
          <p className="text-xs text-slate-400 mt-1">Basic HTML tags are supported (bold, italic, lists etc.).</p>
        </div>
      )}

      {/* ── Tab: Nutritional Info ── */}
      {activeTab === "nutritional" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nutritional Information</label>
            <textarea value={form.nutritional_info || ""}
              onChange={e => handleChange("nutritional_info", e.target.value)}
              rows={10} className={`${inputCls} resize-y font-mono text-xs`}
              placeholder={"Per 100g:\nCalories: 52 kcal\nProtein: 0.3 g\nCarbohydrates: 14 g\nFat: 0.2 g\nFiber: 2.4 g\nSugar: 10 g"} />
            <p className="text-xs text-slate-400 mt-1">Shown on the Nutritional Info tab on the product page.</p>
          </div>
        </div>
      )}

      {/* ── Tab: Pricing & Stock ── */}
      {activeTab === "pricing" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Price (€) <span className="text-red-500">*</span></label>
              <input required type="number" step="0.01" min="0" className={inputCls}
                value={form.price} onChange={e => handleChange("price", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Sale Price (€)</label>
              <input type="number" step="0.01" min="0" className={inputCls}
                value={form.discount_price || ""} onChange={e => handleChange("discount_price", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Affiliate Commission %</label>
              <input type="number" step="0.01" min="0" max="100" className={inputCls}
                value={form.affiliate_commission_rate || ""} onChange={e => handleChange("affiliate_commission_rate", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Stock <span className="text-red-500">*</span></label>
              <input required type="number" min="0" className={inputCls}
                value={form.stock} onChange={e => handleChange("stock", e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Physical dimensions */}
          <div className="pt-2 border-t border-slate-100">
            <button style={{cursor: 'pointer'}} type="button" onClick={() => setShowPhysical(p => !p)}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-2">
              {showPhysical ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
              Physical dimensions (for shipping calculation)
            </button>
            {showPhysical && (
              <div className="grid grid-cols-4 gap-3">
                {[["weight","Weight (kg)"],["length","Length (cm)"],["width","Width (cm)"],["height","Height (cm)"]].map(([k, l]) => (
                  <div key={k}>
                    <label className={labelCls}>{l}</label>
                    <input type="number" step="0.01" min="0" className={inputCls}
                      value={form[k] || ""} onChange={e => handleChange(k, e.target.value)} placeholder="0.00" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Wholesale ── */}
      {activeTab === "wholesale" && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-indigo-900 mb-1">Wholesale Settings</h4>
            <p className="text-xs text-indigo-700">Configure special pricing and rules for your approved wholesale customers.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Wholesale Price (€)</label>
              <input type="number" step="0.01" min="0" className={inputCls}
                value={form.wholesale_price || ""} onChange={e => handleChange("wholesale_price", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Wholesale Unit</label>
              <select className={inputCls} value={form.wholesale_unit || ""} onChange={e => handleChange("wholesale_unit", e.target.value)}>
                <option value="">Select a unit...</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="box">box</option>
                <option value="pcs">pcs</option>
                <option value="pack">pack</option>
                <option value="dozen">dozen</option>
                <option value="case">case</option>
                <option value="pallet">pallet</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Min Purchase Qty</label>
              <input type="number" min="1" className={inputCls} value={form.minimum_purchase || ""}
                onChange={e => handleChange("minimum_purchase", e.target.value)} placeholder="e.g., 5" />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Media ── */}
      {activeTab === "media" && (
        <div className="space-y-5">
          {/* Thumbnail */}
          <div>
            <label className={labelCls}>Thumbnail Image</label>
            <div className="flex items-start gap-3">
              {thumbnailPreview && !thumbnailRemoved && (
                <div className="relative">
                  <img src={thumbnailPreview} alt="thumb"
                    className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
                  <button style={{cursor: 'pointer'}} type="button"
                    onClick={() => { setThumbnail(null); setThumbnailPreview(""); setThumbnailRemoved(true); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-slate-50 h-24 justify-center flex-col">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-400">Upload thumbnail</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setThumbnail(f); setThumbnailPreview(URL.createObjectURL(f)); setThumbnailRemoved(false); }
                }} />
              </label>
            </div>
          </div>

          {/* Additional images */}
          <div>
            <label className={labelCls}>Additional Images</label>
            <div className="flex flex-wrap gap-2">
              {existingImages.map(img => (
                <div key={img.id} className="relative">
                  <img src={img.image} alt=""
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                  <button style={{cursor: 'pointer'}} type="button"
                    onClick={() => { setExistingImages(prev => prev.filter(i => i.id !== img.id)); setRemoveImageIds(prev => [...prev, img.id]); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {additionalImages.map((f, i) => (
                <div key={`n-${i}`} className="relative">
                  <img src={URL.createObjectURL(f)} alt=""
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                  <button style={{cursor: 'pointer'}} type="button"
                    onClick={() => setAdditionalImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] text-slate-400 mt-1">Add more</span>
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e => setAdditionalImages(prev => [...prev, ...Array.from(e.target.files || [])])} />
              </label>
            </div>
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Colors</label>
              <button style={{cursor: 'pointer'}} type="button" onClick={() => setShowAddColor(v => !v)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> New Color
              </button>
            </div>
            {showAddColor && (
              <div className="flex items-center gap-2 mb-2 p-2 border border-dashed border-gray-300 rounded-md">
                <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)}
                  placeholder="Color name" className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-slate-800 focus:outline-none" />
                <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)}
                  className="w-8 h-7 rounded cursor-pointer border-0 p-0" />
                <button style={{cursor: 'pointer'}} type="button" onClick={handleAddColor} disabled={addingColor || !newColorName.trim()}
                  className="px-2 py-1 text-xs bg-[#00694C] text-white rounded disabled:opacity-50">
                  {addingColor ? "..." : "Add"}
                </button>
                <button style={{cursor: 'pointer'}} type="button" onClick={() => setShowAddColor(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button style={{cursor: 'pointer'}} key={c.id} type="button" onClick={() => toggleMulti("colors", c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    form.colors.includes(c.id)
                      ? "border-gray-900 bg-[#00694C] text-white"
                      : "border-slate-200 text-slate-600 hover:border-gray-400"
                  }`}>
                  {c.hex_code && <span className="w-3 h-3 rounded-full border border-slate-200" style={{ background: c.hex_code }} />}
                  {c.name}
                </button>
              ))}
              {colors.length === 0 && <span className="text-xs text-slate-400">No colors yet — add one above</span>}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Sizes</label>
              <button style={{cursor: 'pointer'}} type="button" onClick={() => setShowAddSize(v => !v)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> New Size
              </button>
            </div>
            {showAddSize && (
              <div className="flex items-center gap-2 mb-2 p-2 border border-dashed border-gray-300 rounded-md">
                <input type="text" value={newSizeName} onChange={e => setNewSizeName(e.target.value)}
                  placeholder="Size (e.g., XL, 42)" className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-slate-800 focus:outline-none" />
                <button style={{cursor: 'pointer'}} type="button" onClick={handleAddSize} disabled={addingSize || !newSizeName.trim()}
                  className="px-2 py-1 text-xs bg-[#00694C] text-white rounded disabled:opacity-50">
                  {addingSize ? "..." : "Add"}
                </button>
                <button style={{cursor: 'pointer'}} type="button" onClick={() => setShowAddSize(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {sizes.map(s => (
                <button style={{cursor: 'pointer'}} key={s.id} type="button" onClick={() => toggleMulti("sizes", s.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    form.sizes.includes(s.id)
                      ? "border-gray-900 bg-[#00694C] text-white"
                      : "border-slate-200 text-slate-600 hover:border-gray-400"
                  }`}>
                  {s.name}
                </button>
              ))}
              {sizes.length === 0 && <span className="text-xs text-slate-400">No sizes yet — add one above</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Specifications ── */}
      {activeTab === "specs" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Key-value pairs shown on product page (e.g., Storage → Cool & dry).
            </p>
            <button style={{cursor: 'pointer'}} type="button"
              onClick={() => setSpecs(prev => [...prev, { name: "", value: "" }])}
              className="text-xs border border-gray-300 rounded px-2 py-1 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={inputCls} placeholder="Name (e.g., Storage)" value={spec.name}
                  onChange={e => setSpecs(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))} />
                <input className={inputCls} placeholder="Value (e.g., Cool & dry)" value={spec.value}
                  onChange={e => setSpecs(prev => prev.map((s, j) => j === i ? { ...s, value: e.target.value } : s))} />
                <button style={{cursor: 'pointer'}} type="button"
                  onClick={() => setSpecs(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {specs.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No specifications yet. Click "+ Add Row" to start.</p>
            )}
          </div>
        </div>
      )}

      {/* Submit + tab dots */}
      <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
        <div className="flex gap-1.5">
          {TABS.map(t => (
            <button style={{cursor: 'pointer'}} key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: activeTab === t.id ? "#0f172a" : "#e2e8f0",
                transition: "background 0.15s",
                padding: 0,
              }}
            />
          ))}
        </div>
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="db-btn-primary" style={{ opacity: submitting ? 0.6 : 1 }}>
          {submitting && <Loader2 size={13} className="animate-spin" />}
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── Product View ───────────────────────────────────────────────
function ProductView({ item }) {
  if (!item) return null;
  
  const InfoBlock = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value ?? "—"}</span>
    </div>
  );

  const Section = ({ title, children, className="" }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${className}`}>
      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        {title}
      </h4>
      {children}
    </div>
  );

  const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
      active ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`}></span>
      {active ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="space-y-6 pb-2">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-48 shrink-0">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt={item.name} className="w-full aspect-square object-cover rounded-xl border border-slate-200 shadow-md" />
          ) : (
            <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge active={item.is_active} />
                {item.badge && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[11px] font-bold uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{item.name}</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">{item.category?.name || 'Uncategorized'}</span>
                {item.brand && <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">{item.brand?.name}</span>}
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm text-amber-600 font-semibold">
                  ★ {item.rating ? `${Number(item.rating).toFixed(1)} (${item.review_count})` : "New"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-600 tracking-tight">€{Number(item.price).toLocaleString()}</div>
              {item.discount_price && (
                <div className="text-sm font-bold text-slate-400 line-through mt-1">€{Number(item.discount_price).toLocaleString()}</div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100/80">
            <InfoBlock label="Stock" value={item.stock} />
            <InfoBlock label="Wholesale Price" value={item.wholesale_price ? `€${Number(item.wholesale_price).toLocaleString()}` : "—"} />
            <InfoBlock label="Min Purchase" value={item.minimum_purchase || "—"} />
            <InfoBlock label="Commission" value={item.affiliate_commission_rate ? `${item.affiliate_commission_rate}%` : "—"} />
          </div>
        </div>
      </div>

      {/* Two Column Layout for Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-6">
          <Section title="Product Details">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <InfoBlock label="Product Slug" value={item.slug} />
              <InfoBlock label="Origin Country" value={item.origin} />
              <InfoBlock label="Display Unit" value={item.unit} />
              <InfoBlock label="Wholesale Unit" value={item.wholesale_unit} />
              <InfoBlock label="Vendor / Shop" value={item.shop?.name} />
              <InfoBlock label="Sub-Category" value={item.sub_category?.name} />
            </div>
          </Section>

          {item.nutritional_info && (
            <Section title="Nutritional Information">
              <div className="bg-[#00694C] rounded-xl p-5 shadow-inner">
                <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                  {item.nutritional_info}
                </pre>
              </div>
            </Section>
          )}

          {item.specifications?.length > 0 && (
            <Section title="Specifications">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.specifications.map((s, i) => (
                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.name}</span>
                    <span className="text-sm text-slate-800 font-semibold mt-0.5">{s.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
          
          {item.additional_images?.length > 0 && (
            <Section title="Image Gallery">
              <div className="flex flex-wrap gap-4">
                {item.additional_images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={img.image} alt="" className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Side Info Column */}
        <div className="space-y-6">
          <Section title="Variants & Options">
            {(item.colors?.length > 0 || item.sizes?.length > 0) ? (
              <div className="space-y-5">
                {item.colors?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Colors</span>
                    <div className="flex flex-wrap gap-2">
                      {item.colors.map(c => (
                        <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                          {c.hex_code && <span className="w-3 h-3 rounded-full border border-slate-200 shadow-inner" style={{ background: c.hex_code }} />}
                          {c.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.sizes?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Sizes</span>
                    <div className="flex flex-wrap gap-2">
                      {item.sizes.map(s => (
                        <div key={s.id} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No variants available.</p>
            )}
          </Section>

          <Section title="Logistics">
            <div className="space-y-5">
              <InfoBlock label="Shipping Category" value={item.shipping_category?.name} />
              
              {(item.weight || item.length || item.width || item.height) ? (
                <>
                  <InfoBlock label="Weight" value={item.weight ? `${item.weight} kg` : "—"} />
                  <InfoBlock label="Dimensions (L×W×H)" value={[item.length, item.width, item.height].filter(Boolean).join(" × ") || "—"} />
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">No physical dimensions provided.</p>
              )}
            </div>
          </Section>

          <Section title="System Information">
             <div className="space-y-4">
                <InfoBlock label="Created On" value={item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : "—"} />
                <InfoBlock label="Last Updated" value={item.updated_at ? new Date(item.updated_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : "—"} />
             </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ProductsPage() {
  const toast = useToastContext();
  const { data, loading, totalCount, params, setSearch, setPage, create, update, remove } = useModel(productsService, {
    defaultParams: { page: 1, page_size: PAGE_SIZE },
    onSuccess: (msg) => toast.success(msg),
    onError:   (err) => toast.error(err?.message || "Operation failed"),
  });

  const { data: brandsRaw }      = useSWR("ref-brands",      () => brandsService.list({ page_size: 200 }),      { revalidateOnFocus: false });
  const { data: colorsRaw }      = useSWR("ref-colors",      () => colorsService.list({ page_size: 200 }),      { revalidateOnFocus: false });
  const { data: sizesRaw }       = useSWR("ref-sizes",       () => sizesService.list({ page_size: 200 }),       { revalidateOnFocus: false });
  const { data: categoriesRaw }  = useSWR("ref-categories",  () => categoriesService.list({ page_size: 200 }),  { revalidateOnFocus: false });
  const { data: subcatsRaw }     = useSWR("ref-subcats",     () => subcategoriesService.list({ page_size: 200 }), { revalidateOnFocus: false });
  const { data: shopsRaw }       = useSWR("ref-shops",       () => shopsService.list({ page_size: 200 }),       { revalidateOnFocus: false });

  const brands       = brandsRaw?.results      || (Array.isArray(brandsRaw)      ? brandsRaw      : []);
  const colors       = colorsRaw?.results      || (Array.isArray(colorsRaw)      ? colorsRaw      : []);
  const sizes        = sizesRaw?.results       || (Array.isArray(sizesRaw)       ? sizesRaw       : []);
  const categories   = categoriesRaw?.results  || (Array.isArray(categoriesRaw)  ? categoriesRaw  : []);
  const subcategories= subcatsRaw?.results     || (Array.isArray(subcatsRaw)     ? subcatsRaw     : []);
  const shops        = shopsRaw?.results       || (Array.isArray(shopsRaw)       ? shopsRaw       : []);

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [viewItem,   setViewItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const handleCreate = async (payload) => { await create(payload);                          setCreateOpen(false); };
  const handleEdit   = async (payload) => { await update(editItem.slug || editItem.id, payload); setEditItem(null);   };
  const handleDelete = async ()        => { await remove(deleteItem.slug || deleteItem.id);  setDeleteItem(null);  };

  const formProps = { categories, brands, colors, sizes, subcategories, shops };

  return (
    <Container
      title="Products"
      description="Manage your product catalog"
      actions={
        <button style={{cursor: 'pointer'}} onClick={() => setCreateOpen(true)} className="db-btn-primary">
          <Plus size={15} /> Add Product
        </button>
      }
    >
      <DataTable
        columns={columns} data={data} serverSide
        totalItems={totalCount} currentPage={params.page || 1} pageSize={PAGE_SIZE}
        onSearch={setSearch} onPageChange={p => setPage(p)}
        loading={loading} searchable
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button style={{cursor: 'pointer'}} onClick={() => setViewItem(row)}
              className="db-icon-btn">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button style={{cursor: 'pointer'}} onClick={() => setEditItem(row)}
              className="db-icon-btn">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button style={{cursor: 'pointer'}} onClick={() => setDeleteItem(row)}
              className="db-icon-btn danger">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Product" maxWidth="max-w-4xl">
        <ProductForm onSubmit={handleCreate} submitLabel="Create Product" {...formProps} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Product" maxWidth="max-w-4xl">
        {editItem && <ProductForm initialValues={editItem} onSubmit={handleEdit} submitLabel="Save Changes" {...formProps} />}
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Product Details" maxWidth="max-w-4xl">
        <ProductView item={viewItem} />
      </Modal>

      <ConfirmDialog
        open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This cannot be undone.`}
      />
    </Container>
  );
}
