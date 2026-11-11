import DynamicIcon from '@/app/components/DynamicIcon'
import WholesaleSectionHeader from './WholesaleSectionHeader'

function LeafValueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path
        d="M19 4.5C12.5 5 7.5 8.5 5.5 15c4.5-.5 8.8-2.8 11.4-7 .9-1.3 1.6-2.4 2.1-3.5Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M5 19c2.4-3 6-6.2 11.2-9.6" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  )
}

function HandshakeValueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path
        d="M3 11.5 6.8 8a2.5 2.5 0 0 1 3.4-.1l1.2 1a1.5 1.5 0 0 0 1.9 0l1-.8a2.5 2.5 0 0 1 3.4.1l3.3 3.3"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 14.3 9.3 17.3a2.2 2.2 0 0 0 2.9 0l5.4-4.5"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m8 16 1.4-1.2M10.4 17.5l1.5-1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AwardRibbonValueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <circle cx="12" cy="9.5" r="5" stroke="currentColor" strokeWidth="1.65" />
      <circle cx="12" cy="9.5" r="2.1" stroke="currentColor" strokeWidth="1.45" />
      <path d="M9.5 14v6l2.5-1.6 2.5 1.6v-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function TruckValueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path d="M3 7h11v8.5H3V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v2.5h-7V10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="17.2" r="1.8" stroke="currentColor" strokeWidth="1.55" />
      <circle cx="17.5" cy="17.2" r="1.8" stroke="currentColor" strokeWidth="1.55" />
    </svg>
  )
}

function HeadsetValueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      <rect x="3" y="12" width="3.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="17.5" y="12" width="3.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19 17.5c0 1.8-1.4 3-3.5 3h-2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  )
}

function GrowthChartValueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path d="M5 19v-3.5M10 19v-6.5M15 19v-5M20 19V11" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      <path
        d="m4.5 11.5 5-4 4 2.5 5.5-5.5M15.8 4.5H19v3.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const VALUE_ICON_MAP = {
  leaf: LeafValueIcon,
  handshake: HandshakeValueIcon,
  award: AwardRibbonValueIcon,
  truck: TruckValueIcon,
  headset: HeadsetValueIcon,
  trendingup: GrowthChartValueIcon,
}

const INDEX_PRESETS = [
  LeafValueIcon,
  HandshakeValueIcon,
  AwardRibbonValueIcon,
  TruckValueIcon,
  HeadsetValueIcon,
  GrowthChartValueIcon,
]

export default function BenefitsSection({ data = [] }) {
  const benefits = data.length > 0 ? data : []

  return (
    <section className="relative py-7 sm:py-9">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <WholesaleSectionHeader
          eyebrow="OUR VALUES"
          title={
            <>
              Everything your operation
              <br />
              needs, nothing it doesn&apos;t.
            </>
          }
          className="mb-7 sm:mb-8"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {benefits.map((b, i) => {
            const key = String(b.icon_name || '').replace(/[-_ ]+/g, '').toLowerCase()
            const PresetIcon = VALUE_ICON_MAP[key] || INDEX_PRESETS[i % INDEX_PRESETS.length]

            return (
              <div
                key={i}
                className="bg-[#FAFBF7] rounded-[14px] ws-card-shadow border border-transparent hover:border-[#CFE0CB] transition-colors px-5 py-4 sm:py-[18px] flex items-center gap-4"
              >
                <div className="w-[46px] h-[46px] rounded-full bg-[#E1EFE0] flex items-center justify-center shrink-0 text-[#1F5C3F]">
                  {PresetIcon ? (
                    <PresetIcon />
                  ) : (
                    <DynamicIcon name={b.icon_name} size={21} className="text-[#1F5C3F]" fallbackName="Leaf" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] sm:text-[15.5px] font-semibold tracking-[-0.01em] text-[#133D29] leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-[12px] text-[#66786D] leading-[1.42] mt-0.5">
                    {b.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
