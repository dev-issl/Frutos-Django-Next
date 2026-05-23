

'use client'

import Image from 'next/image'

export default function OrderSidebar({
  items, subtotal,
  promoState, promoDiscount, discountedSubtotal,
  delivery, total, loading, onPlaceOrder,
}) {
  return (
    <aside className="lg:col-span-4 lg:sticky lg:top-24">
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#f5f8f5', border: '1px solid #e0e8e0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div className="p-5 md:p-6">
          <h3 className="text-xl md:text-2xl italic mb-5 md:mb-6"
            style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}>
            Your Basket
          </h3>

          {/* Items */}
          <div className="space-y-4 mb-6 md:mb-8">
            {items.map(item => (
              <div key={item.id} className="flex gap-3 md:gap-4 items-center">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: '#fff', border: '1px solid #eaeaea' }}>
                  <Image src={item.image} alt={item.name} width={56} height={56}
                    className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: '#151e13' }}>{item.name}</p>
                  <p className="text-xs italic"
                    style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#5a6b63' }}>
                    from {item.origin}
                  </p>
                  <p className="text-xs" style={{ color: '#6d7a73' }}>Qty: {item.qty}</p>
                </div>
                <span className="font-bold text-sm flex-shrink-0" style={{ color: '#151e13' }}>
                  €{((item.effectivePrice ?? item.price) * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2.5 pt-5 mb-5" style={{ borderTop: '1px solid #e0e8e0' }}>
            <div className="flex justify-between text-xs uppercase tracking-widest" style={{ color: '#6d7a73' }}>
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>

            {/* Promo row */}
            {promoState && promoDiscount > 0 && (
              <div className="flex justify-between text-xs uppercase tracking-widest">
                <span style={{ color: '#00694c' }}>
                  Promo ({promoState.discount_percent}% off)
                </span>
                <span className="font-bold" style={{ color: '#00694c' }}>
                  −€{promoDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs uppercase tracking-widest" style={{ color: '#6d7a73' }}>
              <span>Delivery</span>
              <span>{delivery === 0 ? 'Free' : `€${delivery.toFixed(2)}`}</span>
            </div>

            <div className="flex justify-between text-sm font-bold mt-3 pt-2"
              style={{ borderTop: '1px solid #e0e8e0' }}>
              <span style={{ color: '#151e13' }}>Total</span>
              <div className="text-right">
                {promoState && promoDiscount > 0 && (
                  <span className="block text-xs line-through" style={{ color: '#bccac1' }}>
                    €{(subtotal + delivery).toFixed(2)}
                  </span>
                )}
                <span style={{ color: promoState ? '#00694c' : '#855000' }}>
                  €{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Promo code applied badge */}
          {promoState && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
              style={{ background: '#edf7f2', border: '1px solid #d4ede5' }}>
              <span className="material-symbols-outlined text-[16px]"
                style={{ color: '#00694c', fontVariationSettings: "'FILL' 1" }}>
                local_offer
              </span>
              <p className="text-xs font-bold" style={{ color: '#00694c' }}>
                {promoState.code} applied — {promoState.message}
              </p>
            </div>
          )}

          {/* CTA */}
          <button onClick={onPlaceOrder} disabled={loading}
            className="w-full cursor-pointer h-14 rounded-lg font-bold text-white uppercase tracking-widest text-sm transition-all hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background:  'linear-gradient(135deg, #00694c 0%, #008560 100%)',
              boxShadow:   '0 8px 24px -4px rgba(0,105,76,0.3)',
            }}>
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Placing Order…
              </>
            ) : 'Complete Purchase'}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2" style={{ opacity: 0.45 }}>
            <span className="material-symbols-outlined text-sm" style={{ color: '#3d4943' }}>shield</span>
            <span className="text-[10px] uppercase tracking-tighter" style={{ color: '#3d4943' }}>
              Encrypted Transaction
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-around p-4" style={{ opacity: 0.4 }}>
        <span className="material-symbols-outlined text-3xl" style={{ color: '#3d4943' }}>local_mall</span>
        <span className="material-symbols-outlined text-3xl" style={{ color: '#3d4943' }}>eco</span>
        <span className="material-symbols-outlined text-3xl" style={{ color: '#3d4943' }}>workspace_premium</span>
      </div>
    </aside>
  )
}