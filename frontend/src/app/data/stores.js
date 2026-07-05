// src/app/data/stores.js
//
// ──────────────────────────────────────────────────────────────────────────────
//  ADMIN GUIDE — How to add a new store
// ──────────────────────────────────────────────────────────────────────────────
//
//  1. Open Google Maps  →  https://maps.google.com
//  2. Search for the store address
//  3. Copy the full URL from the browser's address bar
//     Example:
//       https://www.google.com/maps/place/Calle+de+Serrano,+52/@40.4267,-3.6875,17z/data=...
//  4. Paste it as the value of  `mapLink`  below.
//
//  ✅  That's it! Latitude / longitude are extracted automatically.
//  ❌  You do NOT need to enter  lat  or  lng  manually.
//
//  Supported URL formats:
//    • https://www.google.com/maps/place/.../@40.123,-3.456,15z/...   ← browser copy-paste
//    • https://www.google.com/maps/@40.123,-3.456,15z
//    • https://maps.google.com/?q=40.123,-3.456
//    • https://www.google.com/maps?ll=40.123,-3.456
//
// ──────────────────────────────────────────────────────────────────────────────

export const FEATURE_LABELS = {
    leftoverPack: 'Leftover Pack',
    organic: 'Organic',
    delivery: 'Delivery',
    pickup: 'Click & Collect',
}


// ─── Helper: extract {lat, lng} from a Google Maps URL ───────────────────────
/**
 * Parses a Google Maps URL and returns { lat, lng }.
 * Returns null if no coordinates can be found.
 *
 * @param {string} url  — Full Google Maps URL copied from the browser
 * @returns {{ lat: number, lng: number } | null}
 */
export function extractLatLngFromMapUrl(url) {
    if (!url || typeof url !== 'string') return null

    try {
        // ── Strategy 1: /@lat,lng  (most common — browser address bar) ───────
        //   https://www.google.com/maps/place/.../@40.4267,-3.6875,15z/...
        const atMatch = url.match(/@(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)/)
        if (atMatch) {
            const lat = parseFloat(atMatch[1])
            const lng = parseFloat(atMatch[2])
            if (isValidLatLng(lat, lng)) return { lat, lng }
        }

        // ── Strategy 2: ?q=lat,lng or &q=lat,lng ─────────────────────────────
        //   https://maps.google.com/?q=40.4267,-3.6875
        const qMatch = url.match(/[?&]q=(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)/)
        if (qMatch) {
            const lat = parseFloat(qMatch[1])
            const lng = parseFloat(qMatch[2])
            if (isValidLatLng(lat, lng)) return { lat, lng }
        }

        // ── Strategy 3: ll=lat,lng ────────────────────────────────────────────
        //   https://maps.google.com/?ll=40.4267,-3.6875
        const llMatch = url.match(/ll=(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)/)
        if (llMatch) {
            const lat = parseFloat(llMatch[1])
            const lng = parseFloat(llMatch[2])
            if (isValidLatLng(lat, lng)) return { lat, lng }
        }

        // ── Strategy 4: destination=lat,lng (Directions URLs) ─────────────────
        //   https://www.google.com/maps/dir/.../data=...destination=40.42,-3.68
        const destMatch = url.match(/destination=(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)/)
        if (destMatch) {
            const lat = parseFloat(destMatch[1])
            const lng = parseFloat(destMatch[2])
            if (isValidLatLng(lat, lng)) return { lat, lng }
        }

    } catch (_) { /* silently ignore malformed URLs */ }

    return null
}

/** Basic sanity check on parsed values */
function isValidLatLng(lat, lng) {
    return (!isNaN(lat) && !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    )
}


// ─── Raw store data ───────────────────────────────────────────────────────────
//
//  Admin checklist for each store:
//    ✅  id          — unique number
//    ✅  slug        — URL-safe string (letters, numbers, hyphens only)
//    ✅  name        — full display name
//    ✅  shortName   — short name shown on map tooltips
//    ✅  address     — street address
//    ✅  city        — city + postal code
//    ✅  phone       — phone number with country code
//    ✅  openTime    — "HH:MM"  (24-hour)
//    ✅  closeTime   — "HH:MM"  (24-hour)
//    ✅  hours       — human-readable label, e.g. "09:00 — 21:00"
//    ✅  mapLink     — paste a Google Maps URL here ← THIS IS ALL YOU NEED FOR THE MAP
//    ✅  features    — array from: ['leftoverPack', 'organic', 'delivery', 'pickup']
//    ✅  availability — array of category strings
//    ✅  provenance  — short "from …" label
//    ✅  image       — banner image URL
//    ✅  leftoverPacks — array of pack objects (can be empty [])
//
// ─────────────────────────────────────────────────────────────────────────────

