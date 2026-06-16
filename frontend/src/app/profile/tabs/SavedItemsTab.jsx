'use client'
// src/app/profile/tabs/SavedItemsTab.jsx
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlist } from '@/app/context/WishlistContext'
import { slugify } from '@/app/lib/slugify'
import AddToCartButton from '@/app/components/AddToCartButton'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #eaeaea',
      borderRadius: 20,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ background: '#f0f0f0', height: 180, animation: 'shimmer 1.4s ease infinite' }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, width: '70%', background: '#f0f0f0', borderRadius: 6, animation: 'shimmer 1.4s ease infinite' }} />
        <div style={{ height: 11, width: '40%', background: '#f0f0f0', borderRadius: 6, animation: 'shimmer 1.4s ease infinite' }} />
        <div style={{ height: 32, background: '#f0f0f0', borderRadius: 10, marginTop: 6, animation: 'shimmer 1.4s ease infinite' }} />
      </div>
    </div>
  )
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Remove', confirmColor = '#991B1B', onConfirm, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8,30,19,0.45)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          animation: 'smFade 0.18s ease',
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 1001,
        background: '#fff',
        borderRadius: 22,
        padding: '32px 26px 24px',
        width: 'min(380px, calc(100vw - 32px))',
        boxShadow: '0 32px 80px rgba(8,30,19,0.18)',
        animation: 'smPop 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <svg width="22" height="22" fill="none" stroke="#991B1B" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>

        <h3 style={{
          margin: '0 0 8px', textAlign: 'center',
          fontSize: 18, fontWeight: 700, color: '#151e13',
          fontFamily: '"Newsreader", Georgia, serif',
        }}>
          {title}
        </h3>
        <p style={{
          margin: '0 0 26px', textAlign: 'center',
          fontSize: 13.5, color: '#6d7a73', lineHeight: 1.6,
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 0',
              background: '#F3F6F4', border: '1.5px solid #E2EAE5',
              borderRadius: 12, cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600, color: '#3d4943',
              transition: 'background .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E8F0EA'}
            onMouseLeave={e => e.currentTarget.style.background = '#F3F6F4'}
          >
            Keep It
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px 0',
              background: confirmColor, border: 'none',
              borderRadius: 12, cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'opacity .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes smFade { from { opacity:0 } to { opacity:1 } }
        @keyframes smPop  { from { opacity:0; transform:translate(-50%,-46%) scale(0.92) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
        @keyframes shimmer {
          0%,100% { opacity:1 }
          50%      { opacity:0.45 }
        }
      `}</style>
    </>
  )
}

function WishlistCard({ product, onRemove }) {
  const slug = product.slug || slugify(product.name)
  const [imgError, setImgError] = useState(false)
  const [removing, setRemoving] = useState(false)

  function handleRemove(e) {
    e.preventDefault()
    e.stopPropagation()
    setRemoving(true)
    setTimeout(() => onRemove(), 250)
  }

  const cleanOrigin = product.origin?.replace(/^from\s+/i, '')
  const displayPrice = product.wholesalePrice ? product.wholesalePrice : product.price
  const isWholesalePrice = !!product.wholesalePrice

  return (
    <div className={`flex flex-col w-full min-w-0 bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 group ${removing ? 'scale-[0.96] opacity-0' : 'hover:shadow-sm'}`}
      style={{
        boxShadow: removing ? 'none' : undefined,
      }}
    >
      <Link href={`/products/${slug}`} className="block relative w-full aspect-[4/3] overflow-hidden flex-shrink-0 bg-[#ECF7E4]">
        {product.image && !imgError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-opacity duration-300 hover:opacity-95"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[#BCCAC1]">eco</span>
          </div>
        )}

        {/* Left badge */}
        {product.badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full ${product.badgeColor || ''}`}>
            {product.badge}
          </span>
        )}
        {product.onSale && !isWholesalePrice && !product.badge && (
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

        {/* Remove heart button */}
        <button
          onClick={handleRemove}
          title="Remove from saved"
          className="absolute top-2 right-2 w-[30px] h-[30px] rounded-full bg-white/90 backdrop-blur-[4px] flex items-center justify-center shadow-sm z-10 transition-transform duration-200 hover:scale-110 hover:bg-red-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#E53935" stroke="#E53935" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-0">
            <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              OUT OF STOCK
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 md:p-4 min-w-0">
        <Link href={`/products/${slug}`} className="flex-1 min-w-0 block">
          <div className="flex items-start gap-1.5 mb-1 min-w-0 w-full">
            <h3 className="font-sans font-bold text-gray-900 text-[13px] md:text-[15px] leading-snug flex-1 min-w-0 group-hover:text-[#00694C] transition-colors line-clamp-2">
              {product.name}
            </h3>
            {cleanOrigin && (
              <div className="flex-shrink-0 text-right" style={{ maxWidth: '72px' }}>
                <span className="font-serif italic text-[10px] md:text-[11px] text-gray-400 leading-tight block">from</span>
                <span className="font-serif italic text-[10px] md:text-[11px] text-gray-400 leading-tight block line-clamp-2">
                  {cleanOrigin}
                </span>
              </div>
            )}
          </div>

          {product.unit && <p className="text-[11px] md:text-[12px] text-gray-400 mb-2 leading-tight">{product.unit}</p>}
        </Link>

        {product.inStock ? (
          <div className="flex flex-col gap-2 mt-auto pt-2">
            <div className="flex items-center justify-between gap-3 min-w-0 flex-wrap">
              <div className="flex items-baseline gap-1 min-w-0">
                <span className={`text-lg md:text-xl font-bold leading-none ${isWholesalePrice ? 'text-purple-600' : 'text-amber-500'}`}>
                  €{Number(displayPrice).toFixed(2)}
                </span>
                {isWholesalePrice && <span className="text-xs text-gray-400 line-through">€{Number(product.price).toFixed(2)}</span>}
                {!isWholesalePrice && product.oldPrice && <span className="text-xs text-gray-400 line-through">€{Number(product.oldPrice).toFixed(2)}</span>}
              </div>
              <div onClick={e => e.preventDefault()} className="flex-shrink-0">
                <AddToCartButton
                  product={product} inStock={product.inStock}
                  isWholesale={isWholesalePrice}
                  minWholesaleQty={product.minWholesaleQty || 1}
                  effectivePrice={displayPrice}
                />
              </div>
            </div>
            {isWholesalePrice && (
              <div className="flex items-center gap-1 bg-[#F5F3FF] p-1.5 rounded-[6px]">
                <svg width="9" height="9" fill="#7C3AED" viewBox="0 0 24 24">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                </svg>
                <span className="text-[9px] md:text-[10px] text-[#6D28D9] font-semibold">
                  Min. {product.minWholesaleQty || 1} {product.wholesaleUnit || 'units'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={e => { e.preventDefault(); }}
            className="w-full rounded-lg border transition-colors mt-auto"
            style={{
              fontSize:'12px', fontWeight:500,
              color: '#151E13',
              borderColor: '#BCCAC1',
              padding:'7px 0',
            }}
          >
            Notify Me
          </button>
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ padding: '64px 0', textAlign: 'center' }}>
      <div style={{
  width: 72, 
  height: 72, 
  borderRadius: 20,
  // Site-er light green theme follow kora hoyeche
  background: 'linear-gradient(135deg, #ECF7E4, #F0FDF4)', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  margin: '0 auto 20px',
  // Greenish subtle shadow
  boxShadow: '0 8px 24px rgba(0,105,76,0.08)',
}}>
  <svg width="30" height="30" fill="none" stroke="#00694C" strokeWidth="1.6" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
</div>
      <p style={{
        fontFamily: '"Newsreader", Georgia, serif',
        fontSize: 20, fontStyle: 'italic',
        color: '#6d7a73', margin: '0 0 8px',
      }}>
        Nothing saved yet
      </p>
      <p style={{ fontSize: 13.5, color: '#9daaa3', margin: '0 0 28px', lineHeight: 1.6 }}>
        Tap the on any product to save it here<br/>and find it easily later.
      </p>
      <Link
        href="/shop"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 26px',
          background: '#00694C', color: '#fff',
          borderRadius: 14, fontWeight: 700, fontSize: 13.5,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(0,105,76,0.3)',
          transition: 'background 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#085041'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#00694C'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Browse Products
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SavedItemsTab({ authFetch, initialWishlist = null }) {
  const { items, hydrate, remove, clearAll, loaded } = useWishlist()

  // Server-fetched data দিয়ে WishlistContext hydrate করো (একবারই চলে)
  useEffect(() => {
    if (initialWishlist !== null) hydrate(initialWishlist)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Server data না থাকলে client-side fallback
  useEffect(() => {
    if (initialWishlist !== null || loaded) return
    authFetch(`${API_BASE}/auth/wishlist/`)
      .then(r => r.json())
      .then(data => hydrate(data))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [confirmItem,      setConfirmItem]      = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!loaded && initialWishlist === null) {
    return (
      <>
        <div style={{ height: 36, background: '#f3f4f6', borderRadius: 10, width: 160, marginBottom: 20, animation: 'shimmer 1.4s ease infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <style>{`@keyframes shimmer { 0%,100% { opacity:1 } 50% { opacity:0.45 } }`}</style>
      </>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (items.length === 0) return <EmptyState />

  // ── List ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Confirm: single item */}
      {confirmItem && (
        <ConfirmModal
          title="Remove from Saved?"
          message={
            <><strong style={{ color: '#151e13' }}>{confirmItem.name}</strong> will be removed from your saved items.</>
          }
          confirmLabel="Remove"
          onConfirm={() => { remove(confirmItem.id); setConfirmItem(null) }}
          onClose={() => setConfirmItem(null)}
        />
      )}

      {/* Confirm: clear all */}
      {showClearConfirm && (
        <ConfirmModal
          title="Clear All Saved Items?"
          message={`All ${items.length} saved items will be permanently removed.`}
          confirmLabel="Clear All"
          confirmColor="#991B1B"
          onConfirm={() => { clearAll(); setShowClearConfirm(false) }}
          onClose={() => setShowClearConfirm(false)}
        />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, color: '#6d7a73', margin: 0 }}>
            <span style={{ fontWeight: 700, color: '#151e13', fontSize: 15 }}>{items.length}</span>
            {' '}saved {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          style={{
            background: 'none', border: '1.5px solid #FCA5A5',
            cursor: 'pointer', color: '#DC2626',
            fontSize: 12, fontWeight: 600,
            padding: '6px 14px', borderRadius: 99,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6l-1,14H6L5,6M10,11v6M14,11v6M9,6V4h6v2"/>
          </svg>
          Clear All
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
        {items.map(product => (
          <WishlistCard
            key={product.id}
            product={product}
            onRemove={() => setConfirmItem(product)}
          />
        ))}
      </div>

      <style>{`
        @keyframes shimmer { 0%,100% { opacity:1 } 50% { opacity:0.45 } }
      `}</style>
    </>
  )
}