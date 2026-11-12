'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Check, Bookmark, UserCheck, CalendarClock, ChevronDown } from 'lucide-react'

const INPUT_CLASS =
  'w-full h-[42px] px-4 rounded-full text-[13.5px] bg-[#FAFBF6] border border-[#DDE2D5] text-[#14261B] placeholder:text-[#8E9B92] outline-none transition-colors focus:border-[#0B462B] focus:bg-white'

export default function DeliverySection({
  form,
  setForm,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  deliveryDates,
  deliverySlots,
  prefilled = false,
  savedAddresses = [],
  onApplyAddress = () => {},
  isAuthenticated = false,
  isInternalWholesale = false,
  onSaveAddress = null,
}) {
  const [addressSavedNotice, setAddressSavedNotice] = useState(false)

  function handleAddressSelect(e) {
    const id = e.target.value
    if (!id) return
    const addr = savedAddresses.find((a) => String(a.id) === id)
    if (addr) {
      onApplyAddress(addr)
    }
  }

  async function handleSaveAddressClick() {
    if (onSaveAddress) {
      await onSaveAddress()
    }
    setAddressSavedNotice(true)
    setTimeout(() => setAddressSavedNotice(false), 2500)
  }

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-white border border-[#E2E6DA] shadow-[0_10px_30px_-12px_rgba(18,45,28,0.1)] p-6 sm:p-7">
      {/* Bottom-right subtle botanical leaves accent */}
      <div
        className="pointer-events-none absolute -bottom-3 -right-3 w-44 h-36 opacity-80 rotate-180 z-0"
        style={{
          backgroundImage: 'url(/ui/botanical-leaves-tr.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'top right',
          mixBlendMode: 'multiply',
        }}
        aria-hidden="true"
      />

      {/* Card Heading */}
      <div className="relative z-10 flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#0B462B]" />
            <h2
              className="text-[22px] font-bold text-[#142D1E]"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              Delivery Address
            </h2>
          </div>
          <p
            className="text-[13.5px] italic text-[#4E6455] mt-0.5 pl-7"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Enter your delivery address
          </p>
        </div>

        {prefilled && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F2DE] border border-[#CFE4C4] text-[#1A5D38] text-[11.5px] font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Filled from profile</span>
          </div>
        )}
      </div>

      {/* Saved Address Switcher */}
      {savedAddresses.length > 0 && (
        <div className="relative z-10 mb-5 p-3.5 rounded-[14px] flex items-center justify-between gap-3 flex-wrap bg-[#F2F6EB] border border-dashed border-[#C7D8BC]">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-[#0B462B] shrink-0" />
            <p className="text-[13px] truncate text-[#33483A]">
              {savedAddresses.length === 1
                ? `Using: ${savedAddresses[0].label} — ${savedAddresses[0].street}`
                : `${savedAddresses.length} saved addresses`}
            </p>
          </div>

          {savedAddresses.length > 1 ? (
            <div className="relative shrink-0">
              <select
                onChange={handleAddressSelect}
                defaultValue=""
                className="cursor-pointer appearance-none pr-8 pl-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#0B462B] text-[#0B462B] outline-none"
              >
                <option value="" disabled>
                  Switch address
                </option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={String(addr.id)}>
                    {addr.label} — {addr.street}, {addr.city}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#0B462B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCEFD3] text-[#1A5D38]">
              Default
            </span>
          )}
        </div>
      )}

      {/* 2-Column Split: Form Left + Map & "We Deliver To" Right */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form Inputs */}
        <div className="md:col-span-7 space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
              Full Name <span className="text-[#0B462B]">*</span>
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
              Email Address <span className="text-[#0B462B]">*</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              readOnly={isAuthenticated && !!form.email}
              className={`${INPUT_CLASS} ${
                isAuthenticated && form.email ? 'bg-[#EFF3EA] cursor-not-allowed' : ''
              }`}
            />
            {!isAuthenticated && (
              <p className="text-[11px] mt-1 text-[#5E7164]">Order confirmation will be sent here.</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
              Street Address <span className="text-[#0B462B]">*</span>
            </label>
            <input
              type="text"
              placeholder="123 Green Park Street"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
                City <span className="text-[#0B462B]">*</span>
              </label>
              <input
                type="text"
                placeholder="Madrid"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
                Postcode <span className="text-[#0B462B]">*</span>
              </label>
              <input
                type="text"
                placeholder="28014"
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
              Phone Number <span className="text-[#0B462B]">*</span>
            </label>
            <input
              type="tel"
              placeholder="+34 600 123 456"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="pt-1 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSaveAddressClick}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#1E5638] bg-white hover:bg-[#ECF2E5] active:scale-[0.98] text-[#144229] text-[13px] font-semibold transition-all cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Address</span>
            </button>
            {addressSavedNotice && (
              <span className="text-[12px] font-semibold text-[#1A5D38] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Address ready for delivery
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Seamless Isometric Map + "We Deliver To" Panel */}
        <div className="md:col-span-5 space-y-3.5">
          <div
            className="relative aspect-[16/10] w-full overflow-hidden bg-white"
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 92% 88% at 50% 50%, #000 58%, rgba(0,0,0,0.45) 82%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 92% 88% at 50% 50%, #000 58%, rgba(0,0,0,0.45) 82%, transparent 100%)',
            }}
          >
            <Image
              src="/ui/delivery-map-card.jpg"
              alt="Delivery coverage area map"
              fill
              sizes="(max-width: 768px) 100vw, 290px"
              className="object-cover"
            />
          </div>

          <div className="rounded-[16px] bg-[#ECF1E4] border border-[#DCE5D1] p-4 space-y-2.5">
            <h3 className="text-[14.5px] font-bold text-[#142D1E]">We Deliver To</h3>
            <ul className="space-y-2 text-[12.5px] text-[#2F4636]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1B5E38] shrink-0" />
                <span>{form.city ? `${form.city} & Surrounding Areas` : 'All Local & Surrounding Areas'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1B5E38] shrink-0" />
                <span>Fresh Delivery Guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1B5E38] shrink-0" />
                <span>On-Time Delivery</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delivery Window Picker */}
      {!isInternalWholesale && (
        <div className="relative z-10 mt-7 pt-6 border-t border-[#E8ECE2]">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-[#0B462B]" />
            <h3 className="text-[12px] uppercase tracking-[0.16em] font-bold text-[#0B462B]">
              Delivery Window
            </h3>
          </div>

          {deliveryDates.length > 0 ? (
            <div className="flex gap-2.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {deliveryDates.map((d, i) => {
                const active = selectedDate === i
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(i)}
                    className="px-4 py-2 rounded-full text-[13px] shrink-0 font-semibold transition-all cursor-pointer border"
                    style={{
                      background: active ? '#0B462B' : '#F3F5EC',
                      color: active ? '#FFFFFF' : '#2C4233',
                      borderColor: active ? '#0B462B' : '#DCE3D2',
                    }}
                  >
                    {d.label === 'Today' ? `Today, ${d.full}` : `${d.short}, ${d.full}`}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm mb-4 text-[#5A6D61]">No delivery dates available.</p>
          )}

          {deliverySlots.length > 0 ? (
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-4 gap-2.5">
              {deliverySlots.map((slot) => {
                const active = selectedSlot === String(slot.id)
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.is_available}
                    onClick={() => slot.is_available && setSelectedSlot(String(slot.id))}
                    className="p-3 rounded-[14px] text-center transition-all border"
                    style={{
                      borderColor: active ? '#0B462B' : '#E2E7DA',
                      background: active ? '#E8F1E1' : '#FAFBF6',
                      opacity: slot.is_available ? 1 : 0.45,
                      cursor: slot.is_available ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <span
                      className="block text-[10.5px] font-medium mb-0.5"
                      style={{ color: active ? '#1D5C38' : '#65786C' }}
                    >
                      {slot.label}
                    </span>
                    <span
                      className="block font-bold text-[12.5px]"
                      style={{ color: active ? '#0B462B' : '#14261B' }}
                    >
                      {slot.time}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[#5A6D61]">No time slots configured yet.</p>
          )}
        </div>
      )}
    </section>
  )
}
