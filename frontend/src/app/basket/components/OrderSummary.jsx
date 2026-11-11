// 'use client'
// // src/app/basket/_components/OrderSummary.jsx

// import { useState, useTransition } from 'react'
// import { useRouter } from 'next/navigation'
// import { useCart } from '@/app/context/CartContext'   // ← NEW

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

// export default function OrderSummary({ subtotal, items = [], isApprovedWholesale = false }) {
//   const router = useRouter()
//   const [isPending, startTransition] = useTransition()

//   // ── Promo state — CartContext থেকে (চেকআউটেও persist করে) ──────────────
//   const {
//     promoState, setPromoState,
//     promoDiscount, discountedSubtotal,
//   } = useCart()                                       // ← NEW

//   // ── Local UI state (শুধু এই component-এর জন্য) ──────────────────────────
//   const [promoCode,    setPromoCode]    = useState('')
//   const [promoLoading, setPromoLoading] = useState(false)
//   const [promoError,   setPromoError]   = useState('')

//   // ── Wholesale min-qty popup ───────────────────────────────────────────────
//   const [popup, setPopup] = useState(false)

//   const violatingItems = isApprovedWholesale
//     ? items.filter(item => item.wholesalePrice && item.qty < (item.minWholesaleQty || 1))
//     : []

//   // finalTotal এখন CartContext এর discountedSubtotal ─────────────────────────
//   const finalTotal = discountedSubtotal                // ← CHANGED

//   // ── Apply promo code ──────────────────────────────────────────────────────
//   async function handleApplyPromo() {
//     const trimmed = promoCode.trim()
//     if (!trimmed) return

//     setPromoLoading(true)
//     setPromoError('')
//     setPromoState(null)                                // ← CartContext reset

//     try {
//       const res = await fetch(`${API_BASE}/products/promo/validate/`, {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body:    JSON.stringify({
//           code:        trimmed,
//           product_ids: items.map(i => i.id),
//         }),
//       })
//       const data = await res.json()

//       if (data.valid) {
//         // discount_amount হিসাব করে CartContext-এ save করি
//         const discount = items.reduce((sum, item) => {
//           if (!data.applicable_product_ids.includes(item.id)) return sum
//           const price = item.effectivePrice ?? item.price
//           return sum + price * item.qty * (data.discount_percent / 100)
//         }, 0)

//         setPromoState({                                // ← CartContext update
//           code:                   trimmed.toUpperCase(),
//           discount_percent:       data.discount_percent,
//           applicable_product_ids: data.applicable_product_ids,
//           discount_amount:        discount,
//           message:                data.message,
//         })
//       } else {
//         setPromoError(data.message || 'Invalid promo code.')
//       }
//     } catch {
//       setPromoError('Could not validate code. Please try again.')
//     } finally {
//       setPromoLoading(false)
//     }
//   }

//   function handleRemovePromo() {
//     setPromoState(null)                                // ← CartContext reset
//     setPromoCode('')
//     setPromoError('')
//   }

//   // ── Checkout ──────────────────────────────────────────────────────────────
//   function handleCheckout() {
//     if (violatingItems.length > 0) {
//       setPopup(true)
//     } else {
//       startTransition(() => router.push('/checkout'))
//     }
//   }

//   return (
//     <>
//       <div className="lg:sticky lg:top-24 space-y-4">
//         <div
//           className="p-6 md:p-8 rounded-2xl space-y-6 md:space-y-8"
//           style={{ background: '#f8fbf8', border: '1px solid #e8eee8' }}
//         >
//           <h2
//             className="text-2xl md:text-3xl font-light italic"
//             style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}
//           >
//             Order Summary
//           </h2>

//           {/* ── Price breakdown ─────────────────────────────────────────── */}
//           <div className="space-y-3">
//             <div className="flex justify-between text-sm" style={{ color: '#3d4943' }}>
//               <span>Subtotal</span>
//               <span>€{subtotal.toFixed(2)}</span>
//             </div>

//             {/* Promo discount row */}
//             {promoState && promoDiscount > 0 && (
//               <div className="flex justify-between text-sm items-center">
//                 <span style={{ color: '#00694c' }}>
//                   Promo ({promoState.discount_percent}% off)
//                 </span>
//                 <span className="font-bold" style={{ color: '#00694c' }}>
//                   −€{promoDiscount.toFixed(2)}
//                 </span>
//               </div>
//             )}

//             <div className="flex justify-between text-sm items-center" style={{ color: '#3d4943' }}>
//               <span>Delivery</span>
//               <div className="flex items-center gap-2">
//                 <span
//                   className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold"
//                   style={{ background: '#d4ede5', color: '#095041' }}
//                 >
//                   Free
//                 </span>
//                 <span className="font-bold" style={{ color: '#00694c' }}>€0.00</span>
//               </div>
//             </div>

