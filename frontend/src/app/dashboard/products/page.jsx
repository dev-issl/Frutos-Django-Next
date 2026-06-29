


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
  sizesService, subcategoriesService, categoriesService, storesService,
} from "@/app/dashboard/_lib/services";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import CategoryFilter from "@/app/dashboard/_components/CategoryFilter";

const PAGE_SIZE = 20;

const columns = [
  {
    key: "thumbnail_url", label: "", sortable: false, render: (v) => v ? (
      <img src={v} alt="" className="w-8 h-8 rounded object-cover" />
    ) : (
      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
      </div>
    )
  },
  { key: "name", label: "Name", render: (v, row) => row.variant ? <span className="flex items-center gap-1.5">{v} <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">{row.variant}</span></span> : v },
  { key: "price", label: "Price", render: (v) => `€${Number(v).toLocaleString()}` },
  { key: "discount_price", label: "Sale Price", render: (v) => v ? `€${Number(v).toLocaleString()}` : "—" },
  { key: "stock", label: "Stock" },
  { key: "stores", label: "Stores", render: (v) => Array.isArray(v) && v.length > 0 ? v.map(s => s.name).join(", ") : "—" },
  { key: "category", label: "Category", render: (v) => v?.name || "—" },
  { key: "sub_category", label: "Sub Category", render: (v) => v?.name || "—" },
  { key: "is_active", label: "Status", render: (v) => v ? "active" : "inactive", type: "status" },
];

import ProductForm from "@/app/dashboard/_components/ProductForm";

// ── Product View ───────────────────────────────────────────────
function ProductView({ item }) {
  if (!item) return null;

  const InfoBlock = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value ?? "—"}</span>
    </div>
  );

  const Section = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${className}`}>
      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        {title}
      </h4>
      {children}
    </div>
  );

  const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${active ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`}></span>
      {active ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="space-y-6 pb-2">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-48 shrink-0">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt={item.name} className="w-full aspect-square object-cover rounded-xl border border-slate-200 shadow-md" />
          ) : (
            <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge active={item.is_active} />
                {item.badge && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[11px] font-bold uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                {item.name}
                {item.variant && <span className="ml-2 text-sm px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold align-middle tracking-widest uppercase">{item.variant}</span>}
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">{item.category?.name || 'Uncategorized'}</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm text-amber-600 font-semibold">
                  ★ {item.rating ? `${Number(item.rating).toFixed(1)} (${item.review_count})` : "New"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-600 tracking-tight">€{Number(item.price).toLocaleString()}</div>
              {item.discount_price && (
                <div className="text-sm font-bold text-slate-400 line-through mt-1">€{Number(item.discount_price).toLocaleString()}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100/80">
            <InfoBlock label="Stock" value={item.stock} />
            <InfoBlock label="Wholesale Price" value={item.wholesale_price ? `€${Number(item.wholesale_price).toLocaleString()}` : "—"} />
            <InfoBlock label="Min Purchase" value={item.minimum_purchase || "—"} />
            <InfoBlock label="Commission" value={item.affiliate_commission_rate ? `${item.affiliate_commission_rate}%` : "—"} />
          </div>
        </div>
      </div>

      {/* Two Column Layout for Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-6">
          <Section title="Product Details">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <InfoBlock label="Product Slug" value={item.slug} />
              <InfoBlock label="Origin Country" value={item.origin} />
              <InfoBlock label="Display Unit" value={item.unit} />
              <InfoBlock label="Wholesale Unit" value={item.wholesale_unit} />
              <InfoBlock label="Stores" value={Array.isArray(item.stores) && item.stores.length > 0 ? item.stores.map(s => s.name).join(", ") : "—"} />
            </div>
          </Section>

          {item.nutritional_info && (
            <Section title="Nutritional Information">
              <div className="bg-[#00694C] rounded-xl p-5 shadow-inner">
                <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                  {item.nutritional_info}
                </pre>
              </div>
            </Section>
          )}

          {item.specifications?.length > 0 && (
            <Section title="Specifications">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.specifications.map((s, i) => (
                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.name}</span>
                    <span className="text-sm text-slate-800 font-semibold mt-0.5">{s.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {item.additional_images?.length > 0 && (
            <Section title="Image Gallery">
              <div className="flex flex-wrap gap-4">
                {item.additional_images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={img.image} alt="" className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Side Info Column */}
        <div className="space-y-6">
          <Section title="Variants & Options">
            {(item.colors?.length > 0 || item.sizes?.length > 0) ? (
              <div className="space-y-5">
                {item.colors?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Colors</span>
                    <div className="flex flex-wrap gap-2">
                      {item.colors.map(c => (
                        <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                          {c.hex_code && <span className="w-3 h-3 rounded-full border border-slate-200 shadow-inner" style={{ background: c.hex_code }} />}
                          {c.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.sizes?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Sizes</span>
                    <div className="flex flex-wrap gap-2">
                      {item.sizes.map(s => (
                        <div key={s.id} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No variants available.</p>
            )}
          </Section>

          <Section title="Logistics">
            <div className="space-y-5">
              <InfoBlock label="Shipping Category" value={item.shipping_category?.name} />

              {(item.weight || item.length || item.width || item.height) ? (
                <>
                  <InfoBlock label="Weight" value={item.weight ? `${item.weight} kg` : "—"} />
                  <InfoBlock label="Dimensions (L×W×H)" value={[item.length, item.width, item.height].filter(Boolean).join(" × ") || "—"} />
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">No physical dimensions provided.</p>
              )}
            </div>
          </Section>

          <Section title="System Information">
            <div className="space-y-4">
              <InfoBlock label="Created On" value={item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"} />
              <InfoBlock label="Last Updated" value={item.updated_at ? new Date(item.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ProductsPage() {
  const toast = useToastContext();
  const { data, loading, totalCount, params, setParams, setSearch, setPage, create, update, remove } = useModel(productsService, {
    defaultParams: { page: 1, page_size: PAGE_SIZE },
    onSuccess: (msg) => toast.success(msg),
    onError: (err) => toast.error(err?.message || "Operation failed"),
  });

  const { data: brandsRaw } = useSWR("ref-brands", () => brandsService.list({ page_size: 200 }), { revalidateOnFocus: false });
  const { data: colorsRaw } = useSWR("ref-colors", () => colorsService.list({ page_size: 200 }), { revalidateOnFocus: false });
  const { data: sizesRaw } = useSWR("ref-sizes", () => sizesService.list({ page_size: 200 }), { revalidateOnFocus: false });
  const { data: categoriesRaw } = useSWR("ref-categories", () => categoriesService.list({ page_size: 200 }), { revalidateOnFocus: false });
  const { data: subcatsRaw } = useSWR("ref-subcats", () => subcategoriesService.list({ page_size: 200 }), { revalidateOnFocus: false });
  const { data: storesRaw } = useSWR("ref-stores", () => storesService.list(), { revalidateOnFocus: false });

  const brands = brandsRaw?.results || (Array.isArray(brandsRaw) ? brandsRaw : []);
  const colors = colorsRaw?.results || (Array.isArray(colorsRaw) ? colorsRaw : []);
  const sizes = sizesRaw?.results || (Array.isArray(sizesRaw) ? sizesRaw : []);
  const categories = categoriesRaw?.results || (Array.isArray(categoriesRaw) ? categoriesRaw : []);
  const subcategories = subcatsRaw?.results || (Array.isArray(subcatsRaw) ? subcatsRaw : []);
  const stores = storesRaw?.results || (Array.isArray(storesRaw) ? storesRaw : []);

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const handleCreate = async (payload) => { await create(payload); setCreateOpen(false); };
  const handleEdit = async (payload) => { await update(editItem.slug || editItem.id, payload); setEditItem(null); };
  const handleDelete = async () => { await remove(deleteItem.slug || deleteItem.id); setDeleteItem(null); };

  const formProps = { categories, brands, colors, sizes, subcategories, stores };

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
        extraFilters={
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
        }
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button style={{ cursor: 'pointer' }} onClick={() => setViewItem(row)}
              className="db-icon-btn">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button style={{ cursor: 'pointer' }} onClick={() => setEditItem(row)}
              className="db-icon-btn">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button style={{ cursor: 'pointer' }} onClick={() => setDeleteItem(row)}
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

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Product Details" maxWidth="max-w-4xl">
        <ProductView item={viewItem} />
      </Modal>

      <ConfirmDialog
        open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This cannot be undone.`}
      />
    </Container>
  );
}
