/**
 * lib/api_site_config.js
 *
 * Fetches unified site config from Django backend.
 * Endpoint: GET /api/website/site-config/
 *
 * Returns shape used by layout.jsx, NavbarWrapper, FooterWrapper:
 *   brand_name, brand_tagline, navbar_logo_url, footer_logo_url,
 *   contact_email, contact_phone, contact_address,
 *   nav_links: [{label, href}],
 *   social_links: [{url, icon_name, title}],
 *   footer_sections: [{id, title, section_type, links:[{text,url,...}]}],
 *   site_settings: [{key, value, group}]
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

const FALLBACK_CONFIG = {
    brand_name: 'El Árbol',
    brand_tagline: 'Rooted in quality, growing for the future.',
    navbar_logo_url: '/el-erbol-logo.png',
    footer_logo_url: '/el-erbol-logo.png',
    favicon_url: '/favicon.ico',
    contact_email: 'hello@elarbol.com',
    contact_phone: '+34 900 123 456',
    contact_address: 'Calle de la Huertas 12, 28014 Madrid, Spain',
    nav_links: [
        { label: 'Shop all', href: '/shop' },
        { label: 'Stores', href: '/stores' },
        { label: 'About', href: '/about' },
        { label: 'Wholesale', href: '/wholesale' },
    ],
    social_links: [],
    footer_sections: [],
    site_settings: [],
    store_locations: [],
    payment_methods: [],
}

export async function getSiteConfig() {
    try {
        const res = await fetch(`${API_BASE}/website/site-config/`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) {
            console.warn(`[getSiteConfig] HTTP ${res.status} from /api/website/site-config/`)
            return FALLBACK_CONFIG
        }

        const data = await res.json()
        console.log('[getSiteConfig] Loaded from API ✓')

        // Merge with fallback so missing keys never blow up components
        return {...FALLBACK_CONFIG, ...data }
    } catch (err) {
        console.warn('[getSiteConfig] fetch failed:', err ? .message || err)
        return FALLBACK_CONFIG
    }
}