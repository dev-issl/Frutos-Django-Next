import Image from "next/image"
import Link from "next/link"
import { MapPin, ArrowRight } from "lucide-react"

const TRUST_FEATURES = [
  {
    id: "fresh",
    title: "100% Fresh",
    subtitle: "Guaranteed",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M11.5 19.5V10.8C11.5 6.8 7.8 4.2 3.2 4.8C3 9.7 6.1 13.1 11.5 13.5"
          fill="#0D3D23"
        />
        <path
          d="M11.5 19.5V8.6C11.5 4.8 15.6 2.3 20.8 3.2C20.8 8.4 17.5 12 11.5 12.6"
          fill="#0D3D23"
        />
        <path
          d="M11.5 13.5V20.5"
          stroke="#0D3D23"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "delivery",
    title: "Fast Delivery",
    subtitle: "Across Dhaka",
    icon: (
      <svg width="28" height="26" viewBox="0 0 26 24" fill="none" aria-hidden="true">
        <path
          d="M2.2 7.5H6.8M1 11H5.8M2.8 14.5H6.8"
          stroke="#0D3D23"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7.6 6.2C7.6 5.65 8.05 5.2 8.6 5.2H16.4C16.95 5.2 17.4 5.65 17.4 6.2V15.4H7.6V6.2Z"
          fill="#0D3D23"
        />
        <path
          d="M17.4 8.8H21.1C21.5 8.8 21.87 9 22.09 9.33L24 12.2V15.4H17.4V8.8Z"
          fill="#0D3D23"
        />
        <circle cx="11" cy="16.9" r="2.2" fill="#F5F1E5" stroke="#0D3D23" strokeWidth="1.8" />
        <circle cx="20.6" cy="16.9" r="2.2" fill="#F5F1E5" stroke="#0D3D23" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: "payment",
    title: "Secure Payment",
    subtitle: "Your Trust, Our Priority",
    icon: (
      <svg width="24" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.8L4.6 5.8V11.2C4.6 15.95 7.75 20.35 12 21.6C16.25 20.35 19.4 15.95 19.4 11.2V5.8L12 2.8Z"
          fill="#F5F1E5"
          stroke="#0D3D23"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 12.1L11.1 14.2L15.4 9.7"
          stroke="#0D3D23"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "support",
    title: "24/7 Support",
    subtitle: "Always Here",
    icon: (
      <svg width="25" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5.2 13V11.8C5.2 8.05 8.25 5 12 5C15.75 5 18.8 8.05 18.8 11.8V13"
          stroke="#0D3D23"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect x="3.5" y="11.3" width="3.6" height="5.8" rx="1.8" fill="#0D3D23" />
        <rect x="16.9" y="11.3" width="3.6" height="5.8" rx="1.8" fill="#0D3D23" />
        <path
          d="M18.4 17C18.4 18.9 16.85 20 14.95 20H12.5"
          stroke="#0D3D23"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <circle cx="12" cy="20" r="1.4" fill="#0D3D23" />
      </svg>
    ),
  },
]

function OrganicSealBadge({ className = "" }) {
  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* 16-scallop circular seal with proportionally scaled leaf & serif label */}
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_2px_8px_rgba(11,45,25,0.12)]">
        <path
          d="M60 4C64 4 66.8 8.2 70.6 9C74.5 9.8 78.6 6.8 82.1 8.4C85.7 10 86.7 15 90 17.2C93.2 19.4 98.2 18.2 100.8 21.1C103.5 24 102.5 29 104.7 32.3C106.9 35.6 111.8 36.6 113.3 40.3C114.8 44 111.8 48.1 112.5 52C113.3 55.9 117.3 58.6 117.3 62.5C117.3 66.5 113.2 69.2 112.5 73.1C111.7 77 114.7 81.1 113.2 84.7C111.6 88.3 106.7 89.3 104.5 92.6C102.3 95.8 103.4 100.8 100.5 103.5C97.6 106.2 92.7 105.1 89.4 107.3C86.1 109.5 85 114.4 81.3 115.9C77.6 117.4 73.6 114.3 69.7 115C65.8 115.8 63.1 119.7 59.1 119.7C55.1 119.7 52.5 115.7 48.6 114.9C44.7 114.2 40.6 117.2 37 115.6C33.4 114.1 32.4 109.1 29.1 106.9C25.9 104.7 20.9 105.8 18.2 102.9C15.6 100 16.6 95.1 14.4 91.8C12.2 88.5 7.3 87.4 5.8 83.7C4.3 80 7.4 76 6.7 72.1C5.9 68.2 2 65.5 2 61.5C2 57.5 6 54.9 6.7 51C7.5 47.1 4.5 43 6 39.4C7.6 35.8 12.5 34.8 14.7 31.5C16.9 28.2 15.8 23.2 18.7 20.6C21.6 17.9 26.5 19 29.8 16.8C33.1 14.6 34.2 9.7 37.9 8.2C41.6 6.7 45.6 9.8 49.5 9.1C53.4 8.3 56.1 4 60 4Z"
          fill="#E7EFCB"
        />
        <circle
          cx="60"
          cy="61.5"
          r="46"
          fill="none"
          stroke="#C7D7A7"
          strokeWidth="1.2"
        />
        {/* Leaf Emblem centered at top */}
        <g transform="translate(46 27) scale(1)">
          <path
            d="M14 19V9C14 5.2 10.5 2.5 5.5 3.2C5.2 8 8.3 11.4 14 11.8Z"
            fill="#0B3B24"
          />
          <path
            d="M14 19V7.5C14 3.9 17.8 1.5 22.8 2.4C22.8 7.5 19.6 11 14 11.5Z"
            fill="#1D5935"
          />
        </g>
        <text
          x="60"
          y="69"
          textAnchor="middle"
          fill="#0B3B24"
          fontWeight="700"
          fontSize="24"
          letterSpacing="-0.5"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
        >
          100%
        </text>
        <text
          x="60"
          y="87"
          textAnchor="middle"
          fill="#0B3B24"
          fontWeight="600"
          fontSize="15"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
        >
          Organic
        </text>
      </svg>
    </div>
  )
}

