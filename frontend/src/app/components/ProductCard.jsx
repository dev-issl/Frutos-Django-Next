
'use client'
// src/app/components/ProductCard.jsx
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import AddToCartButton from '@/app/components/AddToCartButton'
import { slugify } from '@/app/lib/slugify'
import { useWishlist } from '@/app/context/WishlistContext'
import { useAuth } from '@/app/context/AuthContext'

function MinQtyToast({ product, onClose }) {
  const price = product.wholesalePrice ? product.wholesalePrice.toFixed(2) : ''
  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 'min(360px, calc(100vw - 32px))',
      background: '#151E13', color: 'white', borderRadius: '14px', padding: '16px 18px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.35)', animation: 'toastIn 0.25s ease',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,100,100,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <svg width="15" height="15" fill="none" stroke="#F87171" strokeWidth="2.2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '13.5px', margin: '0 0 4px', lineHeight: 1.3 }}>Wholesale Minimum Required</p>
        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
          A minimum of <strong style={{ color: 'white' }}>{product.minWholesaleQty} {product.wholesaleUnit || 'units'}</strong> is required
          to unlock the wholesale price of <strong style={{ color: '#6EE7B7' }}>€{price}</strong>.
        </p>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, lineHeight: 1, flexShrink: 0 }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  )
}

// ── Heart / Wishlist button ────────────────────────────────────────────────────
function WishlistButton({ product }) {
  const { isAuthenticated } = useAuth()
  const { isSaved, toggle } = useWishlist()
  const [animating, setAnimating] = useState(false)
  const saved = isSaved(product.id)

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return   // silently ignore; you could show an auth prompt here
    setAnimating(true)
    toggle(product)
    setTimeout(() => setAnimating(false), 320)
  }

  // Don't render the button if user is not authenticated
  if (!isAuthenticated) return null

  return (
    <button
      onClick={handleClick}
      title={saved ? 'Remove from saved' : 'Save for later'}
      style={{
        position: 'absolute', top: 8, right: 8,
        width: 30, height: 30,
        borderRadius: '50%',
        background: saved ? '#fff' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(4px)',
        border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.13)',
        zIndex: 10,
        transform: animating ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <svg
        width="15" height="15" viewBox="0 0 24 24"
        fill={saved ? '#E53935' : 'none'}
        stroke={saved ? '#E53935' : '#6D7A73'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'fill 0.18s, stroke 0.18s' }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

// ── Main ProductCard ──────────────────────────────────────────────────────────
export default function ProductCard({ product, notified, onNotify }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [showMinQtyToast, setShowMinQtyToast] = useState(false)
  const { data: session } = useSession()

  const sessionUser = session?.user ?? null
  const isApprovedWholesale = sessionUser?.isApproved === true

  const slug = product.slug || slugify(product.name)
  const { name, badge, badgeColor = '', origin, unit, price, oldPrice,
    wholesalePrice, minWholesaleQty = 1, inStock, image, onSale, variant } = product

  const displayPrice = wholesalePrice ? wholesalePrice : price
  const isWholesalePrice = !!wholesalePrice
  const cleanOrigin = origin?.replace(/^from\s+/i, '')

  return (
    <>
      <Link
        href={'/products/' + slug}
        className="block group w-full min-w-0"
        onClick={() => setIsNavigating(true)}
      >
        <div className={
          'flex flex-col w-full min-w-0 bg-white rounded-2xl overflow-hidden ' +
          'border border-gray-100 transition-all duration-200 ' +
          (isNavigating ? 'opacity-60 scale-[0.98]' : '')
        }>

          {/* ── Image ── */}
          <div className="rounded-2xl relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
            <Image
              src={image} alt={name} fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
            />

            {/* Left badge */}
            {badge && (
              <span className={'absolute top-2 left-2 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full ' + badgeColor}>
                {badge}
              </span>
            )}
            {onSale && !isWholesalePrice && !badge && (
              <span className="absolute top-2 left-2 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full bg-[#151E13] text-white">
                SALE
              </span>
            )}
            {isWholesalePrice && (
              <span className="absolute top-2 left-2 text-[10px] font-bold tracking-widest px-2 py-1 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}>
                WHL
              </span>
            )}

            {/* ── Wishlist heart (top-right) ── */}
            <WishlistButton product={product} />

            {/* Out of stock */}
            {!inStock && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                  OUT OF STOCK
                </span>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex flex-col flex-1 p-3 md:p-4 min-w-0">
            <div className="flex items-start gap-1.5 mb-1 min-w-0 w-full">
              <h3 className="font-sans font-bold text-gray-900 text-[13px] md:text-[15px] leading-snug flex-1 min-w-0 group-hover:text-[#00694C] transition-colors line-clamp-2">
                {name}
              </h3>
              {variant && (
                <span className="flex-shrink-0 text-[10px] md:text-[11px] font-bold text-[#00694C] bg-[#ECF7E4] px-1.5 py-0.5 rounded mt-0.5">
                  {variant}
                </span>
              )}
              {cleanOrigin && (
                <div className="flex-shrink-0 text-right" style={{ maxWidth: '72px' }}>
                  <span className="font-serif italic text-[10px] md:text-[11px] text-gray-400 leading-tight block">from</span>
                  <span className="font-serif italic text-[10px] md:text-[11px] text-gray-400 leading-tight block"
                    style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {cleanOrigin}
                  </span>
                </div>
              )}
            </div>

            {unit && (
              <div className="mb-2">
                <p className="text-[11px] md:text-[12px] text-gray-400 leading-tight m-0">{unit}</p>
              </div>
            )}

            {inStock ? (
              <div className="flex flex-col gap-1.5 mt-auto">
                <div className="flex items-center justify-between gap-1 min-w-0 flex-wrap">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className={'text-lg md:text-xl font-bold leading-none ' + (isWholesalePrice ? 'text-purple-600' : 'text-amber-500')}>
                      €{displayPrice.toFixed(2)}
                    </span>
                    {isWholesalePrice && <span className="text-xs text-gray-400 line-through">€{price.toFixed(2)}</span>}
                    {!isWholesalePrice && oldPrice && <span className="text-xs text-gray-400 line-through">€{oldPrice.toFixed(2)}</span>}
                  </div>
                  <div onClick={e => e.preventDefault()} className="flex-shrink-0">
                    <AddToCartButton
                      product={product} inStock={inStock}
                      isWholesale={isWholesalePrice}
                      minWholesaleQty={minWholesaleQty}
                      effectivePrice={displayPrice}
                    />
                  </div>
                </div>
                {isWholesalePrice && (
                  <div className="flex items-center gap-1 bg-[#F5F3FF] p-1.5 rounded-[6px]">
                    <svg width="9" height="9" fill="#7C3AED" viewBox="0 0 24 24">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    </svg>
                    <span className="text-[9px] md:text-[10px] text-[#6D28D9] font-semibold">
                      Min. {minWholesaleQty} {product.wholesaleUnit || 'units'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={e => { e.preventDefault(); onNotify?.() }}
                className="w-full rounded-lg border transition-colors mt-auto"
                style={{
                  fontSize: '12px', fontWeight: 500,
                  color: notified ? '#00694C' : '#151E13',
                  borderColor: notified ? '#00694C' : '#BCCAC1',
                  padding: '7px 0',
                }}
              >
                {notified ? 'Notified ✓' : 'Notify Me'}
              </button>
            )}
          </div>
        </div>
      </Link>

      {showMinQtyToast && (
        <MinQtyToast product={product} onClose={() => setShowMinQtyToast(false)} />
      )}
    </>
  )
}