//             <div
//               className="pt-4 mt-2 flex justify-between items-end"
//               style={{ borderTop: '1px solid #e8eee8' }}
//             >
//               <span className="font-bold uppercase tracking-tight" style={{ color: '#151e13' }}>
//                 Total
//               </span>
//               <div className="text-right">
//                 {promoState && promoDiscount > 0 && (
//                   <p className="text-sm line-through" style={{ color: '#bccac1' }}>
//                     €{subtotal.toFixed(2)}
//                   </p>
//                 )}
//                 <p
//                   className="text-3xl font-bold"
//                   style={{
//                     fontFamily: '"Newsreader", Georgia, serif',
//                     color: promoState ? '#00694c' : '#855000',
//                   }}
//                 >
//                   €{finalTotal.toFixed(2)}
//                 </p>
//                 <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: '#6d7a73' }}>
//                   VAT included
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* ── Promo code ──────────────────────────────────────────────── */}
//           <div className="space-y-2">
//             <label
//               className="text-[10px] uppercase tracking-widest font-bold"
//               style={{ color: '#6d7a73' }}
//             >
//               Promo Code
//             </label>

//             {promoState ? (
//               <div
//                 className="flex items-center justify-between rounded-lg px-4 py-3"
//                 style={{ background: '#edf7f2', border: '1px solid #d4ede5' }}
//               >
//                 <div className="flex items-center gap-2">
//                   <span
//                     className="material-symbols-outlined text-[18px]"
//                     style={{ color: '#00694c', fontVariationSettings: "'FILL' 1" }}
//                   >
//                     check_circle
//                   </span>
//                   <div>
//                     <p className="text-sm font-bold" style={{ color: '#00694c' }}>
//                       {promoState.code}
//                     </p>
//                     <p className="text-xs" style={{ color: '#3d4943' }}>
//                       {promoState.message}
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleRemovePromo}
//                   className="text-xs font-bold cursor-pointer"
//                   style={{ color: '#ba1a1a' }}
//                 >
//                   Remove
//                 </button>
//               </div>
//             ) : (
//               <>
//                 <div className="flex gap-2">
//                   <input
//                     type="text"
//                     value={promoCode}
//                     onChange={e => { setPromoCode(e.target.value); setPromoError('') }}
//                     onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
//                     placeholder="Enter code"
//                     className="flex-grow rounded-lg px-4 py-3 text-sm border outline-none transition-all focus:ring-2 focus:ring-[#00694c]/20"
//                     style={{ background: '#ffffff', borderColor: promoError ? '#fca5a5' : '#e0e6e0', color: '#151e13' }}
//                   />
//                   <button
//                     onClick={handleApplyPromo}
//                     disabled={promoLoading || !promoCode.trim()}
//                     className="px-4 py-2 cursor-pointer rounded-lg text-sm font-bold transition-colors"
//                     style={{
//                       background: promoLoading ? '#6d7a73' : '#151e13',
//                       color: '#ffffff',
//                       opacity: (!promoCode.trim()) ? 0.5 : 1,
//                     }}
//                   >
//                     {promoLoading ? '...' : 'Apply'}
//                   </button>
//                 </div>
//                 {promoError && (
//                   <p className="text-xs flex items-center gap-1" style={{ color: '#ba1a1a' }}>
//                     <span className="material-symbols-outlined text-[14px]">error</span>
//                     {promoError}
//                   </p>
//                 )}
//               </>
//             )}
//           </div>

//           {/* ── Checkout CTA ─────────────────────────────────────────────── */}
//           <button
//             onClick={handleCheckout}
//             disabled={isPending}
//             className="w-full cursor-pointer flex items-center justify-center gap-3 py-4 md:py-5 rounded-lg font-bold text-white transition-all hover:brightness-105 active:scale-[0.98]"
//             style={{
//               background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)',
//               boxShadow:  '0 8px 24px -4px rgba(0,105,76,0.25)',
//             }}
//           >
//             Proceed to Checkout
//             <span className="material-symbols-outlined">arrow_forward</span>
//           </button>

//           <div className="flex justify-center items-center gap-6 pt-2" style={{ opacity: 0.4 }}>
//             <span className="material-symbols-outlined text-3xl" style={{ color: '#151e13' }}>credit_card</span>
//             <span className="material-symbols-outlined text-3xl" style={{ color: '#151e13' }}>verified_user</span>
//             <span className="material-symbols-outlined text-3xl" style={{ color: '#151e13' }}>payments</span>
//           </div>
//         </div>
//       </div>

