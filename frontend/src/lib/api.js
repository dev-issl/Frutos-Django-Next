const PLACEHOLDER = 'https://placehold.co/400x400/ECF7E4/00694C?text=No+Image'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
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
    let image = p.image_url || p.image || null
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
export async function getProducts({ category, search, inStock, accessToken } = {}) {
    const params = new URLSearchParams()
    if (category && category !== 'All') params.set('category', category)
    if (search) params.set('search', search)
    if (inStock !== undefined) params.set('in_stock', inStock)

    const query = params.toString() ? `?${params}` : ''
    const path = `${PRODUCT_BASE}/${query}`.replace(/([^:]\/)\/+/g, "$1")
    const data = await apiAuthFetch(path, accessToken)
    return data.map(normalizeProduct)
}

export async function getProductBySlug(slug, accessToken) {
    const data = await apiAuthFetch(`${PRODUCT_BASE}/${slug}/`, accessToken)
    return {
        ...normalizeProduct(data),
        related: (data.related || []).map(normalizeProduct),
    }
}

export async function getProductById(id, accessToken) {
    const data = await apiAuthFetch(`${PRODUCT_BASE}/${id}/`, accessToken)
    return {
        ...normalizeProduct(data),
        related: (data.related || []).map(normalizeProduct),
    }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
    const data = await apiFetch('/products/categories/')
    const names = data.map(cat => cat.name)
    return ['All', ...names, 'On Sale']
}

export async function getCategoryObjects() {
    return apiFetch('/products/categories/')
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
        if (!data.detail && !data.error) {
            data.detail = `HTTP ${res.status}: ${res.statusText}`
        }
        throw data
    }

    return data
}

export async function wholesaleLogin(email, password) {
    const res = await fetch(`${WS_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
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
        headline: "Premium produce,",
        headline_em: "built for your business.",
        subtitle: "El Árbol supplies restaurants, hotels, caterers, and retailers across Spain with directly sourced produce — harvested to order, delivered within 48 hours.",
        trust_text: "Trusted by 200+ food businesses · Minimum order from €400/month",
        badge_stat: "48h",
        badge_label: "DELIVERY",
        bottom_badge_title: "Harvested to order",
        bottom_badge_subtitle: "From 40+ certified farms across Spain",
        trust_badges: [
            { label: "Fine Dining", order: 1 },
            { label: "Hotel Groups", order: 2 },
            { label: "Retailers", order: 3 }
        ]
    },
    hero_image: null,
    hero_image_url_final: "https://images.unsplash.com/photo-1595858641571-55dbfb37e201?auto=format&fit=crop&q=80",
    stats: [
        { value: "200+", label: "Business Partners", sub: "Restaurants, hotels & retailers", icon_name: "Building2" },
        { value: "48h", label: "Harvest to Delivery", sub: "Maximum freshness guaranteed", icon_name: "Truck" },
        { value: "99.1%", label: "Order Accuracy", sub: "Rigorous quality control", icon_name: "CheckCircle2" }
    ],
    benefits: [
        { title: "Guaranteed Freshness", body: "Produce is harvested only after your order is confirmed.", icon_name: "Leaf" },
        { title: "Direct from Farms", body: "We work directly with growers to ensure fair prices.", icon_name: "Tractor" },
        { title: "Flexible Ordering", body: "Order via our B2B platform, email, or WhatsApp.", icon_name: "Phone" }
    ],
    categories: [
        { title: "Fresh Vegetables", items: "Tomatoes, peppers, courgettes", badge: "Year-round", badge_bg_color: "#E7F1DF", badge_text_color: "#00694c", icon_name: "Carrot", icon_bg_color: "#EDFAF2" },
        { title: "Seasonal Fruits", items: "Citrus, stone fruits, berries", badge: "Seasonal", badge_bg_color: "#FEF3C7", badge_text_color: "#92400E", icon_name: "Apple", icon_bg_color: "#FFFBEB" },
        { title: "Artisan Dairy", items: "Cheeses, butter, milk", badge: "Limited", badge_bg_color: "#E0E7FF", badge_text_color: "#3730A3", icon_name: "Milk", icon_bg_color: "#EEF2FF" }
    ],
    steps: [
        { number: "01", title: "Apply for an Account", body: "Fill out the application form with your business details.", icon_name: "FileText" },
        { number: "02", title: "Get Approved", body: "Our team will review and approve your account within 24h.", icon_name: "CheckSquare" },
        { number: "03", title: "Start Ordering", body: "Access wholesale pricing and place your first order.", icon_name: "ShoppingCart" }
    ],
    guarantee: {
        title: "No long-term commitment required",
        subtitle: "Rolling monthly arrangement. Upgrade or pause anytime.",
        checks: [
            { text: "No setup fees", order: 1 },
            { text: "Cancel anytime", order: 2 },
            { text: "Dedicated support", order: 3 }
        ]
    }
};

export async function getWholesalePageContent() {
    try {
        const data = await apiFetch('/wholesale/page-content/')
        if (!data || Object.keys(data).length === 0) return WHOLESALE_FALLBACK;
        if (Array.isArray(data)) return data[0] || WHOLESALE_FALLBACK;
        return data;
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