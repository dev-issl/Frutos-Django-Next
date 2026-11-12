import React from 'react'

function buildScallopPath(lobes = 16, outerR = 48.5, innerR = 43.2, cx = 50, cy = 50) {
  const step = (Math.PI * 2) / lobes
  const pts = []
  for (let i = 0; i < lobes; i++) {
    const a1 = i * step
    const aMid = a1 + step / 2
    const a2 = (i + 1) * step
    const x1 = cx + innerR * Math.cos(a1)
    const y1 = cy + innerR * Math.sin(a1)
    const cxPt = cx + (outerR + 2.4) * Math.cos(aMid)
    const cyPt = cy + (outerR + 2.4) * Math.sin(aMid)
    const x2 = cx + innerR * Math.cos(a2)
    const y2 = cy + innerR * Math.sin(a2)
    if (i === 0) {
      pts.push(`M ${x1.toFixed(2)} ${y1.toFixed(2)}`)
    }
    pts.push(`Q ${cxPt.toFixed(2)} ${cyPt.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`)
  }
  pts.push('Z')
  return pts.join(' ')
}

const SCALLOP_PATH_16 = buildScallopPath(16, 48.5, 43.2)

export default function ScallopBadge({
  prefix = 'Flat',
  percentage = 30,
  suffix = 'OFF',
  variant = 'red',
  hasDiscount = true,
  className = '',
}) {
  const fillMap = {
    hero: '#0B4B39',
    red: '#E53E46',
    green: '#2E6E36',
  }
  const fill = fillMap[variant] || fillMap.red
  const isHero = variant === 'hero'

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        isHero
          ? 'w-[86px] h-[86px] sm:w-[104px] sm:h-[104px] md:w-[114px] md:h-[114px]'
          : 'w-[58px] h-[58px] sm:w-[64px] sm:h-[64px]'
      } ${className}`}
      aria-label={hasDiscount ? `${prefix} ${percentage}% ${suffix}` : 'Special Offer'}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full drop-shadow-[0_4px_10px_rgba(8,50,35,0.16)]"
        aria-hidden="true"
      >
        <path d={SCALLOP_PATH_16} fill={fill} />
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center text-center leading-none">
        {hasDiscount ? (
          <>
            <span
              className={
                isHero
                  ? 'text-white/95 text-[10.5px] sm:text-[12px] font-medium mb-[2px]'
                  : 'text-white/95 text-[9.5px] sm:text-[10px] font-medium mb-[1px]'
              }
            >
              {prefix}
            </span>
            <span
              className={
                isHero
                  ? 'text-[#F6DA63] font-bold text-[22px] sm:text-[27px] md:text-[30px] leading-none tracking-tight'
                  : 'text-white font-extrabold text-[15px] sm:text-[17px] leading-none tracking-tight'
              }
              style={{
                fontFamily: isHero
                  ? 'var(--font-newsreader), Georgia, serif'
                  : 'var(--font-manrope), sans-serif',
              }}
            >
              {percentage}%
            </span>
            <span
              className={
                isHero
                  ? 'text-white text-[10.5px] sm:text-[12px] font-bold tracking-[0.06em] mt-[2px]'
                  : 'text-white text-[8.5px] sm:text-[9px] font-bold tracking-[0.06em] mt-[1.5px]'
              }
            >
              {suffix}
            </span>
          </>
        ) : (
          <>
            <span className="text-white/95 text-[9px] font-semibold uppercase tracking-wider">
              Special
            </span>
            <span className="text-white font-extrabold text-[13px] leading-tight mt-0.5">
              DEAL
            </span>
          </>
        )}
      </div>
    </div>
  )
}

