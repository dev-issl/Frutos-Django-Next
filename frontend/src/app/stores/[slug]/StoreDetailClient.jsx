// 'use client'
// // src/app/stores/[slug]/StoreDetailClient.jsx

// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { useState } from 'react'
// import { isStoreOpen } from '@/lib/stores-api'
// import * as LucideIcons from 'lucide-react'

// // ── Lucide dynamic icon helper ─────────────────────────────────────────────────
// // DB stores kebab-case names like "apple", "leafy-green", "wheat", "milk", "wine-glass"
// // Lucide React exports PascalCase: Apple, LeafyGreen, Wheat, Milk, WineGlass
// function toPascalCase(name = '') {
//   return name
//     .split('-')
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join('')
// }

// function AvailIcon({ name, size = 28, color = '#00694c' }) {
//   const key  = toPascalCase(name)
//   const Icon = LucideIcons[key] || LucideIcons.ShoppingBasket
//   return <Icon size={size} color={color} strokeWidth={1.75} />
// }

// // ─────────────────────────────────────────────────────────────────────────────

// const FEATURE_LABELS = {
//   leftoverPack: 'LEFTOVER PACK',
//   clickCollect: 'CLICK & COLLECT',
//   organic:      'ORGANIC',
//   delivery:     'DELIVERY',
//   pickup:       'CLICK & COLLECT',
// }

// function BackIcon() {
//   return <svg width="20" height="20" fill="none" style={{ color: '#00694c' }} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
// }
// function PinIcon({ size = 14 }) {
//   return <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
// }
// function ExternalIcon() {
//   return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
// }
// function HeartIcon({ filled }) {
//   return <svg width="20" height="20" fill={filled ? '#00694c' : 'none'} stroke="#00694c" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
// }

// function LocationMap({ store }) {
//   const delta = 0.008
//   const bbox  = `${store.lng - delta},${store.lat - delta},${store.lng + delta},${store.lat + delta}`
//   const src   = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${store.lat},${store.lng}`

//   return (
//     <a href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
//       target="_blank" rel="noopener noreferrer"
//       className="block relative rounded-2xl overflow-hidden" style={{ height: '180px', boxShadow: '0 4px 24px rgba(0,33,21,0.08)' }}>
//       <iframe src={src} style={{ width: '100%', height: '100%', border: 'none', opacity: 0.85, pointerEvents: 'none' }} title="Store location" />
//       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//         <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 border-white" style={{ background: '#00694c', boxShadow: '0 4px 16px rgba(0,105,76,0.4)' }}>
//           <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
//         </div>
//       </div>
//       <div className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full pointer-events-none"
//         style={{ background: 'rgba(255,255,255,0.92)', color: '#00694c', backdropFilter: 'blur(6px)' }}>
//         Open Navigation
//       </div>
//     </a>
//   )
// }

// export default function StoreDetailClient({ store }) {
//   const router = useRouter()
//   const [fav, setFav] = useState(false)
//   const open = isStoreOpen(store)

//   const leftoverPacks = store.leftoverPacks ?? []
//   // availability is now [{category, icon}, …]
//   const availability  = store.availability ?? []

//   return (
//     <>
//       {/* ═══ MOBILE ═══ */}
//       <div className="md:hidden min-h-screen" style={{ background: '#f2fdea' }}>
//         <header className="fixed top-0 left-0 right-0 z-50"
//           style={{ background: 'rgba(242,253,234,0.82)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(188,202,193,0.15)' }}>
//           <div className="flex items-center justify-between px-5 h-[60px]">
//             <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: 'rgba(0,105,76,0.08)' }}>
//               <BackIcon />
//             </button>
//             <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontStyle: 'italic', color: '#00694c' }}>El Árbol</span>
//             <button onClick={() => setFav(!fav)} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: 'rgba(0,105,76,0.08)' }}>
//               <HeartIcon filled={fav} />
//             </button>
//           </div>
//         </header>

