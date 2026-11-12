'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ShoppingCart,
  Sprout,
  Tag,
  Package,
} from 'lucide-react'
import ProductCard from '@/app/components/ProductCard'

const FALLBACK_HERO = '/homepage/hero_basket.jpg'

function stripHtml(value) {
  if (!value || typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatValidTill(dateStr) {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null
  if (parsed.getTime() < Date.now()) {
    return { text: 'Offer Ended', expired: true }
  }
  return {
    text: parsed.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    expired: false,
  }
}

export default function OfferDetailClient({ offer }) {
  const [heroFailed, setHeroFailed] = useState(false)
  const heroSrc = heroFailed || !offer.image ? FALLBACK_HERO : offer.image
  const products = Array.isArray(offer.products) ? offer.products : []
  const validity = formatValidTill(offer.endDate)
  const cleanDesc =
    stripHtml(offer.description) ||
    'Enjoy a special discount on our fresh seasonal produce collection.'

  const scrollToProducts = () => {
    const el = document.getElementById('offer-products')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F0] flex flex-col">
      {/* ── Hero Banner ── */}
      <section className="relative w-full overflow-hidden bg-[#ECEEDB] border-b border-[#E2E5CF]">
        {/* Right Banner Visual */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[68%] pointer-events-none select-none">
          <Image
            src={heroSrc}
            alt={offer.title}
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 68vw"
            onError={() => setHeroFailed(true)}
            className="object-cover object-center md:object-right"
          />
          {/* Desktop gradient blend */}
          <div
            className="hidden md:block absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #ECEEDB 0%, #ECEEDB 24%, rgba(236,238,219,0.90) 43%, rgba(236,238,219,0.22) 64%, rgba(236,238,219,0) 78%)',
            }}
          />
          {/* Mobile gradient blend */}
          <div
            className="md:hidden absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(236,238,219,0.96) 0%, rgba(236,238,219,0.88) 62%, rgba(236,238,219,0.45) 100%)',
            }}
          />
        </div>

        {/* Left Content */}
        <div className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-14">
          <div className="max-w-[560px]">
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-2">
              <span className="h-[1px] w-7 bg-[#6E9381]" />
              <span className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-semibold tracking-[0.16em] text-[#355A4B] uppercase">
                <Sprout className="w-3.5 h-3.5 text-[#4B7F46]" strokeWidth={2.2} />
                <span>SPECIAL OFFER</span>
              </span>
              <span className="h-[1px] w-7 bg-[#6E9381]" />
            </div>

            {/* Title */}
            <h1
              className="text-[34px] sm:text-[42px] lg:text-[48px] font-bold text-[#084737] leading-[1.08] tracking-[-0.015em]"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              {offer.title}
            </h1>

            {/* Subtitle */}
            <p
              className="mt-2.5 text-[15.5px] sm:text-[17.5px] text-[#20493B] italic leading-[1.45] line-clamp-2"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              {cleanDesc}
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={scrollToProducts}
              className="mt-5 inline-flex items-center gap-2 bg-[#0B4635] hover:bg-[#073427] active:scale-[0.98] text-white text-[13.5px] font-semibold px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(8,71,55,0.22)] transition-all duration-300 cursor-pointer border-none"
            >
              <span>Shop the Offer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats & Back Navigation Strip ── */}
      <section className="w-full bg-[#FCFBF3] border-b border-[#EAE8D8]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
            {/* Products Count */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#EAF3E4] border border-[#DAE8D1] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-[#2C643C]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#667B70] leading-tight">Products</p>
                <p className="text-[13.5px] font-bold text-[#084737] leading-tight mt-0.5">
                  {products.length} {products.length === 1 ? 'Item' : 'Items'}
                </p>
              </div>
            </div>

            {validity && (
              <>
                <span className="h-7 w-px bg-[#E3E1D2]" aria-hidden="true" />
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#FDECEA] border border-[#F8D3CF] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-[#DC3838]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#667B70] leading-tight">
                      Offer valid till!
                    </p>
                    <p
                      className={`text-[13.5px] font-bold leading-tight mt-0.5 ${
                        validity.expired ? 'text-gray-500' : 'text-[#DC3838]'
                      }`}
                    >
                      {validity.text}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <Link
            href="/offers"
            className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#084737] hover:text-[#0B664C] transition-colors no-underline"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>All Offers</span>
          </Link>
        </div>
      </section>

      {/* ── Offer Products Grid ── */}
      <section
        id="offer-products"
        className="max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 flex-1"
      >
        {products.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
              <div>
                <h2
                  className="text-[26px] sm:text-[30px] font-bold text-[#084737] leading-tight"
                  style={{
                    fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  }}
                >
                  Offer Products
                </h2>
                <p className="text-[13.5px] text-[#52695D] mt-0.5">
                  Special prices available for a limited time only
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#FEF6E3] border border-[#F3DCAD] text-[#BA6914] px-4 py-1.5 rounded-full text-[12.5px] font-semibold w-fit shadow-xs">
                <Tag className="w-3.5 h-3.5 text-[#D97706] shrink-0" strokeWidth={2.2} />
                <span>Exclusive offer prices</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  showCartIcon
                />
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-[18px] border border-[#E5EDE2] shadow-[0_6px_24px_-8px_rgba(8,71,55,0.06)] p-12 sm:p-16 text-center max-w-lg mx-auto my-4">
            <div className="w-16 h-16 rounded-full bg-[#EAF3E5] text-[#084737] flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h3
              className="text-2xl font-bold text-[#084737] mb-2"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              No Products Yet
            </h3>
            <p className="text-sm text-[#455F53] mb-6">
              Products for this offer haven&apos;t been added yet. Check back soon!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#0B4635] hover:bg-[#073427] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors no-underline"
            >
              <span>Browse All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ── Bottom Explore More Offers CTA ── */}
      <section className="max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-[#EAF0DC] border border-[#DCE4C8] rounded-[16px] px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_18px_-6px_rgba(8,71,55,0.06)]">
          <div className="flex items-center gap-4 sm:gap-5">
            <Sprout className="w-7 h-7 text-[#084737] shrink-0" strokeWidth={1.9} />
            <span className="hidden sm:block h-10 w-px bg-[#D1DBBF]" aria-hidden="true" />
            <div>
              <h3
                className="text-[20px] sm:text-[22px] font-bold text-[#084737] leading-tight"
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                }}
              >
                Explore More Offers
              </h3>
              <p className="text-[13px] text-[#4C6558] mt-0.5">
                Discover other exciting deals and promotions available right now.
              </p>
            </div>
          </div>

          <Link
            href="/offers"
            className="inline-flex items-center gap-2 bg-[#0B4635] hover:bg-[#073427] text-white text-[13px] font-semibold px-6 py-3 rounded-full whitespace-nowrap shrink-0 shadow-sm transition-all no-underline"
          >
            <span>View All Offers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

