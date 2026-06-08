

// 'use client'
// import { useState, useEffect } from 'react'
// import Link from 'next/link'
// import StatusBadge from '../components/StatusBadge'

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
// const fmt = (n) => Number(n || 0).toFixed(2)

// const FULFILLMENT_ICONS = {
//   delivery: 'local_shipping',
//   collect:  'store',
//   instore:  'shopping_basket',
// }

// function toArray(data) {
//   if (Array.isArray(data)) return data
//   if (data && Array.isArray(data.results)) return data.results
//   return []
// }

// // initialOrders — pre-fetched by the server component; no client spinner on first load.
// export default function OrdersTab({ authFetch, initialOrders = null }) {
//   const [orders,   setOrders]   = useState(() => toArray(initialOrders))
//   const [loading,  setLoading]  = useState(initialOrders === null)
//   const [expanded, setExpanded] = useState(null)

//   // Client-side fetch only when server data was unavailable
//   useEffect(() => {
//     if (initialOrders !== null) return
//     authFetch(`${API_BASE}/auth/orders/`)
//       .then(r => r.json())
//       .then(data => setOrders(toArray(data)))
//       .finally(() => setLoading(false))
//   }, [])

//   if (loading) return <div className="py-12 text-center" style={{ color: '#6d7a73' }}>Loading orders…</div>

//   if (!orders.length) return (
//     <div className="py-16 text-center">
//       <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#BCCAC1' }}>receipt_long</span>
//       <p className="italic text-lg" style={{ fontFamily: '"Newsreader",Georgia,serif', color: '#6d7a73' }}>No orders yet</p>
//       <Link href="/shop" className="mt-4 inline-block px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#00694C' }}>
//         Browse Market
//       </Link>
//     </div>
//   )

//   return (
//     <div className="space-y-3">
//       {orders.map(order => {
//         const isOpen      = expanded === order.id
//         const fulfillIcon = FULFILLMENT_ICONS[order.fulfillment] || 'local_shipping'

//         return (
//           <div key={order.id} className="rounded-2xl overflow-hidden"
//             style={{ border: `1.5px solid ${isOpen ? '#00694C40' : '#eaeaea'}`, background: '#fff' }}>

//             <button onClick={() => setExpanded(isOpen ? null : order.id)} className="w-full text-left"
//               style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
//               <div className="flex items-center justify-between p-4 md:p-5"
//                 style={{ background: isOpen ? '#F0FAF5' : '#f8fbf8', borderBottom: isOpen ? '1px solid #e0eee8' : 'none' }}>
//                 <div className="flex items-center gap-3">
//                   <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E8F5EE' }}>
//                     <span className="material-symbols-outlined text-base" style={{ color: '#00694C', fontVariationSettings: "'FILL' 1" }}>{fulfillIcon}</span>
//                   </div>
//                   <div>
//                     <p className="font-mono text-xs font-bold" style={{ color: '#3d4943' }}>{order.orderNumber}</p>
//                     <p className="text-xs mt-0.5" style={{ color: '#9daaa3' }}>
//                       {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <StatusBadge status={order.status} />
//                   <span className="material-symbols-outlined text-base"
//                     style={{ color: '#BCCAC1', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
//                     expand_more
//                   </span>
//                 </div>
//               </div>
//             </button>

//             {!isOpen && (
//               <div className="px-4 md:px-5 py-3 flex items-center justify-between">
//                 <p className="text-sm truncate" style={{ color: '#6d7a73', maxWidth: '60%' }}>
//                   {order.items?.map(i => i.productName).join(', ')}
//                 </p>
//                 <p className="font-bold text-sm flex-shrink-0" style={{ color: '#151e13' }}>€{fmt(order.total)}</p>
//               </div>
//             )}