//         <div className="pt-[60px] pb-32">
//           {/* Hero */}
//           <div className="relative h-64 overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
//             <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
//             <div className="absolute bottom-4 left-5">
//               <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
//                 style={{ background: open ? '#E7F1DF' : '#FEE2E2', color: open ? '#00694c' : '#e11d48' }}>
//                 <div className="w-1.5 h-1.5 rounded-full" style={{ background: open ? '#00694c' : '#e11d48' }} />
//                 {open ? `Open until ${store.closeTime}` : 'Closed now'}
//               </div>
//             </div>
//           </div>

//           <div className="px-6 mt-6">
//             <h1 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '30px', fontWeight: 700, color: '#151e13', lineHeight: 1.15, marginBottom: '10px' }}>
//               {store.name}
//             </h1>
//             <div className="flex items-start gap-2 mb-6" style={{ color: '#6D7A73', fontSize: '13px' }}>
//               <span style={{ marginTop: '2px', flexShrink: 0, color: '#00694c' }}><PinIcon size={13} /></span>
//               {store.fullAddress}
//             </div>

//             {/* Info grid */}
//             <div className="grid grid-cols-2 gap-3 mb-10">
//               {[{ label: 'Opening Hours', value: store.hours }, { label: 'Contact', value: store.phone }].map(({ label, value }) => (
//                 <div key={label} className="p-4 rounded-xl" style={{ background: '#ECF7E4' }}>
//                   <span className="block text-[10px] uppercase tracking-widest mb-1.5 font-bold" style={{ color: '#6D7A73', opacity: 0.75 }}>{label}</span>
//                   <p className="font-semibold text-sm" style={{ color: '#151e13' }}>{value}</p>
//                 </div>
//               ))}
//             </div>

//             {/* Availability — Lucide icons */}
//             <section className="mb-10">
//               <div className="flex items-center justify-between mb-5">
//                 <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#151e13' }}>Today's Availability</h2>
//                 <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00694c' }}>Fresh Today</span>
//               </div>
//               <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
//                 {availability.map((item) => (
//                   <div key={item.category} className="min-w-[96px] flex-shrink-0 p-4 rounded-2xl flex flex-col items-center gap-2.5"
//                     style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
//                     <AvailIcon name={item.icon} size={28} />
//                     <span className="text-xs font-bold text-center" style={{ color: '#151e13' }}>{item.category}</span>
//                     <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#008560' }} />
//                   </div>
//                 ))}
//               </div>
//             </section>

//             {/* Leftover packs */}
//             {leftoverPacks.length > 0 && (
//               <section className="mb-10">
//                 <div className="flex items-baseline justify-between mb-5">
//                   <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#151e13' }}>Leftover Packs</h2>
//                   <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#855000' }}>{leftoverPacks.length} packs remaining</span>
//                 </div>
//                 <div className="space-y-4">
//                   {leftoverPacks.map((pack) => (
//                     <div key={pack.id} className="flex overflow-hidden rounded-xl" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
//                       <div className="w-28 h-28 flex-shrink-0"><img src={pack.image} alt={pack.name} className="w-full h-full object-cover" /></div>
//                       <div className="p-4 flex flex-col justify-between flex-grow">
//                         <div>
//                           <h3 className="font-bold text-sm leading-snug" style={{ color: '#151e13' }}>{pack.name}</h3>
//                           <p className="text-xs mt-1" style={{ color: '#6D7A73' }}>{pack.description}</p>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="font-bold text-sm" style={{ color: '#855000' }}>€{Number(pack.price).toFixed(2)}</span>
//                           <button className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,105,76,0.09)', color: '#00694c', border: 'none' }}>Reserve Now</button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </section>
//             )}

//             {/* Location */}
//             <section className="mb-10">
//               <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#151e13', marginBottom: '20px' }}>Location</h2>
//               <LocationMap store={store} />
//             </section>
//           </div>
//         </div>

