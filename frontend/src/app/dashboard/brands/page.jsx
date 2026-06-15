"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, X, Palette, Ruler, Image as ImageIcon } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { brandsService, colorsService, sizesService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 20;
const TABS = [
  { id: "brands", label: "Brands" },
  { id: "colors", label: "Colors" },
  { id: "sizes", label: "Sizes" },
];

const inp = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

/* ─── Brand Form ─────────────────────────────────────────────── */
function BrandForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [description, setDescription] = useState(initial.description || "");
  const [website, setWebsite] = useState(initial.website || "");
  const [isActive, setIsActive] = useState(String(initial.is_active ?? true));
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(initial.logo_url || "");
  const [submitting, setSubmitting] = useState(false);

  const handleLogo = (e) => {
    const f = e.target.files?.[0];
    if (f) { setLogo(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      if (slug) fd.append("slug", slug);
      if (description) fd.append("description", description);
      if (website) fd.append("website", website);
      fd.append("is_active", isActive === "true");
      if (logo) fd.append("logo", logo);
      await onSubmit(fd);
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>Brand Name *</label><input required className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Samsung" /></div>
        <div><label className={lbl}>Slug</label><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" /></div>
        <div><label className={lbl}>Website</label><input type="url" className={inp} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://brand.com" /></div>
        <div>
          <label className={lbl}>Status</label>
          <SearchableSelect
            value={isActive}
            onChange={setIsActive}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
        </div>
      </div>
      <div><label className={lbl}>Description</label><textarea rows={2} className={inp + " resize-none"} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brand description..." /></div>
      <div>
        <label className={lbl}>Logo</label>
        <div className="flex items-center gap-3">
          {preview && (
            <div className="relative w-16 h-16">
              <img src={preview} alt="" className="w-16 h-16 rounded object-cover border" />
              <button type="button" onClick={() => { setLogo(null); setPreview(""); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
            </div>
          )}
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-slate-50">
            <Upload className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Upload</span>
            <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
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

/* ─── Color Form ─────────────────────────────────────────────── */
function ColorForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [hexCode, setHexCode] = useState(initial.hex_code || "#000000");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit({ name, hex_code: hexCode }); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>Color Name *</label><input required className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Midnight Blue" /></div>
        <div>
          <label className={lbl}>Hex Code *</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={hexCode} onChange={e => setHexCode(e.target.value)} className="w-10 h-10 p-0.5 border border-gray-300 rounded cursor-pointer" />
            <input required className={inp} value={hexCode} onChange={e => setHexCode(e.target.value)} placeholder="#000000" pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" />
          </div>
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

/* ─── Size Form ──────────────────────────────────────────────── */
function SizeForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit({ name }); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className={lbl}>Size Name *</label><input required className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., XL, 42, Large" /></div>
      <div className="flex justify-end pt-1">
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function BrandsPage() {
  const toast = useToastContext();
  const [tab, setTab] = useState("brands");
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [confirm, setConfirm] = useState({ open: false, item: null, tab: null });

  const brands = useModel(brandsService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const colors = useModel(colorsService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const sizes = useModel(sizesService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const brandColumns = [
    { key: "logo_url", label: "", sortable: false, render: (v) => v ? <img src={v} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /></div> },
    { key: "name", label: "Name" },
    { key: "slug", label: "Slug" },
    { key: "website", label: "Website", render: (v) => v ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs truncate max-w-[150px] inline-block hover:underline">{v.replace(/^https?:\/\//, "")}</a> : "—" },
    { key: "is_active", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
  ];

  const colorColumns = [
    { key: "hex_code", label: "", sortable: false, render: (v) => <div className="w-7 h-7 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: v }} /> },
    { key: "name", label: "Name" },
    { key: "hex_code", label: "Hex Code", render: (v) => <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{v}</code> },
  ];

  const sizeColumns = [
    { key: "name", label: "Size Name" },
  ];

  const getModel = () => tab === "brands" ? brands : tab === "colors" ? colors : sizes;
  const getColumns = () => tab === "brands" ? brandColumns : tab === "colors" ? colorColumns : sizeColumns;
  const getLabel = () => tab === "brands" ? "Brand" : tab === "colors" ? "Color" : "Size";

  const handleSave = async (data) => {
    const model = getModel();
    if (modal.mode === "edit") {
      const id = tab === "brands" ? modal.item.slug : modal.item.id;
      await model.update(id, data);
    } else {
      await model.create(data);
    }
  };

  const handleDelete = async () => {
    try {
      const model = confirm.tab === "brands" ? brands : confirm.tab === "colors" ? colors : sizes;
      const id = confirm.tab === "brands" ? confirm.item.slug : confirm.item.id;
      await model.remove(id);
      setConfirm({ open: false, item: null, tab: null });
    } catch (_) {
      // Error toast already fired by model hook's onError
    }
  };

  const actions = (row) => (
    <div className="flex items-center gap-1">
      <button onClick={() => setModal({ open: true, mode: "edit", item: row })} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={() => setConfirm({ open: true, item: row, tab })} className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );

  const renderForm = () => {
    const initial = modal.mode === "edit" ? modal.item : {};
    const label = modal.mode === "edit" ? "Update" : "Create";
    if (tab === "brands") return <BrandForm initial={initial} onSubmit={handleSave} submitLabel={label} />;
    if (tab === "colors") return <ColorForm initial={initial} onSubmit={handleSave} submitLabel={label} />;
    return <SizeForm initial={initial} onSubmit={handleSave} submitLabel={label} />;
  };

  return (
    <Container title="Brands & Attributes" description="Manage product brands, colors, and sizes">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setModal({ open: false, mode: "create", item: null }); setConfirm({ open: false, item: null, tab: null }); }} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === t.id ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
        <button onClick={() => setModal({ open: true, mode: "create", item: null })} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041]">
          <Plus className="w-3.5 h-3.5" /> Add {getLabel()}
        </button>
      </div>

      <DataTable
        key={tab}
        columns={getColumns()}
        data={getModel().data}
        loading={getModel().loading}
        actions={actions}
        serverSide
        totalItems={getModel().totalCount}
        currentPage={getModel().params.page || 1}
        pageSize={PAGE_SIZE}
        onSearch={(q) => { getModel().setSearch(q); getModel().setPage(1); }}
        onPageChange={getModel().setPage}
        searchable
        emptyMessage={`No ${tab} found`}
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: "create", item: null })} title={`${modal.mode === "edit" ? "Edit" : "Add"} ${getLabel()}`}>
        {renderForm()}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, item: null, tab: null })} onConfirm={handleDelete} title={`Delete ${confirm.tab === "brands" ? "Brand" : confirm.tab === "colors" ? "Color" : "Size"}`} message={`Are you sure you want to delete "${confirm.item?.name}"? This action cannot be undone.`} />
    </Container>
  );
}

