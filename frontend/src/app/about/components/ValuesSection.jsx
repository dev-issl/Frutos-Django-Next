import SectionHeader from './SectionHeader'

export default function ValuesSection({ values = [] }) {
  return (
    <section className="relative py-8 sm:py-11 overflow-hidden bg-[#F2F5EC]">
      {/* Subtle pale sage-green wave peeking softly at upper-right behind header */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-12 right-0 w-72 sm:w-96 h-24 rounded-bl-[100%] bg-[#DCE8D4]/55"
      />

      <div className="relative z-10 max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="OUR VALUES" title="Our values" className="mb-6 sm:mb-7" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {values.map((v, i) => (
            <div
              key={i}
              className="bg-[#F6F7EE] rounded-[13px] border border-[#E2EBDC] hover:border-[#C2D6BD] transition-colors px-5 py-4"
            >
              <div className="w-[40px] h-[40px] rounded-full bg-[#D5E6CE] border-[1.4px] border-[#3F7350] flex items-center justify-center mb-3">
                {v.icon}
              </div>
              <h3 className="text-[15.5px] font-bold tracking-[-0.015em] text-[#113C28] mb-1 leading-snug">
                {v.title}
              </h3>
              <p className="text-[12.5px] text-[#50685B] leading-[1.42]">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
