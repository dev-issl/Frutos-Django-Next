import { WHOLESALE_FALLBACK } from '@/lib/api'
import WholesaleStyles from './wholesaleStyle'
import HeroSection from './HeroSection'
import StatesSection from './StatesSection'
import BenefitsSection from './BenefitsSection'
import CategoriesSection from './CategoriesSection'
import HowItWorksSection from './HowItWorksSection'

/**
 * Renders the full Hero & initial fallback bands immediately during client
 * navigation so /wholesale never flashes skeleton boxes or reloads Hero.
 */
export default function WholesaleLoading() {
  const heroData = {
    ...WHOLESALE_FALLBACK.hero_section,
    hero_image_url_final: WHOLESALE_FALLBACK.hero_image_url_final,
  }

  return (
    <div className="ws-page-canvas min-h-screen w-full overflow-x-clip">
      <WholesaleStyles />
      <HeroSection data={heroData} />
      <StatesSection data={WHOLESALE_FALLBACK.stats} />
      <BenefitsSection data={WHOLESALE_FALLBACK.benefits} />
      <CategoriesSection data={WHOLESALE_FALLBACK.categories} />
      <HowItWorksSection data={WHOLESALE_FALLBACK.steps} />
    </div>
  )
}
