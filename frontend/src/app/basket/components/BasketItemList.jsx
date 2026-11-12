'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, Star, ShoppingBag } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

function resolveItemImage(item) {
  const mediaBase = API_BASE.replace('/api', '')
  let src = item.image || item.thumbnail || item.image_url || null
  if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
    src = `${mediaBase}/${src.replace(/^\/+/, '')}`
  }
  return src
}

export default function BasketItemList({ items, updateQty, removeItem }) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const effectivePrice = Number(item.effectivePrice ?? item.price ?? 0)
        const basePrice = Number(item.oldPrice || item.price || 0)
        const hasSavings = basePrice > effectivePrice
        const savePercent = hasSavings ? Math.round((1 - effectivePrice / basePrice) * 100) : 0
        const isWholesaleItem = Boolean(item.effectivePrice && item.effectivePrice !== item.price)

        const rawMinQty = parseInt(item.minimum_purchase, 10) || parseInt(item.minWholesaleQty, 10) || 1
        const isUnlimited = Boolean(
          item.is_unlimited_stock ||
            item.isUnlimitedStock ||
            item.is_unlimited_wholesale_stock ||
            item.is_unlimited_restaurant_stock
        )
        const stock = isUnlimited
          ? Infinity
          : item.stock !== undefined && item.stock !== null
            ? Number(item.stock)
            : item.wholesale_stock !== undefined && item.wholesale_stock !== null
              ? Number(item.wholesale_stock)
              : item.restaurant_stock !== undefined && item.restaurant_stock !== null
                ? Number(item.restaurant_stock)
                : Infinity
        const maxStock = isUnlimited ? Infinity : stock !== null && !isNaN(stock) ? stock : Infinity
        const minQty = maxStock > 0 && maxStock < Infinity ? Math.max(1, Math.min(rawMinQty, maxStock)) : rawMinQty
        const belowMinQty = item.qty < minQty
        const imageUrl = resolveItemImage(item)
        const cleanOrigin = item.origin?.replace(/^from\s+/i, '')
        const rating = item.rating ? Number(item.rating).toFixed(1) : '4.9'
        const reviewsCount = item.reviews || item.review_count || 0
        const productHref = item.slug ? `/products/${item.slug}` : '/shop'

        return (
          <div
            key={`${item.id}-${item.item_type || 'product'}`}
            className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-[18px] bg-white border border-[#E5EAE0] transition-colors duration-200 hover:border-[#CFD8C7]"
          >
            {/* Clean Product Thumbnail */}
            <Link
              href={productHref}
              className="relative w-full sm:w-[126px] md:w-[132px] h-[150px] sm:h-[94px] rounded-[14px] overflow-hidden flex-shrink-0 bg-[#F7F6F0] border border-[#ECEFE7] block group"
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.name}
                  fill
                  unoptimized={imageUrl.startsWith('http')}
                  sizes="(max-width: 640px) 100vw, 140px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#9AA89F]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
              )}
            </Link>

            {/* Middle Product Details */}
            <div className="flex-1 min-w-0">
              <Link href={productHref} className="hover:underline">
                <h3
                  className="text-[19px] sm:text-[21px] font-bold leading-snug truncate"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#14261B' }}
                >
                  {item.name}
                </h3>
              </Link>

              {cleanOrigin && (
                <p
                  className="text-[13px] italic mt-0.5 truncate"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#2B6947' }}
                >
                  Fresh from {cleanOrigin}
                </p>
              )}

              {/* Stars + Reviews */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3.5 h-3.5"
                      fill={star <= Math.round(Number(rating)) ? '#E0A326' : '#E3E7DE'}
                      stroke="none"
                    />
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-[#3C4E42]">
                  {rating}
                  {reviewsCount > 0 ? ` (${reviewsCount.toLocaleString()} reviews)` : ''}
                </span>
              </div>

              {/* Price + Discount Row */}
              <div className="flex items-center gap-2 sm:gap-2.5 mt-2 flex-wrap tabular-nums">
                <span
                  className="text-[20px] sm:text-[22px] font-bold leading-none"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#0E4228' }}
                >
                  €{(effectivePrice * item.qty).toFixed(2)}
                </span>

                {hasSavings && (
                  <>
                    <span className="text-[13px] sm:text-[13.5px] text-[#98A49B] line-through">
                      €{(basePrice * item.qty).toFixed(2)}
                    </span>
                    {savePercent > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCEFD3] text-[#1A5D38]">
                        Save {savePercent}%
                      </span>
                    )}
                  </>
                )}

                {isWholesaleItem && (
                  <span className="text-[11px] font-semibold text-[#6D28D9] bg-[#F3EFFE] px-2 py-0.5 rounded-full">
                    €{effectivePrice.toFixed(2)} / unit
                  </span>
                )}

                {belowMinQty && (
                  <span className="text-[11px] font-bold text-[#BA1A1A] bg-[#FDECEC] px-2.5 py-0.5 rounded-full">
                    Min. {minQty} needed
                  </span>
                )}
              </div>
            </div>

            {/* Right Qty Stepper + Remove */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#EEF2E8] shrink-0">
              <div className="inline-flex items-center rounded-full bg-[#F3F2E9] border border-[#E3E6D8] px-1.5 py-1">
                <button
                  type="button"
                  onClick={() =>
                    updateQty(item.id, Math.max(minQty, item.qty - 1), item.item_type || 'product')
                  }
                  disabled={item.qty <= minQty}
                  aria-label="Decrease quantity"
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    item.qty <= minQty
                      ? 'text-[#B2BCB5] cursor-not-allowed'
                      : 'cursor-pointer text-[#1F3A2A] hover:bg-[#E4E8D8] active:scale-95'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="w-8 text-center font-bold text-[14px] text-[#14261B] tabular-nums">
                  {item.qty}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateQty(
                      item.id,
                      maxStock < Infinity ? Math.min(maxStock, item.qty + 1) : item.qty + 1,
                      item.item_type || 'product'
                    )
                  }
                  disabled={maxStock < Infinity && item.qty >= maxStock}
                  aria-label="Increase quantity"
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    maxStock < Infinity && item.qty >= maxStock
                      ? 'text-[#B2BCB5] cursor-not-allowed'
                      : 'cursor-pointer text-[#1F3A2A] hover:bg-[#E4E8D8] active:scale-95'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id, item.item_type || 'product')}
                aria-label="Remove item"
                className="w-10 h-10 rounded-full border border-[#DFE4D7] bg-white flex items-center justify-center text-[#5A6B60] hover:text-[#BA1A1A] hover:border-[#E5B8B8] active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-[17px] h-[17px]" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
