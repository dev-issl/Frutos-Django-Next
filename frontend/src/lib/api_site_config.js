const API_BASE = (process.env.NEXT_PUBLIC_API_URL).replace(/\/$/, '')

const FALLBACK_CONFIG = {
    brand_name: 'El Árbol',
    brand_tagline: 'Rooted in quality, growing for the future. We provide the bridge between local farmers and your dinner table.',
    navbar_logo_url: '/el-erbol-logo.png',
    footer_logo_url: '/el-erbol-logo.png',
    favicon_url: '/favicon.ico',
    contact_email: 'hello@elarbol.com',
    contact_phone: '+34 900 123 456',
    contact_address: 'Calle de la Huertas 12, 28014 Madrid, Spain',
    meta_title: 'El Árbol',
    meta_description: 'Artisan produce, delivered with care.',
    meta_keywords: 'El Árbol, artisan, produce, wholesale, fruits',
    og_title: 'El Árbol - Premium Wholesale Fruits',
    og_description: 'Artisan produce, delivered with care from local farmers to your table.',
    og_image_url: '/favicon_orrange.jpeg',
    developed_by_name: 'Intelligent Systems and Solutions Limited',
    developed_by_url: 'https://www.intelligentsystemsltd.com/',
    we_accept_text: 'Visa, Mastercard, Amex',
    quick_links_text: 'Shop All:/shop, Our Stores:/stores, About Us:/about, Wholesale:/wholesale',
    nav_links: [
        { label: 'Shop all', href: '/shop' },
        { label: 'Stores', href: '/stores' },
        { label: 'About', href: '/about' },
        { label: 'Wholesale', href: '/wholesale' },
    ],
    social_links: [],
    store_locations: [],
    payment_methods: [],
}

export async function getSiteConfig() {
    const candidates = [
        `${API_BASE}/website/site-config/`,
    ]

    for (const url of candidates) {
        try {
            const res = await fetch(url, { cache: 'no-store' })
            if (!res.ok) {
                // don't spam console.error for expected 404s — try next candidate
                console.debug(`[getSiteConfig] ${res.status} from ${url}`)
                continue
            }

            const data = await res.json()
            console.log('[getSiteConfig] Loaded from API ✓', url)
            return data

        } catch (err) {
            // Network errors are unexpected; log and continue to try other endpoints
            console.warn(`[getSiteConfig] Fetch failed from ${url}:`, err && err.message ? err.message : err)
            continue
        }
    }

    // No endpoint succeeded — return fallback silently
    return FALLBACK_CONFIG
}