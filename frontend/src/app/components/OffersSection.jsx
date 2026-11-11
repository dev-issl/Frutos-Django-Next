import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

const DEFAULT_DEALS = [
  {
    id: "deal-tomatoes",
    discount: "Save 25%",
    subtitle: "on Fresh Tomatoes",
    ctaText: "Shop Now",
    href: "/shop",
    image: "/homepage/offer_card_1.jpg?v=4",
    theme: "dark",
    bgColor: "#085041",
  },
  {
    id: "deal-bananas",
    discount: "Save 20%",
    subtitle: "on Organic Bananas",
    ctaText: "Shop Now",
    href: "/shop",
    image: "/homepage/offer_card_2.jpg?v=4",
    theme: "light",
    bgColor: "#FAFCFA",
  },
  {
    id: "deal-oranges",
    discount: "Save 30%",
    subtitle: "on Oranges",
    ctaText: "Shop Now",
    href: "/shop",
    image: "/homepage/offer_card_3.jpg?v=4",
    theme: "dark",
    bgColor: "#085041",
  },
]

export default function OffersSection({ offers = [] }) {
  const deals = DEFAULT_DEALS.map((deal, idx) => {
    const matchedOffer = Array.isArray(offers) && offers[idx] ? offers[idx] : null
    return {
      ...deal,
      href: matchedOffer?.slug ? `/offers/${matchedOffer.slug}` : "/shop",
    }
  })

  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 md:pt-11 pb-6 md:pb-8">
      {/* Eyebrow */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="h-[1px] w-7" style={{ backgroundColor: "#8BB59E" }} />
        <span
          className="uppercase font-semibold tracking-[0.15em]"
          style={{ fontSize: "11px", color: "#45665B" }}
        >
          SPECIAL OFFERS
        </span>
        <span className="h-[1px] w-9" style={{ backgroundColor: "#8BB59E" }} />
      </div>

      {/* Section Title Row */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2
          style={{
            fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
            fontSize: "clamp(1.5rem, 2.35vw, 2.0rem)",
            fontWeight: 700,
            color: "#085041",
            lineHeight: 1.15,
          }}
        >
          Best Deals for a Healthier Life
        </h2>

        <Link
          href={offers?.length > 0 ? "/offers" : "/shop"}
          className="group inline-flex items-center gap-1.5 no-underline shrink-0 transition-all duration-300 ease-out hover:text-[#085041] hover:translate-x-0.5"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#245748",
            textDecoration: "none",
          }}
        >
          <span>View All Offers</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#57A12A] transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 3 Offer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {deals.map((card) => {
          const isDark = card.theme === "dark"
          return (
            <Link
              key={card.id}
              href={card.href}
              className="group relative rounded-[16px] overflow-hidden flex items-center min-h-[146px] sm:min-h-[154px] no-underline transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-[0_14px_30px_rgba(8,80,65,0.16)]"
              style={{
                backgroundColor: card.bgColor,
                border: isDark ? "1px solid rgba(8,80,65,0.28)" : "1px solid #C8E2D0",
                boxShadow: "0 4px 16px rgba(8, 80, 65, 0.08)",
                textDecoration: "none",
              }}
            >
              {/* Full Card Artwork Background */}
              <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.subtitle}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: isDark
                      ? "linear-gradient(90deg, rgba(8, 80, 65, 0.94) 0%, rgba(8, 80, 65, 0.72) 44%, rgba(8, 80, 65, 0) 70%)"
                      : "linear-gradient(90deg, #FFFFFF 0%, rgba(250, 252, 250, 0.92) 45%, rgba(250, 252, 250, 0) 68%)",
                  }}
                />
              </div>

              {/* Left Text Content */}
              <div className="relative z-10 pl-5 sm:pl-6 pr-3 py-5 max-w-[58%]">
                <h3
                  className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                  style={{
                    fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                    fontSize: "clamp(1.45rem, 2vw, 1.75rem)",
                    fontWeight: 700,
                    color: isDark ? "#FFFFFF" : "#085041",
                    lineHeight: 1.1,
                    marginBottom: "4px",
                  }}
                >
                  {card.discount}
                </h3>
                <p
                  className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 450,
                    color: isDark ? "rgba(255,255,255,0.9)" : "#284B3F",
                    marginBottom: "14px",
                    lineHeight: 1.3,
                  }}
                >
                  {card.subtitle}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 font-semibold no-underline transition-all duration-300 ease-out group-hover:gap-2.5 group-hover:translate-x-1"
                  style={{
                    fontSize: "13px",
                    color: isDark ? "#FFFFFF" : "#085041",
                    textDecoration: "none",
                  }}
                >
                  <span>{card.ctaText}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1 ${isDark ? "text-[#8EE06B]" : "text-[#57A12A]"}`} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
