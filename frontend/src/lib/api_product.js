// /**
//  * src/lib/api_product.js
//  *
//  * Fetches data from the Django DRF backend.
//  * Handles both plain array responses and paginated { count, results } responses.
//  */

// const PLACEHOLDER = 'https://placehold.co/400x400/ECF7E4/00694C?text=No+Image'
// const API_BASE = process.env.NEXT_PUBLIC_API_URL
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
//         category: p.category || p.sub_category?.category?.name || null,
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
const API_BASE = process.env.NEXT_PUBLIC_API_URL
const MEDIA_BASE = API_BASE.replace('/api', '')

const BASE_ROUTE = '/products'

const PRODUCT_ENDPOINT = `${BASE_ROUTE}/products`
const CATEGORY_ENDPOINT = `${BASE_ROUTE}/categories`

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
    const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
    const cleanPath = path.startsWith('/') ? path : '/' + path
    const url = cleanBase + cleanPath

    const headers = { 'Content-Type': 'application/json' }
    if (options.headers) {
        Object.assign(headers, options.headers)
        delete options.headers
    }

    const res = await fetch(url, {
        headers,
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
    const rawImage = p.thumbnail || p.thumbnail_url || p.image_url || p.image || null
    const image = buildImageUrl(rawImage) || PLACEHOLDER

    const originalPrice = Number(p.price || 0)
    const discountedPrice = p.discount_price ? Number(p.discount_price) : null
    const effectivePrice = discountedPrice || originalPrice
    const oldPrice = discountedPrice ? originalPrice : null

    const additionalImages = (p.additional_images || [])
        .map(img => buildImageUrl(img.image || img))
        .filter(Boolean)

    const images = [image, ...additionalImages]

    // ✅ category সবসময় string হবে, কখনো object না
    const categoryName =
        (typeof p.category === 'string' ? p.category : p.category?.name) ||
        p.sub_category?.category?.name ||
        p.sub_category?.category_name ||
        p.sub_category_name ||
        null

    return {
        ...p, // ✅ আগে spread করো

        // ✅ এরপর explicit fields — এগুলো ...p কে override করবে
        id: String(p.id),
        slug: p.slug || '',
        name: p.name || '',
        category: categoryName, // ✅ এখন সবসময় string
        price: effectivePrice,
        oldPrice,
        wholesalePrice: p.wholesale_price ? Number(p.wholesale_price) : null,
        minWholesaleQty: p.minimum_purchase ? Number(p.minimum_purchase) : 1,
        wholesaleUnit: p.wholesale_unit || p.unit || '',
        inStock: Number(p.stock || 0) > 0,
        stock: Number(p.stock || 0),
        onSale: discountedPrice !== null && discountedPrice < originalPrice,
        isActive: p.is_active !== undefined ? p.is_active : true,
        image,
        images,
        thumbnail: image,
        badge: p.badge || null,
        badgeColor: p.badge_color || p.badgeColor || '',
        unit: p.unit || '',
        origin: p.origin || '',
        rating: Number(p.rating || p.average_rating || 0),
        reviews: Number(p.review_count !== undefined ? p.review_count : (Array.isArray(p.reviews) ? p.reviews.length : p.reviews || 0)),
        reviewsList: Array.isArray(p.reviews) ? p.reviews : [],
        userCanReview: p.user_can_review || { can_review: false, message: "" },
        description: p.description || '',
        shortDesc: p.short_description || p.shortDesc || '',
        keyFeatures: p.key_features || p.keyFeatures || '',
        bestUsedFor: p.best_used_for || p.bestUsedFor || '',
        notes: p.notes || '',
        texture: p.texture || '',
        weight: p.weight ? Number(p.weight) : null,
        unitOptions: p.unit_options || p.unitOptions || [],
    }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts({ category, search, inStock, token } = {}) {
    const params = new URLSearchParams()
    if (category && category !== 'All') params.set('category', category)
    if (search) params.set('search', search)
    if (inStock !== undefined) params.set('in_stock', inStock)
    // Request a large page_size to get all products in one shot
    params.set('page_size', '1000')

    const query = `?${params.toString()}`
    const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
    const endpointPath = `${PRODUCT_ENDPOINT}/`.replace(/\/\/+/g, '/')
    const startUrl = `${cleanBase}${endpointPath}${query}`

    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {}

    async function fetchAllPages(url) {
        let allResults = []
        let nextUrl = url

        while (nextUrl) {
            const res = await fetch(nextUrl, {
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                cache: 'no-store',
            })

            if (!res.ok) {
                // If auth error and we have a token, retry without token once
                if ((res.status === 401 || res.status === 403) && token) {
                    console.warn(`[getProducts] Auth error ${res.status}. Retrying without token...`)
                    delete authHeaders['Authorization']
                    const res2 = await fetch(nextUrl, {
                        headers: { 'Content-Type': 'application/json' },
                        cache: 'no-store',
                    })
                    if (!res2.ok) throw new Error('API error ' + res2.status)
                    const data2 = await res2.json()
                    allResults = allResults.concat(Array.isArray(data2) ? data2 : (data2.results || []))
                    nextUrl = data2.next || null
                    continue
                }
                throw new Error('API error ' + res.status + ' for ' + nextUrl)
            }

            const data = await res.json()

            if (Array.isArray(data)) {
                // Plain array response — no pagination
                allResults = allResults.concat(data)
                break
            } else if (data && Array.isArray(data.results)) {
                // Paginated DRF response
                allResults = allResults.concat(data.results)
                nextUrl = data.next || null
            } else {
                break
            }
        }
        return allResults
    }

    const results = await fetchAllPages(startUrl)
    return results.map(normalizeProduct)
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
export async function getProductBySlug(slug, options = {}) {
    const fetchOptions = { next: { tags: ['products'] } }
    if (options.token) {
        fetchOptions.headers = {
            'Authorization': `Bearer ${options.token}`
        }
    }
    try {
        const data = await apiFetch(`${PRODUCT_ENDPOINT}/${slug}/`, fetchOptions)
        console.log(`[getProductBySlug] Fetched data for ${slug}:`, {
            hasWholesalePrice: !!data.wholesale_price,
            wholesalePriceVal: data.wholesale_price,
            isApprovedWholesaler: data._user_context?.is_approved_wholesaler,
            tokenPassed: !!options.token
        })
        return {
            ...normalizeProduct(data),
            related: toArray(data.related).map(normalizeProduct),
        }
    } catch (error) {
        if (error.message && (error.message.includes('401') || error.message.includes('403')) && options.token) {
            console.warn(`Got ${error.message} with token for product ${slug}. Retrying without token...`)
            delete fetchOptions.headers
            const data = await apiFetch(`${PRODUCT_ENDPOINT}/${slug}/`, fetchOptions)
            return {
                ...normalizeProduct(data),
                related: toArray(data.related).map(normalizeProduct),
            }
        }
        throw error
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

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function submitReview(token, data) {
    const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
    const url = `${cleanBase}${BASE_ROUTE}/reviews/`

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.error || 'Failed to submit review')
    }

    return res.json()
}

// ─── Offers ───────────────────────────────────────────────────────────────────

export async function getOffers() {
    const data = await apiFetch(`${BASE_ROUTE}/offers/`, { cache: 'no-store' })
    return toArray(data).map(offer => ({
        id: offer.id,
        title: offer.title,
        slug: offer.slug,
        image: buildImageUrl(offer.banner_image_url || offer.banner_image),
        description: offer.description,
        startDate: offer.start_date,
        endDate: offer.end_date,
        isActive: offer.is_active,
    }))
}

export async function getOfferBySlug(slug) {
    const data = await apiFetch(`${BASE_ROUTE}/offers/${slug}/`, { cache: 'no-store' })
    return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        image: buildImageUrl(data.banner_image_url || data.banner_image),
        description: data.description,
        startDate: data.start_date,
        endDate: data.end_date,
        isActive: data.is_active,
        products: data.items ? data.items.map(item => {
            const normalized = normalizeProduct(item.product);
            return {
                ...normalized,
                oldPrice: normalized.price,
                price: Number(item.offer_price),
                onSale: true, // We can optionally force this to true to highlight the offer price
            };
        }) : [],
    }
}