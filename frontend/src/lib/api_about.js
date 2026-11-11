/**
 * src/lib/api_about.js — pure JS, no JSX
 *
 * Fetches About-page content from the Django backend with short timeout and
 * ISR revalidation so /about paints fast and still updates from dashboard CMS.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

// ── Fallback data (used when backend is unreachable or fields are empty) ──────

const FALLBACK = {
  hero_section: {
    badge: 'ROOTED IN QUALITY',
    title_main: 'Rooted in quality,',
    title_highlight: 'growing for the',
    title_accent: 'future.',
    subtitle: 'Fresh, local produce. A healthier community.\nA greener tomorrow.',
    image_url: '',
  },
  stats: [
    { icon_name: 'Leaf', value: '5K+', label: 'Happy Customers' },
    { icon_name: 'Store', value: '40+', label: 'Local Stores' },
    { icon_name: 'Sprout', value: '8', label: 'Product Categories' },
    { icon_name: 'ShieldCheck', value: '98%', label: 'Customer Satisfaction' },
  ],
  values: [
    {
      icon_name: 'Leaf',
      title: 'Product Naturalness',
      body: '100% natural and fresh produce.',
    },
    {
      icon_name: 'Handshake',
      title: 'Community First',
      body: 'Supporting local farmers and communities.',
    },
    {
      icon_name: 'BadgeCheck',
      title: 'Premium Quality',
      body: 'Only the best for your family.',
    },
    {
      icon_name: 'Sprout',
      title: 'Sustainable Tomorrow',
      body: 'Growing a greener, healthier world.',
    },
  ],
  milestones: [
    {
      year: '2018',
      event: 'Our journey started with a simple idea: fresh, local produce for everyone.',
    },
    {
      year: '2020',
      event: 'Expanded to more local stores and more communities.',
    },
    {
      year: '2022',
      event: 'Introduced online platform for easier access.',
    },
    {
      year: '2024',
      event: 'Continuing to grow for a healthier and greener future.',
    },
  ],
  farm_partners: [
    {
      icon_name: 'Leaf',
      name: 'Green Valley Farms',
      region: 'Dhaka, Bangladesh',
      specialty: 'Fresh leafy greens',
    },
    {
      icon_name: 'Tractor',
      name: 'Rural Fresh Farms',
      region: 'Gazipur, Bangladesh',
      specialty: 'Seasonal vegetables',
    },
    {
      icon_name: 'Sprout',
      name: 'AgriGreen Farms',
      region: 'Tangail, Bangladesh',
      specialty: 'Organic root crops',
    },
    {
      icon_name: 'Warehouse',
      name: 'EcoFarm Ltd.',
      region: 'Mymensingh, Bangladesh',
      specialty: 'Natural harvest',
    },
    {
      icon_name: 'Store',
      name: 'FreshLand Farms',
      region: 'Rajshahi, Bangladesh',
      specialty: 'Orchard fruits',
    },
  ],
  team: [
    { name: 'Dr. Amina Rahman', role: 'Founder & CEO', initials: 'AR', origin: 'Dhaka' },
    { name: 'Md. Rafiq Hasan', role: 'Operations Head', initials: 'RH', origin: 'Gazipur' },
    { name: 'Sumaiya Akter', role: 'Quality Manager', initials: 'SA', origin: 'Dhaka' },
    { name: 'Tanvir Ahmed', role: 'Tech Lead', initials: 'TA', origin: 'Sylhet' },
  ],
}

// ── Main fetch function ───────────────────────────────────────────────────────

export async function getAboutPageData() {
  try {
    const res = await fetch(`${API_BASE}/website/about-page/`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()

    const content = Array.isArray(data) && data.length > 0 ? data[0] : data
    if (!content || typeof content !== 'object') return FALLBACK

    // Preserve any real admin customization, while replacing unmodified legacy
    // Spanish seed placeholders so /about reflects the current site design.
    const hasLegacyStats =
      !Array.isArray(content.stats) ||
      content.stats.length === 0 ||
      content.stats.some((s) => s?.value === '6+' && s?.label === 'Years of service')
    const hasLegacyValues =
      !Array.isArray(content.values) ||
      content.values.length === 0 ||
      content.values.some((v) => v?.title === 'Rooted in sustainability')
    const hasLegacyMilestones =
      !Array.isArray(content.milestones) ||
      content.milestones.length === 0 ||
      content.milestones.some((m) => String(m?.event || '').includes('Founded in Madrid'))
    const hasLegacyFarms =
      !Array.isArray(content.farm_partners) ||
      content.farm_partners.length === 0 ||
      content.farm_partners.some((f) => f?.name === 'Hacienda del Sol')
    const hasLegacyTeam =
      !Array.isArray(content.team) ||
      content.team.length === 0 ||
      content.team.some((t) => t?.name === 'Sofía Martínez')

    return {
      ...FALLBACK,
      ...content,
      stats: hasLegacyStats ? FALLBACK.stats : content.stats,
      values: hasLegacyValues ? FALLBACK.values : content.values,
      milestones: hasLegacyMilestones ? FALLBACK.milestones : content.milestones,
      farm_partners: hasLegacyFarms ? FALLBACK.farm_partners : content.farm_partners,
      team: hasLegacyTeam ? FALLBACK.team : content.team,
    }
  } catch (err) {
    console.warn('[api_about] getAboutPageData fallback:', err?.message || err)
    return FALLBACK
  }
}
