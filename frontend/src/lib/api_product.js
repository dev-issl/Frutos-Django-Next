// /**
//  * src/lib/api_product.js
//  *
//  * Fetches data from the Django DRF backend.
//  * Handles both plain array responses and paginated { count, results } responses.
//  */

// const PLACEHOLDER = 'https://placehold.co/400x400/ECF7E4/00694C?text=No+Image'
// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
// const MEDIA_BASE = API_BASE.replace('/api', '')

// // DRF DefaultRouter matches under 'api/products/' prefix
// const BASE_ROUTE = '/products'
// const PRODUCT_ENDPOINT = `${BASE_ROUTE}`
// const CATEGORY_ENDPOINT = `${BASE_ROUTE}/categories`

// // ─── Core fetch helper ────────────────────────────────────────────────────────

// async function apiFetch(path, options = {}) {
//     const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
//     const cleanPath = path.startsWith('/') ? path : '/' + path
//     const url = cleanBase + cleanPath

//     const res = await fetch(url, {
//         headers: { 'Content-Type': 'application/json' },
//         cache: 'no-store',
//         ...options,
//     })

//     if (!res.ok) {
//         throw new Error('API error ' + res.status + ' for ' + url)
//     }

//     return res.json()
// }

// // ─── Safe array extractor ─────────────────────────────────────────────────────

// function toArray(data) {
//     if (Array.isArray(data)) return data
//     if (data && Array.isArray(data.results)) return data.results
//     return []
// }

// // ─── Normalizer ───────────────────────────────────────────────────────────────

// function normalizeProduct(p) {
//     let image = p.image_url || p.image || null

//     if (image && !image.startsWith('http')) {
//         image = MEDIA_BASE + '/media/' + image.replace(/^\/+/, '')
//     }

//     return {
//         ...p,
//         category: p.category || p.sub_category ? .category ? .name || null,
//         price: Number(p.price),
//         oldPrice: p.oldPrice != null ? Number(p.oldPrice) : (p.old_price != null ? Number(p.old_price) : null),
//         rating: Number(p.rating),
//         inStock: p.inStock !== undefined ? p.inStock : (p.in_stock !== undefined ? p.in_stock : p.stock),
//         onSale: p.onSale !== undefined ? p.onSale : (p.on_sale !== undefined ? p.on_sale : (p.discount_price != null && Number(p.discount_price) < Number(p.price))),
//         badgeColor: p.badgeColor || p.badge_color || '',
//         wholesalePrice: p.wholesalePrice != null ? Number(p.wholesalePrice) : null,
//         minWholesaleQty: p.minWholesaleQty || 1,
//         image: image || PLACEHOLDER,
//     }
// }

// // ─── Products ─────────────────────────────────────────────────────────────────

// export async function getProducts({ category, search, inStock } = {}) {
//     const params = new URLSearchParams()
//     if (category && category !== 'All') params.set('category', category)
//     if (search) params.set('search', search)
//     if (inStock !== undefined) params.set('in_stock', inStock)

//     const query = params.toString() ? '?' + params.toString() : ''
//     const path = query ? `${PRODUCT_ENDPOINT}/${query}` : `${PRODUCT_ENDPOINT}/`

//     const data = await apiFetch(path, { next: { tags: ['products'] } })
//     return toArray(data).map(normalizeProduct)
// }

// export async function getProductById(id) {
//     const data = await apiFetch(`${PRODUCT_ENDPOINT}/${id}/`, { next: { tags: [`product-${id}`, 'products'] } })
//     return {
//         ...normalizeProduct(data),
//         related: toArray(data.related).map(normalizeProduct),
//     }
// }

// export async function getProductBySlug(slug) {
//     const data = await apiFetch(`${PRODUCT_ENDPOINT}/slug/${slug}/`, { next: { tags: ['products'] } })
//     return {
//         ...normalizeProduct(data),
//         related: toArray(data.related).map(normalizeProduct),
//     }
// }

// // ─── Categories ───────────────────────────────────────────────────────────────

// export async function getCategories() {
//     const data = await apiFetch(`${CATEGORY_ENDPOINT}/`)
//     const names = toArray(data).map(function(cat) { return cat.name })
//     return ['All'].concat(names).concat(['On Sale'])
// }

// export async function getCategoryObjects() {
//     const data = await apiFetch(`${CATEGORY_ENDPOINT}/`)
//     return toArray(data)
// }

/**
 * src/lib/api_product.js
 */

const PLACEHOLDER = 'https://placehold.co/400x400/ECF7E4/00694C?text=No+Image'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
const MEDIA_BASE = API_BASE.replace('/api', '')

const BASE_ROUTE = '/products'

const PRODUCT_ENDPOINT = `${BASE_ROUTE}/products`
const CATEGORY_ENDPOINT = `${BASE_ROUTE}/categories`

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
    const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
    const cleanPath = path.startsWith('/') ? path : '/' + path
    const url = cleanBase + cleanPath

    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        ...options,
    })

    if (!res.ok) {
        throw new Error('API error ' + res.status + ' for ' + url)
    }

    return res.json()
}

