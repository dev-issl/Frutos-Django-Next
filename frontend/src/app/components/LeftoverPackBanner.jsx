import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LeftoverPackBanner({ banner }) {
  const ctaHref = banner?.cta_href || "/about"

  return (
    <section
      className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 md:pt-7 pb-10 md:pb-12"
      style={{ backgroundColor: "#EFF9F2" }}
    >
      <div
        className="relative rounded-[20px] overflow-hidden flex flex-col md:flex-row md:items-stretch min-h-[215px]"
        style={{
          backgroundColor: "#085041",
          backgroundImage:
            "linear-gradient(100deg, #085041 0%, #085041 42%, #0A5E4D 72%, #0E6E59 100%)",
          boxShadow: "0 8px 26px rgba(8, 80, 65, 0.18)",
        }}
      >
        {/* ── Desktop Farm Image with Curved S-Wave Transition ── */}
        <div className="hidden md:block relative md:w-[31%] lg:w-[34%] xl:w-[35%] shrink-0 overflow-hidden select-none">
          <Image
            src="/homepage/impact_farm.jpg"
            alt="Sustainable local farming fields"
            fill
            sizes="(max-width: 1024px) 34vw, 460px"
            className="object-cover object-left scale-[1.12] origin-left"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -top-[1px] -right-[1px] h-[calc(100%+2px)] w-[52px] lg:w-[66px]"
          >
            <path
              d="M 88 0 C 30 22, 8 58, 34 100 L 102 100 L 102 0 Z"
              fill="#085041"
            />
          </svg>
        </div>

        {/* ── Mobile Farm Image (<768px) ── */}
        <div className="md:hidden relative h-[185px] sm:h-[210px] w-full overflow-hidden select-none">
          <Image
            src="/homepage/impact_farm.jpg"
            alt="Sustainable local farming fields"
            fill
            sizes="100vw"
            className="object-cover object-left scale-[1.15] origin-left"
          />
        </div>

        {/* ── Center Column: Our Impact Content ── */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-8 md:pl-8 md:pr-6 lg:pl-12 lg:pr-10 xl:pl-14 xl:pr-12 py-6 md:py-7">
          <span
            className="uppercase tracking-[0.16em] font-semibold mb-1.5"
            style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}
          >
            OUR IMPACT
          </span>

          <h2
            style={{
              fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
              fontSize: "clamp(1.4rem, 2.2vw, 1.85rem)",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.16,
              marginBottom: "10px",
            }}
          >
            Reducing Food Waste,
            <br />
            Building a Greener Future
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: "12.5px",
              lineHeight: 1.52,
              marginBottom: "16px",
              maxWidth: "375px",
            }}
          >
            Together, we can reduce food waste and support sustainable farming for a healthier planet.
          </p>

          <Link
            href={ctaHref}
            className="self-start inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-200 hover:bg-white active:scale-[0.98]"
            style={{
              backgroundColor: "#EFF9F2",
              color: "#085041",
              fontSize: "12.5px",
              padding: "8px 20px",
            }}
          >
            <span>Learn More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Right Column: 3 Vertical Impact Stats ── */}
        <div
          className="relative z-10 md:w-[225px] lg:w-[265px] xl:w-[295px] shrink-0 flex flex-col justify-center gap-4 px-6 sm:px-8 md:px-7 lg:px-9 py-5 md:py-6 border-t md:border-t-0 md:border-l my-0 md:my-5"
          style={{ borderColor: "rgba(255,255,255,0.16)" }}
        >
          {/* Stat 1: 50+ Local Farms */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[#D8E2D5]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V11" />
                <path d="M12 15C8.5 15 6 12.5 6 8.5C9.5 8.5 12 11 12 15Z" />
                <path d="M12 13C15.5 13 18 10.5 18 6.5C14.5 6.5 12 9 12 13Z" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1.08,
                }}
              >
                50+
              </p>
              <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>
                Local Farms
              </p>
            </div>
          </div>

          {/* Stat 2: 10K+ Happy Customers */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[#D8E2D5]">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 10h14l-1.5 9h-11L5 10z" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <line x1="9" y1="14" x2="9" y2="16" />
                <line x1="12" y1="14" x2="12" y2="16" />
                <line x1="15" y1="14" x2="15" y2="16" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1.08,
                }}
              >
                10K+
              </p>
              <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>
                Happy Customers
              </p>
            </div>
          </div>

          {/* Stat 3: 100% Organic Produce */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[#D8E2D5]">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
                <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
                <path d="m14 16-3 3 3 3" />
                <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
                <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
                <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1.08,
                }}
              >
                100%
              </p>
              <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>
                Organic Produce
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
