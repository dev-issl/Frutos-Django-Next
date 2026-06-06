/**
 * lib/api_website.js
 *
 * Fetches website content (hero banners, offer banners, blog posts, etc.)
 * from the Django /api/website/ endpoints.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
    return res.json()
}

// ── Hero Banners ──────────────────────────────────────────────────────────────

/**
 * Returns array of active hero banners ordered by `order`.
 * Each banner: { id, title, subtitle, description, button_text, button_url,
 *                order, autoplay_duration, is_active, image_url_final }
 */
export async function getHeroBanners() {
    try {
        const data = await fetchJson(`${API_BASE}/website/hero-banners/`)
        const results = Array.isArray(data) ? data : (data.results || [])
        return results.filter(b => b.is_active !== false)
    } catch (err) {
        console.warn('[api_website] getHeroBanners failed:', err.message)
        return []
    }
}

/**
 * Returns offer banners (main, vertical, horizontal).
 */
export async function getOfferBanners() {
    try {
        const data = await fetchJson(`${API_BASE}/website/offer-banners/`)
        const results = Array.isArray(data) ? data : (data.results || [])
        return results.filter(b => b.is_active !== false)
    } catch (err) {
        console.warn('[api_website] getOfferBanners failed:', err.message)
        return []
    }
}

/**
 * Returns horizontal promo banners.
 */
export async function getHorizontalBanners() {
    try {
        const data = await fetchJson(`${API_BASE}/website/horizontal-banners/`)
        const results = Array.isArray(data) ? data : (data.results || [])
        return results.filter(b => b.is_active !== false)
    } catch (err) {
        console.warn('[api_website] getHorizontalBanners failed:', err.message)
        return []
    }
}

/**
 * Returns active blog posts.
 */
export async function getBlogPosts({ limit = 8 } = {}) {
    try {
        const data = await fetchJson(`${API_BASE}/website/blog-posts/`)
        const results = Array.isArray(data) ? data : (data.results || [])
        return results.filter(b => b.is_active !== false).slice(0, limit)
    } catch (err) {
        console.warn('[api_website] getBlogPosts failed:', err.message)
        return []
    }
}

/**
 * Returns active offer categories (navbar dropdown offers).
 */
export async function getOfferCategories() {
    try {
        const data = await fetchJson(`${API_BASE}/website/offer-categories/`)
        const results = Array.isArray(data) ? data : (data.results || [])
        return results.filter(c => c.is_active !== false)
    } catch (err) {
        console.warn('[api_website] getOfferCategories failed:', err.message)
        return []
    }
}

/**
 * Convenience: all homepage data in one call using the consolidated endpoint.
 * Returns { hero_banners, offer_banners, horizontal_banners, blog_posts }
 */
export async function getHomepageWebsiteData() {
    try {
        return await fetchJson(`${API_BASE}/website/data/homepage/`)
    } catch (err) {
        console.warn('[api_website] getHomepageWebsiteData failed:', err.message)
        return { hero_banners: [], offer_banners: [], horizontal_banners: [], blog_posts: [] }
    }
}