//             {isOpen && (
//               <div>
//                 <div className="p-4 md:p-5 space-y-3" style={{ borderBottom: '1px solid #f0f4f0' }}>
//                   <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6d7a73' }}>Items Ordered</p>
//                   {order.items?.map(item => (
//                     <div key={item.id} className="flex items-center gap-3">
//                       <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#ECF7E4', border: '1px solid #e0eee8' }}>
//                         {item.productImage
//                           ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
//                           : <div className="w-full h-full flex items-center justify-center">
//                               <span className="material-symbols-outlined text-base" style={{ color: '#BCCAC1' }}>eco</span>
//                             </div>
//                         }
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-semibold truncate" style={{ color: '#151e13' }}>{item.productName}</p>
//                         <p className="text-xs" style={{ color: '#6d7a73' }}>{item.quantity} × €{fmt(item.unitPrice)}</p>
//                       </div>
//                       <p className="text-sm font-bold flex-shrink-0" style={{ color: '#855000' }}>€{fmt(item.lineTotal)}</p>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={{ borderBottom: '1px solid #f0f4f0' }}>
//                   <div className="p-4 md:p-5" style={{ borderRight: '1px solid #f0f4f0' }}>
//                     <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6d7a73' }}>Delivery Details</p>
//                     <div className="space-y-1.5">
//                       {order.customerName && (
//                         <div className="flex items-center gap-2">
//                           <span className="material-symbols-outlined text-base" style={{ color: '#BCCAC1' }}>person</span>
//                           <span className="text-sm" style={{ color: '#3d4943' }}>{order.customerName}</span>
//                         </div>
//                       )}
//                       {order.street && (
//                         <div className="flex items-start gap-2">
//                           <span className="material-symbols-outlined text-base mt-0.5" style={{ color: '#BCCAC1' }}>location_on</span>
//                           <span className="text-sm" style={{ color: '#3d4943' }}>{order.street}, {order.city} {order.postcode}</span>
//                         </div>
//                       )}
//                       {order.deliveryDate && (
//                         <div className="flex items-center gap-2">
//                           <span className="material-symbols-outlined text-base" style={{ color: '#BCCAC1' }}>calendar_today</span>
//                           <span className="text-sm" style={{ color: '#3d4943' }}>
//                             {order.deliveryDate}
//                             {order.deliverySlot && <span style={{ color: '#6d7a73' }}> · {order.deliverySlot}</span>}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   <div className="p-4 md:p-5">
//                     <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6d7a73' }}>Payment Summary</p>
//                     <div className="space-y-1.5">
//                       <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}>
//                         <span>Subtotal</span><span>€{fmt(order.subtotal)}</span>
//                       </div>
//                       <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}>
//                         <span>Delivery</span>
//                         <span>{Number(order.deliveryFee) === 0 ? 'Free' : `€${fmt(order.deliveryFee)}`}</span>
//                       </div>
//                       <div className="flex justify-between text-sm font-bold pt-2"
//                         style={{ borderTop: '1px solid #f0f4f0', marginTop: '4px' }}>
//                         <span style={{ color: '#151e13' }}>Total</span>
//                         <span style={{ color: '#855000' }}>€{fmt(order.total)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )
//       })}
//     </div>
//   )
// }

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '../components/StatusBadge'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
const fmt = (n) => Number(n || 0).toFixed(2)

const FULFILLMENT_ICONS = {
  delivery: 'local_shipping',
  collect:  'store',
  instore:  'shopping_basket',
}

// Statuses that cannot be cancelled
const NON_CANCELLABLE = ['SHIPPED', 'DELIVERED', 'CANCELLED']

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

