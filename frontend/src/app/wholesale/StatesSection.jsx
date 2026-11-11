import DynamicIcon from '@/app/components/DynamicIcon'

function LeafStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path
        d="M19 4.5C12.5 5 7.5 8.5 5.5 15c4.5-.5 8.8-2.8 11.4-7 .9-1.3 1.6-2.4 2.1-3.5Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path d="M5 19c2.4-3 6-6.2 11.2-9.6" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  )
}

function StoreStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.55" />
      <path
        d="M3 9.5 4.8 4.8A1 1 0 0 1 5.7 4h12.6a1 1 0 0 1 .9.8L21 9.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path d="M9.5 20v-4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  )
}

function HandshakeStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path
        d="M3 11.5 6.8 8a2.5 2.5 0 0 1 3.4-.1l1.2 1a1.5 1.5 0 0 0 1.9 0l1-.8a2.5 2.5 0 0 1 3.4.1l3.3 3.3"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 14.3 9.3 17.3a2.2 2.2 0 0 0 2.9 0l5.4-4.5"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[22px] h-[22px]">
      <path
        d="M12 3.2 5 6.3v5.4c0 4.8 3 8.3 7 9.5 4-1.2 7-4.7 7-9.5V6.3l-7-3.1Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path d="m9.2 12.1 2 2 3.8-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const STAT_ICON_MAP = {
  leaf: LeafStatIcon,
  store: StoreStatIcon,
  handshake: HandshakeStatIcon,
  shieldcheck: ShieldStatIcon,
}

export default function StatesSection({ data = [] }) {
  const stats = data.length > 0 ? data : []

  return (
    <section className="relative z-20 -mt-8 sm:-mt-9 pb-6 sm:pb-8">
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#084A2E] rounded-[20px] sm:rounded-[22px] ws-stats-shadow px-3 sm:px-6 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 md:gap-y-0">
            {stats.map((s, i) => {
              const key = String(s.icon_name || '').replace(/[-_ ]+/g, '').toLowerCase()
              const Preset = STAT_ICON_MAP[key] || [LeafStatIcon, StoreStatIcon, HandshakeStatIcon, ShieldStatIcon][i]
              const showRightDivider = i < stats.length - 1

              return (
                <div key={i} className="relative flex justify-center px-3 sm:px-4 py-0.5">
                  {showRightDivider && (
                    <span
                      aria-hidden="true"
                      className="hidden md:block absolute right-0 top-2.5 bottom-2.5 w-[1px] bg-white/20"
                    />
                  )}
                  <div className="flex flex-col items-start text-left min-w-[104px] sm:min-w-[124px]">
                    <div className="text-white/85 mb-1.5">
                      {Preset ? (
                        <Preset />
                      ) : (
                        <DynamicIcon name={s.icon_name} size={21} className="text-white/85" fallbackName="CheckCircle2" />
                      )}
                    </div>
                    <p className="text-[24px] sm:text-[26px] font-medium text-white leading-[1.1] tracking-[-0.015em]">
                      {s.value}
                    </p>
                    <p className="text-[12px] sm:text-[12.5px] font-semibold text-white/95 leading-snug mt-0.5">
                      {s.label}
                    </p>
                    {s.sub && (
                      <p className="text-[10.5px] sm:text-[11px] text-white/65 leading-tight mt-0.5">
                        {s.sub}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
