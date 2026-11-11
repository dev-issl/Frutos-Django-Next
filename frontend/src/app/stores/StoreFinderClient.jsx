'use client'
// src/app/stores/StoreFinderClient.jsx

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Search,
  Send,
  Crosshair,
  Store,
  Leaf,
  ArrowRight,
  X,
} from 'lucide-react'
import {
  haversineDistance,
  sortStoresByDistance,
  formatDistance,
  getStoreStatusInfo,
  FEATURE_LABELS,
} from '@/lib/stores-api'
import { StoresHeroShell } from './StoresHero'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] rounded-[14px] bg-[#E7F2EA] animate-pulse flex items-center justify-center">
      <span className="text-sm font-medium text-[#085041]/70">Loading store map…</span>
    </div>
  ),
})

const DISTANCE_OPTIONS = [
  { value: 2, label: '2 km', Icon: Send },
  { value: 5, label: '5 km', Icon: Crosshair },
  { value: 10, label: '10 km', Icon: Store },
]

function StoreThumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = !failed && src ? src : '/stores/store_fallback.jpg'

  return (
    <div className="w-[64px] sm:w-[86px] h-[72px] sm:h-[88px] rounded-[9px] sm:rounded-[10px] overflow-hidden shrink-0 bg-[#E8F3EC] border border-[#DCE8DF] relative">
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 64px, 86px"
        onError={() => setFailed(true)}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  )
}

