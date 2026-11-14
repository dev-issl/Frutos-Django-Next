'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { buildStoreMiniMapIcon } from '../mapMarkerUtils'
import {
  Store,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Calendar,
  Leaf,
  Truck,
  ShieldCheck,
  Headphones,
  BriefcaseBusiness,
  ShoppingBasket,
  Apple,
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
  Plus,
  Minus,
  X,
} from 'lucide-react'
import { isStoreOpen } from '@/lib/stores-api'
import { useCart } from '@/app/context/CartContext'

const ICON_MAP = {
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
  Clock,
}

function toPascalCase(name = '') {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

function AvailIcon({ name, size = 24, color = '#0E4D2D' }) {
  const Icon = ICON_MAP[toPascalCase(name)] || ShoppingBasket
  return <Icon size={size} color={color} strokeWidth={1.85} />
}

function TwinLeafIcon() {
  return (
    <svg width="24" height="19" viewBox="0 0 28 22" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2 5.8C2.4 13.2 6.8 18.4 13.4 19.2C13.9 12.4 10.2 6.8 2 5.8Z" fill="#5CA336" />
      <path d="M26 2C17.2 2.5 12 9 13 19.4C21.3 18.9 26.5 12.4 26 2Z" fill="#0E4D2D" />
    </svg>
  )
}

function formatDiscountPct(val) {
  const num = Number(val || 0)
  if (!num) return ''
  return num.toFixed(2).replace(/\.00$/, '')
}

function PackQuickViewModal({ pack, onClose, onReserve }) {
  if (!pack) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-60 w-full bg-[#EFF5EC] shrink-0">
          <Image
            src={pack.image || '/stores/store_fallback.jpg'}
            alt={pack.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pack details"
            className="absolute top-3.5 right-3.5 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white rounded-full text-[#142D22] shadow-sm cursor-pointer border-none"
          >
            <X className="w-4.5 h-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start gap-3 mb-2">
            <h2
              className="text-2xl font-bold text-[#142D22] leading-tight m-0"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              {pack.name}
            </h2>
            {pack.package_type && (
              <span className="text-[11px] uppercase font-bold text-[#3D5548] bg-[#EFF5EC] px-2.5 py-1 rounded-md border border-[#D8E5D3] shrink-0">
                {pack.package_type}
              </span>
            )}
          </div>

          {pack.description && (
            <p className="text-[#4F6559] text-sm mb-4 leading-relaxed">{pack.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5 mt-3">
            <div className="bg-[#EFF7EB] px-4 py-3 rounded-xl border border-[#DAE9D3]">
              <span className="block text-[10px] uppercase font-bold text-[#165936] tracking-wider mb-1">
                Price
              </span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold leading-none text-[#114A2C]">
                  €{Number(pack.price).toFixed(2)}
                </span>
                {pack.original_price && Number(pack.original_price) > Number(pack.price) && (
                  <span className="text-sm text-[#7B8C82] line-through leading-none mb-0.5">
                    €{Number(pack.original_price).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#F6F8F4] px-4 py-3 rounded-xl border border-[#E5ECE2]">
              <span className="block text-[10px] uppercase font-bold text-[#53685D] tracking-wider mb-1">
                Stock &amp; Weight
              </span>
              <div className="font-semibold text-[#142D22] text-sm">
                {pack.weight_quantity && <span className="mr-2">{pack.weight_quantity}</span>}
                <span className={pack.stock > 0 ? 'text-[#18643B]' : 'text-[#D14343]'}>
                  {pack.stock > 0 ? `${pack.stock} available` : 'Sold out'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onReserve(pack)}
            disabled={pack.stock <= 0}
            className="w-full py-3.5 rounded-full font-bold text-white text-[14.5px] shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer border-none"
            style={{
              background:
                pack.stock > 0
                  ? 'linear-gradient(135deg, #0E4D2D 0%, #14633B 100%)'
                  : '#94A3B8',
            }}
          >
            {pack.stock > 0 ? 'Reserve & Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

function extractCoordsFromMapLink(url) {
  if (!url || typeof url !== 'string') return null
  const patterns = [
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&]destination=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  ]
  for (const pat of patterns) {
    const m = url.match(pat)
    if (m) {
      const lat = parseFloat(m[1])
      const lng = parseFloat(m[2])
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng }
      }
    }
  }
  return null
}



function isValidCoord(v) {
  return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))
}

function StoreLocationMiniMap({ store, directionsUrl }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const destroyedRef = useRef(false)

  const resolvedCoords = useMemo(() => {
    if (isValidCoord(store?.lat) && isValidCoord(store?.lng)) {
      return { lat: Number(store.lat), lng: Number(store.lng) }
    }
    return extractCoordsFromMapLink(store?.mapLink)
  }, [store?.lat, store?.lng, store?.mapLink])

  const [geocodedCoords, setGeocodedCoords] = useState(null)
  const coords = resolvedCoords || geocodedCoords

  const pinLabel =
    store?.shortName?.trim() ||
    store?.name?.trim() ||
    store?.address?.split(',')[0]?.trim() ||
    store?.city?.trim() ||
    'Store'

  // Geocode store address on client only if store coordinates are missing
  useEffect(() => {
    if (resolvedCoords) return
    const query = store?.fullAddress || store?.address || store?.city || store?.name
    if (!query) return
    let active = true
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((results) => {
        if (!active || !Array.isArray(results) || results.length === 0) return
        const lat = parseFloat(results[0].lat)
        const lng = parseFloat(results[0].lon)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setGeocodedCoords({ lat, lng })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [resolvedCoords, store?.fullAddress, store?.address, store?.city, store?.name])

  // Render real interactive Leaflet map centered & pinned at exact store coordinates
  useEffect(() => {
    if (!coords || !containerRef.current) return
    destroyedRef.current = false

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const placeMarkerAndCenter = (L, map) => {
      map.setView([coords.lat, coords.lng], map.getZoom() || 15, { animate: false })
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
      }
      const icon = buildStoreMiniMapIcon(L, store, pinLabel)
      markerRef.current = L.marker([coords.lat, coords.lng], { icon })
        .addTo(map)
        .on('click', () => {
          window.open(directionsUrl, '_blank', 'noopener,noreferrer')
        })
    }

    const initMap = (L) => {
      if (destroyedRef.current || !containerRef.current) return
      if (mapRef.current) {
        placeMarkerAndCenter(L, mapRef.current)
        return
      }
      const map = L.map(containerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      })

      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      placeMarkerAndCenter(L, map)
    }

    let poll = null
    if (window.L) {
      initMap(window.L)
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => initMap(window.L)
      document.head.appendChild(script)
    } else {
      poll = setInterval(() => {
        if (window.L) {
          clearInterval(poll)
          initMap(window.L)
        }
      }, 60)
    }

    return () => {
      destroyedRef.current = true
      if (poll) clearInterval(poll)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [coords, pinLabel, directionsUrl, store])

  return (
    <div className="relative rounded-[14px] overflow-hidden h-[116px] sm:h-[122px] bg-[#E7EFE4] border border-[#DEE8DA]">
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Clean + / - Zoom Controls */}
      <div className="absolute bottom-2 right-2 z-[450] flex flex-col bg-white rounded-[8px] border border-[#D9E3D5] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in map"
          className="w-6 h-6 flex items-center justify-center text-[#1B3A2A] hover:bg-[#EFF6EB] border-b border-[#E5ECE2] bg-white cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out map"
          className="w-6 h-6 flex items-center justify-center text-[#1B3A2A] hover:bg-[#EFF6EB] bg-white cursor-pointer border-0"
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

const TRUST_HIGHLIGHTS = [
  { Icon: Leaf, title: 'Fresh & Organic', subtitle: 'Always' },
  { Icon: Truck, title: 'Fast Delivery', subtitle: 'Within 24–48h' },
  { Icon: ShieldCheck, title: 'Secure Payment', subtitle: 'Your data is safe' },
  { Icon: Headphones, title: '24/7 Support', subtitle: "We're here to help" },
]

export default function StoreDetailClient({ store }) {
  const { addItem } = useCart()
  const [selectedPack, setSelectedPack] = useState(null)
  const [heroSrcFailed, setHeroSrcFailed] = useState(false)

  const open = isStoreOpen(store)
  const leftoverPacks = Array.isArray(store?.leftoverPacks) ? store.leftoverPacks : []
  const availability = Array.isArray(store?.availability) ? store.availability : []

  const directionsUrl =
    store?.mapLink ||
    (store?.lat != null && store?.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        store?.fullAddress || store?.address || store?.name || 'El Arbol'
      )}`)

  const heroImage =
    !heroSrcFailed && store?.image ? store.image : '/stores/hero_farm.webp'

  const handleReserve = (pack) => {
    addItem({ ...pack, item_type: 'pack' }, pack.price, 1)
    setSelectedPack(null)
  }

  return (
    <div className="min-h-screen bg-[#F5F8F1] text-[#142D22] pb-10">
      <PackQuickViewModal
        pack={selectedPack}
        onClose={() => setSelectedPack(null)}
        onReserve={handleReserve}
      />

      <div className="max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {/* ═══ HERO BANNER CARD ═══ */}
        <section className="relative rounded-[22px] sm:rounded-[26px] overflow-hidden min-h-[270px] sm:min-h-[305px] lg:min-h-[325px] shadow-[0_12px_36px_rgba(12,68,41,0.12)] mb-5 flex items-center">
          <Image
            src={heroImage}
            alt={store?.name || 'Store storefront'}
            fill
            unoptimized
            priority
            sizes="(max-width: 1260px) 100vw, 1260px"
            onError={() => setHeroSrcFailed(true)}
            className="object-cover"
          />

          {/* Warm editorial left-to-right gradient scrim for clear white text */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(16, 26, 20, 0.88) 0%, rgba(18, 30, 23, 0.72) 38%, rgba(18, 30, 23, 0.30) 68%, rgba(18, 30, 23, 0.12) 100%)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"
          />

          <div className="relative z-10 px-6 sm:px-9 lg:px-11 py-8 max-w-[580px]">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#B4D89C] text-[#113C24] px-3.5 py-1.5 text-[12px] font-semibold shadow-sm mb-3.5">
              <Store className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
              <span>Our Store</span>
            </div>

            <h1
              className="text-[32px] sm:text-[42px] lg:text-[48px] font-bold text-white leading-[1.06] tracking-[-0.015em] mb-2.5 drop-shadow-sm"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              {store?.name}
            </h1>

            {(store?.fullAddress || store?.address) && (
              <div className="flex items-start gap-1.5 text-[13.5px] sm:text-[14.5px] text-white/90 font-medium mb-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/90" strokeWidth={2} />
                <span>{store.fullAddress || store.address}</span>
              </div>
            )}

            <p
              className="text-[13.5px] sm:text-[14.5px] italic text-white/85 mb-5"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              Fresh produce, closer to you.
            </p>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-white hover:bg-[#F5FAF1] text-[#113C24] pl-5 pr-2 py-1.5 text-[13.5px] font-bold shadow-[0_6px_18px_rgba(0,0,0,0.2)] transition-all active:scale-95 no-underline"
            >
              <span>Get Directions</span>
              <span className="w-6 h-6 rounded-full bg-[#5EA03A] text-white flex items-center justify-center shrink-0">
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </span>
            </a>
          </div>
        </section>

        {/* ═══ 3-CARD INFO ROW: HOURS · CONTACT · LOCATION MAP ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.48fr] gap-4 mb-6">
          {/* Card 1: Opening Hours */}
          <div className="bg-white/95 rounded-[20px] border border-[#E7ECE4] p-5 sm:p-6 shadow-[0_2px_10px_rgba(12,68,41,0.04)] flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#E1EFDB] text-[#0D4A2C] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <span className="block text-[13px] font-medium text-[#546B5F]">
                Opening Hours
              </span>
              <p className="mt-0.5 mb-0 text-[16px] sm:text-[17.5px] font-bold text-[#142D22] leading-snug">
                {store?.hours || '8:00 AM – 9:00 PM'}
              </p>
              <span className="block text-[12.5px] text-[#5B6F64] mt-0.5">
                {open ? 'Open 7 days a week' : 'Closed right now'}
              </span>
            </div>
          </div>

          {/* Card 2: Contact */}
          <div className="bg-white/95 rounded-[20px] border border-[#E7ECE4] p-5 sm:p-6 shadow-[0_2px_10px_rgba(12,68,41,0.04)] flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#E1EFDB] text-[#0D4A2C] flex items-center justify-center shrink-0">
              <Phone className="w-5.5 h-5.5" fill="currentColor" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <span className="block text-[13px] font-medium text-[#546B5F]">Contact</span>
              <a
                href={store?.phone ? `tel:${store.phone}` : '#'}
                className="block mt-0.5 text-[16px] sm:text-[17.5px] font-bold text-[#142D22] hover:text-[#0C4429] no-underline truncate"
              >
                {store?.phone || 'Not listed'}
              </a>
              <span className="block text-[12.5px] text-[#5B6F64] mt-0.5">
                We&apos;re here to help
              </span>
            </div>
          </div>

          {/* Card 3: Location Map */}
          <div className="md:col-span-2 lg:col-span-1 bg-white/95 rounded-[20px] border border-[#E7ECE4] p-4 sm:p-5 shadow-[0_2px_10px_rgba(12,68,41,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-[#142D22]">
                <MapPin className="w-4 h-4 text-[#0D4B2B]" fill="#0D4B2B" stroke="#FFFFFF" />
                <span>Location</span>
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#164A30] hover:underline no-underline"
              >
                <span>View on Google Maps</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
              </a>
            </div>

            <StoreLocationMiniMap store={store} directionsUrl={directionsUrl} />
          </div>
        </section>

        {/* ═══ TODAY'S AVAILABILITY & LEFTOVER PACKS ═══ */}
        <section className="mb-8">
          <div className="flex items-center gap-4 mb-3.5 lg:max-w-[770px]">
            <div className="inline-flex items-center gap-2.5 shrink-0">
              <BriefcaseBusiness className="w-5 h-5 text-[#0E4D2D]" strokeWidth={2.2} />
              <h2
                className="text-[25px] sm:text-[28px] font-bold text-[#143726] leading-none tracking-[-0.01em] m-0"
                style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
              >
                Today&apos;s Availability
              </h2>
            </div>
            <span className="h-px flex-1 bg-[#B8CEB6]" />
          </div>

          {leftoverPacks.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-2">
                  <TwinLeafIcon />
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-[#173A29] m-0">
                    Leftover Packs
                  </h3>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FBF2E1] border border-[#EFDFBF] px-3.5 py-1 text-[12.5px] font-medium italic text-[#9A5B13]"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0 not-italic" strokeWidth={2} />
                  <span>{leftoverPacks.length} packs remaining</span>
                </span>
              </div>

              <div className="space-y-4">
                {leftoverPacks.map((pack) => {
                  const pctText = formatDiscountPct(pack.discount_percentage)
                  const hasDiscount = Number(pack.discount_percentage) > 0
                  const hasOldPrice =
                    pack.original_price && Number(pack.original_price) > Number(pack.price)
                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className="group relative lg:max-w-[770px] rounded-[20px] border border-[#E3ECE1] bg-white overflow-hidden shadow-[0_6px_22px_rgba(12,68,41,0.06)] hover:shadow-[0_10px_28px_rgba(12,68,41,0.1)] hover:border-[#C5DEC6] transition-all cursor-pointer p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      style={{
                        background:
                          'linear-gradient(135deg, #FFFFFF 58%, #EBF5E5 100%)',
                      }}
                    >
                      {/* Subtle soft organic bottom-right wave accent */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 320 90"
                        preserveAspectRatio="none"
                        className="absolute bottom-0 right-0 w-[62%] h-[68px] pointer-events-none opacity-65"
                      >
                        <path
                          d="M0,78 C95,28 210,85 320,18 L320,90 L0,90 Z"
                          fill="#DCECD5"
                        />
                      </svg>

                      {/* Left Image + Discount Badge */}
                      <div className="relative z-10 w-full sm:w-[192px] h-[160px] sm:h-[124px] rounded-[14px] overflow-hidden shrink-0 bg-[#EFF5EC]">
                        <Image
                          src={pack.image || '/stores/store_fallback.jpg'}
                          alt={pack.name}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, 192px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 rounded-full bg-[#114A2C] text-white text-[12px] font-bold px-2.5 py-1 shadow-sm leading-none">
                            -{pctText}%
                          </span>
                        )}
                      </div>

                      {/* Middle Title + Quantity + Price */}
                      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center gap-2.5">
                        <h4
                          className="text-[20px] sm:text-[21px] font-bold text-[#142E22] leading-tight m-0 truncate"
                          style={{
                            fontFamily: 'var(--font-newsreader), Georgia, serif',
                          }}
                        >
                          {pack.name}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {pack.weight_quantity && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] border border-[#D8E2D6] bg-white text-[12.5px] font-bold text-[#193327] leading-none">
                              {pack.weight_quantity}
                            </span>
                          )}
                          <span
                            className={`text-[13px] font-semibold ${pack.stock > 0 ? 'text-[#1B5E38]' : 'text-[#D14343]'
                              }`}
                          >
                            {pack.stock > 0 ? `${pack.stock} available` : 'Sold out'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2.5">
                          {hasOldPrice && (
                            <span className="text-[14px] text-[#7D8F85] line-through">
                              €{Number(pack.original_price).toFixed(2)}
                            </span>
                          )}
                          <span className="text-[18px] sm:text-[19px] font-extrabold text-[#143D28]">
                            €{Number(pack.price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Right Reserve CTA Pill */}
                      <div className="relative z-10 shrink-0 sm:pr-2">
                        <button
                          type="button"
                          disabled={pack.stock <= 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPack(pack)
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0E4D2D] hover:bg-[#093A21] text-white border-none px-6 py-3 text-[13.5px] font-semibold shadow-[0_6px_16px_rgba(14,77,45,0.22)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Calendar className="w-4 h-4 shrink-0" strokeWidth={2} />
                          <span>{pack.stock > 0 ? 'Reserve Now' : 'Sold Out'}</span>
                          <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : availability.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {availability.map((item) => (
                <div
                  key={item.category}
                  className="px-5 py-3.5 rounded-[16px] bg-white border border-[#E6EDE2] shadow-[0_2px_10px_rgba(12,68,41,0.04)] flex items-center gap-3"
                >
                  <span className="w-10 h-10 rounded-full bg-[#EAF3E7] flex items-center justify-center shrink-0">
                    <AvailIcon name={item.icon} size={20} />
                  </span>
                  <span className="text-sm font-bold text-[#142D22]">{item.category}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* ═══ BOTTOM 4-FEATURE TRUST BAR ═══ */}
        <section className="rounded-[20px] bg-[#E8EFE0] border border-[#DCE6D3] px-5 sm:px-8 py-4 sm:py-5 grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 lg:divide-x lg:divide-[#CAD9C2]">
          {TRUST_HIGHLIGHTS.map(({ Icon, title, subtitle }, idx) => (
            <div
              key={title}
              className={`flex items-center gap-3.5 ${idx > 0 ? 'lg:pl-6' : ''}`}
            >
              <Icon className="w-7 h-7 text-[#0E4D2D] shrink-0" strokeWidth={2} />
              <div className="min-w-0">
                <p className="m-0 text-[14.5px] sm:text-[15px] font-bold text-[#142D22] leading-tight truncate">
                  {title}
                </p>
                <p className="mt-0.5 mb-0 text-[12.5px] text-[#4C6457] leading-tight truncate">
                  {subtitle}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
