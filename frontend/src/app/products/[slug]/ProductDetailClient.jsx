

'use client'
import { useSession } from 'next-auth/react'
import { useState, useRef, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/app/components/ProductCard'
import { useCart } from '@/app/context/CartContext'
import {
  ShoppingCart, ShoppingBag, Check, Truck, Store,
  Minus, Plus, ArrowRight, CreditCard, Zap, Lock,
} from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, reviews, size = 16 }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24"
            fill={i <= full ? '#855000' : i === full + 1 && half ? 'url(#half-star)' : '#E5E7EB'}>
            <defs>
              <linearGradient id="half-star">
                <stop offset="50%" stopColor="#855000" />
                <stop offset="50%" stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        ))}
      </div>
      {reviews > 0 && (
        <span style={{ fontSize: '13px', color: '#6D7A73' }}>
          {rating.toFixed(1)} <span style={{ color: '#BCCAC1' }}>·</span> {reviews} reviews
        </span>
      )}
    </div>
  )
}

// ─── CKEditor HTML renderer ───────────────────────────────────────────────────

function RichContent({ html, className = '', style = {} }) {
  if (!html) return null
  return (
    <div className={`ck-content ${className}`} style={style}
      dangerouslySetInnerHTML={{ __html: html }} />
  )
}

// ─── useUnitSelector hook ─────────────────────────────────────────────────────

function useUnitSelector(product, isApprovedWholesale) {
  const unitOptions = product.unitOptions || []
  const hasUnits    = unitOptions.length > 0

  const defaultUnit = useMemo(() => {
    if (!hasUnits) return null
    return unitOptions.find((u) => u.isDefault) || unitOptions[0]
  }, [unitOptions, hasUnits])

  const [selectedUnitId, setSelectedUnitId] = useState(
    () => defaultUnit?.id?.toString() ?? null,
  )

  const selectedUnit = useMemo(() => {
    if (!hasUnits || selectedUnitId === null) return null
    return unitOptions.find((u) => u.id.toString() === selectedUnitId) || null
  }, [unitOptions, hasUnits, selectedUnitId])

  function handleUnitChange(id) {
    setSelectedUnitId(id)
  }

  const retailPrice = selectedUnit
    ? Number(selectedUnit.price)
    : Number(product.price)

  const wholesaleUnitPrice = isApprovedWholesale
    ? selectedUnit?.wholesalePrice != null
      ? Number(selectedUnit.wholesalePrice)
      : product.wholesalePrice != null
        ? Number(product.wholesalePrice)
        : null
    : null

  return {
    unitOptions,
    hasUnits,
    selectedUnitId,
    selectedUnit,
    handleUnitChange,
    retailPrice,
    wholesaleUnitPrice,
  }
}

// ─── Unit Selector dropdown ───────────────────────────────────────────────────

