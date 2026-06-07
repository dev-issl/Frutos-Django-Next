import Link from 'next/link'
import Image from 'next/image'

// ── Social icon map (by platform name from API) ──────────────────────────────
const SOCIAL_ICONS = {
  facebook: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  instagram: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  twitter: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.5 4.4 9 4.5C11.6 4.6 17.7 2.8 22 4z"/>
    </svg>
  ),
  linkedin: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  youtube: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-2C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  ),
  tiktok: () => (
    <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.83a8.2 8.2 0 0 0 4.79 1.53V6.9a4.85 4.85 0 0 1-1.02-.21z"/>
    </svg>
  ),
  pinterest: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.26-5.33 1.26-5.33s-.32-.65-.32-1.6c0-1.5.87-2.62 1.95-2.62.92 0 1.37.69 1.37 1.52 0 .93-.59 2.31-.9 3.6-.25 1.08.54 1.95 1.6 1.95 1.92 0 3.21-2.47 3.21-5.4 0-2.23-1.51-3.79-3.67-3.79-2.5 0-3.97 1.88-3.97 3.82 0 .76.29 1.57.65 2.01.07.09.08.17.06.26-.07.27-.22.87-.25.99-.04.16-.14.2-.32.12-1.19-.56-1.93-2.3-1.93-3.7 0-3.01 2.19-5.77 6.31-5.77 3.32 0 5.9 2.37 5.9 5.53 0 3.3-2.08 5.96-4.96 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.22c-.22.83-.8 1.87-1.19 2.5.9.28 1.85.43 2.83.43 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
    </svg>
  ),
  Globe: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
}

function SocialIcon({ platform, iconName }) {
  const key = (iconName || platform || '').toLowerCase()
  const Icon = SOCIAL_ICONS[key] || SOCIAL_ICONS['Globe']
  return Icon ? <Icon /> : null
}

