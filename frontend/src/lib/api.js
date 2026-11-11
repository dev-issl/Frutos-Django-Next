const PLACEHOLDER = 'https://placehold.co/400x400/ECF7E4/00694C?text=No+Image'
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const MEDIA_BASE = API_BASE.replace('/api', '')
const PRODUCT_BASE = '/products/products'



async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        cache: 'no-store',
        ...options,
    })
    if (!res.ok) throw new Error(`API error ${res.status} for ${url}`)
    return res.json()
}

async function apiAuthFetch(path, accessToken, options = {}) {
    return apiFetch(path, {
        ...options,
        headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...options.headers,
        },
    })
}

// Normalizer 

function normalizeProduct(p) {
    let image = p.image_url || p.image || p.thumbnail_url || null
    if (image && !image.startsWith('http')) {
        image = `${MEDIA_BASE}/media/${image.replace(/^\/+/, '')}`
    }
    return {
        ...p,
        category: p.category || (p.sub_category && p.sub_category.category && p.sub_category.category.name) || null,
        price: Number(p.price),
        oldPrice: p.old_price != null ? Number(p.old_price) : null,
        wholesalePrice: p.wholesale_price != null ? Number(p.wholesale_price) : null,
        minWholesaleQty: p.min_wholesale_qty || 1,
        wholesaleUnit: p.wholesale_unit || '',
        hasWholesalePrice: !!p.wholesale_price,
        rating: Number(p.rating),
        image: image || PLACEHOLDER,
        inStock: p.in_stock !== undefined ? p.in_stock : p.stock,
        onSale: p.on_sale || (p.discount_price != null && Number(p.discount_price) < Number(p.price)),
        badgeColor: p.badge_color || '',
    }
}

//  Products 
export async function getProducts({ category, search, inStock, accessToken, limit = 100 } = {}) {
    try {
        const params = new URLSearchParams()
        if (category && category !== 'All') params.set('category', category)
        if (search) params.set('search', search)
        if (inStock !== undefined) params.set('in_stock', inStock)
        if (limit) params.set('page_size', limit)

        const query = params.toString() ? `?${params}` : ''
        const path = `${PRODUCT_BASE}/${query}`.replace(/([^:]\/)\/+/g, "$1")
        const data = await apiAuthFetch(path, accessToken)
        const results = Array.isArray(data) ? data : (data.results || [])
        return results.map(normalizeProduct)
    } catch (err) {
        console.warn('[api] getProducts error:', err.message)
        return []
    }
}

export async function getProductBySlug(slug, accessToken) {
    try {
        const data = await apiAuthFetch(`${PRODUCT_BASE}/${slug}/`, accessToken)
        return {
            ...normalizeProduct(data),
            related: (data.related || []).map(normalizeProduct),
        }
    } catch (err) {
        console.warn(`[api] getProductBySlug ${slug} error:`, err.message)
        return null
    }
}

export async function getProductById(id, accessToken) {
    try {
        const data = await apiAuthFetch(`${PRODUCT_BASE}/${id}/`, accessToken)
        return {
            ...normalizeProduct(data),
            related: (data.related || []).map(normalizeProduct),
        }
    } catch (err) {
        console.warn(`[api] getProductById ${id} error:`, err.message)
        return null
    }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
    try {
        const data = await apiFetch('/products/categories/')
        const results = Array.isArray(data) ? data : (data.results || [])
        const names = results.map(cat => cat.name)
        return ['All', ...names, 'On Sale']
    } catch (err) {
        console.warn('[api] getCategories error:', err.message)
        return ['All', 'On Sale']
    }
}

export async function getCategoryObjects() {
    try {
        const data = await apiFetch('/products/categories/')
        return Array.isArray(data) ? data : (data.results || [])
    } catch (err) {
        console.warn('[api] getCategoryObjects error:', err.message)
        return []
    }
}

// ─── Delivery Windows ─────────────────────────────────────────────────────────


export async function getDeliveryWindows() {
    try {
        return await apiFetch('/delivery/windows/')
    } catch (err) {
        console.warn('[api] getDeliveryWindows fallback:', err.message)

        // ── Fallback: generate the next 4 days client-side ────────────────
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const today = new Date()

        const dates = Array.from({ length: 4 }, (_, i) => {
            const d = new Date(today)
            d.setDate(today.getDate() + i)
            return {
                label: i === 0 ? 'Today' : days[d.getDay()],
                short: i === 0 ? 'Today' : days[d.getDay()],
                full: `${months[d.getMonth()]} ${d.getDate()}`,
                date: d.toISOString().slice(0, 10),
            }
        })

        const slots = [
            { id: 'morning', label: 'Morning', time: '08:00 – 10:00', is_available: true },
            { id: 'late-morning', label: 'Late Morning', time: '10:00 – 12:00', is_available: true },
            { id: 'lunchtime', label: 'Lunchtime', time: '12:00 – 14:00', is_available: true },
            { id: 'afternoon', label: 'Afternoon', time: '14:00 – 16:00', is_available: false },
        ]

        return { dates, slots }
    }
}