//       {/* ── Wholesale min-qty popup ──────────────────────────────────────── */}
//       {popup && (
//         <div
//           className="fixed inset-0 z-40"
//           style={{ background: 'rgba(0,0,0,0.35)' }}
//           onClick={() => setPopup(false)}
//         />
//       )}

//       <div
//         className="fixed left-0 right-0 bottom-0 z-50 transition-transform duration-300 ease-out"
//         style={{ transform: popup ? 'translateY(0)' : 'translateY(110%)' }}
//       >
//         <div
//           className="mx-auto max-w-lg rounded-t-3xl px-6 pt-6 pb-10"
//           style={{ background: '#ffffff', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
//         >
//           <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#dde8dd' }} />

//           <div className="flex items-start gap-4 mb-5">
//             <div
//               className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
//               style={{ background: '#FFF3CD' }}
//             >
//               <span
//                 className="material-symbols-outlined"
//                 style={{ color: '#B45309', fontSize: '22px', fontVariationSettings: "'FILL' 1" }}
//               >
//                 warning
//               </span>
//             </div>
//             <div>
//               <h3 className="text-lg font-bold" style={{ color: '#151e13' }}>
//                 Minimum Quantity Required
//               </h3>
//               <p className="text-sm mt-1" style={{ color: '#6d7a73' }}>
//                 Update the quantities below to continue.
//               </p>
//             </div>
//           </div>

//           <div className="space-y-3 mb-6">
//             {violatingItems.map(item => (
//               <div
//                 key={item.id}
//                 className="flex items-center justify-between rounded-xl px-4 py-3"
//                 style={{ background: '#FFF8EE', border: '1px solid #FFE4B2' }}
//               >
//                 <div>
//                   <p className="text-sm font-bold" style={{ color: '#151e13' }}>{item.name}</p>
//                   <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>
//                     You have {item.qty} — minimum is{' '}
//                     <span className="font-bold">{item.minWholesaleQty}</span>
//                   </p>
//                 </div>
//                 <span
//                   className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
//                   style={{ background: '#FFE4B2', color: '#92400E' }}
//                 >
//                   +{item.minWholesaleQty - item.qty} needed
//                 </span>
//               </div>
//             ))}
//           </div>

//           <button
//             onClick={() => setPopup(false)}
//             className="w-full py-4 rounded-xl text-sm font-bold cursor-pointer transition-all hover:brightness-105 text-white"
//             style={{ background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)' }}
//           >
//             Update My Cart
//           </button>
//         </div>
//       </div>
//     </>
//   )
// }


