'use client'
// src/app/shop/ProductListingClient.jsx

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  LayoutGrid,
  List as ListIcon,
  Tag,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Search,
  X,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import ProductCard from '@/app/components/ProductCard'
import { useSafeSession } from '@/lib/useSafeSession'
import { useAuth } from '@/app/context/AuthContext'
import {
  getFrutasCategoryName,
  checkIsInternalWholesale,
  doesProductMatchCategory,
} from '@/lib/categoryHelper'
import ShopHeroBanner from './ShopHeroBanner'
import { useShopHeroSync } from './ShopShell'

const SORT_OPTIONS = [
  'Promotional first',
  'Price: Low to High',
  'Price: High to Low',
  'Newest arrivals',
]

// ─── Custom Compact Toggle ────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle option'}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full border-none transition-colors duration-200 ${
        checked ? 'bg-[#0B462B]' : 'bg-[#C4D3C9]'
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
          checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}

// ─── Circular Pagination ──────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-9">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="w-8 h-8 flex items-center justify-center rounded-full text-[#4D6356] hover:bg-white hover:text-[#0B462B] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getVisiblePages().map((page, idx) =>
        page === '...' ? (
          <span key={`dots-${idx}`} className="px-1.5 text-xs text-[#6E8275]">
            ...
          </span>
        ) : (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
              currentPage === page
                ? 'bg-[#0B462B] text-white shadow-[0_3px_10px_rgba(11,70,43,0.22)]'
                : 'text-[#3D5245] hover:bg-white hover:text-[#0B462B]'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="w-8 h-8 flex items-center justify-center rounded-full text-[#4D6356] hover:bg-white hover:text-[#0B462B] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function ShopEmptyState({ onClearFilters }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 md:py-16 px-4 text-center rounded-[20px] border border-dashed border-[#BED5C4]"
      style={{ background: 'linear-gradient(to bottom, #ffffff, #f8fcf7)' }}
    >
      <div
        className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mb-4 md:mb-5"
        style={{
          background: 'linear-gradient(135deg, #f2fdea 0%, #e4f1db 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 8px 24px rgba(11, 70, 43, 0.08)',
        }}
      >
        <Search className="w-7 h-7 md:w-9 md:h-9 text-[#0B462B]" strokeWidth={1.6} />
        <div className="absolute top-1 right-0 w-2.5 h-2.5 bg-[#9AE0C4] rounded-full shadow-xs" />
        <div className="absolute bottom-2 left-0 w-2 h-2 bg-[#0B462B]/30 rounded-full" />
      </div>

      <h3
        className="text-xl md:text-2xl font-bold text-[#173023] mb-1.5"
        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
      >
        No products found
      </h3>
      <p className="text-xs md:text-sm text-[#5B7063] max-w-[290px] leading-relaxed mb-5">
        We couldn&apos;t find anything matching your current filters. Try adjusting your search or categories.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#0B462B] hover:bg-[#07331F] text-white text-xs font-semibold px-4 py-2 transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset All Filters
      </button>
    </div>
  )
}

