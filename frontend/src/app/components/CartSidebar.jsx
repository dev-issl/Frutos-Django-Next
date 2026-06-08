// 'use client'

// import { useEffect, useRef } from 'react'
// import Image from 'next/image'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { useCart } from '@/app/context/CartContext'

// export default function CartSidebar() {
//   const { items, subtotal, totalItems, sidebarOpen, setSidebarOpen, updateQty, removeItem } = useCart()
//   const router = useRouter()
//   const overlayRef = useRef(null)

//   // Lock body scroll when open
//   useEffect(() => {
//     document.body.style.overflow = sidebarOpen ? 'hidden' : ''
//     return () => { document.body.style.overflow = '' }
//   }, [sidebarOpen])

//   function handleCheckout() {
//     setSidebarOpen(false)
//     router.push('/basket')
//   }

//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         ref={overlayRef}
//         onClick={() => setSidebarOpen(false)}
//         className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
//         style={{
//           opacity: sidebarOpen ? 1 : 0,
//           pointerEvents: sidebarOpen ? 'auto' : 'none',
//         }}
//       />

//       {/* Drawer */}
//       <aside
//         className="fixed top-0 right-0 h-full z-50 flex flex-col"
//         style={{
//           width: 'min(440px, 100vw)',
//           background: '#ffffff',
//           boxShadow: '-24px 0 80px rgba(0,33,21,0.12)',
//           transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
//           transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
//         }}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-5 border-b border-[#bccac1]/30">
//           <div>
//             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7a73]">
//               Your Basket
//             </p>
//             <h2
//               className="text-2xl italic leading-tight"
//               style={{ fontFamily: '"Newsreader", Georgia, serif' }}
//             >
//               {totalItems} {totalItems === 1 ? 'item' : 'items'}
//             </h2>
//           </div>
//           <button
//             onClick={() => setSidebarOpen(false)}
//             className="w-10 cursor-pointer h-10 flex items-center justify-center rounded-full hover:bg-[#f0f4f0] transition-colors"
//           >
//             <span className="material-symbols-outlined text-[#3d4943]">close</span>
//           </button>
//         </div>

//         {/* Items list */}
//         <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
//           {items.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
//               <span className="material-symbols-outlined text-5xl text-[#bccac1]">
//                 shopping_basket
//               </span>
//               <p
//                 className="text-xl italic text-[#6d7a73]"
//                 style={{ fontFamily: '"Newsreader", Georgia, serif' }}
//               >
//                 Your basket is empty
//               </p>
//               <p className="text-sm text-[#6d7a73]">
//                 Add something fresh from the market
//               </p>
//               <button
//                 onClick={() => setSidebarOpen(false)}
//                 className="mt-2 cursor-pointer px-6 py-3 rounded-full border border-[#00694c]/30 text-[#00694c] text-sm font-bold hover:bg-[#f0f4f0] transition-colors"
//               >
//                 Browse Market
//               </button>
//             </div>
//           ) : (
//             items.map(item => (
//               <div key={item.id} className="flex gap-4 group">
//                 <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white">
//                   <Image
//                     src={item.image}
//                     alt={item.name}
//                     width={80}
//                     height={80}
//                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                   />
//                 </div>
//                 <div className="flex-1 flex flex-col justify-between py-0.5">
//                   <div className="flex items-start justify-between gap-2">
//                     <div>
//                       <h3 className="font-bold text-[#151e13] text-sm leading-tight">
//                         {item.name}
//                       </h3>
//                       <p
//                         className="text-xs italic text-[#00694c] mt-0.5"
//                         style={{ fontFamily: '"Newsreader", Georgia, serif' }}
//                       >
//                         from {item.origin}
//                       </p>
//                     </div>
//                     <button
//                       onClick={() => removeItem(item.id)}
//                       className="cursor-pointer text-[#bccac1] hover:text-[#ba1a1a] transition-colors mt-0.5"
//                     >
//                       <span className="material-symbols-outlined text-[18px]">close</span>
//                     </button>
//                   </div>

