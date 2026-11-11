import React from "react"

const DEFAULT_STEPS = [
  {
    id: 1,
    num: "1",
    title: "Select Your Favorites",
    desc: "Browse fresh produce and choose what you love.",
  },
  {
    id: 2,
    num: "2",
    title: "Place Your Order",
    desc: "Quick and easy checkout with secure payment.",
  },
  {
    id: 3,
    num: "3",
    title: "Enjoy Freshness",
    desc: "Get farm-fresh produce delivered to your door.",
  },
]

export default function HowItWorks() {
  const displaySteps = DEFAULT_STEPS

  return (
    <section
      className="pt-8 md:pt-11 pb-14 md:pb-16"
      style={{ backgroundColor: "#EFF9F2" }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Eyebrow + Heading */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-1.5">
            <span className="h-[1px] w-10" style={{ backgroundColor: "#8BB59E" }} />
            <span
              className="uppercase font-semibold tracking-[0.16em]"
              style={{ fontSize: "11px", color: "#45665B" }}
            >
              HOW IT WORKS
            </span>
            <span className="h-[1px] w-10" style={{ backgroundColor: "#8BB59E" }} />
          </div>

          {/* Subtle organic brush accent */}
          <div className="flex justify-center mb-0.5">
            <svg width="110" height="10" viewBox="0 0 110 10" fill="none">
              <path
                d="M4 7C30 2 76 1.5 106 6.5"
                stroke="#57A12A"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeOpacity="0.82"
              />
            </svg>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
              fontSize: "clamp(1.55rem, 2.6vw, 2.15rem)",
              fontWeight: 700,
              color: "#085041",
              lineHeight: 1.15,
            }}
          >
            Simple Steps, Fresh Choices
          </h2>
        </div>

        {/* 3 Horizontal Steps with Connecting Arrows */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-4 max-w-[1120px] mx-auto">
          {displaySteps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Circular Badge with Number + Cart Icon */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center gap-1 shrink-0"
                  style={{
                    backgroundColor: "#E1F2E6",
                    border: "1px solid #C5E0CE",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{
                      backgroundColor: "#085041",
                      fontSize: "11px",
                    }}
                  >
                    {step.num}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#085041"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h3l2.6 12.4a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L22 6H6" />
                  </svg>
                </div>

                {/* Step Text */}
                <div className="min-w-0">
                  <h3
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 700,
                      color: "#085041",
                      marginBottom: "3px",
                      lineHeight: 1.25,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "12.5px",
                      color: "#3D5D51",
                      lineHeight: 1.45,
                      maxWidth: "230px",
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Connecting Arrow on Desktop (between steps 1-2 and 2-3) */}
              {index < displaySteps.length - 1 && (
                <div className="hidden md:flex items-center justify-center shrink-0 px-1 text-[#8BB59E]">
                  <svg width="46" height="14" viewBox="0 0 46 14" fill="none">
                    <line x1="0" y1="7" x2="39" y2="7" stroke="#8BB59E" strokeWidth="1.3" />
                    <path d="M36 3.5L41.5 7L36 10.5" stroke="#57A12A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
