"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Edit2, Loader2, Image as ImageIcon } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import Modal from "@/app/dashboard/_components/Modal";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { homePageService } from "@/app/dashboard/_lib/services";
import { revalidateHomePage } from "./actions";

const TABS = [
  { id: "hero", label: "Hero Section" },
  { id: "featured_collections", label: "Featured Collections" },
  { id: "how_it_works", label: "How It Works Config" },
  { id: "steps", label: "Steps Items" },
  { id: "testimonials", label: "Customer Reviews" },
  { id: "faqs", label: "FAQs" },
  { id: "leftover", label: "Leftover Banner" },
];

const LIST_TAB_LABELS = {
  steps: "Step",
  testimonials: "Customer Review",
  faqs: "FAQ",
};

export default function HomeDashboardPage() {
  const toast = useToastContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  
  // Modal state for Steps Items
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null means adding new
  const [formData, setFormData] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // File upload state for instant preview
  const [previewImages, setPreviewImages] = useState({
      hero_image_desktop: null,
      hero_image_mobile: null,
      leftover_banner_image: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await homePageService.list();
      // list returns a single object directly for our singleton endpoint
      if (res && !Array.isArray(res)) {
         setData(res);
      } else if (Array.isArray(res) && res.length > 0) {
         setData(res[0]);
      } else {
         setData({
             hero_section: {}, how_it_works: {}, steps: [], leftover_banner: {}, featured_collections: {}, testimonials: [], faqs: []
         });
      }
    } catch (e) {
      toast.error("Failed to load home page data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e, fieldKey) => {
      const file = e.target.files[0];
      if (file) {
          setData(prev => ({ ...prev, [fieldKey]: file }));
          setPreviewImages(prev => ({
              ...prev,
              [fieldKey]: URL.createObjectURL(file)
          }));
      }
  };

  const saveToServer = async (newData) => {
    if (!newData?.id) return;
    setSaving(true);
    try {
      const fd = new FormData();
      
      // Append files if they exist and are actual Files
      if (newData.hero_image_desktop instanceof File) {
        fd.append('hero_image_desktop', newData.hero_image_desktop);
      }
      if (newData.hero_image_mobile instanceof File) {
        fd.append('hero_image_mobile', newData.hero_image_mobile);
      }
      if (newData.leftover_banner_image instanceof File) {
        fd.append('leftover_banner_image', newData.leftover_banner_image);
      }

      for (let i = 0; i < 4; i++) {
        if (newData[`collection_image_${i}`] instanceof File) {
          fd.append(`collection_image_${i}`, newData[`collection_image_${i}`]);
        }
        if (newData[`promo_image_${i}`] instanceof File) {
          fd.append(`promo_image_${i}`, newData[`promo_image_${i}`]);
        }
      }
      
      fd.append('hero_section', JSON.stringify(newData.hero_section || {}));
      fd.append('how_it_works', JSON.stringify(newData.how_it_works || {}));
      fd.append('steps', JSON.stringify(newData.steps || []));
      fd.append('leftover_banner', JSON.stringify(newData.leftover_banner || {}));
      fd.append('featured_collections', JSON.stringify(newData.featured_collections || {}));
      fd.append('testimonials', JSON.stringify(newData.testimonials || []));
      fd.append('faqs', JSON.stringify(newData.faqs || []));

      await homePageService.update(newData.id, fd);
      await revalidateHomePage();
      toast.success("Home page updated successfully");
      fetchData();
    } catch (e) {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = () => {
    saveToServer(data);
  };

  const getArrayForKey = (listKey) => {
    const raw = data?.[listKey];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  };

  const openModal = (index = null, listKey = activeTab) => {
    setEditingIndex(index);
    const items = getArrayForKey(listKey);
    if (index !== null) {
      setFormData(items[index] || {});
    } else if (listKey === 'testimonials') {
      setFormData({ rating: 5 });
    } else {
      setFormData({});
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData({});
    setEditingIndex(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const listKey = LIST_TAB_LABELS[activeTab] ? activeTab : 'steps';
    const updatedArray = [...getArrayForKey(listKey)];

    const newFormData = { ...formData };
    if (!newFormData.id) {
      newFormData.id = listKey === 'faqs' ? `faq-${Date.now()}` : Date.now();
    }
    if (listKey === 'testimonials') {
      newFormData.rating = Math.min(5, Math.max(1, Number(newFormData.rating || 5)));
      if (!newFormData.initials && newFormData.author) {
        newFormData.initials = newFormData.author
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
      }
    }

    if (editingIndex !== null) {
      updatedArray[editingIndex] = newFormData;
    } else {
      updatedArray.push(newFormData);
    }

    const newData = { ...data, [listKey]: updatedArray };
    setData(newData);
    saveToServer(newData);
    closeModal();
  };

  const confirmDelete = (index) => {
    setItemToDelete(index);
    setDeleteModalOpen(true);
  };

  const executeDelete = () => {
    if (itemToDelete !== null) {
      const listKey = LIST_TAB_LABELS[activeTab] ? activeTab : 'steps';
      const updatedArray = [...getArrayForKey(listKey)];
      updatedArray.splice(itemToDelete, 1);
      const newData = { ...data, [listKey]: updatedArray };
      setData(newData);
      saveToServer(newData);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const fc = data?.featured_collections || {};

  const updateFcField = (key, value) => {
    setData((prev) => ({
      ...prev,
      featured_collections: { ...(prev?.featured_collections || {}), [key]: value },
    }));
  };

  const updateFcNested = (group, key, value) => {
    setData((prev) => ({
      ...prev,
      featured_collections: {
        ...(prev?.featured_collections || {}),
        [group]: { ...((prev?.featured_collections || {})[group] || {}), [key]: value },
      },
    }));
  };

  const updateFcListItem = (listKey, index, key, value) => {
    setData((prev) => {
      const currentList = [...((prev?.featured_collections || {})[listKey] || [])];
      currentList[index] = { ...(currentList[index] || {}), [key]: value };
      return {
        ...prev,
        featured_collections: { ...(prev?.featured_collections || {}), [listKey]: currentList },
      };
    });
  };

  if (loading) {
    return (
      <Container title="Home Page Content">
        <div className="flex justify-center items-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container title="Home Page Content" description="Manage sections of the public Home Page">
      
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        {/* Tabs Header */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50/50 px-4 pt-3 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#00694c] text-[#00694c]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 capitalize">
              {TABS.find(t => t.id === activeTab)?.label}
            </h3>
            {LIST_TAB_LABELS[activeTab] && (
              <button 
                onClick={() => openModal(null, activeTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694c] text-white rounded-md hover:bg-[#00523b] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add {LIST_TAB_LABELS[activeTab]}
              </button>
            )}
          </div>

          {activeTab === 'featured_collections' && (
             <div className="max-w-5xl space-y-8">
                {/* Header Settings */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="text-md font-semibold text-slate-700 border-b pb-2">Section Header</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Eyebrow Label</label>
                      <input
                        type="text"
                        value={fc.eyebrow || ''}
                        onChange={(e) => updateFcField('eyebrow', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="FEATURED COLLECTIONS"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Section Heading</label>
                      <input
                        type="text"
                        value={fc.heading || ''}
                        onChange={(e) => updateFcField('heading', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Curated for a Healthier You"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Subtitle</label>
                      <input
                        type="text"
                        value={fc.subtitle || ''}
                        onChange={(e) => updateFcField('subtitle', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Explore our handpicked collections of fresh and healthy foods."
                      />
                    </div>
                  </div>
                </div>

                {/* Best Sellers & New Arrivals Spotlight Cards */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="text-md font-semibold text-slate-700 border-b pb-2">Product Spotlight Cards</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'best_sellers', heading: 'Left Card — Best Sellers' },
                      { key: 'new_arrivals', heading: 'Right Card — New Arrivals' },
                    ].map(({ key, heading }) => {
                      const groupData = fc[key] || {};
                      const slugsValue = Array.isArray(groupData.product_slugs) ? groupData.product_slugs.join(', ') : '';
                      return (
                        <div key={key} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/40">
                          <div className="text-xs font-bold text-[#00694c] uppercase">{heading}</div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input
                              type="text"
                              value={groupData.title || ''}
                              onChange={(e) => updateFcNested(key, 'title', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Subtitle</label>
                            <input
                              type="text"
                              value={groupData.subtitle || ''}
                              onChange={(e) => updateFcNested(key, 'subtitle', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Button Text</label>
                              <input
                                type="text"
                                value={groupData.cta_text || ''}
                                onChange={(e) => updateFcNested(key, 'cta_text', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Button Link</label>
                              <input
                                type="text"
                                value={groupData.cta_href || ''}
                                onChange={(e) => updateFcNested(key, 'cta_href', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pinned Product Slugs (comma-separated, optional)</label>
                            <input
                              type="text"
                              value={slugsValue}
                              onChange={(e) =>
                                updateFcNested(
                                  key,
                                  'product_slugs',
                                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                )
                              }
                              placeholder="Leave blank for automatic live products"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Promo Banners (Promo #2 & #3 sync dynamically from Offers & Leftover Packs) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <h4 className="text-md font-semibold text-slate-700">Promo Banner Cards</h4>
                    <span className="text-xs text-slate-500">
                      Special Offers &amp; Leftover Packs banners sync automatically from Offers &amp; Leftover Packs.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(fc.promos || []).map((promo, idx) => {
                      if (promo?.id === 'offers' || promo?.id === 'leftover' || idx === 1 || idx === 2) {
                        return null;
                      }
                      return (
                      <div key={promo.id || idx} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#00694c] uppercase">Promo #{idx + 1}</span>
                          {(previewImages[`promo_image_${idx}`] || promo.image_url) && (
                            <img
                              src={previewImages[`promo_image_${idx}`] || promo.image_url}
                              alt={promo.title || `Promo ${idx + 1}`}
                              className="w-16 h-11 object-cover rounded border border-slate-200"
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input
                              type="text"
                              value={promo.title || ''}
                              onChange={(e) => updateFcListItem('promos', idx, 'title', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Theme</label>
                            <select
                              value={promo.theme || 'sage'}
                              onChange={(e) => updateFcListItem('promos', idx, 'theme', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            >
                              <option value="sage">Sage Green</option>
                              <option value="cream">Soft Gold Cream</option>
                              <option value="dark_green">Deep Forest Green</option>
                              <option value="warm_cream">Warm Field Cream</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={promo.subtitle || ''}
                            onChange={(e) => updateFcListItem('promos', idx, 'subtitle', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Badge Text</label>
                            <input
                              type="text"
                              value={promo.badge_text || ''}
                              onChange={(e) => updateFcListItem('promos', idx, 'badge_text', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Badge Style</label>
                            <select
                              value={promo.badge_style || 'none'}
                              onChange={(e) => updateFcListItem('promos', idx, 'badge_style', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            >
                              <option value="sage">Green Pill</option>
                              <option value="amber">Gold Pill</option>
                              <option value="leaf">Leaf Icon</option>
                              <option value="none">None</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CTA Text</label>
                            <input
                              type="text"
                              value={promo.cta_text || ''}
                              onChange={(e) => updateFcListItem('promos', idx, 'cta_text', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CTA Link</label>
                            <input
                              type="text"
                              value={promo.cta_href || ''}
                              onChange={(e) => updateFcListItem('promos', idx, 'cta_href', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Seal (e.g. Up to|30%|OFF)</label>
                            <input
                              type="text"
                              value={promo.discount_label || ''}
                              onChange={(e) => updateFcListItem('promos', idx, 'discount_label', e.target.value)}
                              placeholder="Up to|30%|OFF"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Replace Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, `promo_image_${idx}`)}
                            className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-[#00694c] cursor-pointer"
                          />
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 py-2.5 bg-[#00694c] text-white rounded-lg font-medium hover:bg-[#00523b] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "Saving..." : "Save Featured Collections"}
                </button>
             </div>
          )}

          {activeTab === 'hero' && (
             <div className="max-w-3xl bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-8">
                {/* Mobile Settings */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 border-b pb-2 mb-4">Mobile Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Heading</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.mobile_heading || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, mobile_heading: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Freshness from the Orchard to Your Table."
                      />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Hero Image</label>
                        <div className="flex items-center gap-4">
                            {(previewImages.hero_image_mobile || data?.hero_image_mobile_url) && (
                                <img 
                                    src={previewImages.hero_image_mobile || data?.hero_image_mobile_url} 
                                    alt="Preview" 
                                    className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                                />
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'hero_image_mobile')}
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#00694c] hover:file:bg-green-100 cursor-pointer"
                            />
                        </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Settings */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 border-b pb-2 mb-4">Desktop Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Desktop Heading</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.desktop_heading || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, desktop_heading: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Fresh from the market, delivered to your door."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Desktop Subtext</label>
                      <textarea 
                        value={data?.hero_section?.desktop_subtext || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, desktop_subtext: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Experience the finest seasonal harvests..."
                        rows={3}
                      />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Desktop Hero Image</label>
                        <div className="flex items-center gap-4">
                            {(previewImages.hero_image_desktop || data?.hero_image_desktop_url) && (
                                <img 
                                    src={previewImages.hero_image_desktop || data?.hero_image_desktop_url} 
                                    alt="Preview" 
                                    className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                                />
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'hero_image_desktop')}
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#00694c] hover:file:bg-green-100 cursor-pointer"
                            />
                        </div>
                    </div>
                  </div>
                </div>

                {/* Call To Actions */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 border-b pb-2 mb-4">Call To Actions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Primary CTA Text</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.primary_cta_text || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, primary_cta_text: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Primary CTA Link</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.primary_cta_href || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, primary_cta_href: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Secondary CTA Text</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.secondary_cta_text || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, secondary_cta_text: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Secondary CTA Link</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.secondary_cta_href || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, secondary_cta_href: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Extra Highlights */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 border-b pb-2 mb-4">Extra Highlights</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Top Badge Text</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.top_badge_text || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, top_badge_text: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="100% Fresh & Organic"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Feature 1 Text</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.feature_1_text || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, feature_1_text: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Farm Fresh"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Feature 2 Text</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.feature_2_text || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, feature_2_text: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Fast Delivery"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Feature 3 Text</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.feature_3_text || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, feature_3_text: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Quality Guaranteed"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 py-2.5 bg-[#00694c] text-white rounded-lg font-medium hover:bg-[#00523b] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "Saving..." : "Save Hero Section"}
                </button>
             </div>
          )}

          {activeTab === 'how_it_works' && (
             <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Section Heading</label>
                  <input 
                    type="text" 
                    value={data?.how_it_works?.heading || ''}
                    onChange={(e) => setData({ ...data, how_it_works: { ...data.how_it_works, heading: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                    placeholder="How It Works"
                  />
                </div>
                
                <button 
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 py-2.5 bg-[#00694c] text-white rounded-lg font-medium hover:bg-[#00523b] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "Saving..." : "Save Config"}
                </button>
             </div>
          )}

          {activeTab === 'leftover' && (
             <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Heading</label>
                  <input 
                    type="text" 
                    value={data?.leftover_banner?.heading || ''}
                    onChange={(e) => setData({ ...data, leftover_banner: { ...data.leftover_banner, heading: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea 
                    value={data?.leftover_banner?.description || ''}
                    onChange={(e) => setData({ ...data, leftover_banner: { ...data.leftover_banner, description: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">CTA Text</label>
                      <input 
                        type="text" 
                        value={data?.leftover_banner?.cta_text || ''}
                        onChange={(e) => setData({ ...data, leftover_banner: { ...data.leftover_banner, cta_text: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">CTA Link</label>
                      <input 
                        type="text" 
                        value={data?.leftover_banner?.cta_href || ''}
                        onChange={(e) => setData({ ...data, leftover_banner: { ...data.leftover_banner, cta_href: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Banner Image</label>
                    <div className="flex items-center gap-4">
                        {(previewImages.leftover_banner_image || data?.leftover_banner_image_url) && (
                            <img 
                                src={previewImages.leftover_banner_image || data?.leftover_banner_image_url} 
                                alt="Preview" 
                                className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                            />
                        )}
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'leftover_banner_image')}
                            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#00694c] hover:file:bg-green-100 cursor-pointer"
                        />
                    </div>
                </div>
                
                <button 
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full flex justify-center items-center gap-2 py-2.5 bg-[#00694c] text-white rounded-lg font-medium hover:bg-[#00523b] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "Saving..." : "Save Config"}
                </button>
             </div>
          )}

          {activeTab === 'steps' && (() => {
            let currentSteps = [];
            if (Array.isArray(data?.steps)) {
              currentSteps = data.steps;
            } else if (typeof data?.steps === 'string') {
              try { currentSteps = JSON.parse(data.steps); } catch { currentSteps = []; }
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSteps.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(idx)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => confirmDelete(idx)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  
                  <div className="font-medium text-slate-800 pr-16">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-1">Icon: <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{item.icon_key}</span></div>
                  <div className="text-sm text-slate-600 mt-2 line-clamp-3">{item.desc}</div>
                </div>
              ))}
              {currentSteps.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No items added yet. Click &quot;Add Step&quot; to begin.
                </div>
              )}
            </div>
            );
          })()}

          {activeTab === 'testimonials' && (() => {
            const currentReviews = getArrayForKey('testimonials');
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentReviews.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(idx, 'testimonials')} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => confirmDelete(idx)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-2.5 pr-16">
                      <div className="w-9 h-9 rounded-full bg-[#DCECD8] text-[#085041] flex items-center justify-center text-xs font-bold shrink-0">
                        {item.initials || 'EA'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{item.author}</div>
                        <div className="text-xs text-slate-500 truncate">{item.location} · {"★".repeat(Math.min(5, Math.max(1, Number(item.rating || 5))))}</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-3 line-clamp-3">&ldquo;{item.quote}&rdquo;</p>
                  </div>
                ))}
                {currentReviews.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No customer reviews added yet. Click &quot;Add Customer Review&quot; to begin.
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'faqs' && (() => {
            const currentFaqs = getArrayForKey('faqs');
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFaqs.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(idx, 'faqs')} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => confirmDelete(idx)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="font-semibold text-slate-800 pr-16">{item.question}</div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3">{item.answer}</p>
                  </div>
                ))}
                {currentFaqs.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No FAQs added yet. Click &quot;Add FAQ&quot; to begin.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={`${editingIndex !== null ? "Edit" : "Add"} ${LIST_TAB_LABELS[activeTab] || "Step"}`}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
            {activeTab === 'testimonials' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Customer Name</label>
                    <input required type="text" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Sarah M." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Location</label>
                    <input required type="text" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Dhaka" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Initials (optional)</label>
                    <input type="text" maxLength={3} value={formData.initials || ''} onChange={(e) => setFormData({...formData, initials: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Auto from name if blank" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Rating (1-5)</label>
                    <select value={formData.rating || 5} onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={2}>2 Stars</option>
                      <option value={1}>1 Star</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Customer Quote</label>
                  <textarea required value={formData.quote || ''} onChange={(e) => setFormData({...formData, quote: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="Share their experience with El Árbol..." />
                </div>
              </>
            ) : activeTab === 'faqs' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Question</label>
                  <input required type="text" value={formData.question || ''} onChange={(e) => setFormData({...formData, question: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. How do I place an order?" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Answer</label>
                  <textarea required value={formData.answer || ''} onChange={(e) => setFormData({...formData, answer: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={4} placeholder="Clear, helpful answer for shoppers..." />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Icon Key</label>
                  <input required type="text" value={formData.icon_key || ''} onChange={(e) => setFormData({...formData, icon_key: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. select, delivery, local" />
                  <p className="text-[10px] text-slate-500 mt-1">Must match a key in frontend configuration (select, delivery, local)</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Title</label>
                  <input required type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea required value={formData.desc || ''} onChange={(e) => setFormData({...formData, desc: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
                </div>
              </>
            )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#00694c] hover:bg-[#00523b] rounded-lg transition-colors cursor-pointer">
              {editingIndex !== null ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="p-1">
          <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this item? This action will take effect immediately after confirming.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
            <button onClick={executeDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer">Yes, Delete</button>
          </div>
        </div>
      </Modal>
    </Container>
  );
}
