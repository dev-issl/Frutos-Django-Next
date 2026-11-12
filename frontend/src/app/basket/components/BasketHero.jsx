'use client'

import Image from 'next/image'
import { LeafDivider } from '@/app/components/BotanicalDecor'

export default function BasketHero() {
  return (
    <section
      className="relative overflow-hidden border-b border-[#E3E7D7]"
      style={{
        background:
          'linear-gradient(105deg, #F4F4E7 0%, #F7F7EC 42%, #F3F4E5 100%)',
      }}
    >
      {/* Full-bleed Left Botanical Bokeh Accent (matches far-left sunlit foliage glow) */}
      <div
        className="hidden sm:block pointer-events-none select-none absolute inset-y-0 left-0 w-[240px] md:w-[290px] lg:w-[340px] overflow-hidden"
        style={{
          WebkitMaskImage:
            'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.68) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)',
          maskImage:
            'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.68) 42%, rgba(0,0,0,0.22) 72%, transparent 100%)',
        }}
        aria-hidden="true"
      >
        <Image
          src="/ui/basket-hero-banner.jpg"
          alt=""
          fill
          priority
          sizes="340px"
          className="object-cover object-[4%_50%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(246,246,236,0.18) 0%, rgba(246,246,236,0.08) 55%, rgba(246,246,236,0.26) 100%)',
          }}
        />
      </div>

      {/* Warm Central Radial Sunlight Mist */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 46% 92% at 28% 50%, rgba(252,251,244,0.88) 0%, rgba(246,246,236,0.4) 55%, rgba(246,246,236,0) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1440px] mx-auto min-h-[215px] sm:min-h-[255px] md:min-h-[285px] lg:min-h-[305px] xl:min-h-[315px] flex items-center">
        {/* Right Panoramic Harvest Basket Scene + El Arbol Hangtag */}
        <div className="pointer-events-none select-none absolute inset-y-0 right-0 w-full sm:w-[490px] md:w-[580px] lg:w-[640px] xl:w-[680px] overflow-hidden">
          <Image
            src="/ui/basket-hero-banner.jpg"
            alt="Fresh organic produce wicker basket with El Árbol tag"
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 580px, 680px"
            className="object-cover object-[76%_50%] sm:object-[center_52%]"
          />

          {/* Smooth multi-stop mist veil dissolving left boundary invisibly */}
          <div
            className="hidden sm:block absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(246,246,236,1) 0%, rgba(246,246,236,0.92) 14%, rgba(246,246,236,0.52) 28%, rgba(246,246,236,0.1) 44%, rgba(246,246,236,0) 58%)',
            }}
          />

          {/* Mobile legibility mist veil */}
          <div
            className="sm:hidden absolute inset-0"
            style={{
              background:
                'linear-gradient(96deg, rgba(246,246,236,0.96) 0%, rgba(246,246,236,0.86) 44%, rgba(246,246,236,0.4) 72%, rgba(246,246,236,0.12) 100%)',
            }}
          />

          {/* Ultra-wide right outer fade on >1440px displays */}
          <div
            className="hidden 2xl:block absolute inset-y-0 right-0 w-16"
            style={{
              background: 'linear-gradient(270deg, #F3F4E5 0%, rgba(243,244,229,0) 100%)',
            }}
          />
        </div>

        {/* Left Editorial Typography Overlay */}
        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
          <div className="max-w-[260px] sm:max-w-[400px]">
            <h1
              className="text-[32px] sm:text-[46px] md:text-[54px] font-bold tracking-tight leading-[1.05]"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#0F3A22' }}
            >
              Your Basket
            </h1>
            <p
              className="text-[16.5px] sm:text-[21px] italic mt-1"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#245435' }}
            >
              Fresh choices, better living.
            </p>
            <LeafDivider className="my-2.5" />
            <p className="text-[13px] sm:text-[14.5px] text-[#35483A] max-w-[255px] sm:max-w-[385px] leading-snug">
              Review your items, adjust quantities, and proceed to checkout when you&apos;re ready.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
