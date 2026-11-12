'use client'

/**
 * Shared botanical decorative dividers and watermarks matching El Árbol's
 * warm organic UI system across Product Detail, Basket, Checkout, and Confirmation.
 */

export function LeafDivider({ className = '', align = 'left' }) {
  return (
    <div
      className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''} ${className}`}
      aria-hidden="true"
    >
      <span className="h-[1px] w-14 bg-[#C4CFBE]" />
      <svg width="20" height="14" viewBox="0 0 24 16" fill="none">
        <path
          d="M2 12C7 12 11 8 15 3C16.5 6.5 14 11.5 9 13.5C6.5 14.5 3.8 14 2 12Z"
          fill="#6E9454"
        />
        <path
          d="M11 11.5C15 11.5 19.5 9 22 4.5C21 9 18 13.5 13 13.5"
          stroke="#4F7942"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="h-[1px] w-14 bg-[#C4CFBE]" />
    </div>
  )
}

export function SubtleLeafWatermark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 180 140"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M168 12C122 24 88 54 68 98C98 92 134 68 168 12Z"
        fill="#DCE6D0"
        fillOpacity="0.65"
      />
      <path
        d="M166 76C124 72 86 88 52 128C94 128 138 112 166 76Z"
        fill="#D2DFC4"
        fillOpacity="0.6"
      />
      <path
        d="M44 134C88 102 128 62 168 12"
        stroke="#C5D4B4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function HeroWaveMask({ fill = '#F6F6EC', className = '' }) {
  return (
    <svg
      viewBox="0 0 1440 54"
      preserveAspectRatio="none"
      className={`w-full block pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M0 32C240 56 480 4 760 22C1040 40 1260 44 1440 14V54H0V32Z"
        fill={fill}
      />
    </svg>
  )
}

