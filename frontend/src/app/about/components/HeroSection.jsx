import Image from 'next/image'
import Link from 'next/link'
import { Leaf, ArrowRight, MapPin } from 'lucide-react'

function BotanicalLeafWatermark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M150 22C98 28 54 66 36 122c44-8 84-32 108-72 6-10 8-20 6-28Z"
        fill="currentColor"
      />
      <path
        d="M22 146C56 112 96 74 146 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M84 128c26-8 46-24 62-48-24 2-46 14-62 48Z"
        fill="currentColor"
        opacity="0.65"
      />
    </svg>
  )
}

export default function HeroSection({ data }) {
  const { badge, title_main, title_highlight, title_accent, title, subtitle, image_url } =
    data || {}

  const normalizedBadge =
    badge && badge.trim().toLowerCase() !== 'our story'
      ? badge
      : 'ROOTED IN QUALITY'

  const rawTitleText = String(title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const isDefaultHeroHeadline =
    !title ||
    /rooted in quality/i.test(rawTitleText) ||
    /rooted in quality/i.test(String(title_main || ''))

  const heroSrc = image_url || '/about/hero-crate.webp'

  return (
    <section className="relative w-full overflow-hidden bg-[#F2F7ED] pt-8 sm:pt-11 lg:pt-14 pb-14 sm:pb-16 lg:pb-20">
      {/* Subtle botanical leaf accents softly decorating left/bottom hero canvas */}
      <BotanicalLeafWatermark className="hidden md:block pointer-events-none select-none absolute -left-8 bottom-2 w-44 h-44 text-[#A7BEA4] opacity-[0.22] -rotate-12 z-0" />
      <BotanicalLeafWatermark className="hidden lg:block pointer-events-none select-none absolute left-[34%] bottom-4 w-28 h-28 text-[#B2C7AE] opacity-[0.16] rotate-45 z-0" />

      {/* Right Sunlit Produce Crate Photography + Sweeping Curved Botanical Mask */}
      <div className="hidden md:block pointer-events-none select-none absolute inset-y-0 right-0 w-[62%] lg:w-[58%] z-0 overflow-hidden">
        <Image
          src={heroSrc}
          alt="Wooden crate overflowing with fresh organic vegetables and fruits on a farm table"
          fill
          preload
          decoding="async"
          unoptimized
          sizes="(max-width: 1280px) 60vw, 760px"
          className="object-cover object-[56%_center] lg:object-center"
        />

        {/* Curved circular/elliptical botanical scrim separating headline from crate */}
        <svg
          aria-hidden="true"
          viewBox="0 0 900 540"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="aboutHeroLeftCurveFade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F2F7ED" stopOpacity="1" />
              <stop offset="22%" stopColor="#F2F7ED" stopOpacity="0.96" />
              <stop offset="46%" stopColor="#F2F7ED" stopOpacity="0.5" />
              <stop offset="68%" stopColor="#F2F7ED" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Outer curved botanical ring */}
          <path
            d="M0,0 L245,0 C110,120 75,320 190,540 L0,540 Z"
            fill="#F2F7ED"
          />
          <path
            d="M175,0 L295,0 C165,135 125,330 250,540 L140,540 C65,335 90,130 175,0 Z"
            fill="#E3EDE0"
            fillOpacity="0.58"
          />
          <rect width="460" height="540" fill="url(#aboutHeroLeftCurveFade)" />
        </svg>

        {/* Bottom soft blend edge */}
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{
            background:
              'linear-gradient(180deg, rgba(242,247,237,0) 0%, rgba(242,247,237,0.72) 100%)',
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[520px]">
          <span className="inline-block text-[10.5px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#587061] mb-3">
            {normalizedBadge}
          </span>

          <h1
            className="text-[40px] sm:text-[50px] lg:text-[56px] font-semibold tracking-[-0.025em] leading-[1.03] text-[#0D3C28] mb-4"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            {isDefaultHeroHeadline ? (
              <>
                <span className="block">{title_main || 'Rooted in quality,'}</span>
                <span className="block">growing for the</span>
                <em className="block italic font-normal text-[#2D6E48] mt-0.5">
                  {title_accent || 'future.'}
                </em>
              </>
            ) : title_main || title_highlight ? (
              <>
                {title_main && <span className="block">{title_main}</span>}
                {title_highlight && (
                  <em className="block italic font-normal text-[#2D6E48]">
                    {title_highlight}
                  </em>
                )}
              </>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: title }} />
            )}
          </h1>

          <p className="text-[13.5px] sm:text-[14.5px] text-[#355445] leading-[1.55] max-w-[360px] mb-6 whitespace-pre-line">
            {subtitle || 'Fresh, local produce. A healthier community.\nA greener tomorrow.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#114A31] hover:bg-[#0B3925] text-white px-5 py-2.5 text-[12.5px] sm:text-[13px] font-semibold shadow-[0_6px_16px_rgba(17,74,49,0.22)] transition-colors no-underline"
            >
              <Leaf className="w-3.5 h-3.5 text-[#9FD5A7]" />
              <span>Explore Our Produce</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/stores"
              className="inline-flex items-center gap-2 rounded-full bg-[#F5F9F0]/90 hover:bg-white text-[#12422C] border border-[#2C5B44]/45 px-5 py-2.5 text-[12.5px] sm:text-[13px] font-semibold transition-colors no-underline"
            >
              <MapPin className="w-3.5 h-3.5 text-[#226444]" />
              <span>Find a Store</span>
            </Link>
          </div>
        </div>

        {/* Mobile Hero Photo Preview */}
        <div className="relative md:hidden mt-7 w-full h-[210px] rounded-[16px] overflow-hidden border border-[#DCE8D8] shadow-xs">
          <Image
            src={heroSrc}
            alt="Wooden crate overflowing with fresh organic vegetables and fruits"
            fill
            loading="eager"
            decoding="async"
            unoptimized
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  )
}
