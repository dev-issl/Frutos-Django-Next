import React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { getOfferBySlug } from '@/lib/api_product'
import OfferDetailClient from './OfferDetailClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const offer = await getOfferBySlug(slug).catch(() => null)
  if (!offer) {
    return { title: 'Offer Not Found | El Árbol' }
  }
  const plainDesc = (offer.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return {
    title: `${offer.title} | Exclusive Offer | El Árbol`,
    description: plainDesc || `Shop special discounted prices on ${offer.title} at El Árbol.`,
  }
}

export default async function OfferDetailPage({ params }) {
  const { slug } = await params
  const offer = await getOfferBySlug(slug).catch(() => null)

  if (!offer) {
    return (
      <div className="min-h-[70vh] bg-[#FAF9F0] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-[18px] border border-[#E5EDE2] shadow-[0_6px_24px_-8px_rgba(8,71,55,0.08)] p-10 sm:p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#EAF3E5] text-[#084737] rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1
            className="text-2xl font-bold text-[#084737] mb-2"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Offer Not Found
          </h1>
          <p className="text-sm text-[#455F53] mb-6">
            This offer does not exist or has expired.
          </p>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 bg-[#0B4635] hover:bg-[#073427] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View All Offers</span>
          </Link>
        </div>
      </div>
    )
  }

  return <OfferDetailClient offer={offer} />
}
