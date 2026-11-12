'use client'
// src/app/components/ProductCard.jsx
import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Heart, ShoppingCart } from 'lucide-react'
import { slugify } from '@/app/lib/slugify'
import { useWishlist } from '@/app/context/WishlistContext'
import { useAuth } from '@/app/context/AuthContext'
import { useCart } from '@/app/context/CartContext'

const STUDIO_FALLBACK_IMAGES = [
  '/homepage/prod_apple.jpg',
  '/homepage/prod_mango.jpg',
  '/homepage/prod_grapes.jpg',
  '/homepage/prod_orange.jpg',
  '/homepage/prod_strawberry.jpg',
]

function pickFallbackImage(product, index) {
  const name = (product?.displayName || product?.name || '').toLowerCase()
  if (name.includes('apple')) return '/homepage/prod_apple.jpg'
  if (name.includes('mango')) return '/homepage/prod_mango.jpg'
  if (name.includes('grape')) return '/homepage/prod_grapes.jpg'
  if (name.includes('orange') || name.includes('citrus')) return '/homepage/prod_orange.jpg'
  if (name.includes('strawberr') || name.includes('berry')) return '/homepage/prod_strawberry.jpg'
  if (typeof index === 'number' && index >= 0) {
    return STUDIO_FALLBACK_IMAGES[index % STUDIO_FALLBACK_IMAGES.length]
  }
  const idStr = String(product?.id || name || '0')
  let hash = 0
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0
  }
  return STUDIO_FALLBACK_IMAGES[hash % STUDIO_FALLBACK_IMAGES.length]
}

const SHOWCASE_BADGES = [
  { label: 'Class A', bg: '#E3F1E5', color: '#28633A' },
  { label: 'Premium', bg: '#F3ECD2', color: '#7D631D' },
  { label: 'Class B', bg: '#E9F1DA', color: '#3B6A24' },
  { label: 'Class B', bg: '#E9F1DA', color: '#3B6A24' },
  { label: 'Premium', bg: '#F3ECD2', color: '#7D631D' },
]

function resolveTagStyle(label) {
  const lower = (label || '').toLowerCase()
  if (lower.includes('premium') || lower.includes('organic')) {
    return { bg: '#F4EDD4', color: '#785E18' }
  }
  if (lower.includes('b')) {
    return { bg: '#EBF2DC', color: '#3B6A24' }
  }
  return { bg: '#E4F2E7', color: '#245F38' }
}

// ── Floating Wishlist Button ───────────────────────────────────────────────────
function WishlistButton({ product }) {
  const { isAuthenticated } = useAuth()
  const { isSaved, toggle } = useWishlist()
  const [localSaved, setLocalSaved] = useState(false)
  const [animating, setAnimating] = useState(false)

  const saved = isAuthenticated ? isSaved(product.id) : localSaved

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    if (isAuthenticated) {
      toggle(product)
    } else {
      setLocalSaved((prev) => !prev)
    }
    setTimeout(() => setAnimating(false), 260)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={saved ? 'Remove from saved' : 'Save for later'}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`absolute top-2.5 right-2.5 z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center border cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 ${
        saved
          ? 'bg-[#FFF4F4] border-[#F4C7C7] text-[#E04444]'
          : 'bg-white/95 border-[#DCE8DF] text-[#45685A] hover:border-[#9EC4AA] hover:text-[#085041]'
      } ${animating ? 'scale-125' : 'scale-100'}`}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <Heart
        className="w-[14px] h-[14px] transition-colors duration-200"
        strokeWidth={1.9}
        fill={saved ? '#E04444' : 'none'}
      />
    </button>
  )
}

