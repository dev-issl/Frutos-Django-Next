'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Leaf, Star } from 'lucide-react'
import { slugify } from '@/app/lib/slugify'
import { isOfferValid, getOfferMaxDiscount } from '@/lib/api_product'

const STUDIO_PRODUCT_FALLBACKS = [
  '/homepage/prod_tomato.webp',
  '/homepage/prod_apple.jpg',
  '/homepage/prod_orange.jpg',
  '/homepage/cat_card_vegetables.webp',
  '/homepage/prod_mango.jpg',
  '/homepage/prod_grapes.jpg',
]

function TrophyBadgeIcon() {
  return (
    <svg viewBox="0 0 36 36" className="w-8 h-8 text-[#F4BD39]" fill="currentColor" aria-hidden="true">
      <path d="M10 6h16v6c0 5-3.4 9.1-8 9.9-4.6-.8-8-4.9-8-9.9V6Z" />
      <path
        d="M10 8H6.5a2.5 2.5 0 0 0-2.5 2.5v1.2C4 14.5 6.3 16.5 9.2 16.5H10M26 8h3.5a2.5 2.5 0 0 1 2.5 2.5v1.2c0 2.8-2.3 4.8-5.2 4.8H26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <rect x="16" y="21" width="4" height="5" />
      <rect x="11.5" y="26" width="13" height="3.5" rx="1.5" />
    </svg>
  )
}