// ─── Left Sidebar Filter Card ─────────────────────────────────────────────────
function ShopFilterCard({
  categoryPills,
  allCategoryObjects,
  activeCategory,
  onSelectCategory,
  activeSubCategory,
  onSelectSubCategory,
  catCount,
  subCatCount,
  sortedVariants,
  activeVariant,
  onSelectVariant,
  allProductsCount,
  variantCount,
  priceMax,
  maxProductPrice,
  onPriceMaxChange,
  inStockOnly,
  onInStockChange,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <div className="rounded-[18px] bg-white border border-[#DFECE2] p-4 shadow-[0_6px_22px_rgba(8,80,65,0.05)]">
      {/* Category Section */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <LayoutGrid className="w-4 h-4 text-[#0B462B] shrink-0" strokeWidth={2} />
          <h3
            className="text-[16px] font-bold text-[#173023] leading-none"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Category
          </h3>
        </div>

        <div className="space-y-1">
          {categoryPills.map((cat) => {
            const isActive = activeCategory === cat
            const categoryObj = allCategoryObjects.find(
              (c) => (typeof c === 'string' ? c : c?.name) === cat
            )
            const subs =
              categoryObj && Array.isArray(categoryObj.subcategories)
                ? categoryObj.subcategories
                : []
            const count = catCount(cat)

            return (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`w-full rounded-[10px] px-3 py-2 flex items-center justify-between gap-2 text-left text-[13px] transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B462B] text-white font-semibold shadow-[0_3px_10px_rgba(11,70,43,0.16)]'
                      : 'text-[#354B3F] font-medium hover:bg-[#EFF7F1] hover:text-[#0B462B]'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span
                    className={`shrink-0 inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold ${
                      isActive
                        ? 'bg-[#356B50] text-white'
                        : 'text-[#73877B] bg-transparent'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Indented Backend Subcategories */}
                {isActive && subs.length > 0 && (
                  <div className="mt-1.5 mb-2 ml-2.5 pl-3 border-l-2 border-[#CDE0D3] space-y-1">
                    {subs.map((sub) => {
                      const subName = typeof sub === 'string' ? sub : sub?.name
                      if (!subName) return null
                      const isSubActive = activeSubCategory === subName
                      const scCount = subCatCount(subName)
                      return (
                        <button
                          type="button"
                          key={sub.id || subName}
                          onClick={() =>
                            onSelectSubCategory(isSubActive ? null : subName)
                          }
                          className={`w-full rounded-[8px] px-2.5 py-1.5 flex items-center justify-between gap-2 text-left text-[12px] transition-colors cursor-pointer ${
                            isSubActive
                              ? 'bg-[#E5F2E6] text-[#0B462B] font-semibold'
                              : 'text-[#556C5E] hover:bg-[#F3F9F4] hover:text-[#0B462B]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isSubActive ? 'bg-[#0B462B]' : 'bg-[#A6C0AF]'
                              }`}
                            />
                            <span className="truncate">{subName}</span>
                          </span>
                          <span className="text-[11px] font-medium text-[#7B8E82] shrink-0">
                            {scCount}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#EDF3EE] my-4" />

      {/* Quality / Variant Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[#0B462B] shrink-0" strokeWidth={2} />
          <h3
            className="text-[15.5px] font-bold text-[#173023] leading-none"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Quality / Variant
          </h3>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectVariant(null)}
            className={`w-full rounded-[10px] px-3 py-2 flex items-center justify-between gap-2 text-left text-[13px] transition-all cursor-pointer ${
              activeVariant === null
                ? 'bg-[#EFF6EE] text-[#173023] font-semibold'
                : 'text-[#3D5245] font-medium hover:bg-[#F4F9F5]'
            }`}
          >
            <span>All Qualities</span>
            <span
              className={`inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold ${
                activeVariant === null
                  ? 'bg-[#6BA368] text-white'
                  : 'bg-[#ECF2EE] text-[#5F7468]'
              }`}
            >
              {allProductsCount}
            </span>
          </button>

          {sortedVariants.map((variant) => {
            const isSelected = activeVariant === variant
            const count = variantCount(variant)
            return (
              <button
                type="button"
                key={variant}
                onClick={() => onSelectVariant(isSelected ? null : variant)}
                className={`w-full rounded-[10px] px-3 py-1.5 flex items-center justify-between gap-2 text-left text-[12.5px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B462B] text-white font-semibold shadow-xs'
                    : 'text-[#4B6153] font-medium hover:bg-[#EFF7F1] hover:text-[#0B462B]'
                }`}
              >
                <span className="truncate">{variant}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold ${
                    isSelected
                      ? 'bg-[#356B50] text-white'
                      : 'bg-[#EDF3EF] text-[#667B6E]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#EDF3EE] my-3" />

      {/* Compact Price & Stock Controls */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="font-semibold text-[#2E4638]">Max Price</span>
            <span className="font-bold text-[#0B462B]">&euro;{priceMax}</span>
          </div>
          <input
            type="range"
            min={1}
            max={maxProductPrice}
            value={Math.min(priceMax, maxProductPrice)}
            onChange={(e) => onPriceMaxChange(Number(e.target.value))}
            aria-label="Maximum price filter"
            className="w-full h-1.5 bg-[#DFECE2] rounded-lg appearance-none cursor-pointer accent-[#0B462B]"
          />
          <div className="flex justify-between text-[10.5px] text-[#7B8E82] mt-1">
            <span>&euro;1</span>
            <span>&euro;{maxProductPrice}+</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[12.5px] font-medium text-[#2E4638]">
            In Stock Only
          </span>
          <Toggle
            checked={inStockOnly}
            onChange={onInStockChange}
            label="Filter in-stock products only"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#C8DCD0] bg-[#F6FAF7] hover:bg-[#EAF4ED] text-[#0B462B] text-[12px] font-semibold py-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Support Local Farmers Bottom Sidebar Card ────────────────────────────────
function SupportFarmersCard() {
  return (
    <div className="rounded-[18px] bg-white border border-[#DFECE2] overflow-hidden shadow-[0_6px_22px_rgba(8,80,65,0.05)] flex flex-col">
      <div className="px-4 pt-5 pb-3 text-center">
        {/* Green Farmhouse Emblem */}
        <div className="mx-auto mb-2.5 w-10 h-10 rounded-full bg-[#DCEFD8] flex items-center justify-center ring-4 ring-[#F1F9EF]">
          <div className="w-8 h-8 rounded-full bg-[#1C542F] flex items-center justify-center text-white">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 20h18" />
              <path d="M5 20V11l7-6 7 6v9" />
              <path d="M9 20v-6h6v6" />
            </svg>
          </div>
        </div>

        <h3
          className="text-[20px] font-bold text-[#173023] leading-[1.15]"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          Support
          <br />
          Local Farmers
        </h3>

        <p className="mt-2 text-[12px] text-[#5B7063] leading-[1.45] max-w-[185px] mx-auto">
          Together for a greener and healthier planet.
        </p>

        <Link
          href="/about"
          className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0B462B] hover:bg-[#07331F] text-white text-[12px] font-semibold px-5 py-2 shadow-[0_4px_12px_rgba(11,70,43,0.2)] transition-all duration-300 no-underline"
        >
          <span>Learn More</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Bottom Sunlit Green Hills with Smooth Convex White Cutout */}
      <div className="relative w-full h-[64px] mt-1 overflow-hidden">
        <Image
          src="/homepage/why_farm_field.jpg"
          alt="Local organic farm hillside"
          fill
          unoptimized
          sizes="280px"
          className="object-cover object-center"
        />
        <svg
          viewBox="0 0 300 36"
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-0 left-0 w-full h-[30px]"
          aria-hidden="true"
        >
          <path d="M0,0 L300,0 L300,32 Q150,2 0,32 Z" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductListingClient({
  initialProducts = [],
  categories = [],
  productClasses = [],
  isInternalWholesaleUser: initialIsInternalWholesale = false,
}) {
  const [freshData, setFreshData] = useState({
    baseProducts: initialProducts,
    products: null,
    categories: null,
  })

  const products =
    freshData.baseProducts === initialProducts && freshData.products !== null
      ? freshData.products
      : initialProducts
  const cats =
    freshData.baseProducts === initialProducts &&
    Array.isArray(freshData.categories) &&
    freshData.categories.length > 0
      ? freshData.categories
      : categories

  const { data: session } = useSafeSession()
  const { user } = useAuth()
  const isInternalWholesale =
    initialIsInternalWholesale || checkIsInternalWholesale(session, user)

  const fetchFresh = useCallback(async () => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch('/api/products-fresh', { headers })
      if (!res.ok) return
      const data = await res.json()
      setFreshData({
        baseProducts: initialProducts,
        products: Array.isArray(data.products) ? data.products : null,
        categories: Array.isArray(data.categories) ? data.categories : null,
      })
    } catch {
      // Ignore transient network errors on background poll
    }
  }, [initialProducts])

  useEffect(() => {
    const interval = setInterval(fetchFresh, 10_000)
    return () => clearInterval(interval)
  }, [fetchFresh])

  const searchParams = useSearchParams()
  const initialCatParam = searchParams.get('category')
  const storeParam = searchParams.get('store')

  const allCategoryObjects = useMemo(() => {
    const currentCats = cats && cats.length > 0 ? cats : categories
    return currentCats || []
  }, [cats, categories])

  const CATEGORY_PILLS = useMemo(() => {
    const rawNames = allCategoryObjects
      .map((c) => (typeof c === 'string' ? c : c?.name))
      .filter((name) => Boolean(name) && name !== 'All' && name !== 'On Sale')
    return ['All Produce', ...Array.from(new Set(rawNames))]
  }, [allCategoryObjects])

  const frutasCatName = useMemo(
    () => getFrutasCategoryName(CATEGORY_PILLS),
    [CATEGORY_PILLS]
  )

  const defaultCategory =
    isInternalWholesale && frutasCatName ? frutasCatName : 'All Produce'

  const resolvedInitialCategory = useMemo(() => {
    if (!initialCatParam) return defaultCategory
    const lowerParam = initialCatParam.trim().toLowerCase()
    const matchedObj = allCategoryObjects.find((c) => {
      const name = (typeof c === 'string' ? c : c?.name || '').trim().toLowerCase()
      const slug = (typeof c === 'object' ? c?.slug || '' : '').trim().toLowerCase()
      return name === lowerParam || slug === lowerParam
    })
    if (matchedObj) {
      return typeof matchedObj === 'string' ? matchedObj : matchedObj.name
    }
    if (CATEGORY_PILLS.includes(initialCatParam)) return initialCatParam
    return defaultCategory
  }, [initialCatParam, allCategoryObjects, CATEGORY_PILLS, defaultCategory])

  const [manualCategory, setManualCategory] = useState(null)
  const activeCategory =
    manualCategory !== null ? manualCategory : resolvedInitialCategory

  const [activeSubCategory, setActiveSubCategory] = useState(null)
  const syncHeroMeta = useShopHeroSync()

  useEffect(() => {
    if (syncHeroMeta) {
      syncHeroMeta({ activeCategory, activeSubCategory, isInternalWholesale })
    }
  }, [syncHeroMeta, activeCategory, activeSubCategory, isInternalWholesale])
  const [activeVariant, setActiveVariant] = useState(null)
  const [sortBy, setSortBy] = useState('Promotional first')
  const [inStockOnly, setInStockOnly] = useState(false)
  const maxProductPrice = useMemo(
    () => Math.ceil(Math.max(...products.map((p) => p.price || 0), 50)),
    [products]
  )
  const [userPriceMax, setUserPriceMax] = useState(null)
  const priceMax =
    userPriceMax !== null ? Math.min(userPriceMax, maxProductPrice) : maxProductPrice

  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [notified, setNotified] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  const [isQualityOpen, setIsQualityOpen] = useState(false)
  const qualityRef = useRef(null)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef(null)
  const gridRowRef = useRef(null)
  const asideRef = useRef(null)

  useEffect(() => {
    const TOP_CLEARANCE = 92
    let rafId = null
    let lastWindowY = window.scrollY
    let manualPauseUntil = 0

    const animateSidebarScroll = () => {
      rafId = null
      const asideEl = asideRef.current
      const containerEl = gridRowRef.current
      if (!asideEl || !containerEl) return

      const maxAsideScroll = asideEl.scrollHeight - asideEl.clientHeight
      if (maxAsideScroll <= 1) return
      if (performance.now() < manualPauseUntil) return

      const containerRect = containerEl.getBoundingClientRect()
      const maxTravel = Math.max(1, containerRect.height - (window.innerHeight - TOP_CLEARANCE))
      const scrolledIntoSection = Math.max(0, TOP_CLEARANCE - containerRect.top)
      const progress = Math.min(1, Math.max(0, scrolledIntoSection / maxTravel))
      const targetScroll = maxAsideScroll * progress
      const diff = targetScroll - asideEl.scrollTop

      if (Math.abs(diff) <= 0.6) {
        asideEl.scrollTop = targetScroll
        return
      }

      asideEl.scrollTop += diff * 0.24
      rafId = window.requestAnimationFrame(animateSidebarScroll)
    }

    const startSync = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(animateSidebarScroll)
    }

    const handleWindowScroll = () => {
      if (Math.abs(window.scrollY - lastWindowY) > 0.2) {
        lastWindowY = window.scrollY
        manualPauseUntil = 0
        startSync()
      }
    }

    const handleAsideWheel = () => {
      manualPauseUntil = performance.now() + 900
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    const asideEl = asideRef.current
    startSync()
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    window.addEventListener('resize', startSync, { passive: true })
    asideEl?.addEventListener('wheel', handleAsideWheel, { passive: true })

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(startSync)
        : null
    if (ro) {
      if (asideEl) ro.observe(asideEl)
      if (gridRowRef.current) ro.observe(gridRowRef.current)
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleWindowScroll)
      window.removeEventListener('resize', startSync)
      asideEl?.removeEventListener('wheel', handleAsideWheel)
      if (ro) ro.disconnect()
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (qualityRef.current && !qualityRef.current.contains(event.target)) {
        setIsQualityOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const storeScopedProducts = useMemo(() => {
    if (!storeParam) return products
    return products.filter(
      (p) =>
        (p.stores && p.stores.some((s) => s.slug === storeParam)) ||
        p.shop?.slug === storeParam
    )
  }, [products, storeParam])

  const activeCategoryObj = useMemo(() => {
    if (activeCategory === 'All Produce') return null
    return (
      allCategoryObjects.find(
        (c) => (typeof c === 'string' ? c : c?.name) === activeCategory
      ) || activeCategory
    )
  }, [allCategoryObjects, activeCategory])

  const filtered = useMemo(() => {
    let list = [...storeScopedProducts]

    if (activeCategory !== 'All Produce') {
      list = list.filter((p) => doesProductMatchCategory(p, activeCategoryObj))
    }
    if (activeSubCategory) {
      list = list.filter(
        (p) =>
          p.sub_category?.name === activeSubCategory ||
          p.subCategoryName === activeSubCategory ||
          p.sub_category === activeSubCategory ||
          p.sub_category_name === activeSubCategory
      )
    }
    if (activeVariant) {
      list = list.filter((p) => p.variant === activeVariant)
    }
    if (inStockOnly) {
      list = list.filter((p) => p.inStock)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => {
        const subCatStr = (
          p.sub_category?.name ||
          p.subCategoryName ||
          (typeof p.sub_category === 'string' ? p.sub_category : '') ||
          p.sub_category_name ||
          ''
        ).toLowerCase()
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.origin || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          subCatStr.includes(q)
        )
      })
    }

    list = list.filter((p) => Number(p.price || 0) <= priceMax)

    if (sortBy === 'Price: Low to High') list.sort((a, b) => a.price - b.price)
    if (sortBy === 'Price: High to Low') list.sort((a, b) => b.price - a.price)
    if (sortBy === 'Promotional first') {
      list.sort((a, b) => (b.onSale ? 1 : 0) - (a.onSale ? 1 : 0))
    }

    return list
  }, [
    storeScopedProducts,
    activeCategory,
    activeCategoryObj,
    activeSubCategory,
    activeVariant,
    inStockOnly,
    searchQuery,
    priceMax,
    sortBy,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const visibleProducts = filtered.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  )

  function handleSelectCategory(cat) {
    setManualCategory(cat)
    setActiveSubCategory(null)
    setCurrentPage(1)
  }

  function clearFilters() {
    setManualCategory(defaultCategory)
    setActiveSubCategory(null)
    setActiveVariant(null)
    setInStockOnly(false)
    setUserPriceMax(null)
    setSortBy('Promotional first')
    setSearchQuery('')
    setCurrentPage(1)
  }

  function catCount(cat) {
    if (cat === 'All Produce') return storeScopedProducts.length
    const catObj = allCategoryObjects.find(
      (c) => (typeof c === 'string' ? c : c?.name) === cat
    )
    return storeScopedProducts.filter((p) =>
      doesProductMatchCategory(p, catObj || cat)
    ).length
  }

  function subCatCount(subCatName) {
    return storeScopedProducts.filter(
      (p) =>
        p.sub_category?.name === subCatName ||
        p.subCategoryName === subCatName ||
        p.sub_category === subCatName ||
        p.sub_category_name === subCatName
    ).length
  }

  const sortedVariants = useMemo(() => {
    const variants = new Set(productClasses)
    storeScopedProducts.forEach((p) => {
      if (p.variant) variants.add(p.variant)
    })
    const configured = [...productClasses]
    const others = Array.from(variants)
      .filter((v) => !configured.includes(v))
      .sort()
    return [...configured, ...others]
  }, [storeScopedProducts, productClasses])

  function variantCount(v) {
    return storeScopedProducts.filter((p) => p.variant === v).length
  }

  const hasActiveFilters =
    activeCategory !== defaultCategory ||
    Boolean(activeSubCategory) ||
    Boolean(activeVariant) ||
    inStockOnly ||
    priceMax < maxProductPrice ||
    Boolean(searchQuery)

  const sidebarProps = {
    categoryPills: CATEGORY_PILLS,
    allCategoryObjects,
    activeCategory,
    onSelectCategory: handleSelectCategory,
    activeSubCategory,
    onSelectSubCategory: (sub) => {
      setActiveSubCategory(sub)
      setCurrentPage(1)
    },
    catCount,
    subCatCount,
    sortedVariants,
    activeVariant,
    onSelectVariant: (variant) => {
      setActiveVariant(variant)
      setCurrentPage(1)
    },
    allProductsCount: storeScopedProducts.length,
    variantCount,
    priceMax,
    maxProductPrice,
    onPriceMaxChange: (val) => {
      setUserPriceMax(val)
      setCurrentPage(1)
    },
    inStockOnly,
    onInStockChange: (val) => {
      setInStockOnly(val)
      setCurrentPage(1)
    },
    hasActiveFilters,
    onClearFilters: clearFilters,
  }

  const shopBody = (
    <>
      {/* ── Main Two-Column Shop Canvas ── */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7 pb-14">
        <div
          ref={gridRowRef}
          className="flex flex-col md:flex-row items-start gap-5 lg:gap-6"
        >
          {/* Smooth Scroll-Synced Sticky Desktop Sidebar */}
          <aside
            ref={asideRef}
            className="hidden md:block w-[248px] lg:w-[260px] shrink-0 sticky top-[92px] max-h-[calc(100vh-108px)] overflow-y-auto stores-scroll px-1.5 -mx-1.5 pt-0.5 pb-3 space-y-4"
          >
            <ShopFilterCard {...sidebarProps} />
            <SupportFarmersCard />
          </aside>

          {/* Right Product Toolbar, Grid/List & Pagination */}
          <div className="flex-1 min-w-0 w-full">
            {/* Pill Filter & Sort Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Sort Pill Label */}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B462B] px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Sort by:</span>
                </span>

                {/* Sort Dropdown */}
                <div className="relative" ref={sortRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#DCE8DF] hover:border-[#9EC4AA] px-3.5 py-2 text-[12.5px] font-semibold text-[#1A3324] shadow-[0_2px_8px_rgba(8,80,65,0.04)] transition-colors cursor-pointer"
                  >
                    <span>{sortBy}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#526B5D]" />
                  </button>

                  {isSortOpen && (
                    <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-48 rounded-2xl bg-white border border-[#DCE8DF] p-1.5 shadow-[0_12px_30px_rgba(8,80,65,0.12)]">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => {
                            setSortBy(opt)
                            setCurrentPage(1)
                            setIsSortOpen(false)
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-[12.5px] transition-colors cursor-pointer ${
                            sortBy === opt
                              ? 'bg-[#E5F2E6] text-[#0B462B] font-bold'
                              : 'text-[#354B3F] font-medium hover:bg-[#F3F9F4]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="hidden sm:block h-5 w-[1px] bg-[#D1DFD4]" />

                {/* Quality Dropdown */}
                <div className="relative" ref={qualityRef}>
                  <button
                    type="button"
                    onClick={() => setIsQualityOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#DCE8DF] hover:border-[#9EC4AA] px-3.5 py-2 text-[12.5px] shadow-[0_2px_8px_rgba(8,80,65,0.04)] transition-colors cursor-pointer"
                  >
                    <span className="text-[#5B7063]">Quality:</span>
                    <span className="font-semibold text-[#1A3324]">
                      {activeVariant || 'All Qualities'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#526B5D]" />
                  </button>

                  {isQualityOpen && (
                    <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-48 rounded-2xl bg-white border border-[#DCE8DF] p-1.5 shadow-[0_12px_30px_rgba(8,80,65,0.12)]">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveVariant(null)
                          setCurrentPage(1)
                          setIsQualityOpen(false)
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-[12.5px] flex items-center justify-between transition-colors cursor-pointer ${
                          activeVariant === null
                            ? 'bg-[#E5F2E6] text-[#0B462B] font-bold'
                            : 'text-[#354B3F] font-medium hover:bg-[#F3F9F4]'
                        }`}
                      >
                        <span>All Qualities</span>
                        <span className="text-[11px] text-[#73877B]">
                          {storeScopedProducts.length}
                        </span>
                      </button>

                      {sortedVariants.map((variant) => (
                        <button
                          type="button"
                          key={variant}
                          onClick={() => {
                            setActiveVariant(variant)
                            setCurrentPage(1)
                            setIsQualityOpen(false)
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-[12.5px] flex items-center justify-between transition-colors cursor-pointer ${
                            activeVariant === variant
                              ? 'bg-[#E5F2E6] text-[#0B462B] font-bold'
                              : 'text-[#354B3F] font-medium hover:bg-[#F3F9F4]'
                          }`}
                        >
                          <span>{variant}</span>
                          <span className="text-[11px] text-[#73877B]">
                            {variantCount(variant)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="hidden sm:block h-5 w-[1px] bg-[#D1DFD4]" />

                {/* Product Count Soft Emerald Pill */}
                <span className="inline-flex items-center rounded-full bg-[#E3F1E5] border border-[#CFE3D2] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#2E693B]">
                  {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
                </span>
              </div>

              {/* Search Pill + Mobile Filter Trigger + Grid/List View Switcher */}
              <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-between sm:justify-end">
                <div className="relative flex items-center flex-1 sm:flex-initial sm:w-[175px] lg:w-[205px] rounded-full bg-white border border-[#DCE8DF] focus-within:border-[#0B462B] px-3 py-1.5 shadow-[0_2px_8px_rgba(8,80,65,0.04)] transition-colors">
                  <Search className="w-3.5 h-3.5 text-[#6D8577] shrink-0 mr-1.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Search produce..."
                    aria-label="Search produce"
                    className="w-full bg-transparent text-[12.5px] text-[#173023] placeholder:text-[#7B8E82] outline-none border-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setCurrentPage(1)
                      }}
                      aria-label="Clear search"
                      className="text-[#7B8E82] hover:text-[#0B462B] cursor-pointer ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMobileFilter(true)}
                  className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-white border border-[#DCE8DF] px-3.5 py-2 text-[12.5px] font-semibold text-[#0B462B] shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                {/* Grid / List View Switcher Circles */}
                <div className="hidden sm:inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#0B462B] text-white shadow-xs'
                        : 'bg-white border border-[#DCE8DF] text-[#435A4C] hover:border-[#9EC4AA] hover:text-[#0B462B]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#0B462B] text-white shadow-xs'
                        : 'bg-white border border-[#DCE8DF] text-[#435A4C] hover:border-[#9EC4AA] hover:text-[#0B462B]'
                    }`}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid or List */}
            {visibleProducts.length === 0 ? (
              <ShopEmptyState onClearFilters={clearFilters} />
            ) : viewMode === 'list' ? (
              <div className="flex flex-col gap-4">
                {visibleProducts.map((p, idx) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={idx}
                    layout="list"
                    notified={!!notified[p.id]}
                    onNotify={() => setNotified((n) => ({ ...n, [p.id]: true }))}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {visibleProducts.map((p, idx) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={idx}
                    layout="grid"
                    notified={!!notified[p.id]}
                    onNotify={() => setNotified((n) => ({ ...n, [p.id]: true }))}
                  />
                ))}
              </div>
            )}

            {/* Circular Pagination */}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </section>

      {/* ── Mobile Slide-Up Filter Drawer ── */}
      {showMobileFilter && (
        <div
          className="fixed inset-0 z-50 md:hidden flex flex-col bg-black/40 backdrop-blur-[1px]"
          onClick={() => setShowMobileFilter(false)}
        >
          <div
            className="mt-auto rounded-t-3xl bg-[#EFF9F2] max-h-[85vh] overflow-y-auto px-4 pt-4 pb-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center">
              <div className="w-10 h-1 rounded-full bg-[#B9CBBF]" />
            </div>

            <div className="flex items-center justify-between px-1">
              <h2
                className="text-[22px] font-bold text-[#173023]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setShowMobileFilter(false)}
                aria-label="Close filters"
                className="w-8 h-8 rounded-full bg-white border border-[#DCE8DF] flex items-center justify-center text-[#173023] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ShopFilterCard {...sidebarProps} />

            <button
              type="button"
              onClick={() => setShowMobileFilter(false)}
              className="w-full py-3.5 rounded-full font-bold text-sm text-white bg-[#0B462B] hover:bg-[#07331F] shadow-sm cursor-pointer"
            >
              Show {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </button>
          </div>
        </div>
      )}
    </>
  )

  if (syncHeroMeta) {
    return shopBody
  }

  return (
    <div className="min-h-screen bg-[#EFF9F2]">
      <ShopHeroBanner
        activeCategory={activeCategory}
        activeSubCategory={activeSubCategory}
        isInternalWholesale={isInternalWholesale}
      />
      {shopBody}
    </div>
  )
}
