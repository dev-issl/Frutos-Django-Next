/**
 * Centered section heading with flanked hairline rules and Newsreader title
 * shared across Values, Journey, Farm Partners, Team, and CTA sections.
 */
export default function SectionHeader({ eyebrow, title, className = 'mb-8 sm:mb-10' }) {
  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-3.5 max-w-[420px] mx-auto mb-1.5">
        <span className="about-eyebrow-rule" aria-hidden="true" />
        <span className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#566D5F] whitespace-nowrap">
          {eyebrow}
        </span>
        <span className="about-eyebrow-rule-right" aria-hidden="true" />
      </div>
      {title && (
        <h2
          className="text-[28px] sm:text-[34px] lg:text-[36px] font-semibold tracking-[-0.02em] leading-[1.15] text-[#0E3B27]"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          {title}
        </h2>
      )}
    </div>
  )
}

