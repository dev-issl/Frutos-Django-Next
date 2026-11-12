import React from 'react'
import { getOffers, getOfferMaxDiscount } from '@/lib/api_product'
import OffersClient from './OffersClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Exclusive Offers | El Árbol',
  description:
    'Discover our hand-picked selection of premium deals and limited-time discounts designed just for you.',
}

export default async function OffersPage() {
  const allOffers = await getOffers().catch(() => [])
  const nowMs = Date.now()

  const activeOffers = (Array.isArray(allOffers) ? allOffers : []).filter((offer) => {
    if (!offer || offer.isActive === false) return false
    if (offer.startDate) {
      const startMs = Date.parse(offer.startDate)
      if (!Number.isNaN(startMs) && startMs > nowMs) return false
    }
    if (offer.endDate) {
      const endMs = Date.parse(offer.endDate)
      if (!Number.isNaN(endMs) && endMs < nowMs) return false
    }
    return true
  })

  const maxAcrossOffers = activeOffers.reduce((best, offer) => {
    const pct = getOfferMaxDiscount(offer)
    return pct > best ? pct : best
  }, 0)

  const heroMaxDiscount = maxAcrossOffers > 0 ? maxAcrossOffers : 50

  return <OffersClient offers={activeOffers} heroMaxDiscount={heroMaxDiscount} />
}
