"use client";

import { useState, useEffect } from "react";
import { Printer, Download, ArrowLeft, Loader2, FileText, Receipt } from "lucide-react";
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
        {order.payment && (
          <div className="text-left text-[10px] text-slate-500 mt-2 pt-2 border-t border-dashed border-gray-300">
            <p>Payment: {order.payment.payment_method || "—"}</p>
            {order.payment.transaction_id && <p>Txn: {order.payment.transaction_id}</p>}
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
          {order.payment && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Payment</p>
              <p className="text-sm text-slate-700">Method: {order.payment.payment_method || "—"}</p>
              {order.payment.transaction_id && <p className="text-sm text-slate-500">Txn: {order.payment.transaction_id}</p>}
              {order.payment.sender_number && <p className="text-sm text-slate-500">Sender: {order.payment.sender_number}</p>}
              <p className="text-sm text-slate-500">Payment: {order.payment_status_display || order.payment_status}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 text-left font-medium text-slate-500">#</th>
              <th className="py-2 text-left font-medium text-slate-500">Item</th>
              <th className="py-2 text-left font-medium text-slate-500">Variant</th>
              <th className="py-2 text-center font-medium text-slate-500">Qty</th>
              <th className="py-2 text-right font-medium text-slate-500">Price</th>
              <th className="py-2 text-right font-medium text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3 text-slate-400">{i + 1}</td>
                <td className="py-3 text-slate-800">{item.product_name || `Product #${item.product}`}</td>
                <td className="py-3 text-slate-500 text-xs">{[item.color_name, item.size_name].filter(Boolean).join(" / ") || "—"}</td>
                <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                <td className="py-3 text-right text-slate-600">€{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-3 text-right font-medium text-slate-800">€{(item.quantity * Number(item.unit_price)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-800">€{subtotal.toLocaleString()}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-800">€{shipping.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200">
              <span className="text-slate-800">Total</span>
              <span className="text-slate-800">€{total.toLocaleString()}</span>
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
function WholesaleInvoice({ order, items, storeName, allProducts = [] }) {
  const productsByCategory = allProducts.reduce((acc, p) => {
    const cat = p.category_name || (p.category && p.category.name) || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const orderedItemsMap = items.reduce((acc, item) => {
    acc[item.product] = item;
    return acc;
  }, {});

  const orderDate = order.ordered_at 
    ? new Date(order.ordered_at).toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : "";

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-w-4xl mx-auto print:shadow-none print:border-0 print:max-w-none">
      <div className="p-4 print:p-8" style={{ minHeight: "297mm", margin: "0 auto" }}>
        
        {/* Simple Header matching the paper photo */}
        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4">
          <h1 className="text-sm font-bold text-black uppercase tracking-wide">
            Tienda: {storeName}
          </h1>
          <div className="text-sm font-bold text-black">
            #{order.order_number} {orderDate && `| Fecha: ${orderDate}`}
          </div>
        </div>

        {/* Items Grid (Warehouse Picking List) */}
        <div className="mb-4">
          {Object.keys(productsByCategory).length > 0 ? (
            Object.entries(productsByCategory).map(([category, prods]) => (
              <div key={category} className="break-inside-avoid mb-0.5">
                {/* Optional category header to maintain structure */}
                <h4 className="text-[10px] font-bold text-black uppercase bg-slate-200 print:bg-gray-200 px-2 border-l border-r border-t border-black inline-block tracking-wider">
                  {category}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l border-t border-black">
                  {prods.map(p => {
                    const ordered = orderedItemsMap[p.id];
                    return (
                      <div key={p.id} className="flex border-r border-b border-black text-[10px] bg-white h-full">
                        {/* Name (Left side) */}
                        <div className="flex-1 px-1.5 py-1 flex items-center min-w-0 border-r border-black border-dashed">
                          <span className={`uppercase truncate ${ordered ? "font-black text-black" : "text-gray-800"}`} title={p.name}>
                            {p.name}
                          </span>
                        </div>
                        {/* Quantity Box (Right side partition) */}
                        <div className="w-16 shrink-0 flex items-center justify-center font-bold text-black text-[10px] bg-slate-50 print:bg-transparent text-center px-1">
                          {ordered ? `${ordered.quantity} ${(p.wholesale_unit || p.unit || 'pcs').replace(/^per\s+/i, '')}` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-lg">Loading products grid...</div>
          )}
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

  const { data: productsRaw } = useSWR(
    order?.is_wholesale_order ? "all-products-invoice" : null,
    () => productsService.list({ page_size: 1000 }),
    { revalidateOnFocus: false }
  );
  const allProducts = productsRaw?.results || [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Hit the backend invoice endpoint which returns HTML
      const res = await api.download(`/api/orders/invoice/${id}/?download=1`);
      if (!res.ok) {
        // Fallback to print
        window.print();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.html`;  // HTML content, correct extension
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to browser print
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
          {!order.is_wholesale_order && (
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      {order.is_wholesale_order ? (
        <WholesaleInvoice order={order} items={items} subtotal={subtotal} total={total} shipping={shipping} storeName={storeName} logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} contactAddress={contactAddress} allProducts={allProducts} />
      ) : invoiceType === "pos" ? (
        <POSInvoice order={order} items={items} subtotal={subtotal} total={total} shipping={shipping} storeName={storeName} logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} contactAddress={contactAddress} />
      ) : (
        <A4Invoice order={order} items={items} subtotal={subtotal} total={total} shipping={shipping} storeName={storeName} logoUrl={logoUrl} contactEmail={contactEmail} contactPhone={contactPhone} contactAddress={contactAddress} />
      )}
    </div>
  );
}
