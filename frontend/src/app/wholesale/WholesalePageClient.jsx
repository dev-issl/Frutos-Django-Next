'use client'
// src/app/wholesale/WholesalePageClient.jsx
// Thin client shell — only manages modal open/close state.
// All section data comes in as a prop from the server component.

import { useState } from 'react'
import HeroSection      from './HeroSection'
import StatesSection    from './StatesSection'
import BenefitsSection  from './BenefitsSection'
import CategoriesSection from './CategoriesSection'
import HowItWorksSection from './HowItWorksSection'
import WholesaleModal   from './WholesaleModal'

export default function WholesalePageClient({ content }) {
  const [modalOpen, setModalOpen] = useState(false)
  const open  = () => setModalOpen(true)
  const close = () => setModalOpen(false)

  // Safely destructure — falls back to empty arrays / null when API is down
  const {
    hero_section = null,
    stats      = [],
    benefits   = [],
    categories = [],
    steps      = [],
    guarantee  = null,
    hero_image_url_final = null,
  } = content ?? {}

  const heroData = hero_section ? { ...hero_section, hero_image_url_final } : { hero_image_url_final }

  return (
    <>
      <HeroSection       data={heroData}       onApplyClick={open} />
      <StatesSection     data={stats} />
      <BenefitsSection   data={benefits} />
      <CategoriesSection data={categories} />
      <HowItWorksSection data={steps} guarantee={guarantee} onApplyClick={open} />

      <WholesaleModal isOpen={modalOpen} onClose={close} />
    </>
  )
}