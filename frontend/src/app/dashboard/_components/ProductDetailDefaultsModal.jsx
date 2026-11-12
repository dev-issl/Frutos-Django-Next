"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Plus, Upload, X } from "lucide-react";
import Modal from "@/app/dashboard/_components/Modal";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { productDetailSettingsService } from "@/app/dashboard/_lib/services";

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

const BADGE_ICON_OPTIONS = [
  { value: "leaf", label: "Leaf / Organic" },
  { value: "truck", label: "Truck / Delivery" },
  { value: "shield", label: "Shield / Secure" },
  { value: "sprout", label: "Sprout / Farm" },
  { value: "award", label: "Award / Quality" },
  { value: "recycle", label: "Recycle / Eco" },
  { value: "heart", label: "Heart / Care" },
  { value: "clock", label: "Clock / Fast" },
];

function DefaultsEditor({ initialData, onSave, onClose }) {
  const [form, setForm] = useState({
    promo_card_title: initialData?.promo_card_title || "",
    farm_story_eyebrow: initialData?.farm_story_eyebrow || "",
    farm_story_title: initialData?.farm_story_title || "",
    farm_story_description: initialData?.farm_story_description || "",
    farm_story_cta_text: initialData?.farm_story_cta_text || "",
    farm_story_cta_url: initialData?.farm_story_cta_url || "",
    shipping_info_title: initialData?.shipping_info_title || "",
    shipping_info: initialData?.shipping_info || "",
    return_policy_title: initialData?.return_policy_title || "",
    return_policy: initialData?.return_policy || "",
  });

  const [trustBadges, setTrustBadges] = useState(
    Array.isArray(initialData?.default_trust_badges) ? initialData.default_trust_badges : []
  );
  const [highlights, setHighlights] = useState(
    Array.isArray(initialData?.default_highlights) ? initialData.default_highlights : []
  );
  const [farmStats, setFarmStats] = useState(
    Array.isArray(initialData?.farm_story_stats) ? initialData.farm_story_stats : []
  );

  const [promoImageFile, setPromoImageFile] = useState(null);
  const [promoImagePreview, setPromoImagePreview] = useState(
    initialData?.promo_card_image_url || initialData?.promo_card_image || ""
  );
  const [promoImageRemoved, setPromoImageRemoved] = useState(false);

  const [storyImageFile, setStoryImageFile] = useState(null);
  const [storyImagePreview, setStoryImagePreview] = useState(
    initialData?.farm_story_image_url || initialData?.farm_story_image || ""
  );
  const [storyImageRemoved, setStoryImageRemoved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const cleanBadges = trustBadges
        .map(b => ({ icon: b?.icon || "leaf", text: String(b?.text || "").trim() }))
        .filter(b => b.text);
      const cleanHighlights = highlights.map(h => String(h || "").trim()).filter(Boolean);
      const cleanStats = farmStats
        .map(s => ({
          icon: s?.icon || "sprout",
          value: String(s?.value || "").trim(),
          label: String(s?.label || "").trim(),
        }))
        .filter(s => s.value || s.label);

      const needsFormData = Boolean(
        promoImageFile || promoImageRemoved || storyImageFile || storyImageRemoved
      );

      if (needsFormData) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
        fd.append("default_trust_badges", JSON.stringify(cleanBadges));
        fd.append("default_highlights", JSON.stringify(cleanHighlights));
        fd.append("farm_story_stats", JSON.stringify(cleanStats));
        if (promoImageFile) fd.append("promo_card_image", promoImageFile);
        else if (promoImageRemoved) fd.append("promo_card_image", "");
        if (storyImageFile) fd.append("farm_story_image", storyImageFile);
        else if (storyImageRemoved) fd.append("farm_story_image", "");
        await onSave(fd);
      } else {
        await onSave({
          ...form,
          default_trust_badges: cleanBadges,
          default_highlights: cleanHighlights,
          farm_story_stats: cleanStats,
        });
      }
    } catch (err) {
      setError(err?.data?.detail || err?.message || "Failed to save defaults");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900">
        These catalog-wide defaults apply to every Product Details page unless overridden individually inside a product&apos;s <span className="font-semibold">Details Page &amp; Story</span> tab.
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Default Trust Badges */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Default Hero Trust Badges</h4>
            <p className="text-xs text-slate-400">Up to 3 badges displayed below Add to Cart.</p>
          </div>
          <button
            type="button"
            disabled={trustBadges.length >= 3}
            onClick={() => setTrustBadges(prev => [...prev, { icon: "leaf", text: "" }])}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Badge
          </button>
        </div>
        <div className="space-y-2">
          {trustBadges.map((b, idx) => (
            <div key={idx} className="grid grid-cols-[155px_1fr_auto] gap-2 items-center">
              <select
                value={b.icon || "leaf"}
                onChange={e => setTrustBadges(prev => prev.map((row, i) => (i === idx ? { ...row, icon: e.target.value } : row)))}
                className={`${inputCls} text-xs`}
              >
                {BADGE_ICON_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                value={b.text || ""}
                onChange={e => setTrustBadges(prev => prev.map((row, i) => (i === idx ? { ...row, text: e.target.value } : row)))}
                placeholder="e.g., 100% Organic & Fresh"
                className={`${inputCls} text-xs`}
              />
              <button
                type="button"
                onClick={() => setTrustBadges(prev => prev.filter((_, i) => i !== idx))}
                className="text-red-400 hover:text-red-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Default About Highlights */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Default Product Highlights</h4>
            <p className="text-xs text-slate-400">Bullet points under About This Product when product highlights are empty.</p>
          </div>
          <button
            type="button"
            onClick={() => setHighlights(prev => [...prev, ""])}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Bullet
          </button>
        </div>
        <div className="space-y-2">
          {highlights.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={item}
                onChange={e => setHighlights(prev => prev.map((v, i) => (i === idx ? e.target.value : v)))}
                placeholder="e.g., Harvested at peak freshness"
                className={`${inputCls} text-xs`}
              />
              <button
                type="button"
                onClick={() => setHighlights(prev => prev.filter((_, i) => i !== idx))}
                className="text-red-400 hover:text-red-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Default Feature Photo Card */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
        <h4 className="text-sm font-semibold text-slate-800">Feature Photo Card (&quot;From Our Farms to Your Table&quot;)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label className={labelCls}>Card Title</label>
            <input
              value={form.promo_card_title}
              onChange={e => updateField("promo_card_title", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Custom Photo (optional override)</label>
            <div className="flex items-center gap-3">
              {promoImagePreview && (
                <div className="relative">
                  <img src={promoImagePreview} alt="Default promo"
                    className="w-20 h-14 rounded-lg object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => { setPromoImageFile(null); setPromoImagePreview(""); setPromoImageRemoved(true); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 text-xs text-slate-500">
                <Upload className="w-4 h-4" /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setPromoImageFile(f);
                      setPromoImagePreview(URL.createObjectURL(f));
                      setPromoImageRemoved(false);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Default Shipping & Return Policy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">Default Shipping Info</h4>
          <div>
            <label className={labelCls}>Heading</label>
            <input
              value={form.shipping_info_title}
              onChange={e => updateField("shipping_info_title", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Details</label>
            <textarea
              rows={4}
              value={form.shipping_info}
              onChange={e => updateField("shipping_info", e.target.value)}
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">Default Return Policy</h4>
          <div>
            <label className={labelCls}>Heading</label>
            <input
              value={form.return_policy_title}
              onChange={e => updateField("return_policy_title", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Details</label>
            <textarea
              rows={4}
              value={form.return_policy}
              onChange={e => updateField("return_policy", e.target.value)}
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>
      </div>

      {/* Default Our Farm Story Banner */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
        <h4 className="text-sm font-semibold text-slate-800">Our Farm Story Section</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Eyebrow</label>
            <input value={form.farm_story_eyebrow} onChange={e => updateField("farm_story_eyebrow", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input value={form.farm_story_title} onChange={e => updateField("farm_story_title", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Button Text</label>
            <input value={form.farm_story_cta_text} onChange={e => updateField("farm_story_cta_text", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Button URL</label>
            <input value={form.farm_story_cta_url} onChange={e => updateField("farm_story_cta_url", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
          <div>
            <label className={labelCls}>Story Description</label>
            <textarea
              rows={3}
              value={form.farm_story_description}
              onChange={e => updateField("farm_story_description", e.target.value)}
              className={`${inputCls} resize-y`}
            />
          </div>
          <div>
            <label className={labelCls}>Custom Photo</label>
            <div className="flex items-center gap-3">
              {storyImagePreview && (
                <div className="relative">
                  <img src={storyImagePreview} alt="Default story"
                    className="w-20 h-14 rounded-lg object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => { setStoryImageFile(null); setStoryImagePreview(""); setStoryImageRemoved(true); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 text-xs text-slate-500">
                <Upload className="w-4 h-4" /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setStoryImageFile(f);
                      setStoryImagePreview(URL.createObjectURL(f));
                      setStoryImageRemoved(false);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200/70">
          <div className="flex items-center justify-between">
            <label className={`${labelCls} mb-0`}>Story Stats (up to 3)</label>
            <button
              type="button"
              disabled={farmStats.length >= 3}
              onClick={() => setFarmStats(prev => [...prev, { icon: "sprout", value: "", label: "" }])}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Stat
            </button>
          </div>
          <div className="space-y-2">
            {farmStats.map((st, idx) => (
              <div key={idx} className="grid grid-cols-[150px_110px_1fr_auto] gap-2 items-center">
                <select
                  value={st.icon || "sprout"}
                  onChange={e => setFarmStats(prev => prev.map((s, i) => (i === idx ? { ...s, icon: e.target.value } : s)))}
                  className={`${inputCls} text-xs`}
                >
                  {BADGE_ICON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  value={st.value || ""}
                  onChange={e => setFarmStats(prev => prev.map((s, i) => (i === idx ? { ...s, value: e.target.value } : s)))}
                  placeholder="120+"
                  className={`${inputCls} text-xs`}
                />
                <input
                  value={st.label || ""}
                  onChange={e => setFarmStats(prev => prev.map((s, i) => (i === idx ? { ...s, label: e.target.value } : s)))}
                  placeholder="Local Farmers"
                  className={`${inputCls} text-xs`}
                />
                <button
                  type="button"
                  onClick={() => setFarmStats(prev => prev.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#00694C] hover:bg-[#004A3A] disabled:bg-slate-400 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-md cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Global Defaults"}
        </button>
      </div>
    </form>
  );
}

function ProductDetailDefaultsBody({ onClose }) {
  const toast = useToastContext();
  const { data, isLoading, mutate } = useSWR(
    "/api/products/detail-settings/",
    () => productDetailSettingsService.get(),
    { revalidateOnFocus: false }
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#00694C]" />
        Loading global product details defaults...
      </div>
    );
  }

  return (
    <DefaultsEditor
      key={data.updated_at || String(data.id || "1")}
      initialData={data}
      onClose={onClose}
      onSave={async (payload) => {
        const updated = await productDetailSettingsService.update(payload);
        await mutate(updated, false);
        toast.success("Product details defaults saved");
        onClose();
      }}
    />
  );
}

export default function ProductDetailDefaultsModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Product Details Page — Global Defaults"
      maxWidth="max-w-4xl"
    >
      {open && <ProductDetailDefaultsBody onClose={onClose} />}
    </Modal>
  );
}