function UnitSelector({ unitOptions, hasUnits, selectedUnitId, onChange, fallbackUnit }) {
  if (!hasUnits) {
    return (
      <div className="w-full bg-white border border-[#BCCAC1]/40 rounded-xl px-4 py-3
                      text-sm font-medium text-[#151E13]">
        {fallbackUnit || '—'}
      </div>
    )
  }

  return (
    <div className="relative">
      <select
        value={selectedUnitId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer bg-white border border-[#BCCAC1]/40 rounded-xl
                   px-4 py-3 appearance-none text-sm font-medium text-[#151E13]
                   focus:ring-2 focus:ring-[#00694C]/20 focus:border-[#00694C] outline-none"
      >
        {unitOptions.map((u) => (
          <option key={u.id} value={u.id.toString()}>
            {u.label} — €{Number(u.price).toFixed(2)}
          </option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        width="14" height="14" fill="none" stroke="#6D7A73" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}

// ─── Review Form Component ───────────────────────────────────────────────────

function ReviewForm({ product, session, localToken }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const canReview = product.userCanReview?.can_review
  const disabledMessage = product.userCanReview?.message

  const hasAuth = !!session || !!localToken
  const activeToken = session?.user?.accessToken || session?.access || localToken

  if (!hasAuth) {
    return (
      <div className="bg-[#FAFAF8] border border-[#BCCAC1]/40 rounded-xl p-6 mb-10 text-center">
        <p className="text-sm text-[#6D7A73]">Please log in to submit a review.</p>
      </div>
    )
  }

  if (!canReview) {
    return (
      <div className="bg-[#FAFAF8] border border-[#BCCAC1]/40 rounded-xl p-6 mb-10 text-center">
        <p className="text-sm font-medium text-[#855000]">{disabledMessage}</p>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      const { submitReview } = await import('@/lib/api_product')
      await submitReview(activeToken, {
        product: product.id,
        rating,
        comment
      })
      setMessage('Review submitted successfully! Please refresh the page to see it.')
      setComment('')
      setRating(5)
    } catch (err) {
      setMessage(err.message || 'Failed to submit review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-[#BCCAC1]/40 rounded-xl p-6 mb-10">
      <h4 className="font-bold text-[#151E13] mb-4">Write a Review</h4>
      {message && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('success') ? 'bg-[#ECF7E4] text-[#00694C]' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#6D7A73] mb-2 block">Rating</label>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <button type="button" key={i} onClick={() => setRating(i)} className="p-1 cursor-pointer hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill={i <= rating ? '#855000' : '#E5E7EB'}>
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#6D7A73] mb-2 block">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            className="w-full bg-[#FAFAF8] border border-[#BCCAC1]/40 rounded-xl px-4 py-3 text-sm text-[#151E13] focus:ring-2 focus:ring-[#00694C]/20 outline-none resize-none"
            placeholder="Share your experience..."
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="self-start rounded-xl px-6 py-2.5 bg-[#00694C] text-white font-bold text-sm hover:bg-[#085041] transition-colors disabled:opacity-50 cursor-pointer">
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}

// ─── Tab Section ─────────────────────────────────────────────────────────────

function TabSection({ product, session, localToken }) {
  const [tab, setTab] = useState('Description')
  const tabs = ['Description', 'Nutritional Info', 'Origin', 'Reviews']

  return (
    <section className="border-t border-[#BCCAC1]/30">
      <div className="flex border-b border-[#BCCAC1]/20 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="cursor-pointer shrink-0 px-5 py-4 text-sm transition-all"
            style={{
              fontWeight: tab === t ? 700 : 500,
              color: tab === t ? '#151E13' : '#6D7A73',
              borderBottom: tab === t ? '2px solid #00694C' : '2px solid transparent',
              background: 'none', whiteSpace: 'nowrap',
            }}>
            {t}{t === 'Reviews' ? ` (${product.reviews})` : ''}
          </button>
        ))}
      </div>

      <div className="py-8 max-w-[820px]">
        {tab === 'Description' && (
          <div>
            <h3 style={{ fontFamily: '"Newsreader", Georgia, serif',
                         fontSize: 'clamp(1.25rem, 2vw, 1.55rem)',
                         fontWeight: 700, color: '#151E13', marginBottom: '14px' }}>
              A Taste of the Sun
            </h3>
            <RichContent html={product.description}
              style={{ fontSize: '15px', color: '#3D4943', lineHeight: 1.75, marginBottom: '32px' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {product.keyFeatures && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#6D7A73] uppercase mb-4">
                    Key Features
                  </p>
                  <RichContent html={product.keyFeatures} className="ck-list-accent" />
                </div>
              )}
              {product.bestUsedFor && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#6D7A73] uppercase mb-4">
                    Best Used For
                  </p>
                  <RichContent html={product.bestUsedFor} className="ck-list-accent" />
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Nutritional Info' && (
          <div>
            <h3 style={{ fontFamily: '"Newsreader", Georgia, serif',
                         fontSize: '1.4rem', fontWeight: 700, color: '#151E13', marginBottom: '20px' }}>
              Nutritional Information
            </h3>
            <p style={{ fontSize: '13.5px', color: '#6D7A73', marginBottom: '20px' }}>
              Approximate values per 100 g. Figures may vary by season and growing conditions.
            </p>
            <div className="rounded-2xl border border-[#BCCAC1]/40 overflow-hidden max-w-sm">
              {[
                ['Energy', '36 kcal'], ['Protein', '1.6 g'], ['Carbohydrates', '7.1 g'],
                ['of which sugars', '4.7 g'], ['Fat', '0.4 g'], ['Fibre', '2.1 g'], ['Salt', '0.02 g'],
              ].map(([label, val], i) => (
                <div key={label} className="flex justify-between"
                  style={{
                    padding: label.startsWith('of') ? '12px 20px 12px 28px' : '12px 20px',
                    background: i % 2 === 0 ? '#FAFAF8' : 'white', fontSize: '14px',
                    color: label.startsWith('of') ? '#6D7A73' : '#151E13',
                    fontWeight: label.startsWith('of') ? 400 : 500,
                  }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Origin' && (
          <div>
            <h3 style={{ fontFamily: '"Newsreader", Georgia, serif',
                         fontSize: '1.4rem', fontWeight: 700, color: '#151E13', marginBottom: '14px' }}>
              From {product.origin}
            </h3>
            <RichContent html={product.description}
              style={{ fontSize: '15px', color: '#3D4943', lineHeight: 1.75 }} />
          </div>
        )}

        {tab === 'Reviews' && (
          <div>
            <div className="flex items-center gap-5 mb-10">
              <div>
                <div style={{ fontFamily: '"Newsreader", Georgia, serif',
                              fontSize: '3.5rem', fontWeight: 700, color: '#151E13', lineHeight: 1 }}>
                  {product.rating.toFixed(1)}
                </div>
                <StarRating rating={product.rating} reviews={product.reviews} size={14} />
              </div>
            </div>
            <ReviewForm product={product} session={session} localToken={localToken} />
            
            {product.reviewsList && product.reviewsList.length > 0 ? (
              product.reviewsList.map((r, idx) => {
                const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = new Date(r.created_at).toLocaleDateString(undefined, dateOptions);
                return (
                  <div key={r.id || idx} className="border-b border-[#BCCAC1]/30 pb-7 mb-7 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: '#151E13' }}>{r.user?.first_name ? `${r.user.first_name} ${r.user.last_name || ''}` : r.user}</p>
                        <p style={{ fontSize: '12px', color: '#6D7A73' }}>{formattedDate}</p>
                      </div>
                      <StarRating rating={r.rating} reviews={0} size={13} />
                    </div>
                    <p style={{ fontSize: '14px', color: '#3D4943', lineHeight: 1.7 }}>{r.comment}</p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[#6D7A73]">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Related Products ─────────────────────────────────────────────────────────

function RelatedProducts({ related }) {
  if (!related?.length) return null
  return (
    <section className="border-t border-[#BCCAC1]/30 pt-12 pb-24 lg:pb-20">
      <div className="flex items-end justify-between mb-8">
        <h2 style={{ fontFamily: '"Newsreader", Georgia, serif',
                     fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 700, color: '#151E13' }}>
          You might also enjoy
        </h2>
        <Link href="/shop" className="hidden sm:flex items-center gap-1.5"
          style={{ fontSize: '13.5px', fontWeight: 600, color: '#00694C' }}>
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {related.map((p) => (
          <ProductCard key={p.id} product={{ ...p, inStock: p.inStock ?? true }} />
        ))}
      </div>
    </section>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductDetailClient({ product: initialProduct, related }) {
  const { data: session }    = useSession()
  const { getAccess } = useAuth()
  const isApprovedWholesale  = session?.user?.isApproved === true

  const [product, setProduct] = useState(initialProduct)
  const [localToken, setLocalToken] = useState(null)

  useEffect(() => {
    const token = getAccess()
    if (token) {
      setLocalToken(token)
      if (!session) {
        import('@/lib/api_product').then(({ getProductBySlug }) => {
           getProductBySlug(initialProduct.slug, { token }).then(fetched => {
             setProduct(fetched)
           }).catch(console.error)
        })
      }
    }
  }, [initialProduct.slug, session, getAccess])

  const {
    unitOptions, hasUnits,
    selectedUnitId, selectedUnit, handleUnitChange,
    retailPrice, wholesaleUnitPrice,
  } = useUnitSelector(product, isApprovedWholesale)

  const displayPrice      = wholesaleUnitPrice ?? retailPrice
  const isWholesalePrice  = !!wholesaleUnitPrice
  const baseRetailPrice   = Number(product.price)

  const [added, setAdded]             = useState(false)
  const { addItem, setSidebarOpen }   = useCart()
  const [activeImg, setActiveImg]     = useState(0)
  const [qty, setQty]                 = useState(1)
  const [fulfillment, setFulfillment] = useState('delivery')
  const galleryRef = useRef(null)

  const savePercent = product.oldPrice
    ? Math.round((1 - baseRetailPrice / Number(product.oldPrice)) * 100)
    : null

  function handleAddToCart() {
    if (isApprovedWholesale && product.wholesalePrice) {
      // const minQty = product.minWholesaleQty || 1
      // if (qty < minQty) {
      //   // alert(`Minimum ${minQty} ${product.wholesaleUnit || 'units'} required for wholesale pricing.`)
      //   return
      // }
    }
    addItem(
      { ...product, unit: selectedUnit?.label || product.unit },
      displayPrice,
      qty,
    )
    setSidebarOpen(true)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleGalleryScroll() {
    if (!galleryRef.current) return
    const { scrollLeft, clientWidth } = galleryRef.current
    setActiveImg(Math.round(scrollLeft / (clientWidth * 0.85 + 16)))
  }
  function scrollToImage(i) {
    if (!galleryRef.current) return
    galleryRef.current.scrollTo({ left: i * (galleryRef.current.clientWidth * 0.85 + 16), behavior: 'smooth' })
    setActiveImg(i)
  }

  const fulfillmentOptions = [
    { id: 'delivery', label: 'Home Delivery',    sub: 'Today before 8:00 PM', Icon: Truck      },
    { id: 'collect',  label: 'Click & Collect',  sub: 'Ready in 2 hours',     Icon: Store      },
    { id: 'instore',  label: 'In-Store Payment', sub: 'Reserve for 24 hours', Icon: CreditCard },
  ]

  const PLACEHOLDER = 'https://placehold.co/800x600/ECF7E4/00694C?text=No+Image'
  const raw    = product.images?.length ? product.images : [product.image]
  const images = raw.filter(Boolean).length ? raw.filter(Boolean) : [PLACEHOLDER]

  const unitLabel = selectedUnit?.label || product.unit || ''

  return (
    <main className="bg-[#F2FDEA] min-h-screen">

      <style>{`
        .ck-content ul, .ck-content ol { padding-left: 1.25rem; margin: 0; }
        .ck-content ul { list-style: disc; }
        .ck-content ol { list-style: decimal; }
        .ck-content li { font-size: 14px; color: #3D4943; line-height: 1.7; margin-bottom: 6px; }
        .ck-content p  { margin: 0 0 .75rem; }
        .ck-content strong { font-weight: 700; }
        .ck-content em { font-style: italic; }
        .ck-content a  { color: #00694C; text-decoration: underline; }
        .ck-list-accent ul { list-style: none; padding: 0; }
        .ck-list-accent li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 14px; color: #3D4943; line-height: 1.6; margin-bottom: 10px;
        }
        .ck-list-accent li::before {
          content: ''; display: inline-block; flex-shrink: 0;
          width: 6px; height: 6px; border-radius: 50%;
          background: #00694C; margin-top: 7px;
        }
      `}</style>

      {/* ── MOBILE GALLERY ───────────────────────────────────────────────── */}
      <section className="lg:hidden px-4 mb-8 pt-3">
        <div ref={galleryRef} onScroll={handleGalleryScroll}
          className="flex gap-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
          {images.map((img, i) => (
            <div key={i} className="shrink-0 rounded-2xl overflow-hidden"
              style={{ width: '85%', aspectRatio: '3/4', scrollSnapAlign: 'center',
                       boxShadow: '0 24px 48px -12px rgba(0,33,21,0.12)' }}>
              <div className="relative w-full h-full">
                <Image src={img} alt={product.name} fill className="object-cover" sizes="85vw" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-4">
          {images.map((_, i) => (
            <button key={i} onClick={() => scrollToImage(i)}
              className="rounded-full transition-all duration-300"
              style={{ height: '6px', width: i === activeImg ? '24px' : '6px',
                       background: i === activeImg ? '#00694C' : '#BCCAC1' }} />
          ))}
        </div>
      </section>

      {/* ── MOBILE PRODUCT HEADER ────────────────────────────────────────── */}
      <header className="lg:hidden px-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="italic text-lg text-[#855000]"
            style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
            from {product.origin}
          </span>
          <div className="flex-1 h-px bg-[#BCCAC1]/30" />
        </div>
        <h1 className="font-bold tracking-tight text-[#151E13] mb-3"
          style={{ fontFamily: '"Newsreader", Georgia, serif',
                   fontSize: 'clamp(2.4rem, 8vw, 3rem)', lineHeight: 1.1 }}>
          {product.name}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <StarRating rating={product.rating} reviews={product.reviews} size={14} />
          {unitLabel && <span style={{ fontSize: '13px', color: '#6D7A73' }}>{unitLabel}</span>}
        </div>
      </header>

      {/* ── MOBILE UNIT + PRICE + QTY + CTA ─────────────────────────────── */}
      <section className="lg:hidden px-6 mb-8">
        <div className="bg-white rounded-3xl p-5 border border-[#BCCAC1]/20"
          style={{ boxShadow: '0 2px 16px rgba(0,33,21,0.05)' }}>

          {hasUnits && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6D7A73] mb-2">
                Select Unit
              </p>
              <UnitSelector
                unitOptions={unitOptions} hasUnits={hasUnits}
                selectedUnitId={selectedUnitId} onChange={handleUnitChange}
                fallbackUnit={product.unit}
              />
            </div>
          )}

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold"
              style={{ color: isWholesalePrice ? '#7C3AED' : '#855000',
                       fontFamily: '"Newsreader", Georgia, serif' }}>
              €{displayPrice.toFixed(2)}
            </span>
            {isWholesalePrice && (
              <span className="text-base text-[#BCCAC1] line-through">€{retailPrice.toFixed(2)}</span>
            )}
            {!isWholesalePrice && product.oldPrice && (
              <span className="text-base text-[#BCCAC1] line-through">€{Number(product.oldPrice).toFixed(2)}</span>
            )}
            {unitLabel && (
              <span className="text-sm text-[#6D7A73]">/ {unitLabel}</span>
            )}
          </div>
          {isWholesalePrice && (
            <p className="text-xs font-bold text-purple-600 mb-3">
              Wholesale price · Min. {product.minWholesaleQty} {product.wholesaleUnit || 'units'}
            </p>
          )}

          <div className="flex items-center gap-3 mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6D7A73] w-16 shrink-0">
              Qty
            </p>
            <div className="flex items-center justify-between bg-[#F2FDEA] border border-[#BCCAC1]/40
                            rounded-xl px-2 py-1 flex-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2 cursor-pointer hover:bg-[#ddf0d0] rounded-lg text-[#00694C] transition-colors">
                <Minus size={16} />
              </button>
              <span className="font-bold text-lg text-[#151E13]">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}
                className="p-2 cursor-pointer hover:bg-[#ddf0d0] rounded-lg text-[#00694C] transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 mb-4 px-1">
            <span className="text-sm text-[#6D7A73]">Estimated Total</span>
            <span className="font-bold text-xl text-[#151E13]">
              €{(displayPrice * qty).toFixed(2)}
            </span>
          </div>

          {product.inStock ? (
            <button onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 transition-all"
              style={{ background: added ? '#085041' : 'linear-gradient(135deg,#00694C 0%,#008560 100%)',
                       color: 'white', fontSize: '15px', fontWeight: 700 }}>
              {added ? <><Check size={18} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
            </button>
          ) : (
            <button disabled
              className="w-full rounded-xl py-3 bg-gray-100 text-gray-400 cursor-not-allowed text-sm font-bold">
              Out of Stock
            </button>
          )}
        </div>
      </section>

      {/* ── MOBILE EDITORIAL CARD ────────────────────────────────────────── */}
      <section className="lg:hidden px-6 mb-10">
        <div className="bg-[#ECF7E4] p-8 rounded-[2rem] relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold mb-4"
              style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '1.4rem', color: '#151E13' }}>
              The Digital Larder's Choice
            </h3>
            <RichContent html={product.shortDesc} className="mb-6 text-[#151E13]/80"
              style={{ fontSize: '16px', lineHeight: 1.7 }} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#855000] font-bold block mb-1">Notes</span>
                <span className="text-sm font-medium text-[#151E13]">{product.notes}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#855000] font-bold block mb-1">Texture</span>
                <span className="text-sm font-medium text-[#151E13]">{product.texture}</span>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#00694C]/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* ── DESKTOP MAIN GRID ────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-6">
          <nav className="flex items-center gap-2 text-sm" style={{ color: '#6D7A73' }}>
            <Link href="/" className="hover:text-[#085041] transition-colors">Shop</Link>
            <span className="text-[#BCCAC1]">›</span>
            <span style={{ color: '#3D4943', fontWeight: 500 }}>{product.category}</span>
          </nav>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8">
          <div className="grid grid-cols-12 gap-16">

            {/* LEFT: Gallery */}
            <div className="col-span-7 flex flex-col gap-4">
              {/* CHANGED: aspect-[4/3] → aspect-[16/9] for shorter main image */}
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-white
                              border border-[#BCCAC1]/20"
                style={{ boxShadow: '0 24px 48px -12px rgba(0,33,21,0.08)' }}>
                <Image src={images[activeImg] || images[0]} alt={product.name} fill priority
                  sizes="(max-width:1280px) 58vw, 730px"
                  className="object-cover transition-opacity duration-300" />
              </div>
              {/* CHANGED: grid-cols-4 gap-3 → grid-cols-5 gap-2 for 5 thumbnails per row */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className="relative aspect-square rounded-xl overflow-hidden bg-white"
                      style={{ border: `2px solid ${i === activeImg ? '#00694C' : '#BCCAC1'}`,
                               opacity: i === activeImg ? 1 : 0.7 }}>
                      <Image src={img} alt={`${product.name} ${i + 1}`} fill sizes="120px"
                        className="cursor-pointer object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product info */}
            <div className="col-span-5 flex flex-col gap-6">

              <div>
                <h1 className="font-bold tracking-tight text-[#151E13] mb-2"
                  style={{ fontFamily: '"Newsreader", Georgia, serif',
                           fontSize: 'clamp(2rem, 3vw, 2.6rem)', lineHeight: 1.1 }}>
                  {product.name}
                </h1>
                <p className="italic text-lg text-[#00694C] mb-3"
                  style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
                  Class A — Fresh from {product.origin}
                </p>
                <StarRating rating={product.rating} reviews={product.reviews} size={16} />
              </div>

              <div className="bg-white p-6 rounded-md border-l-4 border-[#00694C]"
                style={{ boxShadow: '0 2px 8px rgba(0,33,21,0.04)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl font-bold"
                        style={{ color: isWholesalePrice ? '#7C3AED' : '#855000',
                                 fontFamily: '"Newsreader", Georgia, serif' }}>
                        €{displayPrice.toFixed(2)}
                        {unitLabel && (
                          <span className="text-lg font-normal text-[#6D7A73] ml-1">
                            / {unitLabel}
                          </span>
                        )}
                      </span>
                      {isWholesalePrice && (
                        <span className="text-lg text-[#BCCAC1] line-through">
                          €{retailPrice.toFixed(2)}
                        </span>
                      )}
                      {!isWholesalePrice && product.oldPrice && (
                        <span className="text-lg text-[#BCCAC1] line-through">
                          €{Number(product.oldPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {isWholesalePrice && (
                      <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
                                    borderRadius: '7px', padding: '4px 10px', marginTop: '6px',
                                    display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: '#6D28D9', fontWeight: 700 }}>
                          WHOLESALE · Min. {product.minWholesaleQty} {product.wholesaleUnit || 'units'}
                        </span>
                      </div>
                    )}
                    {product.onSale && !isWholesalePrice && (
                      <p className="text-xs font-bold uppercase tracking-widest text-[#00694C] mt-1">
                        Limited Time Offer
                      </p>
                    )}
                  </div>
                  {!isWholesalePrice && savePercent && (
                    <span className="bg-[#BA1A1A] text-white text-[10px] font-bold px-3 py-1
                                     rounded-full uppercase tracking-widest shrink-0">
                      Save {savePercent}%
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold
                                      text-[#6D7A73] block mb-2">
                      Select Unit
                    </label>
                    <UnitSelector
                      unitOptions={unitOptions} hasUnits={hasUnits}
                      selectedUnitId={selectedUnitId} onChange={handleUnitChange}
                      fallbackUnit={product.unit}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold
                                      text-[#6D7A73] block mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center justify-between bg-white border
                                    border-[#BCCAC1]/40 rounded-xl px-2 py-1">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="p-2 cursor-pointer hover:bg-[#E7F1DF] rounded-lg
                                   text-[#00694C] transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-lg text-[#151E13]">{qty}</span>
                      <button onClick={() => setQty((q) => q + 1)}
                        className="p-2 cursor-pointer hover:bg-[#E7F1DF] rounded-lg
                                   text-[#00694C] transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-sm text-[#6D7A73]">
                    Estimated Total
                    {unitLabel && (
                      <span className="text-[#BCCAC1]"> · {qty} × {unitLabel}</span>
                    )}
                  </span>
                  <span className="font-bold text-xl text-[#151E13]">
                    €{(displayPrice * qty).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold
                                  text-[#6D7A73] block mb-3">
                  Fulfillment
                </label>
                <div className="space-y-2.5">
                  {fulfillmentOptions.map((opt) => (
                    <label key={opt.id}
                      className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                      style={{ background: 'white',
                               border: `1px solid ${fulfillment === opt.id ? '#00694C' : '#BCCAC1'}` }}>
                      <input type="radio" name="fulfillment" value={opt.id}
                        checked={fulfillment === opt.id}
                        onChange={() => setFulfillment(opt.id)}
                        className="accent-[#00694C]" />
                      <opt.Icon size={18}
                        className={fulfillment === opt.id ? 'text-[#00694C]' : 'text-[#6D7A73]'} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#151E13]">{opt.label}</p>
                        <p className="text-xs text-[#6D7A73]">{opt.sub}</p>
                      </div>
                      {opt.id !== 'instore' && (
                        <span className="text-xs font-bold text-[#00694C]">Free</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {product.inStock ? (
                <button onClick={handleAddToCart}
                  className="w-full cursor-pointer flex items-center justify-center gap-3
                             rounded-xl py-3 transition-all duration-200 shadow-sm"
                  style={{ background: added
                             ? '#085041'
                             : 'linear-gradient(135deg,#00694C 0%,#008560 100%)',
                           color: 'white', fontSize: '16px', fontWeight: 700,
                           letterSpacing: '0.05em' }}>
                  {added
                    ? <><Check size={19} /> Added to Cart</>
                    : <><ShoppingCart size={19} /> Add to Cart — €{(displayPrice * qty).toFixed(2)}</>
                  }
                </button>
              ) : (
                <button disabled
                  className="w-full flex items-center justify-center gap-3 rounded-xl py-4
                             bg-gray-100 text-gray-400 cursor-not-allowed"
                  style={{ fontSize: '16px', fontWeight: 700 }}>
                  Out of Stock
                </button>
              )}

              {/* {product.inStock && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00694C]" />
                  <span className="text-xs font-medium text-[#00694C]">In Stock — 42 units available</span>
                </div>
              )} */}

              {/* <div className="grid grid-cols-3 gap-2 border-t border-[#BCCAC1]/20 pt-4 mt-2">
                {[
                  { Icon: Zap,   label: 'Fresh Daily' },
                  { Icon: Truck, label: 'Free > €40'  },
                  { Icon: Lock,  label: 'Secure Pay'  },
                ].map((t) => (
                  <div key={t.label} className="flex flex-col items-center gap-1.5 py-2">
                    <t.Icon size={18} className="text-[#00694C] opacity-60" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D7A73]">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS + RELATED  */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-10 mt-8 lg:mt-16 pb-36 lg:pb-0">
        <TabSection product={product} session={session} localToken={localToken} />
        <RelatedProducts related={related} />
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 px-5 pb-8 pt-4
                      bg-[#F2FDEA]/80 backdrop-blur-xl">
        <div className="flex items-center gap-5 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#855000]">
              Total
            </span>
            <span className="text-2xl font-bold text-[#151E13]"
              style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
              €{(displayPrice * qty).toFixed(2)}
            </span>
            {unitLabel && (
              <span className="text-xs text-[#6D7A73]">{qty} × {unitLabel}</span>
            )}
          </div>
          <button onClick={handleAddToCart}
            className="flex-1 h-16 flex items-center justify-center gap-3 rounded-2xl
                       transition-all active:scale-95"
            style={{ background: added ? '#085041' : 'linear-gradient(135deg,#00694C 0%,#008560 100%)',
                     color: 'white', boxShadow: '0 24px 48px -12px rgba(0,33,21,0.25)' }}>
            {added
              ? <><Check size={18} /><span className="font-bold uppercase tracking-widest text-sm">Added!</span></>
              : <><ShoppingBag size={18} style={{ fill: 'white', opacity: 0.9 }} />
                  <span className="font-bold uppercase tracking-widest text-sm">Add to Cart</span></>
            }
          </button>
        </div>
      </div>
    </main>
  )
}