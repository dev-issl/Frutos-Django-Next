"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, Trash2, LayoutGrid, Package, Globe } from "lucide-react";
import useSWR from "swr";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import {
  sectionsService, sectionItemsService, pageSectionsService,
  productsService, categoriesService,
} from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 15;
const TABS = [
  { id: "sections", label: "Sections", icon: LayoutGrid },
  { id: "items", label: "Section Items", icon: Package },
  { id: "pages", label: "Page Assignments", icon: Globe },
];
const TYPE_OPTIONS = [
  { value: "product", label: "Product Based" },
  { value: "category", label: "Category Based" },
  { value: "special_offer", label: "Special Offer" },
];
const PAGE_CHOICES = [
  { value: "home", label: "Home Page" },
  { value: "cart", label: "Cart Page" },
  { value: "categories", label: "Categories Page" },
  { value: "checkout", label: "Checkout Page" },
  { value: "products", label: "Products Page" },
  { value: "product_detail", label: "Product Detail Page" },
  { value: "shop", label: "Shop Page" },
  { value: "search", label: "Search Results Page" },
];

const inp = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

function TypeBadge({ type }) {
  const colors = { product: "bg-blue-50 text-blue-700", category: "bg-purple-50 text-purple-700", special_offer: "bg-amber-50 text-amber-700" };
  const labels = { product: "Product", category: "Category", special_offer: "Special Offer" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type] || "bg-slate-100 text-slate-500"}`}>{labels[type] || type}</span>;
}

/* ─── Section Form ─────────────────────────────────────────── */
function SectionForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [v, setV] = useState({
    name: "", description: "", section_type: "product",
    title_display: "", subtitle_display: "", is_active: "true",
    order: "0", max_items: "10",
    discount_percentage: "", offer_start_date: "", offer_end_date: "",
    ...initial, is_active: String(initial.is_active ?? true),
  });
  const set = (k, val) => setV(p => ({ ...p, [k]: val }));
  const isOffer = v.section_type === "special_offer";

  const submit = e => {
    e.preventDefault();
    onSubmit({
      ...v, is_active: v.is_active === "true",
      order: parseInt(v.order) || 0, max_items: parseInt(v.max_items) || 10,
      discount_percentage: isOffer && v.discount_percentage ? v.discount_percentage : null,
      offer_start_date: isOffer && v.offer_start_date ? v.offer_start_date : null,
      offer_end_date: isOffer && v.offer_end_date ? v.offer_end_date : null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>Section Name *</label><input required className={inp} value={v.name} onChange={e => set("name", e.target.value)} placeholder="e.g., Featured Products" /></div>
        <div>
          <label className={lbl}>Section Type *</label>
          <SearchableSelect
            required
            value={v.section_type}
            onChange={val => set("section_type", val)}
            options={TYPE_OPTIONS}
          />
        </div>
        <div><label className={lbl}>Display Title</label><input className={inp} value={v.title_display} onChange={e => set("title_display", e.target.value)} placeholder="Title shown to visitors" /></div>
        <div><label className={lbl}>Display Subtitle</label><input className={inp} value={v.subtitle_display} onChange={e => set("subtitle_display", e.target.value)} placeholder="Subtitle shown to visitors" /></div>
        <div><label className={lbl}>Display Order</label><input type="number" min="0" className={inp} value={v.order} onChange={e => set("order", e.target.value)} /></div>
        <div><label className={lbl}>Max Items to Display</label><input type="number" min="1" className={inp} value={v.max_items} onChange={e => set("max_items", e.target.value)} /></div>
        <div>
          <label className={lbl}>Status</label>
          <SearchableSelect
            value={v.is_active}
            onChange={val => set("is_active", val)}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
        </div>
      </div>
      <div><label className={lbl}>Description</label><textarea rows={2} className={inp + " resize-none"} value={v.description} onChange={e => set("description", e.target.value)} /></div>
      {isOffer && (
        <div className="border border-amber-200 rounded-lg p-4 space-y-3 bg-amber-50/40">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Special Offer Settings</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={lbl}>Discount % *</label><input required type="number" min="0" max="100" step="0.01" className={inp} value={v.discount_percentage} onChange={e => set("discount_percentage", e.target.value)} placeholder="20.00" /></div>
            <div><label className={lbl}>Offer Start</label><input type="datetime-local" className={inp} value={v.offer_start_date || ""} onChange={e => set("offer_start_date", e.target.value)} /></div>
            <div><label className={lbl}>Offer End</label><input type="datetime-local" className={inp} value={v.offer_end_date || ""} onChange={e => set("offer_end_date", e.target.value)} /></div>
          </div>
        </div>
      )}
      <div className="flex justify-end pt-1"><button type="submit" className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">{submitLabel}</button></div>
    </form>
  );
}

/* ─── Section Item Form ────────────────────────────────────── */
function ItemForm({ isEdit = false, initial = {}, sections = [], products = [], categories = [], onSubmit, submitLabel = "Save" }) {
  const [sectionId, setSectionId] = useState(String(initial.section || ""));
  // Edit: single select. Create: multi-checkbox.
  const [productId, setProductId] = useState(String(initial.product?.id ?? initial.product ?? ""));
  const [categoryId, setCategoryId] = useState(String(initial.category?.id ?? initial.category ?? ""));
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState(String(initial.order ?? "0"));
  const [featured, setFeatured] = useState(Boolean(initial.is_featured));
  const [customTitle, setCustomTitle] = useState(initial.custom_title || "");
  const [customDesc, setCustomDesc] = useState(initial.custom_description || "");
  const [specialPrice, setSpecialPrice] = useState(initial.special_price || "");

  const section = sections.find(s => String(s.id) === sectionId);
  const sType = section?.section_type || "product";
  const showProduct = sType !== "category";

  const toggleId = id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filteredItems = showProduct
    ? products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    : categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const submit = e => {
    e.preventDefault();
    if (isEdit) {
      onSubmit({
        section: sectionId,
        product: showProduct && productId ? productId : null,
        category: !showProduct && categoryId ? categoryId : null,
        order: parseInt(order) || 0,
        is_featured: featured,
        custom_title: customTitle,
        custom_description: customDesc,
        special_price: sType === "special_offer" && specialPrice ? specialPrice : null,
      });
    } else {
      // Return list for bulk create
      onSubmit(selectedIds.map(id => ({
        section: sectionId,
        product: showProduct ? id : null,
        category: !showProduct ? id : null,
        order: parseInt(order) || 0,
        is_featured: featured,
        custom_title: customTitle,
        custom_description: customDesc,
        special_price: sType === "special_offer" && specialPrice ? specialPrice : null,
      })));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={lbl}>Section *</label>
        <SearchableSelect
          required
          value={sectionId}
          onChange={val => { setSectionId(val); setSelectedIds([]); setSearch(""); }}
          placeholder="Select section…"
          options={sections.map(s => ({ value: s.id, label: `${s.name} (${s.section_type_display || s.section_type})` }))}
        />
        {sectionId && section && (
          <p className="text-xs text-slate-400 mt-1">Type: <TypeBadge type={section.section_type} /></p>
        )}
      </div>

      {/* Edit mode – single selector */}
      {isEdit && sectionId && showProduct && (
        <div>
          <label className={lbl}>Product *</label>
          <SearchableSelect
            required
            value={productId}
            onChange={setProductId}
            placeholder="Select product…"
            options={products.map(p => ({ value: p.id, label: p.name }))}
          />
        </div>
      )}
      {isEdit && sectionId && !showProduct && (
        <div>
          <label className={lbl}>Category *</label>
          <SearchableSelect
            required
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Select category…"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
        </div>
      )}

      {/* Create mode – multi-checkbox list */}
      {!isEdit && sectionId && (
        <div>
          <label className={lbl}>
            {showProduct ? "Products" : "Categories"}
            {selectedIds.length > 0 && (
              <span className="ml-2 text-xs font-medium text-slate-800 bg-gray-200 px-1.5 py-0.5 rounded">{selectedIds.length} selected</span>
            )}
          </label>
          <input
            className={inp + " mb-2"}
            placeholder={`Search ${showProduct ? "products" : "categories"}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="border border-slate-200 rounded-md divide-y divide-gray-100 max-h-56 overflow-y-auto">
            {filteredItems.length === 0 && (
              <p className="text-xs text-slate-400 p-3 italic">{search ? "No matches." : `No ${showProduct ? "products" : "categories"} available.`}</p>
            )}
            {filteredItems.map(item => (
              <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleId(item.id)}
                  className="rounded border-gray-300 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-slate-700 flex-1 truncate">{item.name}</span>
                {showProduct && item.price && (
                  <span className="text-xs text-slate-400 flex-shrink-0">৳{Number(item.price).toLocaleString()}</span>
                )}
              </label>
            ))}
          </div>
          {!isEdit && selectedIds.length === 0 && (
            <p className="text-xs text-red-400 mt-1">Select at least one {showProduct ? "product" : "category"}.</p>
          )}
          {filteredItems.length > 0 && (
            <div className="flex gap-3 mt-1.5">
              <button type="button" className="text-xs text-slate-400 hover:text-slate-600 underline" onClick={() => setSelectedIds(filteredItems.map(i => i.id))}>
                Select all{search ? " matching" : ""}
              </button>
              {selectedIds.length > 0 && (
                <button type="button" className="text-xs text-slate-400 hover:text-slate-600 underline" onClick={() => setSelectedIds([])}>
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={lbl}>Display Order</label><input type="number" min="0" className={inp} value={order} onChange={e => setOrder(e.target.value)} /></div>
        {sType === "special_offer" && (
          <div><label className={lbl}>Special Price (৳)</label><input type="number" min="0" step="0.01" className={inp} value={specialPrice} onChange={e => setSpecialPrice(e.target.value)} placeholder="Override product price" /></div>
        )}
        <div><label className={lbl}>Custom Title <span className="font-normal text-xs text-slate-400">(optional)</span></label><input className={inp} value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Override display name" /></div>
      </div>
      <div><label className={lbl}>Custom Description <span className="font-normal text-xs text-slate-400">(optional)</span></label><textarea rows={2} className={inp + " resize-none"} value={customDesc} onChange={e => setCustomDesc(e.target.value)} /></div>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
        <span className="text-sm text-slate-700">Mark as featured item in this section</span>
      </label>
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={!isEdit && sectionId && selectedIds.length === 0}
          className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitLabel}{!isEdit && selectedIds.length > 1 ? ` (${selectedIds.length} items)` : ""}
        </button>
      </div>
    </form>
  );
}

/* ─── Page Assignment Form ─────────────────────────────────── */
function AssignmentForm({ initial = {}, sections = [], onSubmit, submitLabel = "Save" }) {
  const [v, setV] = useState({
    section: "", page_name: "home", is_active: "true",
    order: "0", items_per_row: "4",
    show_title: true, show_subtitle: true, show_view_all: true,
    ...initial,
    section: String(initial.section || ""),
    is_active: String(initial.is_active ?? true),
    show_title: initial.show_title !== false,
    show_subtitle: initial.show_subtitle !== false,
    show_view_all: initial.show_view_all !== false,
  });
  const set = (k, val) => setV(p => ({ ...p, [k]: val }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...v, is_active: v.is_active === "true", order: parseInt(v.order)||0, items_per_row: parseInt(v.items_per_row)||4 }); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Section *</label>
          <SearchableSelect
            required
            value={v.section}
            onChange={val => set("section", val)}
            placeholder="Select section…"
            options={sections.map(s => ({ value: s.id, label: s.name }))}
          />
        </div>
        <div>
          <label className={lbl}>Page *</label>
          <SearchableSelect
            required
            value={v.page_name}
            onChange={val => set("page_name", val)}
            placeholder="Select page…"
            options={PAGE_CHOICES}
          />
        </div>
        <div><label className={lbl}>Display Order</label><input type="number" min="0" className={inp} value={v.order} onChange={e => set("order", e.target.value)} /></div>
        <div>
          <label className={lbl}>Items Per Row</label>
          <SearchableSelect
            value={v.items_per_row}
            onChange={val => set("items_per_row", val)}
            options={[2,3,4,5,6].map(n => ({ value: n, label: `${n} columns` }))}
          />
        </div>
        <div>
          <label className={lbl}>Status</label>
          <SearchableSelect
            value={v.is_active}
            onChange={val => set("is_active", val)}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
        </div>
      </div>
      <div className="space-y-2">
        {[["show_title","Show section title on this page"],["show_subtitle","Show section subtitle on this page"],["show_view_all","Show 'View All' button"]].map(([k,l])=>(
          <label key={k} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={v[k]} onChange={e => set(k, e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
            <span className="text-sm text-slate-700">{l}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end pt-1"><button type="submit" className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">{submitLabel}</button></div>
    </form>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function SectionsPage() {
  const toast = useToastContext();
  const [tab, setTab] = useState("sections");

  // Models
  const sectionsModel = useModel(sectionsService, { defaultParams: { page_size: PAGE_SIZE } });
  const itemsModel = useModel(sectionItemsService, { defaultParams: { page_size: PAGE_SIZE } });
  const pagesModel = useModel(pageSectionsService, { defaultParams: { page_size: PAGE_SIZE } });

  // Dropdowns — all sections (for items/assignments forms)
  const { data: allSectionsRaw } = useSWR("all-sections-list",
    () => sectionsService.list({ page_size: 200 }),
    { revalidateOnFocus: false }
  );
  const allSections = allSectionsRaw?.results || (Array.isArray(allSectionsRaw) ? allSectionsRaw : []);

  // Products & categories for item form
  const { data: allProductsRaw } = useSWR("all-products-dropdown",
    () => productsService.list({ page_size: 200, is_active: true }),
    { revalidateOnFocus: false }
  );
  const allProducts = allProductsRaw?.results || (Array.isArray(allProductsRaw) ? allProductsRaw : []);

  const { data: allCatsRaw } = useSWR("all-cats-dropdown",
    () => categoriesService.list({ page_size: 200 }),
    { revalidateOnFocus: false }
  );
  const allCats = allCatsRaw?.results || (Array.isArray(allCatsRaw) ? allCatsRaw : []);

  // Filter states
  const [itemFilterSection, setItemFilterSection] = useState("");
  const [pageFilter, setPageFilter] = useState("");

  // Section modals
  const [sCreate, setSCreate] = useState(false);
  const [sEdit, setSEdit] = useState(null);
  const [sView, setSView] = useState(null);
  const [sDel, setSDel] = useState(null);

  // Item modals
  const [iCreate, setICreate] = useState(false);
  const [iEdit, setIEdit] = useState(null);
  const [iDel, setIDel] = useState(null);

  // Assignment modals
  const [aCreate, setACreate] = useState(false);
  const [aEdit, setAEdit] = useState(null);
  const [aDel, setADel] = useState(null);

  const withToast = async (fn, msg, onClose) => {
    try { await fn(); toast.success(msg); onClose(); } catch (e) { toast.error(e?.message || "Error"); }
  };

  // Section CRUD
  const handleCreateSection = v => withToast(() => sectionsModel.create(v), "Section created", () => setSCreate(false));
  const handleEditSection = v => withToast(() => sectionsModel.patch(sEdit.slug, v), "Section updated", () => setSEdit(null));
  const handleDeleteSection = () => withToast(() => sectionsModel.remove(sDel.slug), "Section deleted", () => setSDel(null));

  // Item CRUD
  const handleCreateItem = v => {
    // v may be an array (bulk) or a single object
    const isArray = Array.isArray(v);
    const count = isArray ? v.length : 1;
    const apiFn = () => isArray
      ? sectionItemsService.bulkCreate(v)
      : itemsModel.create(v);
    withToast(apiFn, `${count} item${count !== 1 ? 's' : ''} added to section`, () => { setICreate(false); itemsModel.mutate(); });
  };
  const handleEditItem = v => withToast(() => itemsModel.patch(iEdit.id, v), "Item updated", () => setIEdit(null));
  const handleDeleteItem = () => withToast(() => itemsModel.remove(iDel.id), "Item removed", () => setIDel(null));

  // Assignment CRUD
  const handleCreateAssignment = v => withToast(() => pagesModel.create(v), "Page assignment created", () => setACreate(false));
  const handleEditAssignment = v => withToast(() => pagesModel.patch(aEdit.id, v), "Assignment updated", () => setAEdit(null));
  const handleDeleteAssignment = () => withToast(() => pagesModel.remove(aDel.id), "Assignment deleted", () => setADel(null));

  // Filter items/pages
  const handleItemFilter = val => {
    setItemFilterSection(val);
    val ? itemsModel.setFilter("section_id", val) : itemsModel.setFilter("section_id", undefined);
    itemsModel.setPage(1);
  };
  const handlePageFilter = val => {
    setPageFilter(val);
    val ? pagesModel.setFilter("page_name", val) : pagesModel.setFilter("page_name", undefined);
    pagesModel.setPage(1);
  };

  const sectionCols = [
    { key: "order", label: "#", render: v => <span className="text-slate-400 text-xs">{v}</span> },
    { key: "name", label: "Section Name" },
    { key: "section_type", label: "Type", render: v => <TypeBadge type={v} /> },
    { key: "title_display", label: "Display Title", render: v => v || "—" },
    { key: "max_items", label: "Max" },
    { key: "items_count", label: "Items" },
    { key: "pages_count", label: "Pages" },
    { key: "is_active", label: "Status", render: v => <span className={`text-xs font-medium px-2 py-0.5 rounded ${v ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
  ];

  const itemCols = [
    { key: "item_name", label: "Item", render: v => v || "—" },
    { key: "item_type", label: "Type", render: v => v === "product" ? <span className="text-xs text-blue-600 font-medium">Product</span> : <span className="text-xs text-purple-600 font-medium">Category</span> },
    { key: "order", label: "Order" },
    { key: "is_featured", label: "Featured", render: v => v ? <span className="text-xs font-medium text-amber-600">★ Featured</span> : <span className="text-xs text-slate-400">—</span> },
    { key: "special_price", label: "Special Price", render: v => v ? `৳${Number(v).toLocaleString()}` : "—" },
  ];

  const assignCols = [
    { key: "section", label: "Section", render: (v, row) => { const s = allSections.find(x => String(x.id) === String(v?.id ?? v)); return s?.name || "—"; } },
    { key: "page_name", label: "Page", render: v => PAGE_CHOICES.find(p => p.value === v)?.label || v },
    { key: "order", label: "Order" },
    { key: "items_per_row", label: "Columns" },
    { key: "is_active", label: "Status", render: v => <span className={`text-xs font-medium px-2 py-0.5 rounded ${v ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
  ];

  const ab = (row, onE, onD, onV) => (
    <div className="flex items-center justify-end gap-1">
      {onV && <button onClick={() => onV(row)} className="db-icon-btn"><Eye className="w-3.5 h-3.5" /></button>}
      <button onClick={() => onE(row)} className="db-icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={() => onD(row)} className="db-icon-btn danger"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <Container
      title="Page Sections"
      description="Manage sections, their items and page assignments"
      actions={
        tab === "sections" ? <button onClick={() => setSCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors"><Plus className="w-4 h-4" /> Add Section</button>
        : tab === "items" ? <button onClick={() => setICreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors"><Plus className="w-4 h-4" /> Add Item</button>
        : <button onClick={() => setACreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors"><Plus className="w-4 h-4" /> Add Assignment</button>
      }
    >
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {TABS.map(t => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-gray-900 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <Icon className="w-4 h-4" />{t.label}
          </button>
        ); })}
      </div>

      {/* Sections Tab */}
      {tab === "sections" && (
        <DataTable
          columns={sectionCols} data={sectionsModel.data} serverSide
          totalItems={sectionsModel.totalCount} currentPage={sectionsModel.params.page} pageSize={PAGE_SIZE}
          onSearch={q => { sectionsModel.setSearch(q); sectionsModel.setPage(1); }} onPageChange={sectionsModel.setPage}
          loading={sectionsModel.loading} searchable
          actions={row => ab(row, setSEdit, setSDel, setSView)}
        />
      )}

      {/* Items Tab */}
      {tab === "items" && (
        <>
          <div className="mb-4">
            <SearchableSelect
              value={itemFilterSection}
              onChange={handleItemFilter}
              placeholder="All Sections"
              options={[{ value: "", label: "All Sections" }, ...allSections.map(s => ({ value: s.id, label: s.name }))]}
              className="w-full sm:w-72"
            />
          </div>
          <DataTable
            columns={itemCols} data={itemsModel.data} serverSide
            totalItems={itemsModel.totalCount} currentPage={itemsModel.params.page} pageSize={PAGE_SIZE}
            onPageChange={itemsModel.setPage} loading={itemsModel.loading}
            actions={row => ab(row, setIEdit, setIDel, null)}
          />
        </>
      )}

      {/* Assignments Tab */}
      {tab === "pages" && (
        <>
          <div className="mb-4">
            <SearchableSelect
              value={pageFilter}
              onChange={handlePageFilter}
              placeholder="All Pages"
              options={[{ value: "", label: "All Pages" }, ...PAGE_CHOICES]}
              className="w-full sm:w-64"
            />
          </div>
          <DataTable
            columns={assignCols} data={pagesModel.data} serverSide
            totalItems={pagesModel.totalCount} currentPage={pagesModel.params.page} pageSize={PAGE_SIZE}
            onPageChange={pagesModel.setPage} loading={pagesModel.loading}
            actions={row => ab(row, setAEdit, setADel, null)}
          />
        </>
      )}

      {/* ── Section Modals ───────────────────────────────────── */}
      <Modal open={sCreate} onClose={() => setSCreate(false)} title="Add Section" maxWidth="max-w-2xl">
        <SectionForm onSubmit={handleCreateSection} submitLabel="Create Section" />
      </Modal>
      <Modal open={!!sEdit} onClose={() => setSEdit(null)} title="Edit Section" maxWidth="max-w-2xl">
        {sEdit && <SectionForm initial={{ ...sEdit, is_active: String(sEdit.is_active) }} onSubmit={handleEditSection} submitLabel="Save Changes" />}
      </Modal>
      <Modal open={!!sView} onClose={() => setSView(null)} title="Section Details" maxWidth="max-w-2xl">
        {sView && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <TypeBadge type={sView.section_type} />
              <h3 className="text-base font-semibold text-slate-800">{sView.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${sView.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{sView.is_active ? "Active" : "Inactive"}</span>
            </div>
            {sView.description && <p className="text-sm text-slate-500">{sView.description}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[["Display Title", sView.title_display||"—"],["Subtitle", sView.subtitle_display||"—"],["Order", sView.order],["Max Items", sView.max_items]].map(([k,val])=>(
                <div key={k} className="bg-slate-50 rounded-md p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="text-sm font-medium text-slate-800">{String(val)}</p>
                </div>
              ))}
            </div>
            {sView.section_type === "special_offer" && (
              <div className="bg-amber-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-amber-700 mb-1">Special Offer</p>
                <p className="text-slate-600">Discount: {sView.discount_percentage || "—"}%</p>
                {sView.offer_start_date && <p className="text-slate-500 text-xs">Start: {new Date(sView.offer_start_date).toLocaleString()}</p>}
                {sView.offer_end_date && <p className="text-slate-500 text-xs">End: {new Date(sView.offer_end_date).toLocaleString()}</p>}
              </div>
            )}
            <div className="flex gap-4 text-sm text-slate-500 pt-1 border-t border-slate-100">
              <span>{sView.items_count || 0} items</span>
              <span>{sView.pages_count || 0} active page assignments</span>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!sDel} onClose={() => setSDel(null)} onConfirm={handleDeleteSection} title="Delete Section" message={`Delete "${sDel?.name}"? All items and page assignments will also be removed.`} />

      {/* ── Item Modals ──────────────────────────────────────── */}
      <Modal open={iCreate} onClose={() => setICreate(false)} title="Add Items to Section" maxWidth="max-w-xl">
        <ItemForm isEdit={false} sections={allSections} products={allProducts} categories={allCats} onSubmit={handleCreateItem} submitLabel="Add Items" />
      </Modal>
      <Modal open={!!iEdit} onClose={() => setIEdit(null)} title="Edit Section Item" maxWidth="max-w-xl">
        {iEdit && <ItemForm isEdit={true} initial={iEdit} sections={allSections} products={allProducts} categories={allCats} onSubmit={handleEditItem} submitLabel="Save Changes" />}
      </Modal>
      <ConfirmDialog open={!!iDel} onClose={() => setIDel(null)} onConfirm={handleDeleteItem} title="Remove Item" message={`Remove "${iDel?.item_name || "this item"}" from its section?`} />

      {/* ── Assignment Modals ────────────────────────────────── */}
      <Modal open={aCreate} onClose={() => setACreate(false)} title="Add Page Assignment" maxWidth="max-w-xl">
        <AssignmentForm sections={allSections} onSubmit={handleCreateAssignment} submitLabel="Create Assignment" />
      </Modal>
      <Modal open={!!aEdit} onClose={() => setAEdit(null)} title="Edit Page Assignment" maxWidth="max-w-xl">
        {aEdit && <AssignmentForm initial={aEdit} sections={allSections} onSubmit={handleEditAssignment} submitLabel="Save Changes" />}
      </Modal>
      <ConfirmDialog open={!!aDel} onClose={() => setADel(null)} onConfirm={handleDeleteAssignment} title="Delete Assignment" message="Remove this page assignment?" />
    </Container>
  );
}


