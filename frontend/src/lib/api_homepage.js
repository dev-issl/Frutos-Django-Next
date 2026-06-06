/**
 * lib/api_homepage.js
 *
 * Fetches homepage data from Django backend.
 * Uses /api/website/ endpoints for all sections.
 * Falls back to hardcoded defaults so the page never breaks.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

const DEFAULT_MOBILE_IMAGE = 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&auto=format&fit=crop'
const DEFAULT_DESKTOP_IMAGE = '/homepage/hero_image.png'
const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop'

// ── Fallback static data ──────────────────────────────────────────────────────

const FALLBACK = {
    hero: {
        mobile_heading: 'Freshness from the Orchard to Your Table.',
        mobile_image_url: DEFAULT_MOBILE_IMAGE,
        desktop_heading: 'Fresh from the market, delivered to your door.',
        desktop_subtext: 'Experience the finest seasonal harvests sourced directly from local growers.',
        desktop_image_url: DEFAULT_DESKTOP_IMAGE,
        primary_cta_text: 'Shop Now',
        primary_cta_href: '/shop',
        secondary_cta_text: 'Find My Store',
        secondary_cta_href: '/stores',
    },
    // hero_banners: dynamic banners from API (empty fallback)
    hero_banners: [],
    feature_cards: [],
    how_it_works: { heading: 'How It Works' },
    steps: [
        { id: 1, icon_key: 'select', title: 'Select Your Harvest', desc: 'Choose from our daily updated inventory of organic produce.' },
        { id: 2, icon_key: 'delivery', title: 'Carbon-Free Delivery', desc: 'Our electric fleet ensures your groceries arrive fresh and green.' },
        { id: 3, icon_key: 'local', title: 'Enjoy Local Flavors', desc: 'Direct support to local farmers in every bite.' },
    ],
    leftover_banner: {
        heading: 'Leftover Pack — Save food, save money',
        description: 'Get a curated selection of seasonal surplus at 40% off.',
        cta_text: 'Get Your Pack',
        cta_href: '/stores',
        image_url: DEFAULT_BANNER_IMAGE,
    },
}

// ── Fetch hero banners from website API ───────────────────────────────────────

async function fetchHeroBanners() {
    try {
        const res = await fetch(`${API_BASE}/website/hero-banners/`, { cache: 'no-store' })
        if (!res.ok) return []
        const data = await res.json()
        const results = Array.isArray(data) ? data : (data.results || [])
        return results.filter(b => b.is_active !== false).sort((a, b) => (a.order || 0) - (b.order || 0))
    } catch {
        return []
    }
}

// ── Build legacy `hero` object from first banner (backward compat) ─────────

function buildLegacyHero(banners) {
    if (!banners || banners.length === 0) return null

    const first = banners[0]
    return {
        mobile_heading: first.title || FALLBACK.hero.mobile_heading,
        mobile_image_url: first.image_url_final || DEFAULT_MOBILE_IMAGE,
        desktop_heading: first.title || FALLBACK.hero.desktop_heading,
        desktop_subtext: first.subtitle || FALLBACK.hero.desktop_subtext,
        desktop_image_url: first.image_url_final || DEFAULT_DESKTOP_IMAGE,
        primary_cta_text: first.button_text || FALLBACK.hero.primary_cta_text,
        primary_cta_href: first.button_url || FALLBACK.hero.primary_cta_href,
        secondary_cta_text: FALLBACK.hero.secondary_cta_text,
        secondary_cta_href: FALLBACK.hero.secondary_cta_href,
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getHomepageData() {
    try {
        // Fetch hero banners from website API
        const heroBanners = await fetchHeroBanners()

        // Build legacy hero object for backward compat with HeroSection
        const heroFromApi = buildLegacyHero(heroBanners)

        return {
            ...FALLBACK,
            hero: heroFromApi || FALLBACK.hero,
            hero_banners: heroBanners, // full array for future slider use
        }
    } catch (err) {
        console.warn('[api_homepage] fallback:', err ? .message)
        return FALLBACK
    }
}