export default function HeroSection({ hero }) {
  const primaryHref = hero?.primary_cta_href || "/shop"
  const secondaryHref = hero?.secondary_cta_href || "/stores"

  return (
    <div
      className="relative w-full pb-4 md:pb-5"
      style={{
        background: "linear-gradient(180deg, #FBF8EF 0%, #FBF8EF 86%, #EFF9F2 100%)",
      }}
    >
      {/* ── Main Full-Bleed Hero Banner ── */}
      <section className="relative w-full overflow-hidden md:h-[300px] lg:h-[345px] xl:h-[378px] 2xl:h-[405px] bg-[#F9F7EB]">
        {/* Desktop Full-Width Produce Crate Panorama */}
        <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none select-none">
          <Image
            src="/homepage/hero_banner.webp"
            alt="Wooden crate overflowing with fresh organic produce on a farm table"
            fill
            preload
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            unoptimized
            sizes="100vw"
            className="object-cover object-right"
          />
          {/* Subtle left edge readability scrim keeping bottom greenery intact */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(249,247,235,0.45) 0%, rgba(249,247,235,0.18) 24%, rgba(249,247,235,0) 40%)",
            }}
          />
        </div>

        {/* Content Grid */}
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full">
          <div className="relative h-full flex flex-col md:flex-row items-center justify-between pt-6 pb-8 md:py-0 md:pb-4">
            {/* Top-Right 100% Organic Scalloped Seal Badge */}
            <div className="hidden md:block absolute top-3.5 right-3 lg:top-4 lg:right-3 xl:top-5 xl:right-2 z-20">
              <OrganicSealBadge className="w-[78px] h-[78px] lg:w-[88px] lg:h-[88px] xl:w-[94px] xl:h-[94px]" />
            </div>

            {/* Left Editorial Copy & Actions */}
            <div className="w-full md:w-[52%] lg:w-[47%] xl:w-[45%] shrink-0 text-left md:pl-3 lg:pl-4">
              {/* Eyebrow Pill with Internal Dash */}
              <div className="mb-2.5 lg:mb-3">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: "#E4F1D3",
                    color: "#15462A",
                    fontSize: "11px",
                    letterSpacing: "0.01em",
                  }}
                >
                  <span className="h-[1.5px] w-3.5 bg-[#1B5733] rounded-full shrink-0" />
                  <span>Fresh. Local. Together.</span>
                </span>
              </div>

              {/* Serif Hero Heading */}
              <h1
                className="mb-3 lg:mb-3.5"
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: "clamp(2.2rem, 3.85vw, 3.45rem)",
                  fontWeight: 700,
                  lineHeight: 1.03,
                  color: "#093B22",
                  letterSpacing: "-0.02em",
                }}
              >
                From Our Farm
                <br />
                to <span className="italic">Your Table</span>
              </h1>

              {/* Subtitle */}
              <p
                className="mb-4 lg:mb-5"
                style={{
                  color: "#1B3B2A",
                  fontSize: "clamp(13.5px, 1.06vw, 15px)",
                  lineHeight: 1.48,
                  maxWidth: "450px",
                  fontWeight: 450,
                }}
              >
                Discover premium quality fruits, vegetables,
                <br className="hidden md:inline" /> and more — grown with care, delivered with trust.
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center flex-wrap gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full text-white font-semibold transition-all duration-200 hover:opacity-95 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0D3D23 0%, #082F1A 100%)",
                    fontSize: "13px",
                    padding: "9.5px 21px",
                  }}
                >
                  <span>Shop Fresh Produce</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href={secondaryHref}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 hover:bg-white active:scale-[0.98]"
                  style={{
                    backgroundColor: "rgba(251, 250, 242, 0.65)",
                    border: "1px solid #96AC93",
                    color: "#0D3D23",
                    fontSize: "13px",
                    padding: "9px 19px",
                  }}
                >
                  <MapPin className="w-4 h-4 text-[#0D3D23]" />
                  <span>Find a Store</span>
                </Link>
              </div>
            </div>

            {/* Mobile Hero Visual (<768px) */}
            <div className="relative md:hidden w-full h-[195px] sm:h-[225px] mt-5 rounded-[14px] overflow-hidden select-none pointer-events-none">
              <Image
                src="/homepage/hero_banner.webp"
                alt="Wooden crate overflowing with fresh organic produce on a farm table"
                fill
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                unoptimized
                sizes="100vw"
                className="object-cover object-[86%_center]"
              />
              <div className="absolute top-2 right-2">
                <OrganicSealBadge className="w-[66px] h-[66px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating 4-Column Trust Bar Kissing Bottom Edge of Hero ── */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 -mt-4 md:-mt-3.5 lg:-mt-4 relative z-20">
        <div
          className="grid grid-cols-2 lg:grid-cols-4 rounded-[14px] md:rounded-[16px] overflow-hidden"
          style={{
            backgroundColor: "#F5F1E5",
            border: "1px solid #EAE6D6",
            boxShadow: "0 4px 16px rgba(26, 46, 28, 0.05)",
          }}
        >
          {TRUST_FEATURES.map((item, idx) => {
            const borderClasses = [
              "border-b lg:border-b-0 border-r border-[#E1DDD0]",
              "border-b lg:border-b-0 lg:border-r border-[#E1DDD0]",
              "border-r border-[#E1DDD0]",
              "",
            ][idx]
            return (
              <div
                key={item.id}
                className={`flex items-center lg:justify-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 lg:px-5 lg:py-4 ${borderClasses}`}
              >
                <div className="shrink-0 flex items-center justify-center">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[12.5px] sm:text-[13px] lg:text-[13.5px] font-bold text-[#0D3D23] leading-tight truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] sm:text-[11.5px] text-[#4F5E52] leading-tight mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
