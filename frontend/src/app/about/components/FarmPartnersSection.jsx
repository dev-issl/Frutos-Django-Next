import Image from 'next/image'
import DynamicIcon from '@/app/components/DynamicIcon'
import SectionHeader from './SectionHeader'

const PARTNER_IMAGES = [
  '/about/partner-farm-1.webp',
  '/about/partner-farm-2.webp',
  '/about/partner-farm-3.webp',
  '/about/partner-farm-4.webp',
  '/about/partner-farm-5.webp',
]

function LeafPartnerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-3.5 h-3.5 text-[#1F6142]">
      <path
        d="M15.5 4.5C10.5 4.8 6.4 7.8 4.8 13c3.8-.5 7.4-2.5 9.6-5.9.5-.8.9-1.7 1.1-2.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4.2 15.8c2.2-2.6 5.2-5.4 9.2-8.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function BarnLeafPartnerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-3.5 h-3.5 text-[#1F6142]">
      <path
        d="M3.5 9.5 10 4.2l6.5 5.3v6.3a.7.7 0 0 1-.7.7H4.2a.7.7 0 0 1-.7-.7V9.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.2V9.8M10 11.4c-1.5 0-2.5-1-2.5-2.2 1.2 0 2.5.8 2.5 2.2ZM10 11.4c1.5 0 2.5-1 2.5-2.2-1.2 0-2.5.8-2.5 2.2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GreenhousePartnerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-3.5 h-3.5 text-[#1F6142]">
      <path
        d="M4 9.6 10 4.5l6 5.1-1.3 5.9a.7.7 0 0 1-.7.5H6a.7.7 0 0 1-.7-.5L4 9.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7.8 11.8c.9 0 1.8.8 2.2 2.2.4-1.4 1.3-2.2 2.2-2.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

const PARTNER_ICON_PRESETS = ['Leaf', 'Tractor', 'Sprout', 'Warehouse', 'Store']

export default function FarmPartnersSection({ farms = [] }) {
  return (
    <section className="relative pt-3 sm:pt-4 pb-10 sm:pb-14 overflow-hidden bg-[#F2F5EC]">
      <div className="relative z-10 max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="OUR FARM PARTNERS"
          title="Our farm partners"
          className="mb-7 sm:mb-8"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {farms.map((f, i) => {
            const imgSrc = f.image_url || PARTNER_IMAGES[i % PARTNER_IMAGES.length]
            const iconKey = String(f.icon_name || PARTNER_ICON_PRESETS[i % PARTNER_ICON_PRESETS.length]).toLowerCase()

            let iconNode
            if (iconKey === 'leaf') iconNode = <LeafPartnerIcon />
            else if (iconKey === 'warehouse') iconNode = <BarnLeafPartnerIcon />
            else if (iconKey === 'store') iconNode = <GreenhousePartnerIcon />
            else iconNode = <DynamicIcon name={f.icon_name || PARTNER_ICON_PRESETS[i % PARTNER_ICON_PRESETS.length]} size={14} fallbackName="Leaf" />

            return (
              <article
                key={i}
                className="bg-[#FAFDF8] rounded-[14px] border border-[#DCE8D8] hover:border-[#B8CFB3] transition-colors overflow-hidden flex flex-col"
              >
                <div className="px-2 pt-2 bg-[#FAFDF8]">
                  <div className="relative w-full h-[94px] sm:h-[92px] overflow-hidden rounded-tl-[22px] rounded-tr-[6px] bg-[#DDE8D8]">
                    <Image
                      src={imgSrc}
                      alt={`${f.name} organic farm`}
                      fill
                      decoding="async"
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                    {/* Flowing organic hill wave separating the farm landscape from card details */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 200 24"
                      preserveAspectRatio="none"
                      className="pointer-events-none select-none absolute -bottom-[1px] inset-x-0 w-full h-[18px]"
                    >
                      <path
                        d="M-1,25 L-1,14 C44,24 66,22 106,12 C142,3 170,5 201,12 L201,25 Z"
                        fill="#FAFDF8"
                      />
                    </svg>
                  </div>
                </div>

                <div className="px-3 pt-1 pb-3 bg-[#FAFDF8] flex items-center gap-2.5 flex-1">
                  <div className="w-[30px] h-[30px] rounded-full bg-[#E8F2E4] border border-[#9EC0A2] flex items-center justify-center shrink-0 text-[#1F6142]">
                    {iconNode}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[12.5px] sm:text-[13px] font-bold text-[#143B28] leading-tight truncate">
                      {f.name}
                    </h3>
                    <p className="text-[10.5px] sm:text-[11px] text-[#556C5E] leading-tight truncate mt-0.5">
                      {f.region}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
