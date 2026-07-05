"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, FileText, Pencil, Trash2, Receipt, AlertCircle, RefreshCw, Plus, BarChart2 } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import { ordersService, storesService } from "@/app/dashboard/_lib/services";
import api from "@/app/dashboard/_lib/api";
import AdminCreateOrder from "./_components/AdminCreateOrder";
import OrdersReportModal from "./_components/OrdersReportModal";

const PAGE_SIZE = 20;

// Status badge helper — render a styled chip
function StatusBadge({ value }) {
  const colors = {
    pending: "bg-amber-50 text-amber-700",
    processing: "bg-blue-50 text-blue-700",
    shipped: "bg-blue-50 text-blue-700",
    delivered: "bg-emerald-50 text-emerald-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
    paid: "bg-emerald-50 text-emerald-700",
    unpaid: "bg-amber-50 text-amber-700",
    refunded: "bg-red-50 text-red-700",
  };
  const key = String(value || "").toLowerCase();
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${colors[key] || "bg-slate-100 text-slate-600"}`}>
      {key.replace(/_/g, " ") || "—"}
    </span>
  );
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "This Week", value: "THIS_WEEK" },
  { label: "This Month", value: "THIS_MONTH" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Wholesale", value: "WHOLESALE" },
  { label: "Customer", value: "RETAIL" },
];

export default function OrdersPage() {
  const toast = useToastContext();
  const [activeFilter, setFilter] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const { data: storesRaw } = useSWR("ref-stores", () => storesService.list());
  const stores = storesRaw?.results || (Array.isArray(storesRaw) ? storesRaw : []);

  const dynamicStatusFields = [
    {
      key: "status", label: "Order Status", type: "select", required: true, options: [
        { value: "PENDING", label: "Pending" },
        { value: "PROCESSING", label: "Processing" },
        { value: "SHIPPED", label: "Shipped" },
        { value: "DELIVERED", label: "Delivered" },
        { value: "CANCELLED", label: "Cancelled" },
      ]
    },
    {
      key: "payment_status", label: "Payment Status", type: "select", required: true, options: [
        { value: "UNPAID", label: "Unpaid" },
        { value: "PAID", label: "Paid" },
        { value: "REFUNDED", label: "Refunded" },
      ]
    },
    { key: "tracking_number", label: "Tracking Number", placeholder: "Enter tracking number" },
    {
      key: "fulfillment_store", label: "Fulfillment Store", type: "select", required: false, options: [
        { value: "", label: "-- None --" },
        ...stores.map(s => ({ value: s.id, label: s.name }))
      ]
    }
  ];

  const columns = [
    { key: "order_number", label: "Order #", render: (v, row) => (
       <span 
         className="font-bold text-[#00694C] cursor-pointer hover:underline"
         onClick={(e) => { e.stopPropagation(); setViewItem(row); }}
       >
         {v}
       </span>
    )},
    { key: "customer_name", label: "Customer" },
    { key: "customer_email", label: "Email" },
    { key: "total_amount", label: "Total", render: (v) => `€${Number(v || 0).toLocaleString()}` },
    { key: "status", label: "Status", render: (v) => <StatusBadge value={v} /> },
    { key: "payment_status", label: "Payment", render: (v) => <StatusBadge value={v} /> },
    { key: "ordered_at", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  // Backend OrderViewSet.list returns a flat array (no pagination)
  const { data: rawData, isLoading, error, mutate } = useSWR(
    ["admin-orders-list"],
    () => ordersService.list({ ordering: "-ordered_at" }),
    { revalidateOnFocus: false, keepPreviousData: true, shouldRetryOnError: false }
  );

  const rawList = rawData?.results || (Array.isArray(rawData) ? rawData : []);
  const data = activeFilter
    ? activeFilter === "WHOLESALE"
      ? rawList.filter(o => o.is_wholesale_order)
      : activeFilter === "RETAIL"
        ? rawList.filter(o => !o.is_wholesale_order)
        : activeFilter === "THIS_WEEK"
          ? rawList.filter(o => {
            if (!o.ordered_at) return false;
            const date = new Date(o.ordered_at);
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return date >= startOfWeek;
          })
          : activeFilter === "THIS_MONTH"
            ? rawList.filter(o => {
              if (!o.ordered_at) return false;
              const date = new Date(o.ordered_at);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            })
            : rawList.filter(o => o.status === activeFilter)
    : rawList;
  const totalCount = rawData?.count ?? data.length;

  const handleStatusUpdate = async (values) => {
    try {
      await api.patch(`/api/orders/${editItem.order_number}/`, values);
      toast.success("Order updated");
      setEditItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Update failed");
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/orders/${deleteItem.order_number}/`);
      toast.success("Order deleted");
      setDeleteItem(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <Container
      title={isCreating ? "Create Manual Order" : "Orders"}
      description={isCreating ? "Manually add a new customer order" : "Manage customer orders"}
      actions={
        <div className="flex gap-2">
          {!isCreating && error && (
            <button onClick={() => mutate()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
          {!isCreating && (
            <button
              onClick={() => setShowReport(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all shadow-sm group"
            >
              <BarChart2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" /> View Report
            </button>
          )}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#00694C] text-white rounded-lg hover:bg-[#085041] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Order
            </button>
          )}
        </div>
      }
    >
      {isCreating ? (
        <AdminCreateOrder
          onBack={() => {
            setIsCreating(false);
            mutate();
          }}
        />
      ) : (
        <>
          <div className="db-filter-bar">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`cursor-pointer db-filter-pill${activeFilter === f.value ? " active" : ""}`}
              >
                {f.label}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>
              {data.length} orders
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {error?.message?.includes("credentials") || error?.status === 401
                  ? "Not authenticated. Please log in to the admin dashboard."
                  : error?.message || "Failed to load orders. Check that the backend server is running."}
              </span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={data}
            pageSize={PAGE_SIZE}
            loading={isLoading}
            searchable
            searchKeys={["order_number", "customer_name", "customer_email"]}
            onRowClick={(row) => setViewItem(row)}
            actions={(row) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={(e) => { e.stopPropagation(); setViewItem(row); }} className="db-icon-btn" title="View"><Eye size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); setEditItem(row); }} className="db-icon-btn" title="Update Status"><Pencil size={14} /></button>
                <Link onClick={(e) => e.stopPropagation()} href={`/dashboard/orders/${row.order_number}/invoice`} className="db-icon-btn" title="Invoice"><FileText size={14} /></Link>
                <button onClick={(e) => { e.stopPropagation(); setDeleteItem(row); }} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
              </div>
            )}
          />

          {/* Update Status */}
          <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Update Order">
            {editItem && <FormModal fields={dynamicStatusFields} initialValues={{ status: editItem.status, payment_status: editItem.payment_status, tracking_number: editItem.tracking_number || "", fulfillment_store: editItem.fulfillment_store || "" }} onSubmit={handleStatusUpdate} submitLabel="Update" />}
          </Modal>

          {/* View Order */}
          <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Order Details: ${viewItem?.order_number}`} maxWidth="max-w-3xl">
            {viewItem && (
              <div className="space-y-4 pb-1">

                {/* Header: Status & Summary */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between shadow-sm">
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Current Status</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">Order:</span>
                        <StatusBadge value={viewItem.status} />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">Payment:</span>
                        <StatusBadge value={viewItem.payment_status} />
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right w-full sm:w-auto pt-4 sm:pt-0 border-t border-slate-100 sm:border-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Amount</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">€{Number(viewItem.total_amount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Order Info Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-50 pb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg"><FileText className="w-4 h-4 text-blue-600" /></div>
                      Order Information
                    </h4>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{viewItem.ordered_at ? new Date(viewItem.ordered_at).toLocaleString() : "—"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tracking</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{viewItem.tracking_number || "—"}</span>
                      </div>
                      {viewItem.is_wholesale_order && (
                        <div className="flex flex-col pt-2 border-t border-slate-50">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order Type</span>
                          <span className="inline-block mt-1 self-start text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">WHOLESALE</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-50 pb-3">
                      <div className="p-1.5 bg-emerald-50 rounded-lg"><Eye className="w-4 h-4 text-emerald-600" /></div>
                      Customer Details
                    </h4>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{viewItem.customer_name}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                        <span className="text-sm font-semibold text-blue-600 mt-0.5 break-all">{viewItem.customer_email}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{viewItem.customer_phone || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {viewItem.payment && (
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-50 pb-3">
                      <div className="p-1.5 bg-purple-50 rounded-lg"><Receipt className="w-4 h-4 text-purple-600" /></div>
                      Payment Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Method</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">{viewItem.payment.payment_method}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</span>
                        <span className="text-[13px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded mt-0.5 inline-block self-start border border-slate-100 truncate max-w-full" title={viewItem.payment.transaction_id || ""}>{viewItem.payment.transaction_id || "—"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sender</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{viewItem.payment.sender_number || "—"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin A/C</span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5">{viewItem.payment.admin_account_number || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items List */}
                {viewItem.items?.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h4 className="text-sm font-bold text-slate-800">Ordered Items ({viewItem.items.length})</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {viewItem.items.map((item, i) => (
                        <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center gap-4">
                          <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-xl flex items-center justify-center shrink-0 p-1">
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <FileText className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-slate-800 truncate mb-1">{item.product_name || `Product #${item.product}`}</p>
                            <p className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                              {[item.color_name, item.size_name].filter(Boolean).join(" / ") || "Standard"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[15px] font-black text-slate-900">€{(item.quantity * Number(item.unit_price)).toLocaleString()}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">{item.quantity} × €{Number(item.unit_price).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center text-slate-800">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                      <span className="text-xl font-black text-slate-800">€{Number(viewItem.cart_subtotal || viewItem.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Status History Timeline */}
                {viewItem.updates?.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
                      Status History
                    </h4>
                    <div className="relative pl-4 border-l-2 border-slate-100 space-y-4 ml-2">
                      {viewItem.updates.map((u, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-blue-600 rounded-full ring-4 ring-white shadow-sm" />
                          <div className="pl-4">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="text-sm font-bold text-slate-800">{u.status}</span>
                              <span className="text-xs font-semibold text-slate-400">{u.timestamp ? new Date(u.timestamp).toLocaleString() : ""}</span>
                            </div>
                            {u.notes && (
                              <div className="mt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                                <p className="text-[13px] text-slate-600">{u.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invoice Links - Hidden for Wholesale */}
                {!viewItem.is_wholesale_order && (
                  <div className="flex flex-wrap gap-3 pt-4 justify-end">
                    <Link href={`/dashboard/orders/${viewItem.order_number}/invoice`} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                      <FileText className="w-4 h-4 text-blue-600" /> Print A4 Invoice
                    </Link>
                    <Link href={`/dashboard/orders/${viewItem.order_number}/invoice?type=pos`} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                      <Receipt className="w-4 h-4 text-emerald-600" /> Print POS Receipt
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Modal>

          <ConfirmDialog
            open={!!deleteItem}
            onClose={() => setDeleteItem(null)}
            onConfirm={handleDelete}
            title="Delete Order"
            message={`Are you sure you want to delete order ${deleteItem?.order_number}?`}
            confirmLabel="Delete"
          />

          <OrdersReportModal
            open={showReport}
            onClose={() => setShowReport(false)}
            orders={rawList}
          />
        </>
      )}
    </Container>
  );
}
