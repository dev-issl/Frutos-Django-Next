"use client";

import { useState } from "react";
import { Plus, X, Upload, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { colorsService, sizesService } from "@/app/dashboard/_lib/services";

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

export default function ProductForm({
  initialValues, onSubmit, submitLabel = "Save",
  categories, brands, colors: propColors, sizes: propSizes, subcategories, stores, productClasses,
}) {
  const [form, setForm] = useState({
    name: "", slug: "", description: "", nutritional_info: "",
    origin: "", unit: "", wholesale_unit: "", badge: "", badge_color: "", variant: "",
    price: "", discount_price: "", wholesale_price: "",
    minimum_purchase: "", tax_rate: "",
    stock: "", is_active: "true",
    weight: "", length: "", width: "", height: "",
    shop: "", stores: [], brand: "", category: "", sub_category: "", shipping_category: "",
    colors: [], sizes: [],
    ...initialValues,
    shop:              initialValues?.shop?.id               || initialValues?.shop               || "",
    stores:            initialValues?.stores?.map(s => s.id || s) || [],
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
        variant:                  form.variant || "",
        price:                    form.price,
        discount_price:           form.discount_price  || null,
        wholesale_price:          form.wholesale_price || null,
        minimum_purchase:         form.minimum_purchase || null,
        tax_rate:                 form.tax_rate || "5.00",
        stock:                    form.stock || 0,
        is_active:                form.is_active === "true",
        weight:                   form.weight || null,
        length:                   form.length || null,
        width:                    form.width  || null,
        height:                   form.height || null,
        shop:                     form.shop              || null,
        stores:                   form.stores            || [],
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4 pb-2">

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
              <label className={labelCls}>Variant / Quality</label>
              <SearchableSelect
                value={form.variant || ""}
                onChange={v => handleChange("variant", v)}
                options={productClasses?.map(c => ({ label: c, value: c })) || []}
                placeholder="Select class..."
                className={inputCls}
              />
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
              <label className={labelCls}>Store <span className="text-red-500">*</span></label>
              <SearchableSelect isMulti={true} required value={form.stores} onChange={v => handleChange("stores", v)}
                placeholder="Select store(s)..." options={stores.map(s => ({ value: s.id, label: s.name }))} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <SearchableSelect value={form.category} onChange={v => handleChange("category", v)}
                placeholder="Select category..." options={categories.map(c => ({ value: c.id, label: c.name }))} />
            </div>
            <div>
              <label className={labelCls}>Sub Category</label>
              <SearchableSelect value={form.sub_category} onChange={v => handleChange("sub_category", v)}
                placeholder="Select sub category..." options={subcategories.filter(sc => !form.category || sc.category === form.category).map(sc => ({ value: sc.id, label: sc.name }))} />
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
              <label className={labelCls}>Tax Rate (%)</label>
              <input type="number" step="0.01" min="0" max="100" className={inputCls}
                value={form.tax_rate || ""} onChange={e => handleChange("tax_rate", e.target.value)} placeholder="5.00" />
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
        <button 
          style={{cursor: submitting ? 'not-allowed' : 'pointer'}} 
          type="submit" 
          disabled={submitting} 
          className="flex items-center gap-2 bg-[#00694C] hover:bg-[#004A3A] disabled:bg-slate-400 text-white px-6 py-2.5 rounded-xl font-medium shadow-md transition-colors"
        >
          <div className="flex items-center gap-2">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Saving..." : submitLabel}
          </div>
        </button>
      </div>
    </form>
  );
}
