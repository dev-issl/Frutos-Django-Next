import HeroSection        from '@/app/components/HeroSection'
import ProductGrid        from '@/app/components/ProductGrid'
import LeftoverPackBanner from '@/app/components/LeftoverPackBanner'
import HowItWorks         from '@/app/components/HowItWorks'
import WhyChooseSection   from '@/app/components/WhyChooseSection'
import OffersSection      from '@/app/components/OffersSection'

import { getProducts, getCategories, getOffers } from '@/lib/api_product'
import { getHomepageData }            from '@/lib/api_homepage'
import { normalizeFeatureCards, normalizeSteps } from '@/app/config/homepageIcons'
import { checkIsInternalWholesale }   from '@/lib/categoryHelper'

import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()
  const token = session?.user?.accessToken

  // Fetch all data in parallel for optimal server performance
  const [products, categories, homepageData, offers] = await Promise.all([
    getProducts({ token }),
    getCategories(),
    getHomepageData(),
    getOffers().catch(() => []),
  ])

  const { hero, feature_cards, how_it_works, steps, leftover_banner } = homepageData

  const featureCards = normalizeFeatureCards(feature_cards)
  const normalizedSteps = normalizeSteps(steps)
  const isInternalWholesale = checkIsInternalWholesale(session)

  return (
    <div style={{ backgroundColor: '#EFF9F2', minHeight: '100vh' }}>
      <HeroSection
        hero={hero}
        featureCards={featureCards}
      />

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
    </div>
  )
}