export async function getDeliveryOption(subtotal = 0) {
    try {
        const res = await fetch(
            `${API_BASE}/delivery-charge/?subtotal=${subtotal}`, {
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
            }
        )
        if (!res.ok) throw new Error(`API error ${res.status}`)
        return res.json()
    } catch (err) {
        console.warn('[api] getDeliveryOption fallback:', err.message)
            // fallback → free delivery
        return {
            charge_type: 'free',
            flat_fee: '0.00',
            free_threshold: '0.00',
            is_active: true,
            fee_for_subtotal: 0.0,
        }
    }
}


export async function getNearestStore(lat = null, lng = null) {
    try {
        // Fetching all stores since nearest endpoint is not available
        const res = await fetch(`${API_BASE}/fulfillment/stores/`, {
            headers: { 'Content-Type': 'application/json' },
            next: { tags: ['collect-stores'] }, 
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        return Array.isArray(data) && data.length > 0 ? data[0] : null
    } catch (err) {
        console.warn('[api] getNearestStore fallback:', err.message)
        return null
    }
}


export async function getAllStores() {
    return apiFetch('/fulfillment/stores/')
}
// ─── Wholesale Auth API ───────────────────────────────────────────────────────

const WS_BASE = `${API_BASE}/wholesale`

export async function wholesaleRegister(payload) {
    const res = await fetch(`${WS_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
    })

    let data
    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
        try {
            data = await res.json()
        } catch (error) {
            const text = await res.text().catch(() => '')
            data = { detail: text || `Invalid JSON response (${res.status})` }
        }
    } else {
        const text = await res.text().catch(() => '')
        data = { detail: text ? text.trim() : `Unexpected response from server (${res.status})` }
    }

    if (!res.ok) {
        if (!data || typeof data !== 'object') {
            throw { detail: String(data) || `HTTP ${res.status}` }
        }
        if (!data.detail && !data.error && Object.keys(data).length === 0) {
            data.detail = `HTTP ${res.status}: ${res.statusText}`
        }
        throw data
    }

    return data
}

export async function wholesaleLogin(emailOrPayload, password) {
    const body = typeof emailOrPayload === 'object' && emailOrPayload !== null
        ? emailOrPayload
        : { email: emailOrPayload, password }
    const res = await fetch(`${WS_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw data
    return data
}

export async function getWholesaleProfile(accessToken) {
    const res = await fetch(`${WS_BASE}/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    })
    if (!res.ok) throw new Error('Failed to fetch wholesale profile')
    return res.json()
}

export async function updateWholesaleProfile(accessToken, payload) {
    const res = await fetch(`${WS_BASE}/profile/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
}

export async function uploadWholesaleProfileImage(accessToken, file) {
    const formData = new FormData()
    formData.append('profile_image', file)
    
    const res = await fetch(`${WS_BASE}/profile/image/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
}

export async function changeWholesalePassword(accessToken, oldPassword, newPassword) {
    const res = await fetch(`${WS_BASE}/auth/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
}

export async function getWholesaleNotifications(accessToken) {
    const res = await fetch(`${WS_BASE}/notifications/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
}

export async function getWholesaleUnreadCount(accessToken) {
    const res = await fetch(`${WS_BASE}/notifications/unread-count/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    })
    if (!res.ok) return { unread_count: 0 }
    return res.json()
}

export async function markWholesaleNotificationsRead(accessToken, ids = []) {
    await fetch(`${WS_BASE}/notifications/mark-read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ids }),
    })
}

export async function deleteWholesaleNotification(accessToken, id) {
    const res = await fetch(`${WS_BASE}/notifications/${id}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete notification')
    return true
}

export async function getWholesaleOrders(accessToken) {
    const res = await fetch(`${API_BASE}/orders/`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.results || [])
}

export async function deleteWholesaleOrder(accessToken, orderNumber) {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete order')
    return true
}


export const WHOLESALE_FALLBACK = {
    hero_section: {
        eyebrow: "100% Fresh & Organic",
        headline: "Premium produce,",
        headline_em: "built for your business.",
        subtitle: "Partner with us for the freshest local produce, reliable delivery, and exceptional quality — from farm to your store.",
        badge_stat: "48h",
        badge_label: "Delivery",
        primary_cta_text: "Explore Our Products",
        primary_cta_href: "/shop",
        secondary_cta_text: "Find a Store",
        secondary_cta_href: "/stores",
    },
    hero_image: null,
    hero_image_url_final: "/wholesale/hero-basket.webp",
    stats: [
        { value: "48h", label: "Fresh Delivery", sub: "To Your Door", icon_name: "Leaf" },
        { value: "40+", label: "Local Stores", sub: "Nationwide", icon_name: "Store" },
        { value: "€0", label: "Delivery Fee", sub: "On First Order", icon_name: "Handshake" },
        { value: "98%", label: "Customer Satisfaction", sub: "", icon_name: "ShieldCheck" },
    ],
    benefits: [
        { title: "Organic & Healthy", body: "100% natural and chemical-free produce.", icon_name: "Leaf" },
        { title: "Transparent Supply", body: "Full traceability from farm to shelf.", icon_name: "Handshake" },
        { title: "Premium Quality", body: "Only the best for your business.", icon_name: "Award" },
        { title: "Reliable Delivery", body: "On-time delivery, every time.", icon_name: "Truck" },
        { title: "Dedicated Support", body: "We're here to help, always.", icon_name: "Headset" },
        { title: "Grow Together", body: "Your success is our priority.", icon_name: "TrendingUp" },
    ],
    categories: [
        { title: "Fresh Produce", image_url: "/wholesale/cat-produce.webp", icon_name: "Apple", href: "/shop" },
        { title: "Leafy Greens", image_url: "/wholesale/cat-greens.webp", icon_name: "Sprout", href: "/shop" },
        { title: "Berries", image_url: "/wholesale/cat-berries.webp", icon_name: "Cherry", href: "/shop" },
        { title: "Citrus Fruits", image_url: "/wholesale/cat-citrus.webp", icon_name: "Sun", href: "/shop" },
        { title: "Root Vegetables", image_url: "/wholesale/cat-roots.webp", icon_name: "Wheat", href: "/shop" },
    ],
    steps: [
        { number: "1", title: "Apply for an account", body: "", icon_name: "ShoppingCart" },
        { number: "2", title: "Receive approval", body: "", icon_name: "PackageCheck" },
        { number: "3", title: "Get fresh produce delivered", body: "", icon_name: "Truck" },
    ],
    guarantee: null,
};

function hasUntouchedWholesaleHero(hero) {
    if (!hero || typeof hero !== 'object') return true;
    return Boolean(
        !hero.headline ||
        hero.title_main === 'Supply your business with' ||
        hero.subtitle?.startsWith('El Árbol supplies restaurants')
    );
}

export async function getWholesalePageContent() {
    try {
        const data = await apiFetch('/wholesale/page-content/', {
            cache: 'force-cache',
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(1500),
        });
        const record = Array.isArray(data) ? data[0] : data;
        if (!record || Object.keys(record).length === 0) return WHOLESALE_FALLBACK;

        const stats = Array.isArray(record.stats) ? record.stats : [];
        const hasLegacyStats =
            stats.length === 0 ||
            (stats.length === 3 && (stats[0]?.label === 'Farm to Kitchen' || stats[0]?.label === 'Business Partners'));

        const benefits = Array.isArray(record.benefits) ? record.benefits : [];
        const hasLegacyBenefits =
            benefits.length === 0 ||
            benefits[0]?.title === 'Consistent Quality' ||
            benefits[0]?.title === 'Guaranteed Freshness';

        const categories = Array.isArray(record.categories) ? record.categories : [];
        const hasLegacyCategories =
            categories.length === 0 ||
            categories.some((c) => c?.title === 'Dairy & Eggs' || c?.title === 'Fresh Vegetables');

        const steps = Array.isArray(record.steps) ? record.steps : [];
        const hasLegacySteps =
            steps.length === 0 ||
            steps.some((s) => s?.title === 'Apply online' || s?.title === 'Start Ordering');

        const heroUrl =
            record.hero_image_url_final && !String(record.hero_image_url_final).includes('unsplash.com')
                ? record.hero_image_url_final
                : WHOLESALE_FALLBACK.hero_image_url_final;

        return {
            ...record,
            hero_section: hasUntouchedWholesaleHero(record.hero_section)
                ? { ...WHOLESALE_FALLBACK.hero_section, badge_stat: record.hero_section?.badge_stat || WHOLESALE_FALLBACK.hero_section.badge_stat }
                : record.hero_section,
            hero_image_url_final: heroUrl,
            stats: hasLegacyStats ? WHOLESALE_FALLBACK.stats : stats,
            benefits: hasLegacyBenefits ? WHOLESALE_FALLBACK.benefits : benefits,
            categories: hasLegacyCategories ? WHOLESALE_FALLBACK.categories : categories,
            steps: hasLegacySteps ? WHOLESALE_FALLBACK.steps : steps,
        };
    } catch (err) {
        console.warn('[api] getWholesalePageContent error, using fallback:', err.message)
        return WHOLESALE_FALLBACK
    }
}

export async function updateWholesalePageContent(formData, accessToken) {
    const res = await fetch(`${API_BASE}/wholesale/page-content/`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData, // Sending FormData to handle file uploads
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
}

export async function getWholesaleDailyReports(token) {
  if (!token) throw new Error('No token provided')
  const res = await fetch(`${API_BASE}/wholesale/daily-reports/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch daily reports')
  return res.json()
}

export async function createWholesaleDailyReport(token, data) {
  if (!token) throw new Error('No token provided')
  const res = await fetch(`${API_BASE}/wholesale/daily-reports/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  const resData = await res.json()
  if (!res.ok) throw resData
  return resData
}

export async function bulkDeleteWholesaleDailyReports(token, ids) {
  if (!token) throw new Error('No token provided')
  const res = await fetch(`${API_BASE}/wholesale/daily-reports/bulk-delete/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ids })
  })
  const resData = await res.json()
  if (!res.ok) throw resData
  return resData
}