function normalizeOrder(o) {
  return {
    id: o.id,
    orderNumber: o.order_number || o.orderNumber,
    createdAt: o.ordered_at || o.createdAt,
    status: o.status,
    total: o.total_amount || o.total,
    subtotal: o.cart_subtotal || o.subtotal,
    deliveryFee: (Number(o.total_amount || 0) - Number(o.cart_subtotal || 0)) || 0,
    customerName: o.customer_name || o.customerName,
    street: o.street_address || o.street,
    city: o.city,
    postcode: o.postcode,
    deliveryDate: o.delivery_date || o.deliveryDate,
    deliverySlot: o.delivery_slot_label || o.deliverySlot,
    fulfillment: 'delivery',
    items: (o.items || []).map(i => ({
      id: i.id,
      productName: i.product_name || i.productName,
      productImage: i.product_image || i.productImage,
      quantity: i.quantity,
      unitPrice: i.unit_price || i.unitPrice,
      lineTotal: i.line_total || i.lineTotal,
    }))
  }
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
function CancelModal({ orderNumber, onConfirm, onClose, cancelling }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8, 30, 19, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'mcFadeIn 0.18s ease',
        }}
      />

      {/* Modal box */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        background: '#ffffff',
        borderRadius: 20,
        padding: '32px 28px 24px',
        width: 'min(380px, calc(100vw - 32px))',
        boxShadow: '0 24px 64px rgba(8,30,19,0.18), 0 4px 16px rgba(8,30,19,0.08)',
        animation: 'mcPopIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>

        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <span className="material-symbols-outlined"
            style={{ color: '#991B1B', fontSize: 26, fontVariationSettings: "'FILL' 0" }}>
            delete
          </span>
        </div>

        {/* Heading */}
        <h3 style={{
          margin: '0 0 8px', textAlign: 'center',
          fontSize: 18, fontWeight: 700, color: '#151e13',
          fontFamily: '"Newsreader", Georgia, serif',
        }}>
          Cancel this order?
        </h3>

        {/* Sub-text */}
        <p style={{
          margin: '0 0 26px', textAlign: 'center',
          fontSize: 13.5, color: '#6d7a73', lineHeight: 1.55,
        }}>
          Order{' '}
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00694C' }}>
            #{orderNumber}
          </span>{' '}
          will be permanently cancelled. This cannot be undone.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={cancelling}
            style={{
              flex: 1, padding: '11px 0',
              background: '#F3F6F4', border: '1.5px solid #E2EAE5',
              borderRadius: 12, cursor: cancelling ? 'not-allowed' : 'pointer',
              fontSize: 13.5, fontWeight: 600, color: '#3d4943',
              fontFamily: 'inherit', opacity: cancelling ? 0.6 : 1,
            }}
          >
            Keep Order
          </button>

          <button
            onClick={onConfirm}
            disabled={cancelling}
            style={{
              flex: 1, padding: '11px 0',
              background: cancelling ? '#b91c1c' : '#991B1B',
              border: 'none', borderRadius: 12,
              cursor: cancelling ? 'not-allowed' : 'pointer',
              fontSize: 13.5, fontWeight: 600, color: '#ffffff',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {cancelling
              ? <><span className="material-symbols-outlined" style={{ fontSize: 15, animation: 'spin .7s linear infinite' }}>progress_activity</span> Cancelling…</>
              : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span> Yes, Cancel</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes mcFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mcPopIn  {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.9) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1)   }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
// Props:
//   authFetch      — authenticated fetch helper
//   initialOrders  — pre-fetched server data (optional)
//   onDeleteOrder  — async fn(orderNumber) => void  (call your API inside this)
export default function OrdersTab({ authFetch, initialOrders = null, onDeleteOrder }) {
  const [orders,       setOrders]       = useState(() => toArray(initialOrders).map(normalizeOrder))
  const [loading,      setLoading]      = useState(initialOrders === null)
  const [expanded,     setExpanded]     = useState(null)
  const [confirmOrder, setConfirmOrder] = useState(null)   // { id, orderNumber } | null
  const [cancelling,   setCancelling]   = useState(false)

  useEffect(() => {
    if (initialOrders !== null) return
    authFetch(`${API_BASE}/auth/orders/`)
      .then(r => r.json())
      .then(data => setOrders(toArray(data).map(normalizeOrder)))
      .finally(() => setLoading(false))
  }, [])

  const handleCancelClick = (e, order) => {
    e.stopPropagation()
    setConfirmOrder({ id: order.id, orderNumber: order.orderNumber })
  }

  const handleConfirm = async () => {
    if (!confirmOrder || cancelling) return
    setCancelling(true)
    try {
      await onDeleteOrder?.(confirmOrder.orderNumber)
      setOrders(prev => prev.filter(o => o.id !== confirmOrder.id))
      if (expanded === confirmOrder.id) setExpanded(null)
    } finally {
      setCancelling(false)
      setConfirmOrder(null)
    }
  }

  const handleClose = () => {
    if (!cancelling) setConfirmOrder(null)
  }

  if (loading) return (
    <div className="py-12 text-center" style={{ color: '#6d7a73' }}>Loading orders…</div>
  )

  if (!orders.length) return (
    <div className="py-16 text-center">
      <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#BCCAC1' }}>receipt_long</span>
      <p className="italic text-lg" style={{ fontFamily: '"Newsreader",Georgia,serif', color: '#6d7a73' }}>No orders yet</p>
      <Link href="/shop" className="mt-4 inline-block px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#00694C' }}>
        Browse Market
      </Link>
    </div>
  )

  return (
    <>
      {confirmOrder && (
        <CancelModal
          orderNumber={confirmOrder.orderNumber}
          onConfirm={handleConfirm}
          onClose={handleClose}
          cancelling={cancelling}
        />
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const isOpen      = expanded === order.id
          const fulfillIcon = FULFILLMENT_ICONS[order.fulfillment] || 'local_shipping'
          const cancellable = !NON_CANCELLABLE.includes(order.status)

          return (
            <div key={order.id} className="rounded-2xl overflow-hidden"
              style={{ border: `1.5px solid ${isOpen ? '#00694C40' : '#eaeaea'}`, background: '#fff' }}>

              {/* ── Accordion header ── */}
              <button onClick={() => setExpanded(isOpen ? null : order.id)} className="w-full text-left"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div className="flex items-center justify-between p-4 md:p-5"
                  style={{ background: isOpen ? '#F0FAF5' : '#f8fbf8', borderBottom: isOpen ? '1px solid #e0eee8' : 'none' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E8F5EE' }}>
                      <span className="material-symbols-outlined text-base" style={{ color: '#00694C', fontVariationSettings: "'FILL' 1" }}>{fulfillIcon}</span>
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold" style={{ color: '#3d4943' }}>{order.orderNumber}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9daaa3' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="material-symbols-outlined text-base"
                      style={{ color: '#BCCAC1', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
                      expand_more
                    </span>
                  </div>
                </div>
              </button>

              {/* ── Collapsed summary row ── */}
              {!isOpen && (
                <div className="px-4 md:px-5 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm truncate" style={{ color: '#6d7a73', maxWidth: '60%' }}>
                    {order.items?.map(i => i.productName).join(', ')}
                  </p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: '#151e13' }}>€{fmt(order.total)}</p>
                    {cancellable && (
                      <button
                        onClick={(e) => handleCancelClick(e, order)}
                        title="Cancel order"
                        style={{
                          background: 'none', border: '1.5px solid #FEE2E2', borderRadius: 8,
                          padding: '4px 9px', cursor: 'pointer', color: '#991B1B',
                          fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Expanded detail ── */}
              {isOpen && (
                <div>
                  {/* Items */}
                  <div className="p-4 md:p-5 space-y-3" style={{ borderBottom: '1px solid #f0f4f0' }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6d7a73' }}>Items Ordered</p>
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#ECF7E4', border: '1px solid #e0eee8' }}>
                          {item.productImage
                            ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-base" style={{ color: '#BCCAC1' }}>eco</span>
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#151e13' }}>{item.productName}</p>
                          <p className="text-xs" style={{ color: '#6d7a73' }}>{item.quantity} × €{fmt(item.unitPrice)}</p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0" style={{ color: '#855000' }}>€{fmt(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery + Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={{ borderBottom: '1px solid #f0f4f0' }}>
                    <div className="p-4 md:p-5" style={{ borderRight: '1px solid #f0f4f0' }}>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6d7a73' }}>Delivery Details</p>
                      <div className="space-y-1.5">
                        {order.customerName && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base" style={{ color: '#BCCAC1' }}>person</span>
                            <span className="text-sm" style={{ color: '#3d4943' }}>{order.customerName}</span>
                          </div>
                        )}
                        {order.street && (
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-base mt-0.5" style={{ color: '#BCCAC1' }}>location_on</span>
                            <span className="text-sm" style={{ color: '#3d4943' }}>{order.street}, {order.city} {order.postcode}</span>
                          </div>
                        )}
                        {order.deliveryDate && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base" style={{ color: '#BCCAC1' }}>calendar_today</span>
                            <span className="text-sm" style={{ color: '#3d4943' }}>
                              {order.deliveryDate}
                              {order.deliverySlot && <span style={{ color: '#6d7a73' }}> · {order.deliverySlot}</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 md:p-5">
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6d7a73' }}>Payment Summary</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}>
                          <span>Subtotal</span><span>€{fmt(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}>
                          <span>Delivery</span>
                          <span>{Number(order.deliveryFee) === 0 ? 'Free' : `€${fmt(order.deliveryFee)}`}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-2"
                          style={{ borderTop: '1px solid #f0f4f0', marginTop: '4px' }}>
                          <span style={{ color: '#151e13' }}>Total</span>
                          <span style={{ color: '#855000' }}>€{fmt(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancel button (expanded footer) */}
                  {cancellable && (
                    <div className="p-4 md:p-5 flex justify-end">
                      <button
                        onClick={(e) => handleCancelClick(e, order)}
                        style={{
                          background: 'none', border: '1.5px solid #FEE2E2',
                          borderRadius: 10, padding: '8px 16px',
                          cursor: 'pointer', color: '#991B1B',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}