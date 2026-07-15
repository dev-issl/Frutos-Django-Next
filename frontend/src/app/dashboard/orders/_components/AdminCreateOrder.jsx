"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { getDeliveryWindows, getDeliveryOption } from "@/lib/api";
import { Loader2, Check, Package, ArrowRight, ArrowLeft } from "lucide-react";
import { useToastContext } from "@/app/dashboard/_components/Toaster";

// Reuse website's checkout components
import DeliverySection from "@/app/checkout/components/DeliverySection";
import PaymentSection from "@/app/checkout/components/PaymentSection";

export default function AdminCreateOrder({ onBack, storeId, onSuccess }) {
  const toast = useToastContext();

  // Step State (1 = Product Selection, 2 = Checkout Details)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter State
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Order Items State
  // Format: { [productId]: { selected: boolean, qty: number, size: string } }
  const [orderItems, setOrderItems] = useState({});

  // Checkout State
  const [form, setForm] = useState({
    name: "",
    email: "",
    street: "",
    city: "",
    postcode: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "" });
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [deliveryDates, setDeliveryDates] = useState([]);
  const [deliverySlots, setDeliverySlots] = useState([]);
  const [deliveryConfig, setDeliveryConfig] = useState(null);

  // Category Scroll Drag State
  const categoryScrollRef = useRef(null);
  const isDraggingCategory = useRef(false);
  const startPos = useRef({ x: 0, left: 0 });
  const hasDragged = useRef(false);

  const handleCategoryMouseDown = (e) => {
    isDraggingCategory.current = true;
    hasDragged.current = false;
    startPos.current = {
      x: e.pageX - categoryScrollRef.current.offsetLeft,
      left: categoryScrollRef.current.scrollLeft
    };
  };

  const handleCategoryMouseLeave = () => {
    isDraggingCategory.current = false;
  };

  const handleCategoryMouseUp = () => {
    isDraggingCategory.current = false;
  };

  const handleCategoryMouseMove = (e) => {
    if (!isDraggingCategory.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startPos.current.x) * 2;
    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
    }
    categoryScrollRef.current.scrollLeft = startPos.current.left - walk;
  };

  const handleCategoryClick = (cat) => {
    if (!hasDragged.current) {
      setActiveCategory(cat);
    }
  };

  // Fetch Products
  const url = storeId 
    ? `/api/products/products/?store=${storeId}&page_size=500` 
    : `/api/products/products/?page_size=500`;

  const { data: rawData, isLoading } = useSWR(
    url,
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const products = Array.isArray(rawData) ? rawData : (rawData?.results || []);
  const allCategories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))).sort();

  // Fetch Delivery Details on Mount
  useEffect(() => {
    async function loadDeliveryInfo() {
      try {
        const [windows, opt] = await Promise.all([
          getDeliveryWindows(),
          getDeliveryOption()
        ]);
        if (windows) {
          setDeliveryDates(windows.dates || []);
          setDeliverySlots(windows.slots || []);
          const firstAvailable = (windows.slots || []).find(s => s.is_available);
          if (firstAvailable) setSelectedSlot(String(firstAvailable.id));
        }
        if (opt) setDeliveryConfig(opt);
      } catch (err) {
        console.error("Failed to load delivery info", err);
      }
    }
    loadDeliveryInfo();
  }, []);

  const displayedProducts = products.filter(p => {
    if (activeCategory !== "ALL" && p.category?.name !== activeCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm]);

  const totalPages = Math.ceil(displayedProducts.length / PAGE_SIZE);
  const paginatedProducts = displayedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Calculate totals
  const getSelectedItemsArray = () => {
    return Object.keys(orderItems)
      .filter(id => orderItems[id]?.selected && orderItems[id]?.qty > 0)
      .map(id => {
        const product = products.find(p => String(p.id) === id);
        return {
          product: product,
          qty: parseInt(orderItems[id].qty),
          size: orderItems[id].size || "kg"
        };
      });
  };

  const calculateTotalItems = () => {
    let count = 0;
    getSelectedItemsArray().forEach(item => {
      count += item.qty;
    });
    return count;
  };

  const calculateSubtotal = () => {
    let total = 0;
    getSelectedItemsArray().forEach(item => {
      const price = Number(item.product.price) || 0;
      total += item.qty * price;
    });
    return total;
  };

  const deliveryFee = () => {
    if (!deliveryConfig || !deliveryConfig.is_active || deliveryConfig.charge_type === 'free') return 0;
    if (deliveryConfig.charge_type === 'flat') return Number(deliveryConfig.flat_fee);
    if (deliveryConfig.charge_type === 'threshold') {
      return calculateSubtotal() >= Number(deliveryConfig.free_threshold) ? 0 : Number(deliveryConfig.flat_fee);
    }
    return 0;
  };

  const handleUpdateItem = (productId, field, value) => {
    setOrderItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
        // Automatically check the item if quantity is set > 0 and wasn't manually unchecked
        ...(field === 'qty' && value > 0 && prev[productId]?.selected === undefined ? { selected: true } : {}),
        // If they specify a size, automatically check it if qty > 0
        ...(field === 'size' && prev[productId]?.qty > 0 && prev[productId]?.selected === undefined ? { selected: true } : {})
      }
    }));
  };

  const toggleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const newOrderItems = { ...orderItems };
    displayedProducts.forEach(p => {
      newOrderItems[p.id] = {
        ...newOrderItems[p.id],
        selected: isChecked,
        qty: newOrderItems[p.id]?.qty || 1, // give default qty 1 if selected
        size: newOrderItems[p.id]?.size || "kg"
      };
      if (!isChecked) {
        newOrderItems[p.id].qty = 0;
      }
    });
    setOrderItems(newOrderItems);
  };

  const allDisplayedSelected = displayedProducts.length > 0 && displayedProducts.every(p => orderItems[p.id]?.selected);

  const proceedToCheckout = () => {
    if (calculateTotalItems() === 0) {
      toast.error("Please select at least one product with a quantity greater than 0.");
      return;
    }
    setStep(2);
  };

  const handleSubmitOrder = async () => {
    // Validate form
    if (!form.name.trim()) return toast.error('Please enter customer full name.');
    if (!form.email.trim()) return toast.error('Please enter email address.');
    if (!form.street.trim()) return toast.error('Please enter street address.');
    if (!form.city.trim()) return toast.error('Please enter city.');

    setIsSubmitting(true);
    try {
      const itemsPayload = getSelectedItemsArray().map(item => ({
        product_id: item.product.id,
        quantity: item.qty,
        size: item.size
      }));

      const dateObj = deliveryDates[selectedDate];
      const slotObj = deliverySlots.find(s => String(s.id) === String(selectedSlot));

      const payload = {
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        items: itemsPayload,
        shipping_address: {
          address_line_1: form.street.trim(),
          city: form.city.trim(),
          state: form.city.trim() || "N/A",
          country: "Spain",
          postal_code: form.postcode.trim() || "00000"
        },
        payment: {
          transaction_id: "MANUAL_ORDER_" + Date.now(),
          payment_method: paymentMethod.toUpperCase(),
          sender_number: "POS_ADMIN"
        },
        delivery_date: dateObj?.date || dateObj?.full || dateObj?.label || '',
        delivery_slot: slotObj?.id ?? selectedSlot,
        delivery_slot_label: slotObj?.time || slotObj?.label || '',
        subtotal: calculateSubtotal(),
        shipping_cost: deliveryFee(),
        total_amount: calculateSubtotal() + deliveryFee(),
        comment: "Manually created from Admin Portal"
      };

      await api.post("/api/orders/confirm-payment/", payload);

      toast.success("Order created successfully!");
      if (onBack) onBack();
    } catch (error) {
      toast.error(error?.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[70vh]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {step === 1 ? "Step 1: Select Products" : "Step 2: Checkout Details"}
          </h2>
          <p className="text-sm text-slate-500">
            {step === 1 ? "Choose products, quantities, and sizes." : "Enter delivery and payment information."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-md text-sm hover:bg-slate-50 shadow-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Products
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full sm:w-auto justify-center cursor-pointer px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-md text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors"
          >
            Cancel Order
          </button>
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col flex-1">
          {/* Filters */}
          <div className="p-4 pb-2 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
            <div
              ref={categoryScrollRef}
              onMouseDown={handleCategoryMouseDown}
              onMouseLeave={handleCategoryMouseLeave}
              onMouseUp={handleCategoryMouseUp}
              onMouseMove={handleCategoryMouseMove}
              className="flex overflow-x-auto gap-2 pb-3 db-scroll max-w-full cursor-grab active:cursor-grabbing select-none"
            >
              <button
                onClick={() => handleCategoryClick("ALL")}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeCategory === "ALL"
                  ? "bg-[#00694C] text-white shadow-sm"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                All Products
              </button>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`cursor-pointer px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeCategory === cat
                    ? "bg-[#00694C] text-white shadow-sm"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-64 shrink-0">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#00694C]"
              />
            </div>
          </div>

          {/* Product Table */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#00694C] animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 w-12 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-[#00694C] rounded cursor-pointer"
                            checked={allDisplayedSelected}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-3 py-2 w-16 whitespace-nowrap">Photo</th>
                        <th className="px-3 py-2 whitespace-nowrap">Product Name</th>
                        <th className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">Category</th>
                        <th className="px-3 py-2 whitespace-nowrap">Price</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap">Quantity</th>
                        <th className="px-3 py-2 text-center whitespace-nowrap">Size Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedProducts.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-slate-500">No products found.</td></tr>
                      ) : (
                        paginatedProducts.map(product => (
                          <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-1.5 text-center whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#00694C] rounded cursor-pointer"
                                checked={!!orderItems[product.id]?.selected}
                                onChange={(e) => handleUpdateItem(product.id, "selected", e.target.checked)}
                              />
                            </td>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              {product.thumbnail_url || product.image ? (
                                <img src={product.thumbnail_url || product.image} alt="" className="w-8 h-8 rounded-md object-cover border border-slate-100 shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center border border-slate-100 shrink-0">
                                  <Package className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-1.5 font-semibold text-slate-800 whitespace-nowrap">
                              <div className="truncate max-w-[150px] sm:max-w-[250px]">{product.name}</div>
                            </td>
                            <td className="px-3 py-1.5 whitespace-nowrap hidden sm:table-cell">{product.category?.name || "—"}</td>
                            <td className="px-3 py-1.5 font-medium whitespace-nowrap">€{Number(product.price).toLocaleString()}</td>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <div className="flex justify-center">
                                <input
                                  type="number" min="0" placeholder="0"
                                  value={orderItems[product.id]?.qty || ""}
                                  onChange={(e) => handleUpdateItem(product.id, "qty", parseInt(e.target.value) || 0)}
                                  className="w-16 sm:w-20 px-2 py-1.5 text-sm text-center border border-slate-200 rounded focus:outline-none focus:border-[#00694C]"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <div className="flex justify-center">
                                <select
                                  value={orderItems[product.id]?.size || "kg"}
                                  onChange={(e) => handleUpdateItem(product.id, "size", e.target.value)}
                                  className="w-20 sm:w-24 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#00694C] bg-white cursor-pointer"
                                >
                                  <option value="kg">kg</option>
                                  <option value="g">g</option>
                                  <option value="box">Box</option>
                                  <option value="piece">Piece</option>
                                  <option value="pack">Pack</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-white">
                    <p className="text-sm text-slate-500">
                      Showing <span className="font-medium text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-800">{Math.min(currentPage * PAGE_SIZE, displayedProducts.length)}</span> of <span className="font-medium text-slate-800">{displayedProducts.length}</span> products
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          // Simple pagination: show current, first, last, and neighbors
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 flex items-center justify-center text-sm rounded ${currentPage === page
                                  ? "bg-[#00694C] text-white"
                                  : "text-slate-600 hover:bg-slate-100"
                                  }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return <span key={page} className="px-1 text-slate-400">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Bar */}
          <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 gap-4">
            <div className="flex gap-4 sm:gap-8">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5 sm:mb-1">Selected</p>
                <p className="text-lg sm:text-xl font-black text-slate-800">{calculateTotalItems()}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5 sm:mb-1">Subtotal</p>
                <p className="text-lg sm:text-xl font-black text-[#00694C]">€{calculateSubtotal().toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={proceedToCheckout}
              disabled={calculateTotalItems() === 0}
              className="flex items-center justify-center flex-1 sm:flex-none gap-2 bg-[#00694C] hover:bg-[#005940] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-base shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="hidden sm:inline">Proceed to Checkout</span>
              <span className="sm:hidden">Checkout</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6 md:p-8 bg-slate-50 flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Delivery Section (from Website) */}
            <DeliverySection
              form={form}
              setForm={setForm}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              deliveryDates={deliveryDates}
              deliverySlots={deliverySlots}
              prefilled={false}
              savedAddresses={[]}
              isAuthenticated={false} // Allow editing email
            />

            {/* Payment Section (from Website) */}
            <PaymentSection
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cardForm={cardForm}
              setCardForm={setCardForm}
            />

            {/* Order Summary & Submit */}
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm mt-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h3>
              <div className="divide-y divide-slate-100 mb-6">
                {getSelectedItemsArray().map((item, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0">
                        {item.product.thumbnail_url || item.product.image ? (
                          <img src={item.product.thumbnail_url || item.product.image} className="w-full h-full object-cover rounded" alt="" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{item.product.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.qty} {item.size} × €{Number(item.product.price).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-800">€{(item.qty * Number(item.product.price)).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">€{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">€{deliveryFee().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-[#00694C] pt-2">
                  <span>Total Amount</span>
                  <span>€{(calculateSubtotal() + deliveryFee()).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#00694C] hover:bg-[#005940] text-white px-6 py-4 rounded-xl font-bold text-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                  Confirm Order
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
