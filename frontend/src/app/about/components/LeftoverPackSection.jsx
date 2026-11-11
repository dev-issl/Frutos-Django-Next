import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sprout } from 'lucide-react'

export default function LeftoverPackSection() {
  return (
    <section className="py-6 sm:py-8 bg-[#EFF6EA]">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[14px] sm:rounded-[16px] bg-[#10422D] text-white overflow-hidden shadow-[0_14px_34px_rgba(11,53,35,0.16)] flex flex-col md:flex-row items-stretch md:items-center">
          {/* Left editorial hands-and-sprout image smoothly melting into dark green banner */}
          <div className="relative w-full md:w-[270px] lg:w-[300px] h-[145px] md:h-[132px] shrink-0 overflow-hidden">
            <Image
              src="/about/leftover-sprout.webp"
              alt="Cupped hands holding soil with a young green sprout"
              fill
              decoding="async"
              unoptimized
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="hidden md:block absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(16,66,45,0) 48%, rgba(16,66,45,0.85) 84%, #10422D 100%)',
              }}
            />
          </div>

          <div
            aria-hidden="true"
            className="hidden md:block w-px h-14 bg-white/15 shrink-0"
          />

          {/* Middle Copy */}
          <div className="flex-1 px-5 py-5 md:py-4 md:px-7">
            <div className="flex items-center gap-2 mb-1.5">
              <Sprout className="w-5 h-5 text-[#9FD5A7] shrink-0" strokeWidth={2} />
              <h2
                className="text-[20px] sm:text-[23px] font-semibold text-white leading-tight tracking-[-0.01em]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                The Leftover Pack programme
              </h2>
            </div>
            <p className="text-[12px] sm:text-[12.5px] text-white/80 leading-[1.55] max-w-[520px]">
              Turn the rescued produce into a shared opportunity — and help reduce food waste while supporting local communities.
            </p>
          </div>

          {/* Right Pill Action */}
          <div className="px-5 pb-5 md:pb-0 md:pr-7 shrink-0 flex justify-start md:justify-end">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#F4F8EF] hover:bg-white text-[#10422D] text-[12.5px] font-semibold px-6 py-2.5 shadow-xs transition-colors no-underline whitespace-nowrap"
            >
              <span>Learn More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