function NewSealIcon() {
  return (
    <div
      className="relative inline-flex items-center justify-center w-9 h-9 text-[#0A4126]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="w-full h-full text-[#F4BD39]" fill="currentColor">
        <path d="M20 2.2 23.7 6l5-.9 1.6 4.8 4.8 1.6-.9 5L37.8 20l-3.6 3.7.9 5-4.8 1.6-1.6 4.8-5-.9L20 37.8 16.3 34l-5 .9-1.6-4.8-4.8-1.6.9-5L2.2 20l3.6-3.7-.9-5 4.8-1.6 1.6-4.8 5 .9L20 2.2Z" />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold italic tracking-tight"
        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
      >
        New
      </span>
    </div>
  )
}

function resolveProductThumb(product, idx) {
  const img = product?.image || product?.thumbnail || product?.thumbnail_url || ''
  const isPlaceholder =
    !img ||
    img.includes('placehold.co') ||
    /\/media\/products\/thumbnails\/(test\.jpg|product_\d+\.png|sdfdsgfsgsdfg\.PNG)$/i.test(img)
  return isPlaceholder ? STUDIO_PRODUCT_FALLBACKS[idx % STUDIO_PRODUCT_FALLBACKS.length] : img
}

function SpotlightProductMiniCard({ product, index }) {
  const fallbackImg = STUDIO_PRODUCT_FALLBACKS[index % STUDIO_PRODUCT_FALLBACKS.length]
  const [imgFailed, setImgFailed] = useState(false)
  const initialImg = resolveProductThumb(product, index)
  const imgSrc = imgFailed ? fallbackImg : initialImg

  const slug = product?.slug || slugify(product?.name || 'product')
  const title = product?.name || 'Fresh Produce'
  const rawPrice = Number(product?.wholesalePrice || product?.price || 1.5)
  const unitLabel = (product?.wholesaleUnit || product?.unit || 'kg')
    .replace(/^\s*(per\s+|\/\s*)/i, '')
    .trim() || 'kg'
  const ratingVal =
    typeof product?.rating === 'number' && product.rating > 0
      ? product.rating.toFixed(1)
      : (4.8 - (index % 2) * 0.1).toFixed(1)

  return (
    <Link
      href={`/products/${slug}`}
      className="group/item flex flex-col items-center justify-between px-2.5 sm:px-3 py-4 text-center bg-white hover:bg-[#F7FBF6] transition-colors no-underline min-w-0"
    >
      <div className="relative w-[82px] h-[68px] sm:w-[92px] sm:h-[76px] mx-auto rounded-[10px] overflow-hidden bg-[#F4F8F2] border border-[#E7EFE4] shrink-0">
        <Image
          src={imgSrc}
          alt={title}
          fill
          unoptimized
          decoding="async"
          sizes="(max-width: 640px) 82px, 92px"
          onError={() => setImgFailed(true)}
          className="object-cover object-center transform-gpu transition-transform duration-300 group-hover/item:scale-[1.06]"
        />
      </div>

      <div className="w-full min-w-0 mt-2">
        <p className="text-[12.5px] sm:text-[13px] font-semibold text-[#113D26] truncate leading-tight">
          {title}
        </p>
        <p className="text-[11px] sm:text-[11.5px] text-[#456352] font-medium mt-0.5 tabular-nums truncate">
          &euro;{rawPrice.toFixed(2)}/{unitLabel}
        </p>
        <div className="mt-1 inline-flex items-center justify-center gap-1 text-[11px] sm:text-[11.5px] font-semibold text-[#113D26] tabular-nums">
          <Star className="w-3 h-3 text-[#EEB028] fill-[#EEB028] shrink-0" />
          <span>{ratingVal}</span>
        </div>
      </div>
    </Link>
  )
}

function PromoFeatureCard({ promo }) {
  const [imgFailed, setImgFailed] = useState(false)
  const theme = promo?.theme || 'sage'

  const themeConfig = {
    sage: {
      bg: 'linear-gradient(125deg, #D5E8C8 0%, #E7F2DB 52%, #F4F9EE 100%)',
      border: '#D5E4C9',
      badgeClass: 'bg-[#4B8B46] text-white',
      titleColor: '#0F3C25',
      subColor: '#2E4C3B',
      ctaClass: 'bg-[#0B462B] hover:bg-[#07331F] text-white',
      sealClass: 'bg-[#0E4326] text-white',
      fallbackImg: '/homepage/collections/promo_bundles.webp',
    },
    cream: {
      bg: 'linear-gradient(125deg, #FAF1CB 0%, #FDF7DE 54%, #FFFDF5 100%)',
      border: '#EFE5BE',
      badgeClass: 'bg-[#DFAD26] text-white',
      titleColor: '#0F3C25',
      subColor: '#3D4B37',
      ctaClass: 'bg-[#0B462B] hover:bg-[#07331F] text-white',
      sealClass: 'bg-[#0E4326] text-white',
      fallbackImg: '/homepage/collections/promo_offers.webp',
    },
    dark_green: {
      bg: 'linear-gradient(125deg, #073820 0%, #0E4A2C 56%, #1A5D36 100%)',
      border: '#155231',
      badgeClass: 'bg-transparent text-[#8ED15E] px-0 py-0',
      titleColor: '#FFFFFF',
      subColor: 'rgba(255,255,255,0.88)',
      ctaClass: 'bg-[#FAF9F0] hover:bg-white text-[#0B4328]',
      sealClass: 'bg-[#0A3E23]/95 text-white border border-white/35',
      fallbackImg: '/homepage/collections/promo_leftover.webp',
    },
    warm_cream: {
      bg: 'linear-gradient(125deg, #F7F2DF 0%, #FAF7EA 52%, #EAEAD7 100%)',
      border: '#E8E2C8',
      badgeClass: '',
      titleColor: '#0F3C25',
      subColor: '#3B5343',
      ctaClass:
        'border border-[#2A593E] bg-[#FCFBF4]/85 hover:bg-white text-[#0E3B27]',
      sealClass: 'bg-[#0E4326] text-white',
      fallbackImg: '/homepage/collections/promo_farmers.webp',
    },
  }[theme] || {
    bg: 'linear-gradient(125deg, #D5E8C8 0%, #E7F2DB 52%, #F4F9EE 100%)',
    border: '#D5E4C9',
    badgeClass: 'bg-[#4B8B46] text-white',
    titleColor: '#0F3C25',
    subColor: '#2E4C3B',
    ctaClass: 'bg-[#0B462B] hover:bg-[#07331F] text-white',
    sealClass: 'bg-[#0E4326] text-white',
    fallbackImg: '/homepage/collections/promo_bundles.webp',
  }

  const imgSrc = imgFailed || !promo?.image_url ? themeConfig.fallbackImg : promo.image_url
  const sealParts = (promo?.discount_label || '').split('|').map((s) => s.trim()).filter(Boolean)
  const needsLeftFeatherMask = Boolean(promo?.isDynamicOfferImage)

  return (
    <Link
      href={promo?.cta_href || '/shop'}
      className="group relative rounded-[18px] overflow-hidden min-h-[205px] sm:min-h-[224px] flex items-center border shadow-[0_6px_20px_-6px_rgba(12,68,41,0.1)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-8px_rgba(12,68,41,0.15)] transition-all duration-300 no-underline"
      style={{ background: themeConfig.bg, borderColor: themeConfig.border }}
    >
      {/* Right Visual Layer */}
      <div
        className={`pointer-events-none select-none absolute right-0 bottom-0 ${
          theme === 'warm_cream' || needsLeftFeatherMask ? 'top-0 w-[58%] sm:w-[55%]' : 'h-[88%] sm:h-[92%] w-[56%] sm:w-[54%]'
        } overflow-hidden`}
        style={
          needsLeftFeatherMask
            ? {
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.72) 28%, black 55%)',
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.72) 28%, black 55%)',
              }
            : undefined
        }
      >
        <Image
          src={imgSrc}
          alt={promo?.title || 'Promotion'}
          fill
          unoptimized
          decoding="async"
          sizes="(max-width: 1024px) 55vw, 340px"
          onError={() => setImgFailed(true)}
          className={`object-cover ${theme === 'warm_cream' ? 'object-top' : 'object-center'
            } transform-gpu transition-transform duration-500 group-hover:scale-[1.04]`}
        />
      </div>

      {/* Discount Circular Seal */}
      {sealParts.length > 0 && (
        <div
          className={`absolute top-3.5 right-4 sm:top-4 sm:right-5 z-20 w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full shadow-md flex flex-col items-center justify-center text-center leading-none ${themeConfig.sealClass}`}
        >
          {sealParts.length === 3 ? (
            <>
              <span className="text-[10px] font-medium opacity-90">{sealParts[0]}</span>
              <span className="text-[18px] sm:text-[20px] font-extrabold tracking-tight my-0.5">
                {sealParts[1]}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{sealParts[2]}</span>
            </>
          ) : (
            <span className="text-[12px] font-bold px-2">{promo.discount_label}</span>
          )}
        </div>
      )}

      {/* Left Content Column */}
      <div className="relative z-10 max-w-[60%] sm:max-w-[54%] p-5 sm:p-7 flex flex-col items-start">
        {promo?.badge_style === 'leaf' && (
          <Leaf className="w-5 h-5 text-[#8ED15E] mb-2" strokeWidth={2} />
        )}
        {promo?.badge_text && (
          <span
            className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold leading-none mb-2.5 ${themeConfig.badgeClass}`}
          >
            {promo.badge_text}
          </span>
        )}

        <h3
          className="text-[22px] sm:text-[26px] font-bold leading-[1.12] tracking-tight"
          style={{
            fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
            color: themeConfig.titleColor,
          }}
        >
          {promo?.title}
        </h3>

        {promo?.subtitle && (
          <p
            className="text-[12.5px] sm:text-[13px] leading-snug mt-1.5 line-clamp-2"
            style={{ color: themeConfig.subColor }}
          >
            {promo.subtitle}
          </p>
        )}

        <span
          className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200 group-hover:translate-x-0.5 whitespace-nowrap ${themeConfig.ctaClass}`}
        >
          <span>{promo?.cta_text || 'Explore'}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  )
}

