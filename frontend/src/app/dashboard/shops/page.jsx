"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import { shopsService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 10;

// Keys sent for edit — must only include writable fields
const EDIT_KEYS = ["name", "description", "contact_email", "contact_phone", "address", "is_active", "is_verified"];

const columns = [
  { key: "name", label: "Shop Name" },
  { key: "owner_name", label: "Owner", render: (_, row) => row.owner?.name || row.owner?.email || "—" },
  { key: "contact_email", label: "Email", render: (v) => v || "—" },
  { key: "is_active", label: "Active", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
  { key: "is_verified", label: "Verified", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-600"}`}>{v ? "Verified" : "Pending"}</span> },
  { key: "created_at", label: "Created", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const formFields = [
  { key: "name", label: "Shop Name", required: true, placeholder: "My Shop" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Shop description" },
  { key: "contact_email", label: "Contact Email", placeholder: "shop@example.com" },
  { key: "contact_phone", label: "Contact Phone", placeholder: "+880..." },
  { key: "address", label: "Address", placeholder: "Shop address" },
  { key: "is_active", label: "Active", type: "select", required: true, options: [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ]},
  { key: "is_verified", label: "Verified", type: "select", options: [
    { value: "true", label: "Verified" },
    { value: "false", label: "Unverified" },
  ]},
];

export default function ShopsPage() {
  const toast = useToastContext();
  const { data, totalCount, loading, params, setSearch, setPage, create, patch, remove, mutate } = useModel(shopsService, { defaultParams: { page_size: PAGE_SIZE, page: 1 } });
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (values) => {
    try {
      const payload = { ...values, is_active: values.is_active === "true", is_verified: values.is_verified === "true" };
      await create(payload);
      toast.success("Shop created successfully");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err?.message || "Failed to create shop");
    }
  };

  const handleEdit = async (values) => {
    try {
      // Only send writable fields — avoids sending owner object, slug, etc. which cause 400 errors
      const payload = {};
      EDIT_KEYS.forEach((k) => { payload[k] = values[k]; });
      payload.is_active = values.is_active === "true";
      payload.is_verified = values.is_verified === "true";
      await patch(editItem.slug, payload);
      toast.success("Shop updated successfully");
      setEditItem(null);
    } catch (err) {
      toast.error(err?.message || "Failed to update shop");
    }
  };

  const handleToggleActive = async (row) => {
    try {
      await patch(row.slug, { is_active: !row.is_active });
      toast.success(`Shop ${!row.is_active ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await remove(deleteItem.slug);
      toast.success("Shop deleted successfully");
      setDeleteItem(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete shop");
    }
  };

  return (
    <Container title="Shops" description="Manage vendor storefronts">
      <div className="flex justify-end mb-3">
        <button style={{cursor: 'pointer'}} onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">
          <Plus className="w-4 h-4" /> Add Shop
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        serverSide
        totalItems={totalCount}
        currentPage={params.page}
        pageSize={PAGE_SIZE}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        loading={loading}
        searchable
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button style={{cursor: 'pointer'}}
              onClick={() => handleToggleActive(row)}
              title={row.is_active ? "Deactivate" : "Activate"}
              className={`p-1.5 rounded transition-colors ${row.is_active ? "text-green-500 hover:text-green-700 hover:bg-green-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
            >
              {row.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </button>
            <button style={{cursor: 'pointer'}} onClick={() => setViewItem(row)} className="db-icon-btn"><Eye className="w-3.5 h-3.5" /></button>
            <button style={{cursor: 'pointer'}} onClick={() => setEditItem(row)} className="db-icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
            <button style={{cursor: 'pointer'}} onClick={() => setDeleteItem(row)} className="db-icon-btn danger"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Shop">
        <FormModal fields={formFields} onSubmit={handleCreate} submitLabel="Create Shop" />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Shop">
        {editItem && <FormModal
          fields={formFields}
          initialValues={Object.fromEntries(EDIT_KEYS.map(k => [k, k === "is_active" || k === "is_verified" ? String(editItem[k]) : (editItem[k] ?? "")]))}
          onSubmit={handleEdit}
          submitLabel="Save Changes"
        />}
      </Modal>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Shop Details">
        {viewItem && (
          <div className="flex flex-col gap-5 p-1">
            {/* Header: Shop Name & Status Badges */}
            <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{viewItem.name}</h3>
              <div className="flex gap-2">
                <span className={`px-3 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider ${viewItem.is_active ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-rose-100 text-rose-700 border border-rose-200"}`}>{viewItem.is_active ? "Active" : "Inactive"}</span>
                <span className={`px-3 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider ${viewItem.is_verified ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-slate-200 text-slate-600 border border-slate-300"}`}>{viewItem.is_verified ? "Verified" : "Unverified"}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Owner</span>
                <span className="text-sm font-semibold text-slate-700">{viewItem.owner?.name || viewItem.owner?.email || "-"}</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Email</span>
                <span className="text-sm font-semibold text-slate-700 break-all">{viewItem.contact_email || "-"}</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</span>
                <span className="text-sm font-semibold text-slate-700">{viewItem.contact_phone || "-"}</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created At</span>
                <span className="text-sm font-semibold text-slate-700">{viewItem.created_at ? new Date(viewItem.created_at).toLocaleDateString() : "-"}</span>
              </div>
              <div className="sm:col-span-2 p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</span>
                <span className="text-sm font-semibold text-slate-700">{viewItem.address || "-"}</span>
              </div>
              <div className="sm:col-span-2 p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</span>
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{viewItem.description || "-"}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Delete Shop" message={`Are you sure you want to delete "${deleteItem?.name}"?`} />
    </Container>
  );
}