//                   <div className="flex items-center justify-between mt-2">
//                     {/* Qty stepper */}
//                     <div className="flex items-center bg-[#f0f4f0] rounded-lg p-0.5">
//                       <button
//                         onClick={() => updateQty(item.id, item.qty - 1)}
//                         className="w-7 cursor-pointer h-7 flex items-center justify-center hover:bg-[#e2e8e2] rounded transition-colors"
//                       >
//                         <span className="material-symbols-outlined text-[16px]">remove</span>
//                       </button>
//                       <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
//                       <button
//                         onClick={() => updateQty(item.id, item.qty + 1)}
//                         className="w-7 cursor-pointer h-7 flex items-center justify-center hover:bg-[#e2e8e2] rounded transition-colors"
//                       >
//                         <span className="material-symbols-outlined text-[16px]">add</span>
//                       </button>
//                     </div>
//                     <span className="font-bold text-[#855000] text-sm">
//                       €{(item.price * item.qty).toFixed(2)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Footer */}
//         {items.length > 0 && (
//           <div className="px-6 py-6 border-t border-[#bccac1]/30 space-y-4 bg-[#f5f9f5]">
//             {/* Subtotal */}
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[#6d7a73]">Subtotal</span>
//               <span className="font-bold text-[#151e13]">€{subtotal.toFixed(2)}</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[#6d7a73]">Delivery</span>
//               <div className="flex items-center gap-2">
//                 <span className="bg-[#adedd8] text-[#095041] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
//                   Free
//                 </span>
//                 <span className="font-bold text-[#00694c]">€0.00</span>
//               </div>
//             </div>

//             <div className="pt-3 border-t border-[#bccac1]/30 flex items-end justify-between">
//               <span className="font-bold text-[#151e13] uppercase tracking-tight text-sm">Total</span>
//               <div className="text-right">
//                 <p
//                   className="text-2xl font-bold text-[#855000]"
//                   style={{ fontFamily: '"Newsreader", Georgia, serif' }}
//                 >
//                   €{subtotal.toFixed(2)}
//                 </p>
//                 <p className="text-[10px] text-[#6d7a73] uppercase tracking-widest">VAT included</p>
//               </div>
//             </div>

//             {/* CTA */}
//             <button
//               onClick={handleCheckout}
//               className="w-full cursor-pointer flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white transition-all hover:brightness-105 active:scale-[0.98]"
//               style={{
//                 background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)',
//                 boxShadow: '0 8px 24px -4px rgba(0,105,76,0.3)',
//               }}
//             >
//               View Basket & Checkout
//               <span className="material-symbols-outlined">arrow_forward</span>
//             </button>

//             <div className="flex justify-center items-center gap-4 opacity-40 grayscale">
//               <span className="material-symbols-outlined text-2xl">credit_card</span>
//               <span className="material-symbols-outlined text-2xl">verified_user</span>
//               <span className="material-symbols-outlined text-2xl">payments</span>
//             </div>
//           </div>
//         )}
//       </aside>
//     </>
//   )
// }

'use client'

import { useEffect, useRef, useState } from 'react'  // ← useState যোগ করো
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/context/CartContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

function calcDeliveryFee(config, subtotal) {
  if (!config || !config.is_active || config.charge_type === 'free') return 0
  if (config.charge_type === 'flat') return Number(config.flat_fee)
  if (config.charge_type === 'threshold') {
    return subtotal >= Number(config.free_threshold) ? 0 : Number(config.flat_fee)
  }
  return 0
}

export default function CartSidebar() {
  const { items, subtotal, totalItems, sidebarOpen, setSidebarOpen, updateQty, removeItem } = useCart()
  const router = useRouter()
  const overlayRef = useRef(null)

  // ── Delivery config ───────────────────────────────────────────────────────
  const [deliveryConfig, setDeliveryConfig] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/delivery-charge/`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setDeliveryConfig(data))
      .catch(() => {})
  }, [])

  const deliveryFee = calcDeliveryFee(deliveryConfig, subtotal)
  const grandTotal  = subtotal + deliveryFee
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  function handleCheckout() {
    setSidebarOpen(false)
    router.push('/basket')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={() => setSidebarOpen(false)}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: 'min(440px, 100vw)',
          background: '#ffffff',
          boxShadow: '-24px 0 80px rgba(0,33,21,0.12)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#bccac1]/30">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7a73]">Your Basket</p>
            <h2 className="text-2xl italic leading-tight" style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-10 cursor-pointer h-10 flex items-center justify-center rounded-full hover:bg-[#f0f4f0] transition-colors"
          >
            <span className="material-symbols-outlined text-[#3d4943]">close</span>
          </button>
        </div>

        {/* Items list — অপরিবর্তিত */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <span className="material-symbols-outlined text-4xl text-[#bccac1]">shopping_basket</span>
              <p className="text-xl italic text-[#6d7a73]" style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
                Your basket is empty
              </p>
              <p className="text-sm text-[#6d7a73]">Add something fresh from the market</p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="mt-2 cursor-pointer px-6 py-3 rounded-full border border-[#00694c]/30 text-[#00694c] text-sm font-bold hover:bg-[#f0f4f0] transition-colors"
              >
                Browse Market
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                  <Image
                    src={item.image} alt={item.name} width={80} height={80}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#151e13] text-sm leading-tight">{item.name}</h3>
                      <p className="text-xs italic text-[#00694c] mt-0.5" style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
                        from {item.origin}
                      </p>
                    </div>
                    <button onClick={() => removeItem(item.id, item.item_type || 'product')} className="cursor-pointer text-[#bccac1] hover:text-[#ba1a1a] transition-colors mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-[#f0f4f0] rounded-lg p-0.5">
                      <button onClick={() => updateQty(item.id, item.qty - 1, item.item_type || 'product')} className="w-7 cursor-pointer h-7 flex items-center justify-center hover:bg-[#e2e8e2] rounded transition-colors">
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.stock ? Math.min(item.stock, item.qty + 1) : item.qty + 1, item.item_type || 'product')} 
                        disabled={item.stock && item.qty >= item.stock}
                        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${item.stock && item.qty >= item.stock ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:bg-[#e2e8e2]'}`}>
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                    <span className="font-bold text-[#855000] text-sm">
                      €{((item.effectivePrice ?? item.price) * item.qty).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-[#bccac1]/30 space-y-4 bg-[#f5f9f5]">

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6d7a73]">Subtotal</span>
              <span className="font-bold text-[#151e13]">€{subtotal.toFixed(2)}</span>
            </div>

            {/* ── Delivery row — এখন dynamic ── */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6d7a73]">Delivery</span>
              {deliveryFee === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="bg-[#adedd8] text-[#095041] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Free
                  </span>
                  <span className="font-bold text-[#00694c]">€0.00</span>
                </div>
              ) : (
                <span className="font-bold text-[#151e13]">€{deliveryFee.toFixed(2)}</span>
              )}
            </div>

            {/* Threshold hint */}
            {deliveryConfig?.charge_type === 'threshold' && deliveryFee > 0 && (
              <p className="text-[11px] italic text-[#6d7a73]">
                Spend €{(Number(deliveryConfig.free_threshold) - subtotal).toFixed(2)} more for free delivery
              </p>
            )}

            {/* Total — এখন grandTotal use করছে */}
            <div className="pt-3 border-t border-[#bccac1]/30 flex items-end justify-between">
              <span className="font-bold text-[#151e13] uppercase tracking-tight text-sm">Total</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#855000]" style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
                  €{grandTotal.toFixed(2)}
                </p>
                <p className="text-[10px] text-[#6d7a73] uppercase tracking-widest">VAT included</p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              className="w-full cursor-pointer flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white transition-all hover:brightness-105 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)',
                boxShadow: '0 8px 24px -4px rgba(0,105,76,0.3)',
              }}
            >
              View Basket & Checkout
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="flex justify-center items-center gap-4 opacity-40 grayscale">
              <span className="material-symbols-outlined text-2xl">credit_card</span>
              <span className="material-symbols-outlined text-2xl">verified_user</span>
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}