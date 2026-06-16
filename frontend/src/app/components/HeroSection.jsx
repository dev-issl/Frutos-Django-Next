import Image from "next/image"
import Link from "next/link"
import { Truck, Leaf, ShieldCheck } from "lucide-react"

export default function HeroSection({ hero }) {
  return (
    <section className="bg-[#FAFAF8] relative overflow-hidden">
      
      {/* Background Decor Elements (Optional, for more premium feel) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      {/* ── MOBILE Hero ──────────────────────────────────────────────────── */}
      <div className="md:hidden relative overflow-hidden" style={{ height: '420px' }}>
        <Image
          src={hero.mobile_image_url}
          alt="Fresh produce"
          className="absolute inset-0 w-full h-full object-cover"
          width={800}
          height={600}
          priority
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)' }}
        />
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-8">
          <h1
            className="text-white mb-5"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '2rem', fontWeight: 700, lineHeight: 1.15,
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            {hero.mobile_heading}
          </h1>
          <div className="flex flex-col gap-3">
            <Link
              href={hero.primary_cta_href}
              className="block text-center text-white font-semibold rounded-lg"
              style={{
                background: '#00694C', fontSize: '13.5px',
                letterSpacing: '0.06em', padding: '13px 0',
                boxShadow: '0 4px 18px rgba(0,105,76,0.4)',
              }}
            >
              {hero.primary_cta_text.toUpperCase()}
            </Link>
            <Link
              href={hero.secondary_cta_href}
              className="block text-center text-white font-semibold rounded-lg"
              style={{
                border: '1.5px solid rgba(255,255,255,0.55)', fontSize: '13.5px',
                letterSpacing: '0.06em', padding: '12px 0',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              {hero.secondary_cta_text.toUpperCase()}
            </Link>
          </div>
        </div>
      </div>

      {/* ── DESKTOP & TABLET Hero ────────────────────────────────────────── */}
      <div className="hidden md:block max-w-[1280px] mx-auto px-6 lg:px-10 pb-10 md:pb-14 lg:pb-15 pt-6 md:pt-10 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-10">
          <div className="w-full md:max-w-[50%] lg:max-w-[620px] flex-shrink-0 text-center md:text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/60 border border-emerald-200/80 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4 md:mb-5 shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              {hero.top_badge_text || '100% Fresh & Organic'}
            </div>

            <h1
              className="text-[#151E13] mb-3 md:mb-4"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(2rem, 3.8vw, 3.2rem)', fontWeight: 800,
                lineHeight: 1.1, textShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              {hero.desktop_heading}
            </h1>
            
            <p
              className="text-[#4b5563] mb-6 md:mb-7 mx-auto md:mx-0 font-medium"
              style={{ fontSize: 'clamp(14px, 1.5vw, 15px)', lineHeight: 1.5, maxWidth: '480px' }}
            >
              {hero.desktop_subtext}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap mb-7 md:mb-8">
              <Link
                href={hero.primary_cta_href}
                className="inline-flex items-center justify-center bg-[#00694C] text-white font-bold rounded-[10px] hover:bg-[#085041] hover:-translate-y-0.5 transition-all duration-200"
                style={{ fontSize: '14px', padding: '10px 22px', boxShadow: '0 4px 14px -4px rgba(0,105,76,0.5)' }}
              >
                {hero.primary_cta_text}
              </Link>
              <Link
                href={hero.secondary_cta_href}
                className="inline-flex items-center justify-center font-bold rounded-[10px] bg-white hover:bg-slate-50 transition-all duration-200"
                style={{
                  fontSize: '14px', padding: '8px 22px',
                  borderColor: '#cbd5e1', borderWidth: '2px', borderStyle: 'solid',
                  color: '#334155', boxShadow: '0 2px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
              >
                {hero.secondary_cta_text}
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-5 pt-4 border-t border-slate-200/80">
               <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                   <Leaf className="w-3.5 h-3.5" />
                 </div>
                 <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{hero.feature_1_text || 'Farm Fresh'}</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                   <Truck className="w-3.5 h-3.5" />
                 </div>
                 <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{hero.feature_2_text || 'Fast Delivery'}</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                   <ShieldCheck className="w-3.5 h-3.5" />
                 </div>
                 <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{hero.feature_3_text || 'Quality Guaranteed'}</span>
               </div>
            </div>

          </div>
          <div className="w-full md:flex-1 mt-8 md:mt-0 flex justify-center">
            <img
              src={hero.desktop_image_url}
              alt="Fresh produce"
              className="w-full h-auto object-contain max-h-[350px] md:max-h-[420px] lg:max-h-[480px]"
            />
          </div>
        </div>
      </div>

      {/* ── Feature Cards ───────────────────────────────────────────────────
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pb-8 md:pb-10 pt-4 md:pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {featureCards.map(({ id, title, sub, icon }) => (
            <div
              key={id}
              className="bg-white rounded-xl border border-[#BCCAC1]/30 flex items-center gap-3"
              style={{ padding: '14px 16px', boxShadow: '0 1px 4px rgba(21,30,19,0.05)' }}
            >
              <span className="shrink-0">{icon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#151E13', lineHeight: 1.3 }}>{title}</p>
                <p style={{ fontSize: '11px', color: '#6D7A73', lineHeight: 1.4, marginTop: '2px' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div> */}

    </section>
  )
}