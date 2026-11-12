'use client'

import { useCart } from '@/app/context/CartContext'
import { usePathname } from 'next/navigation'

export default function FloatingCart() {
  const { totalItems, subtotal, sidebarOpen, setSidebarOpen } = useCart()
  const pathname = usePathname()

  if (totalItems === 0) return null
  if (
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/wholesale/profile') ||
    pathname?.startsWith('/staff')
  ) {
    return null
  }

  return (
    <>
      <style>{`
        @keyframes cartBump {
          0%   { transform: scale(1); }
          25%  { transform: scale(1.1) rotate(-3deg); }
          55%  { transform: scale(1.06) rotate(2deg); }
          80%  { transform: scale(0.98) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .floating-cart-bump {
          animation: cartBump 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .floating-cart-bump {
            animation: none;
          }
        }
        .floating-cart-wrapper {
          position: fixed;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9990;
          transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.24s ease;
        }
        .floating-cart-hidden {
          transform: translateY(-50%) translateX(120px) !important;
          opacity: 0;
          pointer-events: none;
        }
        @media (max-width: 1023px) {
          .floating-cart-wrapper {
            display: none !important;
          }
        }
        .floating-cart-tile {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 15px;
          background: linear-gradient(155deg, #0D4E2F 0%, #063820 100%);
          border: 2.5px solid #FFFFFF;
          box-shadow: inset -1.5px -2.5px 0 #539E2B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), filter 0.2s ease;
          outline: none;
        }
        .floating-cart-tile:hover {
          transform: scale(1.05);
          filter: brightness(1.06);
        }
        .floating-cart-tile:active {
          transform: scale(0.96);
        }
        .floating-cart-tile:focus-visible {
          box-shadow: 0 0 0 3px #0B462B, inset -1.5px -2.5px 0 #539E2B;
        }
        .floating-cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          min-width: 26px;
          height: 26px;
          padding: 0 6px;
          border-radius: 9999px;
          background: linear-gradient(145deg, #F0B235 0%, #DC9416 100%);
          border: 2.5px solid #FFFFFF;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
          font-family: var(--font-newsreader), Georgia, serif;
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
      `}</style>

      <div className={`floating-cart-wrapper ${sidebarOpen ? 'floating-cart-hidden' : ''}`}>
        <div key={totalItems} className="floating-cart-bump">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label={`Open shopping basket, ${totalItems} item${totalItems !== 1 ? 's' : ''}, subtotal €${subtotal.toFixed(2)}`}
            title={`Your Basket (${totalItems}) · €${subtotal.toFixed(2)}`}
            className="floating-cart-tile"
          >
            {/* Classic wireframe shopping cart icon matching El Árbol UI */}
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3.5 5.5H6.2L8.4 15.2C8.55 15.85 9.1 16.3 9.75 16.3H17.6C18.2 16.3 18.75 15.9 18.92 15.32L20.6 9.3C20.72 8.88 20.4 8.45 19.96 8.45H7" />
              <path d="M8 12.1H19.4" strokeWidth="1.5" />
              <path d="M13.6 8.55V16.1" strokeWidth="1.5" />
              <circle cx="10.2" cy="19.6" r="1.45" />
              <circle cx="17.2" cy="19.6" r="1.45" />
            </svg>

            <span className="floating-cart-badge">{totalItems}</span>
          </button>
        </div>
      </div>
    </>
  )
}
