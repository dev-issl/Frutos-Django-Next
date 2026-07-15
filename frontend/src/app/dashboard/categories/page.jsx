"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, ChevronRight, Eye, Package, LayoutGrid } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { categoriesService, subcategoriesService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 20;
const TABS = [
  { id: "categories", label: "Categories" },
  { id: "subcategories", label: "Sub Categories" },
];

const inp = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-white transition-all";
const lbl = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

/* ─── Category View Modal ──────────────────────────────────────────── */
function CategoryViewModal({ open, item, isSub, categories, onClose }) {
  if (!open || !item) return null;
  const parentName = isSub ? (categories.find(c => c.id === item.category)?.name || "—") : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Eye size={17} className="text-blue-600" />
            </div>
            <p className="font-bold text-slate-800">{isSub ? "SubCategory Details" : "Category Details"}</p>
          </div>
          <button style={{cursor: 'pointer'}} onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-slate-300" />
              )}
            </div>
            
            <div className="flex-1 pt-2 min-w-0">
              <h2 className="text-2xl font-black text-slate-900 mb-1 truncate">{item.name}</h2>
              <p className="text-sm font-medium text-slate-500 mb-4 bg-slate-100 px-2 py-1 rounded inline-block truncate max-w-full">Slug: {item.slug}</p>
              
              <div className="grid grid-cols-2 gap-4">
                {isSub ? (
                  <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><LayoutGrid size={12}/> Parent</span>
                    <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{parentName}</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><LayoutGrid size={12}/> SubCats</span>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{item.sub_category_count ?? 0}</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Package size={12}/> Products</span>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{item.total_products ?? 0}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <button style={{cursor: 'pointer'}} onClick={onClose} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Category Form ──────────────────────────────────────────── */
function CategoryForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(initial.image_url || "");
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!initial.slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleImage = (e) => {
    const f = e.target.files?.[0];
    if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      if (slug) fd.append("slug", slug);
      if (image) fd.append("image", image);
      await onSubmit(fd);
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div><label className={lbl}>Category Name *</label><input required className={inp} value={name} onChange={handleNameChange} placeholder="e.g., Electronics" /></div>
        <div><label className={lbl}>Slug (Optional)</label><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" /></div>
      </div>
      <div>
        <label className={lbl}>Category Image</label>
        <div className="flex items-start gap-4 mt-2">
          {preview && (
            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button style={{cursor: 'pointer'}} type="button" onClick={() => { setImage(null); setPreview(""); }} className="absolute top-1 right-1 w-6 h-6 bg-white/90 text-red-500 hover:text-red-600 rounded-lg flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors"><X className="w-4 h-4" /></button>
            </div>
          )}
          <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors group">
            <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Click to upload image</span>
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-bold bg-[#00694C] text-white rounded-xl hover:bg-[#085041] disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ─── SubCategory Form ───────────────────────────────────────── */
function SubCategoryForm({ initial = {}, categories = [], onSubmit, submitLabel = "Save" }) {
  const toast = useToastContext();
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [category, setCategory] = useState(initial.category?.id || initial.category || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(initial.image_url || "");
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!initial.slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleImage = (e) => {
    const f = e.target.files?.[0];
    if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a parent category");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("category", category);
      if (slug) fd.append("slug", slug);
      if (image) fd.append("image", image);
      await onSubmit(fd);
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div><label className={lbl}>SubCategory Name *</label><input required className={inp} value={name} onChange={handleNameChange} placeholder="e.g., Smartphones" /></div>
        <div>
          <label className={lbl}>Parent Category *</label>
          <SearchableSelect
            required
            value={category}
            onChange={setCategory}
            placeholder="Select category"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div className="sm:col-span-2"><label className={lbl}>Slug (Optional)</label><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" /></div>
      </div>
      <div>
        <label className={lbl}>SubCategory Image</label>
        <div className="flex items-start gap-4 mt-2">
          {preview && (
            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button style={{cursor: 'pointer'}} type="button" onClick={() => { setImage(null); setPreview(""); }} className="absolute top-1 right-1 w-6 h-6 bg-white/90 text-red-500 hover:text-red-600 rounded-lg flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors"><X className="w-4 h-4" /></button>
            </div>
          )}
          <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors group">
            <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Click to upload image</span>
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-bold bg-[#00694C] text-white rounded-xl hover:bg-[#085041] disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CategoriesPage() {
  const toast = useToastContext();
  const [tab, setTab] = useState("categories");
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [viewModal, setViewModal] = useState({ open: false, item: null, isSub: false });
  const [confirm, setConfirm] = useState({ open: false, item: null, tab: null });

  const cats = useModel(categoriesService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const subs = useModel(subcategoriesService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const catColumns = [
    { key: "image_url", label: "Photo", sortable: false, render: (v) => v ? <img src={v} alt="" className="w-8 h-8 rounded object-cover cursor-pointer" /> : <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center cursor-pointer"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /></div> },
    { key: "name", label: "Name", render: (v) => <span className="font-semibold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors">{v}</span> },
    { key: "slug", label: "Slug" },
    { key: "sub_category_count", label: "SubCategories", render: (v) => v ?? 0 },
    { key: "total_products", label: "Products", render: (v) => v ?? 0 },
  ];

  const subColumns = [
    { key: "image_url", label: "Photo", sortable: false, render: (v) => v ? <img src={v} alt="" className="w-8 h-8 rounded object-cover cursor-pointer" /> : <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center cursor-pointer"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /></div> },
    { key: "name", label: "Name", render: (v) => <span className="font-semibold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors">{v}</span> },
    { key: "slug", label: "Slug" },
    { key: "category", label: "Category", render: (v) => {
      const cat = cats.data.find(c => c.id === v);
      return cat?.name || "—";
    }},
  ];

  const handleSave = async (data) => {
    if (tab === "categories") {
      if (modal.mode === "edit") await cats.update(modal.item.slug, data);
      else { await cats.create(data); cats.setPage(1); }
    } else {
      if (modal.mode === "edit") await subs.update(modal.item.slug, data);
      else { await subs.create(data); subs.setPage(1); }
    }
  };

  const handleDelete = async () => {
    try {
      if (confirm.tab === "categories") await cats.remove(confirm.item.slug);
      else await subs.remove(confirm.item.slug);
      setConfirm({ open: false, item: null, tab: null });
    } catch (_) {
      // Error toast already fired by model hook's onError
    }
  };

  const activeModel = tab === "categories" ? cats : subs;
  const activeColumns = tab === "categories" ? catColumns : subColumns;

  const actions = (row) => (
    <div className="flex items-center gap-1">
      <button style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, item: row, isSub: tab === "subcategories" }); }} className="p-1.5 rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
      <button style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setModal({ open: true, mode: "edit", item: row }); }} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"><Pencil className="w-4 h-4" /></button>
      <button style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setConfirm({ open: true, item: row, tab }); }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  return (
    <Container title="Categories" description="Manage product categories and sub-categories">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-2 sm:mb-4">
        <div className="flex gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} style={{cursor: 'pointer'}} onClick={() => setTab(t.id)} className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 text-[11px] sm:text-sm rounded-lg transition-all font-semibold whitespace-nowrap text-center ${tab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}>{t.label}</button>
          ))}
        </div>
        <button style={{cursor: 'pointer'}} onClick={() => setModal({ open: true, mode: "create", item: null })} className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-bold bg-[#00694C] text-white rounded-xl hover:bg-[#085041] shadow-sm transition-colors whitespace-nowrap w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add {tab === "categories" ? "Category" : "SubCategory"}
        </button>
      </div>

      <DataTable
        columns={activeColumns}
        data={activeModel.data}
        loading={activeModel.loading}
        actions={actions}
        serverSide
        totalItems={activeModel.totalCount}
        currentPage={activeModel.params.page || 1}
        pageSize={PAGE_SIZE}
        onSearch={(q) => { activeModel.setSearch(q); activeModel.setPage(1); }}
        onPageChange={activeModel.setPage}
        onRowClick={(row) => setViewModal({ open: true, item: row, isSub: tab === "subcategories" })}
        searchable
        emptyMessage={`No ${tab} found`}
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: "create", item: null })} title={`${modal.mode === "edit" ? "Edit" : "Add"} ${tab === "categories" ? "Category" : "SubCategory"}`}>
        {tab === "categories" ? (
          <CategoryForm initial={modal.mode === "edit" ? modal.item : {}} onSubmit={handleSave} submitLabel={modal.mode === "edit" ? "Update" : "Create"} />
        ) : (
          <SubCategoryForm initial={modal.mode === "edit" ? modal.item : {}} categories={cats.data} onSubmit={handleSave} submitLabel={modal.mode === "edit" ? "Update" : "Create"} />
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, item: null, tab: null })} onConfirm={handleDelete} title={`Delete ${confirm.tab === "categories" ? "Category" : "SubCategory"}`} message={`Are you sure you want to delete "${confirm.item?.name}"? This action cannot be undone.`} />
      
      <CategoryViewModal open={viewModal.open} item={viewModal.item} isSub={viewModal.isSub} categories={cats.data} onClose={() => setViewModal({ open: false, item: null, isSub: false })} />
    </Container>
  );
}

