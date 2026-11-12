import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import BasketHero from './BasketHero'

export default function EmptyBasket() {
  return (
    <div style={{ background: '#F6F6EC', minHeight: '100vh', width: '100%' }}>
      <BasketHero />

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="rounded-[24px] bg-[#FAFBF6] border border-[#E2E6DA] p-7 sm:p-10 basket-fade-slide">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-[#E6F1DD] border border-[#D4E4C8]">
            <ShoppingBag className="w-9 h-9 text-[#0B462B]" />
          </div>

          <h2
            className="text-2xl sm:text-3xl italic font-bold mb-3"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#142D1E' }}
          >
            Your basket is empty
          </h2>

          <p className="text-[14.5px] mb-8 text-[#566A5D] max-w-sm mx-auto leading-relaxed">
            Discover crisp fruits, farm-fresh vegetables, and seasonal artisan harvests straight from our local farms.
          </p>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-white text-[15px] transition-all duration-200 hover:brightness-110 active:scale-[0.985]"
            style={{ background: 'linear-gradient(135deg, #0B462B 0%, #155B3A 100%)' }}
          >
            <span>Explore Our Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
