/**
 * src/app/about/page.jsx
 */

import AboutStyles         from './components/AboutStyles'
import HeroSection         from './components/HeroSection'
import StatsSection        from './components/StatsSection'
import ValuesSection       from './components/ValuesSection'
import TimelineSection     from './components/TimelineSection'
import FarmPartnersSection from './components/FarmPartnersSection'
import TeamSection         from './components/TeamSection'
import LeftoverPackSection from './components/LeftoverPackSection'
import CTASection          from './components/CTASection'

import { getAboutPageData }         from '@/lib/api_about'
import { normalizeValues }          from './config/aboutIcons'

export const metadata = {
  title: 'About Us | El Árbol',
  description: 'Rooted in quality, growing for the future. Learn our story.',
}

export const revalidate = 60

export default async function AboutPage() {
  const { hero_section, hero_image_url_final, stats, values, milestones, farm_partners, team } =
    await getAboutPageData()

  const valuesWithIcons = normalizeValues(values)

  return (
    <div className="about-page-canvas min-h-screen overflow-x-clip">
      <AboutStyles />
      <HeroSection data={{ ...(hero_section || {}), image_url: hero_image_url_final }} />
      <StatsSection stats={stats} />
      <ValuesSection values={valuesWithIcons} />
      <TimelineSection milestones={milestones} />
      <FarmPartnersSection farms={farm_partners} />
      <TeamSection team={team} />
      <LeftoverPackSection />
      <CTASection />
    </div>
  )
}
