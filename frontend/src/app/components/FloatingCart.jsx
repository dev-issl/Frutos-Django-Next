'use client'
import { useCart } from '@/app/context/CartContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function FloatingCart() {
  const { totalItems, subtotal, setSidebarOpen } = useCart()
  const pathname = usePathname()
  const [isBumping, setIsBumping] = useState(false)

  // Trigger bump animation whenever totalItems changes
  useEffect(() => {
    if (totalItems === 0) return
    setIsBumping(true)
    const timer = setTimeout(() => setIsBumping(false), 400)
    return () => clearTimeout(timer)
  }, [totalItems])

  if (pathname?.startsWith('/dashboard')) return null

  return (
    <>
      <style>{`
        @keyframes cartBump {
          0%   { transform: scale(1); }
          20%  { transform: scale(1.1) rotate(-3deg); }
          40%  { transform: scale(1.1) rotate(3deg); }
          60%  { transform: scale(1.1) rotate(-1deg); }
          80%  { transform: scale(1.1) rotate(1deg); }
          100% { transform: scale(1); }
        }
        .bump-anim {
          animation: cartBump 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .floating-cart-wrapper {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9990;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cart-top {
          background: transparent; /* Parent container handles the main color */
          width: 100%;
          padding: 16px 4px 14px 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-container {
          position: relative;
          display: inline-flex;
        }
        .cart-icon {
          width: 28px;
          height: 28px;
          fill: none;
          stroke: #ffffff;
          stroke-width: 1.6;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 2px solid var(--common-color, #00694C); /* Matches the cart background to blend seamlessly */
          font-family: system-ui, -apple-system, sans-serif;
        }
        .cart-bottom {
          background: rgba(0, 0, 0, 0.15); /* Elegant translucent overlay */
          width: 100%;
          padding: 10px 4px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cart-price-text {
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          line-height: 1;
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>

      <div className="floating-cart-wrapper">
        <div
          onClick={() => setSidebarOpen(true)}
          className={`cart-container ${isBumping ? 'bump-anim' : ''}`}
          style={{
            background: 'var(--common-color, #00694C)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 12px 30px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '72px',
            willChange: 'transform'
          }}
        >
          <div className="cart-top">
            <div className="icon-container">
              <svg className="cart-icon" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {totalItems > 0 && (
                <span className="cart-badge">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
          </div>
          <div className="cart-bottom">
            <span className="cart-price-text">৳{Math.round(subtotal)}</span>
          </div>
        </div>
      </div>
    </>
  )
}