const EmailIcon = () => (
  <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6.15 6.15l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const PinIcon = ({ stroke = 'rgba(255,255,255,0.45)' }) => (
  <svg width="14" height="14" fill="none" stroke={stroke} strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

// ── Build footer columns from dynamic footer_sections ────────────────────────
function buildFooterColumns(footer_sections = [], nav_links = []) {
  // If no dynamic sections, fall back to nav_links as a "Quick Links" column
  if (!footer_sections || footer_sections.length === 0) {
    return nav_links.length > 0
      ? [{ id: 'nav', title: 'Quick Links', links: nav_links.map(l => ({ text: l.label, url: l.href })) }]
      : []
  }

  return footer_sections
    .filter(s => s.is_active !== false)
    .map(section => ({
      id: section.id,
      title: section.title,
      section_type: section.section_type,
      links: (section.links || [])
        .filter(l => l.is_active !== false)
        .map(l => ({ text: l.text, url: l.url, open_in_new_tab: l.open_in_new_tab })),
    }))
    .filter(s => s.links.length > 0)
}

export default function Footer({ config }) {
  if (!config) return null

  const {
    brand_name       = 'El Árbol',
    brand_tagline    = '',
    footer_logo_url  = '',
    contact_email    = '',
    contact_phone    = '',
    contact_address  = '',
    nav_links        = [],
    store_locations  = [],
    social_links     = [],
    payment_methods  = [],
    footer_sections  = [],
  } = config

  const currentYear  = new Date().getFullYear()
  const copyrightText = `© ${currentYear} ${brand_name}. All rights reserved.`

  const activeContactEmail = contact_email || 'hello@elarbol.com';
  const activeContactPhone = contact_phone || '+880 1712-345678';
  const activeContactAddress = contact_address || 'House 12, Road 5, Dhanmondi, Dhaka, Bangladesh';

  const activeNavLinks = nav_links && nav_links.length > 0 ? nav_links : [
    { label: 'Shop All', href: '/shop' },
    { label: 'Our Stores', href: '/stores' },
    { label: 'About Us', href: '/about' },
    { label: 'Wholesale', href: '/wholesale' }
  ];

  const activeStoreLocations = store_locations && store_locations.length > 0 ? store_locations : [
    { name: 'FreshDrop (Dhanmondi)', slug: 'dhaka-dhanmondi' }
  ];

  const footerColumns = buildFooterColumns(footer_sections, activeNavLinks)
  const companyInfoSection = footer_sections.find(s => s.section_type === 'company_info')
  const companyTagline = companyInfoSection
    ? (companyInfoSection.links?.[0]?.text || brand_tagline)
    : brand_tagline

  const linkColumns = footerColumns.filter(c => c.section_type !== 'company_info')
  const displayCols = linkColumns.slice(0, 3)

  const activePaymentMethods = payment_methods && payment_methods.length > 0 ? payment_methods : [
    { title: 'Visa', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png' },
    { title: 'Mastercard', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png' },
    { title: 'Amex', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/200px-American_Express_logo_%282018%29.svg.png' }
  ];

  return (
    <footer className="relative bg-[#043328] text-white pt-16 pb-8 border-t border-[#064234] mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-white/10">
          
          <div className="lg:col-span-4 lg:pr-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 transition-opacity hover:opacity-90">
              {footer_logo_url ? (
                <img src={footer_logo_url} alt={`${brand_name} logo`} className="w-10 h-10 object-contain brightness-0 invert" />
              ) : (
                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                  <span className="text-xl font-bold">{brand_name[0]}</span>
                </div>
              )}
              <span className="font-serif text-2xl font-bold tracking-wide">{brand_name}</span>
            </Link>
            <p className="text-[13px] text-gray-300 leading-relaxed mb-8 pr-4">
              {companyTagline || brand_tagline || 'Discover our premium selection of quality products. We are dedicated to providing the best shopping experience for our customers.'}
            </p>
            <div className="flex items-center gap-4">
              <button className="bg-emerald-500 hover:bg-emerald-400 text-[#043328] text-[11px] font-bold uppercase tracking-widest py-2.5 px-5 rounded-full transition-colors duration-300 shadow-lg shadow-emerald-500/20">
                Follow Us
              </button>
              <div className="flex gap-2.5 flex-wrap">
                {social_links.map((s, i) => {
                  const Icon = SOCIAL_ICONS[(s.icon_name || s.platform || '').toLowerCase()] || SOCIAL_ICONS['Globe']
                  return (
                    <a
                      key={i}
                      href={s.url}
                      title={s.title || s.platform}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-emerald-500 hover:border-emerald-500 hover:text-[#043328] transition-all duration-300"
                    >
                      <Icon />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {displayCols.map(col => (
            <div key={col.id} className="lg:col-span-2">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-6">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3.5">
                {col.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.url || '#'}
                      target={link.open_in_new_tab ? '_blank' : undefined}
                      rel={link.open_in_new_tab ? 'noopener noreferrer' : undefined}
                      className="text-[13px] text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {activeStoreLocations.length > 0 && displayCols.length < 3 && (
            <div className="lg:col-span-2">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-6">Stores</h4>
              <ul className="flex flex-col gap-3.5">
                {activeStoreLocations.map((store, i) => (
                  <li key={store.slug || i}>
                    <Link href={`/stores/${store.slug || ''}`} className="text-[13px] text-gray-300 hover:text-white transition-colors duration-200">
                      {store.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="lg:col-span-3 lg:col-start-10">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-6">
              Contact Us
            </h4>
            <ul className="flex flex-col gap-4 mb-8">
              {activeContactEmail && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-400/80"><EmailIcon /></span>
                  <a href={`mailto:${activeContactEmail}`} className="text-[13px] text-gray-300 hover:text-white transition-colors duration-200 break-all">
                    {activeContactEmail}
                  </a>
                </li>
              )}
              {activeContactPhone && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-400/80"><PhoneIcon /></span>
                  <a href={`tel:${activeContactPhone}`} className="text-[13px] text-gray-300 hover:text-white transition-colors duration-200">
                    {activeContactPhone}
                  </a>
                </li>
              )}
              {activeContactAddress && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-400/80"><PinIcon /></span>
                  <span className="text-[13px] text-gray-300 leading-relaxed">
                    {activeContactAddress}
                  </span>
                </li>
              )}
            </ul>

            {activePaymentMethods.length > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">We Accept</p>
                <div className="flex flex-wrap gap-2">
                  {activePaymentMethods.map((pm, i) => (
                    <div key={i} title={pm.title} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 flex items-center justify-center min-w-[48px] h-[28px]">
                      {pm.image_url ? (
                        <img src={pm.image_url} alt={pm.title} className="max-h-[16px] object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">{pm.title}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 order-2 md:order-1 text-center md:text-left">
            {copyrightText}
          </p>
          <p className="text-xs text-gray-400 order-3 md:order-2 text-center">
            Developed by <a href="https://www.intelligentsystemsltd.com/" target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:underline">Intelligent Systems and Solutions Limited</a>
          </p>
          <div className="flex gap-6 order-1 md:order-3">
            {['Privacy Policy', 'Terms of Service', 'Cookies'].map((item) => (
              <a key={item} href="#" className="text-xs text-gray-400 hover:text-white transition-colors duration-200">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}