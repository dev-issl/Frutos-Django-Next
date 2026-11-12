'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/app/components/ProductCard'

const DESKTOP_PER_SLIDE = 4

export default function SeasonalEssentials({ products = [] }) {
  const [page, setPage] = useState(0)

  if (!products.length) return null

  const totalPages = Math.max(1, Math.ceil(products.length / DESKTOP_PER_SLIDE))
  const currentPage = page % totalPages

  const slides = Array.from({ length: totalPages }, (_, slideIdx) => {
    const start =
      slideIdx === totalPages - 1 && products.length >= DESKTOP_PER_SLIDE
        ? products.length - DESKTOP_PER_SLIDE
        : slideIdx * DESKTOP_PER_SLIDE
    return products.slice(start, start + DESKTOP_PER_SLIDE)
  })

  return (
    <section className="mt-12 sm:mt-14 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-7 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-[1px] w-10 bg-[#C2CBB9]" />
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#2A593C] uppercase">
            Wait, there&apos;s more
          </span>
          <span className="h-[1px] w-10 bg-[#C2CBB9]" />
        </div>

        <h2
          className="text-[28px] sm:text-[36px] font-bold text-[#142D1E] leading-tight"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          Seasonal Essentials
        </h2>
        <p
          className="text-[14px] sm:text-[14.5px] italic text-[#4D6254] mt-1 max-w-md px-2"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          Handpicked fresh arrivals you might have missed for your kitchen.
        </p>
      </div>

      {/* Smooth Horizontal Sliding Homepage ProductCard Track */}
      <div className="relative flex items-center gap-2.5 sm:gap-3.5">
        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
            aria-label="Previous seasonal products"
            className="hidden sm:flex w-10 h-10 rounded-full bg-white border border-[#DCE3D2] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer shrink-0 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 min-w-0 overflow-hidden py-2.5 -my-2.5 px-0.5 -mx-0.5">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none"
            style={{
              transform: `translate3d(-${currentPage * 100}%, 0, 0)`,
            }}
          >
            {slides.map((slideProducts, slideIdx) => {
              const isActiveSlide = slideIdx === currentPage
              return (
                <div
                  key={slideIdx}
                  aria-hidden={!isActiveSlide}
                  inert={!isActiveSlide ? true : undefined}
                  className="w-full shrink-0 grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 px-0.5"
                >
                  {slideProducts.map((product, cardIdx) => (
                    <ProductCard
                      key={`${slideIdx}-${product.id}`}
                      product={product}
                      index={slideIdx * DESKTOP_PER_SLIDE + cardIdx}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => (p + 1) % totalPages)}
            aria-label="Next seasonal products"
            className="hidden sm:flex w-10 h-10 rounded-full bg-white border border-[#DCE3D2] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer shrink-0 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pagination Dots + Mobile Prev/Next Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
            aria-label="Previous seasonal products"
            className="flex sm:hidden w-8 h-8 rounded-full bg-white border border-[#DCE3D2] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPage(idx)}
                aria-label={`Seasonal essentials page ${idx + 1}`}
                className="h-2 rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  width: idx === currentPage ? '18px' : '8px',
                  background: idx === currentPage ? '#2B6947' : '#CBD6C4',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => (p + 1) % totalPages)}
            aria-label="Next seasonal products"
            className="flex sm:hidden w-8 h-8 rounded-full bg-white border border-[#DCE3D2] items-center justify-center text-[#1B422B] hover:bg-[#ECF2E4] active:scale-95 cursor-pointer transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  )
}
