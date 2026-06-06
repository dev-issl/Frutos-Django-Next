'use client'
// src/app/components/Navbar.jsx
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { newsreader } from '@/app/components/fonts'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/app/context/CartContext'
import { useAuth } from '@/app/context/AuthContext'
import AuthModal from '@/app/components/AuthModal'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://elarbol.icommerce.com.bd/api'

// Fallback nav links (used when API returns nothing)
const DEFAULT_NAV_LINKS = [
  { label: 'Shop',      href: '/shop'      },
  { label: 'Store',     href: '/stores'    },
  { label: 'About',     href: '/about'     },
  { label: 'Wholesale', href: '/wholesale' },
]

function PineTree() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#00694C">
      <polygon points="12,2 5.5,10.5 8.5,10.5 3,18 21,18 15.5,10.5 18.5,10.5" />
      <rect x="10.5" y="18" width="3" height="3.5" rx="0.4" />
    </svg>
  )
}

// ── Profile Menu 

function ProfileMenu({ user, logout, isMobile = false }) {
  const [open, setOpen] = useState(false)
  const menuRef         = useRef(null)
  const router          = useRouter()

  useEffect(() => {
    function handler(e) {
      if (!menuRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const avatarUrl   = user?.profile?.resolvedAvatar || ''
  const initials    = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase()
                      || user?.email?.[0]?.toUpperCase() || '?'
  const displayName = user?.fullName || user?.firstName || user?.email || 'Account'

  async function handleLogout() {
    setOpen(false)
    await logout()
    router.push('/')
  }

  const menuItems = [
    { label: 'My Profile',  icon: 'person',          href: '/profile'          },
    { label: 'My Orders',   icon: 'receipt_long',    href: '/profile?tab=orders' },
    { label: 'Saved Items', icon: 'favorite_border', href: '/profile?tab=saved' },
    { label: 'Settings',    icon: 'settings',        href: '/profile?tab=settings' },
  ]

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: open ? '#ECF7E4' : 'transparent',
          border: `1.5px solid ${open ? '#00694C' : '#BCCAC1'}`,
          borderRadius: '99px',
          padding: isMobile ? '4px' : '4px 10px 4px 4px',
          cursor: 'pointer',
          transition: 'background .15s, border-color .15s',
        }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: avatarUrl ? 'transparent' : '#1D9E75',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {avatarUrl
            ? <Image src={avatarUrl} alt={displayName} width={40} height={40} style={{ objectFit: 'cover' }} />
            : <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', lineHeight: 1 }}>{initials}</span>
          }
        </div>
        {!isMobile && (
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#2D3A35', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName.split(' ')[0]}
          </span>
        )}
        {!isMobile && (
          <svg width="12" height="12" fill="none" stroke="#6D7A73" strokeWidth="2.2" viewBox="0 0 24 24"
            style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '220px', background: 'white',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(8,28,20,.14), 0 2px 8px rgba(0,0,0,.06)',
          border: '1px solid rgba(188,202,193,.4)',
          overflow: 'hidden', zIndex: 100,
          animation: 'profileDropIn .18s ease',
        }}>
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #ECF7E4' }}>
            <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#151E13', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
            <p style={{ fontSize: '12px', color: '#6D7A73', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
          <div style={{ padding: '6px 0' }}>
            {menuItems.map(({ label, icon, href }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', fontSize: '13.5px', color: '#2D3A35', textDecoration: 'none', transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5FAF7'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6D7A73' }}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #ECF7E4', padding: '6px 0' }}>
            <button onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13.5px', color: '#C84040', textAlign: 'left', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Navbar 

export default function Navbar({ navbarLogoUrl = '', brandName = 'El Árbol', navLinks: navLinksProp = [] }) {
  // Use API-supplied links if available, else fallback
  const navLinks = navLinksProp && navLinksProp.length > 0 ? navLinksProp : DEFAULT_NAV_LINKS
  const { user, isAuthenticated, logout, authFetch } = useAuth()
  const { data: session } = useSession()
    // Wholesale user detect করুন
  const isWholesaleUser = !!session?.user?.accessToken
  const wholesaleName = session?.user?.businessName 
  || session?.user?.contactName 
  || session?.user?.name 
  || 'Wholesale'

  const wholesaleInitial = wholesaleName[0].toUpperCase()

  const [open,             setOpen]             = useState(false)
  const [authOpen,         setAuthOpen]         = useState(false)
  const [authMode,         setAuthMode]         = useState('login')
  const [query,            setQuery]            = useState('')
  const [showDropdown,     setShowDropdown]     = useState(false)
  const [activeIndex,      setActiveIndex]      = useState(-1)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [allProducts,      setAllProducts]      = useState([])
  const [unreadCount,      setUnreadCount]      = useState(0)   // ← notification badge

  // Fetch products
useEffect(() => {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
  const mediaBase = base.replace('/api', '')

  fetch(`${base}/products/products/`)
    .then(r => { if (!r.ok) throw new Error(); return r.json() })
    .then(data => {
      const arr = Array.isArray(data) ? data : (data.results || [])
      setAllProducts(arr.map(p => {

        // ✅ FIX: /media/ double হওয়া বন্ধ করা
        let image = p.thumbnail || p.thumbnail_url || p.image_url || p.image || null
        if (image && !image.startsWith('http')) {
          const clean = image.replace(/^\/+/, '') // leading slash সরাও
          image = `${mediaBase}/${clean}`          // mediaBase + /media/products/...
        }
        const PLACEHOLDER = 'https://placehold.co/400x400/ECF7E4/00694C?text=No+Image'

        // ✅ Price fix
        const originalPrice = Number(p.price || 0)
        const discountPrice = p.discount_price != null ? Number(p.discount_price) : null
        const displayPrice  = (discountPrice && discountPrice < originalPrice) ? discountPrice : originalPrice
        const onSale        = discountPrice != null && discountPrice < originalPrice

        // ✅ Category normalize
        const category = typeof p.category === 'object' && p.category !== null
          ? p.category.name
          : (p.sub_category?.category?.name || p.category || '')

        return {
          ...p,
          image: image || PLACEHOLDER,
          price: displayPrice,
          oldPrice: onSale ? originalPrice : null,
          onSale,
          category,
          slug: p.slug || null,
        }
      }))
    })
    .catch(() => {})
}, [])
  // ── Fetch unread notification count when authenticated ──────────────────
  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return }

    async function fetchCount() {
      try {
        const res  = await authFetch(`${API_BASE}/auth/notifications/unread-count/`)
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      } catch { /* ignore */ }
    }

    fetchCount()
    // Poll every 60 seconds so badge stays fresh
    const interval = setInterval(fetchCount, 10_000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const filtered = query.trim().length > 0
    ? allProducts.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.category?.toLowerCase().includes(query.toLowerCase()) ||
        p.origin?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  const { totalItems, setSidebarOpen } = useCart()
  const pathname = usePathname()
  const router   = useRouter()

  const inputRef       = useRef(null)
  const mobileInputRef = useRef(null)
  const dropdownRef    = useRef(null)

  const openLogin  = () => { setAuthMode('login');  setAuthOpen(true) }
  const openSignup = () => { setAuthMode('signup'); setAuthOpen(true) }

  function isActive(href) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target) && !mobileInputRef.current?.contains(e.target)) {
        setShowDropdown(false); setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50)
    } else {
      setQuery(''); setShowDropdown(false); setActiveIndex(-1)
    }
  }, [mobileSearchOpen])

  function handleInputChange(e) { setQuery(e.target.value); setShowDropdown(true); setActiveIndex(-1) }

  function handleKeyDown(e) {
    if (!showDropdown || !filtered.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); navigateToProduct(filtered[activeIndex]) }
    else if (e.key === 'Escape') { setShowDropdown(false); setActiveIndex(-1); setMobileSearchOpen(false) }
  }

  function navigateToProduct(product) {
    setQuery(''); setShowDropdown(false); setActiveIndex(-1); setMobileSearchOpen(false)
    const slug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    router.push(`/products/${slug}`)
  }


  async function handleBellClick() {
    if (isAuthenticated) {
      setUnreadCount(0)  
      try {
        await authFetch(`${API_BASE}/auth/notifications/mark-read/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true }),
        })
      } catch { /* ignore */ }
      router.push('/profile?tab=notifications')
    } 
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FAFAF8] backdrop-blur-sm border-b border-[#BCCAC1]/35">
        <nav className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[60px] flex items-center gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-[4px] shrink-0 mr-2">
              <Image
                  src={navbarLogoUrl || '/el-erbol-logo.png'}
                  alt={`${brandName} logo`}
                  width={45}
                  height={50}
                  priority
                  className="object-contain"
              />
              <span style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '22px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: '#085041'
              }}>
                  {brandName}
              </span>
          </Link>

          {/* Desktop nav links */}
          <ul className={`${newsreader.className} hidden md:flex items-center gap-7`}>
            {navLinks.map(({ label, href }) => {
              const active = isActive(href)
              return (
                <li key={label}>
                  <Link href={href}
                    style={{ fontSize: '16px', lineHeight: '20px', fontWeight: active ? 600 : 400, color: active ? '#085041' : '#475569', borderBottom: active ? '2px solid #1D9E75' : '2px solid transparent', paddingBottom: '2px', transition: 'color 0.15s, border-color 0.15s' }}
                    className="hover:text-[#151E13]">
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-[8px] ml-auto">

            {/* Search */}
            <div className="relative">
              <label className="flex items-center gap-[7px] bg-[#ECF7E4] rounded-full px-[14px] py-[8px] w-[215px] cursor-text">
                <svg width="14" height="14" fill="none" stroke="#6D7A73" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input ref={inputRef} type="text" placeholder="Search fresh produce..."
                  value={query} onChange={handleInputChange}
                  onFocus={() => query.trim() && setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent outline-none w-full placeholder:text-[#6D7A73]"
                  style={{ fontSize: '13px', color: '#6D7A73', border: 'none' }} />
                {query && (
                  <button onClick={() => { setQuery(''); setShowDropdown(false); inputRef.current?.focus() }}
                    className="flex-shrink-0 text-[#6D7A73] hover:text-[#3D4943] transition-colors" style={{ lineHeight: 1 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </label>

              {showDropdown && query.trim().length > 0 && (
                <div ref={dropdownRef}
                  className="absolute left-0 top-[calc(100%+8px)] w-[280px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#BCCAC1]/40 overflow-hidden z-50"
                  style={{ animation: 'dropdownFadeIn 0.15s ease' }}>
                  {filtered.length > 0 ? (
                    <>
                      <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold tracking-widest text-[#6D7A73] uppercase">Products</p>
                      <ul>
                        {filtered.map((product, idx) => (
                          <li key={product.id}>
                            <button onMouseEnter={() => setActiveIndex(idx)} onMouseLeave={() => setActiveIndex(-1)}
                              onClick={() => navigateToProduct(product)}
                              className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer"
                              style={{ backgroundColor: activeIndex === idx ? '#F0FAF5' : 'transparent' }}>
                              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#ECF7E4]">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13.5px] font-medium text-[#151E13] truncate" style={{ lineHeight: '18px' }}>
                                  {highlightMatch(product.name, query)}
                                </p>
                                <p className="text-[11.5px] text-[#6D7A73]" style={{ lineHeight: '16px' }}>
                                  {product.category} · {product.origin}
                                </p>
                              </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[13px] font-semibold text-[#00694C]">
                              €{product.price.toFixed(2)}
                            </span>
                            {product.oldPrice && (
                              <span className="text-[11px] text-[#9CA3AF] line-through">
                                €{product.oldPrice.toFixed(2)}
                              </span>
                            )}
                          </div>                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-[#BCCAC1]/30 px-4 py-2.5">
                        <button onClick={() => { router.push(`/shop?q=${encodeURIComponent(query)}`); setShowDropdown(false) }}
                          className="text-[12px] text-[#1D9E75] font-medium hover:text-[#085041] transition-colors cursor-pointer bg-transparent border-none p-0">
                          See all results for "{query}" →
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-5 text-center">
                      <p className="text-[13px] text-[#6D7A73]">No products found for <span className="font-medium text-[#151E13]">"{query}"</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Bell with unread badge ── */}
            <button onClick={handleBellClick}
              className="w-9 cursor-pointer h-9 flex items-center justify-center rounded-full hover:bg-[#BCCAC1]/25 transition-colors relative">
              <svg width="19" height="19" fill="none" stroke="#3D4943" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-[3px] bg-[#C84040] text-white rounded-full flex items-center justify-center"
                  style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 cursor-pointer flex items-center justify-center rounded-full hover:bg-[#BCCAC1]/25 transition-colors relative">
              <svg width="19" height="19" fill="none" stroke="#3D4943" strokeWidth="1.75" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-[17px] h-[17px] bg-[#00694C] text-white rounded-full flex items-center justify-center"
                  style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>
                  {totalItems}
                </span>
              )}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
                  <div className="ml-3">
                    <ProfileMenu user={user} logout={logout} />
                  </div>
                ) : isWholesaleUser ? (
                  <Link href="/wholesale/profile" className="ml-3 flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00694C]/40 hover:bg-[#ECF7E4] transition-colors" style={{ textDecoration: 'none' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00694C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{wholesaleInitial}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#085041', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {wholesaleName.split(' ')[0]}
                    </span>
                  </Link>
                ) : (
                  <>
                    <button onClick={openLogin} style={{ fontSize: '13.5px', fontWeight: 500, color: '#00694C' }}
                      className="ml-5 px-3 py-1.5 rounded-lg border border-[#00694C]/40 hover:text-[#151E13] transition-colors bg-transparent cursor-pointer">
                      Log In
                    </button>
                    <button onClick={openSignup}
                      className="bg-[#00694C] px-3.5 py-2 text-white rounded-lg hover:bg-[#085041] transition-colors border-none cursor-pointer"
                      style={{ fontSize: '13.5px', fontWeight: 600 }}>
                      Sign Up
                    </button>
                  </>
                )}
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-1 ml-auto">
            <button onClick={() => { setMobileSearchOpen(v => !v); setOpen(false) }}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: mobileSearchOpen ? '#ECF7E4' : 'transparent' }} aria-label="Search">
              {mobileSearchOpen
                ? <svg width="17" height="17" fill="none" stroke="#151E13" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                : <svg width="19" height="19" fill="none" stroke="#151E13" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              }
            </button>

            {/* Mobile bell with badge */}
            <button onClick={handleBellClick} className="w-9 h-9 flex items-center justify-center relative">
              <svg width="19" height="19" fill="none" stroke="#151E13" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-[3px] bg-[#C84040] text-white rounded-full flex items-center justify-center"
                  style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1 }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center relative">
              <svg width="19" height="19" fill="none" stroke="#151E13" strokeWidth="1.75" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-[15px] h-[15px] bg-[#00694C] text-white rounded-full flex items-center justify-center"
                  style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1 }}>
                  {totalItems}
                </span>
              )}
            </button>

            {isAuthenticated ? (
                <div className="flex items-center">
                  <ProfileMenu user={user} logout={logout} isMobile />
                </div>
              ) : isWholesaleUser ? (
                <Link href="/wholesale/profile"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#00694C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{wholesaleInitial}</span>
                </Link>
              ) : (
                <button onClick={() => { setOpen(!open); setMobileSearchOpen(false) }}
                  className="w-9 h-9 flex items-center justify-center" aria-label="Menu">
                  <svg width="19" height="19" fill="none" stroke="#151E13" strokeWidth="2" viewBox="0 0 24 24">
                    {open ? <path d="M18 6 6 18M6 6l12 12"/> : <path d="M4 6h16M4 12h16M4 18h16"/>}
                  </svg>
                </button>
              )}
          </div>
        </nav>

        {/* Mobile Search */}
        {mobileSearchOpen && (
          <div className="md:hidden bg-[#FAFAF8] border-t border-[#BCCAC1]/35 px-4 py-3"
            style={{ animation: 'dropdownFadeIn 0.15s ease' }}>
            <div className="flex items-center gap-2 bg-[#ECF7E4] rounded-full px-4 py-2.5">
              <svg width="15" height="15" fill="none" stroke="#6D7A73" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={mobileInputRef} type="text" placeholder="Search fresh produce..."
                value={query} onChange={handleInputChange} onKeyDown={handleKeyDown}
                className="bg-transparent outline-none flex-1 placeholder:text-[#6D7A73]"
                style={{ fontSize: '14px', color: '#151E13', border: 'none' }} />
              {query && (
                <button onClick={() => { setQuery(''); setShowDropdown(false); mobileInputRef.current?.focus() }} className="text-[#6D7A73] flex-shrink-0">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            {showDropdown && query.trim().length > 0 && (
              <div ref={dropdownRef} className="mt-2 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#BCCAC1]/40 overflow-hidden"
                style={{ animation: 'dropdownFadeIn 0.15s ease' }}>
                {filtered.length > 0 ? (
                  <>
                    <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold tracking-widest text-[#6D7A73] uppercase">Products</p>
                    <ul>
                      {filtered.map((product, idx) => (
                        <li key={product.id}>
                          <button onClick={() => navigateToProduct(product)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors active:bg-[#F0FAF5]"
                            style={{ backgroundColor: activeIndex === idx ? '#F0FAF5' : 'transparent' }}>
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#ECF7E4]">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-[#151E13] truncate">{highlightMatch(product.name, query)}</p>
                              <p className="text-[12px] text-[#6D7A73]">{product.category} · {product.origin}</p>
                            </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                <span className="text-[13.5px] font-semibold text-[#00694C]">
                                  €{product.price.toFixed(2)}
                                </span>
                                {product.oldPrice && (
                                  <span className="text-[11px] text-[#9CA3AF] line-through">
                                    €{product.oldPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-[#BCCAC1]/30 px-4 py-3">
                      <button onClick={() => { router.push(`/shop?q=${encodeURIComponent(query)}`); setShowDropdown(false); setMobileSearchOpen(false) }}
                        className="text-[13px] text-[#1D9E75] font-medium bg-transparent border-none p-0 cursor-pointer">
                        See all results for "{query}" →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[13px] text-[#6D7A73]">No products found for <span className="font-medium text-[#151E13]">"{query}"</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {open && !isAuthenticated && (
        <div className="fixed inset-0 top-[60px] bg-[#F5F5E8] z-40 px-6 pt-8 pb-10 flex flex-col md:hidden overflow-y-auto">
          {navLinks.map(({ label, href }) => {
            const active = isActive(href)
            return (
              <Link key={label} href={href} onClick={() => setOpen(false)}
                className="border-b border-[#BCCAC1]/40 py-4 flex items-center justify-between"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: active ? '#00694C' : '#151E13' }}>
                {label}
                {active && <span className="w-2 h-2 rounded-full bg-[#1D9E75]" />}
              </Link>
            )
          })}
          <div className="flex gap-3 mt-7">
            <button onClick={() => { setOpen(false); openLogin() }}
              className="flex-1 text-center border border-[#151E13] rounded-full bg-transparent cursor-pointer"
              style={{ fontSize: '14px', fontWeight: 500, color: '#151E13', padding: '11px 0' }}>
              Log In
            </button>
            <button onClick={() => { setOpen(false); openSignup() }}
              className="flex-1 text-center bg-[#00694C] text-white rounded-full border-none cursor-pointer"
              style={{ fontSize: '14px', fontWeight: 500, padding: '11px 0' }}>
              Sign Up
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes dropdownFadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes profileDropIn  { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

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
      <mark style={{ background: '#D1FAE5', color: '#085041', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}