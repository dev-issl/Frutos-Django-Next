import { Suspense } from 'react'
import HeroSection         from '@/app/components/HeroSection'
import HomeContentSkeleton from '@/app/components/HomeContentSkeleton'
import ProductGrid         from '@/app/components/ProductGrid'
import LeftoverPackBanner  from '@/app/components/LeftoverPackBanner'
import HowItWorks          from '@/app/components/HowItWorks'
import WhyChooseSection          from '@/app/components/WhyChooseSection'
import OffersSection             from '@/app/components/OffersSection'
import FeaturedCollectionsSection from '@/app/components/FeaturedCollectionsSection'

import { getProducts, getCategoryObjects, getOffers } from '@/lib/api_product'
import { getHomepageData }            from '@/lib/api_homepage'
import { getStores }                  from '@/lib/stores-api'
import { normalizeSteps }             from '@/app/config/homepageIcons'
import { checkIsInternalWholesale }   from '@/lib/categoryHelper'

import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#EFF9F2', minHeight: '100vh' }}>
      {/* Render Hero immediately outside Suspense so it streams and paints first */}
      <HeroSection />

      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeAsyncSections />
      </Suspense>
    </div>
  )
}

async function HomeAsyncSections() {
  const session = await auth()
  const token = session?.user?.accessToken

  // Fetch all below-the-fold data in parallel so Hero never waits on API responses
  const [products, categories, homepageData, offers, stores] = await Promise.all([
    getProducts({ token }).catch(() => []),
    getCategoryObjects().catch(() => []),
    getHomepageData().catch(() => ({})),
    getOffers().catch(() => []),
    getStores().catch(() => []),
  ])

  const leftoverPacks = (Array.isArray(stores) ? stores : [])
    .flatMap((store) => (Array.isArray(store?.leftoverPacks) ? store.leftoverPacks : []))
    .filter((pack) => pack && pack.is_active !== false)
    .sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0))

  const { how_it_works, steps, leftover_banner, featured_collections, testimonials, faqs } = homepageData || {}
  const normalizedSteps = normalizeSteps(steps)
  const isInternalWholesale = checkIsInternalWholesale(session)

  return (
    <>
      <ProductGrid
        initialProducts={products}
        categories={categories}
        isInternalWholesaleUser={isInternalWholesale}
      />

      <OffersSection offers={offers} />

      <FeaturedCollectionsSection
        config={featured_collections}
        products={products}
        offers={offers}
        leftoverPacks={leftoverPacks}
      />

      <HowItWorks
        heading={how_it_works?.heading}
        steps={normalizedSteps}
      />

      <LeftoverPackBanner banner={leftover_banner} />

      <WhyChooseSection testimonials={testimonials} faqs={faqs} />
    </>
  )
}