const _rawStores = [{
        id: 1,
        slug: 'mostoles-centro',
        name: 'El Árbol — Móstoles Centro',
        shortName: 'Móstoles Centro',
        address: 'Calle del Pintor Velázquez, 12',
        city: '28933 Móstoles, Madrid',
        fullAddress: 'Calle del Pintor Velázquez, 12, 28933 Móstoles, Madrid',
        phone: '+34 912 345 678',
        openTime: '08:00',
        closeTime: '21:00',
        hours: '08:30 — 21:00',
        // 👇 Admin: paste Google Maps URL here
        mapLink: 'https://www.google.com/maps/@40.3217,-3.8654,15z',
        features: ['leftoverPack', 'clickCollect'],
        availability: ['Fruits', 'Veg', 'Bread', 'Cheese'],
        provenance: 'from Almería',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80',
        leftoverPacks: [{
                id: 1,
                name: 'Organic Harvest Box',
                description: 'Mixed seasonal produce',
                price: 5.50,
                image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=320&q=80',
            },
            {
                id: 2,
                name: 'Daily Bakery Surprise',
                description: 'Fresh bread & pastries',
                price: 3.90,
                image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=320&q=80',
            },
            {
                id: 3,
                name: 'The Cheesemonger Pack',
                description: 'Cuts from the deli counter',
                price: 8.00,
                image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=320&q=80',
            },
        ],
    },
    {
        id: 2,
        slug: 'chamberi',
        name: 'El Árbol — Chamberí',
        shortName: 'Chamberí',
        address: 'Calle de Fuencarral, 122',
        city: '28010 Madrid',
        fullAddress: 'Calle de Fuencarral, 122, 28010 Madrid',
        phone: '+34 912 456 789',
        openTime: '09:00',
        closeTime: '21:00',
        hours: '09:00 — 21:00',
        mapLink: 'https://www.google.com/maps/@40.4322,-3.7015,15z',
        features: ['leftoverPack'],
        availability: ['Fruits', 'Veg', 'Dairy'],
        provenance: 'from Valencia',
        image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=900&q=80',
        leftoverPacks: [{
            id: 1,
            name: 'Garden Medley Box',
            description: 'Seasonal greens & roots',
            price: 4.50,
            image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=320&q=80',
        }, ],
    },
    {
        id: 3,
        slug: 'salamanca-district',
        name: 'El Árbol — Salamanca District',
        shortName: 'Salamanca',
        address: 'Calle de Serrano, 52',
        city: '28001 Madrid',
        fullAddress: 'Calle de Serrano, 52, 28001 Madrid',
        phone: '+34 913 567 890',
        openTime: '08:00',
        closeTime: '22:00',
        hours: '08:00 — 22:00',
        mapLink: 'https://www.google.com/maps/place/Calle+de+Serrano,+52/@40.4267,-3.6875,17z',
        features: ['clickCollect'],
        availability: ['Fruits', 'Veg', 'Cheese', 'Wine'],
        provenance: 'from Murcia',
        image: 'https://images.unsplash.com/photo-1543168256-418811576931?w=900&q=80',
        leftoverPacks: [],
    },
    {
        id: 4,
        slug: 'alcorcon-norte',
        name: 'El Árbol — Alcorcón Norte',
        shortName: 'Alcorcón Norte',
        address: 'Av. de Leganés, 34',
        city: '28921 Alcorcón, Madrid',
        fullAddress: 'Av. de Leganés, 34, 28921 Alcorcón, Madrid',
        phone: '+34 914 678 901',
        openTime: '08:30',
        closeTime: '20:30',
        hours: '08:30 — 20:30',
        mapLink: 'https://www.google.com/maps/@40.3489,-3.8245,15z',
        features: ['leftoverPack'],
        availability: ['Fruits', 'Bread'],
        provenance: 'from Andalucía',
        image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80',
        leftoverPacks: [{
            id: 1,
            name: 'Morning Harvest Pack',
            description: 'Seasonal fruits & fresh veg',
            price: 6.00,
            image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=320&q=80',
        }, ],
    },
    {
        id: 5,
        slug: 'leganes-market',
        name: 'El Árbol — Leganés Market',
        shortName: 'Leganés Market',
        address: 'Calle Mayor, 78',
        city: '28914 Leganés, Madrid',
        fullAddress: 'Calle Mayor, 78, 28914 Leganés, Madrid',
        phone: '+34 914 789 012',
        openTime: '08:00',
        closeTime: '21:00',
        hours: '08:00 — 21:00',
        mapLink: 'https://www.google.com/maps/@40.3281,-3.7642,15z',
        features: ['leftoverPack', 'clickCollect'],
        availability: ['Fruits', 'Veg', 'Bread', 'Dairy'],
        provenance: 'from Castilla',
        image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=900&q=80',
        leftoverPacks: [{
            id: 1,
            name: 'Evening Veg Bundle',
            description: 'Mixed end-of-day vegetables',
            price: 3.50,
            image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=320&q=80',
        }, ],
    },
    {
        id: 6,
        slug: 'dhaka-panthopath',
        name: 'El Árbol — Dhaka Panthopath',
        shortName: 'Dhaka',
        address: 'Panthopath, Green Road',
        city: 'Dhaka 1205',
        fullAddress: 'Panthopath, Green Road, Dhaka 1205, Bangladesh',
        phone: '+8801700895489',
        openTime: '08:00',
        closeTime: '22:00',
        hours: '08:00 — 22:00',
        // 👇 Real Dhaka coordinates via mapLink
        mapLink: 'https://www.google.com/maps/place/Panthapath/@23.7518,90.3860,16z',
        features: ['clickCollect'],
        availability: ['Fruits', 'Veg', 'Cheese', 'Wine'],
        provenance: 'from Rajshahi',
        image: 'https://images.unsplash.com/photo-1543168256-418811576931?w=900&q=80',
        leftoverPacks: [],
    },
]


