"use client";

import { useState } from "react";
import { Plus, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";

const PAGE_SIZE = 20;

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name", render: (v, row) => row.user?.name },
  { key: "email", label: "Email", render: (v, row) => row.user?.email },
  { key: "role", label: "Role", render: (v) => <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700">{v || "Staff"}</span> },
  { key: "branch_location", label: "Branch", render: (v) => v || <span className="text-slate-400">—</span> },
  { key: "phone", label: "Phone", render: (v) => v || <span className="text-slate-400">—</span> },
  { key: "hire_date", label: "Hire Date", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const createFields = [
  { key: "name", label: "Full Name", required: true, placeholder: "John Doe" },
  { key: "email", label: "Email", required: true, placeholder: "staff@example.com" },
  { key: "password", label: "Secret Key / Password", required: true, placeholder: "Min 8 characters", type: "password" },
  { key: "role", label: "Role", required: true, placeholder: "e.g. Sales Associate, Packager" },
  { key: "branch_location", label: "Branch Location", placeholder: "e.g. Móstoles Centro Branch" },
  { key: "phone", label: "Phone Number", placeholder: "Optional" },
];

export default function StaffPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const { data: rawData, isLoading, mutate } = useSWR(
    ["admin-staff", page],
    () => api.get(`/api/staff/admin/employees/?page=${page}&page_size=${PAGE_SIZE}`),
    { revalidateOnFocus: false }
  );

  const data = rawData?.results || (Array.isArray(rawData) ? rawData : []);
  const totalCount = rawData?.count || data.length;

  const handleCreate = async (values) => {
    try {
      await api.post("/api/staff/admin/employees/", values);
      toast.success("Staff member created successfully");
      setCreateOpen(false);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to create staff member");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/staff/admin/employees/${deleteItem.id}/`);
      toast.success("Staff member deleted");
      setDeleteItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to delete staff member");
    }
  };

  return (
    <Container title="Staff Management" description="Manage your staff, their roles, and branch locations">
      <div className="db-filter-bar flex justify-end mb-4">
        <button onClick={() => setCreateOpen(true)} className="db-btn-primary">
          <Plus size={15} /> Add New Staff
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        totalItems={totalCount}
        currentPage={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        loading={isLoading}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => router.push(`/dashboard/staff/${row.id}`)} className="db-icon-btn" title="View Details">
              <Eye size={14} />
            </button>
            <button onClick={() => setDeleteItem(row)} className="db-icon-btn danger" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Staff">
        <FormModal fields={createFields} onSubmit={handleCreate} submitLabel="Create Staff" />
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Staff"
        message={`Delete "${deleteItem?.user?.name}"? This cannot be undone and will remove all their shifts and tasks.`}
      />
    </Container>
  );
}
