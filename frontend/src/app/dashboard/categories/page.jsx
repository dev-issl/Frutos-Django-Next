"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, ChevronRight } from "lucide-react";
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

const inp = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

/* ─── Category Form ──────────────────────────────────────────── */
function CategoryForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(initial.image_url || "");
  const [submitting, setSubmitting] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>Category Name *</label><input required className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Electronics" /></div>
        <div><label className={lbl}>Slug</label><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" /></div>
      </div>
      <div>
        <label className={lbl}>Image</label>
        <div className="flex items-center gap-3">
          {preview && (
            <div className="relative w-16 h-16">
              <img src={preview} alt="" className="w-16 h-16 rounded object-cover border" />
              <button type="button" onClick={() => { setImage(null); setPreview(""); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
            </div>
          )}
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-slate-50">
            <Upload className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Upload</span>
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ─── SubCategory Form ───────────────────────────────────────── */
function SubCategoryForm({ initial = {}, categories = [], onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [category, setCategory] = useState(initial.category?.id || initial.category || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(initial.image_url || "");
  const [submitting, setSubmitting] = useState(false);

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
      fd.append("category", category);
      if (slug) fd.append("slug", slug);
      if (image) fd.append("image", image);
      await onSubmit(fd);
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>SubCategory Name *</label><input required className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Smartphones" /></div>
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
        <div><label className={lbl}>Slug</label><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" /></div>
      </div>
      <div>
        <label className={lbl}>Image</label>
        <div className="flex items-center gap-3">
          {preview && (
            <div className="relative w-16 h-16">
              <img src={preview} alt="" className="w-16 h-16 rounded object-cover border" />
              <button type="button" onClick={() => { setImage(null); setPreview(""); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
            </div>
          )}
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-slate-50">
            <Upload className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Upload</span>
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50">
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
    { key: "image_url", label: "", sortable: false, render: (v) => v ? <img src={v} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /></div> },
    { key: "name", label: "Name" },
    { key: "slug", label: "Slug" },
    { key: "sub_category_count", label: "SubCategories", render: (v) => v ?? 0 },
    { key: "total_products", label: "Products", render: (v) => v ?? 0 },
  ];

  const subColumns = [
    { key: "image_url", label: "", sortable: false, render: (v) => v ? <img src={v} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /></div> },
    { key: "name", label: "Name" },
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
      <button onClick={() => setModal({ open: true, mode: "edit", item: row })} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={() => setConfirm({ open: true, item: row, tab })} className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <Container title="Categories" description="Manage product categories and sub-categories">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === t.id ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
        <button onClick={() => setModal({ open: true, mode: "create", item: null })} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041]">
          <Plus className="w-3.5 h-3.5" /> Add {tab === "categories" ? "Category" : "SubCategory"}
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
    </Container>
  );
}

