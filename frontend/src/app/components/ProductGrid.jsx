'use client'

import { useState, useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { useSafeSession } from '@/lib/useSafeSession'
import { useAuth } from '@/app/context/AuthContext'
import { getFrutasCategoryName, checkIsInternalWholesale } from '@/lib/categoryHelper'
import ProductCard from '@/app/components/ProductCard'
import Image from 'next/image'
import Link from 'next/link'

// ── 5 Signature Category Photo Cards (Matching Mockup A-to-Z) ──────────────────
const CATEGORY_CARDS = [
  {
    id: 'Fruits',
    label: 'Fruits',
    image: '/homepage/cat_card_fruits.webp',
    keywords: ['fruit', 'fruta', 'apple', 'mango', 'grape', 'orange', 'berry', 'banana', 'sandia', 'limon'],
  },
  {
    id: 'Vegetables',
    label: 'Vegetables',
    image: '/homepage/cat_card_vegetables.webp',
    keywords: ['vegetable', 'vagitable', 'verdura', 'carrot', 'tomato', 'tomate', 'broccoli', 'brocoli', 'pepper', 'crisp'],
  },
  {
    id: 'Dairy',
    label: 'Dairy',
    image: '/homepage/cat_card_dairy.webp',
    keywords: ['dairy', 'milk', 'cheese', 'butter', 'yogurt', 'valencia'],
  },
  {
    id: 'Organic',
    label: 'Organic',
    image: '/homepage/cat_card_organic.webp',
    keywords: ['organic', 'bio', 'natural', 'fresh', 'golden', 'wheat', 'grain'],
  },
  {
    id: 'Others',
    label: 'Others',
    href: '/shop',
    image: '/homepage/cat_card_others.webp',
    keywords: ['other', 'pack', 'sale', 'box', 'sweet'],
  },
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

function renderCategoryCardContent(item) {
  return (
    <>
      {/* Top Photo Container (Behind Integrated White Wave Footer) */}
      <div className="relative z-0 w-full aspect-[16/10] overflow-hidden bg-[#EFF7F1]">
        <Image
          src={item.image}
          alt={item.label}
          fill
          preload
          loading="eager"
          fetchPriority="high"
          decoding="async"
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transform-gpu will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
        />
      </div>

      {/* Seamless White Footer Label + Attached Wave Overlapping Seam */}
      <div className="relative z-10 w-full bg-white px-3.5 pt-0.5 pb-2.5 sm:px-4 sm:pb-3">
        <svg
          viewBox="0 0 400 32"
          preserveAspectRatio="none"
          className="absolute bottom-[calc(100%-3px)] -left-[1px] w-[calc(100%+2px)] h-[24px] pointer-events-none block"
          aria-hidden="true"
        >
          <path
            d="M0,20 C120,24 235,5 400,17 L400,32 L0,32 Z"
            fill="#FFFFFF"
          />
        </svg>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[14px] sm:text-[14.5px] text-[#085041] leading-tight">
            {item.label}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#085041] transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </div>
      </div>
    </>
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

  const filtered = useMemo(() => {
    if (active === 'All') return sourceProducts
    if (active === 'On Sale') {
      const saleItems = sourceProducts.filter((p) => p.onSale)
      return saleItems.length > 0 ? saleItems : sourceProducts.slice(0, itemsPerPage)
    }

    const activeLower = active.toLowerCase()
    const stripItem = CATEGORY_CARDS.find((item) => item.id === active)
    if (stripItem) {
      const matched = sourceProducts.filter((p) => {
        if (p.isShowcaseTemplate) {
          return (p.showcaseCategory || '').toLowerCase() === activeLower
        }
        const cat = (p.category || '').toLowerCase()
        const subCat = (p.sub_category?.name || p.subCategory?.name || '').toLowerCase()
        const name = (p.displayName || p.name || '').toLowerCase()
        if (cat === activeLower || subCat === activeLower) return true
        // Avoid false catch-all match when DB category is compound ("Fruits and Vagitable")
        const isCompoundCategory =
          cat.includes('fruit') && (cat.includes('vegetable') || cat.includes('vagitable'))
        return stripItem.keywords.some(
          (kw) => name.includes(kw) || subCat.includes(kw) || (!isCompoundCategory && cat.includes(kw))
        )
      })
      return matched.length > 0 ? matched : sourceProducts.slice(0, itemsPerPage)
    }

    const byCat = sourceProducts.filter((p) => p.category === active)
    return byCat.length > 0 ? byCat : sourceProducts.slice(0, itemsPerPage)
  }, [sourceProducts, active])

  // Display 5 crisp cards in a balanced 5-column showcase row matching the mockup
  const showcaseProducts = filtered.slice(0, itemsPerPage)

  function handleSelectCategory(catId) {
    setManualActive((prev) => {
      const current = prev !== null ? prev : active
      return current === catId && catId !== 'All' ? 'All' : catId
    })
  }

  return (
    <div style={{ backgroundColor: '#EFF9F2' }}>
      {/* ── Explore Our Categories (Centered Header + 5 Photo Wave Cards) ── */}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {CATEGORY_CARDS.map((item, idx) => {
            const isSelected = active === item.id
            const spanLastOnMobile = idx === CATEGORY_CARDS.length - 1 ? 'col-span-2 sm:col-span-1' : ''
            const cardClasses = `group isolate flex flex-col rounded-[14px] overflow-hidden bg-white text-left cursor-pointer transition-colors duration-300 ease-out ${
              isSelected
                ? 'border-[1.5px] border-[#085041]'
                : 'border border-[#DCE8DF] hover:border-[#9EC4AA]'
            } ${spanLastOnMobile}`

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className={`${cardClasses} no-underline`}>
                  {renderCategoryCardContent(item)}
                </Link>
              )
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCategory(item.id)}
                className={cardClasses}
              >
                {renderCategoryCardContent(item)}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Popular Products (Bestsellers + 5-Column Showcase Cards) ── */}
      <section className="relative w-full overflow-hidden">
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
        </div>
      </section>

      {/* ── Special Offers Slot (Untouched Section Preserved Below) ── */}
      {offersSlot}
    </div>
  )
}
