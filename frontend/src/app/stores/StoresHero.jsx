import Image from 'next/image'
import { MapPin } from 'lucide-react'

/**
 * Full-top sweeping organic farm hero backdrop placed behind the Stores header
 * and top edge of the store finder. Uses optimized /stores/hero_farm.webp
 * with Next 16 `preload` and `decoding="async"` so it paints immediately.
 */
export function StoresHeroBackdrop() {
  return (
    <div className="pointer-events-none select-none absolute top-0 right-0 w-full md:w-[70%] lg:w-[66%] h-[210px] sm:h-[340px] lg:h-[365px] z-0 overflow-hidden">
      <Image
        src="/stores/hero_farm.webp"
        alt=""
        aria-hidden="true"
        fill
        preload
        decoding="async"
        unoptimized
        sizes="(max-width: 768px) 100vw, 66vw"
        className="object-cover object-top"
      />

      {/* Curved sweeping sage-mint mist arc matching mockup */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="storeHeroLeftMist" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EFF9F2" stopOpacity="1" />
            <stop offset="16%" stopColor="#EFF9F2" stopOpacity="0.94" />
            <stop offset="40%" stopColor="#EFF9F2" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#EFF9F2" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#EFF9F2" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer soft sweeping curve framing the sunlit trees and rustic barn */}
        <path
          d="M0,0 L820,0 C590,22 365,105 205,345 L0,345 Z"
          fill="#EFF9F2"
          fillOpacity="0.34"
        />
        {/* Inner cleaner mist veil covering text legibility zone on left */}
        <path
          d="M0,0 L580,0 C395,36 250,120 120,365 L0,365 Z"
          fill="#EFF9F2"
          fillOpacity="0.78"
        />
        <rect width="1000" height="400" fill="url(#storeHeroLeftMist)" />
      </svg>

      {/* Bottom seamless vertical fade into page canvas (#EFF9F2) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(239,249,242,0.18) 0%, rgba(239,249,242,0) 24%, rgba(239,249,242,0.12) 66%, #EFF9F2 100%)',
        }}
      />
    </div>
  )
}

export function StoresHeroHeader() {
  return (
    <section className="max-w-[1320px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-7 pb-3.5 sm:pb-6">
      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/85 backdrop-blur-xs border border-[#CFE0D1] text-[#085041] text-[11px] sm:text-[11.5px] font-semibold mb-1.5 sm:mb-2.5">
        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#57A12A]" />
        <span>Find Nearby Store</span>
      </div>

      <h1
        className="text-[26px] sm:text-[40px] lg:text-[44px] font-bold tracking-[-0.02em] leading-[1.1] text-[#085041] mb-1.5 sm:mb-2"
        style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
      >
        Find a Store Near You
      </h1>

      <p className="text-[12.5px] sm:text-[14.5px] leading-[1.4] sm:leading-[1.5] text-[#2F4E42] max-w-[440px]">
        Discover our local stores and get fresh, organic produce from the nearest El Árbol outlet.
      </p>
    </section>
  )
}

/**
 * Renders the complete Stores Hero shell above Suspense/store finder content so
 * the hero paints in Chunk 0 and during route transitions.
 */
export function StoresHeroShell({ children }) {
  return (
    <div className="min-h-screen bg-[#EFF9F2] relative overflow-x-clip flex flex-col justify-between">
      <StoresHeroBackdrop />
      <div className="relative z-10 flex-1">
        <StoresHeroHeader />
        {children}
      </div>
    </div>
  )
}

