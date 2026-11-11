import DynamicIcon from '@/app/components/DynamicIcon'

const DEFAULT_STAT_ICONS = ['Leaf', 'Store', 'Sprout', 'ShieldCheck']

export default function StatsSection({ stats = [] }) {
  return (
    <section className="relative z-20 pb-4 sm:pb-6">
      {/* Soft sage organic bottom sweep sitting under the right side of the dark stats pill */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-b from-[#E5EFE0]/45 to-[#F2F5EC] z-0"
      />

      <div className="relative z-10 max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        <div className="rounded-[14px] sm:rounded-[16px] bg-[#10422D] text-white shadow-[0_14px_34px_rgba(11,53,35,0.16)] px-3 sm:px-6 py-4 sm:py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4">
            {stats.map((s, i) => {
              const iconName = s.icon_name || DEFAULT_STAT_ICONS[i % DEFAULT_STAT_ICONS.length]
              return (
                <div
                  key={i}
                  className={`flex items-center justify-center gap-3 sm:gap-3.5 px-3 py-1.5 ${
                    i < stats.length - 1 ? 'lg:border-r lg:border-white/15' : ''
                  } ${i % 2 === 0 ? 'border-r border-white/12 lg:border-r' : ''}`}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-[#B4E0B9]">
                    <DynamicIcon name={iconName} size={20} fallbackName="Leaf" />
                  </div>
                  <div className="text-left min-w-0">
                    <p
                      className="text-[24px] sm:text-[28px] lg:text-[31px] font-semibold text-white leading-none tracking-tight"
                      style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                      {s.value}
                    </p>
                    <p className="text-[11px] sm:text-[12px] text-white/80 font-medium mt-1 leading-tight truncate">
                      {s.label}
                    </p>
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
