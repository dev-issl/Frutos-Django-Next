"use client";

import { useState, useRef } from "react";
import { Plus, Eye, EyeOff, Pencil, Trash2, Camera, Copy, Check, Sparkles } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import { adminUsersApi } from "@/app/dashboard/_lib/auth";
import api, { API_BASE_URL } from "@/app/dashboard/_lib/api";

const PAGE_SIZE = 20;

const FILTERS = [
  { label: "All", value: "" },
  { label: "Customers", value: "CUSTOMER" },
  { label: "Internal Wholesale", value: "WHOLESALER" },
  { label: "External Wholesale", value: "RESTAURANT" },
  { label: "Admins", value: "ADMIN" },
];

// Role display labels
const ROLE_LABELS = {
  CUSTOMER:   "Customer",
  WHOLESALER: "Internal Wholesale",
  RESTAURANT: "External Wholesale",
  ADMIN:      "Admin",
  STAFF:      "Staff",
  SELLER:     "Seller",
  VENDOR:     "Vendor",
  WHOLESALE:  "Wholesale",  // legacy fallback
};

function RoleBadge({ value }) {
  const styles = {
    ADMIN:      "bg-purple-100 text-purple-700",
    SELLER:     "bg-blue-100 text-blue-700",
    WHOLESALE:  "bg-emerald-100 text-emerald-700",
    WHOLESALER: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
    RESTAURANT: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
    VENDOR:     "bg-amber-100 text-amber-700",
    CUSTOMER:   "bg-slate-100 text-slate-600",
    STAFF:      "bg-teal-100 text-teal-700",
  };
  const label = ROLE_LABELS[value] || value || "Customer";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-semibold ${styles[value] || styles.CUSTOMER}`}>
      {label}
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

// Wholesale user types (both internal and external)
const WHOLESALE_TYPES = ["WHOLESALER", "RESTAURANT", "WHOLESALE"];

const createFields = [
  { key: "email",     label: "Email",     required: true, placeholder: "user@example.com" },
  { key: "name",      label: "Full Name", required: true, placeholder: "John Doe" },
  { key: "password",  label: "Password",  required: true, placeholder: "Min 8 characters", type: "password" },
  { key: "user_type", label: "Role", type: "select", required: true, options: [
    { value: "CUSTOMER", label: "Customer" },
    { value: "WHOLESALE", label: "Wholesaler" },
    { value: "RESTAURANT", label: "Restaurant" },
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
  const [viewItem, setViewItem]         = useState(null);
  const [showWholesaleId, setShowWholesaleId] = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [editWholesaleId, setEditWholesaleId] = useState("");
  const [isGeneratingId, setIsGeneratingId]   = useState(false);
  const [createOpen, setCreateOpen]     = useState(false);
  const [createUserType, setCreateUserType] = useState('CUSTOMER');
  const [deleteItem, setDeleteItem]     = useState(null);
  const [copiedId, setCopiedId]         = useState(null);

  const handleCopyId = (wid) => {
    if (!wid) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wid).catch(() => {});
    }
    setCopiedId(wid);
    toast.success(`Copied Wholesale ID "${wid}"`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGenerateWholesaleId = async () => {
    try {
      setIsGeneratingId(true);
      const res = await api.get("/api/auth/admin/users/generate-wholesale-id/");
      const generated = res?.wholesale_id || res?.data?.wholesale_id;
      if (generated) {
        setEditWholesaleId(generated);
        toast.success(`Suggested ID: ${generated}`);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to generate ID");
    } finally {
      setIsGeneratingId(false);
    }
  };

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
    { key: "name", label: "Name", render: (v, row) => (
      <div>
        <p className="font-semibold text-slate-800">{v}</p>
        {row.business_name && (
          <span className="text-xs text-slate-400 block">{row.business_name}</span>
        )}
      </div>
    )},
    { key: "email", label: "Email" },
    { key: "user_type", label: "Role", render: (v) => <RoleBadge value={v} /> },
    { key: "business_name", label: "Business", render: (v) => v || <span className="text-slate-400">—</span> },
    { key: "is_active", label: "Status", render: (v, row) => {
      if (WHOLESALE_TYPES.includes(row.user_type)) {
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

  // Filter client-side: handle both legacy WHOLESALE and new WHOLESALER/RESTAURANT
  const rawList = rawData?.results || rawData?.users || (Array.isArray(rawData) ? rawData : []);
  const data = activeFilter
    ? rawList.filter(u => {
        if (activeFilter === "WHOLESALER") return u.user_type === "WHOLESALER" || u.user_type === "WHOLESALE";
        return u.user_type === activeFilter;
      })
    : rawList;
  const totalCount = data.length;

  const handleCreate = async (values) => {
    try {
      const res = await api.post("/api/auth/admin/users/", values);
      const createdUser = res?.data || res;
      toast.success(
        createdUser?.wholesale_id
          ? `Wholesale user created! ID: ${createdUser.wholesale_id}`
          : "User created successfully"
      );
      setCreateOpen(false);
      mutate();
      if (createdUser && WHOLESALE_TYPES.includes(createdUser.user_type)) {
        setViewItem(createdUser);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to create user");
    }
  };

  const handleEdit = async (values) => {
    try {
      const payload = {
        ...values,
        is_active: values.is_active === "true",
      };
      await api.patch(`/api/auth/admin/users/${editItem.id}/`, payload);
      toast.success("User updated successfully");
      setEditItem(null);
      setEditWholesaleId("");
      mutate();
    } catch (err) {
      toast.error(err?.message || err?.detail || "Failed to update user");
    }
  };

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
      });
      toast.success(`${row.name} approved! You can now edit the user to assign a Wholesale ID.`);
      mutate();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve wholesaler');
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
          <button onClick={(e) => { 
            e.stopPropagation(); 
            setEditItem({ ...row, is_active: String(row.is_active), wholesale_status: row.wholesale_status || 'pending' }); 
            setEditWholesaleId(row.wholesale_id || "");
          }} className="db-icon-btn" title="Edit"><Pencil size={14} /></button>
          {WHOLESALE_TYPES.includes(row.user_type) && row.wholesale_status === 'pending' && (
            <button onClick={(e) => { e.stopPropagation(); handleApproveWholesale(row); }} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "7px", background: "#22c55e", color: "white", border: "none", cursor: "pointer" }}>Approve</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setDeleteItem(row); }} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
        </div>
      )}
      />

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateUserType('CUSTOMER'); }} title="Create User" maxWidth="max-w-2xl">
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const fd = new FormData(e.target); 
          fd.append('name', `${fd.get('first_name')} ${fd.get('last_name')}`.trim());
          fd.delete('first_name');
          fd.delete('last_name');
          handleCreate(fd); 
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">First Name *</label><input required name="first_name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="John" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Name *</label><input required name="last_name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="Doe" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email *</label><input required name="email" type="email" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="user@example.com" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password *</label><input required name="password" type="password" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="Min 8 chars" /></div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role *</label>
              <SearchableSelect 
                name="user_type" 
                value={createUserType} 
                onChange={setCreateUserType} 
                required 
                options={[
                  { label: "Customer", value: "CUSTOMER" },
                  { label: "Internal Wholesale", value: "WHOLESALER" },
                  { label: "External Wholesale", value: "RESTAURANT" }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Profile Image</label>
              <input type="file" name="profile_image" accept="image/*" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none cursor-pointer hover:bg-white transition-colors shadow-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#00694C]/10 file:text-[#00694C] hover:file:bg-[#00694C]/20 file:cursor-pointer file:transition-colors" />
            </div>
          </div>
          {(createUserType === 'WHOLESALER' || createUserType === 'RESTAURANT') && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Name *</label><input required name="business_name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="El Arbol S.L." /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CIF *</label><input required name="trade_license_number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="e.g. B12345678" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Phone</label><input name="phone" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="+34 600 000 000" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Postcode</label><input name="postcode" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="28001" /></div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Type</label>
                <select name="business_type" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none cursor-pointer hover:bg-white transition-colors shadow-sm text-slate-700">
                  <option value="restaurant">Restaurant / Bistro</option>
                  <option value="hotel">Hotel / Resort</option>
                  <option value="catering">Catering Company</option>
                  <option value="food_retail">Food Retail / Grocery</option>
                  <option value="dark_kitchen">Dark Kitchen</option>
                  <option value="cafe">Café / Bakery</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Volume</label>
                <select name="monthly_volume" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none cursor-pointer hover:bg-white transition-colors shadow-sm text-slate-700">
                  <option value="400_1000">€400 – €1,000</option>
                  <option value="1000_3000">€1,000 – €3,000</option>
                  <option value="3000_7000">€3,000 – €7,000</option>
                  <option value="7000_plus">€7,000+</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Wholesale ID (Optional)</label>
                <input name="wholesale_id" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="e.g. WHL-1004 (or leave blank to create in Edit)" />
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button style={{cursor: 'pointer'}} type="submit" className="px-5 py-2 text-sm font-bold bg-[#00694C] text-white rounded-lg hover:bg-[#085041] transition-colors shadow-sm">CREATE USER</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editItem} onClose={() => { setEditItem(null); setEditWholesaleId(""); }} title="Edit User" maxWidth="max-w-2xl">
        {editItem && (
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const fd = new FormData(e.target); 
            const vals = Object.fromEntries(fd);
            vals.name = `${vals.first_name} ${vals.last_name}`.trim();
            delete vals.first_name;
            delete vals.last_name;
            if (WHOLESALE_TYPES.includes(editItem.user_type)) {
              vals.wholesale_id = editWholesaleId.trim().toUpperCase();
            }
            handleEdit(vals); 
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">First Name *</label><input required name="first_name" defaultValue={editItem.name?.split(' ')[0] || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Name *</label><input required name="last_name" defaultValue={editItem.name?.split(' ').slice(1).join(' ') || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" /></div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role *</label>
                <SearchableSelect 
                  name="user_type" 
                  value={editItem.user_type} 
                  onChange={(val) => setEditItem({...editItem, user_type: val})} 
                  required 
                  options={[
                    { label: "Customer", value: "CUSTOMER" },
                    { label: "Internal Wholesale", value: "WHOLESALER" },
                    { label: "External Wholesale", value: "RESTAURANT" },
                    { label: "Admin", value: "ADMIN" }
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status *</label>
                <select name="is_active" defaultValue={String(editItem.is_active)} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {WHOLESALE_TYPES.includes(editItem.user_type) && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Wholesale Status *</label>
                    <select name="wholesale_status" defaultValue={editItem.wholesale_status || 'pending'} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Name</label>
                    <input name="business_name" defaultValue={editItem.business_name || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="e.g. Remedy Shop" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CIF / Tax ID</label>
                    <input name="cif" defaultValue={editItem.cif || editItem.trade_license_number || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="e.g. B12345678" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Phone</label>
                    <input name="phone" defaultValue={editItem.phone || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00694C]/40 outline-none" placeholder="+34 600 000 000" />
                  </div>

                  {/* Dedicated Wholesale ID Creation / Assignment Section */}
                  <div className="col-span-2 bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-xs font-extrabold text-[#00694C] uppercase tracking-wider">
                        Wholesale ID (Login Credential)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateWholesaleId}
                        disabled={isGeneratingId}
                        className="text-xs font-bold text-[#00694C] hover:text-[#085041] flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs hover:bg-emerald-50 transition-colors"
                        title="Auto-suggest the next available unique Wholesale ID"
                      >
                        <Sparkles size={13} className={isGeneratingId ? "animate-spin text-emerald-600" : "text-emerald-600"} />
                        <span>{isGeneratingId ? "Generating..." : "Auto-Suggest Next ID"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        name="wholesale_id"
                        value={editWholesaleId}
                        onChange={(e) => setEditWholesaleId(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-mono font-bold tracking-wider text-slate-900 focus:ring-2 focus:ring-[#00694C]/40 outline-none uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                        placeholder="e.g. WHL-1004 (or leave blank if not assigned)"
                      />
                      {editWholesaleId && (
                        <button
                          type="button"
                          onClick={() => setEditWholesaleId('')}
                          className="text-xs text-slate-400 hover:text-red-500 font-semibold px-2 py-1 shrink-0 cursor-pointer"
                          title="Clear ID"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                      Only admins can create or assign this Wholesale ID. Once assigned, provide this ID to the wholesale user so they can log in directly without a password.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button style={{cursor: 'pointer'}} type="submit" className="px-5 py-2 text-sm font-bold bg-[#00694C] text-white rounded-lg hover:bg-[#085041] transition-colors shadow-sm">SAVE CHANGES</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!viewItem} onClose={() => { setViewItem(null); setShowWholesaleId(false); }} title="User Profile" maxWidth="max-w-2xl">
        {viewItem && (
          <div className="flex flex-col">
            {/* Header / ID Section */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl mb-3 relative overflow-hidden">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <div 
                className="w-13 h-13 rounded-full overflow-hidden bg-white flex items-center justify-center border border-slate-200 shadow-xs shrink-0 relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {(() => {
                  let img = viewItem.profile_image || viewItem.photo;
                  if (img && img.startsWith('/')) img = `${API_BASE_URL}${img}`;
                  return img ? (
                    <img src={img} alt={viewItem.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-slate-400">{(viewItem.name || viewItem.email || "U").charAt(0).toUpperCase()}</span>
                  );
                })()}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={14} className="text-white" />
                </div>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#00694C] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-800 truncate leading-tight">{viewItem.name}</h3>
                  <RoleBadge value={viewItem.user_type} />
                  {WHOLESALE_TYPES.includes(viewItem.user_type) && <WholesaleStatusBadge value={viewItem.wholesale_status} />}
                </div>
                <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{viewItem.email}</p>
              </div>
            </div>

            {/* Dedicated Wholesale ID Banner (Highlight for admin to share with user) */}
            {WHOLESALE_TYPES.includes(viewItem.user_type) && (
              viewItem.wholesale_id ? (
                <div className="mb-3 bg-gradient-to-r from-emerald-50/90 via-emerald-50/60 to-teal-50/40 border border-emerald-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00694C] block">
                      Wholesale ID (Login Credential)
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-black text-base sm:text-lg text-slate-900 tracking-wider">
                        {showWholesaleId ? viewItem.wholesale_id : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowWholesaleId(p => !p)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-emerald-100/60 transition-colors cursor-pointer"
                        title={showWholesaleId ? "Hide Wholesale ID" : "Show Wholesale ID"}
                      >
                        {showWholesaleId ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyId(viewItem.wholesale_id)}
                    className="shrink-0 px-3.5 py-1.5 bg-[#00694C] hover:bg-[#00553d] active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Copy Wholesale ID"
                  >
                    {copiedId === viewItem.wholesale_id ? (
                      <>
                        <Check size={13} className="text-emerald-200" strokeWidth={3} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mb-3 bg-amber-50/80 border border-amber-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 block">
                      Wholesale ID (Not Created Yet)
                    </span>
                    <p className="text-xs text-amber-700/90 mt-0.5 font-medium leading-tight">
                      Admin has not assigned a Wholesale ID yet. Click &quot;Create ID&quot; to assign one.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const itm = viewItem;
                      setViewItem(null);
                      setEditItem({ ...itm, is_active: String(itm.is_active), wholesale_status: itm.wholesale_status || 'pending' });
                      setEditWholesaleId('');
                    }}
                    className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Edit User to Assign Wholesale ID"
                  >
                    <Pencil size={12} />
                    <span>Create ID</span>
                  </button>
                </div>
              )
            )}
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${viewItem.is_active ? 'bg-emerald-500' : 'bg-slate-300'} shadow-xs`}></span>
                  {viewItem.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>

              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Joined Date</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {viewItem.date_joined ? new Date(viewItem.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                </p>
              </div>

              {WHOLESALE_TYPES.includes(viewItem.user_type) && (
                <>
                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Business Name</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{viewItem.business_name || "—"}</p>
                  </div>

                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CIF</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{viewItem.cif || viewItem.trade_license_number || "—"}</p>
                  </div>

                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Phone</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{viewItem.phone || "—"}</p>
                  </div>

                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fulfillment Store</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {viewItem.store_name ? `${viewItem.store_name} (${viewItem.store_code || ''})` : "Default (Auto)"}
                    </p>
                  </div>

                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Business Type</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{viewItem.business_type || "—"}</p>
                  </div>

                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Monthly Volume</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{viewItem.monthly_volume || "—"}</p>
                  </div>

                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Delivery Postcode</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{viewItem.postcode || "—"}</p>
                  </div>

                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs col-span-2 sm:col-span-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Wholesale Type</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <RoleBadge value={viewItem.user_type} />
                      <span className="text-xs text-slate-500">
                        {viewItem.user_type === 'WHOLESALER' ? 'Created by Admin (Internal Wholesale)' : 'Self-registered from website (External Wholesale)'}
                      </span>
                    </div>
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