// ─── Safe array extractor ─────────────────────────────────────────────────────

function toArray(data) {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.results)) return data.results
    return []
}

// ─── Image URL builder ────────────────────────────────────────────────────────

function buildImageUrl(raw) {
    if (!raw) return null
    if (raw.startsWith('http')) return raw
        // /media/... অথবা media/... দুটোই handle করে
    const clean = raw.replace(/^\/+/, '')
    return `${MEDIA_BASE}/${clean}`
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizeProduct(p) {
    // ✅ FIX: Django 'thumbnail' field সহ সব possible field check করা হচ্ছে
    const rawImage = p.thumbnail || p.thumbnail_url || p.image_url || p.image || null
    const image = buildImageUrl(rawImage) || PLACEHOLDER

    // ✅ FIX: Django-এ price=300 (original), discount_price=23 (sale price)
    // Frontend-এ price=effective price, oldPrice=crossed-out price
    const originalPrice = Number(p.price || 0)
    const discountedPrice = p.discount_price ? Number(p.discount_price) : null

    const effectivePrice = discountedPrice || originalPrice;
    const oldPrice = discountedPrice ? originalPrice : null

    // Additional images থেকে gallery array বানাও
    const additionalImages = (p.additional_images || [])
        .map(img => buildImageUrl(img.image || img))
        .filter(Boolean)

    const images = [image, ...additionalImages]

    return {
        // Identity
        id: String(p.id),
        slug: p.slug || '',
        name: p.name || '',

        // Category (sub_category → category chain)
        category: p.category ||
            p.sub_category ? .category ? .name ||
            p.sub_category_name ||
            null,

        // Pricing ─ correctly mapped from Django fields
        price: effectivePrice,
        oldPrice: oldPrice,

        // Wholesale
        wholesalePrice: p.wholesale_price ? Number(p.wholesale_price) : null,
        minWholesaleQty: p.minimum_purchase ? Number(p.minimum_purchase) : 1,
        wholesaleUnit: p.wholesale_unit || p.unit || '',

        // Status flags
        inStock: p.stock > 0,
        stock: Number(p.stock || 0),
        onSale: discountedPrice !== null && discountedPrice < originalPrice,
        isActive: p.is_active !== undefined ? p.is_active : true,

        // Display
        image,
        images,
        thumbnail: image,

        // Labels
        badge: p.badge || null,
        badgeColor: p.badge_color || p.badgeColor || '',
        unit: p.unit || '',
        origin: p.origin || '',

        // Ratings (serializer থেকে annotated হলে আসবে)
        rating: Number(p.rating || p.average_rating || 0),
        reviews: Number(p.reviews || p.review_count || 0),

        // Rich content (ProductDetailClient-এর জন্য)
        description: p.description || '',
        shortDesc: p.short_description || p.shortDesc || '',
        keyFeatures: p.key_features || p.keyFeatures || '',
        bestUsedFor: p.best_used_for || p.bestUsedFor || '',
        notes: p.notes || '',
        texture: p.texture || '',

        // Physical
        weight: p.weight ? Number(p.weight) : null,

        // Unit options (যদি থাকে)
        unitOptions: p.unit_options || p.unitOptions || [],

        // Pass through everything else
        ...p,

        // Override fields above (যাতে ...p দিয়ে overwrite না হয়)
        price: effectivePrice,
        oldPrice: oldPrice,
        image,
        images,
    }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts({ category, search, inStock } = {}) {
    const params = new URLSearchParams()
    if (category && category !== 'All') params.set('category', category)
    if (search) params.set('search', search)
    if (inStock !== undefined) params.set('in_stock', inStock)

    const query = params.toString() ? `?${params.toString()}` : ''
    const path = `${PRODUCT_ENDPOINT}/${query}`.replace(/([^:]\/)\/+/g, "$1") // Remove double slashes except after protocol

    const data = await apiFetch(path, { next: { tags: ['products'] } })
    return toArray(data).map(normalizeProduct)
}

export async function getProductById(id) {
    const data = await apiFetch(`${PRODUCT_ENDPOINT}/${id}/`, {
        next: { tags: [`product-${id}`, 'products'] },
    })
    return {
        ...normalizeProduct(data),
        related: toArray(data.related).map(normalizeProduct),
    }
}

// ✅ FIX: slug endpoint — Django-এ by_slug action থাকতে হবে (নিচে দেখো)
export async function getProductBySlug(slug) {
    const data = await apiFetch(`${PRODUCT_ENDPOINT}/${slug}/`, {
        next: { tags: ['products'] },
    })
    return {
        ...normalizeProduct(data),
        related: toArray(data.related).map(normalizeProduct),
    }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
    const data = await apiFetch(`${CATEGORY_ENDPOINT}/`)
    const names = toArray(data).map(cat => cat.name)
    return ['All', ...names, 'On Sale']
}

export async function getCategoryObjects() {
    const data = await apiFetch(`${CATEGORY_ENDPOINT}/`)
    return toArray(data)
}