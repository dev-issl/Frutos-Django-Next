"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Edit2, Loader2 } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import Modal from "@/app/dashboard/_components/Modal";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { wholesalePageService } from "@/app/dashboard/_lib/services";
import { revalidateWholesalePage } from "./actions";

const TABS = [
  { id: "hero", label: "Hero Section" },
  { id: "stats", label: "Stats" },
  { id: "benefits", label: "Benefits" },
  { id: "categories", label: "Categories" },
  { id: "steps", label: "Steps" },
  { id: "guarantee", label: "Guarantee Bar" },
];

const FIELDS_MAP = {
  stats: [
    { key: "value", label: "Value (e.g. 200+)", placeholder: "200+" },
    { key: "label", label: "Label", placeholder: "Business Partners" },
    { key: "sub", label: "Subtext", placeholder: "Restaurants & hotels" },
    { key: "icon_name", label: "Lucide Icon Name", placeholder: "Building2" },
  ],
  benefits: [
    { key: "icon_name", label: "Lucide Icon Name", placeholder: "Leaf, Tractor" },
    { key: "title", label: "Title", placeholder: "Guaranteed Freshness" },
    { key: "body", label: "Body Text", placeholder: "Produce is harvested only after..." },
  ],
  categories: [
    { key: "title", label: "Category Title", placeholder: "Fresh Vegetables" },
    { key: "items", label: "Items List", placeholder: "Tomatoes, peppers, courgettes" },
    { key: "badge", label: "Badge Text", placeholder: "Year-round" },
    { key: "badge_bg_color", label: "Badge BG Color", placeholder: "#E7F1DF" },
    { key: "badge_text_color", label: "Badge Text Color", placeholder: "#00694c" },
    { key: "icon_name", label: "Lucide Icon Name", placeholder: "Carrot" },
    { key: "icon_bg_color", label: "Icon BG Color", placeholder: "#EDFAF2" },
  ],
  steps: [
    { key: "number", label: "Step Number", placeholder: "01" },
    { key: "title", label: "Title", placeholder: "Apply for an Account" },
    { key: "body", label: "Body Text", placeholder: "Fill out the application form..." },
    { key: "icon_name", label: "Lucide Icon Name", placeholder: "FileText" },
  ],
};

