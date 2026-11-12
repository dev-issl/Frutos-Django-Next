import Image from 'next/image'
import Link from 'next/link'
import WholesaleApplyButton from './WholesaleApplyButton'

function LeafEyebrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-3.5 h-3.5 text-[#1F5E3F] shrink-0">
      <path
        d="M15.8 4.2C10.8 4.5 6.8 7.5 5 13c3.9-.5 7.5-2.6 9.8-6.1.5-.8.8-1.7 1-2.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4.5 15.5c2.1-2.6 5.1-5.4 9-8.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  )
}

function DeliveryBadgeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-3.5 h-3.5 text-[#C8E2CE] shrink-0">
      <rect x="2.5" y="4.5" width="11" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13.5 8h2.6l1.9 2.3v4.2h-4.5V8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.5 8.5h4M5.5 11.2h2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function MapPinOutlineIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-4 h-4 text-[#164530] shrink-0">
      <path
        d="M10 17.2s5.5-4.3 5.5-8.5a5.5 5.5 0 1 0-11 0c0 4.2 5.5 8.5 5.5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.7" r="1.9" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  )
}

export default function HeroSection({ data }) {
  const eyebrow = data?.eyebrow || '100% Fresh & Organic'
  const headline = data?.headline || 'Premium produce,'
  const headlineEm = data?.headline_em || 'built for your business.'
  const subtitle =
    data?.subtitle ||
    'Partner with us for the freshest local produce, reliable delivery, and exceptional quality — from farm to your store.'
  const badgeStat = data?.badge_stat || '48h'
  const badgeLabel = data?.badge_label || 'Delivery'
  const primaryText = data?.primary_cta_text || 'Apply Wholesale Account'
  const primaryHref = data?.primary_cta_href || '#apply'
  const secondaryText = data?.secondary_cta_text || 'Find a Store'
  const secondaryHref = data?.secondary_cta_href || '/stores'
  const heroImageSrc = data?.hero_image_url_final || '/wholesale/hero-basket.webp'
  const isDefaultHeadlineEm =
    String(headlineEm).trim().toLowerCase() === 'built for your business.'

  return (
    <section className="relative w-full overflow-hidden pt-7 sm:pt-9 lg:pt-11 pb-16 sm:pb-[74px] lg:pb-[82px]">
      <link rel="preload" as="image" href={heroImageSrc} fetchPriority="high" />
      {/* Right-aligned sunlit orchard & wicker basket with native parabolic alpha feather */}
      <div
        aria-hidden="true"
        className="hidden md:block pointer-events-none select-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] z-0 overflow-hidden"
      >
        <div className="relative h-full w-[67%] lg:w-[66%] ml-auto">
          <Image
            src={heroImageSrc}
            alt=""
            fill
            preload
            fetchPriority="high"
            decoding="sync"
            unoptimized
            sizes="(max-width: 1280px) 68vw, 960px"
            className="object-cover object-[58%_bottom]"
          />
        </div>
      </div>

      {/* Foreground Content + Container-Aligned 48h Badge */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top-right dark green 48h Delivery badge aligned flush with stats bar & category 5 */}
        <div className="hidden md:flex flex-col items-center justify-center absolute -top-1 right-4 sm:right-6 lg:right-8 z-20 rounded-[12px] bg-[#0B462B] text-white w-[78px] py-2 shadow-[0_6px_16px_rgba(8,52,32,0.18)]">
          <div className="inline-flex items-center gap-1">
            <DeliveryBadgeIcon />
            <span className="text-[21px] font-medium leading-none tracking-[-0.02em]">
              {badgeStat}
            </span>
          </div>
          <span className="text-[10.5px] font-medium text-[#D2E6D7] leading-tight mt-0.5 capitalize">
            {String(badgeLabel).toLowerCase()}
          </span>
        </div>

        <div className="max-w-[540px]">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF2E5] border border-[#D4E2CE] px-3 py-1 mb-4 text-[11px] sm:text-[11.5px] font-medium text-[#1D4E35]">
            <LeafEyebrowIcon />
            <span>{eyebrow}</span>
            <span aria-hidden="true" className="text-[#3C7252] font-normal">→</span>
          </div>

          {/* Newsreader Display Headline */}
          <h1
            className="text-[40px] sm:text-[50px] lg:text-[55px] font-bold tracking-[-0.025em] leading-[1.03] text-[#0E3B27] mb-3.5"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            {headline}
            <br />
            <em className="italic font-semibold text-[#1B5B3B] block">
              {isDefaultHeadlineEm ? (
                <>
                  built for your
                  <br />
                  business.
                </>
              ) : (
                headlineEm
              )}
            </em>
          </h1>

          {/* Subtitle */}
          <p className="text-[13.5px] sm:text-[14.5px] text-[#40584B] leading-[1.58] max-w-[465px] mb-6">
            {subtitle}
          </p>

          {/* CTA Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {primaryHref === '#apply' ? (
              <WholesaleApplyButton className="inline-flex items-center gap-2 rounded-full bg-[#0C462B] hover:bg-[#083520] text-white px-5.5 py-2.5 text-[13px] font-medium transition-colors cursor-pointer">
                <span>{primaryText}</span>
                <span aria-hidden="true">→</span>
              </WholesaleApplyButton>
            ) : (
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#0C462B] hover:bg-[#083520] text-white px-5.5 py-2.5 text-[13px] font-medium transition-colors"
              >
                <span>{primaryText}</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}

            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#617C6A]/70 bg-[#FAFBF6]/80 hover:bg-white hover:border-[#0C462B] text-[#123D28] px-5 py-2.5 text-[13px] font-medium transition-colors"
            >
              <MapPinOutlineIcon />
              <span>{secondaryText}</span>
            </Link>
          </div>
        </div>

        {/* Mobile Hero Photo Preview */}
        <div className="md:hidden relative mt-6 w-full h-[215px] rounded-[16px] overflow-hidden border border-[#DCE8D8] bg-[#E8F1E3]">
          <Image
            src={heroImageSrc}
            alt="Fresh organic produce wicker basket"
            fill
            decoding="async"
            unoptimized
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute top-3 right-3 rounded-[10px] bg-[#0B462B] text-white px-3 py-1.5 flex flex-col items-center">
            <div className="inline-flex items-center gap-1">
              <DeliveryBadgeIcon />
              <span className="text-[18px] font-medium leading-none">{badgeStat}</span>
            </div>
            <span className="text-[10px] text-[#D2E6D7] capitalize">{String(badgeLabel).toLowerCase()}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
