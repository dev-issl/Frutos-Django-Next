'use client'

import { useState, useRef, useEffect } from 'react'
import { useSafeSession } from '@/lib/useSafeSession'
import { useAuth } from '@/app/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ShoppingCart,
  Minus,
  Plus,
  Heart,
  Leaf,
  Truck,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Home,
  FileText,
  Apple,
  Star,
  RefreshCw,
  ArrowRight,
  Sprout,
  Recycle,
  Award,
  Flame,
  Clock,
  X,
} from 'lucide-react'
import { useCart } from '@/app/context/CartContext'
import { useWishlist } from '@/app/context/WishlistContext'
import ProductCard from '@/app/components/ProductCard'
import { SubtleLeafWatermark } from '@/app/components/BotanicalDecor'

function formatClassLabel(variant) {
  const clean = String(variant || '').trim()
  if (!clean) return ''
  return /^class\b/i.test(clean) ? clean : `Class ${clean}`
}

function RichContent({ html, className = '', style = {} }) {
  if (!html) return null
  return (
    <div
      className={`ck-content ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function useUnitSelector(product) {
  const unitOptions = product.unitOptions ?? []
  const hasUnits = unitOptions.length > 0

  const defaultUnit = unitOptions.find((u) => u.is_default) ?? unitOptions[0] ?? null
  const defaultUnitId = defaultUnit ? defaultUnit.id.toString() : ''
  const [unitSelection, setUnitSelection] = useState({
    productId: product.id,
    unitId: defaultUnitId,
  })

  const selectedUnitId =
    unitSelection.productId === product.id ? unitSelection.unitId : defaultUnitId

  const selectedUnit = unitOptions.find((u) => u.id.toString() === selectedUnitId) ?? null
  const retailPrice = selectedUnit ? Number(selectedUnit.price) : Number(product.price)

  const wholesaleUnitPrice = product.wholesalePrice
    ? selectedUnit
      ? selectedUnit.wholesale_price != null
        ? Number(selectedUnit.wholesale_price)
        : Number(product.wholesalePrice)
      : Number(product.wholesalePrice)
    : null

  return {
    unitOptions,
    hasUnits,
    selectedUnitId,
    selectedUnit,
    handleUnitChange: (id) => setUnitSelection({ productId: product.id, unitId: id }),
    retailPrice,
    wholesaleUnitPrice,
  }
}

function UnitSelector({ unitOptions, hasUnits, selectedUnitId, onChange, fallbackUnit }) {
  if (!hasUnits) {
    if (!fallbackUnit) return null
    return (
      <div className="bg-white border border-[#DCE2D4] rounded-full px-4 py-2 text-[13px] font-semibold text-[#14261B] inline-flex items-center">
        {fallbackUnit}
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <select
        value={selectedUnitId}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-[#DCE2D4] rounded-full pl-4 pr-9 py-2 text-[13px] font-semibold text-[#14261B] cursor-pointer focus:outline-none focus:border-[#0B462B]"
      >
        {unitOptions.map((u) => (
          <option key={u.id} value={u.id.toString()}>
            {u.label} — €{Number(u.price).toFixed(2)}
          </option>
        ))}
      </select>
      <svg
        className="w-3.5 h-3.5 text-[#586A5F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}

function ReviewForm({ product, session, localToken, onSubmitted }) {
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
      <div className="rounded-[18px] bg-[#FAFBF6] border border-[#E0E5D7] p-5 text-center">
        <p className="text-sm text-[#4F6355]">Please sign in to submit a review.</p>
      </div>
    )
  }

  if (!canReview) {
    return (
      <div className="rounded-[18px] bg-[#FAFBF6] border border-[#E0E5D7] p-5 text-center">
        <p className="text-sm font-medium text-[#855000]">
          {disabledMessage || 'Purchase this item to leave a verified review.'}
        </p>
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
        comment,
      })
      setMessage('Review submitted successfully! Thank you for sharing your feedback.')
      setComment('')
      setRating(5)
      if (onSubmitted) onSubmitted()
    } catch (err) {
      setMessage(err.message || 'Failed to submit review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-[20px] bg-white border border-[#E0E5D7] p-5 sm:p-6">
      <h4
        className="text-[18px] font-bold text-[#142D1E] mb-3"
        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
      >
        Write a Review
      </h4>
      {message && (
        <div
          className={`p-3 rounded-xl mb-4 text-sm ${
            message.includes('success')
              ? 'bg-[#E5F2DE] text-[#195A36]'
              : 'bg-[#FEF2F2] text-[#BA1A1A]'
          }`}
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#586A5F] mb-1.5 block">
            Your Rating
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setRating(i)}
                className="p-1 cursor-pointer hover:scale-110 transition-transform"
              >
                <Star
                  className="w-5 h-5"
                  fill={i <= rating ? '#E0A326' : '#E3E7DE'}
                  stroke="none"
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#586A5F] mb-1.5 block">
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
            className="w-full bg-[#FAFBF6] border border-[#DCE2D4] rounded-[14px] px-4 py-3 text-sm text-[#14261B] focus:border-[#0B462B] outline-none resize-none"
            placeholder="Tell us about freshness, flavor, and delivery..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full px-6 py-2.5 bg-[#0B462B] text-white font-semibold text-sm hover:bg-[#083821] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}

function RelatedProducts({ related }) {
  if (!related?.length) return null
  return (
    <section className="pt-10 sm:pt-12 mt-10 sm:mt-12 border-t border-[#E2E6DA]">
      <div className="flex justify-between items-baseline mb-5 sm:mb-6">
        <h2
          className="text-[22px] sm:text-[26px] font-bold text-[#142D1E]"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          Pairs Perfectly With
        </h2>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-[13px] sm:text-[13.5px] font-semibold text-[#0B462B] hover:underline"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {related.map((p) => (
          <ProductCard key={p.id} product={{ ...p, inStock: p.inStock ?? true }} />
        ))}
      </div>
    </section>
  )
}

function DynamicIcon({ name, className = '' }) {
  switch (String(name || '').toLowerCase()) {
    case 'truck':
      return <Truck className={className} />
    case 'shield':
      return <ShieldCheck className={className} />
    case 'sprout':
      return <Sprout className={className} />
    case 'award':
      return <Award className={className} />
    case 'recycle':
      return <Recycle className={className} />
    case 'apple':
      return <Apple className={className} />
    case 'flame':
      return <Flame className={className} />
    case 'heart':
      return <Heart className={className} />
    case 'clock':
      return <Clock className={className} />
    default:
      return <Leaf className={className} />
  }
}

function inferNutritionIcon(label = '') {
  const k = String(label).toLowerCase()
  if (k.includes('calor') || k.includes('energy') || k.includes('kcal')) return 'flame'
  if (k.includes('carb') || k.includes('sugar')) return 'apple'
  if (k.includes('protein')) return 'sprout'
  if (k.includes('fat')) return 'heart'
  if (k.includes('vitamin') || k.includes('mineral')) return 'shield'
  return 'leaf'
}

function parseNutritionInfo(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .filter((r) => r && r.label && r.value)
      .map((r) => ({
        label: String(r.label),
        value: String(r.value),
        icon: r.icon || inferNutritionIcon(r.label),
      }))
  }
  const text = String(raw).trim()
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((r) => r && r.label && r.value)
          .map((r) => ({
            label: String(r.label),
            value: String(r.value),
            icon: r.icon || inferNutritionIcon(r.label),
          }))
      }
    } catch {
      // Fallback to line parsing
    }
  }
  const rows = []
  for (const line of text.split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const label = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (!label || !value) continue
    rows.push({ label, value, icon: inferNutritionIcon(label) })
  }
  return rows
}

export default function ProductDetailClient({ product: initialProduct, related }) {
  const { data: session } = useSafeSession()
  const { getAccess } = useAuth()

  const [product, setProduct] = useState(initialProduct)
  const refetchAttemptedRef = useRef(false)
  const localToken = session?.user?.accessToken || getAccess() || null

  useEffect(() => {
    if (localToken && !product.wholesalePrice && !refetchAttemptedRef.current) {
      refetchAttemptedRef.current = true
      import('@/lib/api_product').then(({ getProductBySlug }) => {
        getProductBySlug(initialProduct.slug, { token: localToken })
          .then((fetched) => {
            if (fetched) setProduct(fetched)
          })
          .catch(console.error)
      })
    }
  }, [initialProduct.slug, localToken, product.wholesalePrice])

  const {
    unitOptions,
    hasUnits,
    selectedUnitId,
    selectedUnit,
    handleUnitChange,
    retailPrice,
    wholesaleUnitPrice,
  } = useUnitSelector(product)

  const displayPrice = wholesaleUnitPrice ?? retailPrice
  const isWholesalePrice = !!wholesaleUnitPrice
  const baseRetailPrice = Number(product.price)

  const [added, setAdded] = useState(false)
  const [showStockError, setShowStockError] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Product Details')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewOffset, setReviewOffset] = useState(0)

  const { items, addItem } = useCart()
  const { isSaved, toggle } = useWishlist()
  const { isAuthenticated } = useAuth()
  const savedInWishlist = isSaved(product.id)

  const rawMinQty =
    product.wholesalePrice && product.minWholesaleQty
      ? Math.max(1, parseInt(product.minWholesaleQty, 10) || 1)
      : 1

  const isUnlimited = Boolean(
    product.is_unlimited_stock ||
      product.isUnlimitedStock ||
      product.is_unlimited_wholesale_stock ||
      product.is_unlimited_restaurant_stock
  )

  const getWholesaleOrRetailStock = (prod) => {
    if (prod.is_unlimited_stock || prod.isUnlimitedStock) return Infinity
    if (prod.wholesalePrice || prod.wholesale_price) {
      if (prod.is_unlimited_wholesale_stock || prod.is_unlimited_restaurant_stock) return Infinity
      if (prod.wholesale_stock !== undefined && prod.wholesale_stock !== null) {
        return Math.max(0, Number(prod.wholesale_stock))
      }
      if (prod.restaurant_stock !== undefined && prod.restaurant_stock !== null) {
        return Math.max(0, Number(prod.restaurant_stock))
      }
    }
    if (prod.stock !== undefined && prod.stock !== null) return Math.max(0, Number(prod.stock))
    return Infinity
  }

  const maxStock = isUnlimited ? Infinity : getWholesaleOrRetailStock(product)
  const effectiveInStock = isUnlimited || Boolean(product.inStock)
  const minAllowedQty = maxStock > 0 && maxStock < Infinity ? Math.max(1, Math.min(rawMinQty, maxStock)) : 1
  const initialQty = maxStock > 0 && maxStock < Infinity ? Math.min(rawMinQty, maxStock) : rawMinQty || 1

  const [qtyState, setQtyState] = useState({
    productId: product.id,
    base: initialQty,
    value: initialQty,
  })
  const qty =
    qtyState.productId === product.id && qtyState.base === initialQty
      ? qtyState.value
      : initialQty
  const setQty = (updater) =>
    setQtyState((prev) => {
      const current =
        prev.productId === product.id && prev.base === initialQty ? prev.value : initialQty
      const nextVal = typeof updater === 'function' ? updater(current) : updater
      return { productId: product.id, base: initialQty, value: nextVal }
    })

  const [activeImg, setActiveImg] = useState(0)
  const galleryRef = useRef(null)

  const cleanOrigin = product.origin?.replace(/^from\s+/i, '')
  const savePercent =
    product.oldPrice && Number(product.oldPrice) > baseRetailPrice
      ? Math.round((1 - baseRetailPrice / Number(product.oldPrice)) * 100)
      : null

  function handleAddToCart() {
    if (!effectiveInStock) return
    if (maxStock < Infinity) {
      const existingItem = items.find(
        (i) => i.id === product.id && (i.item_type || 'product') === (product.item_type || 'product')
      )
      const currentCartQty = existingItem ? existingItem.qty : 0
      if (currentCartQty + qty > maxStock) {
        setShowStockError(true)
        setTimeout(() => setShowStockError(false), 3500)
        return
      }
    }

    addItem({ ...product, unit: selectedUnit?.label || product.unit }, displayPrice, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleWishlistToggle() {
    if (!isAuthenticated) {
      toast.error('Please sign in to save items to your wishlist.')
      return
    }
    toggle(product)
  }

  function handleJumpToReview() {
    setActiveTab('Reviews')
    setShowReviewForm(true)
    const el = document.getElementById('reviews-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const PLACEHOLDER = '/homepage/prod_tomato.jpg'
  const rawImages = product.images?.length ? product.images : [product.image]
  const images = rawImages.filter(Boolean).length ? rawImages.filter(Boolean) : [PLACEHOLDER]
  const unitLabel = selectedUnit?.label || product.unit || ''

  const reviewsArray = Array.isArray(product.reviewsList)
    ? product.reviewsList
    : Array.isArray(product.reviews_list)
      ? product.reviews_list
      : Array.isArray(product.reviews)
        ? product.reviews
        : []

  const reviewCount =
    typeof product.reviews === 'number'
      ? product.reviews
      : product.reviewCount ?? product.review_count ?? reviewsArray.length ?? 0

  const ratingNum = Number(product.rating || 0)
  const ratingScore = ratingNum.toFixed(1)

  const defaults = product.detailDefaults || product.detail_defaults || {}
  const specList = Array.isArray(product.specifications) ? product.specifications : []
  const nutritionRows = parseNutritionInfo(product.nutritionalInfo || product.nutritional_info)
  const nutritionServingSize =
    product.nutritionServingSize || product.nutrition_serving_size || 'per 100g'

  const highlights =
    Array.isArray(product.highlights) && product.highlights.length > 0
      ? product.highlights
      : Array.isArray(defaults.default_highlights)
        ? defaults.default_highlights
        : []

  const trustBadges =
    Array.isArray(product.trustBadges) && product.trustBadges.length > 0
      ? product.trustBadges
      : Array.isArray(defaults.default_trust_badges)
        ? defaults.default_trust_badges
        : []

  const promoCard = {
    title:
      product.promoCardTitle ||
      defaults.promo_card_title ||
      'From Our Farms to Your Table',
    image:
      product.promoCardImage ||
      defaults.promo_card_image_url ||
      '/ui/farm-hands-tomatoes.jpg',
  }

  const shippingInfo = {
    title:
      product.shippingInfoTitle ||
      defaults.shipping_info_title ||
      'Farm-to-Doorstep Delivery',
    body:
      product.shippingInfo ||
      defaults.shipping_info ||
      'Orders are hand-packed each morning in breathable eco-friendly crates and delivered chilled within your chosen time window. Same-day or next-day delivery slots are selectable directly at checkout.',
  }

  const returnPolicy = {
    title:
      product.returnPolicyTitle ||
      defaults.return_policy_title ||
      '100% Freshness Guarantee',
    body:
      product.returnPolicy ||
      defaults.return_policy ||
      'If any produce does not arrive in crisp, farm-fresh condition, reach out within 24 hours of delivery with a photo and we will promptly replace or refund the affected items.',
  }

  const farmStory = {
    eyebrow:
      product.farmStoryEyebrow ||
      defaults.farm_story_eyebrow ||
      'OUR FARM STORY',
    title:
      product.farmStoryTitle ||
      defaults.farm_story_title ||
      'Growing Goodness Together',
    description:
      product.farmStoryDescription ||
      defaults.farm_story_description ||
      'At El Árbol, we work hand in hand with local farmers to bring you the freshest produce while supporting sustainable farming practices.',
    ctaText:
      product.farmStoryCtaText ||
      defaults.farm_story_cta_text ||
      'Learn More',
    ctaUrl:
      product.farmStoryCtaUrl ||
      defaults.farm_story_cta_url ||
      '/about',
    image:
      product.farmStoryImage ||
      defaults.farm_story_image_url ||
      '/ui/farmer-crate-portrait.jpg',
    stats:
      Array.isArray(product.farmStoryStats) && product.farmStoryStats.length > 0
        ? product.farmStoryStats
        : Array.isArray(defaults.farm_story_stats)
          ? defaults.farm_story_stats
          : [],
  }

  const tabs = [
    { id: 'Product Details', label: 'Product Details', Icon: FileText },
    { id: 'Nutrition Info', label: 'Nutrition Info', Icon: Apple },
    { id: 'Reviews', label: `Reviews (${reviewCount})`, Icon: Star },
    { id: 'Shipping Info', label: 'Shipping Info', Icon: Truck },
    { id: 'Return Policy', label: 'Return Policy', Icon: RefreshCw },
  ]

  const displayedReviews = reviewsArray
  const maxOffset = Math.max(0, displayedReviews.length - 3)
  const visibleReviews = displayedReviews.slice(reviewOffset, reviewOffset + 3)

  const handleReviewSubmitted = async () => {
    try {
      const { getProductBySlug } = await import('@/lib/api_product')
      const updated = await getProductBySlug(product.slug, {
        token: localToken,
        noStore: true,
      })
      if (updated) {
        setProduct(updated)
        setReviewOffset(0)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="overflow-x-clip" style={{ background: '#F6F6EC', minHeight: '100vh', width: '100%' }}>
      {/* Insufficient stock toast */}
      {showStockError && (
        <div
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[min(380px,calc(100vw-32px))] bg-[#14261B] border border-[#2C4B38] text-white rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Insufficient Stock</p>
            <p className="text-xs text-white/75 mt-0.5">
              Sorry, we only have <strong>{maxStock} {product.unit || 'units'}</strong> in stock.
            </p>
          </div>
          <button onClick={() => setShowStockError(false)} className="text-white/50 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox Image Zoom Modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#DCE2D4]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeImg] || images[0]}
              alt={product.name}
              fill
              sizes="100vw"
              className="object-contain bg-[#F7F6F0]"
            />
            <button
              onClick={() => setZoomOpen(false)}
              aria-label="Close zoom"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 rounded-full bg-white border border-[#DCE2D4] text-[#14261B] flex items-center justify-center hover:bg-[#EDF2E5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .ck-content ul, .ck-content ol { padding-left: 1.25rem; margin: 0; }
        .ck-content ul { list-style: disc; }
        .ck-content ol { list-style: decimal; }
        .ck-content li { font-size: 14px; color: #3D4943; line-height: 1.65; margin-bottom: 4px; }
        .ck-content p  { margin: 0 0 .5rem; }
        .ck-content strong { font-weight: 700; }
        .ck-content a  { color: #0B462B; text-decoration: underline; }
        @keyframes pdTabFadeSlide {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .pd-tab-panel {
          animation: pdTabFadeSlide 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .pd-tab-panel {
            animation: none;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-24 lg:pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[12.5px] sm:text-[13px] text-[#5B6B60] flex-wrap">
          <Link href="/" className="hover:text-[#0B462B] inline-flex items-center">
            <Home className="w-3.5 h-3.5" />
          </Link>
          <span>›</span>
          <Link href="/shop" className="hover:text-[#0B462B] transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <span>›</span>
              <span className="hover:text-[#0B462B]">{product.category}</span>
            </>
          )}
          <span>›</span>
          <span className="font-semibold text-[#14261B] truncate max-w-[160px] sm:max-w-[260px]">{product.name}</span>
        </nav>

        {/* Top 2-Column Product Stage */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
          {/* LEFT: Rounded Gallery + Thumbnail Strip */}
          <div className="lg:col-span-7 space-y-2.5 sm:space-y-3">
            <div className="rounded-[18px] sm:rounded-[22px] bg-white p-1.5 sm:p-2 border border-[#E4E8DC]">
              <div
                ref={galleryRef}
                className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-[13px] sm:rounded-[16px] overflow-hidden bg-[#F7F6F0]"
              >
                <Image
                  src={images[activeImg] || images[0]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 660px"
                  className="object-cover transition-opacity duration-200"
                />

                {/* Top-Left Quality Pill */}
                <span className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#194E2B]/95 text-white text-[11.5px] sm:text-[12px] font-semibold">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>{product.badge || 'Premium Quality'}</span>
                </span>

                {/* Top-Right Zoom Button */}
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  aria-label="Zoom product photo"
                  className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-[#DCE2D4] flex items-center justify-center text-[#143521] hover:scale-105 transition-transform duration-150 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Prev / Next Overlay Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                      aria-label="Previous photo"
                      className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-[#DCE2D4] flex items-center justify-center text-[#143521] hover:bg-white cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                      aria-label="Next photo"
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-[#DCE2D4] flex items-center justify-center text-[#143521] hover:bg-white cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                {images.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`relative aspect-[4/3] rounded-[9px] sm:rounded-[12px] overflow-hidden bg-white border-2 transition-[border-color,opacity] duration-150 cursor-pointer ${
                      i === activeImg
                        ? 'border-[#0B462B] opacity-100'
                        : 'border-[#E0E5D7] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} view ${i + 1}`}
                      fill
                      sizes="130px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Status, Headline, Rating, Price, Qty, Add to Cart + Trust Strip */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold"
                style={{
                  background: effectiveInStock ? '#E5F2DE' : '#FDECEC',
                  color: effectiveInStock ? '#195A36' : '#9B1C1C',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: effectiveInStock ? '#2E8555' : '#DC2626' }}
                />
                {effectiveInStock ? 'In Stock' : 'Out of Stock'}
              </span>

              {product.variant && (
                <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#EAEFE1] text-[#1D4830]">
                  {formatClassLabel(product.variant)}
                </span>
              )}
            </div>

            <h1
              className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-tight leading-[1.1] text-[#132B1B] mt-3"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              {product.name}
            </h1>

            {/* Rating + Write a Review Link */}
            <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
              <div className="flex items-center gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4"
                    fill={star <= Math.round(Number(ratingScore)) ? '#E0A326' : '#E3E7DE'}
                    stroke="none"
                  />
                ))}
              </div>
              <span className="text-[13px] font-semibold text-[#1E3326]">
                {ratingScore} ({reviewCount.toLocaleString()} reviews)
              </span>
              <button
                type="button"
                onClick={handleJumpToReview}
                className="text-[13px] font-semibold text-[#1D5C38] hover:underline cursor-pointer"
              >
                Write a Review ›
              </button>
            </div>

            {/* Short Description / Provenance */}
            <div className="mt-3 sm:mt-3.5 text-[14px] sm:text-[14.5px] leading-relaxed text-[#435648]">
              {product.shortDesc ? (
                <RichContent html={product.shortDesc} />
              ) : (
                <p>
                  {cleanOrigin
                    ? `Fresh from ${cleanOrigin}. Known for intense flavor, rich color, and exceptional farm-to-table quality.`
                    : 'Freshly harvested from our local partner farms, hand-selected for rich natural flavor and peak quality.'}
                </p>
              )}
            </div>

            {/* Variant / Quality Selector (Desktop & Mobile unified) */}
            {product.variants && product.variants.length > 1 && (
              <div className="mt-4 p-3 rounded-[16px] bg-[#FAFBF6] border border-[#DFE4D7]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B5141]">
                    Available Qualities / Variants
                  </span>
                  {product.variant && (
                    <span className="text-xs text-[#586A5F]">
                      Selected: <strong className="text-[#0B462B]">{formatClassLabel(product.variant)}</strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected =
                      v.id === product.id || v.slug === product.slug || v.variant === product.variant
                    const vPrice = isWholesalePrice ? v.wholesale_price || v.price : v.price
                    return (
                      <Link
                        key={v.id}
                        href={`/products/${v.slug}`}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-[#0B462B] text-white border-[#0B462B]'
                            : 'bg-white text-[#14261B] border-[#DCE2D4] hover:border-[#0B462B]'
                        }`}
                      >
                        <span>{formatClassLabel(v.variant || 'Standard')}</span>
                        <span className={isSelected ? 'text-[#C5DEA9]' : 'text-[#586A5F]'}>
                          €{Number(vPrice || 0).toFixed(2)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price & Discount Pill */}
            <div className="mt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-[30px] sm:text-[36px] font-bold leading-none"
                  style={{
                    fontFamily: 'var(--font-newsreader), Georgia, serif',
                    color: isWholesalePrice ? '#6D28D9' : '#0E4D2D',
                  }}
                >
                  €{displayPrice.toFixed(2)}
                  {unitLabel && (
                    <span className="text-[15px] sm:text-[16px] font-normal text-[#586A5F] ml-1">
                      / {unitLabel}
                    </span>
                  )}
                </span>

                {isWholesalePrice && (
                  <span className="text-[17px] sm:text-[18px] text-[#98A49B] line-through">
                    €{retailPrice.toFixed(2)}
                  </span>
                )}
                {!isWholesalePrice && product.oldPrice && (
                  <span className="text-[17px] sm:text-[18px] text-[#98A49B] line-through">
                    €{Number(product.oldPrice).toFixed(2)}
                  </span>
                )}
                {!isWholesalePrice && savePercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#DCEFD3] text-[#1A5D38]">
                    Save {savePercent}%
                  </span>
                )}
              </div>

              {isWholesalePrice && (
                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-[#F3EFFE] text-[#6D28D9] text-[11px] font-bold">
                  WHOLESALE · Min. {product.minWholesaleQty} {product.wholesaleUnit || 'units'}
                </span>
              )}
            </div>

            {/* Quantity & Optional Unit Selector Row */}
            <div className="mt-4 flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-[13.5px] font-semibold text-[#182B1E]">Quantity:</span>
                <div className="inline-flex items-center rounded-full bg-white border border-[#DCE2D4] px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(minAllowedQty, q - 1))}
                    disabled={qty <= minAllowedQty}
                    aria-label="Decrease quantity"
                    className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      qty <= minAllowedQty
                        ? 'text-[#B2BCB5] cursor-not-allowed'
                        : 'cursor-pointer text-[#1F3A2A] hover:bg-[#ECF2E4]'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-bold text-[15px] text-[#14261B]">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => (maxStock < Infinity ? Math.min(maxStock, q + 1) : q + 1))}
                    disabled={maxStock < Infinity && qty >= maxStock}
                    aria-label="Increase quantity"
                    className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      maxStock < Infinity && qty >= maxStock
                        ? 'text-[#B2BCB5] cursor-not-allowed'
                        : 'cursor-pointer text-[#1F3A2A] hover:bg-[#ECF2E4]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {hasUnits && (
                <UnitSelector
                  unitOptions={unitOptions}
                  hasUnits={hasUnits}
                  selectedUnitId={selectedUnitId}
                  onChange={handleUnitChange}
                  fallbackUnit={product.unit}
                />
              )}
            </div>

            {/* Add to Cart + Heart Wishlist Buttons */}
            <div className="mt-5 flex items-center gap-3">
              {effectiveInStock ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 h-[48px] sm:h-[50px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.985] cursor-pointer"
                  style={{
                    background: added
                      ? '#195E38'
                      : 'linear-gradient(135deg, #0B462B 0%, #155B3A 100%)',
                  }}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 h-[48px] sm:h-[50px] rounded-full bg-[#E5E8DF] text-[#7A887E] font-semibold text-[15px] cursor-not-allowed"
                >
                  Out of Stock
                </button>
              )}

              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label={savedInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] rounded-full bg-white border border-[#CFD8CA] hover:border-[#0B462B] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <Heart
                  className="w-5 h-5"
                  color={savedInWishlist ? '#B91C1C' : '#1E3A2A'}
                  fill={savedInWishlist ? '#DC2626' : 'none'}
                />
              </button>
            </div>

            {/* Dynamic Responsive Trust Strip */}
            {trustBadges.length > 0 && (
              <div
                className={`mt-4 rounded-[16px] bg-[#EAEFE1] border border-[#DCE4D2] px-3 py-2.5 sm:py-3 grid divide-y sm:divide-y-0 sm:divide-x divide-[#D3DDD0] ${
                  trustBadges.length === 1
                    ? 'grid-cols-1'
                    : trustBadges.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {trustBadges.slice(0, 3).map((badge, idx) => (
                  <div key={idx} className="flex items-center justify-start sm:justify-center gap-2 px-2 py-2 sm:py-0.5">
                    <DynamicIcon name={badge?.icon} className="w-4 h-4 text-[#1B5C39] shrink-0" />
                    <span className="text-[11.5px] sm:text-[11px] font-medium leading-tight text-[#213B2B] text-left">
                      {badge?.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Segmented Tab Pill Bar */}
        <div
          role="tablist"
          aria-label="Product information tabs"
          className="mt-8 sm:mt-10 flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
        >
          {tabs.map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveTab(id)}
                className="shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-[10px] text-[12.5px] sm:text-[13px] font-semibold transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.97] cursor-pointer"
                style={{
                  background: active ? '#285234' : '#EAEFE1',
                  color: active ? '#FFFFFF' : '#243C2C',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Animated Tab Panel Wrapper */}
        <div key={activeTab} role="tabpanel" className="mt-4 sm:mt-5 pd-tab-panel">
          {activeTab === 'Shipping Info' ? (
            <div className="rounded-[20px] bg-white border border-[#E2E6DA] p-5 sm:p-7">
              <h3
                className="text-[20px] sm:text-[22px] font-bold text-[#142D1E] mb-3"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                {shippingInfo.title}
              </h3>
              <p className="text-[14px] sm:text-[14.5px] text-[#435648] leading-relaxed max-w-2xl whitespace-pre-line">
                {shippingInfo.body}
              </p>
            </div>
          ) : activeTab === 'Return Policy' ? (
            <div className="rounded-[20px] bg-white border border-[#E2E6DA] p-5 sm:p-7">
              <h3
                className="text-[20px] sm:text-[22px] font-bold text-[#142D1E] mb-3"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                {returnPolicy.title}
              </h3>
              <p className="text-[14px] sm:text-[14.5px] text-[#435648] leading-relaxed max-w-2xl whitespace-pre-line">
                {returnPolicy.body}
              </p>
            </div>
          ) : activeTab === 'Nutrition Info' ? (
            <div className="rounded-[20px] bg-[#EAF0E1] border border-[#DBE4D0] p-5 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h3
                  className="text-[20px] sm:text-[22px] font-bold text-[#142D1E]"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  Nutritional Information
                </h3>
                <span className="px-3 py-1 rounded-full bg-white/85 border border-[#D4DEC9] text-[12px] font-semibold text-[#3B5141]">
                  {nutritionServingSize}
                </span>
              </div>
              {nutritionRows.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nutritionRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="rounded-[14px] bg-white/90 border border-[#D7E1CC] px-4 py-3 flex items-center justify-between text-[13.5px]"
                    >
                      <div className="flex items-center gap-2.5 text-[#26412F] font-medium">
                        <DynamicIcon name={row.icon} className="w-4 h-4 text-[#3B713E] shrink-0" />
                        <span>{row.label}</span>
                      </div>
                      <span className="font-bold text-[#14261B]">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-[#556A5D]">
                  Nutritional information has not been specified for this product yet.
                </p>
              )}
            </div>
          ) : activeTab === 'Reviews' ? (
            <div className="rounded-[20px] bg-white border border-[#E2E6DA] p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EDF1E6]">
                <div className="flex items-center gap-4">
                  <span
                    className="text-[36px] sm:text-[42px] font-bold leading-none text-[#142D1E]"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    {ratingScore}
                  </span>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4"
                          fill={star <= Math.round(ratingNum) ? '#E0A326' : '#E3E7DE'}
                          stroke="none"
                        />
                      ))}
                    </div>
                    <p className="text-[12.5px] font-medium text-[#55685C] mt-1">
                      Based on {reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(true)
                      const el = document.getElementById('reviews-section')
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="px-4 py-2 rounded-full text-[12.5px] font-semibold bg-[#194E2B] hover:bg-[#10381D] text-white transition-colors cursor-pointer"
                  >
                    Write a Review
                  </button>
                  {displayedReviews.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('reviews-section')
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="px-4 py-2 rounded-full text-[12.5px] font-semibold bg-[#EAEFE1] border border-[#D4DFC9] text-[#18482B] hover:bg-[#DFEAD3] transition-colors cursor-pointer"
                    >
                      View All Reviews
                    </button>
                  )}
                </div>
              </div>

              {displayedReviews.length > 0 ? (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayedReviews.slice(0, 3).map((rev, idx) => {
                    const authorName =
                      rev.user
                        ? `${rev.user.first_name || ''} ${rev.user.last_name || ''}`.trim()
                        : rev.author || rev.user_name || 'Verified Customer'
                    const initial = (authorName?.[0] || 'C').toUpperCase()
                    const stars = Math.max(1, Math.min(5, Number(rev.rating || 5)))
                    return (
                      <div
                        key={rev.id || idx}
                        className="rounded-[16px] bg-[#FAFBF6] border border-[#E4E8DC] p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-full bg-[#DCEFD3] text-[#0B462B] font-bold text-xs flex items-center justify-center shrink-0">
                              {initial}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-[#14261B] leading-tight">
                                {authorName}
                              </p>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className="w-3 h-3"
                                    fill={s <= stars ? '#E0A326' : '#E3E7DE'}
                                    stroke="none"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-[12.5px] text-[#435648] leading-relaxed">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-4 text-[13.5px] text-[#55685C]">
                  No customer reviews yet for {product.name}. Be the first to leave feedback!
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* Bento Card 1: About This Product */}
              <section className="md:col-span-2 lg:col-span-5 rounded-[20px] bg-white border border-[#E4E8DC] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                  <h2
                    className="text-[20px] sm:text-[22px] font-bold text-[#142D1E] mb-2.5"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    About This Product
                  </h2>
                  <div className="text-[13.5px] text-[#435648] leading-relaxed mb-4">
                    {product.longDesc || product.description ? (
                      <RichContent html={product.longDesc || product.description} />
                    ) : (
                      <p>
                        {product.name} is cultivated with care on our local partner farms, hand-picked at peak ripeness for sweet flavor, firm texture, and vibrant color.
                      </p>
                    )}
                  </div>

                  {highlights.length > 0 && (
                    <ul className="space-y-2">
                      {highlights.slice(0, 5).map((h, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-[13.5px] font-medium text-[#1C3826]">
                          <span className="w-5 h-5 rounded-full bg-[#4F8336] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                          <span>{typeof h === 'string' ? h : h.label || h.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {specList.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#EDF1E6] flex flex-wrap gap-2">
                      {specList.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F7EE] border border-[#DCE4D2] text-[11.5px] text-[#26412F]"
                        >
                          <strong className="font-semibold">{s.name || s.key || s.label}:</strong>
                          <span>{s.value || s.val}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <SubtleLeafWatermark className="absolute -bottom-3 -right-3 w-36 h-28 opacity-90" />
              </section>

              {/* Bento Card 2: Nutritional Information */}
              <section className="md:col-span-1 lg:col-span-4 rounded-[20px] bg-[#EAF0E1] border border-[#DBE4D0] p-5 sm:p-6">
                <h2
                  className="text-[19px] sm:text-[20px] font-bold text-[#142D1E] leading-tight"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  Nutritional Information
                </h2>
                <p className="text-[12.5px] text-[#556A5D] mt-0.5 mb-3">({nutritionServingSize})</p>

                {nutritionRows.length > 0 ? (
                  <div className="divide-y divide-[#D7E1CC]">
                    {nutritionRows.map((row, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-[13px]">
                        <div className="flex items-center gap-2 text-[#26412F] font-medium">
                          <DynamicIcon name={row.icon} className="w-3.5 h-3.5 text-[#3B713E]" />
                          <span>{row.label}</span>
                        </div>
                        <span className="font-bold text-[#14261B]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#556A5D] py-4">
                    Nutritional details have not been added for this product yet.
                  </p>
                )}
              </section>

              {/* Bento Card 3: Promo Feature Photo */}
              <section className="md:col-span-1 lg:col-span-3 rounded-[20px] overflow-hidden relative min-h-[200px] sm:min-h-[220px] border border-[#DCE4D2]">
                <Image
                  src={promoCard.image}
                  alt={promoCard.title}
                  fill
                  sizes="(max-width:768px) 100vw, 320px"
                  unoptimized={promoCard.image.startsWith('http')}
                  className="object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(16,32,20,0.05) 35%, rgba(16,32,20,0.78) 100%)',
                  }}
                />
                <div className="relative z-10 h-full flex flex-col justify-end items-center text-center p-5">
                  <p
                    className="text-[19px] font-bold leading-snug text-white max-w-[200px] whitespace-pre-line"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    {promoCard.title}
                  </p>
                  <span className="w-8 h-[2px] bg-white/75 rounded-full mt-2.5" />
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Full-Width "OUR FARM STORY — Growing Goodness Together" Card */}
        <section className="mt-6 rounded-[20px] sm:rounded-[22px] bg-[#E8EFE0] border border-[#DAE3CE] p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center">
            <div className="md:col-span-5 lg:col-span-4">
              <div className="relative aspect-[16/10] lg:aspect-[16/9] w-full rounded-[14px] sm:rounded-[16px] overflow-hidden border border-[#D4DEC9]">
                <Image
                  src={farmStory.image}
                  alt={farmStory.title}
                  fill
                  sizes="(max-width:768px) 100vw, 380px"
                  unoptimized={farmStory.image.startsWith('http')}
                  className="object-cover"
                />
              </div>
            </div>

            <div className="md:col-span-7 lg:col-span-4 space-y-2">
              {farmStory.eyebrow && (
                <span className="text-[10.5px] font-bold tracking-[0.18em] text-[#4C6854] uppercase block">
                  {farmStory.eyebrow}
                </span>
              )}
              <h2
                className="text-[21px] sm:text-[24px] font-bold text-[#142D1E] leading-tight"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                {farmStory.title}
              </h2>
              <p className="text-[13px] text-[#3F5244] leading-relaxed whitespace-pre-line">
                {farmStory.description}
              </p>
              {farmStory.ctaText && (
                <Link
                  href={farmStory.ctaUrl || '/about'}
                  className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#194E2B] hover:bg-[#10381D] text-white text-[12px] font-semibold transition-colors"
                >
                  <span>{farmStory.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {farmStory.stats.length > 0 && (
              <div
                className={`md:col-span-12 lg:col-span-4 grid gap-3 sm:gap-2 text-center py-2 border-t lg:border-t-0 border-[#DAE3CE] pt-4 lg:pt-2 ${
                  farmStory.stats.length === 1
                    ? 'grid-cols-1'
                    : farmStory.stats.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-1 min-[380px]:grid-cols-3'
                }`}
              >
                {farmStory.stats.slice(0, 3).map((st, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <DynamicIcon name={st?.icon || 'sprout'} className="w-5 h-5 sm:w-6 sm:h-6 text-[#3E703D] mb-0.5" />
                    <span
                      className="text-[20px] sm:text-[24px] font-bold text-[#142D1E] leading-none"
                      style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                      {st?.value}
                    </span>
                    <span className="text-[11px] font-medium text-[#465A4C]">{st?.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section id="reviews-section" className="mt-9 sm:mt-10 pt-2">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
            <div>
              <h2
                className="text-[22px] sm:text-[26px] font-bold text-[#142D1E]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                What Our Customers Say
              </h2>
              <p className="text-[13px] sm:text-[13.5px] text-[#566B5F]">Real stories. Real satisfaction.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReviewForm((s) => !s)}
                className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold bg-[#EAEFE1] border border-[#D4DFC9] text-[#18482B] hover:bg-[#DFEAD3] transition-colors cursor-pointer mr-1"
              >
                {showReviewForm ? 'Close Form' : 'Write a Review'}
              </button>

              <button
                type="button"
                onClick={() => setReviewOffset((o) => Math.max(0, o - 1))}
                disabled={reviewOffset === 0}
                aria-label="Previous reviews"
                className="w-9 h-9 rounded-full bg-white border border-[#DCE3D4] flex items-center justify-center text-[#1B422B] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setReviewOffset((o) => Math.min(maxOffset, o + 1))}
                disabled={reviewOffset >= maxOffset}
                aria-label="Next reviews"
                className="w-9 h-9 rounded-full bg-white border border-[#DCE3D4] flex items-center justify-center text-[#1B422B] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Score Summary */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span
                  className="text-[36px] sm:text-[40px] font-bold leading-none text-[#142D1E]"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  {ratingScore}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4"
                      fill={star <= Math.round(ratingNum) ? '#E0A326' : '#E3E7DE'}
                      stroke="none"
                    />
                  ))}
                </div>
              </div>
              <p className="text-[13px] font-medium text-[#55685C] mt-1.5">
                Based on {reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Review Cards / Empty State */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleReviews.length > 0 ? (
                visibleReviews.map((rev, idx) => {
                  const authorName =
                    rev.user
                      ? `${rev.user.first_name || ''} ${rev.user.last_name || ''}`.trim()
                      : rev.author || rev.user_name || 'Verified Customer'
                  const initial = (authorName?.[0] || 'C').toUpperCase()
                  const stars = Math.max(1, Math.min(5, Number(rev.rating || 5)))

                  return (
                    <div
                      key={rev.id || idx}
                      className="rounded-[18px] bg-white border border-[#E4E8DC] p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#DCEFD3] text-[#0B462B] font-bold text-sm flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-[#14261B] leading-tight">
                              {authorName}
                            </p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className="w-3 h-3"
                                  fill={s <= stars ? '#E0A326' : '#E3E7DE'}
                                  stroke="none"
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-[12.5px] text-[#435648] leading-relaxed">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="md:col-span-3 rounded-[18px] bg-white border border-[#E4E8DC] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[15px] font-bold text-[#142D1E]">No customer reviews yet</p>
                    <p className="text-[13px] text-[#55685C] mt-0.5">
                      Have you ordered {product.name}? Share your honest feedback with our community.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="self-start sm:self-center shrink-0 px-4 py-2 rounded-full bg-[#194E2B] hover:bg-[#10381D] text-white text-[12.5px] font-semibold transition-colors cursor-pointer"
                  >
                    Be the First to Review
                  </button>
                </div>
              )}
            </div>
          </div>

          {showReviewForm && (
            <div className="mt-6">
              <ReviewForm
                product={product}
                session={session}
                localToken={localToken}
                onSubmitted={handleReviewSubmitted}
              />
            </div>
          )}
        </section>

        {/* Pairs Perfectly With (Related Products) */}
        <RelatedProducts related={related} />
      </div>

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-40 px-4 py-3 bg-[#FAFBF6] border-t border-[#DCE4D2]">
        <div className="flex items-center justify-between gap-3 sm:gap-4 max-w-md mx-auto">
          <div className="flex flex-col min-w-[72px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#586A5F]">Total</span>
            <span
              className="text-[22px] leading-none font-bold text-[#0E4228]"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              €{(displayPrice * qty).toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!effectiveInStock}
            className="flex-1 h-[48px] flex items-center justify-center gap-2 rounded-full font-semibold text-white text-[14.5px] cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            style={
              effectiveInStock
                ? { background: added ? '#195E38' : 'linear-gradient(135deg, #0B462B 0%, #155B3A 100%)' }
                : {}
            }
          >
            {effectiveInStock ? (
              added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )
            ) : (
              <span>Out of Stock</span>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
