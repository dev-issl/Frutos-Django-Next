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
    const statusInfo = getStoreStatusInfo(store);
    return statusInfo.isOpen;
}

export function getStoreCloseTime(store) {
    if (!store) return null;
    if (store.schedules && typeof store.schedules === 'object' && Object.keys(store.schedules).length > 0) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[new Date().getDay()];
        
        let scheds = store.schedules;
        if (typeof scheds === 'string') {
            try { scheds = JSON.parse(scheds); } catch (e) { }
        }
        
        const todaySched = scheds[dayName];
        if (todaySched && todaySched.isOpen && todaySched.close) {
            return formatTime12h(todaySched.close);
        }
        if (todaySched && !todaySched.isOpen) return null; // Closed
    }
    return formatTime12h(store.closeTime);
}

export function getStoreStatusInfo(store) {
    if (!store) return { isOpen: false, text: 'Closed Today', color: '#ef4444', bgColor: '#FEE2E2', rawText: 'Closed Today' }
    
    const now = new Date()
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const toMins = (t) => {
        if (!t) return 0
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }

    if (store.schedules && typeof store.schedules === 'object' && Object.keys(store.schedules).length > 0) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayName = days[now.getDay()]
        
        let scheds = store.schedules;
        if (typeof scheds === 'string') {
            try { scheds = JSON.parse(scheds) } catch (e) { }
        }
        
        const todaySched = scheds[dayName]
        if (todaySched) {
            if (!todaySched.isOpen) return { isOpen: false, text: 'Closed Today', color: '#ef4444', bgColor: '#FEE2E2', rawText: 'Closed' };
            if (!todaySched.open || !todaySched.close) return { isOpen: true, text: 'Open Today', color: '#16a34a', bgColor: '#E7F1DF', rawText: 'Open' };
            
            const open = toMins(todaySched.open)
            const close = toMins(todaySched.close)
            
            let onBreak = false;
            let breakEndTime = '';
            if (todaySched.breakStart && todaySched.breakEnd) {
                const bStart = toMins(todaySched.breakStart)
                const bEnd = toMins(todaySched.breakEnd)
                if (nowMins >= bStart && nowMins < bEnd) {
                    onBreak = true;
                    breakEndTime = formatTime12h(todaySched.breakEnd);
                }
            }
            
            const isCurrentlyOpen = close <= open ? (nowMins >= open || nowMins < close) : (nowMins >= open && nowMins < close);
            
            if (onBreak) {
                return { isOpen: false, text: `On Break till ${breakEndTime}`, color: '#d97706', bgColor: '#fef3c7', rawText: `Break till ${breakEndTime}` };
            }
            if (isCurrentlyOpen) {
                return { isOpen: true, text: `Open till ${formatTime12h(todaySched.close)}`, color: '#16a34a', bgColor: '#E7F1DF', rawText: 'Open' };
            }
            return { isOpen: false, text: 'Closed', color: '#ef4444', bgColor: '#FEE2E2', rawText: 'Closed' };
        }
    }

    // Fallback logic
    if (!store.openTime || !store.closeTime) return { isOpen: false, text: 'Closed', color: '#ef4444', bgColor: '#FEE2E2', rawText: 'Closed' }
    const open = toMins(store.openTime)
    const close = toMins(store.closeTime)
    const isCurrentlyOpen = close <= open ? (nowMins >= open || nowMins < close) : (nowMins >= open && nowMins < close);
    if (isCurrentlyOpen) {
        return { isOpen: true, text: `Open till ${formatTime12h(store.closeTime)}`, color: '#16a34a', bgColor: '#E7F1DF', rawText: 'Open' };
    }
    return { isOpen: false, text: 'Closed', color: '#ef4444', bgColor: '#FEE2E2', rawText: 'Closed' };
}

export function getTodayHoursText(store) {
    if (!store) return 'No schedule';
    if (store.schedules && typeof store.schedules === 'object' && Object.keys(store.schedules).length > 0) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[new Date().getDay()];
        let scheds = store.schedules;
        if (typeof scheds === 'string') {
            try { scheds = JSON.parse(scheds); } catch (e) { }
        }
        const todaySched = scheds[dayName];
        if (todaySched) {
            if (!todaySched.isOpen) return 'Closed Today';
            let txt = `${formatTime12h(todaySched.open)} — ${formatTime12h(todaySched.close)}`;
            if (todaySched.breakStart && todaySched.breakEnd) {
                txt += ` (Break: ${formatTime12h(todaySched.breakStart)} - ${formatTime12h(todaySched.breakEnd)})`;
            }
            return txt;
        }
    }
    return store.hours || `${formatTime12h(store.openTime || store.open_time)} — ${formatTime12h(store.closeTime || store.close_time)}`;
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