// ── Main ProductCard ──────────────────────────────────────────────────────────
export default function ProductCard({
  product,
  index,
  notified,
  onNotify,
  variant = 'default',
  layout = 'grid',
  showCartIcon = false,
}) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [added, setAdded] = useState(false)
  const { items, addItem } = useCart()

  const isShowcase = variant === 'showcase'
  const slug = product.slug || slugify(product.name || product.displayName || 'product')
  const {
    name,
    displayName,
    badge,
    variant: productVariant,
    unit,
    price,
    displayPrice: customDisplayPrice,
    oldPrice,
    wholesalePrice,
    minWholesaleQty = 1,
    inStock = true,
    image,
    shortDesc,
    description,
  } = product

  const shownTitle = displayName || name
  const fallbackImg = useMemo(() => pickFallbackImage(product, index), [product, index])
  const isPlaceholder =
    !image ||
    image.includes('placehold.co') ||
    /\/media\/products\/thumbnails\/(test\.jpg|product_\d+\.png)$/i.test(image)
  const resolvedImage = imgError || isPlaceholder ? fallbackImg : image

  const isUnlimited = Boolean(
    product.is_unlimited_stock ||
      product.isUnlimitedStock ||
      product.is_unlimited_wholesale_stock ||
      product.is_unlimited_restaurant_stock
  )
  const effectiveInStock = isUnlimited || inStock !== false

  const rawPrice = customDisplayPrice != null ? customDisplayPrice : price
  const displayPrice = Number(wholesalePrice ? wholesalePrice : rawPrice || 2.5)
  const isWholesalePrice = !!wholesalePrice
  const unitLabel = unit ? unit.replace(/^\/\s*/, '') : 'kg'

  const idx = typeof index === 'number' && index >= 0 ? index : 0
  const tagLabel =
    badge || productVariant || (isShowcase ? SHOWCASE_BADGES[idx % SHOWCASE_BADGES.length].label : 'Fresh')
  const tagStyle = resolveTagStyle(tagLabel)

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!effectiveInStock) {
      onNotify?.()
      return
    }

    const existingItem = items.find(
      (i) => i.id === product.id && (i.item_type || 'product') === (product.item_type || 'product')
    )
    const currentCartQty = existingItem ? existingItem.qty : 0
    let finalQty = 1
    if (isWholesalePrice && currentCartQty === 0 && minWholesaleQty > 1) {
      finalQty = minWholesaleQty
    }

    addItem({ ...product, name: shownTitle, image: resolvedImage }, displayPrice, finalQty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  // ── Horizontal List Variant (Unified Double-Arch Botanical Styling) ─────────
  if (layout === 'list') {
    return (
      <Link
        href={'/products/' + slug}
        className="block group w-full min-w-0 no-underline"
        onClick={() => setIsNavigating(true)}
      >
        <div
          className={`isolate flex flex-col sm:flex-row gap-4 rounded-t-[28px] rounded-b-[14px] bg-white p-3 border border-[#D8E7DC] shadow-[0_2px_10px_-4px_rgba(8,80,65,0.03)] [will-change:translate,transform] transition-[translate,scale,transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#7DB290] hover:shadow-[0_14px_28px_-10px_rgba(8,80,65,0.14)] ${
            isNavigating ? 'opacity-65 scale-[0.99]' : ''
          }`}
        >
          <div
            className="relative w-full sm:w-52 aspect-[4/3] sm:aspect-auto sm:min-h-[146px] rounded-t-[20px] rounded-b-[10px] overflow-hidden border border-[#EBF3ED] group-hover:border-[#CFE2D4] transition-colors duration-500 shrink-0 [isolation:isolate] [transform:translateZ(0)]"
            style={{ backgroundColor: '#F6FAF7' }}
          >
            <Image
              src={resolvedImage}
              alt={shownTitle}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 220px"
              onError={() => setImgError(true)}
              className="object-cover transform-gpu [will-change:scale,transform] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#085041]/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              aria-hidden="true"
            />
            <WishlistButton product={product} />
            {!effectiveInStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-white text-[#085041] text-[10.5px] font-semibold px-3 py-0.5 rounded-full border border-[#DCE8DF]">
                  OUT OF STOCK
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0 px-1 py-0.5 justify-between">
            <div>
              <h3
                className="text-[18px] font-bold text-[#085041] group-hover:text-[#0C6850] transition-colors duration-300 truncate mb-1"
                style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
              >
                {shownTitle}
              </h3>

              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="inline-block rounded-full px-2.5 py-[2px] text-[10.5px] font-semibold leading-tight tracking-[0.01em]"
                  style={{ backgroundColor: tagStyle.bg, color: tagStyle.color }}
                >
                  {tagLabel}
                </span>
                <span className="text-[11px] font-medium text-[#6B8A7E] whitespace-nowrap">
                  /{unitLabel}
                </span>
              </div>

              {(shortDesc || description) && (
                <p className="text-[12.5px] text-[#5B7063] line-clamp-2 leading-relaxed">
                  {shortDesc || description}
                </p>
              )}
            </div>

            <div
              className="mt-3 pt-2.5 border-t border-[#EBF3EC] flex items-center justify-between gap-3"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex flex-col min-w-0">
                <span
                  className="font-bold leading-none whitespace-nowrap"
                  style={{ fontSize: '16px', color: '#D96F1A' }}
                >
                  &euro;{displayPrice.toFixed(2)}
                </span>
                {oldPrice && Number(oldPrice) > displayPrice && (
                  <span className="text-[11px] text-[#96AEA3] line-through leading-none mt-1 whitespace-nowrap">
                    &euro;{Number(oldPrice).toFixed(2)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`rounded-full inline-flex items-center justify-center gap-1.5 text-white font-semibold cursor-pointer border-none whitespace-nowrap shrink-0 px-3.5 py-[8px] text-[12px] shadow-[0_0_0_0_rgba(8,80,65,0)] transition-[background-color,scale,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] ${
                  added
                    ? 'bg-[#3D7F1B]'
                    : 'bg-[#085041] hover:bg-[#053A2E] hover:shadow-[0_4px_12px_-2px_rgba(8,80,65,0.22)]'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                    <span>Added</span>
                  </>
                ) : effectiveInStock ? (
                  <span>Add to Cart</span>
                ) : (
                  <span>{notified ? 'Notified ✓' : 'Notify Me'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={'/products/' + slug}
      className="block group h-full w-full min-w-0 no-underline"
      onClick={() => setIsNavigating(true)}
    >
      <div
        className={`isolate flex flex-col w-full h-full min-w-0 rounded-t-[28px] sm:rounded-t-[32px] rounded-b-[14px] bg-white p-2.5 sm:p-3 border border-[#D8E7DC] shadow-[0_2px_10px_-4px_rgba(8,80,65,0.03)] [will-change:translate,transform] transition-[translate,scale,transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:border-[#7DB290] group-hover:shadow-[0_14px_28px_-10px_rgba(8,80,65,0.14)] ${
          isNavigating ? 'opacity-65 scale-[0.98]' : ''
        }`}
      >
        {/* Top Classic Arched Studio Image Stage */}
        <div
          className="relative w-full aspect-[4/3] rounded-t-[20px] sm:rounded-t-[24px] rounded-b-[10px] overflow-hidden flex-shrink-0 mb-2.5 border border-[#EBF3ED] group-hover:border-[#CFE2D4] transition-colors duration-500 [isolation:isolate] [transform:translateZ(0)]"
          style={{ backgroundColor: '#F6FAF7' }}
        >
          <Image
            src={resolvedImage}
            alt={shownTitle}
            fill
            unoptimized
            sizes={
              isShowcase
                ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'
                : '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw'
            }
            onError={() => setImgError(true)}
            className="object-cover transform-gpu [will-change:scale,transform] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
          />

          {/* Subtle botanical depth glaze on hover */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#085041]/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            aria-hidden="true"
          />

          <WishlistButton product={product} />

          {!effectiveInStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white text-[#085041] text-[10.5px] font-semibold px-3 py-0.5 rounded-full border border-[#DCE8DF]">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        {/* Classic Editorial Content Body */}
        <div className="flex flex-col flex-1 px-1 pt-0.5 min-w-0">
          <h3
            className="truncate text-[#085041] group-hover:text-[#0C6850] transition-colors duration-300 mb-1"
            style={{
              fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
              fontSize: isShowcase ? '15.5px' : '16.5px',
              fontWeight: 700,
              lineHeight: 1.22,
            }}
          >
            {shownTitle}
          </h3>

          {/* Grade Badge + Clean Unit Indicator */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span
              className="inline-block rounded-full px-2.5 py-[2px] text-[10.5px] font-semibold leading-tight tracking-[0.01em]"
              style={{
                backgroundColor: tagStyle.bg,
                color: tagStyle.color,
              }}
            >
              {tagLabel}
            </span>
            <span className="text-[11px] font-medium text-[#6B8A7E] whitespace-nowrap">
              /{unitLabel}
            </span>
          </div>

          {/* Hairline Specimen Divider + Price & Pill Action CTA */}
          <div
            className="mt-auto pt-2.5 border-t border-[#EBF3EC] flex items-center justify-between gap-1.5"
            onClick={(e) => e.preventDefault()}
          >
            <div className="flex flex-col min-w-0">
              <span
                className="font-bold leading-none whitespace-nowrap"
                style={{ fontSize: '15.5px', color: '#D96F1A' }}
              >
                &euro;{displayPrice.toFixed(2)}
              </span>
              {oldPrice && Number(oldPrice) > displayPrice && (
                <span className="text-[10.5px] text-[#96AEA3] line-through leading-none mt-1 whitespace-nowrap">
                  &euro;{Number(oldPrice).toFixed(2)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`rounded-full inline-flex items-center justify-center gap-1.5 text-white font-semibold cursor-pointer border-none whitespace-nowrap shrink-0 px-2.5 xl:px-3.5 py-[7px] text-[11px] xl:text-[11.5px] shadow-[0_0_0_0_rgba(8,80,65,0)] transition-[background-color,scale,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] ${
                added
                  ? 'bg-[#3D7F1B]'
                  : 'bg-[#085041] hover:bg-[#053A2E] hover:shadow-[0_4px_12px_-2px_rgba(8,80,65,0.22)]'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  <span>Added</span>
                </>
              ) : effectiveInStock ? (
                <>
                  {showCartIcon && <ShoppingCart className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />}
                  <span>Add to Cart</span>
                </>
              ) : (
                <span>{notified ? 'Notified ✓' : 'Notify Me'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
