"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, X, ImageIcon, Tag, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { offersService, productsService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 20;

const inp = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const lbl = "block text-sm font-medium text-slate-700 mb-1";

// ─── Product Info Card in Search Dropdown ────────────────────────────────────
function ProductDropdownItem({ product, onClick, alreadyAdded }) {
  const imgUrl = product.thumbnail_url || product.images?.[0]?.image || product.thumbnail || product.image;
  const price = parseFloat(product.price || 0);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const stock = product.stock || 0;
  const inStock = stock > 0;

  return (
    <div
      onClick={alreadyAdded ? undefined : onClick}
      className={`p-3 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
        alreadyAdded
          ? "cursor-default opacity-60 bg-slate-50"
          : "cursor-pointer hover:bg-emerald-50"
      }`}
    >
      {/* Product Image */}
      <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
        {imgUrl ? (
          <img src={imgUrl} className="w-full h-full object-cover" alt={product.name} />
        ) : (
          <ImageIcon className="w-6 h-6 text-slate-400" />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{product.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {product.category?.name && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                  <Tag className="w-2.5 h-2.5" /> {product.category.name}
                </span>
              )}
              {product.brand?.name && (
                <span className="text-[10px] text-slate-400">{product.brand.name}</span>
              )}
            </div>
          </div>

          {/* Stock & Added Badge */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {alreadyAdded ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Added
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                inStock
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}>
                <Package className="w-3 h-3" />
                {inStock ? `${stock} in stock` : "Out of stock"}
              </span>
            )}
          </div>
        </div>

        {/* Price Row */}
        <div className="flex items-center gap-2 mt-1.5">
          {discountPrice ? (
            <>
              <span className="text-sm font-bold text-amber-600">€{discountPrice.toFixed(2)}</span>
              <span className="text-xs text-slate-400 line-through">€{price.toFixed(2)}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold">
                -{Math.round(((price - discountPrice) / price) * 100)}%
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-800">€{price.toFixed(2)}</span>
          )}
          {product.unit && (
            <span className="text-[10px] text-slate-400">/ {product.unit}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Selected Product Row ─────────────────────────────────────────────────────
function SelectedProductRow({ item, idx, onRemove, onUpdatePrice }) {
  const prod = item.product || {};
  const imgUrl = prod.thumbnail_url || prod.images?.[0]?.image || prod.thumbnail || prod.image;
  const origPrice = parseFloat(prod.price || 0);
  const offerPrice = parseFloat(item.offer_price || 0);
  const savings = origPrice > 0 && offerPrice > 0 ? ((origPrice - offerPrice) / origPrice * 100).toFixed(0) : null;

  return (
    <div className="p-3 grid items-center gap-3 border-b last:border-b-0" style={{ gridTemplateColumns: "40px 1fr 110px 100px 36px" }}>
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        {imgUrl ? (
          <img src={imgUrl} className="w-full h-full object-cover" alt={prod.name} />
        ) : (
          <ImageIcon className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {/* Product Info */}
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate">{prod.name || "—"}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">
            Original: <span className="font-medium text-slate-700">€{origPrice.toFixed(2)}</span>
          </span>
          {savings && parseFloat(savings) > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">
              -{savings}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Original Price (static display) */}
      <div className="text-sm text-slate-500">
        €{prod.price || item.old_price || "—"}
      </div>

      {/* Offer Price Input */}
      <div>
        <input
          type="number"
          step="0.01"
          min="0"
          className={inp + " py-1 text-amber-600 font-semibold"}
          value={item.offer_price}
          onChange={e => onUpdatePrice(idx, e.target.value)}
          required
          placeholder="0.00"
        />
      </div>

      {/* Remove */}
      <div className="flex justify-center">
        <button style={{cursor: 'pointer'}}
          type="button"
          onClick={() => onRemove(idx)}
          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Offer Form ───────────────────────────────────────────────────────────────
function OfferForm({ initial = {}, onSubmit, submitLabel = "Save" }) {
  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [description, setDescription] = useState(initial.description || "");
  const [isActive, setIsActive] = useState(String(initial.is_active ?? true));
  const [startDate, setStartDate] = useState(initial.start_date || "");
  const [endDate, setEndDate] = useState(initial.end_date || "");

  const [banner, setBanner] = useState(null);
  const [preview, setPreview] = useState(initial.banner_image_url || initial.banner_image || "");
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState(initial.items || []);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleBanner = (e) => {
    const f = e.target.files?.[0];
    if (f) { setBanner(f); setPreview(URL.createObjectURL(f)); }
  };

  const searchProducts = async (q) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await productsService.list({ search: q, page_size: 8 });
      setSearchResults(res.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const isAlreadyAdded = (productId) => {
    return items.some(i => (i.product?.id || i.product_id || i.id) === productId);
  };

  const addProduct = (product) => {
    if (!isAlreadyAdded(product.id)) {
      // Use discount price if available, otherwise regular price
      const offerPrice = product.discount_price
        ? parseFloat(product.discount_price)
        : parseFloat(product.price || 0);
      setItems([...items, { product, offer_price: offerPrice }]);
    }
    setSearch("");
    setSearchResults([]);
  };

  const removeProduct = (idx) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  const updatePrice = (idx, price) => {
    const newItems = [...items];
    newItems[idx].offer_price = price;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      if (slug) fd.append("slug", slug);
      if (description) fd.append("description", description);
      fd.append("is_active", isActive === "true");
      if (startDate) fd.append("start_date", startDate);
      if (endDate) fd.append("end_date", endDate);
      if (banner) fd.append("banner_image", banner);

      const itemsPayload = items.map(item => ({
        product_id: item.product?.id || item.product_id || item.id,
        offer_price: item.offer_price
      }));
      fd.append("items_data", JSON.stringify(itemsPayload));

      await onSubmit(fd);
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Offer Details ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Offer Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Offer Title *</label><input required className={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Summer Special" /></div>
          <div><label className={lbl}>Slug</label><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" /></div>

          <div><label className={lbl}>Start Date</label><input type="datetime-local" className={`${inp} cursor-pointer`} value={startDate ? startDate.slice(0, 16) : ""} onChange={e => setStartDate(e.target.value)} /></div>
          <div><label className={lbl}>End Date</label><input type="datetime-local" className={`${inp} cursor-pointer`} value={endDate ? endDate.slice(0, 16) : ""} onChange={e => setEndDate(e.target.value)} /></div>

          <div>
            <label className={lbl}>Status</label>
            <SearchableSelect
              value={isActive}
              onChange={setIsActive}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </div>
        </div>
        <div><label className={lbl}>Description</label><textarea rows={3} className={inp + " resize-none"} value={description} onChange={e => setDescription(e.target.value)} placeholder="Offer description details..." /></div>

        {/* Banner Upload */}
        <div>
          <label className={lbl}>Banner Image</label>
          <div className="flex items-center gap-3">
            {preview && (
              <div className="relative w-32 h-16 rounded-md overflow-hidden border">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button style={{cursor: 'pointer'}} type="button" onClick={() => { setBanner(null); setPreview(""); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Upload Banner</span>
              <input type="file" accept="image/*" onChange={handleBanner} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* ── Products in Offer ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-semibold text-lg">Products in Offer</h3>
          {items.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
              {items.length} product{items.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>

        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search products by name to add..."
            className={inp}
            value={search}
            onChange={e => searchProducts(e.target.value)}
            autoComplete="off"
          />

          {/* Dropdown */}
          {search && (
            <div className="absolute z-20 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(p => (
                  <ProductDropdownItem
                    key={p.id}
                    product={p}
                    alreadyAdded={isAlreadyAdded(p.id)}
                    onClick={() => addProduct(p)}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No products found for &quot;{search}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Products Table */}
        {items.length > 0 ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-slate-50 px-3 py-2 grid gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200"
              style={{ gridTemplateColumns: "40px 1fr 110px 100px 36px" }}>
              <div></div>
              <div>Product</div>
              <div>Original Price</div>
              <div>Offer Price</div>
              <div></div>
            </div>

            {items.map((item, idx) => (
              <SelectedProductRow
                key={idx}
                item={item}
                idx={idx}
                onRemove={removeProduct}
                onUpdatePrice={updatePrice}
              />
            ))}

            {/* Summary */}
            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{items.length}</span> product{items.length !== 1 ? "s" : ""} in this offer
              </p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No products added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Search above to add products to this offer.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button style={{cursor: 'pointer'}} type="submit" disabled={submitting} className="px-6 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50 transition-colors">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}


export default function OffersPage() {
  const toast = useToastContext();
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [confirm, setConfirm] = useState({ open: false, item: null });

  const offers = useModel(offersService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => { toast.success(m); setModal({ open: false, mode: "create", item: null }); },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const columns = [
    { key: "banner_image_url", label: "", sortable: false, render: (v, row) => {
      const src = v || row.banner_image;
      return src
        ? <img src={src} alt="" className="w-16 h-8 rounded object-cover border" />
        : <div className="w-16 h-8 rounded bg-slate-100 flex items-center justify-center border border-dashed border-gray-300"><span className="text-xs text-slate-400">No Img</span></div>;
    }},
    { key: "title", label: "Offer Title" },
    { key: "start_date", label: "Start Date", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { key: "end_date", label: "End Date", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { key: "is_active", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v ? "Active" : "Inactive"}</span> },
  ];

  const handleSave = async (data) => {
    if (modal.mode === "edit") {
      await offers.patch(modal.item.slug, data);
    } else {
      await offers.create(data);
    }
  };

  const handleDelete = async () => {
    try {
      await offers.remove(confirm.item.slug);
      setConfirm({ open: false, item: null });
    } catch (_) {}
  };

  const actions = (row) => (
    <div className="flex items-center gap-1">
      <button style={{cursor: 'pointer'}} onClick={() => setModal({ open: true, mode: "edit", item: row })} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
      <button style={{cursor: 'pointer'}} onClick={() => setConfirm({ open: true, item: row })} className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <Container title="Offers & Promotions" description="Manage special offers, banners, and their active dates">
      <div className="flex items-center justify-end mb-4">
        <button style={{cursor: 'pointer'}} onClick={() => setModal({ open: true, mode: "create", item: null })} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041]">
          <Plus className="w-3.5 h-3.5" /> Add Offer
        </button>
      </div>

      <DataTable
        key="offers"
        columns={columns}
        data={offers.data}
        loading={offers.loading}
        actions={actions}
        serverSide
        totalItems={offers.totalCount}
        currentPage={offers.params.page || 1}
        pageSize={PAGE_SIZE}
        onSearch={(q) => { offers.setSearch(q); offers.setPage(1); }}
        onPageChange={offers.setPage}
        searchable
        emptyMessage="No offers found"
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: "create", item: null })} title={`${modal.mode === "edit" ? "Edit" : "Add"} Offer`}>
        <OfferForm initial={modal.mode === "edit" ? modal.item : {}} onSubmit={handleSave} submitLabel={modal.mode === "edit" ? "Update" : "Create"} />
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, item: null })} onConfirm={handleDelete} title="Delete Offer" message={`Are you sure you want to delete "${confirm.item?.title}"? This action cannot be undone.`} />
    </Container>
  );
}

