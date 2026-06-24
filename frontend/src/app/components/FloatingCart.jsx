'use client'
import { useCart } from '@/app/context/CartContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function FloatingCart() {
  const { totalItems, subtotal, sidebarOpen, setSidebarOpen } = useCart()
  const pathname = usePathname()
  const [isBumping, setIsBumping] = useState(false)

  // Trigger bump animation whenever totalItems changes
  useEffect(() => {
    if (totalItems === 0) return
    setIsBumping(true)
    const timer = setTimeout(() => setIsBumping(false), 400)
    return () => clearTimeout(timer)
  }, [totalItems])

  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/wholesale/profile') || pathname?.startsWith('/staff')) return null

  return (
    <>
      <style>{`
        @keyframes cartBump {
          0%   { transform: translateY(-50%) scale(1); }
          20%  { transform: translateY(-50%) scale(1.08) rotate(-2deg); }
          40%  { transform: translateY(-50%) scale(1.08) rotate(2deg); }
          60%  { transform: translateY(-50%) scale(1.08) rotate(-1deg); }
          80%  { transform: translateY(-50%) scale(1.08) rotate(1deg); }
          100% { transform: translateY(-50%) scale(1); }
        }
        .bump-anim {
          animation: cartBump 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .floating-cart-wrapper {
          position: fixed;
          right: 25px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9990;
          transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease;
        }
        .floating-cart-hidden {
          transform: translateY(-50%) translateX(150px) !important;
          opacity: 0;
          pointer-events: none;
        }
        @media (max-width: 1023px) {
          .floating-cart-wrapper {
            display: none !important;
          }
        }
        .cart-container {
          background: #00694C;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 3px 3px 0px #1D9E75;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 72px;
          will-change: transform;
        }
        .cart-top {
          width: 100%;
          padding: 6px 2px 2px 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .cart-icon {
          width: 22px;
          height: 22px;
          fill: none;
          stroke: #ffffff;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          margin-bottom: -2px;
        }
        .cart-items-text {
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          margin-top: 2px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .cart-bottom {
          background: #1A1A1A;
          width: 100%;
          padding: 4px 2px;
          text-align: center;
        }
        .cart-price-text {
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.5px;
          line-height: 1;
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>

      <div className={`floating-cart-wrapper ${isBumping ? 'bump-anim' : ''} ${sidebarOpen ? 'floating-cart-hidden' : ''}`}>
        <div
          onClick={() => setSidebarOpen(true)}
          className="cart-container"
        >
          <div className="cart-top">
            <svg className="cart-icon" viewBox="0 0 24 24">
              <path d="M5 8 a7 7 0 0 0 14 0" />
            </svg>
            <span className="cart-items-text">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="cart-bottom">
            <span className="cart-price-text">৳{Math.round(subtotal)}</span>
          </div>
        </div>
      </div>
    </>
  )
}
