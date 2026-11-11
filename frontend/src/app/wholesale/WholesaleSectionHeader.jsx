/**
 * Shared heading block with hairline rules and Newsreader serif title
 * used across Wholesale page sections.
 */
export default function WholesaleSectionHeader({
  eyebrow,
  title,
  align = 'center',
  className = 'mb-7 sm:mb-8',
}) {
  const isLeft = align === 'left'

  return (
    <div className={`${isLeft ? 'text-left' : 'text-center'} ${className}`}>
      <div
        className={`flex items-center gap-3 mb-1.5 ${
          isLeft ? 'justify-start max-w-[260px]' : 'justify-center max-w-[380px] mx-auto'
        }`}
      >
        {!isLeft && <span className="ws-eyebrow-rule" aria-hidden="true" />}
        {isLeft && <span className="ws-eyebrow-rule max-w-[26px]" aria-hidden="true" />}
        <span className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-[#566D5F] whitespace-nowrap">
          {eyebrow}
        </span>
        <span className={`ws-eyebrow-rule-right ${isLeft ? 'max-w-[36px]' : ''}`} aria-hidden="true" />
      </div>
      {title && (
        <h2
          className="text-[27px] sm:text-[33px] lg:text-[35px] font-semibold tracking-[-0.02em] leading-[1.12] text-[#0E3B27]"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          {title}
        </h2>
      )}
    </div>
  )
}

