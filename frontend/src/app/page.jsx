import { Suspense } from 'react'
import HeroSection         from '@/app/components/HeroSection'
import HomeContentSkeleton from '@/app/components/HomeContentSkeleton'
import ProductGrid         from '@/app/components/ProductGrid'
import LeftoverPackBanner  from '@/app/components/LeftoverPackBanner'
import HowItWorks          from '@/app/components/HowItWorks'
import WhyChooseSection    from '@/app/components/WhyChooseSection'
import OffersSection       from '@/app/components/OffersSection'

import { getProducts, getCategoryObjects, getOffers } from '@/lib/api_product'
import { getHomepageData }            from '@/lib/api_homepage'
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
  const [products, categories, homepageData, offers] = await Promise.all([
    getProducts({ token }).catch(() => []),
    getCategoryObjects().catch(() => []),
    getHomepageData().catch(() => ({})),
    getOffers().catch(() => []),
  ])

  const { how_it_works, steps, leftover_banner } = homepageData || {}
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

      <HowItWorks
        heading={how_it_works?.heading}
        steps={normalizedSteps}
      />

      <LeftoverPackBanner banner={leftover_banner} />

      <WhyChooseSection />
    </>
  )
}
