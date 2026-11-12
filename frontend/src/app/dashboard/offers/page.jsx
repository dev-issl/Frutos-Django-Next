"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  ImageIcon,
  Tag,
  Package,
  CheckCircle2,
  Eye,
  Calendar,
  CalendarDays,
  Search,
  Settings,
  Percent,
  Sparkles,
} from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { offersService, productsService } from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 20;
const QUICK_DISCOUNTS = [10, 20, 30, 40, 50];

const inp =
  "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700 focus:bg-white transition-all";
const lbl =
  "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function calcDiscountPct(origPrice, offerPrice) {
  const orig = Number(origPrice || 0);
  const sale = Number(offerPrice || 0);
  if (orig <= 0 || sale < 0 || sale >= orig) return 0;
  return round2(((orig - sale) / orig) * 100);
}

function calcOfferPrice(origPrice, pct) {
  const orig = Number(origPrice || 0);
  const cleanPct = Math.max(0, Math.min(100, Number(pct || 0)));
  if (orig <= 0) return "0.00";
  return round2(orig * (1 - cleanPct / 100)).toFixed(2);
}

function summarizeOfferBadge(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return { label: "No products", pct: 0, hasDiscount: false };
  }
  const pcts = items
    .map((it) => {
      const explicit = Number(it.discount_percentage ?? 0);
      if (explicit > 0) return Math.round(explicit);
      const orig = Number(it.product?.price || 0);
      const sale = Number(it.offer_price || 0);
      return Math.round(calcDiscountPct(orig, sale));
    })
    .filter((p) => p > 0);

  if (pcts.length === 0) {
    return { label: "Special Deal", pct: 0, hasDiscount: false };
  }
  const maxPct = Math.max(...pcts);
  const minPct = Math.min(...pcts);
  return {
    label: maxPct === minPct ? `Flat ${maxPct}% OFF` : `Up to ${maxPct}% OFF`,
    pct: maxPct,
    hasDiscount: true,
  };
}

