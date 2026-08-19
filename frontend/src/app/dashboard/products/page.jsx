


// Force cache invalidation
"use client";

import { useState } from "react";
import {
  Plus, Eye, Pencil, Trash2, X, Upload,
  Loader2, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import {
  productsService, brandsService, colorsService,
  sizesService, subcategoriesService, categoriesService, storesService, siteSettingsService, displayUnitsService
} from "@/app/dashboard/_lib/services";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import CategoryFilter from "@/app/dashboard/_components/CategoryFilter";
import ClassFilter from "@/app/dashboard/_components/ClassFilter";

const PAGE_SIZE = 20;

import ProductForm from "@/app/dashboard/_components/ProductForm";

import ProductView from "@/app/dashboard/_components/ProductView";

// ── Main Page ──────────────────────────────────────────────────
export default function ProductsPage() {
  const toast = useToastContext();
  const { data, loading, totalCount, params, setParams, setSearch, setPage, create, update, remove } = useModel(productsService, {
    defaultParams: { page: 1, page_size: PAGE_SIZE },
    onSuccess: (msg) => toast.success(msg),
    onError: (err) => toast.error(err?.message || "Operation failed"),
  });

  const { data: brandsRaw } = useSWR("ref-brands", () => brandsService.list({ page_size: 200 }));
  const { data: colorsRaw } = useSWR("ref-colors", () => colorsService.list({ page_size: 200 }));
  const { data: sizesRaw } = useSWR("ref-sizes", () => sizesService.list({ page_size: 200 }));
  const { data: categoriesRaw } = useSWR("ref-categories", () => categoriesService.list({ page_size: 200 }));
  const { data: subcatsRaw } = useSWR("ref-subcats", () => subcategoriesService.list({ page_size: 200 }));
  const { data: storesRaw } = useSWR("ref-stores", () => storesService.list());
  const { data: catalogSettingsRaw } = useSWR("site-settings-catalog", () => siteSettingsService.list({ group: "catalog" }));
  const { data: displayUnitsRaw } = useSWR("ref-display-units", () => displayUnitsService.list({ page_size: 200 }));

  const brands = brandsRaw?.results || (Array.isArray(brandsRaw) ? brandsRaw : []);
  const colors = colorsRaw?.results || (Array.isArray(colorsRaw) ? colorsRaw : []);
  const sizes = sizesRaw?.results || (Array.isArray(sizesRaw) ? sizesRaw : []);
  const categories = categoriesRaw?.results || (Array.isArray(categoriesRaw) ? categoriesRaw : []);
  const subcategories = subcatsRaw?.results || (Array.isArray(subcatsRaw) ? subcatsRaw : []);
  const stores = storesRaw?.results || (Array.isArray(storesRaw) ? storesRaw : []);
  const catalogSettings = catalogSettingsRaw?.results || (Array.isArray(catalogSettingsRaw) ? catalogSettingsRaw : []);
  const displayUnits = displayUnitsRaw?.results || (Array.isArray(displayUnitsRaw) ? displayUnitsRaw : []);
  
  const productClassesStr = catalogSettings.find(s => s.key === 'product_classes')?.value || "";
  const productClasses = productClassesStr.split(',').map(s => s.trim()).filter(Boolean);

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const handleCreate = async (payload) => { await create(payload); setCreateOpen(false); };
  const handleEdit = async (payload) => { await update(editItem.slug || editItem.id, payload); setEditItem(null); };
  const handleDelete = async () => { await remove(deleteItem.slug || deleteItem.id); setDeleteItem(null); };

  const formProps = { categories, brands, colors, sizes, subcategories, stores, productClasses, displayUnits };

  const columns = [
    {
      key: "thumbnail_url", label: "Photo", sortable: false, render: (v) => v ? (
        <div className="w-10 h-10 min-w-[40px] shrink-0">
          <img src={v} alt="" className="w-full h-full rounded-md object-cover border border-slate-200" />
        </div>
      ) : (
        <div className="w-10 h-10 min-w-[40px] shrink-0 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-slate-400" />
        </div>
      )
    },
    { key: "name", label: "Name", render: (v, row) => row.variant ? <span className="flex items-center gap-1.5">{v} <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">{row.variant}</span></span> : v },
    { key: "price", label: "Price", render: (v) => `€${Number(v).toLocaleString()}` },
    { key: "discount_price", label: "Sale Price", render: (v) => v ? `€${Number(v).toLocaleString()}` : "—" },
    { key: "stock", label: "Stock" },
    { key: "stores", label: "Stores", render: (v) => Array.isArray(v) && v.length > 0 ? (stores.length > 0 && v.length === stores.length ? "All" : `${v.length} store${v.length > 1 ? 's' : ''}`) : "—" },
    { key: "category", label: "Category", render: (v) => v?.name || "—" },
    { key: "sub_category", label: "Sub Category", render: (v) => v?.name || "—" },
    { key: "is_active", label: "Status", render: (v) => v ? "active" : "inactive", type: "status" },
  ];

  return (
    <Container
      title="Products"
      description="Manage your product catalog"
      actions={
        <button style={{ cursor: 'pointer' }} onClick={() => setCreateOpen(true)} className="db-btn-primary">
          <Plus size={15} /> Add Product
        </button>
      }
    >
      <DataTable
        columns={columns} data={data} serverSide
        totalItems={totalCount} currentPage={params.page || 1} pageSize={PAGE_SIZE}
        onSearch={setSearch} onPageChange={p => setPage(p)}
        loading={loading} searchable
        onRowClick={(row) => setViewItem(row)}
        extraFilters={
          <div className="flex gap-2 items-center">
            <CategoryFilter 
              categories={categories}
              selectedCategory={params.category}
              selectedSubCategory={params.subcategory}
              onChange={(cat, sub) => {
                setParams(p => {
                  const next = { ...p, page: 1 };
                  if (cat) next.category = cat; else delete next.category;
                  if (sub) next.subcategory = sub; else delete next.subcategory;
                  return next;
                });
              }}
            />
            <ClassFilter
              classes={productClasses}
              selectedClass={params.variant}
              onChange={(variant) => {
                setParams(p => {
                  const next = { ...p, page: 1 };
                  if (variant) next.variant = variant; else delete next.variant;
                  return next;
                });
              }}
            />
          </div>
        }
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setViewItem(row); }}
              className="db-icon-btn">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setEditItem(row); }}
              className="db-icon-btn">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setDeleteItem(row); }}
              className="db-icon-btn danger">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Product" maxWidth="max-w-4xl">
        <ProductForm onSubmit={handleCreate} submitLabel="Create Product" {...formProps} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Product" maxWidth="max-w-4xl">
        {editItem && <ProductForm initialValues={editItem} onSubmit={handleEdit} submitLabel="Save Changes" {...formProps} />}
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Product Details: ${viewItem?.name}`} maxWidth="max-w-4xl">
        <ProductView item={viewItem} stores={stores} />
      </Modal>

      <ConfirmDialog
        open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This cannot be undone.`}
      />
    </Container>
  );
}
