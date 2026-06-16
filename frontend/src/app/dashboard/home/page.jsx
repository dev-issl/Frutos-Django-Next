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
  { id: "how_it_works", label: "How It Works Config" },
  { id: "steps", label: "Steps Items" },
  { id: "leftover", label: "Leftover Banner" },
];

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
             hero_section: {}, how_it_works: {}, steps: [], leftover_banner: {}
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
      
      fd.append('hero_section', JSON.stringify(newData.hero_section || {}));
      fd.append('how_it_works', JSON.stringify(newData.how_it_works || {}));
      fd.append('steps', JSON.stringify(newData.steps || []));
      fd.append('leftover_banner', JSON.stringify(newData.leftover_banner || {}));

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

  const openModal = (index = null) => {
    setEditingIndex(index);
    if (index !== null) {
      setFormData(data.steps[index] || {});
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
    const updatedArray = [...(data.steps || [])];
    
    // Auto-assign ID if missing
    const newFormData = { ...formData };
    if (!newFormData.id) {
        newFormData.id = Date.now();
    }

    if (editingIndex !== null) {
      updatedArray[editingIndex] = newFormData;
    } else {
      updatedArray.push(newFormData);
    }

    const newData = { ...data, steps: updatedArray };
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
      const updatedArray = [...(data.steps || [])];
      updatedArray.splice(itemToDelete, 1);
      const newData = { ...data, steps: updatedArray };
      setData(newData);
      saveToServer(newData);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
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
            {activeTab === 'steps' && (
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694c] text-white rounded-md hover:bg-[#00523b] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Step
              </button>
            )}
          </div>

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
                  No items added yet. Click "Add Step" to begin.
                </div>
              )}
            </div>
            );
          })()}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingIndex !== null ? `Edit Step` : `Add Step`}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
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
