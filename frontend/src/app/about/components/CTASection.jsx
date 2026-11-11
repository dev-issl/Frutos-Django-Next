import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import SectionHeader from './SectionHeader'

export default function CTASection() {
  return (
    <section className="py-10 sm:py-14 bg-[#EFF6EA]">
      <div className="max-w-[740px] mx-auto px-4 sm:px-6 text-center">
        <SectionHeader
          eyebrow="READY TO TASTE THE DIFFERENCE?"
          title="Ready to taste the difference?"
          className="mb-4"
        />

        <p className="text-[13.5px] sm:text-[14.5px] text-[#4C6356] leading-[1.65] max-w-[540px] mx-auto mb-7">
          Whether you shop online or visit one of our local stores, every product carries our promise — fresh, honest, and grown with care.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-[#114A31] hover:bg-[#0B3925] text-white px-6 py-2.5 text-[13px] font-semibold shadow-[0_6px_16px_rgba(17,74,49,0.22)] transition-colors no-underline"
          >
            <span>Shop All Produce</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/stores"
            className="inline-flex items-center gap-2 rounded-full bg-[#F5F9F0]/90 hover:bg-white text-[#12422C] border border-[#2C5B44]/45 px-6 py-2.5 text-[13px] font-semibold transition-colors no-underline"
          >
            <MapPin className="w-3.5 h-3.5 text-[#226444]" />
            <span>Find Our Stores</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
