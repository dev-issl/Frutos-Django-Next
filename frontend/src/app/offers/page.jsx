import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getOffers } from '@/lib/api_product';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const offers = await getOffers().catch(() => []);

  return (
    <div className="min-h-screen bg-[#f8faf9] py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#043328] tracking-tight mb-4" style={{ fontFamily: '"Newsreader", Georgia, serif' }}>
            Exclusive Offers
          </h1>
          <p className="text-lg text-gray-500">
            Discover our hand-picked selection of premium deals and limited-time discounts designed just for you.
          </p>
        </div>
        
        {offers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center max-w-md mx-auto">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">loyalty</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No active offers</h3>
            <p className="text-gray-500">Check back soon for new and exciting deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {offers.map((offer) => (
              <Link 
                key={offer.id} 
                href={`/offers/${offer.slug}`} 
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,105,76,0.1)] transition-all duration-500 border border-gray-100/80 hover:-translate-y-1"
              >
                
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {offer.endDate && (
                    <div className="absolute top-3 left-3 bg-red-500/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg tracking-wider uppercase">
                      Limited Time
                    </div>
                  )}
                </div>
                
                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#151e13] leading-tight mb-2 group-hover:text-[#00694c] transition-colors duration-300 line-clamp-2">
                      {offer.title}
                    </h3>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[#00694c]">
                    <span className="uppercase tracking-widest text-[10px]">View Offer</span>
                    <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform duration-300 text-[18px]">
                      arrow_forward
                    </span>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
