import Image from 'next/image'
import DynamicIcon from '@/app/components/DynamicIcon'
import WholesaleApplyButton from './WholesaleApplyButton'

function CartStepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[23px] h-[23px]">
      <circle cx="9.2" cy="19.2" r="1.7" fill="currentColor" />
      <circle cx="16.8" cy="19.2" r="1.7" fill="currentColor" />
      <path
        d="M2.8 4.8h2.6l.8 2.7m0 0L8 15.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 .96-.73L20.3 8H6.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ParcelStepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[23px] h-[23px]">
      <path
        d="M12 3.2 19.6 7.5v8.8L12 20.6l-7.6-4.3V7.5L12 3.2Z"
        fill="currentColor"
      />
      <path
        d="M4.4 7.5 12 11.8l7.6-4.3M12 11.8v8.8M8.3 5.3 15.9 9.6"
        stroke="#CEE0C5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeliveryTruckStepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[24px] h-[24px]">
      <path d="M2.5 7.2a1.2 1.2 0 0 1 1.2-1.2h10.8v10H2.5V7.2Z" fill="currentColor" />
      <path d="M14.5 9.2h3.6l3.4 3.4V16h-7V9.2Z" fill="currentColor" />
      <path d="M16 10.6h1.9l2 2h-3.9v-2Z" fill="#CEE0C5" />
      <circle cx="7" cy="17.2" r="2.2" fill="currentColor" stroke="#CEE0C5" strokeWidth="1.1" />
      <circle cx="17.5" cy="17.2" r="2.2" fill="currentColor" stroke="#CEE0C5" strokeWidth="1.1" />
    </svg>
  )
}

const STEP_ICON_MAP = {
  shoppingcart: CartStepIcon,
  packagecheck: ParcelStepIcon,
  checkcircle: ParcelStepIcon,
  checksquare: ParcelStepIcon,
  truck: DeliveryTruckStepIcon,
}

const STEP_INDEX_ICONS = [CartStepIcon, ParcelStepIcon, DeliveryTruckStepIcon]

export default function HowItWorksSection({ data = [] }) {
  const steps = data.length > 0 ? data : []

  return (
    <section id="how-it-works" className="relative pt-1 pb-12 sm:pb-16 overflow-hidden">
      {/* Subtle botanical leaf glow peeking softly off bottom-left edge matching canvas flow */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none hidden lg:block absolute -left-10 bottom-2 w-48 h-48 rounded-full bg-[#C3D9B5]/35 blur-2xl z-0"
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[20px] sm:rounded-[22px] bg-[#E7EFDA] ws-card-shadow overflow-hidden grid grid-cols-1 lg:grid-cols-[30%_33%_37%] items-center">
          {/* Left Zone: Full Delivery Van Scene Melting Seamlessly Into #E7EFDA */}
          <div className="relative h-[160px] sm:h-[185px] lg:h-[184px] w-full overflow-hidden">
            <Image
              src="/wholesale/how-it-works-van.webp"
              alt="El Árbol wholesale refrigerated delivery van"
              fill
              decoding="async"
              unoptimized
              sizes="(max-width: 1024px) 100vw, 380px"
              className="object-cover object-left"
            />
            <div
              aria-hidden="true"
              className="hidden lg:block pointer-events-none absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(231,239,218,0) 70%, #E7EFDA 100%)',
              }}
            />
          </div>

          {/* Center Zone: Header & Subtitle */}
          <div className="px-6 py-5 lg:py-6 lg:pl-2 lg:pr-4">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="w-6 h-[1px] bg-[#698672]/45" aria-hidden="true" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#546D5D]">
                HOW IT WORKS
              </span>
              <span className="w-6 h-[1px] bg-[#698672]/45" aria-hidden="true" />
            </div>

            <h2
              className="text-[22px] sm:text-[25px] xl:text-[26px] font-semibold tracking-[-0.02em] leading-[1.14] text-[#0E3B27] mb-2"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              From application to first delivery in under 48 hours.
            </h2>

            <p className="text-[11.5px] sm:text-[12px] text-[#738679] leading-[1.45]">
              We make it simple to get fresh produce to your business.
            </p>
          </div>

          {/* Right Zone: 3 Solid-Icon Step Circles Connected by Clean Arrows */}
          <div className="px-5 pb-6 pt-1 lg:py-6 lg:pr-7 lg:pl-2">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              {steps.map((s, i) => {
                const key = String(s.icon_name || '').replace(/[-_ ]+/g, '').toLowerCase()
                const StepIcon = STEP_ICON_MAP[key] || STEP_INDEX_ICONS[i % STEP_INDEX_ICONS.length]
                const isFirst = i === 0
                const isLast = i === steps.length - 1

                const circleContent = (
                  <>
                    <div className="relative w-[56px] h-[56px] rounded-full bg-[#CEE0C5] flex items-center justify-center text-[#12482D] group-hover:scale-105 transition-transform">
                      {StepIcon ? (
                        <StepIcon />
                      ) : (
                        <DynamicIcon name={s.icon_name} size={22} className="text-[#12482D]" fallbackName="CheckCircle" />
                      )}
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full bg-[#184E34] text-white text-[9.5px] font-bold flex items-center justify-center leading-none border-[1.5px] border-[#E7EFDA]">
                        {String(s.number || i + 1).replace(/^0+/, '')}
                      </span>
                    </div>
                    <span className="mt-3.5 text-[11.5px] sm:text-[12px] font-medium text-[#153E2A] leading-[1.28] max-w-[112px]">
                      {s.title}
                    </span>
                  </>
                )

                return (
                  <div key={s.id || i} className="contents">
                    {isFirst ? (
                      <WholesaleApplyButton className="group flex-1 flex flex-col items-center text-center cursor-pointer focus:outline-none">
                        {circleContent}
                      </WholesaleApplyButton>
                    ) : (
                      <div className="group flex-1 flex flex-col items-center text-center">
                        {circleContent}
                      </div>
                    )}

                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className="text-[#164A31] mt-[20px] shrink-0 select-none"
                      >
                        <svg viewBox="0 0 18 14" fill="none" className="w-[17px] h-[13px]">
                          <path
                            d="M1.5 7h14m0 0-4-4m4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.45"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
