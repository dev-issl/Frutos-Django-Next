"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Ruler } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import { displayUnitsService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 20;

const inp = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

/* ─── Display Unit Form ─────────────────────────────────────────────── */
function DisplayUnitForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [name, setName] = useState(initial.name || "");
  const [abbreviation, setAbbreviation] = useState(initial.abbreviation || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), abbreviation: abbreviation.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={lbl}>Name *</label>
        <input required className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g., KILO (KILO)" />
      </div>
      <div>
        <label className={lbl}>Abbreviation (Optional)</label>
        <input className={inp} value={abbreviation} onChange={e => setAbbreviation(e.target.value)} placeholder="e.g., KG" />
      </div>
      <div className="flex justify-end pt-1">
        <button type="submit" disabled={submitting || !name.trim()} className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function DisplayUnitsPage() {
  const toast = useToastContext();
  const { data, loading, totalCount, params, setSearch, setPage, create, update, remove } = useModel(displayUnitsService, {
    defaultParams: { page: 1, page_size: PAGE_SIZE },
    onSuccess: (msg) => toast.success(msg),
    onError: (err) => toast.error(err?.message || "Operation failed"),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const columns = [
    { key: "name", label: "Unit Name", render: (v) => <span className="font-medium text-slate-900">{v}</span> },
    { key: "abbreviation", label: "Abbreviation", render: (v) => v ? <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border">{v}</span> : "—" },
    { key: "created_at", label: "Created At", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    {
      key: "actions", label: "Actions", sortable: false, align: "right", render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setEditItem(row)} className="p-1.5 text-slate-400 hover:text-[#00694C] hover:bg-teal-50 rounded transition-colors cursor-pointer"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleteItem(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <Container
      title="Display Units"
      description="Manage measurement units for your products"
      actions={
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 bg-[#00694C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#085041] transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> Add Unit
        </button>
      }
    >
      <DataTable
        columns={columns}
        data={data}
        serverSide
        totalItems={totalCount}
        currentPage={params.page || 1}
        pageSize={PAGE_SIZE}
        onSearch={setSearch}
        onPageChange={setPage}
        loading={loading}
        searchable
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Display Unit">
        <DisplayUnitForm onSubmit={async (p) => { await create(p); setCreateOpen(false); }} submitLabel="Create Unit" />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Display Unit">
        <DisplayUnitForm initial={editItem || {}} onSubmit={async (p) => { await update(editItem.id, p); setEditItem(null); }} submitLabel="Save Changes" />
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        title="Delete Unit"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive={true}
        onConfirm={async () => { await remove(deleteItem.id); setDeleteItem(null); }}
        onClose={() => setDeleteItem(null)}
      />
    </Container>
  );
}
