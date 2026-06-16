/**
 * src/lib/api_homepage.js  — pure JS, no JSX
 *
 * Fetches all homepage section data from the Django backend in one call.
 * Falls back to hardcoded defaults so the page never breaks during downtime.
 *
 * JSX icons live separately in:
 *   src/app/config/homepageIcons.jsx
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000/api' : 'https://elarbol.icommerce.com.bd/api')

const DEFAULT_MOBILE_IMAGE = 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&auto=format&fit=crop'
const DEFAULT_DESKTOP_IMAGE = '/homepage/hero_image.png'
const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop'

// ── Fallback ──────────────────────────────────────────────────────────────────

const FALLBACK = {
    hero: {
        mobile_heading: 'Freshness from the Orchard to Your Table.',
        mobile_image_url: DEFAULT_MOBILE_IMAGE,
        desktop_heading: 'Fresh from the market, delivered to your door.',
        desktop_subtext: 'Experience the finest seasonal harvests sourced directly from local growers. We bring the artisanal market experience to your kitchen.',
        desktop_image_url: DEFAULT_DESKTOP_IMAGE,
        primary_cta_text: 'Shop Now',
        primary_cta_href: '/shop',
        secondary_cta_text: 'Find My Store',
        secondary_cta_href: '/stores',
    },
    how_it_works: { heading: 'How It Works' },
    steps: [
        { id: 1, icon_key: 'select', title: 'Select Your Harvest', desc: 'Choose from our daily updated inventory of organic produce.' },
        { id: 2, icon_key: 'delivery', title: 'Carbon-Free Delivery', desc: 'Our electric fleet ensures your groceries arrive fresh and green.' },
        { id: 3, icon_key: 'local', title: 'Enjoy Local Flavors', desc: 'Direct support to local farmers in every bite.' },
    ],
    leftover_banner: {
        heading: 'Leftover Pack — Save food, save money',
        description: 'Get a curated selection of seasonal surplus at 40% off. Perfectly good produce that deserves a home.',
        cta_text: 'Get Your Pack',
        cta_href: '/stores',
        image_url: DEFAULT_BANNER_IMAGE,
    },
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function getHomepageData() {
    try {
        const res = await fetch(`${API_BASE}/website/home-page/`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)

        const data = await res.json()
        
        // Transform backend response to match frontend expectations
        const transformedData = {
            hero: {
                ...(data.hero_section || FALLBACK.hero),
                mobile_image_url: data.hero_image_mobile_url || (data.hero_section?.mobile_image_url) || DEFAULT_MOBILE_IMAGE,
                desktop_image_url: data.hero_image_desktop_url || (data.hero_section?.desktop_image_url) || DEFAULT_DESKTOP_IMAGE,
            },
            how_it_works: data.how_it_works && Object.keys(data.how_it_works).length > 0 ? data.how_it_works : FALLBACK.how_it_works,
            steps: data.steps && data.steps.length > 0 ? data.steps : FALLBACK.steps,
            leftover_banner: {
                ...(data.leftover_banner || FALLBACK.leftover_banner),
                image_url: data.leftover_banner_image_url || (data.leftover_banner?.image_url) || DEFAULT_BANNER_IMAGE,
            }
        }
        
        // Merge with defaults if fields are empty
        if (!transformedData.hero.mobile_heading) transformedData.hero = { ...FALLBACK.hero, ...transformedData.hero };
        if (!transformedData.leftover_banner.heading) transformedData.leftover_banner = { ...FALLBACK.leftover_banner, ...transformedData.leftover_banner };

        return transformedData
    } catch (err) {
        console.warn('[api_homepage] fallback:', err.message)
        return FALLBACK
    }
}

/**
 * Updates the homepage data.
 * @param {FormData} formData
 */
export async function updateHomePageContent(formData) {
    const token = localStorage.getItem("accessToken")
    const res = await fetch(`${API_BASE}/website/home-page/`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: formData,
    })
    
    if (!res.ok) {
        throw new Error(`Failed to update homepage content. Status: ${res.status}`)
    }
    
    return res.json()
}