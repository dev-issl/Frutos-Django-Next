'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart,
  ArrowRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Check,
} from 'lucide-react'
import { useCart } from '@/app/context/CartContext'
import { useAuth } from '@/app/context/AuthContext'
import BasketHero from './BasketHero'
import BasketItemList from './BasketItemList'
import OrderSummary from './OrderSummary'
import EmptyBasket from './EmptyBasket'
import FulfillmentSwitcher from './FulfillmentSwitcher'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
const RECOMMENDED_PER_PAGE = 3

function resolveProductImage(product) {
  let src = product.image || product.thumbnail_url || '/homepage/prod_tomato.jpg'
  if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
    const mediaBase = API_BASE.replace('/api', '')
    src = `${mediaBase}/${src.replace(/^\/+/, '')}`
  }
  return src
}

function PromoCodeBar({ items, subtotal }) {
  const { promoState, setPromoState } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')

  async function handleApplyPromo() {
    const trimmed = promoCode.trim()
    if (!trimmed) return

    setPromoLoading(true)
    setPromoError('')
    setPromoState(null)

    try {
      const quantities = {}
      items.forEach((i) => {
        quantities[String(i.id)] = i.qty
      })

      const res = await fetch(`${API_BASE}/products/promo/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmed,
          product_ids: items.map((i) => String(i.id)),
          quantities,
          cart_total: subtotal,
        }),
      })
      const data = await res.json()
      if (data.valid) {
        const applicableIds = data.applicable_product_ids || items.map((i) => String(i.id))
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
          code: trimmed.toUpperCase(),
          discount_percent: Number(data.discount_percent),
          discount_type: data.discount_type,
          applicable_product_ids: applicableIds,
          flat_discount_amount: data.discount_type === 'FLAT' ? Number(data.discount_amount) : 0,
          discount_amount: discount,
          min_quantity_required: data.coupon?.min_quantity_required || 1,
          message: data.message,
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

  return (
    <div className="rounded-[16px] bg-[#ECF1E4] border border-[#DDE5D3] p-4 space-y-2.5">
      {promoState ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#0B462B] shrink-0" />
            <div>
              <p className="text-[14px] font-bold text-[#0E4228]">{promoState.code} applied</p>
              <p className="text-[12px] text-[#3B5243]">{promoState.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemovePromo}
            className="text-xs font-bold text-[#BA1A1A] hover:underline cursor-pointer"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#D8E2CE] flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-[#0B462B]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#153121]">Have a promo code?</p>
                <p className="text-[12px] text-[#556A5D]">Enter your code to get special discount</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-[290px]">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value)
                  setPromoError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                placeholder="Enter code"
                className="flex-1 min-w-0 rounded-full px-4 py-2 text-[13.5px] bg-white border border-[#D8E1CF] text-[#14261B] placeholder:text-[#8E9B92] outline-none focus:border-[#0B462B]"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="px-5 py-2 rounded-full text-[13.5px] font-semibold text-white bg-[#0B462B] hover:bg-[#083821] disabled:opacity-50 transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
              >
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
          </div>

          {promoError && (
            <p className="text-xs flex items-center gap-1 text-[#BA1A1A] pl-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {promoError}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function RecommendedCarousel({ products, cartItems }) {
  const { addItem } = useCart()
  const [page, setPage] = useState(0)
  const [recentlyAddedId, setRecentlyAddedId] = useState(null)
  const addedTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current)
    }
  }, [])

  const cartIds = new Set(cartItems.map((i) => String(i.id)))
  const pool = products.filter((p) => !cartIds.has(String(p.id)))
  const list = pool.length >= RECOMMENDED_PER_PAGE ? pool : products
  if (!list.length) return null

  const totalPages = Math.max(1, Math.ceil(list.length / RECOMMENDED_PER_PAGE))
  const currentPage = page % totalPages

  const slides = Array.from({ length: totalPages }, (_, slideIdx) => {
    const start =
      slideIdx === totalPages - 1 && list.length >= RECOMMENDED_PER_PAGE
        ? list.length - RECOMMENDED_PER_PAGE
        : slideIdx * RECOMMENDED_PER_PAGE
    return list.slice(start, start + RECOMMENDED_PER_PAGE)
  })

  function handleQuickAdd(prod) {
    const unitPrice = prod.wholesalePrice || prod.price || 0
    addItem(prod, unitPrice, prod.minWholesaleQty > 1 && prod.wholesalePrice ? prod.minWholesaleQty : 1)
    setRecentlyAddedId(prod.id)
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current)
    addedTimerRef.current = setTimeout(() => setRecentlyAddedId(null), 1400)
  }

  return (
    <section className="rounded-[22px] bg-[#FAFBF6] border border-[#E2E6DA] p-4 sm:p-6">
      <div className="flex items-center justify-center gap-2 mb-5">
        <Leaf className="w-4 h-4 text-[#2B6947] shrink-0" />
        <h2
          className="text-[21px] sm:text-[22px] font-bold text-[#142D1E]"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          You Might Also Like
        </h2>
      </div>

      <div className="relative flex items-center gap-2.5 sm:gap-3">
        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
            aria-label="Previous recommendations"
            className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-[#DCE3D4] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer shrink-0 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 min-w-0 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none"
            style={{
              transform: `translate3d(-${currentPage * 100}%, 0, 0)`,
            }}
          >
            {slides.map((slideCards, slideIdx) => {
              const isActiveSlide = slideIdx === currentPage
              return (
                <div
                  key={slideIdx}
                  aria-hidden={!isActiveSlide}
                  className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4"
                >
                  {slideCards.map((p) => {
                    const price = Number(p.wholesalePrice || p.price || 0)
                    const oldPrice = p.oldPrice ? Number(p.oldPrice) : null
                    const isAdded = recentlyAddedId === p.id
                    const imgSrc = resolveProductImage(p)

                    return (
                      <div
                        key={p.id}
                        className="rounded-[16px] bg-white border border-[#E6EAE0] hover:border-[#CFD8C7] transition-colors duration-200 p-3 flex sm:flex-col items-center sm:items-stretch gap-3.5 sm:gap-0"
                      >
                        <Link
                          href={p.slug ? `/products/${p.slug}` : '/shop'}
                          tabIndex={isActiveSlide ? undefined : -1}
                          className="relative w-24 h-20 sm:w-full sm:h-auto sm:aspect-[4/3] rounded-[12px] overflow-hidden bg-[#F7F6F0] border border-[#ECEFE7] shrink-0 block group"
                        >
                          <Image
                            src={imgSrc}
                            alt={p.name}
                            fill
                            unoptimized={imgSrc.startsWith('http')}
                            sizes="(max-width: 640px) 96px, 240px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                          />
                        </Link>

                        <div className="flex-1 min-w-0 sm:pt-3 flex flex-col justify-between gap-2.5">
                          <Link
                            href={p.slug ? `/products/${p.slug}` : '/shop'}
                            tabIndex={isActiveSlide ? undefined : -1}
                            className="block text-[14.5px] sm:text-[15px] font-bold text-[#14261B] truncate hover:underline leading-snug"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                          >
                            {p.name}
                          </Link>

                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap tabular-nums">
                              <span className="text-[14.5px] sm:text-[15px] font-bold text-[#0E4228] whitespace-nowrap">
                                €{price.toFixed(2)}
                              </span>
                              {oldPrice && oldPrice > price && (
                                <span className="text-[11px] sm:text-[11.5px] text-[#98A49B] line-through whitespace-nowrap">
                                  €{oldPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              tabIndex={isActiveSlide ? undefined : -1}
                              onClick={() => handleQuickAdd(p)}
                              className="px-3.5 py-1.5 rounded-[10px] text-[12px] font-semibold text-white cursor-pointer transition-all duration-200 active:scale-95 shrink-0 inline-flex items-center gap-1"
                              style={{ background: isAdded ? '#1A5D38' : '#0B462B' }}
                            >
                              {isAdded ? <Check className="w-3 h-3" /> : null}
                              {isAdded ? 'Added' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => (p + 1) % totalPages)}
            aria-label="Next recommendations"
            className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-[#DCE3D4] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer shrink-0 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
            aria-label="Previous recommendations"
            className="flex sm:hidden w-8 h-8 rounded-full bg-white border border-[#DCE3D4] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPage(idx)}
                aria-label={`Recommendation page ${idx + 1}`}
                className="h-2 rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  width: idx === currentPage ? '18px' : '8px',
                  background: idx === currentPage ? '#2B6947' : '#CBD6C4',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => (p + 1) % totalPages)}
            aria-label="Next recommendations"
            className="flex sm:hidden w-8 h-8 rounded-full bg-white border border-[#DCE3D4] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  )
}

export default function BasketShell({
  initialDelivery,
  initialStore,
  recommendedProducts = [],
}) {
  const { items, subtotal, updateQty, removeItem, discountedSubtotal, promoState } = useCart()
  const { user } = useAuth()

  const isApprovedWholesale = user?.wholesale_status === 'APPROVED'

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [fulfillment, setFulfillment] = useState('delivery')

  if (!mounted) return null
  if (items.length === 0) return <EmptyBasket />

  const deliveryConfig = initialDelivery

  function calcDeliveryFee(config, subtotalAmt) {
    if (fulfillment !== 'delivery') return 0
    if (!config || !config.is_active || config.charge_type === 'free') return 0
    if (config.charge_type === 'flat') return Number(config.flat_fee)
    if (config.charge_type === 'threshold') {
      return subtotalAmt >= Number(config.free_threshold) ? 0 : Number(config.flat_fee)
    }
    return 0
  }

  const effectiveSubtotal = promoState ? discountedSubtotal : subtotal
  const deliveryFee = calcDeliveryFee(deliveryConfig, effectiveSubtotal)
  const grandTotal = effectiveSubtotal + deliveryFee

  return (
    <div style={{ background: '#F6F6EC', minHeight: '100vh', width: '100%' }}>
      <BasketHero />

      {/* Main 2-Column Content Grid */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7 pb-14 sm:pb-16 overflow-x-clip">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start basket-fade-slide">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* Main Items + Embedded Promo Card */}
            <div className="rounded-[22px] bg-[#FAFBF6] border border-[#E2E6DA] p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-[#0B462B] shrink-0" />
                  <h2
                    className="text-[21px] sm:text-[22px] font-bold text-[#142D1E]"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    Your Items ({items.length})
                  </h2>
                </div>

                <Link
                  href="/shop"
                  className="group text-[13px] font-semibold text-[#184B2E] hover:text-[#0B462B] no-underline hover:no-underline flex items-center gap-1 transition-colors"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <BasketItemList
                items={items}
                updateQty={updateQty}
                removeItem={removeItem}
                isApprovedWholesale={isApprovedWholesale}
              />

              <PromoCodeBar items={items} subtotal={subtotal} />
            </div>

            {/* Fulfillment Selector */}
            <FulfillmentSwitcher
              fulfillment={fulfillment}
              setFulfillment={setFulfillment}
              initialDelivery={initialDelivery}
              initialStore={initialStore}
            />

            {/* Recommended Products Carousel */}
            <RecommendedCarousel products={recommendedProducts} cartItems={items} />
          </div>

          {/* Right Sticky Column */}
          <div className="lg:col-span-4 min-w-0">
            <OrderSummary
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              deliveryConfig={deliveryConfig}
              grandTotal={grandTotal}
              items={items}
              isApprovedWholesale={isApprovedWholesale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
