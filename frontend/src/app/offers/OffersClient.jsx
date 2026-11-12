'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Calendar,
  Clock,
  Zap,
  Leaf,
  Truck,
  ShieldCheck,
  Headphones,
  Tag,
} from 'lucide-react'
import ScallopBadge from '@/app/components/ScallopBadge'
import { getOfferDiscountBadge } from '@/lib/api_product'

const FALLBACK_OFFER_IMAGES = [
  '/homepage/offer_card_1.jpg',
  '/homepage/offer_card_2.jpg',
  '/homepage/offer_card_3.jpg',
]

function stripHtml(value) {
  if (!value || typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatValidDate(dateStr) {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HeroShopButton({ targetId = 'offers-grid', label = 'Shop the Offers' }) {
  const handleClick = () => {
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-5 inline-flex items-center gap-2 bg-[#0B4635] hover:bg-[#073427] active:scale-[0.98] text-white text-[13.5px] font-semibold px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(8,71,55,0.22)] transition-all duration-300 cursor-pointer border-none"
    >
      <span>{label}</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  )
}

function OfferCard({ offer, index }) {
  const fallbackImg = FALLBACK_OFFER_IMAGES[index % FALLBACK_OFFER_IMAGES.length]
  const [imgFailed, setImgFailed] = useState(false)
  const imgSrc = imgFailed || !offer.image ? fallbackImg : offer.image

  const badgeInfo = getOfferDiscountBadge(offer)
  const validTill = formatValidDate(offer.endDate)
  const cleanDescription =
    stripHtml(offer.description) ||
    'Enjoy special prices on our hand-picked seasonal produce collection.'

  const isEven = index % 2 === 0
  const TimeIcon = isEven ? Clock : Zap

  return (
    <Link
      href={`/offers/${offer.slug}`}
      className="group relative overflow-hidden rounded-[18px] bg-white border border-[#E5EDE2] p-4 sm:p-5 shadow-[0_6px_24px_-8px_rgba(8,71,55,0.08)] hover:shadow-[0_16px_36px_-10px_rgba(8,71,55,0.16)] hover:border-[#BDD6C2] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col no-underline"
      style={{ textDecoration: 'none' }}
    >
      {/* Subtle botanical wave watermark in bottom-right corner */}
      <svg
        viewBox="0 0 220 120"
        className="pointer-events-none select-none absolute bottom-0 right-0 w-44 h-24 opacity-60"
        aria-hidden="true"
      >
        <path
          d="M220 120 L220 20 C175 28 155 68 110 74 C68 80 42 96 18 120 Z"
          fill="#F0F6EC"
        />
      </svg>

      {/* Top-right dynamic scalloped discount badge */}
      <div className="absolute top-3 right-3 z-20 transition-transform duration-300 group-hover:scale-105">
        <ScallopBadge
          prefix={badgeInfo.prefix}
          percentage={badgeInfo.percentage}
          suffix="OFF"
          hasDiscount={badgeInfo.hasDiscount}
          variant={isEven ? 'red' : 'green'}
        />
      </div>

      {/* Top-left status pill */}
      <div className="relative z-10 flex items-center">
        <span className="inline-flex items-center gap-1.5 bg-[#EAF3E5] text-[#1D4E38] border border-[#D8E8D0] rounded-full px-3 py-1 text-[11.5px] font-semibold leading-none">
          <TimeIcon className="w-3.5 h-3.5 text-[#2D6E35] shrink-0" strokeWidth={2.2} />
          <span>{offer.endDate ? 'Limited Time' : 'Special Offer'}</span>
        </span>
      </div>

      {/* Horizontal Card Body: Left image + Right content */}
      <div className="relative z-10 mt-3 flex flex-col sm:flex-row items-stretch gap-3.5 sm:gap-4 flex-1">
        {/* Left Thumbnail */}
        <div className="relative w-full sm:w-[43%] aspect-[4/3] sm:aspect-auto sm:min-h-[138px] rounded-[12px] overflow-hidden bg-[#F4F8F2] border border-[#E7EFE4] shrink-0">
          <Image
            src={imgSrc}
            alt={offer.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 28vw, 18vw"
            onError={() => setImgFailed(true)}
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>

        {/* Right Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h2
              className="text-[18px] sm:text-[19px] font-bold text-[#084737] group-hover:text-[#0B664C] leading-[1.2] line-clamp-2 pr-12 sm:pr-14 transition-colors"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              {offer.title}
            </h2>

            <p className="text-[12.5px] text-[#455F53] leading-[1.45] line-clamp-2 mt-1.5">
              {cleanDescription}
            </p>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#2E5241]">
              <Calendar className="w-3.5 h-3.5 text-[#35634C] shrink-0" strokeWidth={2} />
              <span>
                {validTill ? `Valid till: ${validTill}` : 'Available while stocks last'}
              </span>
            </div>

            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1.5 bg-[#0E4A36] group-hover:bg-[#083828] text-white text-[12px] font-semibold px-4 py-2 rounded-full shadow-sm transition-all duration-300">
                <span>View Offer</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

const TRUST_FEATURES = [
  {
    icon: Leaf,
    title: 'Fresh & Organic',
    subtitle: '100% natural products',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    subtitle: 'Within 24–48 hours',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    subtitle: 'Your data is safe',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    subtitle: "We're here to help",
  },
]

export default function OffersClient({ offers = [], heroMaxDiscount = 50 }) {
  return (
    <div className="min-h-screen bg-[#FAF9F0] flex flex-col">
      {/* ── Top Hero Banner ── */}
      <section className="relative w-full overflow-hidden bg-[#ECEEDB] border-b border-[#E2E5CF]">
        {/* Right Basket Artwork */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[68%] pointer-events-none select-none">
          <Image
            src="/homepage/hero_basket.jpg"
            alt="Fresh organic produce basket"
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 68vw"
            className="object-cover object-right"
          />
          {/* Desktop smooth fade from cream left to crisp photo right */}
          <div
            className="hidden md:block absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #ECEEDB 0%, #ECEEDB 24%, rgba(236,238,219,0.88) 42%, rgba(236,238,219,0.22) 62%, rgba(236,238,219,0) 76%)',
            }}
          />
          {/* Mobile readability mask */}
          <div
            className="md:hidden absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(236,238,219,0.96) 0%, rgba(236,238,219,0.88) 60%, rgba(236,238,219,0.45) 100%)',
            }}
          />
        </div>

        {/* Hero Inner Container */}
        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-11 md:py-13 flex items-center justify-between gap-6">
          <div className="max-w-[530px]">
            {/* Eyebrow with flanking lines */}
            <div className="flex items-center gap-2.5 mb-2">
              <span className="h-[1px] w-7 bg-[#6E9381]" />
              <span className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.16em] text-[#355A4B] uppercase">
                SPECIAL DEALS JUST FOR YOU
              </span>
              <span className="h-[1px] w-7 bg-[#6E9381]" />
            </div>

            <h1
              className="text-[34px] sm:text-[44px] lg:text-[50px] font-bold text-[#084737] leading-[1.08] tracking-[-0.015em]"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              Exclusive Offers
            </h1>

            <p
              className="mt-2.5 text-[15.5px] sm:text-[17.5px] text-[#20493B] italic leading-[1.45]"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              Discover our hand-picked selection of premium deals and limited-time discounts
              designed just for you.
            </p>

            <HeroShopButton targetId="offers-grid" label="Shop the Offers" />
          </div>

          {/* Right Scalloped "Up to XX% OFF" Seal */}
          <div className="hidden sm:flex items-center justify-end pr-1 lg:pr-4 shrink-0">
            <ScallopBadge
              variant="hero"
              prefix="Up to"
              percentage={heroMaxDiscount}
              suffix="OFF"
              hasDiscount={true}
            />
          </div>
        </div>
      </section>

      {/* ── Offers Grid (3 cards per row on desktop) ── */}
      <section
        id="offers-grid"
        className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-10 flex-1"
      >
        {offers.length === 0 ? (
          <div className="bg-white rounded-[18px] border border-[#E5EDE2] shadow-[0_6px_24px_-8px_rgba(8,71,55,0.06)] p-12 sm:p-16 text-center max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-full bg-[#EAF3E5] text-[#084737] flex items-center justify-center mx-auto mb-4">
              <Tag className="w-7 h-7" />
            </div>
            <h2
              className="text-2xl font-bold text-[#084737] mb-2"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              No active offers right now
            </h2>
            <p className="text-sm text-[#455F53] mb-6">
              Check back soon for fresh seasonal discounts and exclusive bundle deals!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#0B4635] hover:bg-[#073427] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors no-underline"
            >
              <span>Browse Fresh Produce</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {offers.map((offer, index) => (
              <OfferCard key={offer.id || index} offer={offer} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* ── Bottom Trust Strip ── */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-[#EEF0DC] border border-[#E1E5CC] rounded-[16px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DCE0C4] shadow-[0_4px_18px_-6px_rgba(8,71,55,0.06)]">
          {TRUST_FEATURES.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="flex items-center justify-start sm:justify-center gap-3.5 px-6 py-4 sm:py-5"
              >
                <div className="w-10 h-10 rounded-full bg-[#E3E7CE]/80 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#084737]" strokeWidth={2} />
                </div>
                <div>
                  <p
                    className="text-[15.5px] font-bold text-[#084737] leading-tight"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    {feat.title}
                  </p>
                  <p
                    className="text-[12.5px] italic text-[#436052] leading-tight mt-0.5"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    {feat.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

