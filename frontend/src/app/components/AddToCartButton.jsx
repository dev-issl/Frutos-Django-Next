'use client'
import { useState } from 'react'
import { useCart } from '@/app/context/CartContext'

export default function AddToCartButton({
  product,
  inStock         = true,
  isWholesale     = false,
  minWholesaleQty = 1,
  effectivePrice  = null,
  // Pass qty from product detail page; card always passes 1
  qty             = 1,
}) {
  const { items, addItem, setSidebarOpen } = useCart()
  const [added, setAdded] = useState(false)
  const [showStockError, setShowStockError] = useState(false)

  const getWholesaleOrRetailStock = (prod) => {
    if (prod.wholesalePrice || prod.wholesale_price) {
      if (prod.wholesale_stock !== undefined && prod.wholesale_stock !== null) return Math.max(0, Number(prod.wholesale_stock));
      if (prod.restaurant_stock !== undefined && prod.restaurant_stock !== null) return Math.max(0, Number(prod.restaurant_stock));
    }
    if (prod.stock !== undefined && prod.stock !== null) return Math.max(0, Number(prod.stock));
    return Infinity;
  };
  const maxStock = getWholesaleOrRetailStock(product);

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock) return

    const existingItem = items.find(i => i.id === product.id && (i.item_type || 'product') === (product.item_type || 'product'))
    const currentCartQty = existingItem ? existingItem.qty : 0

    let finalQty = qty

    // Wholesale minimum check:
    // If not in cart yet, start with minWholesaleQty (or stock limit if stock < minWholesaleQty)
    // If already in cart, increment by qty (which is 1 on ProductCard)
    if (isWholesale && (product.wholesalePrice || product.wholesale_price) && currentCartQty === 0 && qty < minWholesaleQty) {
      finalQty = maxStock < Infinity ? Math.min(minWholesaleQty, maxStock) : minWholesaleQty
    }

    // Check against available stock
    if (maxStock < Infinity) {
      if (currentCartQty + finalQty > maxStock) {
        setShowStockError(true)
        setTimeout(() => setShowStockError(false), 3500)
        return
      }
    }

    addItem(product, effectivePrice, finalQty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (!inStock) return null

  return (
    <>
      {showStockError && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999, width: 'min(380px, calc(100vw - 32px))',
          background: '#151E13', color: 'white',
          borderRadius: '14px', padding: '16px 18px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          animation: 'toastIn 0.25s ease',
        }}>
          <style>{`@keyframes toastIn{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
          <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,100,100,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
            <svg width="15" height="15" fill="none" stroke="#F87171" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '13.5px', margin: '0 0 5px' }}>
              Insufficient Stock
            </p>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.55 }}>
              Sorry, we only have <strong style={{ color: 'white' }}>{maxStock} {product.unit || 'units'}</strong> in stock.
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowStockError(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
                     color: 'rgba(255,255,255,0.4)', padding: 0, flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      <button
        onClick={handleClick}
        className="flex cursor-pointer items-center justify-center transition-all duration-200 active:scale-[0.97]"
        style={{
          background: added ? '#085041' : 'linear-gradient(135deg, #00694C 0%, #008560 100%)',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          padding: added ? '8px 12px' : '8px', // মোবাইলে ছোট প্যাডিং
          boxShadow: added ? 'none' : '0 2px 8px rgba(0,105,76,0.25)',
        }}
      >
        {added ? (
           <div className="flex items-center gap-1.5">
             <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
               <path d="M5 13l4 4L19 7" />
             </svg>
             <span className="hidden md:inline text-[13px] font-bold">Added</span>
           </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* আপনার দেওয়া কার্ট আইকনটি এখানে */}
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {/* ডেস্কটপে টেক্সট দেখাবে, মোবাইলে হাইড থাকবে */}
            <span className="hidden md:inline text-[13px] font-bold pr-1">Add Item</span>
          </div>
        )}
      </button>
    </>
  )
}