import { Suspense } from 'react'
import { auth } from '@/auth'
import { getWholesalePageContent, WHOLESALE_FALLBACK } from '@/lib/api'
import { getProducts } from '@/lib/api_product'
import WholesaleStyles from './wholesaleStyle'
import HeroSection from './HeroSection'
import StatesSection from './StatesSection'
import BenefitsSection from './BenefitsSection'
import CategoriesSection from './CategoriesSection'
import HowItWorksSection from './HowItWorksSection'
import WholesaleModalHost from './WholesaleModalHost'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Wholesale | El Árbol',
  description:
    'Partner with El Árbol for fresh local organic produce, reliable 48h delivery, and dedicated wholesale support for your business.',
}

function WholesaleBelowHeroFallback() {
  return (
    <>
      <StatesSection data={WHOLESALE_FALLBACK.stats} />
      <BenefitsSection data={WHOLESALE_FALLBACK.benefits} />
      <CategoriesSection data={WHOLESALE_FALLBACK.categories} />
      <HowItWorksSection data={WHOLESALE_FALLBACK.steps} />
    </>
  )
}

async function WholesaleAsyncSections() {
  const session = await auth()
  const token = session?.user?.accessToken

  const [content, products] = await Promise.all([
    getWholesalePageContent().catch(() => WHOLESALE_FALLBACK),
    getProducts({ token, pageSize: 10, fetchAll: false }).catch(() => []),
  ])

  const {
    stats = WHOLESALE_FALLBACK.stats,
    benefits = WHOLESALE_FALLBACK.benefits,
    categories = WHOLESALE_FALLBACK.categories,
    steps = WHOLESALE_FALLBACK.steps,
  } = content ?? {}

  const supplyProducts = Array.isArray(products)
    ? products.filter((p) => p && p.isActive !== false).slice(0, 5)
    : []

  return (
    <>
      <StatesSection data={stats} />
      <BenefitsSection data={benefits} />
      <CategoriesSection products={supplyProducts} data={categories} />
      <HowItWorksSection data={steps} />
    </>
  )
}

export default function WholesalePage() {
  const heroData = {
    ...WHOLESALE_FALLBACK.hero_section,
    hero_image_url_final: WHOLESALE_FALLBACK.hero_image_url_final,
  }

  return (
    <div className="ws-page-canvas min-h-screen w-full overflow-x-clip">
      <WholesaleStyles />
      {/* Hero paints immediately in Chunk 0 without blocking on backend requests */}
      <HeroSection data={heroData} />

      <Suspense fallback={<WholesaleBelowHeroFallback />}>
        <WholesaleAsyncSections />
      </Suspense>

      <WholesaleModalHost />
    </div>
  )
}
