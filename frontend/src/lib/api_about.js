/**
 * src/lib/api_about.js  — pure JS, no JSX
 *
 * Fetches About-page content from the Django backend.
 * Icons are defined separately in aboutIcons.jsx
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000/api' : 'https://elarbol.icommerce.com.bd/api')

// ── Fallback data (used when backend is unreachable) ──────────────────────────

const FALLBACK = {
    hero_section: {
        badge: 'Our story',
        title_main: 'Rooted in quality,',
        title_highlight: 'growing for the future.',
        image_url: ''
    },
    stats: [
        { value: '6+', label: 'Years of service' },
        { value: '40+', label: 'Local farm partners' },
        { value: '8', label: 'Store locations' },
        { value: '98%', label: 'Customer satisfaction' },
    ],
    values: [
        { icon_name: 'Leaf', title: 'Rooted in sustainability', body: 'Every product we source follows strict environmental criteria.' },
        { icon_name: 'Users', title: 'Community first', body: 'We believe in fair prices for farmers and fair prices for customers.' },
        { icon_name: 'Award', title: 'Uncompromising quality', body: 'From harvest to doorstep in under 48 hours.' },
        { icon_name: 'MapPin', title: 'Transparent provenance', body: 'Every product carries a story — the farm, the region, the farmer.' },
    ],
    milestones: [
        { year: '2018', event: 'Founded in Madrid with three farm partners and a single market stall.' },
        { year: '2019', event: 'Opened our first physical store in Chamberí; launched home delivery across Madrid.' },
        { year: '2021', event: 'Expanded to Barcelona and Sevilla; introduced the Leftover Pack programme.' },
        { year: '2023', event: 'Reached 40 partner farms across Spain; launched the El Árbol digital platform.' },
        { year: '2024', event: '8 store locations, 50,000+ happy customers, and still growing.' },
    ],
    farm_partners: [
        { icon_name: 'Tractor', name: 'Hacienda del Sol', region: 'Almería', specialty: 'Heirloom tomatoes & peppers' },
        { icon_name: 'Sprout', name: 'Finca La Paloma', region: 'Huelva', specialty: 'Strawberries & stone fruit' },
        { icon_name: 'Trees', name: 'Rancho Verde', region: 'Murcia', specialty: 'Avocados & citrus' },
        { icon_name: 'Leaf', name: 'Serra dei Fiori', region: 'Liguria', specialty: 'Fresh herbs & greens' },
        { icon_name: 'Wheat', name: 'Huerta La Vega', region: 'Murcia', specialty: 'Spinach & root vegetables' },
        { icon_name: 'Flower2', name: 'Les Herbes du Midi', region: 'Provence', specialty: 'Wild-harvested herbs' },
    ],
    team: [
        { name: 'Sofía Martínez', role: 'Co-founder & CEO', initials: 'SM', origin: 'Madrid' },
        { name: 'Lucas Ferreira', role: 'Co-founder & Head of Sourcing', initials: 'LF', origin: 'Porto' },
        { name: 'Ana Delgado', role: 'Head of Operations', initials: 'AD', origin: 'Sevilla' },
        { name: 'Tomás Ruiz', role: 'Head of Technology', initials: 'TR', origin: 'Barcelona' },
    ],
}

// ── Main fetch function ───────────────────────────────────────────────────────

export async function getAboutPageData() {
    try {
        const res = await fetch(`${API_BASE}/website/about-page/`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        
        // Handle singleton response
        const content = Array.isArray(data) && data.length > 0 ? data[0] : (data || FALLBACK);
        return content;
    } catch (err) {
        console.warn('[api_about] getAboutPageData fallback:', err.message)
        return FALLBACK
    }
}