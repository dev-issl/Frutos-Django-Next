"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Eye, Trash2, Edit, Store as StoreIcon, Shield, User, UserPlus, Mail, Lock, Briefcase, Phone, Image as ImageIcon, Calendar, Trophy, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import StaffRankingTab from "./_components/StaffRankingTab";
import StaffAttendanceTab from "./_components/StaffAttendanceTab";
const PAGE_SIZE = 20;

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name", render: (v, row) => (
    <Link href={`/dashboard/staff/${row.id}`} className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
        {row.photo ? (
          <img src={row.photo} alt={row.user?.name || "Staff"} className="w-full h-full object-cover" />
        ) : (
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || row.user?.email || 'S')}&background=0f172a&color=fff&size=64&bold=true`} alt="Default" className="w-full h-full object-cover" />
        )}
      </div>
      <span className="font-medium text-slate-700 group-hover:text-[#00694C] group-hover:underline transition-colors">{row.user?.name}</span>
    </Link>
  )},
  { key: "email", label: "Email", render: (v, row) => row.user?.email },
  { key: "role", label: "Role", render: (v) => <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700">{v || "Staff"}</span> },
  { key: "phone", label: "Phone", render: (v) => v || <span className="text-slate-400">—</span> },
  { key: "hire_date", label: "Hire Date", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

export default function StaffPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("staff");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [permissionsItem, setPermissionsItem] = useState(null);

  const { data: rawData, isLoading, mutate, error } = useSWR(
    ["admin-staff", page],
    () => api.get(`/api/staff/admin/employees/?page=${page}&page_size=${PAGE_SIZE}`),
    { revalidateOnFocus: false }
  );

  const { data: storesRaw } = useSWR(
    "/api/fulfillment/stores/admin/",
    () => api.get("/api/fulfillment/stores/admin/"),
    { revalidateOnFocus: false }
  );
  
  const stores = Array.isArray(storesRaw) ? storesRaw : (storesRaw?.results || []);
  const storeOptions = stores.map(store => ({ value: store.id, label: store.name }));

  const data = rawData?.results || (Array.isArray(rawData) ? rawData : []);
  const totalCount = rawData?.count || data.length;

  const handleCreate = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          formData.append(k, v);
        }
      });
      await api.post("/api/staff/admin/employees/", formData);
      toast.success("Staff member created successfully");
      setCreateOpen(false);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to create staff member");
    }
  };

  const handleUpdate = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === 'photo' && typeof v === 'string') return; // Skip existing URL string
        if (v !== undefined && v !== null && v !== "") {
          formData.append(k, v);
        }
      });
      if (!values.password) {
        formData.delete('password'); // Don't send empty password
      }
      
      await api.patch(`/api/staff/admin/employees/${editItem.id}/`, formData);
      toast.success("Staff member updated successfully");
      setEditItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to update staff member");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/staff/admin/employees/${deleteItem.id}/`);
      toast.success("Staff member deleted successfully");
      setDeleteItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to delete staff member");
    }
  };

  const handlePermissionsUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        can_create_orders: permissionsItem.can_create_orders || false,
        can_update_orders: permissionsItem.can_update_orders || false,
        can_delete_orders: permissionsItem.can_delete_orders || false,
        can_create_products: permissionsItem.can_create_products || false,
        can_update_products: permissionsItem.can_update_products || false,
        can_delete_products: permissionsItem.can_delete_products || false,
      };
      await api.patch(`/api/staff/admin/employees/${permissionsItem.id}/`, payload);
      toast.success("Permissions updated successfully");
      setPermissionsItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to update permissions");
    }
  };

  const getInitialValues = (item) => {
    if (!item) return {};
    return {
      name: item.user?.name || "",
      email: item.user?.email || "",
      role: item.role || "",
      store_id: item.store_id || item.store?.id || "",
      phone: item.phone || "",
      password: item.secret_key || "",
      photo: item.photo || null,
    };
  };

  return (
    <Container title="Staff Management" description="Manage your staff, their roles, and branch locations">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 max-w-md">
        <button onClick={() => setActiveTab("staff")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "staff" ? "bg-white text-[#00694C] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <User className="w-4 h-4" /> Staff
        </button>
        <button onClick={() => setActiveTab("ranking")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "ranking" ? "bg-white text-[#00694C] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <Trophy className="w-4 h-4" /> Rankings
        </button>
        <button onClick={() => setActiveTab("attendance")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "attendance" ? "bg-white text-[#00694C] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <Calendar className="w-4 h-4" /> Attendance
        </button>
      </div>

      {activeTab === "ranking" ? (
        <StaffRankingTab stores={stores} />
      ) : activeTab === "attendance" ? (
        <StaffAttendanceTab stores={stores} />
      ) : (
        <>
      <div className="flex justify-end mb-4">
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
        searchable
        searchKeys={["name", "email", "phone", "staff_id"]}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onRowClick={(row) => router.push(`/dashboard/staff/${row.id}`)}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={(e) => { e.stopPropagation(); setViewStaff(row); }} className="db-icon-btn" title="View Profile">
              <Eye size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setPermissionsItem(row); }} className="db-icon-btn" style={{ color: '#2563eb', background: '#eff6ff' }} title="Permissions">
              <Shield size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setEditItem(row); }} className="db-icon-btn" title="Edit Staff Details">
              <Edit size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setDeleteItem(row); }} className="db-icon-btn danger" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      
      </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={
        <div className="flex items-center gap-2.5 text-emerald-700">
          <UserPlus size={18} className="text-emerald-500" />
          <span>Add New Staff</span>
        </div>
      } maxWidth="max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleCreate(Object.fromEntries(fd)); }} className="flex flex-col">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-7 bg-slate-50/50">
            {/* Full Name */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input required name="name" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="John Doe" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input required name="email" type="email" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="staff@example.com" />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                </div>
                <input required name="role" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Sales Associate" />
              </div>
            </div>

            {/* Staff ID */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Staff ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4 text-slate-400" />
                </div>
                <input name="staff_id" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Auto-generated if left blank" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input name="phone" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Optional" />
              </div>
            </div>

            {/* Profile Photo */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Profile Photo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ImageIcon className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <input type="file" name="photo" accept="image/*" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer file:cursor-pointer text-slate-500" />
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-slate-100/50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer">
              <Plus size={16} /> Create Staff Member
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={
        <div className="flex items-center gap-2.5 text-emerald-700">
          <User size={18} className="text-emerald-500" />
          <span>Update Staff</span>
        </div>
      } maxWidth="max-w-2xl">
        {editItem && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleUpdate(Object.fromEntries(fd)); }} className="flex flex-col">
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-7 bg-slate-50/50">
              {/* Full Name */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input required name="name" defaultValue={editItem.user?.name} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="John Doe" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input required name="email" type="email" defaultValue={editItem.user?.email} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="staff@example.com" />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                  </div>
                  <input required name="role" defaultValue={editItem.role} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Sales Associate" />
                </div>
              </div>

              {/* Staff ID */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Staff ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Shield className="h-4 w-4 text-slate-400" />
                  </div>
                  <input name="staff_id" defaultValue={editItem.staff_id || ""} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Enter Staff ID" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input name="phone" defaultValue={editItem.phone} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Optional" />
                </div>
              </div>

              {/* Profile Photo */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Profile Photo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <input type="file" name="photo" accept="image/*" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer file:cursor-pointer text-slate-500" />
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-slate-100/50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer">
                <Edit size={16} /> Update Staff
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!viewStaff} onClose={() => setViewStaff(null)} title={
        <div className="flex items-center gap-2.5 text-[#00694C]">
          <User size={20} className="text-[#00694C]" />
          <span className="font-bold text-lg">Staff Profile</span>
        </div>
      } maxWidth="max-w-2xl">
        {viewStaff && (
          <div className="flex flex-col">
            {/* Header / Profile Info */}
            <div className="flex items-center gap-5 p-2 pt-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                {viewStaff.photo ? (
                  <img src={viewStaff.photo} alt={viewStaff.user?.name || "Staff"} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewStaff.user?.name || viewStaff.user?.email || 'S')}&background=0f172a&color=fff&size=128&bold=true`} alt="Default" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-slate-800">{viewStaff.user?.name}</h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5">
                  <Mail size={14} /> {viewStaff.user?.email}
                </div>
                <div className="mt-2">
                  <span className="inline-flex px-2 py-1 text-xs font-bold rounded-md bg-[#00694C]/10 text-[#00694C]">
                    {viewStaff.role || "Staff"}
                  </span>
                </div>
              </div>
            </div>

            <hr className="my-6 border-slate-100" />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 px-2">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Staff ID</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Shield size={14} className="text-slate-400" />
                  {viewStaff.staff_id || <span className="text-slate-400 italic font-normal">Not Assigned</span>}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  {viewStaff.phone || <span className="text-slate-400 italic font-normal">Not provided</span>}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hire Date</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  {viewStaff.hire_date ? new Date(viewStaff.hire_date).toLocaleDateString() : <span className="text-slate-400 italic font-normal">Unknown</span>}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">System ID</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <StoreIcon size={14} className="text-slate-400" />
                  #{viewStaff.id}
                </p>
              </div>
            </div>

            <hr className="my-6 border-slate-100" />

            {/* Permissions */}
            <div className="px-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Active Permissions</p>
              <div className="flex flex-wrap gap-2">
                {viewStaff.can_create_orders && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-700"><Shield size={12} className="text-emerald-500" /> Create Orders</span>}
                {viewStaff.can_update_orders && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-700"><Shield size={12} className="text-emerald-500" /> Update Orders</span>}
                {viewStaff.can_delete_orders && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-700"><Shield size={12} className="text-rose-500" /> Delete Orders</span>}
                {viewStaff.can_create_products && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-700"><Shield size={12} className="text-indigo-500" /> Create Products</span>}
                {viewStaff.can_update_products && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-700"><Shield size={12} className="text-indigo-500" /> Update Products</span>}
                {viewStaff.can_delete_products && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-700"><Shield size={12} className="text-rose-500" /> Delete Products</span>}
                {!(viewStaff.can_create_orders || viewStaff.can_update_orders || viewStaff.can_delete_orders || viewStaff.can_create_products || viewStaff.can_update_products || viewStaff.can_delete_products) && (
                  <span className="text-sm italic text-slate-400">No special permissions assigned.</span>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 px-2">
              <button type="button" onClick={() => setViewStaff(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
                Close
              </button>
              <button type="button" onClick={() => { setViewStaff(null); router.push(`/dashboard/staff/${viewStaff.id}`); }} className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                <Calendar size={16} /> Manage Shifts & Tasks
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Staff"
        message={`Delete "${deleteItem?.user?.name}"? This cannot be undone and will remove all their shifts and tasks.`}
      />

      <Modal open={!!permissionsItem} onClose={() => setPermissionsItem(null)} title={`Permissions for ${permissionsItem?.user?.name}`}>
        <form onSubmit={handlePermissionsUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={permissionsItem?.can_create_orders || false} onChange={e => setPermissionsItem({...permissionsItem, can_create_orders: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Can create manual orders</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={permissionsItem?.can_update_orders || false} onChange={e => setPermissionsItem({...permissionsItem, can_update_orders: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Can update existing orders</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer border-b border-slate-200 pb-3 mb-1">
              <input type="checkbox" checked={permissionsItem?.can_delete_orders || false} onChange={e => setPermissionsItem({...permissionsItem, can_delete_orders: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Can delete orders</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={permissionsItem?.can_create_products || false} onChange={e => setPermissionsItem({...permissionsItem, can_create_products: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Can create products</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={permissionsItem?.can_update_products || false} onChange={e => setPermissionsItem({...permissionsItem, can_update_products: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Can update existing products</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={permissionsItem?.can_delete_products || false} onChange={e => setPermissionsItem({...permissionsItem, can_delete_products: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Can delete products</span>
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="db-btn-primary">
              Save Permissions
            </button>
          </div>
        </form>
      </Modal>
    </Container>
  );
}
