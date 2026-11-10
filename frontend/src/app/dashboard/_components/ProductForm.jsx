"use client";

import { useState } from "react";
import { Plus, X, Upload, Loader2, ChevronDown, ChevronUp, Layers, Trash2 } from "lucide-react";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { colorsService, sizesService } from "@/app/dashboard/_lib/services";

const TABS = [
  { id: "basic",       label: "Basic Info" },
  { id: "description", label: "Description & Nutrition" },
  { id: "pricing",     label: "Pricing & Stock" },
  { id: "variants",    label: "Variants" },
  { id: "media",       label: "Media" },
  { id: "specs",       label: "Specifications" },
];



// ── Shared styles ──────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

export default function ProductForm({
  initialValues, onSubmit, submitLabel = "Save",
  categories, brands, colors: propColors, sizes: propSizes, subcategories, stores, productClasses, displayUnits = [],
}) {
  const [form, setForm] = useState({
    name: "", slug: "", description: "", nutritional_info: "",
    origin: "", unit: "", wholesale_unit: "", badge: "", badge_color: "", variant: "",
    price: "", discount_price: "", wholesale_price: "", wholesale_discount_price: "",
    restaurant_price: "", restaurant_discount_price: "", restaurant_unit: "", restaurant_minimum_purchase: "",
    minimum_purchase: "", tax_rate: "",
    stock: "", wholesale_stock: "", restaurant_stock: "", is_active: "true",
    is_unlimited_stock: Boolean(initialValues?.is_unlimited_stock),
    is_unlimited_wholesale_stock: Boolean(initialValues?.is_unlimited_wholesale_stock),
    is_unlimited_restaurant_stock: Boolean(initialValues?.is_unlimited_restaurant_stock),
    weight: "", length: "", width: "", height: "",
    shop: "", stores: [], brand: "", category: "", sub_category: "", shipping_category: "",
    colors: [], sizes: [],
    ...initialValues,
    shop:              initialValues?.shop?.id               || initialValues?.shop               || "",
    stores:            initialValues?.stores?.map(s => s.id || s) || stores?.map(s => s.id)       || [],
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

  // Variants state & handlers
  const [variants, setVariants] = useState(() => {
    if (initialValues?.variants && Array.isArray(initialValues.variants) && initialValues.variants.length > 0) {
      return initialValues.variants.map(v => ({
        variant: v.variant || "",
        price: v.price !== null && v.price !== undefined ? String(v.price) : "",
        discount_price: v.discount_price !== null && v.discount_price !== undefined ? String(v.discount_price) : "",
        unit: v.unit || "",
        stock: v.is_unlimited_stock ? "" : (v.stock !== null && v.stock !== undefined ? String(v.stock) : ""),
        is_unlimited_stock: Boolean(v.is_unlimited_stock),
        wholesale_price: v.wholesale_price !== null && v.wholesale_price !== undefined ? String(v.wholesale_price) : "",
        wholesale_discount_price: v.wholesale_discount_price !== null && v.wholesale_discount_price !== undefined ? String(v.wholesale_discount_price) : "",
        wholesale_unit: v.wholesale_unit || "",
        minimum_purchase: v.minimum_purchase || "",
        wholesale_stock: v.is_unlimited_wholesale_stock ? "" : (v.wholesale_stock !== null && v.wholesale_stock !== undefined ? String(v.wholesale_stock) : ""),
        is_unlimited_wholesale_stock: Boolean(v.is_unlimited_wholesale_stock),
        restaurant_price: v.restaurant_price !== null && v.restaurant_price !== undefined ? String(v.restaurant_price) : "",
        restaurant_discount_price: v.restaurant_discount_price !== null && v.restaurant_discount_price !== undefined ? String(v.restaurant_discount_price) : "",
        restaurant_unit: v.restaurant_unit || "",
        restaurant_minimum_purchase: v.restaurant_minimum_purchase || "",
        restaurant_stock: v.is_unlimited_restaurant_stock ? "" : (v.restaurant_stock !== null && v.restaurant_stock !== undefined ? String(v.restaurant_stock) : ""),
        is_unlimited_restaurant_stock: Boolean(v.is_unlimited_restaurant_stock),
      }));
    }
    return [];
  });

  const handleAddVariant = () => {
    const existingClasses = variants.map(v => (v.variant || "").trim().toLowerCase());
    let nextClass = "";
    if (productClasses && productClasses.length > 0) {
      const available = productClasses.find(c => !existingClasses.includes(c.toLowerCase()));
      nextClass = available || "";
    }
    setVariants(prev => [
      ...prev,
      {
        variant: nextClass,
        price: form.price || "",
        discount_price: form.discount_price || "",
        unit: form.unit || "",
        stock: form.is_unlimited_stock ? "" : (form.stock || ""),
        is_unlimited_stock: Boolean(form.is_unlimited_stock),

        wholesale_price: form.wholesale_price || "",
        wholesale_discount_price: form.wholesale_discount_price || "",
        wholesale_unit: form.wholesale_unit || form.unit || "",
        minimum_purchase: form.minimum_purchase || "",
        wholesale_stock: form.is_unlimited_wholesale_stock ? "" : (form.wholesale_stock || ""),
        is_unlimited_wholesale_stock: Boolean(form.is_unlimited_wholesale_stock),

        restaurant_price: form.restaurant_price || "",
        restaurant_discount_price: form.restaurant_discount_price || "",
        restaurant_unit: form.restaurant_unit || form.unit || "",
        restaurant_minimum_purchase: form.restaurant_minimum_purchase || "",
        restaurant_stock: form.is_unlimited_restaurant_stock ? "" : (form.restaurant_stock || ""),
        is_unlimited_restaurant_stock: Boolean(form.is_unlimited_restaurant_stock),
      }
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

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
    setError("");

    if (variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.variant?.trim()) {
          setError(`Variant #${i + 1} is missing a Quality / Variant name (e.g., Class A, Class B).`);
          setActiveTab("variants");
          return;
        }
        if (v.price === "" || v.price === null || v.price === undefined) {
          setError(`Variant "${v.variant}" is missing a Customer Price.`);
          setActiveTab("variants");
          return;
        }
      }
    } else if (!form.price && form.price !== 0) {
      setError("Customer Price is required.");
      setActiveTab("pricing");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name:                     form.name,
        slug:                     form.slug || undefined,
        description:              form.description || "",
        nutritional_info:         form.nutritional_info || "",
        origin:                   form.origin || "",
        unit:                     (variants.length > 0 && variants[0].unit) ? variants[0].unit : (form.unit || ""),
        wholesale_unit:           (variants.length > 0 && variants[0].wholesale_unit) ? variants[0].wholesale_unit : (form.wholesale_unit || ""),
        badge:                    form.badge || "",
        badge_color:              form.badge_color || "",
        variant:                  (variants.length > 0 && variants[0].variant) ? variants[0].variant : (form.variant || ""),
        price:                    (variants.length > 0 && variants[0].price !== "") ? variants[0].price : form.price,
        discount_price:           (variants.length > 0 && variants[0].discount_price !== undefined) ? (variants[0].discount_price || null) : (form.discount_price || null),
        wholesale_price:          (variants.length > 0 && variants[0].wholesale_price !== undefined) ? (variants[0].wholesale_price || null) : (form.wholesale_price || null),
        wholesale_discount_price: (variants.length > 0 && variants[0].wholesale_discount_price !== undefined) ? (variants[0].wholesale_discount_price || null) : (form.wholesale_discount_price || null),
        restaurant_price:         (variants.length > 0 && variants[0].restaurant_price !== undefined) ? (variants[0].restaurant_price || null) : (form.restaurant_price || null),
        restaurant_discount_price:(variants.length > 0 && variants[0].restaurant_discount_price !== undefined) ? (variants[0].restaurant_discount_price || null) : (form.restaurant_discount_price || null),
        restaurant_unit:          (variants.length > 0 && variants[0].restaurant_unit) ? variants[0].restaurant_unit : (form.restaurant_unit || ""),
        restaurant_minimum_purchase: (variants.length > 0 && variants[0].restaurant_minimum_purchase) ? variants[0].restaurant_minimum_purchase : (form.restaurant_minimum_purchase || null),
        minimum_purchase:         (variants.length > 0 && variants[0].minimum_purchase) ? variants[0].minimum_purchase : (form.minimum_purchase || null),
        tax_rate:                 form.tax_rate || "5.00",
        stock:                    variants.length > 0 ? (variants[0].is_unlimited_stock ? 0 : (variants[0].stock || 0)) : (form.is_unlimited_stock ? 0 : (form.stock || 0)),
        wholesale_stock:          variants.length > 0 ? (variants[0].is_unlimited_wholesale_stock ? 0 : (variants[0].wholesale_stock || 0)) : (form.is_unlimited_wholesale_stock ? 0 : (form.wholesale_stock || 0)),
        restaurant_stock:         variants.length > 0 ? (variants[0].is_unlimited_restaurant_stock ? 0 : (variants[0].restaurant_stock || 0)) : (form.is_unlimited_restaurant_stock ? 0 : (form.restaurant_stock || 0)),
        is_unlimited_stock:       variants.length > 0 ? Boolean(variants[0].is_unlimited_stock) : Boolean(form.is_unlimited_stock),
        is_unlimited_wholesale_stock: variants.length > 0 ? Boolean(variants[0].is_unlimited_wholesale_stock) : Boolean(form.is_unlimited_wholesale_stock),
        is_unlimited_restaurant_stock: variants.length > 0 ? Boolean(variants[0].is_unlimited_restaurant_stock) : Boolean(form.is_unlimited_restaurant_stock),
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

      if (variants.length > 0) {
        payload.variants_json = JSON.stringify(variants);
      }

      const needsFormData = thumbnail || additionalImages.length > 0 || removeImageIds.length > 0 || thumbnailRemoved;
      if (needsFormData) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          if (Array.isArray(v)) { v.forEach(item => fd.append(k, item)); }
          else { fd.append(k, v); }
        });
        if (variants.length > 0) {
          fd.append("variants_json", JSON.stringify(variants));
        }
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
        if (variants.length > 0) {
          clean.variants_json = JSON.stringify(variants);
        }
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
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "700",
              borderRadius: "8px 8px 0 0",
              border: "none",
              cursor: "pointer",
              marginBottom: "-2px",
              borderBottom: activeTab === t.id ? "2px solid #00694C" : "2px solid transparent",
              background: activeTab === t.id ? "#f8fafc" : "transparent",
              color: activeTab === t.id ? "#00694C" : "#94a3b8",
              transition: "all 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{t.label}</span>
            {t.id === "variants" && variants.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {variants.length}
              </span>
            )}
          </button>
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

      {/* ── Tab: Description & Nutrition ── */}
      {activeTab === "description" && (
        <div className="space-y-6">
          <div>
            <label className={labelCls}>Product Description</label>
            <textarea value={form.description} onChange={e => handleChange("description", e.target.value)}
              rows={12} className={`${inputCls} resize-y`} placeholder="Full product description... HTML supported." />
            <p className="text-xs text-slate-400 mt-1">Basic HTML tags are supported (bold, italic, lists etc.).</p>
          </div>
          <div className="pt-4 border-t border-slate-100">
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
        <div className="space-y-6">
          {variants.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-amber-600 text-base">ℹ️</span>
              <div className="text-xs text-amber-800">
                <p className="font-bold mb-0.5">Variants configured ({variants.length})</p>
                <p>
                  You have configured variants under the <strong>Variants</strong> tab. Each variant has its own custom pricing, units, and stock levels. The values below serve as base defaults.
                </p>
              </div>
            </div>
          )}
          {/* Retail Configuration */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Customer
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <label className={labelCls}>Display Unit</label>
                <SearchableSelect
                  value={form.unit || ""}
                  onChange={v => handleChange("unit", v)}
                  options={displayUnits.map(u => ({ value: u.abbreviation || u.name, label: u.name }))}
                  placeholder="Select or type..."
                  allowCustom={true}
                />
              </div>
              <div>
                <label className={labelCls}>Stock {!form.is_unlimited_stock && <span className="text-red-500">*</span>}</label>
                <input
                  required={!form.is_unlimited_stock}
                  disabled={form.is_unlimited_stock}
                  type="number"
                  min="0"
                  className={`${inputCls} ${form.is_unlimited_stock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                  value={form.is_unlimited_stock ? "" : form.stock}
                  onChange={e => handleChange("stock", e.target.value)}
                  placeholder={form.is_unlimited_stock ? "∞ Unlimited" : "0"}
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!form.is_unlimited_stock}
                    onChange={e => handleChange("is_unlimited_stock", e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Unlimited Stock <span className="text-emerald-600 font-bold">(∞)</span>
                  </span>
                </label>
              </div>
              <div>
                <label className={labelCls}>Tax Rate (%)</label>
                <input type="number" step="0.01" min="0" max="100" className={inputCls}
                  value={form.tax_rate || ""} onChange={e => handleChange("tax_rate", e.target.value)} placeholder="5.00" />
              </div>
            </div>
          </div>

          {/* Internal Wholesale Configuration */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-5">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Internal Wholesale
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Internal Wholesale Price (€)</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={form.wholesale_price || ""} onChange={e => handleChange("wholesale_price", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Internal Wholesale Sale Price (€)</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={form.wholesale_discount_price || ""} onChange={e => handleChange("wholesale_discount_price", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Internal Wholesale Unit</label>
                <SearchableSelect
                  value={form.wholesale_unit || ""}
                  onChange={v => handleChange("wholesale_unit", v)}
                  options={displayUnits.map(u => ({ value: u.abbreviation || u.name, label: u.name }))}
                  placeholder="Select or type..."
                  allowCustom={true}
                />
              </div>
              <div>
                <label className={labelCls}>Min Purchase Qty</label>
                <input type="number" min="1" className={inputCls} value={form.minimum_purchase || ""}
                  onChange={e => handleChange("minimum_purchase", e.target.value)} placeholder="e.g., 5" />
              </div>
              <div>
                <label className={labelCls}>Stock</label>
                <input
                  disabled={form.is_unlimited_wholesale_stock}
                  type="number"
                  min="0"
                  className={`${inputCls} ${form.is_unlimited_wholesale_stock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                  value={form.is_unlimited_wholesale_stock ? "" : (form.wholesale_stock || "")}
                  onChange={e => handleChange("wholesale_stock", e.target.value)}
                  placeholder={form.is_unlimited_wholesale_stock ? "∞ Unlimited" : "0"}
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!form.is_unlimited_wholesale_stock}
                    onChange={e => handleChange("is_unlimited_wholesale_stock", e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Unlimited Stock <span className="text-amber-600 font-bold">(∞)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* External Wholesale Configuration */}
          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-5 mt-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> External Wholesale
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>External Wholesale Price (€)</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={form.restaurant_price || ""} onChange={e => handleChange("restaurant_price", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>External Wholesale Sale Price (€)</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={form.restaurant_discount_price || ""} onChange={e => handleChange("restaurant_discount_price", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>External Wholesale Unit</label>
                <SearchableSelect
                  value={form.restaurant_unit || ""}
                  onChange={v => handleChange("restaurant_unit", v)}
                  options={displayUnits.map(u => ({ value: u.abbreviation || u.name, label: u.name }))}
                  placeholder="Select or type..."
                  allowCustom={true}
                />
              </div>
              <div>
                <label className={labelCls}>Min Purchase Qty</label>
                <input type="number" min="1" className={inputCls} value={form.restaurant_minimum_purchase || ""}
                  onChange={e => handleChange("restaurant_minimum_purchase", e.target.value)} placeholder="e.g., 5" />
              </div>
              <div>
                <label className={labelCls}>Stock</label>
                <input
                  disabled={form.is_unlimited_restaurant_stock}
                  type="number"
                  min="0"
                  className={`${inputCls} ${form.is_unlimited_restaurant_stock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                  value={form.is_unlimited_restaurant_stock ? "" : (form.restaurant_stock || "")}
                  onChange={e => handleChange("restaurant_stock", e.target.value)}
                  placeholder={form.is_unlimited_restaurant_stock ? "∞ Unlimited" : "0"}
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!form.is_unlimited_restaurant_stock}
                    onChange={e => handleChange("is_unlimited_restaurant_stock", e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Unlimited Stock <span className="text-emerald-600 font-bold">(∞)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Physical dimensions */}
          <div className="pt-4 border-t border-slate-100">
            <button style={{cursor: 'pointer'}} type="button" onClick={() => setShowPhysical(p => !p)}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-2">
              {showPhysical ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
              Physical dimensions (for shipping calculation)
            </button>
            {showPhysical && (
              <div className="grid grid-cols-4 gap-3 mt-3">
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

      {/* ── Tab: Variants ── */}
      {activeTab === "variants" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
            <div>
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Product Variants & Quality Levels</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {variants.length} configured
                </span>
              </h4>
              <p className="text-xs text-emerald-800 mt-1">
                Add multiple variants (e.g. Class A, Class B, Class C) with their own pricing, display units, and stock.
                They will share all images, category, description, and specifications automatically without having to re-upload them.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00694C] hover:bg-[#004A3A] text-white text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No variants added yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                If this product has multiple qualities (like Class A, Class B, Class C) or different packages, click below to add them without needing to upload photos or descriptions multiple times.
              </p>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00694C] hover:bg-[#004A3A] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add First Variant
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {variants.map((v, idx) => (
                <div key={idx} className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-all">
                  {/* Variant Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#00694C] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {v.variant ? `Variant: ${v.variant}` : `Variant #${idx + 1}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Variant Name / Quality */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                      <div>
                        <label className={labelCls}>
                          Variant / Quality Name <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                          value={v.variant || ""}
                          onChange={val => handleVariantChange(idx, "variant", val)}
                          options={productClasses?.map(c => ({ label: c, value: c })) || []}
                          placeholder="e.g. Class A, Class B, Class C..."
                          allowCustom={true}
                        />
                      </div>
                    </div>

                    {/* Section 1: Customer Pricing & Stock */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5">
                      <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Customer (Retail)
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className={labelCls}>Price (€) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={inputCls}
                            value={v.price}
                            onChange={e => handleVariantChange(idx, "price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Sale Price (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={inputCls}
                            value={v.discount_price || ""}
                            onChange={e => handleVariantChange(idx, "discount_price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Display Unit</label>
                          <SearchableSelect
                            value={v.unit || ""}
                            onChange={val => handleVariantChange(idx, "unit", val)}
                            options={displayUnits.map(u => ({ value: u.abbreviation || u.name, label: u.name }))}
                            placeholder="Select unit..."
                            allowCustom={true}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>
                            Stock {!v.is_unlimited_stock && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            disabled={v.is_unlimited_stock}
                            type="number"
                            min="0"
                            className={`${inputCls} ${v.is_unlimited_stock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            value={v.is_unlimited_stock ? "" : (v.stock ?? "")}
                            onChange={e => handleVariantChange(idx, "stock", e.target.value)}
                            placeholder={v.is_unlimited_stock ? "∞ Unlimited" : "0"}
                          />
                          <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!v.is_unlimited_stock}
                              onChange={e => handleVariantChange(idx, "is_unlimited_stock", e.target.checked)}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-slate-700">
                              Unlimited (∞)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Internal Wholesale Pricing & Stock */}
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-3.5">
                      <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Internal Wholesale
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className={labelCls}>Price (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={inputCls}
                            value={v.wholesale_price || ""}
                            onChange={e => handleVariantChange(idx, "wholesale_price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Sale Price (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={inputCls}
                            value={v.wholesale_discount_price || ""}
                            onChange={e => handleVariantChange(idx, "wholesale_discount_price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Unit</label>
                          <SearchableSelect
                            value={v.wholesale_unit || ""}
                            onChange={val => handleVariantChange(idx, "wholesale_unit", val)}
                            options={displayUnits.map(u => ({ value: u.abbreviation || u.name, label: u.name }))}
                            placeholder="Select unit..."
                            allowCustom={true}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Min Qty</label>
                          <input
                            type="number"
                            min="1"
                            className={inputCls}
                            value={v.minimum_purchase || ""}
                            onChange={e => handleVariantChange(idx, "minimum_purchase", e.target.value)}
                            placeholder="e.g., 5"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Stock</label>
                          <input
                            disabled={v.is_unlimited_wholesale_stock}
                            type="number"
                            min="0"
                            className={`${inputCls} ${v.is_unlimited_wholesale_stock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            value={v.is_unlimited_wholesale_stock ? "" : (v.wholesale_stock ?? "")}
                            onChange={e => handleVariantChange(idx, "wholesale_stock", e.target.value)}
                            placeholder={v.is_unlimited_wholesale_stock ? "∞ Unlimited" : "0"}
                          />
                          <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!v.is_unlimited_wholesale_stock}
                              onChange={e => handleVariantChange(idx, "is_unlimited_wholesale_stock", e.target.checked)}
                              className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-slate-700">
                              Unlimited (∞)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: External Wholesale Pricing & Stock */}
                    <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-lg p-3.5">
                      <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> External Wholesale
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className={labelCls}>Price (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={inputCls}
                            value={v.restaurant_price || ""}
                            onChange={e => handleVariantChange(idx, "restaurant_price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Sale Price (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={inputCls}
                            value={v.restaurant_discount_price || ""}
                            onChange={e => handleVariantChange(idx, "restaurant_discount_price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Unit</label>
                          <SearchableSelect
                            value={v.restaurant_unit || ""}
                            onChange={val => handleVariantChange(idx, "restaurant_unit", val)}
                            options={displayUnits.map(u => ({ value: u.abbreviation || u.name, label: u.name }))}
                            placeholder="Select unit..."
                            allowCustom={true}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Min Qty</label>
                          <input
                            type="number"
                            min="1"
                            className={inputCls}
                            value={v.restaurant_minimum_purchase || ""}
                            onChange={e => handleVariantChange(idx, "restaurant_minimum_purchase", e.target.value)}
                            placeholder="e.g., 5"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Stock</label>
                          <input
                            disabled={v.is_unlimited_restaurant_stock}
                            type="number"
                            min="0"
                            className={`${inputCls} ${v.is_unlimited_restaurant_stock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            value={v.is_unlimited_restaurant_stock ? "" : (v.restaurant_stock ?? "")}
                            onChange={e => handleVariantChange(idx, "restaurant_stock", e.target.value)}
                            placeholder={v.is_unlimited_restaurant_stock ? "∞ Unlimited" : "0"}
                          />
                          <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!v.is_unlimited_restaurant_stock}
                              onChange={e => handleVariantChange(idx, "is_unlimited_restaurant_stock", e.target.checked)}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-slate-700">
                              Unlimited (∞)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddVariant}
                className="w-full py-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-[#00694C] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Another Variant
              </button>
            </div>
          )}
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
              <p className="text-xs text-slate-400 py-6 text-center">No specifications yet. Click &quot;+ Add Row&quot; to start.</p>
            )}
          </div>
        </div>
      )}

      {/* Submit + tab dots */}
      <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
        <div className="flex gap-1.5">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
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
