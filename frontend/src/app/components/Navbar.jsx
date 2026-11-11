'use client'
// src/app/components/Navbar.jsx
import Image from 'next/image'
import { useSafeSession } from '@/lib/useSafeSession'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  MapPin,
  Store,
  Users,
  Package,
  ChevronDown,
  Search,
  Bell,
  ShoppingBag,
  LogIn,
  X,
  Menu,
} from 'lucide-react'
import { useCart } from '@/app/context/CartContext'
import { useAuth } from '@/app/context/AuthContext'
import AuthModal from '@/app/components/AuthModal'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const MEDIA_BASE = API_BASE.replace(/\/api$/, '')

function resolveLogoUrl(url) {
  if (!url) return '/el-erbol-logo.png'
  if (url.startsWith('/media/')) return `${MEDIA_BASE}${url}`
  return url
}

const navLinks = [
  { label: 'Home',         href: '/',          Icon: Home },
  { label: 'Find a Store', href: '/stores',    Icon: MapPin },
  { label: 'Our Shop',     href: '/shop',      Icon: Store },
  { label: 'About Us',     href: '/about',     Icon: Users },
  { label: 'Wholesale',    href: '/wholesale', Icon: Package },
]

// ── Profile Menu ─────────────────────────────────────────────────────────────
function ProfileMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    function handler(e) {
      if (!menuRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const avatarUrl = user?.profile?.resolvedAvatar || ''
  const initials =
    ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?'
  const displayName = user?.fullName || user?.firstName || user?.email || 'My Account'

  async function handleLogout() {
    setOpen(false)
    await logout()
    router.push('/')
  }

  const menuItems = [
    { label: 'My Profile',  icon: 'person',          href: '/profile' },
    { label: 'My Orders',   icon: 'receipt_long',    href: '/profile?tab=orders' },
    { label: 'Saved Items', icon: 'favorite_border', href: '/profile?tab=saved' },
    { label: 'Settings',    icon: 'settings',        href: '/profile?tab=settings' },
  ]

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full text-white font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer border-none whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #0F4E31 0%, #0B3C25 100%)',
          fontSize: '12.5px',
          padding: '6px 13px 6px 7px',
        }}
      >
        <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={28} height={28} className="object-cover" />
          ) : (
            <span className="text-[10.5px] font-bold text-white leading-none">{initials}</span>
          )}
        </div>
        <span className="truncate max-w-[92px]">{displayName.split(' ')[0]}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/90 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+12px)] w-[224px] bg-[#FAFCF9] rounded-2xl border border-[#C8DEC8] overflow-hidden z-50"
          style={{
            boxShadow: '0 14px 40px rgba(12, 68, 41, 0.16), 0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="px-4 py-3 border-b border-[#E0ECE0]">
            <p className="text-[13.5px] font-semibold text-[#0C4429] truncate m-0">{displayName}</p>
            <p className="text-[12px] text-[#4B6A5F] truncate mt-0.5 mb-0">{user?.email}</p>
          </div>
          <div className="py-1.5">
            {menuItems.map(({ label, icon, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#123027] no-underline hover:bg-[#EAF5EE] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0C4429]">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="border-t border-[#E0ECE0] py-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 bg-transparent border-none cursor-pointer text-[13px] text-[#C84040] text-left hover:bg-[#FFF5F5] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar({ navbarLogoUrl = '', brandName = 'El Árbol', navbarTagline = '' }) {
  const { user, isAuthenticated, logout, authFetch } = useAuth()
  const { data: session } = useSafeSession()

  const [liveBranding, setLiveBranding] = useState(null)
  const [failedLogoSrc, setFailedLogoSrc] = useState(null)

  const isWholesaleUser = !!session?.user?.accessToken
  const isInternalWholesale =
    isWholesaleUser &&
    (!session?.user?.userType ||
      session?.user?.userType === 'WHOLESALER' ||
      session?.user?.user_type === 'WHOLESALER' ||
      session?.user?.userType === 'internal')

  const wholesaleName =
    session?.user?.businessName ||
    session?.user?.contactName ||
    session?.user?.name ||
    'Wholesale'
  const wholesaleInitial = wholesaleName[0].toUpperCase()

  const [scrolled, setScrolled]                   = useState(false)
  const [open, setOpen]                           = useState(false)
  const [authOpen, setAuthOpen]                   = useState(false)
  const [authMode, setAuthMode]                   = useState('login')
  const [query, setQuery]                         = useState('')
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false)
  const [showDropdown, setShowDropdown]           = useState(false)
  const [activeIndex, setActiveIndex]             = useState(-1)
  const [mobileSearchOpen, setMobileSearchOpen]   = useState(false)
  const [allProducts, setAllProducts]             = useState([])
  const [unreadCount, setUnreadCount]             = useState(0)
  const searchProductsLoadedRef = useRef(false)
  const searchProductsLoadingRef = useRef(false)

  // Sync brand logo & name dynamically with backend site-config during idle time
  useEffect(() => {
    let active = true
    const propsKey = `${navbarLogoUrl || ''}|${brandName || ''}`

    async function loadSiteBranding() {
      try {
        const res = await fetch(`${API_BASE}/website/site-config/?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!active || !data) return
        setLiveBranding({
          forPropsKey: propsKey,
          navbarLogoUrl: data.navbar_logo_url || data.logo_url || '',
          brandName: data.brand_name || '',
          navbarTagline: data.navbar_tagline || '',
        })
      } catch {
        /* fallback to SSR props */
      }
    }

    // SSR RootLayout already passes site-config props; defer re-sync until browser is idle
    let idleId
    let timeoutId
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => loadSiteBranding(), { timeout: 2500 })
    } else {
      timeoutId = window.setTimeout(loadSiteBranding, 1500)
    }

    const handleSettingsUpdate = (e) => {
      const detailLogo = e?.detail?.navbar_logo_url || e?.detail?.logo_url
      const detailName = e?.detail?.brand_name
      if (detailLogo || detailName) {
        setLiveBranding((prev) => ({
          forPropsKey: propsKey,
          navbarLogoUrl: detailLogo ?? prev?.navbarLogoUrl ?? navbarLogoUrl,
          brandName: detailName ?? prev?.brandName ?? brandName,
          navbarTagline: e?.detail?.navbar_tagline ?? prev?.navbarTagline ?? navbarTagline,
        }))
      }
      loadSiteBranding()
    }

    window.addEventListener('site_settings_updated', handleSettingsUpdate)
    return () => {
      active = false
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) window.clearTimeout(timeoutId)
      window.removeEventListener('site_settings_updated', handleSettingsUpdate)
    }
  }, [navbarLogoUrl, brandName, navbarTagline])

  const currentPropsKey = `${navbarLogoUrl || ''}|${brandName || ''}`
  const activeLive = liveBranding?.forPropsKey === currentPropsKey ? liveBranding : null
  const activeBrandName = activeLive?.brandName || brandName || 'El Árbol'
  const activeTagline = activeLive?.navbarTagline || navbarTagline || 'Fresh. Local. Together.'
  const resolvedLogo = resolveLogoUrl(activeLive?.navbarLogoUrl || navbarLogoUrl || '/el-erbol-logo.png')
  const showImageLogo = Boolean(resolvedLogo) && failedLogoSrc !== resolvedLogo

  // Sticky floating pill scroll transition with hysteresis to prevent bounce
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled((prev) => {
        if (!prev && y > 36) return true
        if (prev && y < 12) return false
        return prev
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch products for live search autocomplete lazily (on search open or browser idle)
  const loadSearchProducts = useCallback(() => {
    if (searchProductsLoadedRef.current || searchProductsLoadingRef.current) return
    searchProductsLoadingRef.current = true
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
    const mediaBase = base.replace('/api', '')

    fetch(`${base}/products/products/`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.results || []
        searchProductsLoadedRef.current = true
        setAllProducts(
          arr.map((p) => {
            let image = p.thumbnail || p.thumbnail_url || p.image_url || p.image || null
            if (image && !image.startsWith('http')) {
              const clean = image.replace(/^\/+/, '')
              image = `${mediaBase}/${clean}`
            }
            const PLACEHOLDER = '/homepage/prod_apple.jpg'
            const originalPrice = Number(p.price || 0)
            const discountPrice = p.discount_price != null ? Number(p.discount_price) : null
            const displayPrice =
              discountPrice && discountPrice < originalPrice ? discountPrice : originalPrice
            const onSale = discountPrice != null && discountPrice < originalPrice
            const category =
              typeof p.category === 'object' && p.category !== null
                ? p.category.name
                : p.sub_category?.category?.name || p.category || ''

            return {
              ...p,
              image: image || PLACEHOLDER,
              price: displayPrice,
              oldPrice: onSale ? originalPrice : null,
              onSale,
              category,
              slug: p.slug || null,
            }
          })
        )
      })
      .catch(() => {})
      .finally(() => {
        searchProductsLoadingRef.current = false
      })
  }, [])

  useEffect(() => {
    let idleId
    let timeoutId
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => loadSearchProducts(), { timeout: 3500 })
    } else {
      timeoutId = window.setTimeout(loadSearchProducts, 2500)
    }
    return () => {
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [loadSearchProducts])

  // Fetch unread notification count when authenticated
  const canViewNotifications = isAuthenticated || (isWholesaleUser && !isInternalWholesale)
  const displayUnreadCount = canViewNotifications ? unreadCount : 0

  useEffect(() => {
    if (!canViewNotifications) return

    async function fetchCount() {
      try {
        let res
        if (isAuthenticated) {
          res = await authFetch(`${API_BASE}/auth/notifications/unread-count/`)
        } else if (isWholesaleUser && session?.user?.accessToken) {
          res = await fetch(`${API_BASE}/wholesale/notifications/unread-count/`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
          })
        }

        if (res?.ok) {
          const data = await res.json()
          setUnreadCount(data.unread_count ?? data.unreadCount ?? 0)
        }
      } catch {
        /* ignore */
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 10_000)
    return () => clearInterval(interval)
  }, [canViewNotifications, isAuthenticated, isWholesaleUser, session, authFetch])

  const filtered =
    query.trim().length > 0
      ? allProducts
          .filter(
            (p) =>
              p.name?.toLowerCase().includes(query.toLowerCase()) ||
              p.category?.toLowerCase().includes(query.toLowerCase()) ||
              p.origin?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 6)
      : []

  const { totalItems, setSidebarOpen } = useCart()
  const pathname = usePathname()
  const router = useRouter()

  const inputRef = useRef(null)
  const mobileInputRef = useRef(null)
  const searchWrapperRef = useRef(null)

  const openLogin = () => {
    setAuthMode('login')
    setAuthOpen(true)
  }
  const openSignup = () => {
    setAuthMode('signup')
    setAuthOpen(true)
  }

  function isActive(href) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (!searchWrapperRef.current?.contains(e.target) && !mobileInputRef.current?.contains(e.target)) {
        setShowDropdown(false)
        setDesktopSearchOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (desktopSearchOpen) {
      loadSearchProducts()
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [desktopSearchOpen, loadSearchProducts])

  useEffect(() => {
    if (mobileSearchOpen) {
      loadSearchProducts()
      setTimeout(() => mobileInputRef.current?.focus(), 50)
    }
  }, [mobileSearchOpen, loadSearchProducts])

  function toggleMobileSearch() {
    setMobileSearchOpen((prev) => {
      if (prev) {
        setQuery('')
        setShowDropdown(false)
        setActiveIndex(-1)
      }
      return !prev
    })
    setOpen(false)
  }

  function handleInputChange(e) {
    setQuery(e.target.value)
    setShowDropdown(true)
    setActiveIndex(-1)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      setDesktopSearchOpen(false)
      setActiveIndex(-1)
      setMobileSearchOpen(false)
      return
    }
    if (!showDropdown || !filtered.length) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault()
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
        setDesktopSearchOpen(false)
        setMobileSearchOpen(false)
        setShowDropdown(false)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      navigateToProduct(filtered[activeIndex])
    }
  }

  function navigateToProduct(product) {
    setQuery('')
    setShowDropdown(false)
    setDesktopSearchOpen(false)
    setActiveIndex(-1)
    setMobileSearchOpen(false)
    const slug =
      product.slug ||
      product.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    router.push(`/products/${slug}`)
  }

  async function handleBellClick() {
    if (isAuthenticated || isWholesaleUser) {
      setUnreadCount(0)
      try {
        if (isAuthenticated) {
          await authFetch(`${API_BASE}/auth/notifications/mark-read/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true }),
          })
        } else if (isWholesaleUser && session?.user?.accessToken) {
          await fetch(`${API_BASE}/wholesale/notifications/mark-read/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.user.accessToken}`,
            },
            body: JSON.stringify({ all: true }),
          })
        }
      } catch {
        /* ignore */
      }

      if (isWholesaleUser) {
        router.push('/wholesale/profile?tab=notifications')
      } else {
        router.push('/profile?tab=notifications')
      }
    } else {
      openLogin()
    }
  }

  const transitionEase = '420ms cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <>
      {/* Fixed-height sticky track prevents any layout jump while inner bar smoothly morphs into a floating pill */}
      <header className="sticky top-0 z-50 w-full h-[66px] md:h-[70px] pointer-events-none">
        <div
          className="w-full flex justify-center items-start pointer-events-none"
          style={{
            transform: scrolled ? 'translateY(12px)' : 'translateY(0px)',
            transition: `transform ${transitionEase}`,
          }}
        >
          <nav
            className="mx-auto pointer-events-auto relative"
            style={{
              width: scrolled ? 'min(1140px, calc(100% - 24px))' : '100%',
              height: scrolled ? '60px' : '70px',
              borderRadius: scrolled ? '9999px' : '0px',
              backgroundColor: scrolled ? 'rgba(249, 250, 244, 0.94)' : 'rgba(250, 250, 246, 0.96)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderWidth: '1.5px',
              borderStyle: 'solid',
              borderColor: scrolled ? '#B6CEB7' : 'transparent transparent #DCE8DF transparent',
              boxShadow: scrolled
                ? '0 12px 32px -6px rgba(12, 68, 41, 0.14), 0 3px 10px rgba(12, 68, 41, 0.06)'
                : 'none',
              transition: `width ${transitionEase}, height ${transitionEase}, border-radius ${transitionEase}, background-color 320ms ease, border-color 320ms ease, box-shadow 420ms ease`,
            }}
          >
            <div
              className="w-full max-w-[1320px] mx-auto h-full flex items-center justify-between gap-2 lg:gap-3"
              style={{
                paddingInline: scrolled ? '18px' : '24px',
                transition: `padding-inline ${transitionEase}`,
              }}
            >
              {/* ── Left Brand Logo + Name + Tagline (Integrated with Backend Site Config) ── */}
              <Link href="/" className="flex items-center gap-2.5 shrink-0 no-underline group">
                <div className="h-9 md:h-[38px] min-w-[36px] max-w-[100px] rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-[1.03]">
                  {showImageLogo ? (
                    <Image
                      src={resolvedLogo}
                      alt={`${activeBrandName} logo`}
                      width={38}
                      height={38}
                      unoptimized
                      onError={() => setFailedLogoSrc(resolvedLogo)}
                      style={{ width: 'auto', height: '100%', maxWidth: '100px' }}
                      className="object-contain"
                    />
                  ) : (
                    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="brandCircleGrad" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#F5FAF1" />
                          <stop offset="65%" stopColor="#E1F0DC" />
                          <stop offset="100%" stopColor="#BFE0B5" />
                        </linearGradient>
                      </defs>
                      <circle cx="20" cy="20" r="18.2" fill="url(#brandCircleGrad)" stroke="#3D7838" strokeWidth="1.5" />
                      <circle cx="20" cy="20" r="15.4" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.85" />
                      <path
                        d="M19.3 26.2C12.4 25.4 9.6 20.1 10.6 14.3C16.2 15.1 19.1 19.8 19.3 26.2Z"
                        fill="#0C4429"
                        stroke="#093620"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20.2 25.5C20.2 19.2 23.4 13.8 29.2 13.2C29.8 19.2 26.6 24.4 20.2 25.5Z"
                        fill="#357A38"
                        stroke="#093620"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19.8 22.5V31M18.8 24.8L13.5 18.6M20.6 24.1L25.8 17.8"
                        stroke="#FFFFFF"
                        strokeWidth="1.15"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    style={{
                      fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#0C4429',
                      lineHeight: 1.05,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {activeBrandName}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                      fontSize: '10px',
                      fontStyle: 'italic',
                      color: '#346148',
                      lineHeight: 1.2,
                    }}
                  >
                    {activeTagline}
                  </span>
                </div>
              </Link>

              {/* Hairline Divider */}
              <span className="hidden xl:block h-5 w-px bg-[#DCE6DA] shrink-0" aria-hidden="true" />

              {/* ── Center Desktop Navigation Links with Icons & Dividers ── */}
              <ul className="hidden md:flex items-center gap-0.5 lg:gap-1 xl:gap-1.5 m-0 p-0 list-none">
                {navLinks.map(({ label, href, Icon, hasChevron }, idx) => {
                  const active = isActive(href)
                  return (
                    <li key={label} className="flex items-center gap-0.5 xl:gap-1.5">
                      <Link
                        href={href}
                        className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap no-underline transition-all duration-200 ${
                          active
                            ? 'bg-[#0C4429] text-white font-semibold px-3.5 py-1.5 shadow-[0_2px_8px_rgba(12,68,41,0.2)]'
                            : 'text-[#1E4431] hover:text-[#0C4429] hover:bg-[#E7F1E4]/85 font-medium px-2.5 lg:px-3 py-1.5'
                        }`}
                        style={{ fontSize: '13px' }}
                      >
                        <Icon
                          className={`hidden lg:block w-[14px] h-[14px] shrink-0 ${
                            active ? 'text-white' : 'text-[#1E4431]'
                          }`}
                          strokeWidth={1.9}
                        />
                        <span>{label}</span>
                        {hasChevron && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white/90' : 'text-[#315843]'}`}
                            strokeWidth={2}
                          />
                        )}
                      </Link>
                      {idx < navLinks.length - 1 && (
                        <span className="hidden xl:block h-4 w-px bg-[#E3EBE0] shrink-0" aria-hidden="true" />
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* Hairline Divider */}
              <span className="hidden xl:block h-5 w-px bg-[#DCE6DA] shrink-0" aria-hidden="true" />

              {/* ── Right Actions (Search Circle Popover, Bell, Cart, My Account Pill) ── */}
              <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
                {/* Expandable Circular Search Button & Popover */}
                <div ref={searchWrapperRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setDesktopSearchOpen((v) => !v)}
                    aria-label="Search produce"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer border-none ${
                      desktopSearchOpen
                        ? 'bg-[#0C4429] text-white'
                        : 'bg-[#E5EFE2] text-[#0C4429] hover:bg-[#D7E6D4]'
                    }`}
                  >
                    <Search className="w-4 h-4" strokeWidth={2.1} />
                  </button>

                  {desktopSearchOpen && (
                    <div
                      className="absolute right-0 top-[calc(100%+12px)] w-[310px] bg-[#FAFCF9] rounded-2xl border border-[#C6DBC6] overflow-hidden z-50"
                      style={{
                        boxShadow: '0 14px 40px rgba(12, 68, 41, 0.16), 0 2px 8px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <div className="p-2.5 border-b border-[#E3EDE2]">
                        <div className="flex items-center gap-2 rounded-full bg-[#EFF6ED] border border-[#D1E2CE] px-3.5 py-2">
                          <Search className="w-3.5 h-3.5 text-[#3F6351] shrink-0" strokeWidth={2} />
                          <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search fresh produce..."
                            value={query}
                            onChange={handleInputChange}
                            onFocus={() => query.trim() && setShowDropdown(true)}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent outline-none w-full text-[13px] text-[#0D2C23] placeholder:text-[#58786C] border-none"
                          />
                          {query && (
                            <button
                              type="button"
                              onClick={() => {
                                setQuery('')
                                setShowDropdown(false)
                                inputRef.current?.focus()
                              }}
                              aria-label="Clear search"
                              className="text-[#4D6E62] hover:text-[#0C4429] bg-transparent border-none p-0 cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" strokeWidth={2.3} />
                            </button>
                          )}
                        </div>
                      </div>

                      {showDropdown && query.trim().length > 0 && (
                        <div>
                          {filtered.length > 0 ? (
                            <>
                              <p className="px-4 pt-2.5 pb-1 text-[10.5px] font-semibold tracking-widest text-[#4D6E62] uppercase m-0">
                                Products
                              </p>
                              <ul className="m-0 p-0 list-none max-h-[270px] overflow-y-auto">
                                {filtered.map((product, idx) => (
                                  <li key={product.id}>
                                    <button
                                      type="button"
                                      onMouseEnter={() => setActiveIndex(idx)}
                                      onMouseLeave={() => setActiveIndex(-1)}
                                      onClick={() => navigateToProduct(product)}
                                      className={`w-full text-left flex items-center gap-3 px-4 py-2 transition-colors cursor-pointer border-none ${
                                        activeIndex === idx ? 'bg-[#EAF5EE]' : 'bg-transparent'
                                      }`}
                                    >
                                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white border border-[#E5EDE4]">
                                        <Image
                                          src={product.image}
                                          alt={product.name}
                                          width={36}
                                          height={36}
                                          unoptimized
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[#0D2C23] truncate m-0">
                                          {highlightMatch(product.name, query)}
                                        </p>
                                        <p className="text-[11px] text-[#4D6E62] m-0">{product.category}</p>
                                      </div>
                                      <span className="text-[12.5px] font-semibold text-[#0C4429]">
                                        €{product.price.toFixed(2)}
                                      </span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <div className="border-t border-[#E3EDE2] px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    router.push(`/shop?q=${encodeURIComponent(query)}`)
                                    setShowDropdown(false)
                                    setDesktopSearchOpen(false)
                                  }}
                                  className="text-[12px] text-[#0C4429] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                                >
                                  See all results for &quot;{query}&quot; →
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="px-4 py-5 text-center">
                              <p className="text-[12.5px] text-[#4D6E62] m-0">
                                No products found for{' '}
                                <span className="font-semibold text-[#0C4429]">&quot;{query}&quot;</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notification Bell */}
                {!isInternalWholesale && (
                  <button
                    type="button"
                    onClick={handleBellClick}
                    aria-label="Notifications"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#0C4429] hover:bg-[#E5EFE2] transition-colors relative cursor-pointer bg-transparent border-none"
                  >
                    <Bell className="w-[17px] h-[17px]" strokeWidth={1.9} />
                    {displayUnreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#C84040] text-white rounded-full flex items-center justify-center text-[9.5px] font-bold leading-none">
                        {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Cart Button */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Shopping Cart"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#0C4429] hover:bg-[#E5EFE2] transition-colors relative cursor-pointer bg-transparent border-none"
                >
                  <ShoppingBag className="w-[17px] h-[17px]" strokeWidth={1.9} />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#4F9A28] text-white rounded-full flex items-center justify-center text-[9.5px] font-bold leading-none">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>

                {/* Auth / My Account Dark Green Pill */}
                {isAuthenticated ? (
                  <ProfileMenu user={user} logout={logout} />
                ) : isWholesaleUser ? (
                  <Link
                    href="/wholesale/profile"
                    className="inline-flex items-center gap-2 rounded-full text-white font-semibold hover:brightness-110 transition-all duration-200 no-underline whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, #0F4E31 0%, #0B3C25 100%)',
                      fontSize: '12.5px',
                      padding: '6.5px 14px 6.5px 8px',
                    }}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                      {wholesaleInitial}
                    </span>
                    <span className="truncate max-w-[85px]">{wholesaleName.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/90" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openLogin}
                    className="inline-flex items-center gap-1.5 rounded-full text-white font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer border-none whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, #0F4E31 0%, #0B3C25 100%)',
                      fontSize: '12.5px',
                      padding: '8px 16px',
                      boxShadow: '0 2px 6px rgba(11, 60, 37, 0.18)',
                    }}
                  >
                    <LogIn className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={2.2} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* ── Mobile Right Controls ── */}
              <div className="flex md:hidden items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={toggleMobileSearch}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E5EFE2] text-[#0C4429] border-none cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[#0C4429] relative bg-transparent border-none cursor-pointer"
                  aria-label="Cart"
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.9} />
                  {totalItems > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-[3px] bg-[#4F9A28] text-white rounded-full flex items-center justify-center text-[9px] font-bold leading-none">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(!open)
                    setMobileSearchOpen(false)
                  }}
                  className="w-9 h-9 flex items-center justify-center text-[#0C4429] bg-transparent border-none cursor-pointer"
                  aria-label="Menu"
                >
                  {open ? <X className="w-5 h-5" strokeWidth={2} /> : <Menu className="w-5 h-5" strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Mobile Search Dropdown Strip */}
            {mobileSearchOpen && (
              <div className="md:hidden absolute left-0 right-0 top-[calc(100%+8px)] mx-2 bg-[#FAFCF9] border border-[#C6DBC6] rounded-2xl p-3 shadow-lg z-50">
                <div className="flex items-center gap-2 bg-[#EFF6ED] border border-[#D1E2CE] rounded-full px-3.5 py-2">
                  <Search className="w-4 h-4 text-[#3F6351] shrink-0" strokeWidth={2} />
                  <input
                    ref={mobileInputRef}
                    type="text"
                    placeholder="Search fresh produce.."
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent outline-none flex-1 text-[13.5px] text-[#0D2C23] placeholder:text-[#58786C] border-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('')
                        setShowDropdown(false)
                        mobileInputRef.current?.focus()
                      }}
                      className="text-[#4D6E62] bg-transparent border-none p-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {query.trim().length > 0 && filtered.length > 0 && (
                  <ul className="m-0 pt-2 p-0 list-none max-h-[220px] overflow-y-auto divide-y divide-[#EDF4EB]">
                    {filtered.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => navigateToProduct(product)}
                          className="w-full text-left flex items-center gap-2.5 px-2 py-2 bg-transparent border-none cursor-pointer"
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={32}
                            height={32}
                            unoptimized
                            className="w-8 h-8 rounded-md object-cover shrink-0"
                          />
                          <span className="flex-1 text-[13px] font-medium text-[#0D2C23] truncate">
                            {highlightMatch(product.name, query)}
                          </span>
                          <span className="text-[12px] font-semibold text-[#0C4429]">
                            €{product.price.toFixed(2)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {open && (
        <div className="fixed inset-0 pt-[84px] bg-[#EFF9F2] z-40 px-6 pb-10 flex flex-col md:hidden overflow-y-auto">
          {navLinks.map(({ label, href, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b border-[#CFE0D5] py-3.5 flex items-center justify-between no-underline"
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: active ? '#0C4429' : '#1E3F34',
                }}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.85} />
                  <span>{label}</span>
                </span>
                {active && <span className="w-2.5 h-2.5 rounded-full bg-[#357A38]" />}
              </Link>
            )
          })}

          {!isAuthenticated && !isWholesaleUser && (
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  openLogin()
                }}
                className="flex-1 text-center border border-[#0C4429] rounded-full bg-transparent cursor-pointer text-[13.5px] font-semibold text-[#0C4429] py-2.5"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  openSignup()
                }}
                className="flex-1 text-center bg-[#0C4429] text-white rounded-full border-none cursor-pointer text-[13.5px] font-semibold py-2.5"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
    </>
  )
}

function highlightMatch(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#D7EED9', color: '#0C4429', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
