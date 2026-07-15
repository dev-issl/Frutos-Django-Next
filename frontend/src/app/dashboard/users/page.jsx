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
import api, { API_BASE_URL } from "@/app/dashboard/_lib/api";

const PAGE_SIZE = 20;

const FILTERS = [
  { label: "All",        value: "" },
  { label: "Customers",  value: "CUSTOMER" },
  { label: "Wholesale",  value: "WHOLESALE" },
  { label: "Sellers",    value: "SELLER" },
  { label: "Admins",     value: "ADMIN" },
  { label: "Staff",      value: "STAFF" },
];

function RoleBadge({ value }) {
  const map = {
    ADMIN:     "bg-purple-100 text-purple-700",
    SELLER:    "bg-blue-100 text-blue-700",
    WHOLESALE: "bg-emerald-100 text-emerald-700",
    VENDOR:    "bg-amber-100 text-amber-700",
    CUSTOMER:  "bg-slate-100 text-slate-600",
    STAFF:     "bg-teal-100 text-teal-700",
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

  const columns = [
    { key: "photo", label: "Photo", render: (v, row) => {
      let imgUrl = row.profile_image || row.photo || v;
      if (imgUrl && imgUrl.startsWith('/')) {
        imgUrl = `${API_BASE_URL}${imgUrl}`;
      }
      return (
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
        {imgUrl ? (
          <img src={imgUrl} alt={row.name || "User"} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-slate-500">{(row.name || row.email || "U").charAt(0).toUpperCase()}</span>
        )}
      </div>
      );
    }},
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "user_type", label: "Role", render: (v) => <RoleBadge value={v} /> },
    { key: "business_name", label: "Business", render: (v) => v || <span className="text-slate-400">—</span> },
    { key: "is_active", label: "Status", render: (v, row) => {
      if (row.user_type === 'WHOLESALE' || row.user_type === 'WHOLESALER') {
        return <WholesaleStatusBadge value={row.wholesale_status || 'pending'} />;
      }
      return (
        <span className={`px-2 py-0.5 text-xs rounded-full font-bold tracking-wide ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {v ? "Active" : "Inactive"}
        </span>
      );
    }},
    { key: "date_joined", label: "Joined", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

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
        onRowClick={(row) => setViewItem(row)}
        actions={(row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setViewItem(row); }} className="db-icon-btn" title="View"><Eye size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditItem({ ...row, is_active: String(row.is_active), wholesale_status: row.wholesale_status || 'pending' }); }} className="db-icon-btn" title="Edit"><Pencil size={14} /></button>
          {row.user_type === 'WHOLESALE' && row.wholesale_status === 'pending' && (
            <button onClick={(e) => { e.stopPropagation(); handleApproveWholesale(row); }} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "7px", background: "#22c55e", color: "white", border: "none", cursor: "pointer" }}>Approve</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setDeleteItem(row); }} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
        </div>
      )}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create User" maxWidth="max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleCreate(Object.fromEntries(fd)); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label><input required name="name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="John Doe" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email *</label><input required name="email" type="email" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="user@example.com" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password *</label><input required name="password" type="password" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="Min 8 chars" /></div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role *</label>
              <select name="user_type" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none">
                <option value="CUSTOMER">Customer</option>
                <option value="SELLER">Seller</option>
                <option value="VENDOR">Vendor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button style={{cursor: 'pointer'}} type="submit" className="px-5 py-2 text-sm font-bold bg-[#00694C] text-white rounded-lg hover:bg-[#085041] transition-colors shadow-sm">CREATE USER</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit User" maxWidth="max-w-2xl">
        {editItem && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleEdit(Object.fromEntries(fd)); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label><input required name="name" defaultValue={editItem.name} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" /></div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role *</label>
                <select name="user_type" defaultValue={editItem.user_type} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none">
                  <option value="CUSTOMER">Customer</option>
                  <option value="WHOLESALE">Wholesaler</option>
                  <option value="SELLER">Seller</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status *</label>
                <select name="is_active" defaultValue={String(editItem.is_active)} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              {editItem.user_type === 'WHOLESALE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Wholesale Status *</label>
                  <select name="wholesale_status" defaultValue={editItem.wholesale_status || 'pending'} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button style={{cursor: 'pointer'}} type="submit" className="px-5 py-2 text-sm font-bold bg-[#00694C] text-white rounded-lg hover:bg-[#085041] transition-colors shadow-sm">SAVE CHANGES</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="User Profile" maxWidth="max-w-md">
        {viewItem && (
          <div className="flex flex-col">
            {/* Header / ID Section */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4 relative overflow-hidden">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <div 
                className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center border border-slate-200 shadow-sm shrink-0 relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {(() => {
                  let img = viewItem.profile_image || viewItem.photo;
                  if (img && img.startsWith('/')) img = `${API_BASE_URL}${img}`;
                  return img ? (
                    <img src={img} alt={viewItem.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-slate-400">{(viewItem.name || viewItem.email || "U").charAt(0).toUpperCase()}</span>
                  );
                })()}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} className="text-white" />
                </div>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#00694C] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-lg font-black text-slate-800 truncate leading-tight">{viewItem.name}</h3>
                <p className="text-sm font-medium text-slate-500 truncate mb-2">{viewItem.email}</p>
                <div className="flex flex-wrap gap-2">
                  <RoleBadge value={viewItem.user_type} />
                  {viewItem.user_type === 'WHOLESALE' && <WholesaleStatusBadge value={viewItem.wholesale_status} />}
                </div>
              </div>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${viewItem.is_active ? 'bg-emerald-500' : 'bg-slate-300'} shadow-sm`}></span>
                  {viewItem.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
                <p className="text-sm font-bold text-slate-800">{viewItem.date_joined ? new Date(viewItem.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}</p>
              </div>
              
              {viewItem.user_type === 'WHOLESALE' && (
                <>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Name</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{viewItem.business_name || "—"}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Type</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{viewItem.business_type || "—"}</p>
                  </div>
                </>
              )}
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
