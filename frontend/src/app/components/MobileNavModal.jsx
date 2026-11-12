'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ArrowRight, X } from 'lucide-react'

const DEFAULT_MODAL_SOCIALS = [
  { key: 'facebook', label: 'Facebook', url: '#' },
  { key: 'instagram', label: 'Instagram', url: '#' },
  { key: 'youtube', label: 'YouTube', url: '#' },
]

function SocialGlyph({ type }) {
  if (type === 'facebook') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
      </svg>
    )
  }
  if (type === 'instagram') {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.94C17.93 4.78 12 4.78 12 4.78s-5.93 0-7.64.47a2.75 2.75 0 0 0-1.94 1.94C2 8.9 2 12.02 2 12.02s0 3.12.42 4.83a2.75 2.75 0 0 0 1.94 1.94c1.71.47 7.64.47 7.64.47s5.93 0 7.64-.47a2.75 2.75 0 0 0 1.94-1.94c.42-1.71.42-4.83.42-4.83s0-3.12-.42-4.83zM10 15.02V9.02l5.2 3-5.2 3z" />
    </svg>
  )
}

function LeafTwinMark() {
  return (
    <svg width="34" height="26" viewBox="0 0 38 28" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M3 7.5C3.5 16.5 9 23.2 17.6 24.4C18.2 15.8 13.5 8.6 3 7.5Z"
        fill="#7CC043"
      />
      <path
        d="M5.2 10.6C9.5 14.8 13.4 19 16.8 23.4"
        stroke="#EFF8E6"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M35.2 2.2C23.5 2.8 16.6 11.4 17.8 24.8C28.8 24.2 35.8 15.8 35.2 2.2Z"
        fill="#1E6B33"
      />
      <path
        d="M32.4 5.4C26.4 11 22 17.1 18.8 23.8"
        stroke="#D8F0D2"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function MobileNavModal({
  open,
  onClose,
  navLinks,
  isActive,
  brandName,
  tagline,
  logoSrc,
  isAuthenticated,
  isWholesaleUser,
  wholesaleName,
  onOpenLogin,
  onOpenSignup,
  onLogout,
  socialLinks = [],
}) {
  // Lock body scroll and listen for Escape while open
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  const resolvedSocials = DEFAULT_MODAL_SOCIALS.map((item) => {
    const match = Array.isArray(socialLinks)
      ? socialLinks.find(
        (s) => (s.icon_name || s.platform || '').toLowerCase() === item.key
      )
      : null
    return {
      ...item,
      url: match?.url || item.url,
      label: match?.title || item.label,
    }
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={`fixed inset-0 z-[70] md:hidden flex items-center justify-center p-1.5 sm:p-3 bg-[#092115]/48 backdrop-blur-[2px] transition-opacity duration-200 ease-out ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'
        }`}
    >
      <div
        className={`relative w-full max-w-[430px] h-full max-h-[860px] rounded-[24px] bg-[#F8FAF5] shadow-[0_24px_60px_rgba(5,28,16,0.42)] overflow-hidden flex flex-col justify-between will-change-transform transition-[transform,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-[0.96]'
          }`}
      >
        {/* ── Top Curved Forest Header Banner ── */}
        <div className="relative w-full h-[156px] sm:h-[170px] shrink-0 overflow-hidden bg-[#0D4929]">
          <Image
            src="/ui/mobile-nav-header.jpg"
            alt="Fresh organic produce basket"
            fill
            unoptimized
            priority
            sizes="430px"
            className="object-cover object-right select-none pointer-events-none"
          />

          {/* Smooth forest-green left-to-right diagonal blend */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(104deg, #0D4A29 0%, #0E4D2B 44%, rgba(13, 73, 41, 0.72) 56%, rgba(13, 73, 41, 0.08) 76%, transparent 92%)',
            }}
          />

          {/* Close Button (Top-Right White Pill Circle) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full bg-[#FAFDF8] hover:bg-white text-[#143023] shadow-[0_4px_12px_rgba(0,0,0,0.18)] flex items-center justify-center border border-black/5 cursor-pointer transition-transform duration-150 active:scale-90"
          >
            <X className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* Brand Emblem + Title + Tagline */}
          <div className="relative z-20 h-full px-4 sm:px-5 pt-3 pb-7 flex items-center gap-3 max-w-[74%]">
            <div className="w-[62px] h-[62px] sm:w-[68px] sm:h-[68px] rounded-full bg-white p-[3px] shadow-md ring-2 ring-white/90 shrink-0 flex items-center justify-center overflow-hidden">
              <Image
                src={logoSrc || '/el-erbol-logo.png'}
                alt={`${brandName} logo`}
                width={62}
                height={62}
                unoptimized
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <p
                className="m-0 text-[27px] sm:text-[30px] font-bold text-white leading-[1.06] tracking-[-0.015em] truncate"
                style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
              >
                {brandName}
              </p>
              <p
                className="mt-1 mb-0 text-[13.5px] sm:text-[14.5px] italic text-[#E7F3EC] leading-snug truncate"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                {tagline}
              </p>
            </div>
          </div>

          {/* Bottom Organic Sweeping Wave + Gold Accent Stroke */}
          <svg
            aria-hidden="true"
            viewBox="0 0 430 44"
            preserveAspectRatio="none"
            className="absolute bottom-[-1px] left-0 right-0 w-full h-[36px] sm:h-[40px] z-20 pointer-events-none block"
          >
            <path
              d="M0,4 C78,31 198,38 308,24 C366,17 405,12 430,8 L430,44 L0,44 Z"
              fill="#F8FAF5"
            />
            <path
              d="M0,4 C78,31 198,38 308,24 C366,17 405,12 430,8"
              fill="none"
              stroke="#DEC27C"
              strokeWidth="2.4"
            />
          </svg>
        </div>

        {/* ── Scrollable Body (Nav Links + Auth Buttons + Promo Strip + Socials) ── */}
        <div className="flex-1 overflow-y-auto db-scroll px-4 pt-2 pb-1 flex flex-col justify-between gap-3">
          {/* 5 Pill-Card Navigation Items */}
          <nav aria-label="Primary mobile links" className="flex flex-col gap-2.5">
            {navLinks.map(({ label, href, Icon }, idx) => {
              const active = isActive(href)
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={onClose}
                  style={{ transitionDelay: open ? `${Math.min(idx * 24, 96)}ms` : '0ms' }}
                  className={`group flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-[16px] bg-white border no-underline transition-[transform,opacity,background-color,border-color] duration-200 ease-out active:scale-[0.985] ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    } ${active
                      ? 'border-[#C2DBC7] bg-[#F5FAF5] shadow-[0_2px_6px_rgba(12,68,41,0.06)]'
                      : 'border-[#E8ECE3] shadow-[0_1px_3px_rgba(12,68,41,0.04)] hover:border-[#C5DEC9]'
                    }`}
                >
                  <span className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-[#DCEFD9] text-[#0B4529]' : 'bg-[#EAF3E8] text-[#114B2F]'
                        }`}
                    >
                      <Icon className="w-[19px] h-[19px]" strokeWidth={1.9} />
                    </span>
                    <span
                      className={`text-[15.5px] sm:text-[16px] font-semibold tracking-[-0.01em] truncate ${active ? 'text-[#0B4529]' : 'text-[#162C22]'
                        }`}
                    >
                      {label}
                    </span>
                  </span>
                  <ChevronRight
                    className="w-[18px] h-[18px] text-[#1D352B] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                    strokeWidth={2.1}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Lower Section: Auth Row + Fresh Products Promo Card + Social Icons */}
          <div className="flex flex-col gap-3.5 pt-1">
            <div className="border-t border-[#E3E9DF]" />

            {!isAuthenticated && !isWholesaleUser ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenLogin()
                  }}
                  className="rounded-full bg-white border border-[#AFC2B6] text-[#133A29] py-2.5 px-4 text-[14.5px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F1F7F2] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.34 0-10 1.67-10 5v2.5c0 .28.22.5.5.5h19c.28 0 .5-.22.5-.5V19c0-3.33-6.66-5-10-5z" />
                  </svg>
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenSignup()
                  }}
                  className="rounded-full bg-[#0E4A2C] hover:bg-[#0B3C24] text-white border-none py-2.5 px-4 text-[14.5px] font-semibold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(14,74,44,0.22)] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>Sign Up</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={isWholesaleUser ? '/wholesale/profile' : '/profile'}
                  onClick={onClose}
                  className="rounded-full bg-white border border-[#AFC2B6] text-[#133A29] py-2.5 px-4 text-[14px] font-semibold flex items-center justify-center gap-2 no-underline hover:bg-[#F1F7F2] active:scale-[0.98] transition-all truncate"
                >
                  <span className="truncate">
                    {isWholesaleUser ? wholesaleName : 'My Account'}
                  </span>
                </Link>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onLogout()
                    }}
                    className="rounded-full bg-[#0E4A2C] hover:bg-[#0B3C24] text-white border-none py-2.5 px-4 text-[14px] font-semibold flex items-center justify-center cursor-pointer active:scale-[0.98] transition-all"
                  >
                    Log Out
                  </button>
                ) : (
                  <Link
                    href="/shop"
                    onClick={onClose}
                    className="rounded-full bg-[#0E4A2C] hover:bg-[#0B3C24] text-white py-2.5 px-4 text-[14px] font-semibold flex items-center justify-center no-underline active:scale-[0.98] transition-all"
                  >
                    Order Now
                  </Link>
                )}
              </div>
            )}

            {/* Green Promo Strip */}
            <div className="rounded-[18px] bg-[#E2EFD8] px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <LeafTwinMark />
                <div className="min-w-0">
                  <p className="m-0 text-[14px] sm:text-[14.5px] font-bold text-[#143B28] leading-tight truncate">
                    Fresh Products
                  </p>
                  <p className="mt-0.5 mb-0 text-[11.5px] sm:text-[12px] text-[#3B5E4B] leading-tight truncate">
                    Straight from our local farms
                  </p>
                </div>
              </div>

              <Link
                href="/shop"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#82B95F] px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-semibold text-[#18462E] no-underline whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-[#F5FAF1] active:scale-95 transition-all shrink-0"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </div>

            {/* Centered Social Circles + Side Hairlines */}
            <div className="flex items-center gap-3 px-2 pt-0.5">
              <span className="h-px flex-1 bg-[#DCE3DA]" />
              <div className="flex items-center gap-3.5">
                {resolvedSocials.map((s) => {
                  const isExternal = s.url && s.url !== '#'
                  return (
                    <a
                      key={s.key}
                      href={s.url}
                      aria-label={s.label}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="w-9 h-9 rounded-full bg-[#E5EAE3] hover:bg-[#D5E3D3] text-[#1A2922] flex items-center justify-center transition-colors"
                    >
                      <SocialGlyph type={s.key} />
                    </a>
                  )
                })}
              </div>
              <span className="h-px flex-1 bg-[#DCE3DA]" />
            </div>
          </div>
        </div>

        {/* ── Bottom Soft Botanical Layered Waves ── */}
        <div aria-hidden="true" className="w-full shrink-0 leading-none pointer-events-none select-none">
          <svg
            viewBox="0 0 430 28"
            preserveAspectRatio="none"
            className="w-full h-[22px] sm:h-[26px] block"
          >
            <path
              d="M0,4 C115,24 315,24 430,2 L430,28 L0,28 Z"
              fill="#D4E8C9"
            />
            <path
              d="M0,12 C125,27 305,27 430,8 L430,28 L0,28 Z"
              fill="#BFE0AC"
              fillOpacity="0.82"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
