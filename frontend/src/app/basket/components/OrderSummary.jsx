'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  Lock,
  ArrowRight,
  ArrowLeft,
  Truck,
  Leaf,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { useCart } from '@/app/context/CartContext'

export default function OrderSummary({
  subtotal,
  deliveryConfig = null,
  deliveryFee = null,
  items = [],
  isApprovedWholesale = false,
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { promoState, promoDiscount, discountedSubtotal } = useCart()
  const [popup, setPopup] = useState(false)

  const violatingItems = items.filter((item) => {
    const isUnlimited = Boolean(
      item.is_unlimited_stock ||
        item.isUnlimitedStock ||
        item.is_unlimited_wholesale_stock ||
        item.is_unlimited_restaurant_stock
    )
    const rawMin = parseInt(item.minimum_purchase, 10) || parseInt(item.minWholesaleQty, 10) || 1
    const stock = isUnlimited
      ? Infinity
      : item.stock !== undefined && item.stock !== null
        ? Number(item.stock)
        : item.wholesale_stock !== undefined && item.wholesale_stock !== null
          ? Number(item.wholesale_stock)
          : item.restaurant_stock !== undefined && item.restaurant_stock !== null
            ? Number(item.restaurant_stock)
            : Infinity
    const minReq = stock > 0 && stock < Infinity ? Math.min(rawMin, stock) : rawMin
    return item.qty < minReq
  })

  const effectiveSubtotal = promoState ? discountedSubtotal : subtotal
  const effectiveDelivery =
    deliveryFee !== null && deliveryFee !== undefined
      ? Number(deliveryFee)
      : calcDeliveryFee(deliveryConfig, effectiveSubtotal)
  const finalTotal = effectiveSubtotal + effectiveDelivery

  const hasFreeThreshold =
    deliveryConfig?.charge_type === 'threshold' && Number(deliveryConfig?.free_threshold) > 0

  function handleCheckout() {
    if (violatingItems.length > 0 && isApprovedWholesale !== undefined) {
      setPopup(true)
    } else {
      startTransition(() => router.push('/checkout'))
    }
  }

  return (
    <>
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* Order Summary Card */}
        <div className="rounded-[22px] overflow-hidden bg-white border border-[#DDE4D4]">
          {/* Forest Green Top Header */}
          <div
            className="px-5 sm:px-6 py-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #0B462B 0%, #155838 100%)' }}
          >
            <ClipboardList className="w-5 h-5 text-white/95 shrink-0" />
            <h2
              className="text-[21px] sm:text-[22px] font-bold text-white leading-none"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              Order Summary
            </h2>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Subtotal / Promo / Delivery rows */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[14.5px]">
                <span className="font-semibold text-[#17281E]">Subtotal</span>
                <span className="font-bold text-[16px] text-[#17281E]">€{subtotal.toFixed(2)}</span>
              </div>

              {promoState && promoDiscount > 0 && (
                <div className="flex justify-between items-center text-[13.5px]">
                  <span className="text-[#195E38] font-medium">
                    Promo ({promoState.discount_type === 'FLAT'
                      ? `€${Number(promoState.flat_discount_amount || 0).toFixed(2)} off`
                      : `${promoState.discount_percent}% off`})
                  </span>
                  <span className="font-bold text-[#195E38]">−€{promoDiscount.toFixed(2)}</span>
                </div>
              )}

              {promoState &&
                promoDiscount === 0 &&
                (() => {
                  const appIds = promoState.applicable_product_ids || []
                  const hasRestriction = appIds.length > 0
                  const qualQty = items
                    .filter((i) => !hasRestriction || appIds.includes(String(i.id)))
                    .reduce((s, i) => s + i.qty, 0)
                  const need = (promoState.min_quantity_required || 1) - qualQty
                  const msg =
                    need > 0
                      ? `Add ${need} more item(s) to activate ${promoState.code}`
                      : `${promoState.code} doesn't apply to cart items`
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-[#BA1A1A] bg-[#FEF2F2] px-3 py-1.5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg}</span>
                    </div>
                  )
                })()}

              <div className="flex justify-between items-center text-[14.5px]">
                <span className="font-semibold text-[#17281E]">Delivery</span>
                {effectiveDelivery === 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-extrabold bg-[#DCEFD3] text-[#1A5D38]">
                      FREE
                    </span>
                    <span className="font-bold text-[15px] text-[#14261B]">€0.00</span>
                  </div>
                ) : (
                  <span className="font-bold text-[15px] text-[#14261B]">
                    €{effectiveDelivery.toFixed(2)}
                  </span>
                )}
              </div>

              {deliveryConfig?.charge_type === 'threshold' && effectiveDelivery > 0 && (
                <p className="text-[11.5px] italic text-[#566A5D]">
                  Spend €{Math.max(0, Number(deliveryConfig.free_threshold) - effectiveSubtotal).toFixed(2)} more for free delivery
                </p>
              )}
            </div>

            {/* Total Row */}
            <div className="pt-4 border-t border-[#E6EBE0] flex items-end justify-between">
              <span className="text-[18px] font-bold text-[#14261B]">Total</span>
              <div className="text-right">
                {promoState && promoDiscount > 0 && (
                  <p className="text-xs line-through text-[#98A49B]">
                    €{(subtotal + effectiveDelivery).toFixed(2)}
                  </p>
                )}
                <p
                  className="text-[30px] font-bold leading-none"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#0E4228' }}
                >
                  €{finalTotal.toFixed(2)}
                </p>
                <p className="text-[11px] text-[#566A5D] mt-1">(VAT Included)</p>
              </div>
            </div>

            {/* Free Delivery Sage Highlight Box */}
            <div className="rounded-[14px] bg-[#EDF2E5] border border-[#DCE5D1] px-4 py-3 flex items-center gap-3">
              <Truck className="w-5 h-5 text-[#1B5B38] shrink-0" />
              <div>
                <p className="text-[13.5px] font-bold text-[#142D1E] leading-tight">
                  {effectiveDelivery === 0 ? 'Free Delivery' : 'Local Fresh Delivery'}
                </p>
                <p className="text-[11.5px] text-[#55685C]">
                  {hasFreeThreshold
                    ? `on orders over €${Number(deliveryConfig.free_threshold).toFixed(0)}`
                    : 'Direct from our partner farms'}
                </p>
              </div>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isPending}
                className="w-full cursor-pointer flex items-center justify-center gap-2.5 py-3.5 rounded-full font-semibold text-white text-[15px] transition-all duration-200 hover:brightness-110 active:scale-[0.985] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #0B462B 0%, #155B3A 100%)',
                }}
              >
                <Lock className="w-4 h-4" />
                <span>{isPending ? 'Preparing Checkout…' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/shop"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-[14px] bg-white text-[#173924] border border-[#CFD8C8] hover:bg-[#F3F6EE] transition-colors no-underline hover:no-underline"
              >
                <ArrowLeft className="w-4 h-4 text-[#1C5536]" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3-Column Trust Badges Box */}
        <div className="rounded-[20px] bg-[#EAEFE1] border border-[#DCE4D2] px-3 py-4 grid grid-cols-3 divide-x divide-[#D3DDD0] text-center">
          <div className="flex flex-col items-center gap-1.5 px-1.5 sm:px-2">
            <div className="w-9 h-9 rounded-full bg-white border border-[#DCE4D2] flex items-center justify-center text-[#1B5C39]">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="text-[11px] sm:text-[11.5px] font-medium leading-tight text-[#213B2B]">
              100% Organic &amp; Fresh
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-1.5 sm:px-2">
            <div className="w-9 h-9 rounded-full bg-white border border-[#DCE4D2] flex items-center justify-center text-[#1B5C39]">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[11px] sm:text-[11.5px] font-medium leading-tight text-[#213B2B]">
              Fast Delivery Service
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-1.5 sm:px-2">
            <div className="w-9 h-9 rounded-full bg-white border border-[#DCE4D2] flex items-center justify-center text-[#1B5C39]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] sm:text-[11.5px] font-medium leading-tight text-[#213B2B]">
              Secure Payment
            </span>
          </div>
        </div>
      </div>

      {/* Wholesale min-qty warning sheet */}
      {popup && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
          onClick={() => setPopup(false)}
        />
      )}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 transition-transform duration-300 ease-out"
        style={{ transform: popup ? 'translateY(0)' : 'translateY(110%)' }}
      >
        <div className="mx-auto max-w-lg rounded-t-3xl px-6 pt-6 pb-9 bg-[#FAFBF6] border-t border-x border-[#DCE4D3]">
          <div className="w-10 h-1 rounded-full mx-auto mb-5 bg-[#D4DEC9]" />
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FFF3CD]">
              <AlertTriangle className="w-5 h-5 text-[#B45309]" />
            </div>
            <div>
              <h3
                className="text-lg font-bold text-[#14261B]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                Minimum Quantity Required
              </h3>
              <p className="text-sm mt-1 text-[#566A5D]">Update the quantities below to continue.</p>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            {violatingItems.map((item) => {
              const rawMin = parseInt(item.minimum_purchase, 10) || parseInt(item.minWholesaleQty, 10) || 1
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3 bg-[#FFF8EE] border border-[#FFE4B2]"
                >
                  <div>
                    <p className="text-sm font-bold text-[#14261B]">{item.name}</p>
                    <p className="text-xs mt-0.5 text-[#B45309]">
                      You have {item.qty} — minimum is <span className="font-bold">{rawMin}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 bg-[#FFE4B2] text-[#92400E]">
                    +{Math.max(1, rawMin - item.qty)} needed
                  </span>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => setPopup(false)}
            className="w-full py-3.5 rounded-full text-sm font-bold cursor-pointer text-white bg-[#0B462B] hover:bg-[#083821] transition-colors"
          >
            Update My Cart
          </button>
        </div>
      </div>
    </>
  )
}

function calcDeliveryFee(config, subtotal) {
  if (!config || !config.is_active || config.charge_type === 'free') return 0
  if (config.charge_type === 'flat') return Number(config.flat_fee)
  if (config.charge_type === 'threshold') {
    return subtotal >= Number(config.free_threshold) ? 0 : Number(config.flat_fee)
  }
  return 0
}
