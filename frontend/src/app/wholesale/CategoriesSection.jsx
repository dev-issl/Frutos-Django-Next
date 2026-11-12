'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/app/components/ProductCard'
import WholesaleSectionHeader from './WholesaleSectionHeader'

const CATEGORY_FALLBACK_IMAGES = [
  '/wholesale/cat-produce.webp',
  '/wholesale/cat-greens.webp',
  '/wholesale/cat-berries.webp',
  '/wholesale/cat-citrus.webp',
  '/wholesale/cat-roots.webp',
]

function isMissingImage(src) {
  return !src || typeof src !== 'string' || src.includes('placehold.co')
}

function FallbackCategoryCard({ item, index }) {
  const [imgFailed, setImgFailed] = useState(false)
  const fallbackSrc = CATEGORY_FALLBACK_IMAGES[index % CATEGORY_FALLBACK_IMAGES.length]
  const useFallback = imgFailed || isMissingImage(item?.image_url)
  const imgSrc = useFallback ? fallbackSrc : item.image_url

  return (
    <Link
      href={item.href || '/shop'}
      className="group bg-[#FAFBF7] rounded-[16px] ws-card-shadow border border-transparent hover:border-[#CBE0C5] transition-colors overflow-hidden flex flex-col no-underline"
    >
      <div className="relative w-full aspect-[144/88] bg-[#FAFBF7] overflow-hidden">
        <Image
          src={imgSrc}
          alt={item.title || 'Category'}
          fill
          decoding="async"
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onError={() => setImgFailed(true)}
          className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-4"
          style={{
            background: 'linear-gradient(180deg, rgba(250,251,247,0) 0%, #FAFBF7 100%)',
          }}
        />
      </div>

      <div className="px-3.5 py-2.5 sm:py-3 bg-[#FAFBF7] flex items-center justify-between gap-2 flex-1">
        <h3 className="text-[13px] font-medium text-[#163B28] leading-tight truncate group-hover:text-[#0C462B] transition-colors">
          {item.title}
        </h3>
        <span
          aria-hidden="true"
          className="w-[26px] h-[26px] rounded-full bg-[#E6EFE2] text-[#286144] group-hover:bg-[#0C462B] group-hover:text-white transition-colors flex items-center justify-center shrink-0"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <path
              d="M3.5 8h9m0 0L9.2 4.8M12.5 8 9.2 11.2"
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  )
}

export default function CategoriesSection({ products = [], data = [] }) {
  const [notified, setNotified] = useState({})
  const hasLiveProducts = Array.isArray(products) && products.length > 0
  const items = hasLiveProducts ? products : data.length > 0 ? data : []

  return (
    <section className="relative pt-6 sm:pt-8 pb-9 sm:pb-11 overflow-hidden">
      {/* Organic pale-sage curve peeking gently at upper-left behind OUR PRODUCTS */}
      <svg
        aria-hidden="true"
        viewBox="0 0 360 180"
        fill="none"
        className="pointer-events-none select-none hidden md:block absolute -left-8 -top-4 w-[280px] lg:w-[330px] h-[160px] z-0"
      >
        <defs>
          <linearGradient id="wsProductsWaveGrad" x1="0%" y1="0%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#BFD5B3" stopOpacity="0.68" />
            <stop offset="65%" stopColor="#D7E6CE" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#F4F5EC" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,0 L260,0 C205,48 165,105 90,138 C46,158 15,165 0,168 Z"
          fill="url(#wsProductsWaveGrad)"
        />
      </svg>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 sm:mb-7">
          <WholesaleSectionHeader
            eyebrow="OUR PRODUCTS"
            title="What we supply"
            align="left"
            className="mb-0"
          />

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#15412C] hover:text-[#0B2D1D] transition-colors pb-1"
          >
            <span>View All Products</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {hasLiveProducts
            ? items.map((product, i) => (
                <ProductCard
                  key={product.id || product.slug || i}
                  product={product}
                  index={i}
                  variant="showcase"
                  notified={!!notified[product.id]}
                  onNotify={() =>
                    setNotified((prev) => ({ ...prev, [product.id]: true }))
                  }
                />
              ))
            : items.map((item, i) => (
                <FallbackCategoryCard key={i} item={item} index={i} />
              ))}
        </div>
      </div>
    </section>
  )
}
