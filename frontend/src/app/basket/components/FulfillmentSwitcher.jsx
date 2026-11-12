'use client'

import { Truck, Store, Clock, MapPin, PackageCheck, AlertCircle } from 'lucide-react'
import { isStoreOpen } from '@/lib/stores-api'

const MODES = [
  { id: 'delivery', label: 'Home Delivery' },
  { id: 'collect', label: 'Click & Collect' },
]

function InlineError({ message }) {
  return (
    <div className="mt-3 p-3 rounded-xl text-xs flex items-center gap-2 bg-[#FFF5F5] border border-[#FECACA] text-[#B91C1C]">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
    </div>
  )
}

function DeliveryPanel({ data, error }) {
  if (error) return <InlineError message={error} />

  const isFree = !data || !data.is_active || data.charge_type === 'free'
  const fee = isFree ? 0 : Number(data.flat_fee)
  const isThresh = data?.charge_type === 'threshold'
  const threshold = isThresh ? Number(data.free_threshold) : null

  return (
    <div className="mt-3 p-3.5 rounded-[14px] flex items-center gap-3 bg-[#EDF2E6] border border-[#DDE6D0]">
      <div className="w-9 h-9 rounded-full bg-white border border-[#D4E0C8] flex items-center justify-center shrink-0">
        <Truck className="w-4 h-4 text-[#0B462B]" />
      </div>
      <div>
        <p className="font-semibold text-[13.5px] text-[#142D1E]">Home Delivery</p>
        {isFree || fee === 0 ? (
          <p className="text-[12px] font-medium text-[#1D5C38]">Free farm-fresh doorstep delivery</p>
        ) : (
          <p className="text-[12px] font-medium text-[#1D5C38]">
            Delivery charge: €{fee.toFixed(2)}
            {isThresh && threshold ? (
              <span className="text-[#566A5D]"> (free over €{threshold.toFixed(2)})</span>
            ) : null}
          </p>
        )}
      </div>
    </div>
  )
}

function CollectPanel({ data, error }) {
  if (error) return <InlineError message={error} />

  const distanceText = data?.distance_km != null ? `${data.distance_km} km away` : null
  const readyMins = data?.collect_ready_minutes ?? 120
  const readyLabel =
    readyMins >= 60
      ? `≈ ${readyMins / 60} hour${readyMins / 60 !== 1 ? 's' : ''}`
      : `≈ ${readyMins} min`
  const isOpen = data ? isStoreOpen(data) : false

  return (
    <div className="mt-3 rounded-[14px] overflow-hidden border border-[#DCE4D3] bg-white">
      <div className="px-4 py-3 flex items-center gap-3 bg-[#EDF2E6] border-b border-[#DCE4D3]">
        <Store className="w-5 h-5 text-[#0B462B] shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-[13.5px] truncate text-[#142D1E]">
            {data ? `${data.name} — ${data.address}` : 'Nearest El Árbol Store'}
          </p>
          <p className="text-[12px] text-[#586A5F]">
            {data ? data.city : ''}
            {distanceText ? ` · ${distanceText}` : ''}
          </p>
        </div>
        {data && (
          <span
            className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
            style={
              isOpen
                ? { background: '#DCEFD3', color: '#195A36' }
                : { background: '#FDE8E8', color: '#9B1C1C' }
            }
          >
            {isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        )}
      </div>

      {data?.hours && (
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#EEF2E8]">
          <Clock className="w-4 h-4 text-[#586A5F] shrink-0" />
          <span className="text-xs text-[#586A5F]">
            Opening hours: <span className="font-semibold text-[#14261B]">{data.hours}</span>
          </span>
          {data.map_link && (
            <a
              href={data.map_link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[11.5px] font-semibold flex items-center gap-1 shrink-0 text-[#0B462B] hover:underline"
            >
              <MapPin className="w-3.5 h-3.5" />
              Directions
            </a>
          )}
        </div>
      )}

      <div className="px-4 py-2.5 flex items-center gap-2 bg-[#F5F8F0]">
        <PackageCheck className="w-4 h-4 text-[#0B462B] shrink-0" />
        <p className="text-xs text-[#3D4E42]">
          Your order will be ready for collection in{' '}
          <span className="font-bold text-[#0B462B]">{readyLabel}</span>.
          {data?.sms_notification ? " We'll send you an SMS when it's ready." : ''}
        </p>
      </div>
    </div>
  )
}

export default function FulfillmentSwitcher({
  fulfillment,
  setFulfillment,
  initialDelivery = null,
  initialStore = null,
}) {
  const deliveryError = !initialDelivery ? 'Could not load delivery info.' : null
  const storeError = !initialStore ? 'Could not load store info.' : null

  return (
    <div className="rounded-[20px] bg-[#FAFBF6] border border-[#E2E6DA] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className="text-[17px] font-bold text-[#142D1E]"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
        >
          Fulfillment Option
        </span>
        <div className="inline-flex p-1 rounded-full bg-[#EAEFE2] border border-[#DCE4D3]">
          {MODES.map((mode) => {
            const active = fulfillment === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setFulfillment(mode.id)}
                className="px-3.5 sm:px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                style={{
                  background: active ? '#0B462B' : 'transparent',
                  color: active ? '#FFFFFF' : '#354A3B',
                }}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      <div key={fulfillment} className="basket-fade-slide">
        {fulfillment === 'delivery' ? (
          <DeliveryPanel data={initialDelivery} error={deliveryError} />
        ) : (
          <CollectPanel data={initialStore} error={storeError} />
        )}
      </div>
    </div>
  )
}