'use client'
// src/app/basket/components/OrderSummary.jsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/context/CartContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export default function OrderSummary({
  subtotal,
  deliveryFee   = 0,        // ← BasketShell থেকে calculated
  deliveryConfig = null,    // ← DB config (charge_type, flat_fee, free_threshold)
  grandTotal,               // ← subtotal + deliveryFee
  items = [],
  isApprovedWholesale = false,
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    promoState, setPromoState,
    promoDiscount, discountedSubtotal,
  } = useCart()

  const [promoCode,    setPromoCode]    = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError,   setPromoError]   = useState('')
  const [popup,        setPopup]        = useState(false)

  const violatingItems = isApprovedWholesale
    ? items.filter(item => item.wholesalePrice && item.qty < (item.minWholesaleQty || 1))
    : []

  // ── Delivery after promo applied ──────────────────────────────────────────
  // promoDiscount apply হলে discountedSubtotal-এর উপর delivery recalculate করি
  const effectiveSubtotal = promoState ? discountedSubtotal : subtotal
  const effectiveDelivery = calcDeliveryFee(deliveryConfig, effectiveSubtotal)
  const finalTotal        = effectiveSubtotal + effectiveDelivery

  // ── Delivery badge text ───────────────────────────────────────────────────
  const deliveryLabel = getDeliveryLabel(deliveryConfig, effectiveSubtotal, effectiveDelivery)

  // ── Apply promo ────────────────────────────────────────────────────────────
  async function handleApplyPromo() {
    const trimmed = promoCode.trim()
    if (!trimmed) return
    setPromoLoading(true)
    setPromoError('')
    setPromoState(null)
    try {
      // Build quantities map for min_quantity validation
      const quantities = {}
      items.forEach(i => { quantities[String(i.id)] = i.qty })

      const res = await fetch(`${API_BASE}/orders/coupons/validate/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          code:        trimmed,
          product_ids: items.map(i => String(i.id)),
          quantities,
          cart_total:  subtotal,
        }),
      })
      const data = await res.json()
      if (data.valid) {
        const applicableIds = data.applicable_product_ids || items.map(i => String(i.id))

        // Calculate discount client-side (handles both FLAT and PERCENT)
        let discount
        if (data.discount_type === 'FLAT') {
          discount = Number(data.discount_amount)
        } else {
          discount = items.reduce((sum, item) => {
            if (!applicableIds.includes(String(item.id))) return sum
            const price = item.effectivePrice ?? item.price
            return sum + price * item.qty * (Number(data.discount_percent) / 100)
          }, 0)
        }

        setPromoState({
          code:                   trimmed.toUpperCase(),
          discount_percent:       Number(data.discount_percent),
          discount_type:          data.discount_type,
          applicable_product_ids: applicableIds,
          flat_discount_amount:   data.discount_type === 'FLAT' ? Number(data.discount_amount) : 0,
          discount_amount:        discount,
          min_quantity_required:  data.coupon?.min_quantity_required || 1,
          message:                data.message,
        })
      } else {
        setPromoError(data.message || 'Invalid promo code.')
      }
    } catch {
      setPromoError('Could not validate code. Please try again.')
    } finally {
      setPromoLoading(false)
    }
  }

  function handleRemovePromo() {
    setPromoState(null)
    setPromoCode('')
    setPromoError('')
  }

  function handleCheckout() {
    if (violatingItems.length > 0) setPopup(true)
    else startTransition(() => router.push('/checkout'))
  }

  return (
    <>
      <div className="lg:sticky lg:top-24 space-y-4">
        <div
          className="p-6 md:p-8 rounded-2xl space-y-6 md:space-y-8"
          style={{ background: '#f8fbf8', border: '1px solid #e8eee8' }}
        >
          <h2
            className="text-2xl md:text-3xl font-light italic"
            style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}
          >
            Order Summary
          </h2>

          {/* ── Price breakdown ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm" style={{ color: '#3d4943' }}>
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>

            {/* Promo row */}
            {promoState && promoDiscount > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span style={{ color: '#00694c' }}>
                  Promo ({promoState.discount_type === 'FLAT'
                    ? `€${Number(promoState.flat_discount_amount || 0).toFixed(2)} off`
                    : `${promoState.discount_percent}% off`})
                </span>
                <span className="font-bold" style={{ color: '#00694c' }}>
                  −€{promoDiscount.toFixed(2)}
                </span>
              </div>
            )}
            {/* Promo invalid warning — qty dropped below minimum */}
            {promoState && promoDiscount === 0 && (() => {
              const appIds = promoState.applicable_product_ids || []
              const hasRestriction = appIds.length > 0
              const qualQty = items.filter(i => !hasRestriction || appIds.includes(String(i.id))).reduce((s, i) => s + i.qty, 0)
              const need = (promoState.min_quantity_required || 1) - qualQty
              const msg = need > 0
                ? `Add ${need} more item(s)${hasRestriction ? ' of the applicable products' : ''} to activate ${promoState.code}`
                : `${promoState.code} doesn't apply to any items in your cart`
              return (
                <div className="flex items-center gap-1 text-xs" style={{ color: '#ba1a1a' }}>
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>{msg}</span>
                </div>
              )
            })()}

            {/* ── Delivery row ────────────────────────────────────────────── */}
            <div className="flex justify-between text-sm items-center" style={{ color: '#3d4943' }}>
              <span>Delivery</span>
              <div className="flex items-center gap-2">
                {effectiveDelivery === 0 ? (
                  <>
                    <span
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold"
                      style={{ background: '#d4ede5', color: '#095041' }}
                    >
                      Free
                    </span>
                    <span className="font-bold" style={{ color: '#00694c' }}>€0.00</span>
                  </>
                ) : (
                  <span className="font-bold" style={{ color: '#151e13' }}>
                    €{effectiveDelivery.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Threshold hint — "spend €X more for free delivery" */}
            {deliveryConfig?.charge_type === 'threshold' && effectiveDelivery > 0 && (
              <p className="text-[11px] italic" style={{ color: '#6d7a73' }}>
                Spend €{(Number(deliveryConfig.free_threshold) - effectiveSubtotal).toFixed(2)} more for free delivery
              </p>
            )}

            <div
              className="pt-4 mt-2 flex justify-between items-end"
              style={{ borderTop: '1px solid #e8eee8' }}
            >
              <span className="font-bold uppercase tracking-tight" style={{ color: '#151e13' }}>
                Total
              </span>
              <div className="text-right">
                {promoState && promoDiscount > 0 && (
                  <p className="text-sm line-through" style={{ color: '#bccac1' }}>
                    €{(subtotal + effectiveDelivery).toFixed(2)}
                  </p>
                )}
                <p
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: '"Newsreader", Georgia, serif',
                    color: promoState ? '#00694c' : '#855000',
                  }}
                >
                  €{finalTotal.toFixed(2)}
                </p>
                <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: '#6d7a73' }}>
                  VAT included
                </p>
              </div>
            </div>
          </div>

          {/* ── Promo code ────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#6d7a73' }}>
              Promo Code
            </label>

            {promoState ? (
              <div
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ background: '#edf7f2', border: '1px solid #d4ede5' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: '#00694c', fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#00694c' }}>{promoState.code}</p>
                    <p className="text-xs" style={{ color: '#3d4943' }}>{promoState.message}</p>
                  </div>
                </div>
                <button onClick={handleRemovePromo} className="text-xs font-bold cursor-pointer" style={{ color: '#ba1a1a' }}>
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value); setPromoError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                    placeholder="Enter code"
                    className="flex-grow rounded-lg px-4 py-3 text-sm border outline-none transition-all focus:ring-2 focus:ring-[#00694c]/20"
                    style={{ background: '#ffffff', borderColor: promoError ? '#fca5a5' : '#e0e6e0', color: '#151e13' }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 py-2 cursor-pointer rounded-lg text-sm font-bold transition-colors"
                    style={{
                      background: promoLoading ? '#6d7a73' : '#151e13',
                      color: '#ffffff',
                      opacity: !promoCode.trim() ? 0.5 : 1,
                    }}
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#ba1a1a' }}>
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {promoError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Checkout CTA ──────────────────────────────────────────────── */}
          <button
            onClick={handleCheckout}
            disabled={isPending}
            className="w-full cursor-pointer flex items-center justify-center gap-3 py-4 md:py-5 rounded-lg font-bold text-white transition-all hover:brightness-105 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)',
              boxShadow:  '0 8px 24px -4px rgba(0,105,76,0.25)',
            }}
          >
            Proceed to Checkout
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          <div className="flex justify-center items-center gap-6 pt-2" style={{ opacity: 0.4 }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: '#151e13' }}>credit_card</span>
            <span className="material-symbols-outlined text-3xl" style={{ color: '#151e13' }}>verified_user</span>
            <span className="material-symbols-outlined text-3xl" style={{ color: '#151e13' }}>payments</span>
          </div>
        </div>
      </div>

      {/* ── Wholesale popup ────────────────────────────────────────────────── */}
      {popup && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={() => setPopup(false)} />
      )}
      <div
        className="fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ease-out"
        style={{ transform: popup ? 'translateY(0)' : 'translateY(-110%)' }}
      >
        <div className="mx-auto max-w-lg rounded-b-3xl px-6 pt-10 pb-6" style={{ background: '#ffffff', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#FFF3CD' }}>
              <span className="material-symbols-outlined" style={{ color: '#B45309', fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#151e13' }}>Minimum Quantity Required</h3>
              <p className="text-sm mt-1" style={{ color: '#6d7a73' }}>Update the quantities below to continue.</p>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            {violatingItems.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: '#FFF8EE', border: '1px solid #FFE4B2' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#151e13' }}>{item.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>
                    You have {item.qty} — minimum is <span className="font-bold">{item.minWholesaleQty}</span>
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0" style={{ background: '#FFE4B2', color: '#92400E' }}>
                  +{item.minWholesaleQty - item.qty} needed
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setPopup(false)} className="w-full py-4 rounded-xl text-sm font-bold cursor-pointer text-white mb-2" style={{ background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)' }}>
            Update My Cart
          </button>
          <div className="w-10 h-1 rounded-full mx-auto mt-4" style={{ background: '#dde8dd' }} />
        </div>
      </div>
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcDeliveryFee(config, subtotal) {
  if (!config || !config.is_active || config.charge_type === 'free') return 0
  if (config.charge_type === 'flat') return Number(config.flat_fee)
  if (config.charge_type === 'threshold') {
    return subtotal >= Number(config.free_threshold) ? 0 : Number(config.flat_fee)
  }
  return 0
}

function getDeliveryLabel(config, subtotal, fee) {
  if (!config || !config.is_active || config.charge_type === 'free') return 'Free'
  if (config.charge_type === 'flat') return fee === 0 ? 'Free' : `€${Number(config.flat_fee).toFixed(2)}`
  if (config.charge_type === 'threshold') {
    return subtotal >= Number(config.free_threshold) ? 'Free' : `€${Number(config.flat_fee).toFixed(2)}`
  }
  return 'Free'
}