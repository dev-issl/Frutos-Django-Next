"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Eye, Trash2, Edit, Store as StoreIcon, Shield } from "lucide-react";
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
  { key: "store_name", label: "Store", render: (v) => v || <span className="text-slate-400">—</span> },
  { key: "phone", label: "Phone", render: (v) => v || <span className="text-slate-400">—</span> },
  { key: "hire_date", label: "Hire Date", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

export default function StaffPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [page, setPage] = useState(1);
  const [storeFilter, setStoreFilter] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [permissionsItem, setPermissionsItem] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: rawData, isLoading, mutate, error } = useSWR(
    ["admin-staff", page, storeFilter],
    () => api.get(`/api/staff/admin/employees/?page=${page}&page_size=${PAGE_SIZE}${storeFilter ? `&store_id=${storeFilter}` : ""}`),
    { revalidateOnFocus: false }
  );

  const { data: storesRaw } = useSWR(
    "/api/fulfillment/stores/admin/",
    () => api.get("/api/fulfillment/stores/admin/"),
    { revalidateOnFocus: false }
  );
  
  const stores = Array.isArray(storesRaw) ? storesRaw : (storesRaw?.results || []);
  const storeOptions = stores.map(store => ({ value: store.id, label: store.name }));

  const createFields = [
    { key: "name", label: "Full Name", required: true, placeholder: "John Doe" },
    { key: "email", label: "Email", required: true, placeholder: "staff@example.com" },
    { key: "password", label: "Secret Key / Password", required: true, placeholder: "Min 8 characters", type: "password" },
    { key: "role", label: "Role", required: true, placeholder: "e.g. Sales Associate, Packager" },
    { key: "store_id", label: "Store", type: "select", options: storeOptions },
    { key: "phone", label: "Phone Number", placeholder: "Optional" },
    { key: "photo", label: "Profile Photo", type: "file" },
  ];

  const updateFields = [
    { key: "name", label: "Full Name", required: true, placeholder: "John Doe" },
    { key: "email", label: "Email", required: true, placeholder: "staff@example.com" },
    { key: "password", label: "Secret Key / Password", required: true, placeholder: "Min 8 characters", type: "password" },
    { key: "role", label: "Role", required: true, placeholder: "e.g. Sales Associate, Packager" },
    { key: "store_id", label: "Store", type: "select", options: storeOptions },
    { key: "phone", label: "Phone Number", placeholder: "Optional" },
    { key: "photo", label: "Profile Photo", type: "file" },
  ];

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
      <div className="db-filter-bar flex justify-between items-center mb-4">
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-between min-w-[220px] pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <StoreIcon size={16} className="text-emerald-600" />
              <span>{storeFilter ? stores.find(s => s.id.toString() === storeFilter)?.name : "All Stores"}</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {isFilterOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => { setStoreFilter(""); setIsFilterOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 cursor-pointer ${!storeFilter ? "text-emerald-600 bg-emerald-50/50" : "text-slate-600"}`}
              >
                All Stores
              </button>
              {stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => { setStoreFilter(store.id.toString()); setIsFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 cursor-pointer ${storeFilter === store.id.toString() ? "text-emerald-600 bg-emerald-50/50" : "text-slate-600"}`}
                >
                  {store.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
            <button onClick={() => router.push(`/dashboard/staff/${row.id}`)} className="db-icon-btn" title="View Shifts & Tasks">
              <Eye size={14} />
            </button>
            <button onClick={() => setPermissionsItem(row)} className="db-icon-btn" style={{ color: '#2563eb', background: '#eff6ff' }} title="Permissions">
              <Shield size={14} />
            </button>
            <button onClick={() => setEditItem(row)} className="db-icon-btn" title="Edit Staff Details">
              <Edit size={14} />
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

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Update Staff">
        <FormModal 
          fields={updateFields} 
          initialValues={getInitialValues(editItem)} 
          onSubmit={handleUpdate} 
          submitLabel="Update Staff" 
        />
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
