'use client'

import { useState, useMemo, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useSafeSession } from '@/lib/useSafeSession'
import { useAuth } from '@/app/context/AuthContext'
import {
  getFrutasCategoryName,
  checkIsInternalWholesale,
  pickCategoryFallbackImage,
  doesProductMatchCategory,
} from '@/lib/categoryHelper'
import ProductCard from '@/app/components/ProductCard'
import Image from 'next/image'
import Link from 'next/link'

// Offline fallback category cards used only if the backend category endpoint returns empty
const FALLBACK_CATEGORY_CARDS = [
  { id: 'Fruits', label: 'Fruits', image: '/homepage/cat_card_fruits.webp', fallbackImage: '/homepage/cat_card_fruits.webp' },
  { id: 'Vegetables', label: 'Vegetables', image: '/homepage/cat_card_vegetables.webp', fallbackImage: '/homepage/cat_card_vegetables.webp' },
  { id: 'Dairy', label: 'Dairy', image: '/homepage/cat_card_dairy.webp', fallbackImage: '/homepage/cat_card_dairy.webp' },
  { id: 'Organic', label: 'Organic', image: '/homepage/cat_card_organic.webp', fallbackImage: '/homepage/cat_card_organic.webp' },
  { id: '__browse_all__', label: 'All Products', href: '/shop', image: '/homepage/cat_card_others.webp', fallbackImage: '/homepage/cat_card_others.webp' },
]

// 20 balanced showcase templates so Default ('All') and every Category filter ('Fruits', 'Vegetables', 'Dairy', 'Organic') render crisp dedicated items
const SHOWCASE_TEMPLATES = [
  { name: 'Manzana Fuji', price: 1.50, oldPrice: 2.00, badge: 'Class A', unit: 'kg', category: 'Fruits', image: '/homepage/prod_apple.jpg' },
  { name: 'Tomate Rojo', price: 2.50, oldPrice: 3.50, badge: 'Premium', unit: 'kg', category: 'Vegetables', image: '/homepage/prod_tomato.webp' },
  { name: 'Grapes', price: 3.00, oldPrice: 4.00, badge: 'Class B', unit: 'kg', category: 'Fruits', image: '/homepage/prod_grapes.jpg' },
  { name: 'Orange', price: 2.60, oldPrice: 3.50, badge: 'Class B', unit: 'kg', category: 'Fruits', image: '/homepage/prod_orange.jpg' },
  { name: 'Strawberry', price: 2.00, oldPrice: 2.80, badge: 'Premium', unit: 'kg', category: 'Organic', image: '/homepage/prod_strawberry.jpg' },
  { name: 'Fresh Whole Milk', price: 1.80, oldPrice: 2.40, badge: 'Class A', unit: 'L', category: 'Dairy', image: '/homepage/cat_card_dairy.webp' },
  { name: 'Broccoli & Carrots', price: 2.20, oldPrice: 3.00, badge: 'Class A', unit: 'kg', category: 'Vegetables', image: '/homepage/cat_card_vegetables.webp' },
  { name: 'Mango', price: 2.80, oldPrice: 3.60, badge: 'Premium', unit: 'kg', category: 'Fruits', image: '/homepage/prod_mango.jpg' },
  { name: 'Organic Whole Wheat', price: 3.10, oldPrice: 3.90, badge: 'Premium', unit: 'kg', category: 'Organic', image: '/homepage/cat_card_organic.webp' },
  { name: 'Aged Cheddar Cheese', price: 4.20, oldPrice: 5.20, badge: 'Premium', unit: 'kg', category: 'Dairy', image: '/homepage/cat_card_dairy.webp' },
  { name: 'Garden Harvest Mix', price: 3.50, oldPrice: 4.50, badge: 'Class A', unit: 'kg', category: 'Vegetables', image: '/homepage/cat_card_others.webp' },
  { name: 'Orchard Red Apples', price: 2.10, oldPrice: 2.80, badge: 'Class A', unit: 'kg', category: 'Fruits', image: '/homepage/cat_card_fruits.webp' },
  { name: 'Organic Soybeans', price: 2.90, oldPrice: 3.60, badge: 'Class B', unit: 'kg', category: 'Organic', image: '/homepage/cat_card_organic.webp' },
  { name: 'Farmhouse Cheese', price: 3.80, oldPrice: 4.80, badge: 'Class A', unit: 'kg', category: 'Dairy', image: '/homepage/cat_card_dairy.webp' },
  { name: 'Fresh Farm Greens', price: 3.40, oldPrice: 4.20, badge: 'Class B', unit: 'kg', category: 'Vegetables', image: '/homepage/hero_crate.webp' },
  { name: 'Organic Vine Tomatoes', price: 2.70, oldPrice: 3.40, badge: 'Class A', unit: 'kg', category: 'Organic', image: '/homepage/prod_tomato.webp' },
  { name: 'Artisan Raw Cream', price: 2.50, oldPrice: 3.10, badge: 'Class B', unit: 'L', category: 'Dairy', image: '/homepage/cat_card_dairy.webp' },
  { name: 'Fresh Salad Basket', price: 2.30, oldPrice: 3.00, badge: 'Class B', unit: 'kg', category: 'Vegetables', image: '/homepage/cat_card_vegetables.webp' },
  { name: 'Organic Citrus Oranges', price: 2.90, oldPrice: 3.70, badge: 'Premium', unit: 'kg', category: 'Organic', image: '/homepage/prod_orange.jpg' },
  { name: 'Country Glass Milk', price: 1.60, oldPrice: 2.20, badge: 'Class A', unit: 'L', category: 'Dairy', image: '/homepage/cat_card_dairy.webp' },
]

