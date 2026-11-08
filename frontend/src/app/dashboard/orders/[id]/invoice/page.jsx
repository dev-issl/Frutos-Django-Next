"use client";

import { useState, useEffect } from "react";
import { Printer, Download, ArrowLeft, Loader2, FileText, Receipt, ChevronDown, Table, Code, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ordersService, siteSettingsService, productsService } from "@/app/dashboard/_lib/services";
import api from "@/app/dashboard/_lib/api";

/* ─── POS Receipt Layout (thermal 80mm) ─── */
function POSInvoice({ order, items, subtotal, total, shipping, storeName, logoUrl, contactEmail, contactPhone, contactAddress }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm mx-auto print:shadow-none print:border-0" style={{ maxWidth: "80mm" }}>
      <div className="p-4 print:p-2 text-center" style={{ fontFamily: "monospace", fontSize: "12px" }}>
        {/* Header */}
        <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} style={{ height: '32px', width: 'auto', maxWidth: '120px' }} className="mx-auto mb-1 object-contain" />
          ) : (
            <p className="font-bold text-base text-slate-800">{storeName}</p>
          )}
          {contactAddress && <p className="text-[10px] text-slate-500">{contactAddress}</p>}
          {contactEmail && <p className="text-[10px] text-slate-500">{contactEmail}</p>}
          {contactPhone && <p className="text-[10px] text-slate-500">{contactPhone}</p>}
        </div>

        {/* Order Info */}
        <div className="text-left mb-2 text-[11px] text-slate-700">
          <p>Order: <span className="font-semibold">{order.order_number}</span></p>
          <p>Date: {order.ordered_at ? new Date(order.ordered_at).toLocaleString() : "—"}</p>
          <p>Customer: {order.customer_name}</p>
          {order.customer_phone && <p>Phone: {order.customer_phone}</p>}
          {(order.street_address || order.city) && (
            <p>
              Address: {order.street_address}{order.city && `, ${order.city}`}{order.postcode && ` - ${order.postcode}`}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-b border-dashed border-gray-300 mb-2" />

        {/* Items */}
        <div className="text-left text-[11px]">
          {items.map((item, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between text-slate-800">
                <span className="flex-1 truncate pr-2">{item.product_name || `#${item.product}`}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>
                  {item.quantity} x €{Number(item.unit_price).toLocaleString()}
                  {(item.color_name || item.size_name) && ` (${[item.color_name, item.size_name].filter(Boolean).join("/")})`}
                </span>
                <span className="text-slate-800 font-medium">€{(item.quantity * Number(item.unit_price)).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-b border-dashed border-gray-300 my-2" />

        {/* Totals */}
        <div className="text-[11px] space-y-0.5">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span><span>€{subtotal.toLocaleString()}</span>
          </div>
          {shipping > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span><span>€{shipping.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm text-slate-800 pt-1 border-t border-dashed border-gray-300 mt-1">
            <span>TOTAL</span><span>€{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment */}
        {(order.payment || order.payment_method) && (
          <div className="text-left text-[10px] text-slate-500 mt-2 pt-2 border-t border-dashed border-gray-300">
            <p>Payment: {order.payment?.payment_method?.toLowerCase() === 'tpv' || order.payment_method?.toLowerCase() === 'tpv' ? 'TPV (Virtual POS)' : (order.payment?.payment_method || order.payment_method || "—")}</p>
            {order.payment?.transaction_id && <p>Txn: {order.payment.transaction_id}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-dashed border-gray-300 mt-2 pt-2">
          <p className="text-[10px] text-slate-400">Thank you for shopping!</p>
          <p className="text-[10px] text-slate-400">www.elarbol.com</p>
          {logoUrl && <p className="text-[10px] text-slate-400">{storeName}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── A4 Full Invoice Layout ─── */
function A4Invoice({ order, items, subtotal, total, shipping, storeName, logoUrl, contactEmail, contactPhone, contactAddress }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-w-3xl mx-auto print:shadow-none print:border-0 print:max-w-none">
      <div className="p-8 print:p-12" style={{ minHeight: "297mm", maxWidth: "210mm", margin: "0 auto" }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} style={{ height: '48px', width: 'auto', maxWidth: '200px' }} className="mb-2 object-contain" />
            ) : (
              <h1 className="text-2xl font-bold text-slate-800">{storeName}</h1>
            )}
            {contactAddress && <p className="text-sm text-slate-500 mt-1">{contactAddress}</p>}
            {contactEmail && <p className="text-sm text-slate-500">{contactEmail}</p>}
            {contactPhone && <p className="text-sm text-slate-500">{contactPhone}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-slate-800">INVOICE</h2>
            <p className="text-sm text-slate-500 mt-1">#{order.order_number}</p>
            <p className="text-sm text-slate-500">
              Date: {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
            <p className="text-sm text-slate-500">Status: {order.status_display || order.status}</p>
          </div>
        </div>

        {/* Bill To + Payment */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Bill To</p>
            <p className="text-sm font-medium text-slate-800">{order.customer_name}</p>
            <p className="text-sm text-slate-500">{order.customer_email}</p>
            {order.customer_phone && <p className="text-sm text-slate-500">{order.customer_phone}</p>}
            {(order.street_address || order.city) && (
              <p className="text-sm text-slate-500 mt-1">
                {order.street_address}
                <br />
                {order.city} {order.postcode && `- ${order.postcode}`}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Payment</p>
            <p className="text-sm text-slate-700">Method: {order.payment?.payment_method?.toLowerCase() === 'tpv' || order.payment_method?.toLowerCase() === 'tpv' ? 'TPV (Virtual POS)' : (order.payment?.payment_method || order.payment_method || "—")}</p>
            {order.payment?.transaction_id && <p className="text-sm text-slate-500">Txn: {order.payment.transaction_id}</p>}
            {order.payment?.sender_number && <p className="text-sm text-slate-500">Sender: {order.payment.sender_number}</p>}
            <p className="text-sm text-slate-500">Payment: {order.payment_status_display || order.payment_status || "Pending"}</p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 text-left font-medium text-slate-500">#</th>
              <th className="py-2 text-left font-medium text-slate-500">Item</th>
              <th className="py-2 text-left font-medium text-slate-500">Size</th>
              <th className="py-2 text-center font-medium text-slate-500">Qty</th>
              <th className="py-2 text-right font-medium text-slate-500">Price</th>
              <th className="py-2 text-right font-medium text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 text-slate-400">{i + 1}</td>
                  <td className="py-3 text-slate-800">{item.product_name || item.product || 'Unknown Product'}</td>
                  <td className="py-3 text-slate-500 text-xs">{item.size_name || item.size || "—"}</td>
                  <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-600">€{Number(item.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-3 text-right font-medium text-slate-800">€{(item.quantity * Number(item.unit_price)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-400 border-b border-slate-100">No items found for this order.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal (Without Tax)</span>
              <span className="text-slate-800 font-medium">€{(subtotal / 1.21).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax (IVA 21%)</span>
              <span className="text-slate-800 font-medium">€{(subtotal - (subtotal / 1.21)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
              <span className="text-slate-500">Subtotal (With Tax)</span>
              <span className="text-slate-800 font-medium">€{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-800 font-medium">€{shipping.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-3 border-t-2 border-slate-800 mt-2">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">€{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Tracking */}
        {order.tracking_number && (
          <div className="mt-6 text-sm text-slate-500">
            <span className="font-medium">Tracking #:</span> {order.tracking_number}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">Thank you for your business.</p>
          <p className="text-xs text-slate-400 mt-0.5">{storeName}{contactEmail && ` · ${contactEmail}`}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Wholesale Invoice Layout ─── */
function WholesaleInvoice({ order, items, total, storeName, allProducts = [] }) {
  // Helpers
  const formatClass = (val) => {
    if (!val) return "";
    return String(val)
      .replace(/^(class|clase)\s+/i, "")
      .replace(/^calidad\s+/i, "")
      .trim();
  };

  const cleanUnit = (unit) => {
    if (!unit) return "KG";
    return String(unit).replace(/^per\s+/i, "").trim().toUpperCase();
  };

  const formatPrice = (val) => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return "";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  const getCategoryPriority = (name = "") => {
    const norm = String(name)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (
      norm.includes("frutas y verduras") ||
      norm.includes("frutas") ||
      norm.includes("verduras") ||
      norm.includes("fruta") ||
      norm.includes("verdura") ||
      norm.includes("fruit")
    ) {
      return 0; // Highest priority: FRUTAS Y VERDURAS always first
    }
    return 1;
  };

  const orderedItemsMap = items.reduce((acc, item) => {
    if (item && item.product) {
      acc[item.product] = item;
      acc[String(item.product)] = item;
    }
    return acc;
  }, {});

  // Determine if this order is External Wholesale or Internal Wholesale
  const getWholesaleType = (o) => {
    const ut = (o?.user_type || o?.wholesale_user_type || o?.wholesale_user?.user_type || "").toUpperCase();
    if (ut === "RESTAURANT" || ut === "EXTERNAL_WHOLESALE" || ut.includes("RESTAURANT") || ut.includes("EXTERNAL")) {
      return "EXTERNAL";
    }
    if (ut === "WHOLESALER" || ut === "INTERNAL_WHOLESALE" || ut === "WHOLESALE" || ut.includes("INTERNAL")) {
      return "INTERNAL";
    }
    if (o?.is_wholesale_order) {
      const ct = (o?.customer_type || o?.shop_type || "").toUpperCase();
      if (ct.includes("RESTAURANT") || ct.includes("EXTERNAL")) return "EXTERNAL";
      return "INTERNAL";
    }
    return "INTERNAL";
  };

  const isExternalWholesale = getWholesaleType(order) === "EXTERNAL";
  const isInternalWholesale = !isExternalWholesale;

  // For External Wholesale: ONLY take products that were actually ordered in this order!
  // For Internal Wholesale: full warehouse picking catalogue
  let targetProducts = [];
  if (isExternalWholesale) {
    const productsInOrder = allProducts.filter(
      (p) => !!orderedItemsMap[p.id] || !!orderedItemsMap[String(p.id)]
    );
    const foundIds = new Set(productsInOrder.map((p) => String(p.id)));

    // Ensure any ordered item not found in allProducts is still rendered
    const missingItems = items.filter(
      (it) => it && it.product && !foundIds.has(String(it.product))
    );
    const syntheticProducts = missingItems.map((it) => ({
      id: it.product,
      name: it.product_name || "Ordered Product",
      category_name: it.category_name || "FRUTAS Y VERDURAS",
      sub_category_name: it.sub_category_name || "General",
      variant: it.size_name || it.variant || "",
      wholesale_unit: it.size_name || it.unit || "KG",
      wholesale_price: it.unit_price,
    }));

    targetProducts = [...productsInOrder, ...syntheticProducts];
  } else {
    // For Internal Wholesale: full catalogue picking list
    const foundIds = new Set(allProducts.map((p) => String(p.id)));
    const missingItems = items.filter(
      (it) => it && it.product && !foundIds.has(String(it.product))
    );
    const syntheticProducts = missingItems.map((it) => ({
      id: it.product,
      name: it.product_name || "Ordered Product",
      category_name: it.category_name || "FRUTAS Y VERDURAS",
      sub_category_name: it.sub_category_name || "General",
      variant: it.size_name || it.variant || "",
      wholesale_unit: it.size_name || it.unit || "KG",
      wholesale_price: it.unit_price,
    }));
    targetProducts = [...allProducts, ...syntheticProducts];
  }

  // Group by Category and Subcategory
  const productsByCategoryAndSub = targetProducts.reduce((acc, p) => {
    const cat = (p.category_name || (p.category && p.category.name) || "FRUTAS Y VERDURAS").trim();
    const subcat = (p.sub_category_name || (p.sub_category && p.sub_category.name) || "General").trim();

    if (!acc[cat]) acc[cat] = {};
    if (!acc[cat][subcat]) acc[cat][subcat] = [];
    acc[cat][subcat].push(p);
    return acc;
  }, {});

  const orderDate = order.ordered_at 
    ? new Date(order.ordered_at).toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : "";

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-w-4xl mx-auto print:shadow-none print:border-0 print:max-w-none">
      <div className="p-3 sm:p-4 print:p-6" style={{ minHeight: "297mm", margin: "0 auto" }}>
        
        {/* Simple Header */}
        <div className="flex justify-between items-end border-b-2 border-black pb-1.5 mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-black uppercase tracking-wide">
              Tienda: {storeName}
            </h1>
            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
              isExternalWholesale ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isExternalWholesale ? "External Wholesale" : "Internal Wholesale"}
            </span>
          </div>
          <div className="text-xs font-bold text-black">
            #{order.order_number} {orderDate && `| Fecha: ${orderDate}`}
          </div>
        </div>

        {/* Items Grid (Warehouse Picking List / Compact Invoice) */}
        <div className="mb-4 space-y-3">
          {Object.keys(productsByCategoryAndSub).length > 0 ? (
            Object.entries(productsByCategoryAndSub)
              .sort(([catA, subA], [catB, subB]) => {
                // 1. "FRUTAS Y VERDURAS" always first
                const prioA = getCategoryPriority(catA);
                const prioB = getCategoryPriority(catB);
                if (prioA !== prioB) return prioA - prioB;

                // 2. Categories with ordered products come before un-ordered ones
                const hasOrderedA = Object.values(subA).some(sub => sub.some(p => orderedItemsMap[p.id] || orderedItemsMap[String(p.id)]));
                const hasOrderedB = Object.values(subB).some(sub => sub.some(p => orderedItemsMap[p.id] || orderedItemsMap[String(p.id)]));
                if (hasOrderedA && !hasOrderedB) return -1;
                if (!hasOrderedA && hasOrderedB) return 1;

                return catA.localeCompare(catB);
              })
              .map(([category, subcategories]) => (
              <div key={category} className="break-inside-avoid">
                {/* Category Header */}
                <div className="bg-slate-200 print:bg-slate-200 border-b border-slate-300 px-2.5 py-0.5 mb-1.5 rounded-t-sm flex items-center justify-between">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                    {category}
                  </h4>
                </div>
                
                {Object.entries(subcategories)
                  .sort(([subA, prodsA], [subB, prodsB]) => {
                    const hasOrderedA = prodsA.some(p => orderedItemsMap[p.id] || orderedItemsMap[String(p.id)]);
                    const hasOrderedB = prodsB.some(p => orderedItemsMap[p.id] || orderedItemsMap[String(p.id)]);
                    if (hasOrderedA && !hasOrderedB) return -1;
                    if (!hasOrderedA && hasOrderedB) return 1;

                    if (subA === "General" || subA === "Others") return 1;
                    if (subB === "General" || subB === "Others") return -1;
                    return subA.localeCompare(subB);
                  })
                  .map(([subcat, prods]) => (
                    <div key={subcat} className="mb-2">
                      <div className="bg-slate-100 print:bg-slate-100 border border-b-0 border-slate-300 px-2 py-0.5 rounded-t-sm inline-block">
                        <h5 className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wider">
                          {subcat}
                        </h5>
                      </div>

                      {/* Compact Grid with No Empty Spaces */}
                      <div className={`grid ${
                        isExternalWholesale 
                          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" 
                          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
                      } border-l border-t border-slate-300`}>
                        {prods
                          .sort((p1, p2) => {
                            const o1 = (orderedItemsMap[p1.id] || orderedItemsMap[String(p1.id)]) ? 1 : 0;
                            const o2 = (orderedItemsMap[p2.id] || orderedItemsMap[String(p2.id)]) ? 1 : 0;
                            if (o1 !== o2) return o2 - o1;
                            return p1.name.localeCompare(p2.name);
                          })
                          .map((p) => {
                            const ordered = orderedItemsMap[p.id] || orderedItemsMap[String(p.id)];
                            const classCode = formatClass(p.variant || (ordered && ordered.size_name) || p.quality);
                            const unitCode = cleanUnit(p.wholesale_unit || p.unit || (ordered && ordered.size_name) || "KG");
                            const rawPrice = ordered ? (ordered.unit_price || p.wholesale_price || p.price) : (p.wholesale_price || p.price);
                            const priceStr = formatPrice(rawPrice);

                            return (
                              <div
                                key={p.id}
                                className={`flex items-center justify-between border-r border-b border-slate-300 px-2 py-1 text-[11px] leading-tight ${
                                  ordered ? "bg-slate-50 print:bg-slate-50 font-medium" : "bg-white"
                                }`}
                                style={{ minHeight: "30px" }}
                              >
                                {/* Name, Quantity, Class, Price all compact in one flow */}
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 py-0.5">
                                  <span
                                    className={`uppercase truncate ${
                                      ordered ? "font-bold text-slate-900 text-[11px]" : "text-slate-700 text-[10.5px]"
                                    }`}
                                    title={p.name}
                                  >
                                    {p.name}
                                  </span>

                                  {ordered && (
                                    <div className="inline-flex items-center gap-1 shrink-0">
                                      {/* Quantity right next to name */}
                                      <span className="inline-flex items-center px-1.5 py-[1px] bg-slate-200/90 print:bg-slate-200 text-slate-900 rounded font-black text-[10px] whitespace-nowrap">
                                        {ordered.quantity} {unitCode}
                                      </span>

                                      {/* Class: just A, B, C */}
                                      {classCode && (
                                        <span className="inline-flex items-center px-1 py-[1px] bg-slate-800 print:bg-slate-800 text-white rounded font-black text-[9px] uppercase tracking-tight shrink-0">
                                          {classCode}
                                        </span>
                                      )}

                                      {/* Price */}
                                      {priceStr && (
                                        <span className="text-slate-900 font-black text-[10.5px] whitespace-nowrap">
                                          €{priceStr}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Internal wholesale un-ordered item check area */}
                                {!ordered && (
                                  <div className="w-7 shrink-0 flex items-center justify-end pl-1">
                                    <span className="w-5 h-3.5 border border-dashed border-slate-300 rounded-[2px]" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-lg">
              {isExternalWholesale ? "No ordered wholesale products found for this order." : "Loading products grid..."}
            </div>
          )}
        </div>

        {/* Order Summary / Totals */}
        <div className="flex justify-between items-center border-t-2 border-black pt-2 mt-4 text-xs font-bold">
          <div className="text-slate-600">
            Total Items: <span className="text-black">{items.length}</span>
          </div>
          <div className="text-right text-sm">
            Total: <span className="text-black font-black">€{Number(total || order.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Main Invoice Page ─── */
export default function InvoicePage() {
  const { id } = useParams();
  // Read ?type=pos from URL after mount (avoids useSearchParams/Suspense requirement)
  const [invoiceType, setInvoiceType] = useState("a4");
  const [downloading, setDownloading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#download-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: settingsRaw } = useSWR(
    "site-settings-invoice",
    () => siteSettingsService.list({ page_size: 100 }),
    { revalidateOnFocus: false }
  );
  const settingsMap = {};
  (settingsRaw?.results || (Array.isArray(settingsRaw) ? settingsRaw : [])).forEach(s => { settingsMap[s.key] = s.value; });
  const storeName = settingsMap.store_name || "El-Arbol";
  const logoUrl = settingsMap.logo_url || null;
  const contactEmail = settingsMap.contact_email || "";
  const contactPhone = settingsMap.contact_phone || "";
  const contactAddress = settingsMap.contact_address || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("type") === "pos") setInvoiceType("pos");
    }
  }, []);

  const { data: order, isLoading, error } = useSWR(
    id ? ["order-invoice-detail", id] : null,
    () => ordersService.get(id),
    { revalidateOnFocus: false }
  );

  const isWholesaleOrder = Boolean(
    order?.is_wholesale_order ||
    order?.user_type === "WHOLESALER" ||
    order?.user_type === "RESTAURANT" ||
    order?.wholesale_user_id
  );

  const { data: productsRaw } = useSWR(
    isWholesaleOrder ? "all-products-invoice" : null,
    () => productsService.list({ page_size: 1000 }),
    { revalidateOnFocus: false }
  );
  const allProducts = productsRaw?.results || [];

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setDropdownOpen(false);
    try {
      const element = document.getElementById("invoice-print-area");
      if (!element) throw new Error("Invoice area not found");
      
      // Inject CSS to fix Tailwind V4 html2canvas lab color issue
      const style = document.createElement('style');
      style.innerHTML = `
        #invoice-print-area .text-slate-900 { color: #0f172a !important; }
        #invoice-print-area .text-slate-800 { color: #1e293b !important; }
        #invoice-print-area .text-slate-700 { color: #334155 !important; }
        #invoice-print-area .text-slate-600 { color: #475569 !important; }
        #invoice-print-area .text-slate-500 { color: #64748b !important; }
        #invoice-print-area .text-slate-400 { color: #94a3b8 !important; }
        #invoice-print-area .text-slate-300 { color: #cbd5e1 !important; }
        #invoice-print-area .text-black { color: #000000 !important; }
        #invoice-print-area .text-white { color: #ffffff !important; }
        #invoice-print-area .bg-slate-800 { background-color: #1e293b !important; }
        #invoice-print-area .bg-slate-200 { background-color: #e2e8f0 !important; }
        #invoice-print-area .bg-slate-100 { background-color: #f1f5f9 !important; }
        #invoice-print-area .bg-slate-50 { background-color: #f8fafc !important; }
        #invoice-print-area .bg-white { background-color: #ffffff !important; }
        #invoice-print-area .bg-slate-200\\/50 { background-color: rgba(226, 232, 240, 0.5) !important; }
        #invoice-print-area .border-slate-800 { border-color: #1e293b !important; }
        #invoice-print-area .border-slate-400 { border-color: #94a3b8 !important; }
        #invoice-print-area .border-slate-300 { border-color: #cbd5e1 !important; }
        #invoice-print-area .border-slate-200 { border-color: #e2e8f0 !important; }
        #invoice-print-area .border-slate-100 { border-color: #f1f5f9 !important; }
        #invoice-print-area .border-gray-300 { border-color: #d1d5db !important; }
        #invoice-print-area .border-black { border-color: #000000 !important; }
      `;
      document.head.appendChild(style);

      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin:       10,
        filename:     `invoice-${id}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 3, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if (invoiceType === "pos" && !order.is_wholesale_order) {
         opt.jsPDF = { unit: 'mm', format: [80, 297], orientation: 'portrait' };
         opt.margin = 2;
      }

      await html2pdf().set(opt).from(element).save();
      document.head.removeChild(style);

    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback to browser print which handles Tailwind V4 properly
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const generateExportData = () => {
    let exportData = [];
    
    if (isWholesaleOrder) {
        const getWholesaleType = (o) => {
          const ut = (o?.user_type || o?.wholesale_user_type || o?.wholesale_user?.user_type || "").toUpperCase();
          if (ut === "RESTAURANT" || ut === "EXTERNAL_WHOLESALE" || ut.includes("RESTAURANT") || ut.includes("EXTERNAL")) {
            return "EXTERNAL";
          }
          if (ut === "WHOLESALER" || ut === "INTERNAL_WHOLESALE" || ut === "WHOLESALE" || ut.includes("INTERNAL")) {
            return "INTERNAL";
          }
          if (o?.is_wholesale_order) {
            const ct = (o?.customer_type || o?.shop_type || "").toUpperCase();
            if (ct.includes("RESTAURANT") || ct.includes("EXTERNAL")) return "EXTERNAL";
            return "INTERNAL";
          }
          return "INTERNAL";
        };
        const isExternalWholesale = getWholesaleType(order) === "EXTERNAL";

        const orderedItemsMap = items.reduce((acc, item) => {
          if (item && item.product) {
            acc[item.product] = item;
            acc[String(item.product)] = item;
          }
          return acc;
        }, {});

        const formatClass = (val) => {
          if (!val) return "";
          return String(val)
            .replace(/^(class|clase)\s+/i, "")
            .replace(/^calidad\s+/i, "")
            .trim();
        };

        const cleanUnit = (unit) => {
          if (!unit) return "KG";
          return String(unit).replace(/^per\s+/i, "").trim().toUpperCase();
        };

        const getCategoryPriority = (name = "") => {
          const norm = String(name)
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          if (
            norm.includes("frutas y verduras") ||
            norm.includes("frutas") ||
            norm.includes("verduras") ||
            norm.includes("fruta") ||
            norm.includes("verdura") ||
            norm.includes("fruit")
          ) {
            return 0;
          }
          return 1;
        };
        
        let targetList = allProducts;
        if (isExternalWholesale) {
          targetList = allProducts.filter(p => !!orderedItemsMap[p.id] || !!orderedItemsMap[String(p.id)]);
        }

        const sortedProducts = [...targetList].sort((a, b) => {
           const catA = String(a.category_name || a.category || "FRUTAS Y VERDURAS");
           const catB = String(b.category_name || b.category || "FRUTAS Y VERDURAS");
           
           const prioA = getCategoryPriority(catA);
           const prioB = getCategoryPriority(catB);
           if (prioA !== prioB) return prioA - prioB;
           if (catA.toLowerCase() !== catB.toLowerCase()) return catA.localeCompare(catB);
           
           const subA = String(a.subcategory_name || a.subcategory || "General");
           const subB = String(b.subcategory_name || b.subcategory || "General");
           if (subA.toLowerCase() !== subB.toLowerCase()) return subA.localeCompare(subB);
           
           return String(a.name || "").localeCompare(String(b.name || ""));
        });

        exportData = sortedProducts.map((p, index) => {
            const ordered = orderedItemsMap[p.id] || orderedItemsMap[String(p.id)];
            const classVal = formatClass(p.variant || (ordered && ordered.size_name) || p.quality);
            const unitVal = cleanUnit(p.wholesale_unit || p.unit || (ordered && ordered.size_name) || "KG");
            const priceVal = ordered ? (ordered.unit_price || p.wholesale_price || p.price) : (p.wholesale_price || p.price);

            return {
                "#": index + 1,
                "Category": p.category_name || p.category || "FRUTAS Y VERDURAS",
                "Product Name": p.name || 'Unknown Product',
                "Class": classVal || "—",
                "Price": Number(priceVal || 0).toFixed(2),
                "Order Qty": ordered ? ordered.quantity : "",
                "Unit": ordered ? unitVal : "",
                "Amount": ordered ? (ordered.quantity * Number(priceVal || 0)).toFixed(2) : ""
            };
        });
        
        exportData.push({});
        exportData.push({ "Product Name": "Subtotal", "Amount": Number(subtotal).toFixed(2) });
        if (shipping > 0) {
            exportData.push({ "Product Name": "Shipping", "Amount": Number(shipping).toFixed(2) });
        }
        exportData.push({ "Product Name": "Total", "Amount": Number(total).toFixed(2) });
        
    } else {
        exportData = items.map((item, index) => ({
            "#": index + 1,
            "Product Name": item.product_name || item.product || 'Unknown Product',
            "Size/Variant": item.size_name || item.size || "—",
            "Quantity": item.quantity,
            "Unit Price": Number(item.unit_price).toFixed(2),
            "Amount": (item.quantity * Number(item.unit_price)).toFixed(2)
        }));

        exportData.push({});
        exportData.push({ "Product Name": "Subtotal", "Amount": Number(subtotal).toFixed(2) });
        if (shipping > 0) {
            exportData.push({ "Product Name": "Shipping", "Amount": Number(shipping).toFixed(2) });
        }
        exportData.push({ "Product Name": "Total", "Amount": Number(total).toFixed(2) });
    }
    
    return exportData;
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    setDropdownOpen(false);
    try {
      const XLSX = await import('xlsx');
      const excelData = generateExportData();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
      XLSX.writeFile(workbook, `invoice-${id}.xlsx`);
    } catch (err) {
      console.error("Excel generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setDownloading(true);
    setDropdownOpen(false);
    try {
      const XLSX = await import('xlsx');
      const excelData = generateExportData();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
      XLSX.writeFile(workbook, `invoice-${id}.csv`);
    } catch (err) {
      console.error("CSV generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadHTML = async () => {
    setDownloading(true);
    setDropdownOpen(false);
    try {
      const res = await api.download(`/api/orders/invoice/${id}/?download=1`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("HTML download failed:", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 lg:p-6">
        <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="text-center py-12">
          <p className="text-slate-500">
            {error?.status === 404 ? `Order "${id}" not found.` : error?.message || "Failed to load order details."}
          </p>
          <Link href="/dashboard/orders" className="text-sm text-slate-600 underline mt-2 inline-block">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const subtotal = Number(order.cart_subtotal || 0);
  const total = Number(order.total_amount || 0);
  const shipping = total - subtotal > 0 ? total - subtotal : 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex items-center gap-2">
          {/* Format Toggle - Hidden for Wholesale */}
          {!isWholesaleOrder && (
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
              <button
                onClick={() => setInvoiceType("a4")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${invoiceType === "a4" ? "bg-gray-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <FileText className="w-3.5 h-3.5" /> A4
              </button>
              <button
                onClick={() => setInvoiceType("pos")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${invoiceType === "pos" ? "bg-gray-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Receipt className="w-3.5 h-3.5" /> POS
              </button>
            </div>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <div id="download-dropdown-container" className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-red-500" /> PDF
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Table className="w-4 h-4 text-green-600" /> Excel
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-orange-500" /> CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print isolation styles to hide everything except the invoice */}
      <style>{`
        @media print {
          html, body {
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible !important;
          }
          #invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            margin: 10mm;
          }
        }
      `}</style>

      {/* Invoice Content */}
      <div id="invoice-print-area" className="w-full">
        {isWholesaleOrder ? (
          <WholesaleInvoice order={order} items={items} subtotal={subtotal} total={total} shipping={shipping} storeName={storeName} logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} contactAddress={contactAddress} allProducts={allProducts} />
        ) : invoiceType === "pos" ? (
          <POSInvoice order={order} items={items} subtotal={subtotal} total={total} shipping={shipping} storeName={storeName} logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} contactAddress={contactAddress} />
        ) : (
          <A4Invoice order={order} items={items} subtotal={subtotal} total={total} shipping={shipping} storeName={storeName} logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} contactAddress={contactAddress} />
        )}
      </div>
    </div>
  );
}
