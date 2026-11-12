'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Lock, ArrowRight, ArrowLeft, Tag, ShoppingBag } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

function resolveSidebarImage(item) {
  const mediaBase = API_BASE.replace('/api', '')
  let src = item.image || item.thumbnail || item.image_url || null
  if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
    src = `${mediaBase}/${src.replace(/^\/+/, '')}`
  }
  return src
}

export default function OrderSidebar({
  items,
  subtotal,
  promoState,
  promoDiscount,
  delivery,
  total,
  hydrating = false,
  loading,
  paymentExpanded = false,
  onPrimaryAction,
}) {
  return (
    <aside className="lg:col-span-4 lg:sticky lg:top-24 min-w-0">
      <div className="rounded-[22px] overflow-hidden bg-white border border-[#DDE4D4] shadow-[0_14px_34px_-12px_rgba(18,45,28,0.16)]">
        {/* Dark Forest Green Card Header */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #0B462B 0%, #155838 100%)' }}
        >
          <ShoppingCart className="w-5 h-5 text-white/95" />
          <h3
            className="text-[22px] font-bold text-white leading-none"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Order Summary
          </h3>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Items List */}
          <div className="db-scroll space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
            {hydrating ? (
              <div className="flex gap-3 items-center animate-pulse">
                <div className="w-14 h-14 rounded-[12px] bg-[#EEF2E7] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded bg-[#EEF2E7]" />
                  <div className="h-2.5 w-20 rounded bg-[#F3F6EE]" />
                </div>
                <div className="h-4 w-12 rounded bg-[#EEF2E7]" />
              </div>
            ) : (
              items.map((item) => {
                const imgUrl = resolveSidebarImage(item)
                const cleanOrigin = item.origin?.replace(/^from\s+/i, '')
                return (
                  <div key={`${item.id}-${item.item_type || 'product'}`} className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-[12px] overflow-hidden shrink-0 bg-[#F7F6F0] border border-[#EAECE3]">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={item.name}
                          width={56}
                          height={56}
                          unoptimized={imgUrl.startsWith('http')}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#9AA89F]">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold text-[15px] leading-snug truncate text-[#14261B]"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                      >
                        {item.name}
                      </p>
                      {cleanOrigin && (
                        <p
                          className="text-[12px] italic text-[#2B6947] truncate"
                          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                          Fresh from {cleanOrigin}
                        </p>
                      )}
                      <p className="text-[11.5px] text-[#586A5F]">Qty: {item.qty}</p>
                    </div>

                    <span
                      className="font-bold text-[15.5px] shrink-0 text-[#0E4228] tabular-nums"
                      style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                      €{((item.effectivePrice ?? item.price) * item.qty).toFixed(2)}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2.5 pt-4 border-t border-[#E8ECE2]">
            <div className="flex justify-between items-center text-[14px]">
              <span className="font-semibold text-[#17281E]">Subtotal</span>
              <span className="font-bold text-[15.5px] text-[#17281E]">€{subtotal.toFixed(2)}</span>
            </div>

            {promoState && promoDiscount > 0 && (
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-[#195E38] font-medium">
                  Promo ({promoState.discount_percent ? `${promoState.discount_percent}% off` : promoState.code})
                </span>
                <span className="font-bold text-[#195E38]">−€{promoDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-[14px]">
              <span className="font-semibold text-[#17281E]">Delivery</span>
              {delivery === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="bg-[#DCEFD3] text-[#1A5D38] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    FREE
                  </span>
                  <span className="font-bold text-[15px] text-[#14261B]">€0.00</span>
                </div>
              ) : (
                <span className="font-bold text-[15px] text-[#14261B]">€{delivery.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Highlighted Sage Total Box */}
          <div className="rounded-[16px] bg-[#E8F1E1] border border-[#DAE7D1] px-4 py-3.5 flex items-center justify-between">
            <span className="text-[16px] font-bold text-[#15281C]">Total</span>
            <div className="text-right">
              {promoState && promoDiscount > 0 && (
                <span className="block text-xs line-through text-[#89978E]">
                  €{(subtotal + delivery).toFixed(2)}
                </span>
              )}
              <span
                className="text-[28px] font-bold leading-none text-[#0E4228]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                €{total.toFixed(2)}
              </span>
              <p className="text-[11px] text-[#55685C] mt-1">(VAT Included)</p>
            </div>
          </div>

          {promoState && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-[#ECF5E6] border border-[#D4E6C9]">
              <Tag className="w-4 h-4 text-[#0B462B] shrink-0" />
              <p className="text-xs font-semibold text-[#14472B]">
                {promoState.code} applied — {promoState.message}
              </p>
            </div>
          )}

          {/* Primary & Secondary CTAs */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={loading}
              className="w-full cursor-pointer py-3.5 rounded-full font-semibold text-white text-[14.5px] transition-all hover:brightness-110 active:scale-[0.985] flex items-center justify-center gap-2.5 disabled:opacity-65 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #0B462B 0%, #155B3A 100%)',
                boxShadow: '0 8px 22px -6px rgba(11, 70, 43, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Placing Order…</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{paymentExpanded ? 'Complete Purchase' : 'Proceed to Payment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <Link
              href="/shop"
              className="w-full py-3 rounded-full font-semibold text-[14px] bg-white text-[#173924] border border-[#CFD8C8] hover:bg-[#F3F6EE] no-underline hover:no-underline transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-[#1C5536]" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
