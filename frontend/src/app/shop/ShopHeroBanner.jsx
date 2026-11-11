import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/**
 * Pure above-the-fold botanical Shop hero banner.
 * Shared across ShopShell (instant streaming Chunk 0), shop/loading.jsx,
 * and ProductListingClient fallback so the hero paints first without waiting
 * on product or category fetches.
 */
export default function ShopHeroBanner({
  activeCategory = 'All Produce',
  activeSubCategory = null,
  isInternalWholesale = false,
}) {
  return (
    <section className="relative w-full overflow-hidden border-b border-[#DFE2D2] bg-[#EEEFE1] min-h-[210px] sm:min-h-[228px] lg:min-h-[240px] flex items-center">
      {/* Panoramic Sunlit Farm + Produce Crate Layer */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full 2xl:w-[1560px] select-none">
        <Image
          src="/shop/hero-produce.webp"
          alt="Fresh organic produce in wooden crate on sunlit farm"
          fill
          preload
          decoding="async"
          unoptimized
          sizes="(max-width: 1536px) 100vw, 1560px"
          className="object-cover object-[78%_bottom] sm:object-[80%_bottom] md:object-right opacity-35 sm:opacity-75 md:opacity-100"
        />

        {/* Seamless Cream-to-Field Left Transition Scrim */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(238,239,225,0.96) 0%, rgba(238,239,225,0.88) 54%, rgba(238,239,225,0.42) 100%)',
          }}
        />
        <div
          className="hidden md:block lg:hidden absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #EEEFE1 0%, #EEEFE1 44%, rgba(238,239,225,0.86) 58%, rgba(238,239,225,0) 76%)',
          }}
        />
        <div
          className="hidden lg:block xl:hidden absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #EEEFE1 0%, #EEEFE1 34%, rgba(238,239,225,0.76) 43%, rgba(238,239,225,0) 52%)',
          }}
        />
        <div
          className="hidden xl:block absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #EEEFE1 0%, #EEEFE1 27%, rgba(238,239,225,0.62) 35%, rgba(238,239,225,0) 46%)',
          }}
        />

        {/* Soft Feathered Diagonal Cream Light Sweeps (GPU gradients, no expensive SVG blur filter) */}
        <svg
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
          className="hidden xl:block absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="shopHeroDiagonalVeil"
              gradientUnits="userSpaceOnUse"
              x1="440"
              y1="0"
              x2="790"
              y2="0"
            >
              <stop offset="0%" stopColor="#EEEFE1" stopOpacity="0.65" />
              <stop offset="55%" stopColor="#EEEFE1" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#EEEFE1" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="shopHeroTopRightGlow"
              gradientUnits="userSpaceOnUse"
              x1="1120"
              y1="0"
              x2="1440"
              y2="145"
            >
              <stop offset="0%" stopColor="#F5F6EB" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#F5F6EB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,0 L535,0 C595,88 675,172 785,240 L0,240 Z"
            fill="url(#shopHeroDiagonalVeil)"
          />
          <polygon
            points="1140,0 1440,0 1440,145"
            fill="url(#shopHeroTopRightGlow)"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1320px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-5 pb-6 sm:pt-6 sm:pb-7 lg:pt-7 lg:pb-8">
        {/* Breadcrumb Trail */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-medium text-[#7A7D72] mb-3.5 sm:mb-4"
        >
          <Link
            href="/"
            className="text-[#7A7D72] hover:text-[#1D2B22] transition-colors no-underline"
          >
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[#7A7D72]" />
          <span className="font-semibold text-[#1D271E]">{activeCategory}</span>
          {activeSubCategory && (
            <>
              <ChevronRight className="w-3 h-3 text-[#7A7D72]" />
              <span className="font-semibold text-[#0B462B]">{activeSubCategory}</span>
            </>
          )}
        </nav>

        {/* Eyebrow Pill */}
        <span className="inline-block rounded-full bg-[#D6EAB7] px-3.5 py-1 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#375E1F] mb-1.5 sm:mb-2">
          {isInternalWholesale ? 'Wholesale Market' : 'Our Produce'}
        </span>

        {/* Main Serif Display Title */}
        <h1
          className="text-[36px] sm:text-[44px] lg:text-[50px] font-medium tracking-[-0.02em] leading-[1.06] text-[#1D2B22] mb-2.5 sm:mb-3"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          {activeCategory}
        </h1>

        {/* Subtitle + Crisp Editorial Accent Rule */}
        <p className="text-[13.5px] sm:text-[14.5px] text-[#283329] font-normal leading-[1.45] max-w-[355px] sm:max-w-[370px]">
          Discover fresh, local produce from trusted farms near you. Quality you can count on.
        </p>
        <div className="mt-2.5 h-[1.5px] w-11 rounded-full bg-[#364332]/85" aria-hidden="true" />
      </div>
    </section>
  )
}

