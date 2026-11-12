/**
 * src/lib/api_homepage.js  — pure JS, no JSX
 *
 * Fetches all homepage section data from the Django backend in one call.
 * Falls back to hardcoded defaults so the page never breaks during downtime.
 *
 * JSX icons live separately in:
 *   src/app/config/homepageIcons.jsx
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

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
    featured_collections: {
        eyebrow: 'FEATURED COLLECTIONS',
        heading: 'Curated for a Healthier You',
        subtitle: 'Explore our handpicked collections of fresh and healthy foods.',
        view_all_text: 'View All Collections',
        view_all_href: '/shop',
        collections: [
            {
                id: 'organic',
                title: 'Organic Collection',
                href: '/shop?search=organic',
                image_url: '/homepage/collections/col_organic.webp',
                icon_key: 'organic',
                icon_bg: '#E3F0DB',
                icon_color: '#2E6B38',
            },
            {
                id: 'farm',
                title: 'Fresh From Farm',
                href: '/shop',
                image_url: '/homepage/collections/col_farm.webp',
                icon_key: 'farm',
                icon_bg: '#FBF0C9',
                icon_color: '#D49A1A',
            },
            {
                id: 'healthy',
                title: 'Healthy Food Collection',
                href: '/shop',
                image_url: '/homepage/collections/col_healthy.webp',
                icon_key: 'healthy',
                icon_bg: '#E2F2D5',
                icon_color: '#498428',
            },
            {
                id: 'essentials',
                title: 'Daily Essentials',
                href: '/shop',
                image_url: '/homepage/collections/col_essentials.webp',
                icon_key: 'essentials',
                icon_bg: '#FCE7CF',
                icon_color: '#D97B29',
            },
        ],
        best_sellers: {
            title: 'Best Sellers',
            subtitle: 'Most loved products by our customers',
            cta_text: 'Shop Best Sellers',
            cta_href: '/shop',
            product_slugs: [],
        },
        new_arrivals: {
            title: 'New Arrivals',
            subtitle: 'Discover our latest products',
            cta_text: 'Shop New Arrivals',
            cta_href: '/shop',
            product_slugs: [],
        },
        promos: [
            {
                id: 'bundles',
                badge_text: 'Save More',
                badge_style: 'sage',
                title: 'Weekly Grocery Bundles',
                subtitle: 'Get more for less with our ready-made packs.',
                cta_text: 'Explore Bundles',
                cta_href: '/offers',
                discount_label: '',
                image_url: '/homepage/collections/promo_bundles.webp',
                theme: 'sage',
            },
            {
                id: 'offers',
                badge_text: 'Limited Time',
                badge_style: 'amber',
                title: 'Special Offers',
                subtitle: 'Up to 30% OFF on fresh products!',
                cta_text: 'Shop Deals',
                cta_href: '/offers',
                discount_label: 'Up to|30%|OFF',
                image_url: '/homepage/collections/promo_offers.webp',
                theme: 'cream',
            },
            {
                id: 'leftover',
                badge_text: '',
                badge_style: 'leaf',
                title: 'Leftover Packs',
                subtitle: 'Great quality. Greater value. Help reduce food waste!',
                cta_text: 'Grab Yours',
                cta_href: '/stores',
                discount_label: 'Up to|50%|OFF',
                image_url: '/homepage/collections/promo_leftover.webp',
                theme: 'dark_green',
            },
            {
                id: 'farmers',
                badge_text: '',
                badge_style: 'none',
                title: 'Meet Our Farmers',
                subtitle: 'Know the people behind your fresh food.',
                cta_text: 'Learn More',
                cta_href: '/about',
                discount_label: '',
                image_url: '/homepage/collections/promo_farmers.webp',
                theme: 'warm_cream',
            },
        ],
    },
    testimonials: [
        {
            id: 1,
            quote: 'Excellent quality and crisp farm produce! Every basket from El Árbol tastes harvested the same morning.',
            author: 'Sarah M.',
            location: 'Dhaka',
            initials: 'SM',
            rating: 5,
        },
        {
            id: 2,
            quote: 'Grabbing a Leftover Pack from our nearby store saves money every week and keeps fresh food from going to waste.',
            author: 'Rafiq H.',
            location: 'Dhanmondi',
            initials: 'RH',
            rating: 5,
        },
        {
            id: 3,
            quote: 'Our family relies on El Árbol for pesticide-free vegetables and reliable same-day doorstep delivery.',
            author: 'Nadia K.',
            location: 'Gulshan',
            initials: 'NK',
            rating: 5,
        },
        {
            id: 4,
            quote: 'For our café kitchen, El Árbol wholesale crates always arrive fresh, graded, and right on schedule.',
            author: 'Tariq A.',
            location: 'Banani',
            initials: 'TA',
            rating: 5,
        },
    ],
    faqs: [
        {
            id: 'order',
            question: 'How do I place an order?',
            answer: 'Browse fresh seasonal produce in our Shop, add your chosen items or bundles to your basket, select Home Delivery or Click & Collect at a local store, and complete checkout in seconds.',
        },
        {
            id: 'delivery',
            question: 'What is the delivery time?',
            answer: 'We offer same-day and next-morning carbon-free delivery across Dhaka and surrounding areas, or convenient instant pickup via Click & Collect at your nearest El Árbol store.',
        },
        {
            id: 'organic',
            question: 'Is the produce locally grown and organic?',
            answer: 'Yes. Every fruit, vegetable, and pantry item is sourced directly from trusted local partner farms following sustainable, clean-harvest practices with zero harmful chemical sprays.',
        },
        {
            id: 'leftover-pack',
            question: 'How do Leftover Packs work?',
            answer: 'Leftover Packs are curated surprise bundles of fresh surplus produce from our local stores offered at up to 40–50% off—giving you great value while helping reduce food waste.',
        },
        {
            id: 'returns',
            question: 'What if an item arrives damaged or not fresh?',
            answer: 'Your freshness is guaranteed. Contact our support team within 24 hours of delivery or pickup with your order number for an immediate replacement or full refund.',
        },
    ],
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
        const rawFc = data.featured_collections && typeof data.featured_collections === 'object' ? data.featured_collections : {}
        const fallbackFc = FALLBACK.featured_collections

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
            },
            featured_collections: {
                ...fallbackFc,
                ...rawFc,
                collections: Array.isArray(rawFc.collections) && rawFc.collections.length > 0 ? rawFc.collections : fallbackFc.collections,
                best_sellers: { ...fallbackFc.best_sellers, ...(rawFc.best_sellers || {}) },
                new_arrivals: { ...fallbackFc.new_arrivals, ...(rawFc.new_arrivals || {}) },
                promos: Array.isArray(rawFc.promos) && rawFc.promos.length > 0 ? rawFc.promos : fallbackFc.promos,
            },
            testimonials: Array.isArray(data.testimonials) && data.testimonials.length > 0 ? data.testimonials : FALLBACK.testimonials,
            faqs: Array.isArray(data.faqs) && data.faqs.length > 0 ? data.faqs : FALLBACK.faqs,
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