export default function WholesaleDashboardPage() {
  const toast = useToastContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  
  // Modal state for array items
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Separate modal for nested arrays like trust_badges and guarantee_checks
  const [nestedModalOpen, setNestedModalOpen] = useState(false);
  const [nestedEditingIndex, setNestedEditingIndex] = useState(null);
  const [nestedFormData, setNestedFormData] = useState({});
  const [nestedTarget, setNestedTarget] = useState(""); // "trust_badges" or "checks"

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await wholesalePageService.list();
      if (res && !Array.isArray(res)) {
         setData(res);
      } else if (Array.isArray(res) && res.length > 0) {
         setData(res[0]);
      } else {
         setData({
             hero_section: { trust_badges: [] },
             stats: [], benefits: [], categories: [], steps: [],
             guarantee: { checks: [] }
         });
      }
    } catch (e) {
      toast.error("Failed to load wholesale page data");
    } finally {
      setLoading(false);
    }
  };

  const saveToServer = async (newData) => {
    if (!newData?.id) return;
    setSaving(true);
    try {
      const fd = new FormData();
      if (newData.hero_image instanceof File) {
        fd.append('hero_image', newData.hero_image);
      }
      fd.append('hero_section', JSON.stringify(newData.hero_section || {}));
      fd.append('stats', JSON.stringify(newData.stats || []));
      fd.append('benefits', JSON.stringify(newData.benefits || []));
      fd.append('categories', JSON.stringify(newData.categories || []));
      fd.append('steps', JSON.stringify(newData.steps || []));
      fd.append('guarantee', JSON.stringify(newData.guarantee || {}));

      await wholesalePageService.update(newData.id, fd);
      await revalidateWholesalePage();
      toast.success("Wholesale page updated successfully");
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

  const openModal = (index = null) => {
    setEditingIndex(index);
    if (index !== null) {
      setFormData(data[activeTab][index] || {});
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
    const updatedArray = [...(data[activeTab] || [])];
    if (editingIndex !== null) {
      updatedArray[editingIndex] = formData;
    } else {
      updatedArray.push(formData);
    }
    const newData = { ...data, [activeTab]: updatedArray };
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
      const updatedArray = [...(data[activeTab] || [])];
      updatedArray.splice(itemToDelete, 1);
      const newData = { ...data, [activeTab]: updatedArray };
      setData(newData);
      saveToServer(newData);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Nested Arrays Handling
  const openNestedModal = (target, index = null) => {
    setNestedTarget(target);
    setNestedEditingIndex(index);
    if (target === "trust_badges") {
      const arr = data.hero_section?.trust_badges || [];
      setNestedFormData(index !== null ? arr[index] : {});
    } else if (target === "checks") {
      const arr = data.guarantee?.checks || [];
      setNestedFormData(index !== null ? arr[index] : {});
    }
    setNestedModalOpen(true);
  };

  const closeNestedModal = () => {
    setNestedModalOpen(false);
    setNestedFormData({});
    setNestedEditingIndex(null);
    setNestedTarget("");
  };

  const handleNestedFormSubmit = (e) => {
    e.preventDefault();
    let newData = { ...data };
    
    if (nestedTarget === "trust_badges") {
      const arr = [...(newData.hero_section?.trust_badges || [])];
      if (nestedEditingIndex !== null) {
        arr[nestedEditingIndex] = nestedFormData;
      } else {
        arr.push(nestedFormData);
      }
      newData.hero_section = { ...newData.hero_section, trust_badges: arr };
    } else if (nestedTarget === "checks") {
      const arr = [...(newData.guarantee?.checks || [])];
      if (nestedEditingIndex !== null) {
        arr[nestedEditingIndex] = nestedFormData;
      } else {
        arr.push(nestedFormData);
      }
      newData.guarantee = { ...newData.guarantee, checks: arr };
    }

    setData(newData);
    saveToServer(newData);
    closeNestedModal();
  };

  const deleteNestedItem = (target, index) => {
    let newData = { ...data };
    if (target === "trust_badges") {
      const arr = [...(newData.hero_section?.trust_badges || [])];
      arr.splice(index, 1);
      newData.hero_section = { ...newData.hero_section, trust_badges: arr };
    } else if (target === "checks") {
      const arr = [...(newData.guarantee?.checks || [])];
      arr.splice(index, 1);
      newData.guarantee = { ...newData.guarantee, checks: arr };
    }
    setData(newData);
    saveToServer(newData);
  };

  if (loading) {
    return (
      <Container title="Wholesale Page Content">
        <div className="flex justify-center items-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Container>
    );
  }

  let currentItems = [];
  if (Array.isArray(data?.[activeTab])) {
    currentItems = data[activeTab];
  } else if (typeof data?.[activeTab] === 'string') {
    try {
      currentItems = JSON.parse(data[activeTab]);
    } catch {
      currentItems = [];
    }
  }
  const fields = FIELDS_MAP[activeTab] || [];

  return (
    <Container title="Wholesale Page Content" description="Manage sections of the public Wholesale page">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
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

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 capitalize">
              {TABS.find(t => t.id === activeTab)?.label}
            </h3>
            {['stats', 'benefits', 'categories', 'steps'].includes(activeTab) && (
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694c] text-white rounded-md hover:bg-[#00523b] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            )}
          </div>

          {activeTab === 'hero' && (
             <div className="max-w-3xl bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Headline</label>
                      <input 
                        type="text" 
                        value={data?.hero_section?.headline || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, headline: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Headline Emphasis</label>
                      <input 
                        type="text"
                        value={data?.hero_section?.headline_em || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, headline_em: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Subtitle</label>
                    <textarea 
                      rows={2}
                      value={data?.hero_section?.subtitle || ''}
                      onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, subtitle: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Trust Text (Below buttons)</label>
                    <input 
                      type="text"
                      value={data?.hero_section?.trust_text || ''}
                      onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, trust_text: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                    />
                  </div>

                  <hr className="my-6 border-slate-100" />
                  <h4 className="text-sm font-semibold text-slate-800 mb-4">Floating Image Badges</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Top-right Badge Stat</label>
                      <input 
                        type="text"
                        value={data?.hero_section?.badge_stat || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, badge_stat: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="48h"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Top-right Badge Label</label>
                      <input 
                        type="text"
                        value={data?.hero_section?.badge_label || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, badge_label: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="DELIVERY"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Bottom Badge Title</label>
                      <input 
                        type="text"
                        value={data?.hero_section?.bottom_badge_title || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, bottom_badge_title: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="Harvested to order"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Bottom Badge Subtitle</label>
                      <input 
                        type="text"
                        value={data?.hero_section?.bottom_badge_subtitle || ''}
                        onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, bottom_badge_subtitle: e.target.value } })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                        placeholder="From 40+ certified farms..."
                      />
                    </div>
                  </div>

                  <hr className="my-6 border-slate-100" />
                  <h4 className="text-sm font-semibold text-slate-800 mb-4">Hero Image</h4>
                  <div>
                    <label className="relative group cursor-pointer w-full max-w-sm h-48 block">
                      <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#00694c] group-hover:bg-slate-100">
                        {data?.hero_image instanceof File ? (
                          <img 
                            src={URL.createObjectURL(data.hero_image)} 
                            alt="Preview" 
                            className="w-full h-full object-cover p-2" 
                          />
                        ) : data?.hero_image_url_final ? (
                          <img 
                            src={data.hero_image_url_final} 
                            alt="Current" 
                            className="w-full h-full object-cover p-2" 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#00694c] transition-colors">
                            <Plus className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium uppercase tracking-wider">Upload Hero Image</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setData({ ...data, hero_image: e.target.files[0] })
                          }
                        }}
                        className="hidden"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-sm font-medium">Change Image</span>
                      </div>
                    </label>
                  </div>

                  <hr className="my-6 border-slate-100" />
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-slate-800">Trust Badge Pills (Banner strip)</h4>
                    <button 
                      onClick={() => openNestedModal("trust_badges")}
                      className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      + Add Pill
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(data?.hero_section?.trust_badges || []).map((badge, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                        <span className="text-sm text-slate-700">{badge.label}</span>
                        <button onClick={() => openNestedModal("trust_badges", idx)} className="text-blue-500 hover:text-blue-700 cursor-pointer"><Edit2 className="w-3 h-3"/></button>
                        <button onClick={() => deleteNestedItem("trust_badges", idx)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-3 h-3"/></button>
                      </div>
                    ))}
                  </div>

                </div>
             </div>
          )}

          {activeTab === 'guarantee' && (
            <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Guarantee Title</label>
                  <input 
                    type="text" 
                    value={data?.guarantee?.title || ''}
                    onChange={(e) => setData({ ...data, guarantee: { ...data.guarantee, title: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Subtitle</label>
                  <input 
                    type="text"
                    value={data?.guarantee?.subtitle || ''}
                    onChange={(e) => setData({ ...data, guarantee: { ...data.guarantee, subtitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                  />
                </div>

                <hr className="my-6 border-slate-100" />
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-slate-800">Check Items</h4>
                  <button 
                    onClick={() => openNestedModal("checks")}
                    className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    + Add Check
                  </button>
                </div>
                <div className="space-y-2">
                  {(data?.guarantee?.checks || []).map((check, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-2">
                      <span className="text-sm text-slate-700">✓ {check.text}</span>
                      <div className="flex gap-2">
                        <button onClick={() => openNestedModal("checks", idx)} className="text-blue-500 hover:text-blue-700 cursor-pointer"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={() => deleteNestedItem("checks", idx)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {['stats', 'benefits', 'categories', 'steps'].includes(activeTab) && (
            currentItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 mb-2">No items in this section.</p>
                <button onClick={() => openModal()} className="text-sm font-medium text-[#00694c] hover:underline cursor-pointer">
                  Add your first item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => openModal(idx)}
                    className="relative group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white rounded-md shadow-sm border border-slate-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal(idx); }} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDelete(idx); }} 
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="pr-10 space-y-2">
                      {fields.map(f => (
                        <div key={f.key}>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{f.label}</span>
                          <span className="text-sm text-slate-800 line-clamp-2">{item[f.key] || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00694c] hover:bg-[#00523b] text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Main Items Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingIndex !== null ? "Edit Item" : "Add Item"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              {field.key === 'body' || field.key === 'items' ? (
                <textarea
                  required={field.key !== 'badge' && field.key !== 'badge_bg_color' && field.key !== 'badge_text_color'}
                  rows={3}
                  value={formData[field.key] || ""}
                  onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                />
              ) : (
                <input
                  type="text"
                  required={field.key !== 'badge' && field.key !== 'badge_bg_color' && field.key !== 'badge_text_color'}
                  value={formData[field.key] || ""}
                  onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c]"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-[#00694C] hover:bg-[#085041] text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer"
            >
              {editingIndex !== null ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="p-4 bg-red-50 rounded-lg border border-red-100 mb-6">
          <p className="text-red-800 text-sm">Are you sure you want to delete this item? This action will be saved when you click "Save All Changes".</p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
          <button onClick={executeDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Delete</button>
        </div>
      </Modal>

      {/* Nested Items Modal */}
      <Modal open={nestedModalOpen} onClose={closeNestedModal} title={nestedEditingIndex !== null ? "Edit" : "Add"}>
        <form onSubmit={handleNestedFormSubmit} className="space-y-4">
          {nestedTarget === "trust_badges" ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Badge Label</label>
              <input type="text" required value={nestedFormData.label || ""} onChange={e => setNestedFormData({...nestedFormData, label: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          ) : nestedTarget === "checks" ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Check Text</label>
              <input type="text" required value={nestedFormData.text || ""} onChange={e => setNestedFormData({...nestedFormData, text: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          ) : null}
          <div className="flex justify-end pt-4">
            <button type="submit" className="px-4 py-2 bg-[#00694C] hover:bg-[#085041] text-white text-sm font-medium rounded-lg cursor-pointer">
              {nestedEditingIndex !== null ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </Modal>

    </Container>
  );
}