function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return String(isoString).slice(0, 16);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function stripHtml(value) {
  if (!value || typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Offer View Modal ────────────────────────────────────────────────────────
function OfferViewModal({ open, offer, onClose }) {
  if (!open || !offer) return null;

  const badge = summarizeOfferBadge(offer.items || []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Eye size={17} className="text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Offer Details</p>
              <p className="text-xs text-slate-500">Badge: {badge.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              {offer.banner_image_url || offer.banner_image ? (
                <img
                  src={offer.banner_image_url || offer.banner_image}
                  className="w-full h-full object-cover"
                  alt="Banner"
                />
              ) : (
                <ImageIcon size={32} className="text-slate-300" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1.5">
                {offer.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 text-[11px] uppercase font-bold tracking-wider rounded-md ${
                    offer.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {offer.is_active ? "Active" : "Inactive"}
                </span>
                {badge.hasDiscount && (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-700">
                    {badge.label}
                  </span>
                )}
                <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                  Slug: {offer.slug}
                </span>
              </div>
            </div>
          </div>

          <p className="text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed">
            {stripHtml(offer.description) || "No description provided."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <CalendarDays size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Start Date
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {offer.start_date
                    ? new Date(offer.start_date).toLocaleString()
                    : "Not set"}
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  End Date
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {offer.end_date
                    ? new Date(offer.end_date).toLocaleString()
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Package size={14} /> Products in Offer ({offer.items?.length || 0})
              </h4>
            </div>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {offer.items?.length > 0 ? (
                offer.items.map((item, idx) => {
                  const orig = parseFloat(item.product?.price || 0);
                  const sale = parseFloat(item.offer_price || 0);
                  const pct = Math.round(
                    item.discount_percentage ?? calcDiscountPct(orig, sale)
                  );
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {item.product?.name || item.product_name || "Unknown Product"}
                        </p>
                        {orig > 0 && (
                          <p className="text-xs text-slate-400">
                            Original: €{orig.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pct > 0 && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            -{pct}%
                          </span>
                        )}
                        <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          €{sale.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-slate-400">
                  No products included in this offer.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Info Card in Search Dropdown ────────────────────────────────────
function ProductDropdownItem({ product, onClick, alreadyAdded, defaultPct }) {
  const imgUrl =
    product.thumbnail_url ||
    product.images?.[0]?.image ||
    product.thumbnail ||
    product.image;
  const price = parseFloat(product.price || 0);
  const stock = product.stock || 0;
  const inStock = Boolean(product.is_unlimited_stock) || stock > 0;
  const previewOfferPrice =
    defaultPct > 0 ? calcOfferPrice(price, defaultPct) : null;

  return (
    <div
      onClick={alreadyAdded ? undefined : onClick}
      className={`p-3 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
        alreadyAdded
          ? "cursor-default opacity-60 bg-slate-50"
          : "cursor-pointer hover:bg-emerald-50"
      }`}
    >
      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
        {imgUrl ? (
          <img
            src={imgUrl}
            className="w-full h-full object-cover"
            alt={product.name}
          />
        ) : (
          <ImageIcon className="w-5 h-5 text-slate-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">
              {product.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {product.category?.name && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                  <Tag className="w-2.5 h-2.5" /> {product.category.name}
                </span>
              )}
              {product.unit && (
                <span className="text-[10px] text-slate-400">
                  / {product.unit}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {alreadyAdded ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Added
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  inStock
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <Package className="w-3 h-3" />
                {product.is_unlimited_stock
                  ? "In stock"
                  : inStock
                  ? `${stock} left`
                  : "Out of stock"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-bold text-slate-700">
            €{price.toFixed(2)}
          </span>
          {previewOfferPrice && !alreadyAdded && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              -{defaultPct}% → €{previewOfferPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Selected Product Row with Bidirectional % <-> Price Sync ────────────────
function SelectedProductRow({
  item,
  idx,
  onRemove,
  onUpdatePercent,
  onUpdatePrice,
}) {
  const prod = item.product || {};
  const imgUrl =
    prod.thumbnail_url ||
    prod.images?.[0]?.image ||
    prod.thumbnail ||
    prod.image;
  const origPrice = parseFloat(prod.price || 0);
  const pctValue =
    item.discount_percentage !== undefined && item.discount_percentage !== null
      ? item.discount_percentage
      : "";
  const numericPct = parseFloat(pctValue || 0);

  return (
    <div className="p-3 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Left: Thumb + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
          {imgUrl ? (
            <img
              src={imgUrl}
              className="w-full h-full object-cover"
              alt={prod.name}
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-800 truncate leading-tight">
            {prod.name || "—"}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">
              Orig: €{origPrice.toFixed(2)}
            </span>
            {numericPct > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold inline-flex items-center gap-0.5">
                {round2(numericPct)}% OFF
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Discount % Input + Offer Price € Input + Remove */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Discount % */}
        <div className="w-24">
          <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Discount %
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0"
              max="99"
              value={pctValue}
              onChange={(e) => onUpdatePercent(idx, e.target.value)}
              placeholder="0"
              className="w-full pl-2.5 pr-6 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
            <Percent className="w-3 h-3 text-emerald-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Offer Price (€) */}
        <div className="w-28">
          <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Offer Price
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-sm">
              €
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={item.offer_price}
              onChange={(e) => onUpdatePrice(idx, e.target.value)}
              required
              placeholder="0.00"
              className="w-full pl-6 pr-2 py-1.5 bg-amber-50/60 border border-amber-200 rounded-lg text-sm font-bold text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={() => onRemove(idx)}
          title="Remove product"
          className="mt-4 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
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
  const [description, setDescription] = useState(
    stripHtml(initial.description || "")
  );
  const [isActive, setIsActive] = useState(String(initial.is_active ?? true));
  const [startDate, setStartDate] = useState(
    toDatetimeLocalValue(initial.start_date)
  );
  const [endDate, setEndDate] = useState(
    toDatetimeLocalValue(initial.end_date)
  );

  const [banner, setBanner] = useState(null);
  const [preview, setPreview] = useState(
    initial.banner_image_url || initial.banner_image || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState(() =>
    (initial.items || []).map((it) => {
      const orig = parseFloat(it.product?.price || 0);
      const sale = parseFloat(it.offer_price || 0);
      const pct =
        it.discount_percentage !== undefined && it.discount_percentage !== null
          ? Number(it.discount_percentage)
          : calcDiscountPct(orig, sale);
      return {
        ...it,
        offer_price: sale.toFixed(2),
        discount_percentage: pct > 0 ? String(round2(pct)) : "0",
      };
    })
  );

  const [defaultPct, setDefaultPct] = useState("30");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const badgePreview = useMemo(() => summarizeOfferBadge(items), [items]);

  const handleBanner = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setBanner(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSearchChange = (q) => {
    setSearch(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await productsService.list({ search: q.trim(), page_size: 8 });
        setSearchResults(res.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const isAlreadyAdded = (productId) => {
    return items.some(
      (i) => String(i.product?.id || i.product_id || i.id) === String(productId)
    );
  };

  const addProduct = (product) => {
    if (!isAlreadyAdded(product.id)) {
      const origPrice = parseFloat(product.price || 0);
      const pctNum = parseFloat(defaultPct);
      let offerPrice;
      let pctStr;

      if (!Number.isNaN(pctNum) && pctNum > 0 && origPrice > 0) {
        const clamped = Math.max(0, Math.min(99, pctNum));
        offerPrice = calcOfferPrice(origPrice, clamped);
        pctStr = String(clamped);
      } else if (product.discount_price && parseFloat(product.discount_price) < origPrice) {
        offerPrice = parseFloat(product.discount_price).toFixed(2);
        pctStr = String(calcDiscountPct(origPrice, offerPrice));
      } else {
        offerPrice = origPrice.toFixed(2);
        pctStr = "0";
      }

      setItems((prev) => [
        ...prev,
        {
          product,
          offer_price: offerPrice,
          discount_percentage: pctStr,
        },
      ]);
    }
    setSearch("");
    setSearchResults([]);
  };

  const removeProduct = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePercent = (idx, rawPct) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const origPrice = parseFloat(item.product?.price || 0);
        if (rawPct === "") {
          return { ...item, discount_percentage: "" };
        }
        const pctNum = Math.max(0, Math.min(99, parseFloat(rawPct) || 0));
        return {
          ...item,
          discount_percentage: rawPct,
          offer_price: origPrice > 0 ? calcOfferPrice(origPrice, pctNum) : item.offer_price,
        };
      })
    );
  };

  const updatePrice = (idx, rawPrice) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const origPrice = parseFloat(item.product?.price || 0);
        if (rawPrice === "") {
          return { ...item, offer_price: "", discount_percentage: "0" };
        }
        const priceNum = Math.max(0, parseFloat(rawPrice) || 0);
        const pct = origPrice > 0 ? calcDiscountPct(origPrice, priceNum) : 0;
        return {
          ...item,
          offer_price: rawPrice,
          discount_percentage: String(pct),
        };
      })
    );
  };

  const applyDiscountToAll = (pctInput) => {
    const pctNum = Math.max(0, Math.min(99, parseFloat(pctInput)));
    if (Number.isNaN(pctNum)) return;
    setDefaultPct(String(pctNum));
    setItems((prev) =>
      prev.map((item) => {
        const origPrice = parseFloat(item.product?.price || 0);
        return {
          ...item,
          discount_percentage: String(pctNum),
          offer_price: origPrice > 0 ? calcOfferPrice(origPrice, pctNum) : item.offer_price,
        };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      if (slug) fd.append("slug", slug);
      fd.append("description", description || "");
      fd.append("is_active", isActive === "true");
      if (startDate) fd.append("start_date", startDate);
      if (endDate) fd.append("end_date", endDate);
      if (banner) fd.append("banner_image", banner);

      const itemsPayload = items.map((item) => ({
        product_id: item.product?.id || item.product_id || item.id,
        offer_price: item.offer_price,
        discount_percentage:
          item.discount_percentage !== "" && item.discount_percentage != null
            ? Number(item.discount_percentage)
            : 0,
      }));
      fd.append("items_data", JSON.stringify(itemsPayload));

      await onSubmit(fd);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left: Offer Details Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-emerald-700" /> Offer Details
          </h3>

          <div>
            <label className={lbl}>Offer Title *</label>
            <input
              required
              className={inp}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mix fruits discount"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Slug (Optional)</label>
              <input
                className={inp}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated"
              />
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Start Date</label>
              <input
                type="datetime-local"
                className={`${inp} cursor-pointer`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>End Date (Valid Till)</label>
              <input
                type="datetime-local"
                className={`${inp} cursor-pointer`}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea
              rows={3}
              className={`${inp} resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enjoy a special discount on our fresh & juicy fruits collection."
            />
          </div>

          {/* Banner Upload */}
          <div>
            <label className={lbl}>Offer Banner / Card Image</label>
            <div className="flex flex-col mt-1">
              {preview ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs shrink-0">
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBanner(null);
                      setPreview("");
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/95 text-red-500 hover:text-red-600 rounded-lg flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1.5 w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-colors group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">
                    Upload Offer Image
                  </span>
                  <span className="text-xs text-slate-400">
                    Optional — seasonal fallback used if omitted
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBanner}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Products & Discount % Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col min-h-[540px] max-h-[650px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3 shrink-0 flex-wrap">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" /> Products &amp; Discounts
            </h3>
            <div className="flex items-center gap-2">
              {badgePreview.hasDiscount && (
                <span className="text-[11px] px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {badgePreview.label}
                </span>
              )}
              {items.length > 0 && (
                <span className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                  {items.length} Selected
                </span>
              )}
            </div>
          </div>

          {/* Default / Bulk Discount % Controls */}
          <div className="mb-3 p-3 rounded-xl bg-[#F4F8F2] border border-[#DCE8D8] shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold text-[#084737] flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-700" />
                Discount % (for new &amp; selected products)
              </span>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => applyDiscountToAll(defaultPct)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#0B4635] hover:bg-[#073427] text-white transition-colors cursor-pointer"
                >
                  Apply {defaultPct || 0}% to All ({items.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_DISCOUNTS.map((pct) => {
                const active = Number(defaultPct) === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDefaultPct(String(pct))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      active
                        ? "bg-[#0B4635] text-white border-[#0B4635]"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}

              <div className="relative w-20 ml-auto">
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  value={defaultPct}
                  onChange={(e) => setDefaultPct(e.target.value)}
                  placeholder="%"
                  className="w-full pl-2.5 pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                />
                <Percent className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name to add..."
              className={`${inp} pl-10 bg-slate-50/70`}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoComplete="off"
            />

            {search && (
              <div className="absolute z-30 w-full bg-white border border-slate-200 mt-1 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-sm font-semibold text-slate-500">
                    <div className="inline-block w-4 h-4 border-2 border-slate-300 border-t-emerald-700 rounded-full animate-spin mr-2" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <ProductDropdownItem
                      key={p.id}
                      product={p}
                      alreadyAdded={isAlreadyAdded(p.id)}
                      defaultPct={Number(defaultPct) || 0}
                      onClick={() => addProduct(p)}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500 font-medium">
                    No products found for &quot;{search}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Products List */}
          <div className="flex-1 overflow-hidden flex flex-col border border-slate-200 rounded-xl bg-slate-50/40">
            {items.length > 0 ? (
              <div className="flex-1 overflow-y-auto bg-white divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <SelectedProductRow
                    key={item.product?.id || item.product_id || idx}
                    item={item}
                    idx={idx}
                    onRemove={removeProduct}
                    onUpdatePercent={updatePercent}
                    onUpdatePrice={updatePrice}
                  />
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3 border border-slate-200">
                  <Package className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  No products added yet
                </p>
                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[240px]">
                  Pick a discount % above and search to add products with custom
                  discounts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-5 mt-6 border-t border-slate-200">
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 text-sm font-black tracking-wide bg-[#00694C] text-white rounded-xl hover:bg-[#085041] disabled:opacity-50 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto cursor-pointer"
        >
          {submitting ? "SAVING..." : submitLabel.toUpperCase()}
        </button>
      </div>
    </form>
  );
}

export default function OffersPage() {
  const toast = useToastContext();
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [viewModal, setViewModal] = useState({ open: false, item: null });
  const [confirm, setConfirm] = useState({ open: false, item: null });

  const offers = useModel(offersService, {
    defaultParams: { page_size: PAGE_SIZE, page: 1 },
    paginated: true,
    onSuccess: (m) => {
      toast.success(m);
      setModal({ open: false, mode: "create", item: null });
    },
    onError: (e) => toast.error(e?.message || "Operation failed"),
  });

  const columns = [
    {
      key: "banner_image_url",
      label: "Banner",
      sortable: false,
      render: (v, row) => {
        const src = v || row.banner_image;
        return src ? (
          <img
            src={src}
            alt=""
            className="w-16 h-9 rounded object-cover border cursor-pointer"
          />
        ) : (
          <div className="w-16 h-9 rounded bg-slate-100 flex items-center justify-center border border-dashed border-gray-300 cursor-pointer">
            <span className="text-[10px] text-slate-400">Fallback</span>
          </div>
        );
      },
    },
    {
      key: "title",
      label: "Offer Title",
      render: (v) => (
        <span className="font-semibold text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors">
          {v}
        </span>
      ),
    },
    {
      key: "items",
      label: "Products",
      sortable: false,
      render: (items) => (
        <span className="text-xs font-semibold text-slate-600">
          {Array.isArray(items) ? items.length : 0} items
        </span>
      ),
    },
    {
      key: "discount_summary",
      label: "Discount Badge",
      sortable: false,
      render: (_, row) => {
        const badge = summarizeOfferBadge(row.items || []);
        return badge.hasDiscount ? (
          <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {badge.label}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        );
      },
    },
    {
      key: "end_date",
      label: "Valid Till",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      key: "is_active",
      label: "Status",
      render: (v) => (
        <span
          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
            v
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {v ? "Active" : "Inactive"}
        </span>
      ),
    },
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
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewModal({ open: true, item: row });
        }}
        className="p-1.5 rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModal({ open: true, mode: "edit", item: row });
        }}
        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirm({ open: true, item: row });
        }}
        className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <Container
      title="Offers & Promotions"
      description="Create offers, select products, and configure per-product percentage discounts"
    >
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={() => setModal({ open: true, mode: "create", item: null })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#00694C] text-white rounded-xl hover:bg-[#085041] shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Offer
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
        onSearch={(q) => {
          offers.setSearch(q);
          offers.setPage(1);
        }}
        onPageChange={offers.setPage}
        onRowClick={(row) => setViewModal({ open: true, item: row })}
        searchable
        emptyMessage="No offers found"
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "create", item: null })}
        title={`${modal.mode === "edit" ? "Edit" : "Create"} Offer`}
        maxWidth="max-w-5xl"
      >
        <OfferForm
          key={modal.item?.id || "new"}
          initial={modal.mode === "edit" ? modal.item : {}}
          onSubmit={handleSave}
          submitLabel={modal.mode === "edit" ? "Update Offer" : "Create Offer"}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, item: null })}
        onConfirm={handleDelete}
        title="Delete Offer"
        message={`Are you sure you want to delete "${confirm.item?.title}"? This action cannot be undone.`}
      />

      <OfferViewModal
        open={viewModal.open}
        offer={viewModal.item}
        onClose={() => setViewModal({ open: false, item: null })}
      />
    </Container>
  );
}