// ─── Auto-resolve coordinates ─────────────────────────────────────────────────
//
//  This runs once at module load time.
//  It reads `mapLink` from each store and injects `lat` + `lng` automatically.
//  Stores that already have `lat`/`lng` are left unchanged (backwards-compatible).
//
export const stores = _rawStores.map((store) => {
    // Already has coordinates — nothing to do
    if (store.lat != null && store.lng != null) return store

    // Try to extract from mapLink
    if (store.mapLink) {
        const coords = extractLatLngFromMapUrl(store.mapLink)
        if (coords) {
            return {...store, lat: coords.lat, lng: coords.lng }
        }
        // Warn in development if URL couldn't be parsed
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                `[stores] Could not extract lat/lng from mapLink for store "${store.name}".\n` +
                `  mapLink: ${store.mapLink}\n` +
                `  Please use a full Google Maps URL (not a short goo.gl link).`
            )
        }
    }

    return store
})


// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng pairs */
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

/** Find store by slug */
export function getStoreBySlug(slug) {
    if (!stores) return null
    const store = stores.find((s) => s.slug === slug)
    return store || null
}

/** Check if a store is currently open based on its openTime / closeTime */
export function isStoreOpen(store) {
    if (!store?.openTime || !store?.closeTime) return false
    const now = new Date()
    const [openH, openM] = store.openTime.split(':').map(Number)
    const [closeH, closeM] = store.closeTime.split(':').map(Number)
    const nowMins = now.getHours() * 60 + now.getMinutes()
    return nowMins >= openH * 60 + openM && nowMins < closeH * 60 + closeM
}

/** Return stores sorted by distance from user, closest first */
export function sortStoresByDistance(storeList, userLat, userLng) {
    return [...storeList].sort((a, b) => {
        // Stores without coords (bad mapLink) go to the end
        if (a.lat == null) return 1
        if (b.lat == null) return -1
        return (
            haversineDistance(userLat, userLng, a.lat, a.lng) -
            haversineDistance(userLat, userLng, b.lat, b.lng)
        )
    })
}

/** Format km distance for display */
export function formatDistance(km) {
    if (km == null) return null
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}