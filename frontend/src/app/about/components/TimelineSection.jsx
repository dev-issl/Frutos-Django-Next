import Image from 'next/image'
import SectionHeader from './SectionHeader'

export default function TimelineSection({ milestones = [] }) {
  return (
    <section className="relative w-full overflow-hidden bg-[#F2F5EC] pt-7 sm:pt-9 pb-10 sm:pb-12">
      {/* Right-aligned alpha-masked farm field preserving the exact hill & S-wave silhouette */}
      <div
        aria-hidden="true"
        className="hidden md:block pointer-events-none select-none absolute right-0 top-1 bottom-2 sm:bottom-3 w-[68%] lg:w-[60%] xl:w-[57.5%] z-0 overflow-hidden"
      >
        <Image
          src="/about/journey-field.webp"
          alt=""
          fill
          decoding="async"
          unoptimized
          sizes="(max-width: 1280px) 68vw, 960px"
          className="object-contain object-right-bottom"
        />
      </div>

      {/* Foreground Header & Milestones */}
      <div className="relative z-20 max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="OUR JOURNEY" title="Our journey" className="mb-6 sm:mb-7" />

        <div className="max-w-[640px]">
          <div className="flex flex-col">
            {milestones.map((m, i) => {
              const isFirst = i === 0
              const isLast = i === milestones.length - 1
              return (
                <div
                  key={i}
                  className="relative flex items-center gap-4 sm:gap-5 py-2 sm:py-2.5"
                >
                  {/* Vertical connecting line spanning strictly between first dot center & last dot center */}
                  {!isFirst && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[4px] top-0 h-1/2 w-[1.5px] bg-[#A7C0A8]"
                    />
                  )}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[4px] top-1/2 bottom-0 w-[1.5px] bg-[#A7C0A8]"
                    />
                  )}

                  {/* Green node dot */}
                  <span
                    aria-hidden="true"
                    className="relative z-10 w-[9.5px] h-[9.5px] rounded-full bg-[#669170] shadow-[0_0_0_2px_rgba(242,245,236,0.95)] shrink-0"
                  />

                  {/* Soft sage year pill */}
                  <span className="inline-flex items-center justify-center rounded-full bg-[#DAE7D1] text-[#17432E] px-3.5 py-0.5 text-[12px] font-semibold min-w-[54px] shrink-0">
                    {m.year}
                  </span>

                  {/* Dash + Milestone copy */}
                  <p className="text-[13px] sm:text-[13.5px] text-[#284235] leading-snug">
                    <span className="text-[#566F60] mr-2" aria-hidden="true">
                      -
                    </span>
                    {m.event}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