//         {/* Sticky CTA */}
//         <div className="fixed bottom-0 left-0 right-0 p-5" style={{ background: 'rgba(242,253,234,0.9)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(188,202,193,0.15)' }}>
//           <Link href={`/shop?store=${store.slug}`} className="flex items-center justify-center w-full py-4 rounded-xl font-bold text-sm text-white active:scale-[0.98] transition-transform"
//             style={{ background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)', boxShadow: '0 4px 18px rgba(0,105,76,0.28)' }}>
//             Shop This Store's Products
//           </Link>
//         </div>
//       </div>

//       {/* ═══ DESKTOP — full width, no max-w cap ═══ */}
//       <div className="hidden md:block" style={{ background: '#f2fdea', minHeight: 'calc(100vh - 60px)' }}>
//         <div className="w-full px-10 py-10">
//           <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-2 mb-8 text-sm font-semibold" style={{ color: '#00694c' }}>
//             <BackIcon /> Back to stores
//           </button>

//           <div className="grid grid-cols-5 gap-10">
//             {/* Left — main content */}
//             <div className="col-span-3 space-y-10">
//               <div className="rounded-2xl overflow-hidden h-72 relative">
//                 <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
//                 <div className="absolute bottom-5 left-5">
//                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
//                     style={{ background: open ? '#E7F1DF' : '#FEE2E2', color: open ? '#00694c' : '#e11d48' }}>
//                     <div className="w-1.5 h-1.5 rounded-full" style={{ background: open ? '#00694c' : '#e11d48' }} />
//                     {open ? `Open until ${store.closeTime}` : 'Closed now'}
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <h1 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '38px', fontWeight: 700, color: '#151e13', lineHeight: 1.15, marginBottom: '12px' }}>{store.name}</h1>
//                 <div className="flex items-center gap-2" style={{ color: '#6D7A73', fontSize: '14px' }}>
//                   <span style={{ color: '#00694c' }}><PinIcon /></span>
//                   {store.fullAddress}
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 {[{ label: 'Opening Hours', value: store.hours }, { label: 'Contact', value: store.phone }].map(({ label, value }) => (
//                   <div key={label} className="p-5 rounded-xl" style={{ background: '#ECF7E4' }}>
//                     <span className="block text-[10px] uppercase tracking-widest mb-2 font-bold" style={{ color: '#6D7A73', opacity: 0.75 }}>{label}</span>
//                     <p className="font-semibold text-sm" style={{ color: '#151e13' }}>{value}</p>
//                   </div>
//                 ))}
//               </div>

//               {/* Availability — Lucide icons */}
//               <section>
//                 <div className="flex items-center justify-between mb-5">
//                   <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#151e13' }}>Today's Availability</h2>
//                   <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00694c' }}>Fresh Today</span>
//                 </div>
//                 <div className="flex gap-4 flex-wrap">
//                   {availability.map((item) => (
//                     <div key={item.category} className="px-5 py-4 rounded-2xl flex flex-col items-center gap-2.5" style={{ background: '#fff', minWidth: '96px', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
//                       <AvailIcon name={item.icon} size={28} />
//                       <span className="text-xs font-bold text-center" style={{ color: '#151e13' }}>{item.category}</span>
//                       <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#008560' }} />
//                     </div>
//                   ))}
//                 </div>
//               </section>

//               {leftoverPacks.length > 0 && (
//                 <section>
//                   <div className="flex items-baseline justify-between mb-5">
//                     <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#151e13' }}>Leftover Packs</h2>
//                     <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#855000' }}>{leftoverPacks.length} packs remaining</span>
//                   </div>
//                   <div className="space-y-4">
//                     {leftoverPacks.map((pack) => (
//                       <div key={pack.id} className="flex overflow-hidden rounded-xl" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
//                         <div className="w-36 h-36 flex-shrink-0"><img src={pack.image} alt={pack.name} className="w-full h-full object-cover" /></div>
//                         <div className="p-5 flex flex-col justify-between flex-grow">
//                           <div>
//                             <h3 className="font-bold text-base leading-snug mb-1" style={{ color: '#151e13' }}>{pack.name}</h3>
//                             <p className="text-sm" style={{ color: '#6D7A73' }}>{pack.description}</p>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <span className="font-bold text-lg" style={{ color: '#855000' }}>€{Number(pack.price).toFixed(2)}</span>
//                             <button className="text-sm font-bold px-5 py-2 rounded-full" style={{ background: 'rgba(0,105,76,0.09)', color: '#00694c' }}>Reserve Now</button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </section>
//               )}
//             </div>

//             {/* Right sidebar */}
//             <div className="col-span-2">
//               <div className="sticky top-[80px] space-y-5">
//                 <div className="flex flex-wrap gap-2">
//                   {store.features.map((f) => (
//                     <span key={f} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
//                       style={{ background: f === 'leftoverPack' ? '#FFF8ED' : '#E7F1DF', color: f === 'leftoverPack' ? '#855000' : '#00694c' }}>
//                       {FEATURE_LABELS[f] || f}
//                     </span>
//                   ))}
//                 </div>

//                 {store.provenance && (
//                   <p style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#00694c' }}>
//                     Produce {store.provenance}
//                   </p>
//                 )}

//                 <div>
//                   <h3 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#151e13', marginBottom: '14px' }}>Location</h3>
//                   <LocationMap store={store} />
//                   <a href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
//                     target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-xs font-bold" style={{ color: '#855000' }}>
//                     Get Directions <ExternalIcon />
//                   </a>
//                 </div>

//                 <Link href={`/shop?store=${store.slug}`}
//                   className="flex items-center justify-center w-full py-4 rounded-xl font-bold text-sm text-white active:scale-[0.98] transition-transform"
//                   style={{ background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)', boxShadow: '0 4px 18px rgba(0,105,76,0.28)' }}>
//                   Shop This Store's Products
//                 </Link>
//                 <Link href="/stores" className="flex cursor-pointer items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform" style={{ background: '#ECF7E4', color: '#151e13' }}>
//                   All Stores
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }


'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { isStoreOpen, formatTime12h } from '@/lib/stores-api'
import {
  ShoppingBasket,
  Apple,
  Leaf,
  Wheat,
  Milk,
  Wine,
  Croissant,
  Carrot,
  Fish,
  Beef,
  Coffee,
  Egg,
  Package,
  Store,
  MapPin,
  Clock
} from 'lucide-react'
import { useCart } from '@/app/context/CartContext'

// ── Lucide dynamic icon helper ─────────────────────────────────────────────────
const ICON_MAP = {
  ShoppingBasket, Apple, Leaf, Wheat, Milk, Wine, Croissant, 
  Carrot, Fish, Beef, Coffee, Egg, Package, Store, MapPin, Clock
}

function toPascalCase(name = '') {
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function AvailIcon({ name, size = 28, color = '#00694c' }) {
  const key = toPascalCase(name)
  const Icon = ICON_MAP[key] || ICON_MAP.ShoppingBasket
  return <Icon size={size} color={color} strokeWidth={1.75} />
}

// ─────────────────────────────────────────────────────────────────────────────

const FEATURE_LABELS = {
  leftoverPack: 'LEFTOVER PACK',
  clickCollect: 'CLICK & COLLECT',
  organic:      'ORGANIC',
  delivery:     'DELIVERY',
  pickup:       'CLICK & COLLECT',
}

function BackIcon() {
  return <svg width="20" height="20" fill="none" style={{ color: '#00694c' }} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
}
function PinIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function ExternalIcon() {
  return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
}
function HeartIcon({ filled }) {
  return <svg width="20" height="20" fill={filled ? '#00694c' : 'none'} stroke="#00694c" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}

function PackQuickViewModal({ pack, onClose, onReserve }) {
  if (!pack) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-5 transition-opacity" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl transform transition-all translate-y-0" onClick={e => e.stopPropagation()}>
        <div className="relative h-64 w-full bg-gray-100 flex-shrink-0">
          <img src={pack.image} alt={pack.name} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/80 rounded-full text-gray-800 hover:bg-white transition-colors shadow-sm cursor-pointer">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight" style={{ fontFamily: '"Newsreader", Georgia, serif' }}>{pack.name}</h2>
            <span className="text-xs uppercase font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{pack.package_type}</span>
          </div>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">{pack.description}</p>
          
          <div className="flex gap-4 mb-6">
            <div className="bg-green-50 px-4 py-3 rounded-xl flex-1 border border-green-100">
              <span className="block text-[10px] uppercase font-bold text-green-700 tracking-wider mb-1">Price</span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold leading-none" style={{ color: '#855000' }}>€{Number(pack.price).toFixed(2)}</span>
                {pack.original_price && pack.original_price > pack.price && (
                  <span className="text-sm text-gray-400 line-through leading-none mb-0.5">€{Number(pack.original_price).toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-xl flex-1 border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-600 tracking-wider mb-1">Stock & Qty</span>
              <div className="font-semibold text-gray-900 text-sm">
                {pack.weight_quantity && <span className="mr-2">{pack.weight_quantity}</span>}
                <span className={pack.stock > 0 ? "text-green-600" : "text-red-500"}>{pack.stock > 0 ? `${pack.stock} left` : 'Sold out'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onReserve(pack)}
            disabled={pack.stock <= 0}
            className="w-full py-4 rounded-xl font-bold text-white text-[15px] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
            style={{ background: pack.stock > 0 ? 'linear-gradient(135deg, #00694c 0%, #008560 100%)' : '#94a3b8' }}>
            {pack.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LocationMap({ store }) {
  const delta = 0.008
  const bbox  = `${store.lng - delta},${store.lat - delta},${store.lng + delta},${store.lat + delta}`
  const src   = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${store.lat},${store.lng}`
  return (
    <a href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
      target="_blank" rel="noopener noreferrer"
      className="block relative rounded-2xl overflow-hidden" style={{ height: '180px', boxShadow: '0 4px 24px rgba(0,33,21,0.08)' }}>
      <iframe src={src} style={{ width: '100%', height: '100%', border: 'none', opacity: 0.85, pointerEvents: 'none' }} title="Store location" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 border-white" style={{ background: '#00694c', boxShadow: '0 4px 16px rgba(0,105,76,0.4)' }}>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.92)', color: '#00694c', backdropFilter: 'blur(6px)' }}>
        Open Navigation
      </div>
    </a>
  )
}

export default function StoreDetailClient({ store }) {
  const router        = useRouter()
  const { addItem }   = useCart()
  const [fav, setFav] = useState(false)
  const [selectedPack, setSelectedPack] = useState(null)
  const open          = isStoreOpen(store)

  // Format close time with AM/PM once — reuse everywhere
  const closeFmt   = formatTime12h(store.closeTime)

  const leftoverPacks = store.leftoverPacks ?? []
  const availability  = store.availability  ?? []

  // Open/closed label reused in both mobile & desktop
  const statusLabel = open ? `Open until ${closeFmt}` : 'Closed now'
  const statusBg    = open ? '#E7F1DF' : '#FEE2E2'
  const statusColor = open ? '#00694c' : '#e11d48'
  const dotColor    = open ? '#00694c' : '#e11d48'

  const handleReserve = (pack) => {
    // Leftover pack is passed to addItem. item_type flag is injected.
    addItem({ ...pack, item_type: 'pack' }, pack.price, 1)
    setSelectedPack(null)
  }

  return (
    <>
      <PackQuickViewModal pack={selectedPack} onClose={() => setSelectedPack(null)} onReserve={handleReserve} />
      {/* ═══ MOBILE ═══ */}
      <div className="md:hidden min-h-screen" style={{ background: '#f2fdea' }}>
        <header className="fixed top-0 left-0 right-0 z-50"
          style={{ background: 'rgba(242,253,234,0.82)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(188,202,193,0.15)' }}>
          <div className="flex items-center justify-between px-5 h-[60px]">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: 'rgba(0,105,76,0.08)' }}>
              <BackIcon />
            </button>
            <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontStyle: 'italic', color: '#00694c' }}>El Árbol</span>
            <button onClick={() => setFav(!fav)} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: 'rgba(0,105,76,0.08)' }}>
              <HeartIcon filled={fav} />
            </button>
          </div>
        </header>

        <div className="pt-[60px] pb-32">
          {/* Hero */}
          <div className="relative h-64 overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
            <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              {/* ← AM/PM time badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: statusBg, color: statusColor }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                {statusLabel}
              </div>
            </div>
          </div>

          <div className="px-6 mt-6">
            <h1 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '30px', fontWeight: 700, color: '#151e13', lineHeight: 1.15, marginBottom: '10px' }}>
              {store.name}
            </h1>
            <div className="flex items-start gap-2 mb-6" style={{ color: '#6D7A73', fontSize: '13px' }}>
              <span style={{ marginTop: '2px', flexShrink: 0, color: '#00694c' }}><PinIcon size={13} /></span>
              {store.fullAddress}
            </div>

            {/* Info grid — hours already has AM/PM from model */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {[{ label: 'Opening Hours', value: store.hours }, { label: 'Contact', value: store.phone }].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-xl" style={{ background: '#ECF7E4' }}>
                  <span className="block text-[10px] uppercase tracking-widest mb-1.5 font-bold" style={{ color: '#6D7A73', opacity: 0.75 }}>{label}</span>
                  <p className="font-semibold text-sm" style={{ color: '#151e13' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Availability */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#151e13' }}>Today's Availability</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00694c' }}>Fresh Today</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                {availability.map((item) => (
                  <div key={item.category} className="min-w-[96px] flex-shrink-0 p-4 rounded-2xl flex flex-col items-center gap-2.5"
                    style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
                    <AvailIcon name={item.icon} size={28} />
                    <span className="text-xs font-bold text-center" style={{ color: '#151e13' }}>{item.category}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#008560' }} />
                  </div>
                ))}
              </div>
            </section>

            {/* Leftover packs */}
            {leftoverPacks.length > 0 && (
              <section className="mb-10">
                <div className="flex items-baseline justify-between mb-5">
                  <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#151e13' }}>Leftover Packs</h2>
                  <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#855000' }}>{leftoverPacks.length} packs remaining</span>
                </div>
                <div className="space-y-4">
                  {leftoverPacks.map((pack) => (
                    <div key={pack.id} 
                         onClick={() => setSelectedPack(pack)}
                         className="flex overflow-hidden rounded-xl relative group transition-all cursor-pointer hover:ring-2 hover:ring-[#00694c]/20" 
                         style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
                      <div className="w-28 h-28 flex-shrink-0 relative overflow-hidden">
                        <img src={pack.image} alt={pack.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        {pack.discount_percentage > 0 && (
                            <div className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm" style={{ background: '#e11d48', color: '#fff' }}>
                              -{pack.discount_percentage}%
                            </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-grow">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm leading-snug" style={{ color: '#151e13' }}>{pack.name}</h3>
                            <span className="text-[9px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{pack.package_type}</span>
                          </div>
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6D7A73' }}>{pack.description}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                            {pack.weight_quantity && <span className="font-medium text-gray-600 border border-gray-200 px-1.5 rounded">{pack.weight_quantity}</span>}
                            {pack.stock > 0 ? <span className="text-green-600 font-medium">{pack.stock} left</span> : <span className="text-red-500 font-medium">Sold Out</span>}
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-2">
                          <div className="flex flex-col">
                              {pack.original_price && pack.original_price > pack.price && (
                                  <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">€{Number(pack.original_price).toFixed(2)}</span>
                              )}
                              <span className="font-bold text-sm leading-none" style={{ color: '#855000' }}>€{Number(pack.price).toFixed(2)}</span>
                          </div>
                          <button 
                            className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100" 
                            disabled={pack.stock <= 0}
                            style={{ background: pack.stock > 0 ? 'rgba(0,105,76,0.09)' : '#f1f5f9', color: pack.stock > 0 ? '#00694c' : '#94a3b8', border: 'none' }}>
                            {pack.stock > 0 ? 'Reserve Now' : 'Sold Out'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location */}
            <section className="mb-10">
              <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#151e13', marginBottom: '20px' }}>Location</h2>
              <LocationMap store={store} />
            </section>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-5" style={{ background: 'rgba(242,253,234,0.9)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(188,202,193,0.15)' }}>
          <Link href={`/shop?store=${store.slug}`} className="flex items-center justify-center w-full py-4 rounded-xl font-bold text-sm text-white active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)', boxShadow: '0 4px 18px rgba(0,105,76,0.28)' }}>
            Shop This Store's Products
          </Link>
        </div>
      </div>

      {/* ═══ DESKTOP — full width ═══ */}
      <div className="hidden md:block" style={{ background: '#f2fdea', minHeight: 'calc(100vh - 60px)' }}>
        <div className="w-full px-10 py-10">
          <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-2 mb-8 text-sm font-semibold" style={{ color: '#00694c' }}>
            <BackIcon /> Back to stores
          </button>

          <div className="grid grid-cols-5 gap-10">
            {/* Left */}
            <div className="col-span-3 space-y-10">
              <div className="rounded-2xl overflow-hidden h-72 relative">
                <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  {/* ← AM/PM time badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: statusBg, color: statusColor }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                    {statusLabel}
                  </div>
                </div>
              </div>

              <div>
                <h1 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '38px', fontWeight: 700, color: '#151e13', lineHeight: 1.15, marginBottom: '12px' }}>{store.name}</h1>
                <div className="flex items-center gap-2" style={{ color: '#6D7A73', fontSize: '14px' }}>
                  <span style={{ color: '#00694c' }}><PinIcon /></span>
                  {store.fullAddress}
                </div>
              </div>

              {/* Info grid — hours already has AM/PM from model */}
              <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Opening Hours', value: store.hours }, { label: 'Contact', value: store.phone }].map(({ label, value }) => (
                  <div key={label} className="p-5 rounded-xl" style={{ background: '#ECF7E4' }}>
                    <span className="block text-[10px] uppercase tracking-widest mb-2 font-bold" style={{ color: '#6D7A73', opacity: 0.75 }}>{label}</span>
                    <p className="font-semibold text-sm" style={{ color: '#151e13' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Availability */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#151e13' }}>Today's Availability</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00694c' }}>Fresh Today</span>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {availability.map((item) => (
                    <div key={item.category} className="px-5 py-4 rounded-2xl flex flex-col items-center gap-2.5" style={{ background: '#fff', minWidth: '96px', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
                      <AvailIcon name={item.icon} size={28} />
                      <span className="text-xs font-bold text-center" style={{ color: '#151e13' }}>{item.category}</span>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#008560' }} />
                    </div>
                  ))}
                </div>
              </section>

              {leftoverPacks.length > 0 && (
                <section>
                  <div className="flex items-baseline justify-between mb-5">
                    <h2 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#151e13' }}>Leftover Packs</h2>
                    <span style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#855000' }}>{leftoverPacks.length} packs remaining</span>
                  </div>
                  <div className="space-y-4">
                    {leftoverPacks.map((pack) => (
                      <div key={pack.id} 
                           onClick={() => setSelectedPack(pack)}
                           className="flex overflow-hidden rounded-xl relative group transition-all cursor-pointer hover:ring-2 hover:ring-[#00694c]/20 hover:shadow-lg" 
                           style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,33,21,0.06)' }}>
                        <div className="w-36 h-36 flex-shrink-0 relative overflow-hidden">
                          <img src={pack.image} alt={pack.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          {pack.discount_percentage > 0 && (
                              <div className="absolute top-2 left-2 text-[11px] font-bold px-2 py-1 rounded shadow-sm" style={{ background: '#e11d48', color: '#fff' }}>
                                -{pack.discount_percentage}%
                              </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col justify-between flex-grow">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-base leading-snug mb-1" style={{ color: '#151e13' }}>{pack.name}</h3>
                              <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-3 whitespace-nowrap border border-gray-200">{pack.package_type}</span>
                            </div>
                            <p className="text-sm line-clamp-2" style={{ color: '#6D7A73' }}>{pack.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              {pack.weight_quantity && <span className="font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{pack.weight_quantity}</span>}
                              {pack.stock > 0 ? <span className="text-green-600 font-medium">{pack.stock} available</span> : <span className="text-red-500 font-medium">Out of stock</span>}
                              {pack.estimated_delivery && <span className="text-gray-500 font-medium ml-auto">Delivers in: {pack.estimated_delivery}</span>}
                            </div>
                          </div>
                          <div className="flex items-end justify-between mt-3">
                            <div className="flex flex-col">
                                {pack.original_price && pack.original_price > pack.price && (
                                    <span className="text-xs text-gray-400 line-through leading-none mb-1">€{Number(pack.original_price).toFixed(2)}</span>
                                )}
                                <span className="font-bold text-lg leading-none" style={{ color: '#855000' }}>€{Number(pack.price).toFixed(2)}</span>
                            </div>
                            <button 
                              className="text-xs font-bold px-4 py-2 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100" 
                              disabled={pack.stock <= 0}
                              style={{ background: pack.stock > 0 ? 'rgba(0,105,76,0.09)' : '#f1f5f9', color: pack.stock > 0 ? '#00694c' : '#94a3b8' }}>
                              {pack.stock > 0 ? 'Reserve Now' : 'Sold Out'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right sidebar */}
            <div className="col-span-2">
              <div className="sticky top-[80px] space-y-5">
                <div className="flex flex-wrap gap-2">
                  {store.features.map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: f === 'leftoverPack' ? '#FFF8ED' : '#E7F1DF', color: f === 'leftoverPack' ? '#855000' : '#00694c' }}>
                      {FEATURE_LABELS[f] || f}
                    </span>
                  ))}
                </div>

                {/* ← AM/PM open status in sidebar */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-full w-fit"
                  style={{ background: statusBg }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                </div>

                {store.provenance && (
                  <p style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#00694c' }}>
                    Produce {store.provenance}
                  </p>
                )}

                <div>
                  <h3 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#151e13', marginBottom: '14px' }}>Location</h3>
                  <LocationMap store={store} />
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                    target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-xs font-bold" style={{ color: '#855000' }}>
                    Get Directions <ExternalIcon />
                  </a>
                </div>

                <Link href={`/shop?store=${store.slug}`}
                  className="flex items-center justify-center w-full py-4 rounded-xl font-bold text-sm text-white active:scale-[0.98] transition-transform"
                  style={{ background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)', boxShadow: '0 4px 18px rgba(0,105,76,0.28)' }}>
                  Shop This Store's Products
                </Link>
                <Link href="/stores" className="flex cursor-pointer items-center justify-center w-full py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform" style={{ background: '#ECF7E4', color: '#151e13' }}>
                  All Stores
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}