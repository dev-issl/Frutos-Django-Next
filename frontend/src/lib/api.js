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
    const params = lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : ''
    try {
        const res = await fetch(`${API_BASE}/fulfillment/stores/nearest/${params}`, {
            headers: { 'Content-Type': 'application/json' },
            next: { tags: ['collect-stores'] }, // ← এখন server component-এ কাজ করবে
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        return res.json()
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
    const res = await fetch(`${API_BASE}/orders/my-orders/`, {
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


export async function getWholesalePageContent() {
    try {
        return await apiFetch('/wholesale/content/')
    } catch (err) {
        console.warn('[api] getWholesalePageContent error:', err.message)
        return null
    }
}