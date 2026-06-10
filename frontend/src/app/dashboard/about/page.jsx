"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Edit2, Loader2, AlertCircle } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import Modal from "@/app/dashboard/_components/Modal";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { aboutPageService } from "@/app/dashboard/_lib/services";
import { revalidateAboutPage } from "./actions";

const TABS = [
  { id: "hero", label: "Hero Section" },
  { id: "stats", label: "Stats" },
  { id: "values", label: "Values" },
  { id: "milestones", label: "Milestones" },
  { id: "farm_partners", label: "Farm Partners" },
  { id: "team", label: "Team" },
];

const FIELDS_MAP = {
  stats: [
    { key: "value", label: "Value (e.g. 6+)", placeholder: "6+" },
    { key: "label", label: "Label", placeholder: "Years of service" },
  ],
  values: [
    { key: "icon_name", label: "Lucide Icon Name", placeholder: "Leaf, Users, Award" },
    { key: "title", label: "Title", placeholder: "Rooted in sustainability" },
    { key: "body", label: "Body Text", placeholder: "Every product we source..." },
  ],
  milestones: [
    { key: "year", label: "Year", placeholder: "2018" },
    { key: "event", label: "Event Description", placeholder: "Founded in Madrid..." },
  ],
  farm_partners: [
    { key: "icon_name", label: "Lucide Icon Name", placeholder: "Tractor, Sprout, Wheat" },
    { key: "name", label: "Farm Name", placeholder: "Hacienda del Sol" },
    { key: "region", label: "Region", placeholder: "Almería" },
    { key: "specialty", label: "Specialty", placeholder: "Heirloom tomatoes" },
  ],
  team: [
    { key: "name", label: "Name", placeholder: "Sofía Martínez" },
    { key: "role", label: "Role", placeholder: "Co-founder & CEO" },
    { key: "initials", label: "Initials", placeholder: "SM" },
    { key: "origin", label: "Origin", placeholder: "Madrid" },
  ],
};

export default function AboutDashboardPage() {
  const toast = useToastContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null means adding new
  const [formData, setFormData] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await aboutPageService.list();
      // list returns a single object directly for our singleton endpoint
      if (res && !Array.isArray(res)) {
         setData(res);
      } else if (Array.isArray(res) && res.length > 0) {
         setData(res[0]);
      } else {
         setData({
             stats: [], values: [], milestones: [], farm_partners: [], team: []
         });
      }
    } catch (e) {
      toast.error("Failed to load about page data");
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
      fd.append('values', JSON.stringify(newData.values || []));
      fd.append('milestones', JSON.stringify(newData.milestones || []));
      fd.append('farm_partners', JSON.stringify(newData.farm_partners || []));
      
      const teamFiles = [];
      const teamJson = (newData.team || []).map((member, i) => {
        if (member.image_file instanceof File) {
           teamFiles.push({ key: `team_image_${i}`, file: member.image_file });
        }
        const { image_file, ...rest } = member;
        return rest;
      });
      teamFiles.forEach(({ key, file }) => fd.append(key, file));
      fd.append('team', JSON.stringify(teamJson));

      await aboutPageService.update(newData.id, fd);
      await revalidateAboutPage();
      toast.success("About page updated successfully");
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

  if (loading) {
    return (
      <Container title="About Page Content">
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
    <Container title="About Page Content" description="Manage sections of the public About Us page">
      
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
              {activeTab.replace('_', ' ')}
            </h3>
            {activeTab !== 'hero' && (
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694c] text-white rounded-md hover:bg-[#00523b] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            )}
          </div>

          {activeTab === 'hero' ? (
             <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Badge Text</label>
                    <input 
                      type="text" 
                      value={data?.hero_section?.badge || ''}
                      onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, badge: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20"
                      placeholder="Our story"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Main Title</label>
                    <input 
                      type="text"
                      value={data?.hero_section?.title_main || ''}
                      onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, title_main: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20"
                      placeholder="Rooted in quality,"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Highlight Text (Green & Italic)</label>
                    <input 
                      type="text"
                      value={data?.hero_section?.title_highlight || ''}
                      onChange={(e) => setData({ ...data, hero_section: { ...data.hero_section, title_highlight: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20"
                      placeholder="growing for the future."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 w-full text-left">
                      Hero Image
                    </label>
                    <label className="relative group cursor-pointer w-full max-w-sm h-48 block">
                      <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#00694c] group-hover:bg-slate-100">
                        {data?.hero_image instanceof File ? (
                          <img 
                            src={URL.createObjectURL(data.hero_image)} 
                            alt="Preview" 
                            className="w-full h-full object-contain p-2" 
                          />
                        ) : data?.hero_image_url_final ? (
                          <img 
                            src={data.hero_image_url_final} 
                            alt="Current" 
                            className="w-full h-full object-contain p-2" 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#00694c] transition-colors">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
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
                </div>
             </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-500 mb-2">No items in this section.</p>
              <button onClick={() => openModal()} className="text-sm font-medium text-[#00694c] hover:underline cursor-pointer">
                Add your first {activeTab.replace('_', ' ')} item
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
                    {activeTab === 'team' && item.image_url && (
                      <div className="mb-2">
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                      </div>
                    )}
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

      {/* Item Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingIndex !== null ? "Edit Item" : "Add Item"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              {field.key === 'body' || field.key === 'event' ? (
                <textarea
                  required
                  rows={3}
                  value={formData[field.key] || ""}
                  onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20"
                />
              ) : (
                <input
                  type="text"
                  required
                  value={formData[field.key] || ""}
                  onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20"
                />
              )}
            </div>
          ))}
          
          {activeTab === 'team' && (
            <div className="flex flex-col pt-2">
              <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                Photo (Optional)
              </span>
              
              <label className="relative group cursor-pointer w-24 h-24 mx-auto">
                <div className="w-full h-full rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#00694c] group-hover:bg-slate-100">
                  {formData.image_file ? (
                    <img 
                      src={URL.createObjectURL(formData.image_file)} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : formData.image_url ? (
                    <img 
                      src={formData.image_url} 
                      alt="Current" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#00694c] transition-colors">
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({...formData, image_file: e.target.files[0]})
                    }
                  }}
                  className="hidden"
                />
                
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              </label>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {editingIndex !== null ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={executeDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

    </Container>
  );
}
