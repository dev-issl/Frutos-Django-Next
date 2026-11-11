'use client'
// src/app/stores/LeafletMap.jsx

import { useEffect, useRef, useCallback, useState } from 'react'
import { Plus, Minus, LocateFixed } from 'lucide-react'

const TILE_LAYERS = {
  map: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
}

function buildTeardropIcon(L, isActive) {
  const width = isActive ? 42 : 34
  const height = isActive ? 52 : 42
  const fill = isActive ? '#085041' : '#2E6D5A'

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${width}px;height:${height}px;
      display:flex;align-items:center;justify-content:center;
      filter:drop-shadow(0 2px 4px rgba(8,80,65,${isActive ? '0.24' : '0.16'}));
      transform:${isActive ? 'scale(1.06)' : 'scale(1)'};
      transition:transform 0.18s ease;
      cursor:pointer;
    ">
      <svg width="${width}" height="${height}" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2.5C10.89 2.5 3.5 9.89 3.5 19c0 11.15 13.45 24.48 15.63 26.55a1.25 1.25 0 0 0 1.74 0C23.05 43.48 36.5 30.15 36.5 19 36.5 9.89 29.11 2.5 20 2.5Z"
          fill="${fill}" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="20" cy="18.5" r="8.8" fill="rgba(255,255,255,0.14)"/>
        <path d="M20 24.5V16.8M20 19.8c0-3.3 2.5-5.6 5.8-5.8 0 3.3-2.3 5.8-5.8 5.8ZM20 22c-3.1 0-5.4-2.1-5.4-5.2 2.9.1 5.4 2.1 5.4 5.2Z"
          stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [width, height],
    iconAnchor: [Math.round(width / 2), height - 3],
    tooltipAnchor: [0, -Math.round(height * 0.78)],
  })
}

