'use client'
// src/app/shop/ProductListingClient.jsx

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import ProductCard from '@/app/components/ProductCard'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const SORT_OPTIONS = ['Promotional first', 'Price: Low to High', 'Price: High to Low', 'Newest arrivals']

// ─── Icons 
function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}
function FilterIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  )
}
function ChevronDown() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: '44px', height: '24px',
        borderRadius: '999px', background: checked ? '#00694c' : '#BCCAC1',
        flexShrink: 0, overflow: 'hidden', transition: 'background 0.2s',
        border: 'none', cursor: 'pointer',
      }}
    >
      <span style={{
        position: 'absolute', top: '2px', left: '2px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s',
      }} />
    </button>
  )
}

// ─── Pagination Component ───────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    let pages = []
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
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#BCCAC1]/40 text-[#151E13] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-white cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {getVisiblePages().map((page, idx) => (
        page === '...' ? (
          <span key={`dots-${idx}`} className="text-[#6D7A73]">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer ${
              currentPage === page 
                ? 'bg-[#00694C] text-white' 
                : 'border border-[#BCCAC1]/40 text-[#151E13] hover:bg-white'
            }`}
          >
            {page}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#BCCAC1]/40 text-[#151E13] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-white cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Props:
//   initialProducts — array of products fetched server-side from the API
//   categories      — ['All', 'Fruits', 'Vegetables', ...] from the API
//   productClasses  — ['Class A', 'Class B', ...] from site settings
export default function ProductListingClient({ initialProducts = [], categories = [], productClasses = [] }) {

  const [products, setProducts] = useState(initialProducts)
  const [cats, setCats] = useState(categories)

  const fetchFresh = useCallback(async () => {
    try {
      const res = await fetch('/api/products-fresh')
      if (!res.ok) return
      const data = await res.json()
      setProducts(data.products)
      setCats(data.categories)
    } catch (e) {
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchFresh, 10_000) // 10 সেকেন্ড
    return () => clearInterval(interval)
  }, [fetchFresh])

  const searchParams = useSearchParams()
  const initialCatParam = searchParams.get('category')

  const CATEGORY_PILLS = ['All Produce', ...categories.filter(c => c.name !== 'All' && c.name !== 'On Sale').map(c => c.name)]

  const initCat = initialCatParam && CATEGORY_PILLS.includes(initialCatParam) ? initialCatParam : 'All Produce'

  const [activeCategory, setActiveCategory]   = useState(initCat)
  const [activeSubCategory, setActiveSubCategory] = useState(null)
  const [activeVariant, setActiveVariant] = useState(null)
  const [sortBy, setSortBy]                   = useState('Promotional first')
  const [inStockOnly, setInStockOnly]         = useState(false)
  const maxProductPrice = useMemo(
    () => Math.ceil(Math.max(...products.map(p => p.price), 50)),  
    [products]
)
  const [priceMax, setPriceMax] = useState(maxProductPrice)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [currentPage, setCurrentPage]         = useState(1)
  const itemsPerPage = 6
  const [notified, setNotified]               = useState({})
  const [searchQuery, setSearchQuery]         = useState('')
  
  const [isQualityOpen, setIsQualityOpen]     = useState(false)
  const qualityRef                            = useRef(null)
  const [isSortOpen, setIsSortOpen]           = useState(false)
  const sortRef                               = useRef(null)

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

  // Map "All Produce" → "All" for data layer
  const dataCat = activeCategory === 'All Produce' ? 'All' : activeCategory

  const filtered = useMemo(() => {
    let list = [...products]

    const storeParam = searchParams.get('store')
    if (storeParam)             list = list.filter(p => (p.stores && p.stores.some(s => s.slug === storeParam)) || p.shop?.slug === storeParam)

    if (dataCat !== 'All')      list = list.filter(p => p.category === dataCat)
    if (activeSubCategory)      list = list.filter(p => p.sub_category?.name === activeSubCategory || p.sub_category === activeSubCategory || p.sub_category_name === activeSubCategory)
    if (activeVariant)          list = list.filter(p => p.variant === activeVariant)
    if (dataCat === 'On Sale')  list = list.filter(p => p.onSale)
    if (inStockOnly)            list = list.filter(p => p.inStock)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => {
        const subCatStr = (p.sub_category?.name || (typeof p.sub_category === 'string' ? p.sub_category : '') || p.sub_category_name || '').toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.origin?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          subCatStr.includes(q)
        )
      })
    }
    list = list.filter(p => p.price <= priceMax)

    if (sortBy === 'Price: Low to High') list.sort((a, b) => a.price - b.price)
    if (sortBy === 'Price: High to Low') list.sort((a, b) => b.price - a.price)
    if (sortBy === 'Promotional first')  list.sort((a, b) => (b.onSale ? 1 : 0) - (a.onSale ? 1 : 0))

    return list
  },  [products, dataCat, activeSubCategory, activeVariant, inStockOnly, priceMax, sortBy, searchQuery, searchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [dataCat, activeSubCategory, activeVariant, inStockOnly, priceMax, sortBy, searchQuery, searchParams])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const visibleProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  function clearFilters() {
    setActiveCategory('All Produce')
    setActiveSubCategory(null)
    setActiveVariant(null)
    setInStockOnly(false)
    setPriceMax(50)
    setSortBy('Promotional first')
    setSearchQuery('')
  }

  function catCount(cat) {
    let list = products
    const storeParam = searchParams.get('store')
    if (storeParam) list = list.filter(p => (p.stores && p.stores.some(s => s.slug === storeParam)) || p.shop?.slug === storeParam)

    if (cat === 'All Produce') return list.length 
    return list.filter(p => p.category === cat).length 
  }
  
  function subCatCount(subCatName) {
    let list = products
    const storeParam = searchParams.get('store')
    if (storeParam) list = list.filter(p => (p.stores && p.stores.some(s => s.slug === storeParam)) || p.shop?.slug === storeParam)

    return list.filter(p => p.sub_category?.name === subCatName || p.sub_category === subCatName || p.sub_category_name === subCatName).length
  }
  
  const availableVariants = useMemo(() => {
    const variants = new Set(productClasses)
    products.forEach(p => {
      if (p.variant) variants.add(p.variant)
    })
    return Array.from(variants) // Do not sort because we want to preserve the admin dashboard order for productClasses, or we can sort if they prefer. The user didn't specify, so preserving original order or appending others is fine. Actually, let's keep the dashboard order first, then append any stray variants, then return.
  }, [products, productClasses])

  // Better sorting logic to keep configured classes first
  const sortedVariants = useMemo(() => {
      const configured = [...productClasses];
      const others = availableVariants.filter(v => !configured.includes(v)).sort();
      return [...configured, ...others];
  }, [availableVariants, productClasses])

  function variantCount(v) {
    let list = products
    const storeParam = searchParams.get('store')
    if (storeParam) list = list.filter(p => (p.stores && p.stores.some(s => s.slug === storeParam)) || p.shop?.slug === storeParam)
    return list.filter(p => p.variant === v).length
  }
  
  // ── Empty State ───────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-10 md:py-16 px-4 text-center rounded-2xl md:rounded-3xl" style={{ background: 'linear-gradient(to bottom, #ffffff, #f9fcf6)', border: '1px dashed rgba(188, 202, 193, 0.5)' }}>
      <div className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mb-4 md:mb-5" style={{ background: 'linear-gradient(135deg, #f2fdea 0%, #e7f1df 100%)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 8px 24px rgba(0, 105, 76, 0.06)' }}>
        <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 24 24" fill="none" stroke="#00694C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="7" />
          <path d="M21 21l-6-6" />
          <path d="M8 10h4" />
        </svg>
        <div className="absolute top-1 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-[#adedd8] rounded-full shadow-sm" />
        <div className="absolute bottom-2 left-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-[#00694c] opacity-30 rounded-full" />
        <div className="absolute top-1/2 -right-2 w-1 h-1 md:w-1.5 md:h-1.5 bg-[#BCCAC1] rounded-full" />
      </div>
      
      <h3 className="text-xl md:text-2xl" style={{ fontFamily: '"Newsreader", Georgia, serif', fontWeight: 700, color: '#151e13', marginBottom: '6px' }}>
        No products found
      </h3>
      <p className="text-xs md:text-sm" style={{ color: '#6D7A73', maxWidth: '280px', marginBottom: '0', lineHeight: 1.5 }}>
        We couldn't find anything matching your current filters. Try adjusting your search or categories.
      </p>
    </div>
  )

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="space-y-8">

      {/* Category */}
      <div>
        <h3 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#151e13', marginBottom: '16px' }}>
          Category
        </h3>
        <div className="space-y-2.5">
          {CATEGORY_PILLS.map((cat, index) => {
            const isActive = activeCategory === cat
            const categoryObj = categories.find(c => c.name === cat)
            const subcategories = categoryObj?.subcategories || []
            
            return (
              <div key={`sidebar-${cat}-${index}`}>
                <button
                  onClick={() => {
                    if (isActive && cat !== 'All Produce') {
                      setActiveCategory('All Produce');
                      setActiveSubCategory(null);
                    } else {
                      setActiveCategory(cat);
                      setActiveSubCategory(null);
                    }
                  }}
                  className="flex items-center justify-between w-full text-left gap-2"
                  style={{ opacity: isActive ? 1 : 0.65, border: 'none', background: 'none', cursor: 'pointer', padding: '2px 0' }}
                >
                  <span className="truncate" style={{ fontSize: '14px', fontWeight: isActive ? 700 : 500, color: isActive ? '#00694c' : '#151e13', flex: 1 }}>
                    {cat}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                    style={{ background: isActive ? '#adedd8' : '#e7f1df', color: isActive ? '#2f6d5d' : '#6D7A73' }}
                  >
                    {catCount(cat)}
                  </span>
                </button>
                {isActive && subcategories.length > 0 && (
                  <div className="ml-4 mt-2 space-y-2 border-l-2 border-[#e7f1df] pl-3">
                    {subcategories.map((sub, idx) => {
                      const isSubActive = activeSubCategory === sub.name
                      return (
                        <button
                          key={`sub-${sub.id}-${idx}`}
                          onClick={() => setActiveSubCategory(isSubActive ? null : sub.name)}
                          className="flex items-center justify-between w-full text-left gap-2"
                          style={{ opacity: isSubActive ? 1 : 0.65, border: 'none', background: 'none', cursor: 'pointer', padding: '2px 0' }}
                        >
                          <span className="truncate" style={{ fontSize: '13px', fontWeight: isSubActive ? 600 : 400, color: isSubActive ? '#00694c' : '#151e13', flex: 1 }}>
                            {sub.name}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                            style={{ background: isSubActive ? '#adedd8' : '#f1f5f9', color: isSubActive ? '#2f6d5d' : '#94a3b8' }}
                          >
                            {subCatCount(sub.name)}
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

      {/* Price Range */}
      <div>
        <h3 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#151e13', marginBottom: '16px' }}>
          Price Range
        </h3>
        <input
          type="range" min={0} max={maxProductPrice} value={priceMax}
          onChange={e => setPriceMax(Number(e.target.value))}
          className="w-full cursor-pointer" style={{ accentColor: '#00694c', height: '4px' }}
        />
        <div className="flex justify-between mt-3">
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#151e13' }}>€0</span>
          {/* <span style={{ fontSize: '13px', fontWeight: 700, color: '#00694c' }}>€0</span> */}
          <span>€{priceMax === maxProductPrice ? `${maxProductPrice}+` : priceMax}</span>

        </div>
      </div>

      {/* In Stock */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#151e13' }}>In Stock Only</span>
        <Toggle checked={inStockOnly} onChange={setInStockOnly} />
      </div>

      {/* Clear */}
      <button
        onClick={clearFilters}
        className="w-full py-3 rounded-lg text-sm font-bold"
        style={{ border: '1px solid rgba(0,105,76,0.2)', color: '#00694c', background: 'transparent', cursor: 'pointer' }}
      >
        Clear filters
      </button>
    </aside>
  )

  return (
    <div style={{ background: '#f9fcf6', minHeight: '100vh' }} className='pb-10'>

      {/*  DESKTOP  */}
      <div className="hidden md:block">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 py-5" style={{ fontSize: '13px', color: '#6D7A73' }}>
            <Link href="/" style={{ color: '#6D7A73' }} className="hover:text-[#00694c]">Home</Link>
            <ChevronRight />
            <span style={{ color: '#151e13' }}>{activeCategory}</span>
          </nav>

          {/* Page header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-0 mb-8">
            <div>
              <h1 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '40px', fontStyle: 'italic', color: '#151e13', lineHeight: 1.1, marginBottom: '6px' }}>
                {activeCategory}
              </h1>
              <p style={{ fontSize: '13px', color: '#6D7A73', fontWeight: 500 }}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl px-4 py-2.5 w-full lg:w-auto"
              style={{ border: '0.5px solid rgba(188,202,193,0.35)', boxShadow: '0 1px 6px rgba(0,33,21,0.04)' }}>

              {/* Search */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[200px] lg:max-w-[260px]"
                style={{ background: '#f2fdea', border: '1px solid rgba(0,105,76,0.1)' }}>
                <span className="text-[#6D7A73] shrink-0"><SearchIcon /></span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search produce, origin…"
                  className="bg-transparent outline-none w-full"
                  style={{ fontSize: '13px', color: '#151e13', border: 'none' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#BCCAC1' }}>
                    <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-6 shrink-0" style={{ background: 'rgba(188,202,193,0.4)' }} />

              {/* Sort */}
              <div className="flex items-center gap-2 shrink-0">
                <svg width="13" height="13" fill="none" stroke="#6D7A73" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="10" y1="18" x2="14" y2="18"/>
                </svg>
                <span style={{ fontSize: '12px', color: '#6D7A73', fontWeight: 500 }}>Sort:</span>
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center justify-between pl-3 pr-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 min-w-[150px]"
                    style={{ 
                      background: isSortOpen ? '#fff' : '#f9fcf6', 
                      border: `1px solid ${isSortOpen ? '#00694c' : 'rgba(0,105,76,0.1)'}`, 
                      color: '#151e13', 
                      cursor: 'pointer',
                      boxShadow: isSortOpen ? '0 4px 12px rgba(0,105,76,0.08)' : 'none'
                    }}
                  >
                    <span className="truncate">{sortBy}</span>
                    <span className="ml-2 transition-transform duration-200 shrink-0" style={{ transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#6D7A73' }}>
                      <ChevronDown />
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isSortOpen && (
                    <div 
                      className="absolute top-full right-0 lg:left-0 mt-2 w-[180px] bg-white rounded-xl overflow-hidden z-50"
                      style={{ 
                        border: '1px solid rgba(0,105,76,0.1)', 
                        boxShadow: '0 8px 24px rgba(0,33,21,0.08)',
                        animation: 'dropdownFade 0.2s ease forwards'
                      }}
                    >
                      {SORT_OPTIONS.map(o => (
                        <button
                          key={o}
                          onClick={() => { setSortBy(o); setIsSortOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#f9fcf6]"
                          style={{ 
                            background: sortBy === o ? '#f2fdea' : 'transparent',
                            color: sortBy === o ? '#00694c' : '#151e13',
                            cursor: 'pointer'
                          }}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quality */}
              {sortedVariants.length > 0 && (
                <>
                  <div className="w-px h-6 shrink-0" style={{ background: 'rgba(188,202,193,0.4)' }} />
                  <div className="flex items-center gap-2 shrink-0 relative" ref={qualityRef}>
                    <span style={{ fontSize: '12px', color: '#6D7A73', fontWeight: 500 }}>Quality:</span>
                    <button
                      onClick={() => setIsQualityOpen(!isQualityOpen)}
                      className="flex items-center justify-between pl-3 pr-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 min-w-[120px]"
                      style={{ 
                        background: isQualityOpen ? '#fff' : '#f9fcf6', 
                        border: `1px solid ${isQualityOpen ? '#00694c' : 'rgba(0,105,76,0.1)'}`, 
                        color: activeVariant ? '#00694c' : '#151e13', 
                        cursor: 'pointer',
                        boxShadow: isQualityOpen ? '0 4px 12px rgba(0,105,76,0.08)' : 'none'
                      }}
                    >
                      <span>{activeVariant ? activeVariant : 'All Qualities'}</span>
                      <span className="ml-2 transition-transform duration-200" style={{ transform: isQualityOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#6D7A73' }}>
                        <ChevronDown />
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isQualityOpen && (
                      <div 
                        className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl overflow-hidden z-50"
                        style={{ 
                          border: '1px solid rgba(0,105,76,0.1)', 
                          boxShadow: '0 8px 24px rgba(0,33,21,0.08)',
                          animation: 'dropdownFade 0.2s ease forwards'
                        }}
                      >
                        <style>{`
                          @keyframes dropdownFade {
                            from { opacity: 0; transform: translateY(-4px); }
                            to { opacity: 1; transform: translateY(0); }
                          }
                        `}</style>
                        <button
                          onClick={() => { setActiveVariant(null); setIsQualityOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
                          style={{ 
                            background: !activeVariant ? '#f2fdea' : 'transparent',
                            color: !activeVariant ? '#00694c' : '#151e13',
                            cursor: 'pointer'
                          }}
                        >
                          All Qualities
                        </button>
                        {sortedVariants.map(v => (
                          <button
                            key={v}
                            onClick={() => { setActiveVariant(v); setIsQualityOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#f9fcf6]"
                            style={{ 
                              background: activeVariant === v ? '#f2fdea' : 'transparent',
                              color: activeVariant === v ? '#00694c' : '#151e13',
                              cursor: 'pointer'
                            }}
                          >
                            <span>{v}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                              style={{ 
                                background: activeVariant === v ? 'rgba(0,105,76,0.1)' : '#f2fdea',
                                color: activeVariant === v ? '#00694c' : '#6D7A73'
                              }}
                            >
                              {variantCount(v)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="w-px h-6 shrink-0" style={{ background: 'rgba(188,202,193,0.4)' }} />

              {/* Result count */}
              <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'var(--search-color)', color: 'var(--common-color)' }}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Main layout */}
          <div className="flex gap-12">

            {/* Sidebar */}
            <div style={{ width: '240px', flexShrink: 0 }}>
              <div className="sticky" style={{ top: '80px' }}>
                {Sidebar()}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">


              {/* Product grid */}
              {visibleProducts.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-8">
                  {visibleProducts.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      notified={!!notified[p.id]}
                      onNotify={() => setNotified(n => ({ ...n, [p.id]: true }))}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
              />
            </div>
          </div>
        </div>
      </div>

      {/*  MOBILE */}
      <div className="md:hidden" style={{ paddingBottom: '100px' }}>

        {/* Sub-header */}
        <div style={{ background: '#f4fbf0', padding: '16px 20px 0' }}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '36px', fontWeight: 700, color: '#151e13', lineHeight: 1.1 }}>
                Market
              </h1>
              <p style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#00694c', opacity: 0.8 }}>
                Fresh from the garden
              </p>
            </div>
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#fff', border: '1px solid rgba(188,202,193,0.3)', color: '#151e13', boxShadow: '0 1px 4px rgba(0,33,21,0.06)' }}
            >
              <FilterIcon />
              Filter
              {(inStockOnly || priceMax < 50) && (
                <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: '#00694c', color: '#fff' }}>
                  {(inStockOnly ? 1 : 0) + (priceMax < 50 ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {showMobileFilter && (
          <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowMobileFilter(false)}
          >
            <div
              className="mt-auto rounded-t-3xl overflow-y-auto"
              style={{ background: '#f9fcf6', maxHeight: '80vh', padding: '24px 20px 40px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center mb-6">
                <div className="w-10 h-1 rounded-full" style={{ background: '#BCCAC1' }} />
              </div>
              <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#151e13', marginBottom: '24px' }}>
                Filters
              </h2>
              {Sidebar()}
              <button
                onClick={() => setShowMobileFilter(false)}
                className="w-full py-4 rounded-xl font-bold text-sm text-white mt-6"
                style={{ background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)', border: 'none' }}
              >
                Show {filtered.length} products
              </button>
            </div>
          </div>
        )}

        {/* Product count */}
        <div style={{ padding: '16px 20px 8px' }}>
          <p style={{ fontSize: '12px', color: '#6D7A73' }}>
            <span style={{ fontWeight: 700, color: '#151e13' }}>{filtered.length}</span> products found
          </p>
        </div>

        {/* Mobile grid */}
        <div style={{ padding: '0 16px' }}>
          {visibleProducts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {visibleProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  notified={!!notified[p.id]}
                  onNotify={() => setNotified(n => ({ ...n, [p.id]: true }))}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="pb-8">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}