"use client";

import { useState, useRef } from "react";
import { Plus, Eye, Pencil, Trash2, Camera } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import { adminUsersApi } from "@/app/dashboard/_lib/auth";
import api from "@/app/dashboard/_lib/api";

const PAGE_SIZE = 20;

const FILTERS = [
  { label: "All",        value: "" },
  { label: "Customers",  value: "CUSTOMER" },
  { label: "Wholesale",  value: "WHOLESALE" },
  { label: "Sellers",    value: "SELLER" },
  { label: "Admins",     value: "ADMIN" },
];

function RoleBadge({ value }) {
  const map = {
    ADMIN:     "bg-purple-100 text-purple-700",
    SELLER:    "bg-blue-100 text-blue-700",
    WHOLESALE: "bg-emerald-100 text-emerald-700",
    VENDOR:    "bg-amber-100 text-amber-700",
    CUSTOMER:  "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[value] || map.CUSTOMER}`}>
      {value || "CUSTOMER"}
    </span>
  );
}

function WholesaleStatusBadge({ value }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const map = {
    approved:  "bg-green-100 text-green-700",
    pending:   "bg-amber-100 text-amber-700",
    rejected:  "bg-red-100 text-red-700",
    suspended: "bg-slate-100 text-slate-600",
  };
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[value.toLowerCase()] || map.pending}`}>
      {label}
    </span>
  );
}

const columns = [
  { key: "id",               label: "ID",        render: (v) => <span className="text-xs text-slate-400">{String(v).startsWith('ws_') ? `WS-${v.replace('ws_','')}` : v}</span> },
  { key: "photo",            label: "Profile Photo", render: (v, row) => (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
      {v ? (
        <img src={v} alt={row.name || "User"} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-slate-500">{(row.name || row.email || "U").charAt(0).toUpperCase()}</span>
      )}
    </div>
  )},
  { key: "name",             label: "Name" },
  { key: "email",            label: "Email" },
  { key: "user_type",        label: "Role",      render: (v) => <RoleBadge value={v} /> },
  { key: "business_name",    label: "Business",  render: (v) => v || <span className="text-slate-400">—</span> },
  { key: "is_active",        label: "Status",    render: (v, row) => {
    if (row.user_type === 'WHOLESALE' || row.user_type === 'WHOLESALER') {
      return <WholesaleStatusBadge value={row.wholesale_status || 'pending'} />;
    }
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
        {v ? "Active" : "Inactive"}
      </span>
    );
  }},
  { key: "date_joined", label: "Joined", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const editFields = [
  { key: "name", label: "Full Name", required: true, placeholder: "John Doe" },
  { key: "user_type", label: "Role", type: "select", required: true, options: [
    { value: "CUSTOMER", label: "Customer" },
    { value: "WHOLESALE", label: "Wholesaler" },
    { value: "SELLER",   label: "Seller" },
    { value: "VENDOR",   label: "Vendor" },
    { value: "ADMIN",    label: "Admin" },
  ]},
  { key: "is_active", label: "Status", type: "select", required: true, options: [
    { value: "true",  label: "Active" },
    { value: "false", label: "Inactive" },
  ]},
];

const wholesaleEditFields = [
  ...editFields,
  { key: "wholesale_status", label: "Wholesale Status", type: "select", options: [
    { value: "pending",  label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ]},
]

const createFields = [
  { key: "email",     label: "Email",     required: true, placeholder: "user@example.com" },
  { key: "name",      label: "Full Name", required: true, placeholder: "John Doe" },
  { key: "password",  label: "Password",  required: true, placeholder: "Min 8 characters", type: "password" },
  { key: "user_type", label: "Role", type: "select", required: true, options: [
    { value: "CUSTOMER", label: "Customer" },
    { value: "SELLER",   label: "Seller" },
    { value: "VENDOR",   label: "Vendor" },
    { value: "ADMIN",    label: "Admin" },
  ]},
];


export default function UsersPage() {
  const toast = useToastContext();
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [activeFilter, setFilter]   = useState("");
  const [viewItem, setViewItem]     = useState(null);
  const [editItem, setEditItem]     = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const { data: rawData, isLoading, mutate } = useSWR(
    ["admin-users", page, search, activeFilter],
    () => adminUsersApi.list({
      page,
      page_size: PAGE_SIZE,
      search: search || undefined,
      user_type: activeFilter || undefined,
    }),
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  // Filter client-side too (since API may not support user_type param yet)
  const rawList = rawData?.results || rawData?.users || (Array.isArray(rawData) ? rawData : []);
  const data = activeFilter
    ? rawList.filter(u => u.user_type === activeFilter)
    : rawList;
  const totalCount = data.length;

  const handleCreate = async (values) => {
    try {
      await api.post("/api/auth/admin/users/", values);
      toast.success("User created successfully");
      setCreateOpen(false);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to create user");
    }
  };

  const handleEdit = async (values) => {
  try {
    const payload = {
      ...values,
      is_active: values.is_active === "true",
    }
    await api.patch(`/api/auth/admin/users/${editItem.id}/`, payload)
    toast.success("User updated")
    setEditItem(null)
    mutate()
  } catch (err) {
    toast.error(err?.message || "Failed to update user")
  }
}

  const handleDelete = async () => {
    try {
      await api.delete(`/api/auth/admin/users/${deleteItem.id}/`);
      toast.success("User deleted");
      setDeleteItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to delete user");
    }
  };

  const handleApproveWholesale = async (row) => {
    try {
      await api.patch(`/api/auth/admin/users/${row.id}/`, {
        wholesale_status: 'approved',
      })
      toast.success(`${row.name} approved as wholesaler`)
      mutate()
    } catch (err) {
      toast.error(err?.message || 'Failed to approve wholesaler')
    }
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !viewItem) return;

    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      setIsUploadingImage(true);
      const res = await api.patch(`/api/auth/admin/users/${viewItem.id}/`, formData);
      toast.success("Profile image updated successfully");
      setViewItem(res.data); // Update modal view
      mutate(); // Update table
    } catch (err) {
      toast.error(err?.message || "Failed to update profile image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Container title="Users" description="Manage user accounts — normal, wholesale, and admin">

      <div className="db-filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`db-filter-pill${activeFilter === f.value ? " active" : ""}`}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => setCreateOpen(true)}
            className="db-btn-primary"
          >
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        serverSide
        totalItems={totalCount}
        currentPage={page}
        pageSize={PAGE_SIZE}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        loading={isLoading}
        searchable
        actions={(row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setViewItem(row)} className="db-icon-btn" title="View"><Eye size={14} /></button>
          <button onClick={() => setEditItem({ ...row, is_active: String(row.is_active), wholesale_status: row.wholesale_status || 'pending' })} className="db-icon-btn" title="Edit"><Pencil size={14} /></button>
          {row.user_type === 'WHOLESALE' && row.wholesale_status === 'pending' && (
            <button onClick={() => handleApproveWholesale(row)} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "7px", background: "#22c55e", color: "white", border: "none", cursor: "pointer" }}>Approve</button>
          )}
          <button onClick={() => setDeleteItem(row)} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
        </div>
      )}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create User">
        <FormModal fields={createFields} onSubmit={handleCreate} submitLabel="Create User" />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit User">
  {editItem && (
    <FormModal
      fields={editItem.user_type === 'WHOLESALE' ? wholesaleEditFields : editFields}
      initialValues={editItem}
      onSubmit={handleEdit}
      submitLabel="Save Changes"
    />
  )}
</Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="User Profile">
        {viewItem && (
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-6 relative">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg shrink-0 relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {viewItem.profile_image || viewItem.photo ? (
                  <img src={viewItem.profile_image || viewItem.photo} alt={viewItem.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-semibold text-slate-400">{(viewItem.name || viewItem.email || "U").charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <h3 className="mt-3 text-lg font-bold text-slate-800">{viewItem.name}</h3>
              <p className="text-sm text-slate-500">{viewItem.email}</p>
              <div className="mt-2 flex gap-2">
                <RoleBadge value={viewItem.user_type} />
                {viewItem.user_type === 'WHOLESALE' && <WholesaleStatusBadge value={viewItem.wholesale_status} />}
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Details</h4>
              {[
                { label: "Status", val: viewItem.is_active ? <span className="text-emerald-600 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Active</span> : <span className="text-slate-500 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span>Inactive</span> },
                { label: "Joined Date", val: viewItem.date_joined ? new Date(viewItem.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "—" },
                ...(viewItem.user_type === 'WHOLESALE' ? [
                  { label: "Business Name", val: viewItem.business_name || "—" },
                  { label: "Business Type", val: viewItem.business_type || "—" }
                ] : []),
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-800">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Delete "${deleteItem?.name || deleteItem?.email}"? This cannot be undone.`}
      />
    </Container>
  );
}