function FeatureTag({ featureKey }) {
  if (featureKey === 'organic') {
    return (
      <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E3F3E8] text-[#175B38] text-[9.5px] sm:text-[10.5px] font-semibold whitespace-nowrap">
        <Leaf className="w-2.5 h-2.5 text-[#3E8E22] shrink-0" />
        <span>{FEATURE_LABELS[featureKey] || 'Organic'}</span>
      </span>
    )
  }

  if (featureKey === 'leftoverPack') {
    return (
      <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FFF2D9] text-[#8E5400] text-[9.5px] sm:text-[10.5px] font-semibold whitespace-nowrap">
        <span>{FEATURE_LABELS[featureKey] || 'Leftover Pack'}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-[#EFF7F2] text-[#285E45] text-[9.5px] sm:text-[10.5px] font-semibold whitespace-nowrap">
      {FEATURE_LABELS[featureKey] || featureKey}
    </span>
  )
}

function StoreCard({ store, isActive, distanceKm, onSelect }) {
  const statusInfo = getStoreStatusInfo(store)
  const distText = formatDistance(distanceKm)
  const features = Array.isArray(store.features) ? store.features : []
  const displayFeatures = [...features]
    .sort((a, b) => {
      const rank = (k) => (k === 'organic' ? 0 : k === 'leftoverPack' ? 1 : 2)
      return rank(a) - rank(b)
    })
    .slice(0, 2)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(store.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(store.id)
        }
      }}
      aria-pressed={isActive}
      className={`group rounded-[12px] sm:rounded-[14px] p-2 sm:p-3 border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#085041] ${
        isActive
          ? 'border-[#085041] bg-[#F6FCF8]'
          : 'border-[#E1EDE5] bg-white hover:border-[#9EC4AE]'
      }`}
    >
      <div className="flex gap-2.5 sm:gap-3 items-stretch">
        <StoreThumbnail src={store.image} alt={store.name} />

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0 sm:py-0.5">
          <div>
            <h3
              className="text-[14px] sm:text-[15.5px] font-bold leading-[1.2] text-[#085041] truncate"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              {store.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] sm:text-[11px] text-[#536F63] min-w-0">
              <MapPin className="w-3 h-3 text-[#085041]/60 shrink-0" />
              <span className="truncate">
                {store.address}
                {store.city ? `, ${store.city}` : ''}
              </span>
            </p>
          </div>

          {(displayFeatures.length > 0 || distText) && (
            <div className="mt-1 sm:mt-1.5 flex items-center justify-between gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1 flex-nowrap sm:flex-wrap overflow-hidden min-w-0">
                {displayFeatures.map((feat) => (
                  <FeatureTag key={feat} featureKey={feat} />
                ))}
              </div>

              {distText && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E7F3EB] text-[#1D5C39] text-[9.5px] sm:text-[10.5px] font-semibold whitespace-nowrap shrink-0">
                  {distText}
                </span>
              )}
            </div>
          )}

          <div className="mt-1 sm:mt-1.5 flex items-center justify-between gap-1.5 sm:gap-2 pt-0.5">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[10.5px] font-medium min-w-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusInfo.isOpen ? '#2E8B57' : '#D9383A' }}
              />
              <span className="truncate text-[#2B493D]">{statusInfo.text}</span>
            </div>

            <Link
              href={`/stores/${store.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 bg-[#085041] hover:bg-[#063B30] active:scale-[0.98] text-white text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3 py-1 rounded-full transition-colors shrink-0 whitespace-nowrap"
            >
              <span>View Details</span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StoreFinderClient({ initialStores = [], embedded = false }) {
  const [userLocation, setUserLocation] = useState(null)
  const [activeStoreId, setActiveStoreId] = useState(
    Array.isArray(initialStores) ? (initialStores[0]?.id ?? null) : null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [distanceFilter, setDistanceFilter] = useState(null)
  const [showLeftoverOnly, setShowLeftoverOnly] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const geoRequested = useRef(false)

  const requestUserLocation = useCallback(
    (forcePrompt = false) => {
      if (typeof window === 'undefined' || !navigator.geolocation) return
      if (!forcePrompt && geoRequested.current) return
      geoRequested.current = true

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc = { lat: coords.latitude, lng: coords.longitude }
          const sorted = sortStoresByDistance(initialStores, loc.lat, loc.lng)
          setUserLocation(loc)
          if (sorted[0]?.id) {
            setActiveStoreId(sorted[0].id)
          }
          setLocationLoading(false)
        },
        () => {
          geoRequested.current = false
          setLocationLoading(false)
        },
        { timeout: 8000 }
      )
    },
    [initialStores]
  )

  useEffect(() => {
    requestUserLocation(false)
  }, [requestUserLocation])

  const handleManualLocate = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocationLoading(true)
    }
    requestUserLocation(true)
  }, [requestUserLocation])

  const handleDistanceSelect = useCallback(
    (val) => {
      setDistanceFilter((prev) => (prev === val ? null : val))
      if (val !== null && !userLocation) {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          setLocationLoading(true)
        }
        requestUserLocation(true)
      }
    },
    [userLocation, requestUserLocation]
  )

  const sortedStores = useMemo(() => {
    if (!Array.isArray(initialStores)) return []
    if (!userLocation) return initialStores
    return sortStoresByDistance(initialStores, userLocation.lat, userLocation.lng)
  }, [initialStores, userLocation])

  const distancesById = useMemo(() => {
    const map = new Map()
    if (!userLocation) return map
    for (const store of sortedStores) {
      if (store.lat != null && store.lng != null) {
        map.set(store.id, haversineDistance(userLocation.lat, userLocation.lng, store.lat, store.lng))
      }
    }
    return map
  }, [sortedStores, userLocation])

  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return sortedStores.filter((store) => {
      if (q) {
        const matchesSearch =
          store.name?.toLowerCase().includes(q) ||
          store.city?.toLowerCase().includes(q) ||
          store.address?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (distanceFilter !== null && userLocation) {
        const dist = distancesById.get(store.id)
        if (dist != null && dist > distanceFilter) return false
      }
      if (showLeftoverOnly) {
        if (!Array.isArray(store.features) || !store.features.includes('leftoverPack')) {
          return false
        }
      }
      return true
    })
  }, [sortedStores, searchQuery, distanceFilter, userLocation, distancesById, showLeftoverOnly])

  const activeStore = useMemo(
    () => filteredStores.find((s) => s.id === activeStoreId) ?? filteredStores[0] ?? null,
    [filteredStores, activeStoreId]
  )

  const handleResetFilters = () => {
    setSearchQuery('')
    setDistanceFilter(null)
    setShowLeftoverOnly(false)
  }

  const finderSection = (
        <section className="max-w-[1320px] mx-auto px-2.5 sm:px-6 lg:px-8 pb-6 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[365px_1fr] xl:grid-cols-[380px_1fr] gap-3.5 sm:gap-5 items-stretch">
            {/* LEFT COLUMN: Search, Filters & Store Cards */}
            <aside className="bg-white rounded-[16px] sm:rounded-[20px] border border-[#DCE8DF] p-2.5 sm:p-4 flex flex-col lg:h-[515px] xl:h-[535px]">
              {/* Search Input */}
              <form onSubmit={(e) => e.preventDefault()} role="search">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F4F8F5] border border-[#DCE8DF] focus-within:border-[#085041] focus-within:bg-white rounded-full p-0.5 sm:p-1 pl-3 sm:pl-3.5 transition-colors">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#085041]/60 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by city or street..."
                    aria-label="Search stores by city or street"
                    className="flex-1 min-w-0 bg-transparent text-[12.5px] sm:text-[13px] text-[#0D2C23] placeholder:text-[#6B8579] outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="p-1 text-[#6B8579] hover:text-[#085041] transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    aria-label="Search stores"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#085041] hover:bg-[#063E32] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                </div>
              </form>

              {/* 3 Distance Filter Pills (2 km | 5 km | 10 km) */}
              <div className="mt-2 sm:mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
                {DISTANCE_OPTIONS.map(({ value, label, Icon }) => {
                  const isSelected = distanceFilter === value
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleDistanceSelect(value)}
                      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-full border text-[11px] sm:text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#085041] text-white border-[#085041]'
                          : 'bg-white text-[#1E3F33] border-[#CBE0D1] hover:border-[#085041]/55 hover:bg-[#F5FAF6]'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Leftover Pack Toggle */}
              <div className="py-2 sm:py-3 mt-1 sm:mt-1.5 border-b border-[#EAF1EC]">
                <button
                  type="button"
                  role="switch"
                  aria-checked={showLeftoverOnly}
                  onClick={() => setShowLeftoverOnly((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 sm:gap-3 text-left cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#085041] shrink-0" />
                    <span className="text-[12px] sm:text-[12.5px] font-medium text-[#18382C] group-hover:text-[#085041] transition-colors">
                      Show stores with Leftover Pack
                    </span>
                  </span>

                  <span
                    className={`relative inline-flex h-[18px] w-8 sm:h-5 sm:w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${
                      showLeftoverOnly ? 'bg-[#1B5E3F]' : 'bg-[#C4D8CA]'
                    }`}
                  >
                    <span
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-white transition-transform duration-200 ${
                        showLeftoverOnly ? 'translate-x-3.5 sm:translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </span>
                </button>
              </div>

              {/* Store Cards List */}
              <div className="stores-scroll flex-1 overflow-y-auto pt-2 sm:pt-3 space-y-2 sm:space-y-2.5 pr-1.5 max-h-[300px] sm:max-h-[440px] lg:max-h-none">
                {filteredStores.length === 0 ? (
                  <div className="py-10 px-4 text-center rounded-[14px] bg-[#F7FBF8] border border-dashed border-[#CFE2D5]">
                    <MapPin className="w-7 h-7 text-[#085041]/50 mx-auto mb-2" />
                    <p className="text-[14px] font-semibold text-[#085041] mb-1">
                      No stores match your filters
                    </p>
                    <p className="text-[12px] text-[#557166] mb-4">
                      Try expanding your distance radius or clearing active filters.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-1.5 rounded-full bg-[#E3F3E8] hover:bg-[#D2EAD9] text-[#085041] text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  filteredStores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      isActive={activeStore?.id === store.id}
                      distanceKm={distancesById.get(store.id) ?? null}
                      onSelect={setActiveStoreId}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* RIGHT COLUMN: Framed Interactive Map */}
            <div className="bg-white rounded-[16px] sm:rounded-[20px] border border-[#DCE8DF] p-1.5 sm:p-2 h-[290px] sm:h-[460px] lg:h-[515px] xl:h-[535px]">
              <LeafletMap
                stores={filteredStores}
                activeStoreId={activeStore?.id}
                userLocation={userLocation}
                onStoreClick={setActiveStoreId}
                onLocateMe={handleManualLocate}
                locationLoading={locationLoading}
              />
            </div>
          </div>
        </section>
  )

  return embedded ? finderSection : <StoresHeroShell>{finderSection}</StoresHeroShell>
}
