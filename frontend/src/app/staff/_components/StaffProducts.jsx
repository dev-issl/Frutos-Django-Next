"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Loader2, Package, Plus, Pencil, Trash2, Eye } from "lucide-react";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import ProductForm from "@/app/dashboard/_components/ProductForm";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import {
  brandsService, colorsService, sizesService,
  subcategoriesService, categoriesService, shopsService,
} from "@/app/dashboard/_lib/services";

const columns = [
  { key: "thumbnail_url", label: "PHOTO", sortable: false, render: (v) => v ? (
    <img src={v} alt="" className="w-8 h-8 rounded object-cover" />
  ) : (
    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
      <Package className="w-3.5 h-3.5 text-slate-400" />
    </div>
  )},
  { key: "name",           label: "Name" },
  { key: "price",          label: "Price",      render: (v) => `€${Number(v).toLocaleString()}` },
  { key: "discount_price", label: "Sale Price",  render: (v) => v ? `€${Number(v).toLocaleString()}` : "—" },
  { key: "stock",          label: "Stock" },
  { key: "shop",           label: "Shop",       render: (v) => v?.name || "—" },
  { key: "category",       label: "Category",   render: (v) => v?.name || "—" },
  { key: "is_active",      label: "Status",     render: (v) => v ? "active" : "inactive", type: "status" },
];

export default function StaffProducts({ profile }) {
  const toast = useToastContext();

  const { data: rawData, isLoading, error, mutate } = useSWR(
    "/api/products/products/?page_size=500",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const { data: brandsRaw }      = useSWR("ref-brands",      () => brandsService.list({ page_size: 200 }),      { revalidateOnFocus: false });
  const { data: colorsRaw }      = useSWR("ref-colors",      () => colorsService.list({ page_size: 200 }),      { revalidateOnFocus: false });
  const { data: sizesRaw }       = useSWR("ref-sizes",       () => sizesService.list({ page_size: 200 }),       { revalidateOnFocus: false });
  const { data: categoriesRaw }  = useSWR("ref-categories",  () => categoriesService.list({ page_size: 200 }),  { revalidateOnFocus: false });
  const { data: subcatsRaw }     = useSWR("ref-subcats",     () => subcategoriesService.list({ page_size: 200 }), { revalidateOnFocus: false });
  const { data: shopsRaw }       = useSWR("ref-shops",       () => shopsService.list({ page_size: 200 }),       { revalidateOnFocus: false });

  const brands       = brandsRaw?.results      || (Array.isArray(brandsRaw)      ? brandsRaw      : []);
  const colors       = colorsRaw?.results      || (Array.isArray(colorsRaw)      ? colorsRaw      : []);
  const sizes        = sizesRaw?.results       || (Array.isArray(sizesRaw)       ? sizesRaw       : []);
  const categories   = categoriesRaw?.results  || (Array.isArray(categoriesRaw)  ? categoriesRaw  : []);
  const subcategories= subcatsRaw?.results     || (Array.isArray(subcatsRaw)     ? subcatsRaw     : []);
  const shops        = shopsRaw?.results       || (Array.isArray(shopsRaw)       ? shopsRaw       : []);

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  
  const formProps = { categories, brands, colors, sizes, subcategories, shops };

  const data = Array.isArray(rawData) ? rawData : (rawData?.results || []);

  const handleCreate = async (payload) => {
    try {
      await api.post("/api/products/products/", payload);
      toast.success("Product created successfully");
      setCreateOpen(false);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to create product");
    }
  };

  const handleEdit = async (payload) => {
    try {
      await api.patch(`/api/products/products/${editItem.slug || editItem.id}/`, payload);
      toast.success("Product updated successfully");
      setEditItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to update product");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/products/products/${deleteItem.slug || deleteItem.id}/`);
      toast.success("Product deleted successfully");
      setDeleteItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to delete product");
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-[#00694C]" />
          <h1 className="text-3xl font-serif text-[#004A3A] font-medium tracking-tight">Product Catalog</h1>
        </div>
        {profile?.can_create_products && (
          <button 
            onClick={() => setCreateOpen(true)} 
            className="flex items-center gap-2 cursor-pointer bg-[#00694C] hover:bg-[#004A3A] text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-colors"
          >
            <Plus size={18} /> 
            <span>Add Product</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#00694C] animate-spin" /></div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">Failed to load products.</div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            pageSize={20}
            searchable
            searchKeys={["name"]}
            actions={(row) => {
              if (!profile?.can_update_products && !profile?.can_delete_products) return undefined;
              return (
                <div className="flex justify-end gap-2">
                  {profile?.can_update_products && (
                    <button 
                      onClick={() => setEditItem(row)} 
                      className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all cursor-pointer" 
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {profile?.can_delete_products && (
                    <button 
                      onClick={() => setDeleteItem(row)} 
                      className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-all cursor-pointer" 
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Product" maxWidth="max-w-4xl">
        <ProductForm {...formProps} onSubmit={handleCreate} submitLabel="Create Product" />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Product" maxWidth="max-w-4xl">
        {editItem && <ProductForm {...formProps} initialValues={editItem} onSubmit={handleEdit} submitLabel="Update Product" />}
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteItem?.name}"?`}
      />
    </div>
  );
}
