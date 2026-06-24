"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Search, Loader2, ShoppingCart, Check, Package, RefreshCw, Pencil, Trash2, Eye } from "lucide-react";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";

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

const columns = [
  { key: "order_number", label: "Order #" },
  { key: "customer_name", label: "Customer" },
  { key: "total_amount", label: "Total", render: (v) => `€${Number(v || 0).toLocaleString()}` },
  { key: "status", label: "Status", render: (v) => <StatusBadge value={v} /> },
  { key: "payment_status", label: "Payment", render: (v) => <StatusBadge value={v} /> },
  { key: "ordered_at", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

function TrackOrdersSection({ profile }) {
  const toast = useToastContext();
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const { data: rawData, isLoading, error, mutate } = useSWR(
    "/api/orders/?ordering=-ordered_at",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const data = rawData?.results || (Array.isArray(rawData) ? rawData : []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif text-[#004A3A] font-medium tracking-tight">Recent Orders</h2>
        <button onClick={() => mutate()} className="flex items-center gap-2 text-sm text-[#00694C] font-semibold">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#00694C] animate-spin" /></div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">Failed to load orders.</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          pageSize={20}
          searchable
          searchKeys={["order_number", "customer_name", "customer_email"]}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <button onClick={() => setViewItem(row)} className="db-icon-btn" title="View"><Eye size={14} /></button>
              {profile?.can_update_orders && (
                <button onClick={() => setEditItem(row)} className="db-icon-btn" title="Update Status"><Pencil size={14} /></button>
              )}
              {profile?.can_delete_orders && (
                <button onClick={() => setDeleteItem(row)} className="db-icon-btn text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
              )}
            </div>
          )}
        />
      )}

      {/* Update Status Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Update Order">
        {editItem && (
          <FormModal 
            fields={[
              { key: "status", label: "Order Status", type: "select", required: true, options: [
                { value: "PENDING", label: "Pending" },
                { value: "PROCESSING", label: "Processing" },
                { value: "SHIPPED", label: "Shipped" },
                { value: "DELIVERED", label: "Delivered" },
                { value: "CANCELLED", label: "Cancelled" },
              ]},
              { key: "payment_status", label: "Payment Status", type: "select", required: true, options: [
                { value: "UNPAID", label: "Unpaid" },
                { value: "PAID", label: "Paid" },
                { value: "REFUNDED", label: "Refunded" },
              ]},
              { key: "tracking_number", label: "Tracking Number", placeholder: "Enter tracking number" },
            ]} 
            initialValues={{ 
              status: editItem.status, 
              payment_status: editItem.payment_status, 
              tracking_number: editItem.tracking_number || "" 
            }} 
            onSubmit={async (values) => {
              try {
                await api.patch(`/api/orders/${editItem.order_number}/`, values);
                toast.success("Order updated");
                setEditItem(null);
                mutate();
              } catch (err) {
                toast.error(err?.message || "Update failed");
                throw err;
              }
            }} 
            submitLabel="Update" 
          />
        )}
      </Modal>

      {/* Delete Order Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async () => {
          try {
            await api.delete(`/api/orders/${deleteItem.order_number}/`);
            toast.success("Order deleted successfully");
            setDeleteItem(null);
            mutate();
          } catch (err) {
            toast.error(err?.message || "Delete failed");
          }
        }}
        title="Delete Order"
        message={`Are you sure you want to delete order ${deleteItem?.order_number}?`}
        confirmLabel="Delete"
      />

      {/* View Order Modal (Basic View) */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={`Order Details: ${viewItem?.order_number}`} maxWidth="max-w-3xl">
        {viewItem && (
          <div className="space-y-6 pb-2">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between shadow-sm">
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

            {viewItem.items?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="text-sm font-bold text-slate-800">Ordered Items ({viewItem.items.length})</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {viewItem.items.map((item, i) => (
                    <div key={i} className="p-5 flex items-center gap-5">
                      <div className="w-14 h-14 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-slate-800 truncate mb-1">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} × €{Number(item.unit_price).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-black text-slate-900">€{(item.quantity * Number(item.unit_price)).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function CreateOrderSection() {
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState("fv"); // 'fv' or 'grocery'
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState({}); // { [productId]: { classA: 0, classB: 0, qty: 0, notes: "" } }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: ""
  });

  const { data: rawData, isLoading } = useSWR(
    "/api/products/products/?page_size=500",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const products = Array.isArray(rawData) ? rawData : (rawData?.results || []);

  const isFV = (product) => {
    const cat = product?.category?.name?.toLowerCase() || "";
    const isFruitOrVeg = cat.includes("fruit") || cat.includes("vegetable") || cat.includes("produce");
    return isFruitOrVeg || (!cat && product.name.toLowerCase().match(/apple|orange|banana|tomato|potato|onion|lettuce|carrot/));
  };

  const fvProducts = products.filter(isFV);
  const groceryProducts = products.filter(p => !isFV(p));

  const displayedProducts = (activeTab === "fv" ? fvProducts : groceryProducts).filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateItem = (productId, field, value) => {
    setOrderItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const calculateTotalItems = () => {
    let count = 0;
    Object.values(orderItems).forEach(item => {
      if (item.classA > 0) count += parseInt(item.classA);
      if (item.classB > 0) count += parseInt(item.classB);
      if (item.qty > 0) count += parseInt(item.qty);
    });
    return count;
  };

  const calculateSubtotal = () => {
    let total = 0;
    Object.keys(orderItems).forEach(productId => {
      const item = orderItems[productId];
      const product = products.find(p => p.id === parseInt(productId) || p.id === productId);
      if (!product) return;
      const price = Number(product.price) || 0;
      
      if (item.classA > 0) total += parseInt(item.classA) * price;
      if (item.classB > 0) total += parseInt(item.classB) * (price * 0.8); // Example 20% discount for Class B
      if (item.qty > 0) total += parseInt(item.qty) * price;
    });
    return total;
  };

  const handleSubmitOrder = async () => {
    const total = calculateTotalItems();
    if (total === 0) {
      toast.error("Please add at least one item to the order.");
      return;
    }
    if (!customerInfo.name || !customerInfo.email) {
      toast.error("Customer name and email are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = [];
      Object.keys(orderItems).forEach(productId => {
        const item = orderItems[productId];
        if (item.classA > 0 || item.classB > 0 || item.qty > 0) {
           const qty = (parseInt(item.classA) || 0) + (parseInt(item.classB) || 0) + (parseInt(item.qty) || 0);
           if (qty > 0) {
             itemsPayload.push({
               product_id: productId,
               quantity: qty,
               notes: item.notes || ""
             });
           }
        }
      });

      const payload = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        items: itemsPayload,
        shipping_address: {
           address_line_1: customerInfo.street || "Staff Created Order",
           city: customerInfo.city || "Madrid",
           country: "Spain",
           postal_code: "00000"
        },
        payment: {
           transaction_id: "MANUAL_ORDER_" + Date.now(),
           payment_method: "CASH",
           sender_number: "POS_STAFF"
        },
        subtotal: calculateSubtotal(),
        shipping_cost: 0,
        total_amount: calculateSubtotal(),
        comment: "Manually created from Staff Portal"
      };

      await api.post("/api/orders/confirm-payment/", payload);
      
      toast.success("Order created successfully!");
      setOrderItems({});
      setCustomerInfo({ name: "", email: "", phone: "", street: "", city: "" });
    } catch (error) {
      toast.error(error?.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = calculateTotalItems();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col xl:flex-row gap-6 overflow-hidden">
      <div className="flex-1 flex flex-col transition-all duration-300">
        <div className="flex justify-between items-end mb-6">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("fv")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === "fv" 
                  ? "bg-white text-[#00694C] shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Fruits & Veg
            </button>
            <button
              onClick={() => setActiveTab("grocery")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === "grocery" 
                  ? "bg-white text-[#00694C] shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Grocery
            </button>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 focus:border-[#00694C] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-[#00694C] animate-spin" />
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No products found</h3>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center w-24">Price</th>
                    {activeTab === "fv" ? (
                      <>
                        <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center w-24">Class A</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center w-24">Class B</th>
                      </>
                    ) : (
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center w-28">Quantity</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedProducts.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-3">
                          {product.thumbnail_url ? (
                            <img src={product.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-center text-sm font-semibold text-slate-700">
                         €{product.price}
                      </td>
                      {activeTab === "fv" ? (
                        <>
                          <td className="py-2 px-4 text-center">
                            <input 
                              type="number" min="0" placeholder="0"
                              value={orderItems[product.id]?.classA || ""}
                              onChange={(e) => handleUpdateItem(product.id, "classA", e.target.value)}
                              className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:border-[#00694C]"
                            />
                          </td>
                          <td className="py-2 px-4 text-center">
                            <input 
                              type="number" min="0" placeholder="0"
                              value={orderItems[product.id]?.classB || ""}
                              onChange={(e) => handleUpdateItem(product.id, "classB", e.target.value)}
                              className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:border-[#00694C]"
                            />
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-4 text-center">
                          <input 
                            type="number" min="0" placeholder="0"
                            value={orderItems[product.id]?.qty || ""}
                            onChange={(e) => handleUpdateItem(product.id, "qty", e.target.value)}
                            className="w-20 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:outline-none focus:border-[#00694C]"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {totalItems > 0 && (
        <div className="w-full xl:w-80 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col shrink-0 animate-in slide-in-from-right-8 fade-in duration-500">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Customer Details</h3>
        <div className="space-y-3 mb-6">
          <input type="text" placeholder="Full Name *" value={customerInfo.name} onChange={e=>setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#00694C]" />
          <input type="email" placeholder="Email Address *" value={customerInfo.email} onChange={e=>setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#00694C]" />
          <input type="text" placeholder="Phone Number" value={customerInfo.phone} onChange={e=>setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#00694C]" />
          <input type="text" placeholder="Street Address" value={customerInfo.street} onChange={e=>setCustomerInfo({...customerInfo, street: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#00694C]" />
        </div>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center mb-1 text-sm text-slate-500">
            <span>Total Items</span>
            <span className="font-bold text-slate-800">{calculateTotalItems()}</span>
          </div>
          <div className="flex justify-between items-center mb-4 text-lg">
            <span className="font-bold text-slate-800">Subtotal</span>
            <span className="font-black text-[#00694C]">€{calculateSubtotal().toFixed(2)}</span>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || calculateTotalItems() === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#00694C] hover:bg-[#005940] text-white px-4 py-3 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Confirm Order
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

export default function StaffOrders({ profile }) {
  const canCreate = profile?.can_create_orders;
  const [activeTab, setActiveTab] = useState(canCreate ? "CREATE_ORDER" : "TRACK_ORDERS");

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-8 h-8 text-[#00694C]" />
        <h1 className="text-3xl font-serif text-[#004A3A] font-medium tracking-tight">Order Line</h1>
      </div>

      <div className="flex gap-4 mb-6">
        {canCreate && (
          <button
            onClick={() => setActiveTab("CREATE_ORDER")}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "CREATE_ORDER" ? "bg-[#00694C] text-white shadow-md" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"}`}
          >
            Create Manual Order
          </button>
        )}
        <button
          onClick={() => setActiveTab("TRACK_ORDERS")}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "TRACK_ORDERS" ? "bg-[#00694C] text-white shadow-md" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"}`}
        >
          Track Orders
        </button>
      </div>
      
      {activeTab === "CREATE_ORDER" && canCreate ? <CreateOrderSection /> : <TrackOrdersSection profile={profile} />}
    </div>
  );
}