function stripPromoHtml(value) {
  if (!value || typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function FeaturedCollectionsSection({
  config = {},
  products = [],
  offers = [],
  leftoverPacks = [],
}) {
  const validOffer = Array.isArray(offers) ? offers.find((o) => isOfferValid(o)) : null
  const fallbackActiveOffer = Array.isArray(offers)
    ? offers.find((o) => o && o.isActive !== false && o.slug)
    : null
  const latestOffer = validOffer || fallbackActiveOffer

  const activeLeftoverPacks = Array.isArray(leftoverPacks)
    ? leftoverPacks.filter((lp) => lp && lp.is_active !== false)
    : []
  const latestLeftoverPack =
    activeLeftoverPacks.find((lp) => Number(lp.stock || 0) > 0) ||
    activeLeftoverPacks[0] ||
    null

  const basePromos = Array.isArray(config?.promos) ? config.promos : []
  const promos = basePromos.map((p, idx) => {
    if ((p.id === 'offers' || idx === 1) && latestOffer?.slug) {
      const maxPct = getOfferMaxDiscount(latestOffer)
      const offerDesc = stripPromoHtml(latestOffer.description)
      return {
        ...p,
        title: latestOffer.title || p.title,
        subtitle:
          offerDesc ||
          (maxPct > 0
            ? `Up to ${maxPct}% OFF on ${latestOffer.title}!`
            : `Latest deals on ${latestOffer.title}`),
        discount_label: maxPct > 0 ? `Up to|${maxPct}%|OFF` : p.discount_label,
        cta_href: `/offers/${latestOffer.slug}`,
        image_url: latestOffer.image || p.image_url,
        isDynamicOfferImage: Boolean(latestOffer.image),
      }
    }
    if ((p.id === 'leftover' || idx === 2) && latestLeftoverPack) {
      const pct = Math.round(Number(latestLeftoverPack.discount_percentage || 0))
      const packDesc = stripPromoHtml(latestLeftoverPack.description)
      const weightLabel = latestLeftoverPack.weight_quantity
        ? `${latestLeftoverPack.weight_quantity} • `
        : ''
      const priceLabel =
        latestLeftoverPack.price != null
          ? `€${Number(latestLeftoverPack.price).toFixed(2)}`
          : ''
      return {
        ...p,
        badge_text: p.badge_text || 'Leftover Pack',
        title: latestLeftoverPack.name || p.title,
        subtitle:
          packDesc ||
          (priceLabel
            ? `${weightLabel}${priceLabel} — Great quality, greater value!`
            : p.subtitle),
        discount_label: pct > 0 ? `Up to|${pct}%|OFF` : p.discount_label,
        cta_href: latestLeftoverPack.store_slug
          ? `/stores/${latestLeftoverPack.store_slug}`
          : '/stores',
        image_url: latestLeftoverPack.image || p.image_url,
        isDynamicOfferImage: Boolean(latestLeftoverPack.image),
      }
    }
    return p
  })

  const list = Array.isArray(products) ? products.filter((p) => p && p.isActive !== false) : []
  let bestSellerProducts = []
  let newArrivalProducts = []
  if (list.length > 0) {
    const productMap = new Map(list.map((p) => [p.slug, p]))
    const pickBySlugs = (slugs) => {
      if (!Array.isArray(slugs) || slugs.length === 0) return []
      return slugs.map((s) => productMap.get(s)).filter(Boolean).slice(0, 3)
    }

    bestSellerProducts = pickBySlugs(config?.best_sellers?.product_slugs)
    if (bestSellerProducts.length === 0) {
      const ordered = list.filter((p) => (p.orderCount || 0) > 0)
      const pool = ordered.length > 0 ? ordered : list
      bestSellerProducts = [...pool]
        .sort((a, b) => {
          const diff = (b.orderCount || 0) - (a.orderCount || 0)
          if (diff !== 0) return diff
          return Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)
        })
        .slice(0, 3)
    }

    newArrivalProducts = pickBySlugs(config?.new_arrivals?.product_slugs)
    if (newArrivalProducts.length === 0) {
      newArrivalProducts = [...list]
        .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
        .slice(0, 3)
    }
  }

  const bestCfg = config?.best_sellers || {}
  const arrivalCfg = config?.new_arrivals || {}

  return (
    <section
      className="pt-8 sm:pt-11 pb-8 sm:pb-10"
      style={{ backgroundColor: '#EFF9F2' }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row */}
        <div className="text-center mb-6 sm:mb-7">
          <div className="inline-flex items-center justify-center gap-3 mb-1.5">
            <span className="h-[1px] w-10 bg-[#C7D2B3]" />
            <span className="uppercase font-bold tracking-[0.16em] text-[10.5px] sm:text-[11px] text-[#1A3E2A]">
              {config?.eyebrow || 'FEATURED COLLECTIONS'}
            </span>
            <span className="h-[1px] w-10 bg-[#C7D2B3]" />
          </div>

          <h2
            className="text-[clamp(1.65rem,2.6vw,2.2rem)] font-bold text-[#0E3B27] leading-[1.12]"
            style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
          >
            {config?.heading || 'Curated for a Healthier You'}
          </h2>

          {config?.subtitle && (
            <p className="text-[13px] sm:text-[14px] text-[#3E574A] mt-1">
              {config.subtitle}
            </p>
          )}
        </div>

        {/* Row 1: Best Sellers & New Arrivals Spotlight Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {[
            {
              key: 'best-sellers',
              icon: <TrophyBadgeIcon />,
              cfg: bestCfg,
              fallbackTitle: 'Best Sellers',
              fallbackSubtitle: 'Most loved products by our customers',
              fallbackCta: 'Shop Best Sellers',
              items: bestSellerProducts,
              imgOffset: 0,
            },
            {
              key: 'new-arrivals',
              icon: <NewSealIcon />,
              cfg: arrivalCfg,
              fallbackTitle: 'New Arrivals',
              fallbackSubtitle: 'Discover our latest products',
              fallbackCta: 'Shop New Arrivals',
              items: newArrivalProducts,
              imgOffset: 3,
            },
          ].map((card) => (
            <div
              key={card.key}
              className="rounded-[18px] overflow-hidden bg-white border border-[#DFE8DC] shadow-[0_6px_20px_-6px_rgba(12,68,41,0.1)] flex flex-col sm:flex-row"
            >
              <div className="sm:w-[35%] bg-gradient-to-br from-[#094127] via-[#0B4A2C] to-[#135A38] p-5 sm:p-6 flex flex-col justify-between text-white relative overflow-hidden rounded-b-[20px] sm:rounded-b-none sm:rounded-r-[22px]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-[#3A8454]/20 blur-xl"
                />
                <div>
                  {card.icon}
                  <h3
                    className="text-[21px] sm:text-[23px] font-bold leading-tight mt-2"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    {card.cfg.title || card.fallbackTitle}
                  </h3>
                  <p className="text-[12px] sm:text-[12.5px] text-white/85 leading-snug mt-1.5">
                    {card.cfg.subtitle || card.fallbackSubtitle}
                  </p>
                </div>
                <Link
                  href={card.cfg.cta_href || '/shop'}
                  className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-[#FAF9F0] hover:bg-white text-[#0B4328] px-3.5 py-2 text-[11.5px] font-semibold transition-all duration-200 hover:translate-x-0.5 no-underline whitespace-nowrap"
                >
                  <span>{card.cfg.cta_text || card.fallbackCta}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                </Link>
              </div>

              <div className="sm:w-[65%] grid grid-cols-3 divide-x divide-[#EBF1E8] bg-white">
                {card.items.map((p, idx) => (
                  <SpotlightProductMiniCard key={p.id || idx} product={p} index={idx + card.imgOffset} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Row 3 & Row 4: 4 Promo Cards */}
        {promos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {promos.map((promo, idx) => (
              <PromoFeatureCard key={promo.id || idx} promo={promo} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