function CategoryMedallionIcon({ label = '' }) {
  const norm = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (
    norm.includes('droguer') ||
    norm.includes('pharm') ||
    norm.includes('health') ||
    norm.includes('care') ||
    norm.includes('hygiene')
  ) {
    return (
      <svg viewBox="0 0 28 28" className="w-[17px] h-[17px] sm:w-[19px] sm:h-[19px] text-[#356F3E]" fill="currentColor" aria-hidden="true">
        <rect x="10.5" y="4" width="7" height="20" rx="1.6" />
        <rect x="4" y="10.5" width="20" height="7" rx="1.6" />
      </svg>
    )
  }

  if (
    norm.includes('aliment') ||
    norm.includes('wheat') ||
    norm.includes('grain') ||
    norm.includes('bak') ||
    norm.includes('all') ||
    norm.includes('other')
  ) {
    return (
      <svg viewBox="0 0 28 28" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] text-[#285F36]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.5 23.5c0-6 2.5-12 7.5-17.5" />
        <path d="M7.5 23.5c-.8-5-.2-10 3-14.5" />
        <path d="M14.5 14.5c2.2 0 4.2-1.1 4.8-3-2-.6-4.1.4-4.8 3Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M12.5 18c2.2 0 4.2-1.1 4.8-3-2-.6-4.1.4-4.8 3Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M16.2 10.8c1.9 0 3.5-1 4-2.6-1.7-.5-3.4.3-4 2.6Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M11 11.5c0-2.1-1.3-3.9-3.1-4.3-.4 1.9.7 3.8 3.1 4.3Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M9.6 15.6c0-2.1-1.3-3.9-3.1-4.3-.4 1.9.7 3.8 3.1 4.3Z" fill="currentColor" fillOpacity="0.18" />
      </svg>
    )
  }

  // Default botanical leaf icon (matching Frutas y Verduras / Organic / Fresh Produce)
  return (
    <svg viewBox="0 0 28 28" className="w-[17px] h-[17px] sm:w-[19px] sm:h-[19px] text-[#2D6938]" fill="none" aria-hidden="true">
      <path
        d="M21 5.5C13.8 5.8 8.2 10.6 7.5 18.8c6.8-.4 12.2-5 13.5-13.3Z"
        fill="currentColor"
        fillOpacity="0.88"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M6 22.5c2.5-3.2 7.2-8.2 12.8-13.2M11 15.8h4.2M13.2 12.2l3.4-.2"
        stroke="#FAF9F2"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path d="M5.8 22.8l2.5-2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CategoryCardContent({ item }) {
  const [imgFailed, setImgFailed] = useState(false)
  const resolvedSrc = imgFailed || !item.image ? (item.fallbackImage || '/homepage/cat_card_others.webp') : item.image

  return (
    <div className="relative flex flex-col w-full rounded-[11px] sm:rounded-[12px] overflow-hidden bg-[#FAF9F2]">
      {/* Top Photo Zone + Sculpted Left Accent Shoulder */}
      <div className="relative z-0 w-full aspect-[16/10] overflow-hidden bg-[#EEF5EA]">
        <Image
          src={resolvedSrc}
          alt={item.label}
          fill
          decoding="async"
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onError={() => setImgFailed(true)}
          className="object-cover transform-gpu will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />

        {/* Subtle Dark Forest-Green Curved Accent Behind Upper-Left of Medallion */}
        <svg
          viewBox="0 0 110 58"
          className="pointer-events-none absolute -bottom-[1px] left-0 w-[56px] sm:w-[62px] h-[28px] sm:h-[32px] z-10"
          aria-hidden="true"
        >
          <path d="M0,58 L0,6 C34,6 64,26 78,58 Z" fill="#195937" />
        </svg>

        {/* Cream Arch Seam Along Bottom Edge of Photo */}
        <svg
          viewBox="0 0 400 26"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -bottom-[1px] left-0 w-full h-[14px] sm:h-[16px] z-10"
          aria-hidden="true"
        >
          <path d="M0,26 L0,18 C54,3 92,16 124,22 L400,22 L400,26 Z" fill="#FAF9F2" />
        </svg>
      </div>

      {/* Cream Footer Bar with Overlapping Circular Medallion, Centered Uppercase Serif Title & Dark Green Arrow */}
      <div className="relative z-20 w-full bg-[#FAF9F2] min-h-[38px] sm:min-h-[42px] pl-[46px] sm:pl-[52px] pr-2 sm:pr-2.5 py-1.5 flex items-center justify-between gap-1.5">
        {/* Overlapping White Circular Medallion */}
        <div className="absolute left-[8px] sm:left-[10px] -top-[14px] sm:-top-[16px] w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full bg-white border-[1.5px] border-[#C5CD8C] shadow-[0_2px_8px_rgba(11,55,33,0.12)] flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.04]">
          <CategoryMedallionIcon label={item.label} />
        </div>

        <span
          className="font-semibold uppercase text-[10px] sm:text-[10.5px] lg:text-[11px] tracking-[0.02em] text-[#113D26] leading-tight text-center flex-1 min-w-0 line-clamp-2"
          style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
        >
          {item.label}
        </span>

        <span
          aria-hidden="true"
          className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] rounded-full bg-[#094326] group-hover:bg-[#05331C] text-white flex items-center justify-center shrink-0 transition-all duration-300 ease-out group-hover:translate-x-0.5"
        >
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  )
}

export default function ProductGrid({
  initialProducts = [],
  categories = [],
  isInternalWholesaleUser: initialIsInternalWholesale = false,
  offersSlot = null,
}) {
  const { data: session } = useSafeSession()
  const { user } = useAuth()
  const isInternalWholesale = initialIsInternalWholesale || checkIsInternalWholesale(session, user)

  const frutasCat = useMemo(() => getFrutasCategoryName(categories), [categories])
  const [manualActive, setManualActive] = useState(null)
  const [notified, setNotified] = useState({})
  const productsSectionRef = useRef(null)

  const active =
    manualActive !== null
      ? manualActive
      : isInternalWholesale && frutasCat
      ? frutasCat
      : 'All'

  const itemsPerPage = 5

  // Enrich dummy/placeholder products while preserving real backend id, slug & price
  const sourceProducts = useMemo(() => {
    const baseList = Array.isArray(initialProducts) && initialProducts.length > 0 ? initialProducts : []
    if (baseList.length === 0) {
      return SHOWCASE_TEMPLATES.map((tpl, idx) => ({
        id: `showcase-${idx + 1}`,
        slug: tpl.name.toLowerCase().replace(/\s+/g, '-'),
        inStock: true,
        showcaseCategory: tpl.category,
        isShowcaseTemplate: true,
        ...tpl,
      }))
    }

    const enriched = baseList.map((p, idx) => {
      const tpl = SHOWCASE_TEMPLATES[idx % SHOWCASE_TEMPLATES.length]
      const isGenericName = /^premium\s+product\s*\d*$/i.test((p.name || '').trim())
      const isPlaceholderImg =
        !p.image ||
        p.image.includes('placehold.co') ||
        /\/media\/products\/thumbnails\/(test\.jpg|product_\d+\.png)$/i.test(p.image)

      return {
        ...p,
        displayName: isGenericName ? tpl.name : p.name,
        displayPrice: isGenericName ? tpl.price : Number(p.price || tpl.price),
        oldPrice: isGenericName ? tpl.oldPrice : p.oldPrice,
        badge: isGenericName || !p.badge || p.badge === 'NEW' ? tpl.badge : p.badge,
        unit: p.unit || tpl.unit,
        image: isGenericName || isPlaceholderImg ? tpl.image : p.image,
        showcaseCategory: tpl.category,
        isShowcaseTemplate: isGenericName,
      }
    })

    if (enriched.length >= itemsPerPage) return enriched
    const needed = itemsPerPage - enriched.length
    const extras = SHOWCASE_TEMPLATES.slice(0, needed).map((tpl, idx) => ({
      id: `showcase-extra-${idx + 1}`,
      slug: tpl.name.toLowerCase().replace(/\s+/g, '-'),
      inStock: true,
      displayName: tpl.name,
      displayPrice: tpl.price,
      showcaseCategory: tpl.category,
      isShowcaseTemplate: true,
      ...tpl,
    }))
    return [...enriched, ...extras]
  }, [initialProducts])

  const backendCategoryCards = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return FALLBACK_CATEGORY_CARDS
    }

    const mapped = categories
      .filter((c) => {
        const name = (typeof c === 'string' ? c : c?.name) || ''
        const lower = name.trim().toLowerCase()
        return Boolean(lower) && lower !== 'all' && lower !== 'on sale' && lower !== 'all products' && lower !== 'all produce'
      })
      .map((c) => {
        const obj = typeof c === 'object' && c !== null ? c : { name: c }
        const fallbackImage = pickCategoryFallbackImage(obj)
        return {
          id: obj.name,
          label: obj.name,
          slug: obj.slug || '',
          categoryId: obj.id ?? null,
          totalProducts: typeof obj.total_products === 'number' ? obj.total_products : null,
          image: obj.image_url || obj.image || fallbackImage,
          fallbackImage,
          rawCategory: obj,
        }
      })

    if (mapped.length === 0) return FALLBACK_CATEGORY_CARDS
    return [
      ...mapped,
      {
        id: '__browse_all__',
        label: 'All Products',
        href: '/shop',
        image: '/homepage/cat_card_others.webp',
        fallbackImage: '/homepage/cat_card_others.webp',
      },
    ]
  }, [categories])

  const filtered = useMemo(() => {
    if (active === 'All') return sourceProducts
    if (active === 'On Sale') {
      return sourceProducts.filter((p) => p.onSale)
    }

    const activeCard = backendCategoryCards.find((card) => card.id === active)
    const targetCategory = activeCard?.rawCategory || active

    return sourceProducts.filter(
      (p) => !p.isShowcaseTemplate && doesProductMatchCategory(p, targetCategory)
    )
  }, [sourceProducts, active, backendCategoryCards])

  // Display 5 crisp cards in a balanced 5-column showcase row matching the mockup
  const showcaseProducts = filtered.slice(0, itemsPerPage)

  function handleSelectCategory(catId) {
    setManualActive((prev) => {
      const current = prev !== null ? prev : active
      return current === catId && catId !== 'All' ? 'All' : catId
    })
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        productsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }

  return (
    <div style={{ backgroundColor: '#EFF9F2' }}>
      {/* ── Explore Our Categories (Centered Header + 5-Per-Row Compact Medallion Wave Cards) ── */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 sm:pt-11 pb-7 sm:pb-9">
        <div className="text-center mb-6 sm:mb-7">
          <div className="flex items-center justify-center gap-3 mb-1.5">
            <span className="h-[1px] w-7 bg-[#9BB6A4]" />
            <span
              className="uppercase font-semibold tracking-[0.16em]"
              style={{ fontSize: '10.5px', color: '#45665B' }}
            >
              SHOP BY CATEGORY
            </span>
            <span className="h-[1px] w-7 bg-[#9BB6A4]" />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
              fontSize: 'clamp(1.65rem, 2.5vw, 2.15rem)',
              fontWeight: 700,
              color: '#085041',
              lineHeight: 1.15,
            }}
          >
            Explore Our Categories
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 lg:gap-4">
          {backendCategoryCards.map((item) => {
            const isSelected = active === item.id
            const cardClasses = `group isolate block w-full rounded-[15px] sm:rounded-[17px] bg-white p-[5px] sm:p-[6px] text-left cursor-pointer transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#085041] ${
              isSelected
                ? 'border-[1.5px] border-[#085041] ring-2 ring-[#085041]/20 shadow-[0_10px_22px_-8px_rgba(12,68,41,0.22)]'
                : 'border border-[#DCE8DD] shadow-[0_5px_14px_-6px_rgba(12,68,41,0.11)] hover:border-[#7DB290] hover:shadow-[0_10px_20px_-8px_rgba(12,68,41,0.16)]'
            }`

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className={`${cardClasses} no-underline`}>
                  <CategoryCardContent item={item} />
                </Link>
              )
            }

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelectCategory(item.id)}
                className={cardClasses}
              >
                <CategoryCardContent item={item} />
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Popular Products (Bestsellers + 5-Column Showcase Cards) ── */}
      <section
        id="popular-products"
        ref={productsSectionRef}
        className="relative w-full overflow-hidden scroll-mt-24"
      >
        {/* Soft Organic Botanical Wave Accent Behind Popular Products */}
        <svg
          viewBox="0 0 1440 260"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-full pointer-events-none select-none"
          aria-hidden="true"
        >
          <path
            d="M0,190 C320,120 620,25 1040,15 C1240,10 1360,35 1440,55 L1440,260 L0,260 Z"
            fill="#E5F3E9"
            fillOpacity="0.65"
          />
        </svg>

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 sm:pb-12 relative z-10">
          {/* Eyebrow + Section Heading + View All Products Link */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 mb-5 sm:mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="h-[1px] w-5 bg-[#8BB59E]" />
                <span
                  className="uppercase font-semibold tracking-[0.15em]"
                  style={{ fontSize: '10.5px', color: '#45665B' }}
                >
                  BESTSELLERS
                </span>
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.6rem, 2.4vw, 2.05rem)',
                  fontWeight: 700,
                  color: '#085041',
                  lineHeight: 1.15,
                }}
              >
                Popular Products
              </h2>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-end">
              {active !== 'All' && (
                <button
                  type="button"
                  onClick={() => setManualActive('All')}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-medium bg-white border border-[#C8E2D0] text-[#085041] hover:bg-[#E3F3E8] transition-colors cursor-pointer"
                >
                  <span>{active}</span>
                  <span aria-hidden="true">&times;</span>
                </button>
              )}

              <Link
                href={
                  isInternalWholesale && frutasCat
                    ? `/shop?category=${encodeURIComponent(frutasCat)}`
                    : active !== 'All'
                    ? `/shop?category=${encodeURIComponent(active)}`
                    : '/shop'
                }
                className="group inline-flex items-center gap-1.5 no-underline shrink-0 transition-all duration-200 hover:text-[#085041]"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#085041',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
              >
                <span>View All Products</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* 5 Product Cards Grid (Smoothly fades on category change) */}
          {showcaseProducts.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#BED7C5] bg-white/80 py-10 px-6 text-center">
              <p
                className="text-lg font-bold text-[#085041] mb-1.5"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                No products available in &ldquo;{active}&rdquo; yet
              </p>
              <p className="text-sm text-[#4F6D60] mb-4">
                Select another backend category above or browse the full store catalog.
              </p>
              <button
                type="button"
                onClick={() => setManualActive('All')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#085041] hover:bg-[#053A2E] text-white text-xs font-semibold px-4 py-2 transition-colors cursor-pointer"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div
              key={active}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 [animation:gridFadeIn_240ms_ease-out]"
            >
              {showcaseProducts.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={idx}
                  variant="showcase"
                  notified={!!notified[p.id]}
                  onNotify={() => setNotified((n) => ({ ...n, [p.id]: true }))}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Special Offers Slot (Untouched Section Preserved Below) ── */}
      {offersSlot}
    </div>
  )
}
