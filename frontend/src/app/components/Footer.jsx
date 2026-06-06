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

  // Dynamic footer columns — prefer footer_sections, fallback to nav_links
  const footerColumns = buildFooterColumns(footer_sections, nav_links)

  // Identify company_info / contact section if present
  const companyInfoSection = footer_sections.find(s => s.section_type === 'company_info')
  const companyTagline = companyInfoSection
    ? (companyInfoSection.links?.[0]?.text || brand_tagline)
    : brand_tagline

  // Non-company-info columns (for grid display)
  const linkColumns = footerColumns.filter(c => c.section_type !== 'company_info')

  const SocialBar = ({ links = [] }) => (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {links.map((s, i) => (
        <a
          key={i}
          href={s.url}
          title={s.title || s.platform}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)',
            flexShrink: 0, textDecoration: 'none',
          }}
        >
          <SocialIcon platform={s.platform} iconName={s.icon_name} />
        </a>
      ))}
    </div>
  )

  const PaymentSection = () => {
    if (!payment_methods.length) return null
    return (
      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '12px' }}>
          We Accept
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {payment_methods.map((pm, i) => (
            <div key={i} title={pm.title} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '52px', height: '32px' }}>
              {pm.image_url
                ? <Image src={pm.image_url} alt={pm.title} width={48} height={24} style={{ objectFit: 'contain', maxHeight: '20px' }} />
                : <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{pm.title}</span>
              }
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Compute grid columns: brand col + link cols (capped at 3) + contact col
  const displayCols = linkColumns.slice(0, 3)
  const gridCols = `1.4fr ${displayCols.map(() => '1fr').join(' ')} 1.2fr`

  return (
    <footer style={{ background: '#085041', borderRadius: '24px 24px 0 0', color: 'white', marginTop: '0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 28px' }}>

        {/* ── DESKTOP ── */}
        <div className="hidden md:block">
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '40px', marginBottom: '48px' }}>

            {/* Brand col */}
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', textDecoration: 'none' }}>
                {footer_logo_url ? (
                  <Image src={footer_logo_url} alt={`${brand_name} logo`} width={32} height={32} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                ) : (
                  <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'white', fontWeight: 700 }}>{brand_name[0]}</span>
                  </div>
                )}
                <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', fontWeight: 700, color: 'white' }}>
                  {brand_name}
                </span>
              </Link>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: '24px', maxWidth: '220px' }}>
                {companyTagline || brand_tagline}
              </p>
              <SocialBar links={social_links} />
            </div>

            {/* Dynamic link columns */}
            {displayCols.map(col => (
              <div key={col.id}>
                <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '20px' }}>
                  {col.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.url || '#'}
                        target={link.open_in_new_tab ? '_blank' : undefined}
                        rel={link.open_in_new_tab ? 'noopener noreferrer' : undefined}
                        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Stores column (kept for backward compat) */}
            {store_locations.length > 0 && displayCols.length < 3 && (
              <div>
                <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '20px' }}>
                  Stores
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {store_locations.map((store, i) => (
                    <li key={store.slug || i}>
                      <Link href={`/stores/${store.slug || ''}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
                        {store.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact col */}
            <div>
              <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '20px' }}>
                Contact
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {contact_email && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ marginTop: '2px', flexShrink: 0 }}><EmailIcon /></span>
                    <a href={`mailto:${contact_email}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', lineHeight: 1.5 }}>
                      {contact_email}
                    </a>
                  </li>
                )}
                {contact_phone && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ marginTop: '2px', flexShrink: 0 }}><PhoneIcon /></span>
                    <a href={`tel:${contact_phone}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', lineHeight: 1.5 }}>
                      {contact_phone}
                    </a>
                  </li>
                )}
                {contact_address && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ marginTop: '2px', flexShrink: 0 }}><PinIcon /></span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                      {contact_address}
                    </span>
                  </li>
                )}
              </ul>
              <PaymentSection />
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{copyrightText}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Developed by{' '}
              <a href="https://www.intelligentsystemsltd.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500' }}>
                Intelligent Systems and Solutions Limited
              </a>
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              {['Privacy Policy', 'Terms of Service', 'Cookies'].map((item) => (
                <a key={item} href="#" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{item}</a>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE ── */}
        <div className="md:hidden">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              {footer_logo_url ? (
                <Image src={footer_logo_url} alt={`${brand_name} logo`} width={24} height={24} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.5 2 6 5 6 8c0 2.5 1.2 4.5 3 5.7V22h2v-4h2v4h2V13.7c1.8-1.2 3-3.2 3-5.7 0-3-2.5-6-6-6z"/>
                </svg>
              )}
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '17px', fontWeight: 700, color: 'white' }}>
                {brand_name}
              </span>
            </a>
            <SocialBar links={social_links} />
          </div>

          {contact_email && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <a href={`mailto:${contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}>
                <EmailIcon />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{contact_email}</span>
              </a>
            </div>
          )}

          {/* Mobile link grid — first 2 columns */}
          {linkColumns.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {linkColumns.slice(0, 2).map(col => (
                <div key={col.id}>
                  <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '14px' }}>
                    {col.title}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {col.links.map((link, i) => (
                      <li key={i}>
                        <Link href={link.url || '#'} target={link.open_in_new_tab ? '_blank' : undefined} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {/* Stores fallback if no dynamic sections */}
              {linkColumns.length === 0 && store_locations.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '14px' }}>Stores</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {store_locations.map((store, i) => (
                      <li key={store.slug || i}>
                        <Link href={`/stores/${store.slug || ''}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>{store.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {contact_address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '20px' }}>
              <span style={{ flexShrink: 0, marginTop: '2px' }}><PinIcon stroke="rgba(255,255,255,0.4)" /></span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{contact_address}</span>
            </div>
          )}

          <PaymentSection />

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['Privacy', 'Terms', 'Cookies'].map((item) => (
                <a key={item} href="#" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{item}</a>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{copyrightText}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
              Developed by Intelligent Systems and Solutions Limited
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}