export default function LeafletMap({
  stores = [],
  activeStoreId,
  userLocation,
  onStoreClick,
  onLocateMe,
  locationLoading = false,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)
  const markersRef = useRef({})
  const userMarkerRef = useRef(null)
  const destroyedRef = useRef(false)
  const [mapLayer, setMapLayer] = useState('map')

  const refreshMarkers = useCallback(
    (L, map) => {
      Object.values(markersRef.current).forEach((m) => map.removeLayer(m))
      markersRef.current = {}

      if (!Array.isArray(stores) || stores.length === 0) return

      stores.forEach((store) => {
        if (store.lat == null || store.lng == null) return
        const isActive = store.id === activeStoreId
        const marker = L.marker([store.lat, store.lng], {
          icon: buildTeardropIcon(L, isActive),
          zIndexOffset: isActive ? 500 : 0,
        })
          .addTo(map)
          .on('click', () => onStoreClick?.(store.id))

        marker.bindTooltip(store.shortName || store.name, {
          permanent: false,
          direction: 'top',
          className: 'leaflet-store-tooltip',
          offset: [0, -2],
        })

        markersRef.current[store.id] = marker
      })
    },
    [stores, activeStoreId, onStoreClick]
  )

  // Initialise Leaflet once
  useEffect(() => {
    if (!containerRef.current) return
    destroyedRef.current = false

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const style = document.createElement('style')
      style.textContent = `
        .leaflet-store-tooltip {
          background: #085041; color: #fff; border: none;
          border-radius: 999px; padding: 5px 11px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
          box-shadow: 0 4px 12px rgba(8,80,65,0.28);
        }
        .leaflet-store-tooltip::before { display: none; }
        .leaflet-control-attribution {
          font-size: 9px; opacity: 0.65; background: rgba(255,255,255,0.75) !important;
          border-radius: 6px; padding: 1px 6px !important; margin: 6px !important;
        }
      `
      document.head.appendChild(style)
    }

    const initMap = (L) => {
      if (destroyedRef.current || mapRef.current || !containerRef.current) return
      try {
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const activeInitial = stores?.find((s) => s.id === activeStoreId) || stores?.[0]
        const center = userLocation
          ? [userLocation.lat, userLocation.lng]
          : activeInitial?.lat != null && activeInitial?.lng != null
            ? [activeInitial.lat, activeInitial.lng]
            : [40.38, -3.76]

        const map = L.map(containerRef.current, {
          center,
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        })

        L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)

        const tileConfig = TILE_LAYERS[mapLayer] || TILE_LAYERS.map
        tileLayerRef.current = L.tileLayer(tileConfig.url, {
          attribution: tileConfig.attribution,
        }).addTo(map)

        mapRef.current = map
        refreshMarkers(L, map)

        if (userLocation) {
          userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 8,
            fillColor: '#57A12A',
            color: '#FFFFFF',
            weight: 3,
            fillOpacity: 1,
          })
            .addTo(map)
            .bindTooltip('You are here', { className: 'leaflet-store-tooltip' })
        }
      } catch (err) {
        console.error('[LeafletMap] init error:', err)
      }
    }

    if (window.L) {
      initMap(window.L)
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => initMap(window.L)
      script.onerror = () => console.error('[LeafletMap] Failed to load Leaflet JS')
      document.head.appendChild(script)
    } else {
      const poll = setInterval(() => {
        if (window.L) {
          clearInterval(poll)
          initMap(window.L)
        }
      }, 50)
      setTimeout(() => clearInterval(poll), 10_000)
    }

    return () => {
      destroyedRef.current = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        tileLayerRef.current = null
        markersRef.current = {}
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Swap tile layer smoothly when toggling Map | Satellite
  useEffect(() => {
    const map = mapRef.current
    const L = window.L
    if (!map || !L) return
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }
    const tileConfig = TILE_LAYERS[mapLayer] || TILE_LAYERS.map
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
    }).addTo(map)
  }, [mapLayer])

  // Update markers and smoothly pan to active store
  useEffect(() => {
    if (!mapRef.current || !window.L) return
    refreshMarkers(window.L, mapRef.current)
    const active = stores?.find((s) => s.id === activeStoreId)
    if (active?.lat != null && active?.lng != null) {
      mapRef.current.panTo([active.lat, active.lng], { animate: true })
    }
  }, [activeStoreId, stores, refreshMarkers])

  // User location dot
  useEffect(() => {
    if (!mapRef.current || !window.L || !userLocation) return
    if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current)
    userMarkerRef.current = window.L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      fillColor: '#57A12A',
      color: '#FFFFFF',
      weight: 3,
      fillOpacity: 1,
    })
      .addTo(mapRef.current)
      .bindTooltip('You are here', { className: 'leaflet-store-tooltip' })
    mapRef.current.setView([userLocation.lat, userLocation.lng], 12, { animate: true })
  }, [userLocation])

  const handleLocateClick = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13, { animate: true })
    }
    onLocateMe?.()
  }

  return (
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[340px] rounded-[12px] sm:rounded-[14px] overflow-hidden bg-[#E7F2EA]">
      <div ref={containerRef} className="w-full h-full min-h-[260px] sm:min-h-[340px]" />

      {/* Top-right Map | Satellite Segmented Control */}
      <div
        className="absolute top-3.5 right-3.5 z-[450] inline-flex items-center rounded-full p-1 bg-white/95 backdrop-blur-sm border border-[#D3E5D8]"
        role="group"
        aria-label="Map layer view"
      >
        {[
          { key: 'map', label: 'Map' },
          { key: 'satellite', label: 'Satellite' },
        ].map((item) => {
          const active = mapLayer === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMapLayer(item.key)}
              className={`px-3.5 py-1 rounded-full text-[11.5px] font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#085041] text-white'
                  : 'text-[#1D3C31] hover:bg-[#EDF5EF]'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Bottom-right Zoom (+ / -) & Locate Controls */}
      <div className="absolute bottom-3.5 right-3.5 z-[450] flex flex-col items-center gap-2">
        <div className="flex flex-col bg-white/95 backdrop-blur-sm rounded-[12px] border border-[#D3E5D8] overflow-hidden">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
            className="w-9 h-9 flex items-center justify-center text-[#085041] hover:bg-[#EDF5EF] active:bg-[#DFECE3] transition-colors border-b border-[#E5EFE8] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.25]" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
            className="w-9 h-9 flex items-center justify-center text-[#085041] hover:bg-[#EDF5EF] active:bg-[#DFECE3] transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4 stroke-[2.25]" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleLocateClick}
          aria-label="Center map on my location"
          title="My location"
          className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-[#D3E5D8] flex items-center justify-center text-[#085041] hover:bg-[#EDF5EF] active:bg-[#DFECE3] transition-colors cursor-pointer"
        >
          <LocateFixed className={`w-4 h-4 stroke-[2.1] ${locationLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}
