'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ── Social icon map (by platform name from API) ──────────────────────────────
const SOCIAL_ICONS = {
  facebook: () => (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  ),
  linkedin: () => (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
    </svg>
  ),
  youtube: () => (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.94C17.93 4.78 12 4.78 12 4.78s-5.93 0-7.64.47a2.75 2.75 0 0 0-1.94 1.94C2 8.9 2 12.02 2 12.02s0 3.12.42 4.83a2.75 2.75 0 0 0 1.94 1.94c1.71.47 7.64.47 7.64.47s5.93 0 7.64-.47a2.75 2.75 0 0 0 1.94-1.94c.42-1.71.42-4.83.42-4.83s0-3.12-.42-4.83zM10 15.02V9.02l5.2 3-5.2 3z" />
    </svg>
  ),
  twitter: () => (
    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  x: () => (
    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  tiktok: () => (
    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.83a8.2 8.2 0 0 0 4.79 1.53V6.9a4.85 4.85 0 0 1-1.02-.21z" />
    </svg>
  ),
  pinterest: () => (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.26-5.33 1.26-5.33s-.32-.65-.32-1.6c0-1.5.87-2.62 1.95-2.62.92 0 1.37.69 1.37 1.52 0 .93-.59 2.31-.9 3.6-.25 1.08.54 1.95 1.6 1.95 1.92 0 3.21-2.47 3.21-5.4 0-2.23-1.51-3.79-3.67-3.79-2.5 0-3.97 1.88-3.97 3.82 0 .76.29 1.57.65 2.01.07.09.08.17.06.26-.07.27-.22.87-.25.99-.04.16-.14.2-.32.12-1.19-.56-1.93-2.3-1.93-3.7 0-3.01 2.19-5.77 6.31-5.77 3.32 0 5.9 2.37 5.9 5.53 0 3.3-2.08 5.96-4.96 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.22c-.22.83-.8 1.87-1.19 2.5.9.28 1.85.43 2.83.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  ),
  globe: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
}

const DEFAULT_SOCIALS = [
  { platform: 'facebook', title: 'Facebook', url: '#' },
  { platform: 'linkedin', title: 'LinkedIn', url: '#' },
  { platform: 'youtube', title: 'YouTube', url: '#' },
  { platform: 'x', title: 'X', url: '#' },
]

const EmailIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6.15 6.15l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const PinIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

function buildFooterColumns(footer_sections = [], nav_links = []) {
  if (!footer_sections || footer_sections.length === 0) {
    return nav_links.length > 0
      ? [{ id: 'nav', title: 'Quick Links', links: nav_links.map((l) => ({ text: l.label, url: l.href })) }]
      : []
  }

  return footer_sections
    .filter((s) => s.is_active !== false)
    .map((section) => ({
      id: section.id,
      title: section.title,
      section_type: section.section_type,
      links: (section.links || [])
        .filter((l) => l.is_active !== false)
        .map((l) => ({ text: l.text, url: l.url, open_in_new_tab: l.open_in_new_tab })),
    }))
    .filter((s) => s.links.length > 0)
}

export default function Footer({ config }) {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  if (!config) return null

  const {
    brand_name = 'El Árbol',
    brand_tagline = '',
    footer_logo_url = '',
    contact_email = '',
    contact_phone = '',
    contact_address = '',
    nav_links = [],
    store_locations = [],
    social_links = [],
    footer_sections = [],
    developed_by_name = 'Intelligent Systems and Solutions Limited',
    developed_by_url = 'https://www.intelligentsystemsltd.com/',
    quick_links_text = '',
  } = config

  const currentYear = new Date().getFullYear()
  const copyrightText = `© ${currentYear} ${brand_name}. All rights reserved.`

  const activeContactEmail = contact_email || 'hello@elarbol.com'
  const activeContactPhone = contact_phone || '+880 1712-345678'
  const activeContactAddress = contact_address || 'House 12, Road 5, Dhanmondi, Dhaka, Bangladesh'

  const parsedQuickLinks = (quick_links_text || '')
    .split(',')
    .map((l) => {
      const [label, href] = l.split(':').map((s) => s?.trim())
      return { label, href: href || '#' }
    })
    .filter((l) => l.label)

  const activeNavLinks =
    parsedQuickLinks.length > 0
      ? parsedQuickLinks
      : nav_links && nav_links.length > 0
        ? nav_links
        : [
            { label: 'Shop All', href: '/shop' },
            { label: 'Our Stores', href: '/stores' },
            { label: 'About Us', href: '/about' },
            { label: 'Wholesale', href: '/wholesale' },
          ]

  const activeStoreLocations =
    store_locations && store_locations.length > 0
      ? store_locations
      : [{ name: 'FreshDrop (Dhanmondi)', slug: 'dhaka-dhanmondi' }]

  const footerColumns = buildFooterColumns(footer_sections, activeNavLinks)
  const companyInfoSection = footer_sections.find((s) => s.section_type === 'company_info')
  const companyTagline = companyInfoSection
    ? companyInfoSection.links?.[0]?.text || brand_tagline
    : brand_tagline

  const linkColumns = footerColumns.filter((c) => c.section_type !== 'company_info')
  const displayCols = linkColumns.slice(0, 2)

  const activeSocials = Array.isArray(social_links) && social_links.length > 0 ? social_links : DEFAULT_SOCIALS

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setSubscribed(true)
    setNewsletterEmail('')
  }

  return (
    <footer className="relative text-white">
      {/* ═══ TOP LAYERED ORGANIC WAVE TRANSITION ═══ */}
      <div className="w-full overflow-hidden leading-none pointer-events-none select-none -mb-px">
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 86"
          preserveAspectRatio="none"
          className="w-full h-[42px] sm:h-[64px] lg:h-[74px] block"
        >
          {/* Softest top light green wave */}
          <path
            d="M0,48 C240,6 520,56 860,34 C1120,18 1310,4 1440,36 L1440,86 L0,86 Z"
            fill="#9BCB7C"
            fillOpacity="0.85"
          />
          {/* Medium vibrant leaf-green crest wave */}
          <path
            d="M0,56 C270,18 560,64 900,40 C1140,22 1320,16 1440,60 L1440,86 L0,86 Z"
            fill="#5EA03A"
          />
          {/* Deep El Árbol forest-teal wave seamlessly melting into footer body */}
          <path
            d="M0,68 C290,26 560,62 920,42 C1160,28 1330,44 1440,84 L1440,86 L0,86 Z"
            fill="#085041"
          />
        </svg>
      </div>

      {/* ═══ MAIN FOOTER BODY ═══ */}
      <div className="bg-[#085041] pt-6 sm:pt-8 pb-5">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.85fr_1.15fr_1.3fr] gap-y-8 lg:gap-y-0 pb-8 border-b border-white/15">
            {/* Column 1: Brand & Socials */}
            <div className="sm:col-span-2 lg:col-span-1 lg:pr-6 lg:border-r lg:border-white/12 flex flex-col justify-between">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 mb-3.5 transition-opacity hover:opacity-90"
                >
                  <span className="relative w-10 h-10 rounded-full bg-white ring-2 ring-[#57A12A] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <Image
                      src={footer_logo_url || '/el-erbol-logo.png'}
                      alt={`${brand_name} logo`}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  </span>
                  <span className="flex flex-col">
                    <span
                      className="text-[19px] font-bold tracking-tight text-white leading-tight"
                      style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                      {brand_name}
                    </span>
                    <span className="text-[11px] text-[#C6DFD7] leading-tight">
                      {brand_tagline || 'Fresh. Local. Together.'}
                    </span>
                  </span>
                </Link>

                <p className="text-[12px] text-[#CBE2DA] leading-[1.6] mb-5 max-w-[300px]">
                  {companyTagline ||
                    'Connecting local farms with customers for a fresher, healthier and more sustainable food system.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {activeSocials.map((s, i) => {
                  const key = (s.icon_name || s.platform || '').toLowerCase()
                  const Icon = SOCIAL_ICONS[key] || SOCIAL_ICONS.globe
                  const isPlaceholder = !s.url || s.url === '#'
                  return (
                    <a
                      key={i}
                      href={s.url || '#'}
                      aria-label={s.title || s.platform || 'Social link'}
                      title={s.title || s.platform}
                      target={isPlaceholder ? undefined : '_blank'}
                      rel={isPlaceholder ? undefined : 'noopener noreferrer'}
                      className="w-8 h-8 rounded-full bg-[#5B9D3A] hover:bg-[#6EB44B] text-[#085041] flex items-center justify-center transition-colors duration-200"
                    >
                      <Icon />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="lg:px-6 lg:border-r lg:border-white/12">
              <h4
                className="text-[15.5px] font-bold text-white mb-3.5"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                {displayCols[0]?.title || 'Quick Links'}
              </h4>
              <ul className="flex flex-col gap-2">
                {(displayCols[0]?.links || activeNavLinks.map((l) => ({ text: l.label, url: l.href }))).map(
                  (link, i) => (
                    <li key={i}>
                      <Link
                        href={link.url || '#'}
                        target={link.open_in_new_tab ? '_blank' : undefined}
                        rel={link.open_in_new_tab ? 'noopener noreferrer' : undefined}
                        className="text-[12.5px] text-[#CFE4DC] hover:text-white transition-colors duration-200"
                      >
                        {link.text}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Column 3: Support / Second Link Column / Stores */}
            <div className="lg:px-6 lg:border-r lg:border-white/12">
              {displayCols[1] ? (
                <>
                  <h4
                    className="text-[15.5px] font-bold text-white mb-3.5"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    {displayCols[1].title}
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {displayCols[1].links.map((link, i) => (
                      <li key={i}>
                        <Link
                          href={link.url || '#'}
                          target={link.open_in_new_tab ? '_blank' : undefined}
                          rel={link.open_in_new_tab ? 'noopener noreferrer' : undefined}
                          className="text-[12.5px] text-[#CFE4DC] hover:text-white transition-colors duration-200"
                        >
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h4
                    className="text-[15.5px] font-bold text-white mb-3.5"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    Stores
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {activeStoreLocations.map((store, i) => (
                      <li key={store.slug || i}>
                        <Link
                          href={`/stores/${store.slug || ''}`}
                          className="text-[12.5px] text-[#CFE4DC] hover:text-white transition-colors duration-200"
                        >
                          {store.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/stores"
                        className="text-[12.5px] text-[#CFE4DC] hover:text-white transition-colors duration-200"
                      >
                        Find a Store
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/offers"
                        className="text-[12.5px] text-[#CFE4DC] hover:text-white transition-colors duration-200"
                      >
                        Special Offers
                      </Link>
                    </li>
                  </ul>
                </>
              )}
            </div>

            {/* Column 4: Contact Us */}
            <div className="lg:px-6 lg:border-r lg:border-white/12">
              <h4
                className="text-[15.5px] font-bold text-white mb-3.5"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                Contact Us
              </h4>
              <ul className="flex flex-col gap-2.5">
                {activeContactEmail && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#9AC9B8] mt-0.5 shrink-0">
                      <EmailIcon />
                    </span>
                    <a
                      href={`mailto:${activeContactEmail}`}
                      className="text-[12px] text-[#CFE4DC] hover:text-white transition-colors duration-200 break-all"
                    >
                      {activeContactEmail}
                    </a>
                  </li>
                )}
                {activeContactPhone && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#9AC9B8] mt-0.5 shrink-0">
                      <PhoneIcon />
                    </span>
                    <a
                      href={`tel:${activeContactPhone}`}
                      className="text-[12px] text-[#CFE4DC] hover:text-white transition-colors duration-200"
                    >
                      {activeContactPhone}
                    </a>
                  </li>
                )}
                {activeContactAddress && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#9AC9B8] mt-0.5 shrink-0">
                      <PinIcon />
                    </span>
                    <span className="text-[12px] text-[#CFE4DC] leading-[1.5]">
                      {activeContactAddress}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 5: Stay Updated Newsletter */}
            <div className="sm:col-span-2 lg:col-span-1 lg:pl-6">
              <h4
                className="text-[15.5px] font-bold text-white mb-1.5"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                Stay Updated
              </h4>
              <p className="text-[12px] text-[#CFE4DC] mb-3.5">
                Get the latest updates and offers.
              </p>

              <form onSubmit={handleNewsletterSubmit}>
                <div className="flex items-center bg-white rounded-full p-1 pl-4 max-w-[340px] lg:max-w-none">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value)
                      if (subscribed) setSubscribed(false)
                    }}
                    placeholder="Your email address"
                    aria-label="Your email address"
                    className="flex-1 min-w-0 bg-transparent text-[12px] text-[#0D2C23] placeholder:text-[#6B8579] outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to updates"
                    className="w-8 h-8 rounded-full bg-[#57A12A] hover:bg-[#498B22] active:scale-95 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                {subscribed && (
                  <p className="mt-2 text-[11.5px] font-medium text-[#9EE87B]">
                    Thanks for subscribing!
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-2.5 text-[11px] text-[#A2C7BA]">
            <p className="text-center md:text-left">{copyrightText}</p>

            {developed_by_name && (
              <p className="text-center text-[#8EB7A9]">
                Developed by{' '}
                <a
                  href={developed_by_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D1E8DF] hover:text-white transition-colors duration-200"
                >
                  {developed_by_name}
                </a>
              </p>
            )}

            <div className="flex items-center gap-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookies'].map((item, idx, arr) => (
                <span key={item} className="inline-flex items-center gap-2.5">
                  <Link href="#" className="hover:text-white transition-colors duration-200">
                    {item}
                  </Link>
                  {idx < arr.length - 1 && <span className="text-white/25">|</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
