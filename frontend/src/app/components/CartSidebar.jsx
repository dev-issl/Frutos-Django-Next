'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  X,
  Trash2,
  Minus,
  Plus,
  Lock,
  ArrowRight,
  ShoppingBag,
  Leaf,
  Truck,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
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

function resolveCartImage(item) {
  const mediaBase = API_BASE.replace('/api', '')
  let imageUrl = item.image || item.thumbnail || item.image_url || null
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/')) {
    const clean = imageUrl.replace(/^\/+/, '')
    imageUrl = `${mediaBase}/${clean}`
  }
  return imageUrl
}

function getStockLimits(item) {
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
  const minQty = stock > 0 && stock < Infinity ? Math.max(1, Math.min(rawMin, stock)) : rawMin
  const inStock = isUnlimited || item.inStock !== false
  return { isUnlimited, stock, minQty, inStock }
}

export default function CartSidebar() {
  const { items, subtotal, totalItems, sidebarOpen, setSidebarOpen, updateQty, removeItem } = useCart()
  const router = useRouter()
  const overlayRef = useRef(null)

  const [deliveryConfig, setDeliveryConfig] = useState(null)
  const [popup, setPopup] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/delivery-charge/`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDeliveryConfig(data))
      .catch(() => {})
  }, [])

  const deliveryFee = calcDeliveryFee(deliveryConfig, subtotal)
  const grandTotal = subtotal + deliveryFee

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const violatingItems = items.filter((item) => {
    const { minQty } = getStockLimits(item)
    return item.qty < minQty
  })

  function handleCheckout() {
    if (violatingItems.length > 0) {
      setPopup(true)
      return
    }
    setSidebarOpen(false)
    router.push('/basket')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={() => setSidebarOpen(false)}
        className="fixed inset-0 z-40 bg-[#102317]/35 backdrop-blur-[3px] transition-opacity duration-300"
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      />

      <style>{`
        @supports not selector(::-webkit-scrollbar) {
          .cart-drawer-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(27, 92, 57, 0.28) transparent;
          }
        }
        .cart-drawer-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .cart-drawer-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 6px 0;
        }
        .cart-drawer-scroll::-webkit-scrollbar-thumb {
          background: rgba(27, 92, 57, 0.25);
          border-radius: 9999px;
        }
        .cart-drawer-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(27, 92, 57, 0.48);
        }
        .cart-drawer-scroll::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      {/* Slide-over Botanical Drawer */}
      <aside
        aria-label="Shopping Basket Drawer"
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden border-l border-[#DDE4D5]"
        style={{
          width: 'min(420px, 100vw)',
          background: '#F7F6EE',
          borderRadius: '26px 0 0 26px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Top-right delicate botanical leaf corner glow */}
        <div
          className="pointer-events-none absolute -top-2 -right-2 w-36 h-28 z-0 opacity-90"
          style={{
            backgroundImage: 'url(/ui/botanical-leaves-tr.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'top right',
            mixBlendMode: 'multiply',
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E5E8DC]">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(145deg, #0D4B2C 0%, #1B6841 100%)' }}
              >
                <ShoppingCart className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
              </div>
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center text-[10.5px] font-extrabold border-2 border-[#F7F6EE]"
                style={{ background: '#C5DEA9', color: '#0B4326' }}
              >
                {totalItems}
              </span>
            </div>
            <div>
              <h2
                className="text-[22px] font-bold leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#143823' }}
              >
                Your Basket
              </h2>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: '#586A5F' }}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close basket drawer"
            className="w-9 h-9 cursor-pointer flex items-center justify-center rounded-full bg-white border border-[#E3E7DB] text-[#173924] hover:bg-[#EDF2E7] transition-colors"
          >
            <X className="w-[17px] h-[17px]" strokeWidth={2.2} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="cart-drawer-scroll relative z-10 flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="px-4 pt-3 pb-2 flex-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-14 px-4">
                <div className="w-16 h-16 rounded-full bg-[#E8F1E1] flex items-center justify-center mb-1">
                  <ShoppingBag className="w-7 h-7 text-[#1B6841]" />
                </div>
                <p
                  className="text-[22px] italic font-medium"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#173924' }}
                >
                  Your basket is empty
                </p>
                <p className="text-[13px] max-w-[230px]" style={{ color: '#5C6F63' }}>
                  Add crisp, farm-fresh produce to start your harvest box.
                </p>
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    router.push('/shop')
                  }}
                  className="mt-2 cursor-pointer px-6 py-2.5 rounded-full bg-[#0C462A] text-white text-[13.5px] font-semibold hover:bg-[#08361F] transition-colors"
                >
                  Explore Our Shop
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const imageUrl = resolveCartImage(item)
                  const { isUnlimited, stock, minQty, inStock } = getStockLimits(item)
                  const decreaseDisabled = item.qty <= minQty
                  const canAddMore = isUnlimited ? true : stock > 0 ? item.qty < stock : true
                  const lineTotal = ((item.effectivePrice ?? item.price) * item.qty).toFixed(2)
                  const cleanOrigin = item.origin?.replace(/^from\s+/i, '')

                  return (
                    <div
                      key={`${item.id}-${item.item_type || 'product'}`}
                      className="flex items-center gap-3 p-2.5 rounded-[14px] bg-white border border-[#E4E9DC] hover:border-[#C7D8C0] transition-colors"
                    >
                      {/* Compact Thumbnail */}
                      <div className="w-[56px] h-[56px] rounded-[10px] overflow-hidden flex-shrink-0 bg-[#F8F7F2] border border-[#ECEFE7]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.name}
                            width={56}
                            height={56}
                            unoptimized={imageUrl.startsWith('http')}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#99A89D]">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Compact Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="font-bold text-[15px] leading-tight truncate"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#14261B' }}
                          >
                            {item.name}
                          </h3>
                          <button
                            onClick={() => removeItem(item.id, item.item_type || 'product')}
                            aria-label={`Remove ${item.name}`}
                            className="cursor-pointer text-[#8B978F] hover:text-[#BA1A1A] transition-colors p-0.5 shrink-0"
                          >
                            <Trash2 className="w-[14px] h-[14px]" />
                          </button>
                        </div>

                        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                          {cleanOrigin && (
                            <span
                              className="text-[11.5px] italic truncate max-w-[145px]"
                              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#2B6947' }}
                            >
                              Fresh from {cleanOrigin}
                            </span>
                          )}
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                            style={{
                              background: inStock ? '#E5F2DE' : '#FDECEC',
                              color: inStock ? '#1B5E38' : '#9B1C1C',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: inStock ? '#2E8555' : '#DC2626' }}
                            />
                            {inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                          {item.qty < minQty && (
                            <span className="text-[10px] font-bold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded-full shrink-0">
                              Min. {minQty}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Compact Cream Pill Qty Stepper */}
                          <div className="inline-flex items-center rounded-full bg-[#F3F2E9] border border-[#E4E6D9] px-1 py-0.5">
                            <button
                              onClick={() => updateQty(item.id, Math.max(minQty, item.qty - 1), item.item_type || 'product')}
                              disabled={decreaseDisabled}
                              aria-label="Decrease quantity"
                              className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                                decreaseDisabled
                                  ? 'text-[#B2BCB5] cursor-not-allowed'
                                  : 'cursor-pointer text-[#1F3A2A] hover:bg-[#E4E8D8]'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-bold text-[12.5px] text-[#14261B]">{item.qty}</span>
                            <button
                              onClick={() =>
                                updateQty(
                                  item.id,
                                  isUnlimited ? item.qty + 1 : stock > 0 ? Math.min(stock, item.qty + 1) : item.qty + 1,
                                  item.item_type || 'product'
                                )
                              }
                              disabled={!canAddMore}
                              aria-label="Increase quantity"
                              className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                                !canAddMore
                                  ? 'text-[#B2BCB5] cursor-not-allowed'
                                  : 'cursor-pointer text-[#1F3A2A] hover:bg-[#E4E8D8]'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span
                            className="font-bold text-[16px] tracking-tight"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#0E4228' }}
                          >
                            €{lineTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Totals + Actions + Trust + Scenic Footer */}
          <div className="mt-auto">
            {items.length > 0 && (
              <div className="px-4 pt-2.5 pb-2.5 space-y-2.5 border-t border-[#E4E7DA] bg-[#F7F6EE]">
                {/* Subtotal & Delivery */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-[#17281E]">Subtotal</span>
                    <span className="font-bold text-[14.5px] text-[#17281E]">€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-[#17281E]">Delivery</span>
                    {deliveryFee === 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-[#DCEFD3] text-[#1B5E38] text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          FREE
                        </span>
                        <span className="font-bold text-[14px] text-[#14261B]">€0.00</span>
                      </div>
                    ) : (
                      <span className="font-bold text-[14px] text-[#14261B]">€{deliveryFee.toFixed(2)}</span>
                    )}
                  </div>
                  {deliveryConfig?.charge_type === 'threshold' && deliveryFee > 0 && (
                    <p className="text-[11px] italic text-[#5B6D62]">
                      Spend €{Math.max(0, Number(deliveryConfig.free_threshold) - subtotal).toFixed(2)} more for free delivery
                    </p>
                  )}
                </div>

                {/* Sage Total Highlight Card */}
                <div className="rounded-[14px] bg-[#E8F1E1] border border-[#DAE7D1] px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-[14.5px] font-bold text-[#15281C]">Total</span>
                  <div className="text-right">
                    <p
                      className="text-[22px] font-bold leading-none"
                      style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#0E4228' }}
                    >
                      €{grandTotal.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-[#55685C] mt-0.5">(VAT included)</p>
                  </div>
                </div>

                {/* Primary & Secondary Pill CTAs */}
                <div className="space-y-2 pt-0.5">
                  <button
                    onClick={handleCheckout}
                    className="w-full cursor-pointer flex items-center justify-center gap-2.5 py-3 rounded-full font-semibold text-white text-[14px] transition-all hover:brightness-110 active:scale-[0.985]"
                    style={{
                      background: 'linear-gradient(135deg, #0B462B 0%, #135938 100%)',
                    }}
                  >
                    <Lock className="w-4 h-4" />
                    <span>View Basket & Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full cursor-pointer flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-[13px] bg-white text-[#183825] border border-[#CDD6C6] hover:bg-[#F0F4E9] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#1E5638]" />
                    <span>Continue Shopping</span>
                  </button>
                </div>

                {/* 3-Column Trust Strip */}
                <div className="rounded-[14px] bg-[#EAEFE1] border border-[#DDE5D3] px-2 py-2 grid grid-cols-3 divide-x divide-[#D3DDD0] text-center">
                  <div className="flex flex-col items-center gap-1 px-1.5">
                    <Leaf className="w-4 h-4 text-[#1D5B39]" />
                    <span className="text-[10px] font-medium leading-tight text-[#253C2D]">
                      100% Organic &amp; Fresh
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-1.5">
                    <Truck className="w-4 h-4 text-[#1D5B39]" />
                    <span className="text-[10px] font-medium leading-tight text-[#253C2D]">
                      Fast Local Delivery
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1D5B39]" />
                    <span className="text-[10px] font-medium leading-tight text-[#253C2D]">
                      Secure Payment
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scenic Countryside Cottage Artwork at Bottom Edge */}
            <div className="relative w-full h-[76px] overflow-hidden select-none pointer-events-none">
              <Image
                src="/ui/sidebar-farm-footer.jpg"
                alt=""
                fill
                sizes="420px"
                className="object-cover object-bottom"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, #F7F6EE 0%, rgba(247,246,238,0.65) 38%, rgba(247,246,238,0) 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Wholesale Minimum Quantity Modal */}
      {popup && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          onClick={() => setPopup(false)}
        />
      )}
      <div
        className="fixed left-0 right-0 top-0 z-[70] transition-transform duration-300 ease-out"
        style={{ transform: popup ? 'translateY(0)' : 'translateY(-110%)' }}
      >
        <div className="mx-auto max-w-lg rounded-b-3xl px-6 pt-8 pb-6 bg-[#FAFBF5] border-x border-b border-[#DCE4D5]">
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
              <p className="text-sm mt-1 text-[#586A5F]">Update the quantities below to continue.</p>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            {violatingItems.map((item) => {
              const { minQty } = getStockLimits(item)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3 bg-[#FFF8EE] border border-[#FFE4B2]"
                >
                  <div>
                    <p className="text-sm font-bold text-[#14261B]">{item.name}</p>
                    <p className="text-xs mt-0.5 text-[#B45309]">
                      You have {item.qty} — minimum is <span className="font-bold">{minQty}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 bg-[#FFE4B2] text-[#92400E]">
                    +{minQty - item.qty} needed
                  </span>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => setPopup(false)}
            className="w-full py-3.5 rounded-full text-sm font-bold cursor-pointer text-white bg-[#0B462B] hover:bg-[#083821] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  )
}
