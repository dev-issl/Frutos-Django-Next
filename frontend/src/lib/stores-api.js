/**
 * src/lib/stores-api.js  — FINAL VERSION
 * Guest / normal user / wholesale — সবাই দেখতে পারবে
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function getStores() {
    const res = await fetch(`${API_BASE}/fulfillment/stores/`, {
        next: { revalidate: 20, tags: ['stores'] },
    })
    if (!res.ok) throw new Error(`Failed to fetch stores: ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data)) return data
    if (data.results) return data.results
    return []
}

export async function getStoreBySlug(slug) {
    const res = await fetch(`${API_BASE}/fulfillment/stores/slug/${slug}/`, {
        next: { revalidate: 10, tags: ['stores'] },
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Failed to fetch store "${slug}": ${res.status}`)
    return res.json()
}

/** Haversine distance in km */
export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function sortStoresByDistance(storeList, userLat, userLng) {
    return [...storeList].sort((a, b) => {
        if (a.lat == null) return 1
        if (b.lat == null) return -1
        return (
            haversineDistance(userLat, userLng, a.lat, a.lng) -
            haversineDistance(userLat, userLng, b.lat, b.lng)
        )
    })
}

export function isStoreOpen(store) {
    if (!store?.openTime || !store?.closeTime) return false
    const now = new Date()
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const open = toMins(store.openTime)
    const close = toMins(store.closeTime)
    return close <= open ?
        nowMins >= open || nowMins < close :
        nowMins >= open && nowMins < close
}

/** 'HH:MM' → '8:00 AM' */
export function formatTime12h(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`
}

export function formatDistance(km) {
    if (km == null) return null
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export const FEATURE_LABELS = {
    leftoverPack: 'Leftover Pack',
    organic: 'Organic',
    delivery: 'Delivery',
    pickup: 'Click & Collect',
    clickCollect: 'Click & Collect',
}

// ── Dashboard Leftover Packs APIs ─────────────────────────────────────────────

export async function getDashboardLeftoverPacks(storeSlug, token) {
    const res = await fetch(`${API_BASE}/fulfillment/dashboard/leftover-packs/?store_slug=${storeSlug}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
    })
    if (!res.ok) throw new Error(`Failed to fetch leftover packs: ${res.status}`)
    return res.json()
}

export async function createLeftoverPack(data, token) {
    const res = await fetch(`${API_BASE}/fulfillment/dashboard/leftover-packs/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: data // FormData expected
    })
    if (!res.ok) throw new Error(`Failed to create leftover pack: ${res.status}`)
    return res.json()
}

export async function updateLeftoverPack(id, data, token) {
    const res = await fetch(`${API_BASE}/fulfillment/dashboard/leftover-packs/${id}/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: data // FormData expected
    })
    if (!res.ok) throw new Error(`Failed to update leftover pack: ${res.status}`)
    return res.json()
}

export async function deleteLeftoverPack(id, token) {
    const res = await fetch(`${API_BASE}/fulfillment/dashboard/leftover-packs/${id}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    if (!res.ok) throw new Error(`Failed to delete leftover pack: ${res.status}`)
    return true
}