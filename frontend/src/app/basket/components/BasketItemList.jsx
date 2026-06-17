'use client'
// src/app/basket/_components/BasketItemList.jsx

import Image from 'next/image'

export default function BasketItemList({ items, updateQty, removeItem, isApprovedWholesale }) {
  return (
    <div className="space-y-4">
      {items.map(item => {
        const effectivePrice = item.effectivePrice ?? item.price
        const isWholesaleItem = item.effectivePrice && item.effectivePrice !== item.price
        const minQty = (item.wholesalePrice && item.minWholesaleQty) ? Math.max(1, parseInt(item.minWholesaleQty, 10)) : 1;
        const belowMinQty = item.wholesalePrice && item.qty < minQty

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-xl transition-all"
            style={{
              background:  '#ffffff',
              border:      '1px solid #f0f0f0',
              boxShadow:   '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* Thumbnail */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-grow min-w-0">
              {/* Name row */}
              <div className="flex justify-between items-start gap-2 min-w-0">
                <div className="min-w-0">
                  <h3
                    className="text-base md:text-xl font-medium leading-tight truncate"
                    style={{ color: '#151e13' }}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="text-xs md:text-sm italic mt-0.5"
                    style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#6d7a73' }}
                  >
                    from {item.origin}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <span
                    className="font-bold text-base md:text-xl"
                    style={{ color: '#855000' }}
                  >
                    €{(effectivePrice * item.qty).toFixed(2)}
                  </span>

                  {isWholesaleItem && (
                    <p className="text-[10px]" style={{ color: '#6D28D9' }}>
                      €{Number(effectivePrice).toFixed(2)} / unit
                    </p>
                  )}

                  {belowMinQty && (
                    <p className="text-[10px] font-bold" style={{ color: '#BA1A1A' }}>
                      Min. {item.minWholesaleQty} needed
                    </p>
                  )}
                </div>
              </div>

              {/* Qty stepper + remove */}
              <div className="flex justify-between items-center mt-3 md:mt-4">
                <div
                  className="flex items-center gap-0.5 rounded-lg p-1"
                  style={{ background: '#f0f4f0' }}
                >
                  <button
                    onClick={() => updateQty(item.id, Math.max(minQty, item.qty - 1), item.item_type || 'product')}
                    disabled={item.qty <= minQty}
                    className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded transition-colors ${item.qty <= minQty ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:bg-[#e2e8e2]'}`}
                    style={{ color: item.qty <= minQty ? undefined : '#3d4943' }}
                    aria-label="Decrease quantity"
                  >
                    <span className="material-symbols-outlined text-[14px] md:text-[16px]">remove</span>
                  </button>

                  <span
                    className="w-7 md:w-8 text-center font-bold text-sm md:text-base"
                    style={{ color: '#151e13' }}
                  >
                    {item.qty}
                  </span>

                  <button
                    onClick={() => updateQty(item.id, item.stock ? Math.min(item.stock, item.qty + 1) : item.qty + 1, item.item_type || 'product')}
                    disabled={item.stock && item.qty >= item.stock}
                    className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded transition-colors ${item.stock && item.qty >= item.stock ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:bg-[#e2e8e2]'}`}
                    style={{ color: item.stock && item.qty >= item.stock ? undefined : '#3d4943' }}
                    aria-label="Increase quantity"
                  >
                    <span className="material-symbols-outlined text-[14px] md:text-[16px]">add</span>
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id, item.item_type || 'product')}
                  className="p-2 cursor-pointer transition-colors hover:text-[#ba1a1a]"
                  style={{ color: '#6d7a73' }}
                  aria-label="Remove item"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}