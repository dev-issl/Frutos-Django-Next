// 'use client'
// // src/app/checkout/components/DeliverySection.jsx

// import { useState } from 'react'

// const INPUT_STYLE = {
//   background: '#f8faf8', border: '1px solid #e8eee8', color: '#151e13',
//   width: '100%', height: '44px', padding: '0 16px',
//   borderRadius: '8px', fontSize: '14px', outline: 'none',
// }

// function onFocus(e) { e.target.style.borderColor = '#00694c' }
// function onBlur(e)  { e.target.style.borderColor = '#e8eee8' }

// export default function DeliverySection({
//   form, setForm,
//   selectedDate, setSelectedDate,
//   selectedSlot, setSelectedSlot,
//   deliveryDates,
//   deliverySlots,
//   prefilled       = false,
//   savedAddresses  = [],
//   onApplyAddress  = () => {},
// }) {
//   const [showAddressPicker, setShowAddressPicker] = useState(false)

//   function handleAddressSelect(e) {
//     const id = e.target.value
//     if (!id) return
//     const addr = savedAddresses.find(a => String(a.id) === id)
//     if (addr) {
//       onApplyAddress(addr)
//       setShowAddressPicker(false)
//     }
//   }

//   return (
//     <section
//       className="p-6 md:p-8 rounded-xl"
//       style={{ background: '#fff', border: '1px solid #eaeaea', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
//     >
//       {/* ── Heading ── */}
//       <div className="flex items-start justify-between gap-4 mb-6 md:mb-8 flex-wrap">
//         <div className="flex items-center gap-3 flex-wrap">
//           <h2
//             className="text-2xl md:text-3xl italic"
//             style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}
//           >
//             Delivery Address
//           </h2>
//           <span
//             className="italic text-sm"
//             style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#8a9e93', opacity: 0.7 }}
//           >
//             — provenance for the path
//           </span>
//         </div>

//         {/* ── "Filled from profile" badge ── */}
//         {prefilled && (
//           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
//             style={{ background: '#edf7f2', border: '1px solid #b3e5d0' }}>
//             <span className="material-symbols-outlined"
//               style={{ fontSize: '14px', color: '#00694c', fontVariationSettings: "'FILL' 1" }}>
//               person_check
//             </span>
//             <span className="text-[11px] font-bold" style={{ color: '#00694c' }}>
//               Filled from your profile
//             </span>
//           </div>
//         )}
//       </div>

//       {/* ── Saved address switcher ── */}
//       {savedAddresses.length > 0 && (
//         <div className="mb-6 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap"
//           style={{ background: '#f5fbf7', border: '1px dashed #b3e5d0' }}>
//           <div className="flex items-center gap-2 min-w-0">
//             <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: '#00694c' }}>
//               location_on
//             </span>
//             <p className="text-sm truncate" style={{ color: '#3d4943' }}>
//               {savedAddresses.length === 1
//                 ? `Using: ${savedAddresses[0].label} — ${savedAddresses[0].street}`
//                 : `${savedAddresses.length} saved addresses`}
//             </p>
//           </div>

//           {savedAddresses.length > 1 ? (
//             <div className="relative flex-shrink-0">
//               <select
//                 onChange={handleAddressSelect}
//                 defaultValue=""
//                 className="cursor-pointer appearance-none pr-8 pl-3 py-1.5 rounded-lg text-xs font-bold"
//                 style={{
//                   background: '#fff', border: '1.5px solid #00694c',
//                   color: '#00694c', outline: 'none',
//                 }}
//               >
//                 <option value="" disabled>Switch address</option>
//                 {savedAddresses.map(addr => (
//                   <option key={addr.id} value={String(addr.id)}>
//                     {addr.label} — {addr.street}, {addr.city}
//                   </option>
//                 ))}
//               </select>
//               <span
//                 className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
//                 style={{ fontSize: '14px', color: '#00694c' }}>
//                 expand_more
//               </span>
//             </div>
//           ) : (
//             <span className="text-[11px] font-bold px-2 py-1 rounded-full"
//               style={{ background: '#d4ede5', color: '#00694c' }}>
//               Default
//             </span>
//           )}
//         </div>
//       )}

//       {/* ── Address fields ── */}
//       <div className="grid grid-cols-2 gap-4 md:gap-6">
//         <Field label="Full Name *" colSpan={2}>
//           <input
//             type="text" placeholder="Julian Vane"
//             value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
//             style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
//           />
//         </Field>

//         <Field label="Street Address *" colSpan={2}>
//           <input
//             type="text" placeholder="142 High Meadow Road"
//             value={form.street} onChange={e => setForm({ ...form, street: e.target.value })}
//             style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
//           />
//         </Field>

//         <Field label="City *" colSpan={1}>
//           <input
//             type="text" placeholder="Dublin"
//             value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
//             style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
//           />
//         </Field>

//         <Field label="Postcode *" colSpan={1}>
//           <input
//             type="text" placeholder="D01 F5P2"
//             value={form.postcode} onChange={e => setForm({ ...form, postcode: e.target.value })}
//             style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
//           />
//         </Field>

//         <Field label="Phone Number" colSpan={2}>
//           <input
//             type="tel" placeholder="+44 7700 900077"
//             value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
//             style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
//           />
//         </Field>
//       </div>

//       {/* ── Delivery Window ── */}
//       <div className="mt-8 md:mt-12">
//         <h3 className="text-[10px] uppercase tracking-widest font-bold mb-5" style={{ color: '#00694c' }}>
//           Delivery Window
//         </h3>

//         {deliveryDates.length > 0 ? (
//           <div className="flex gap-3 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
//             {deliveryDates.map((d, i) => {
//               const active = selectedDate === i
//               return (
//                 <button key={d.date} onClick={() => setSelectedDate(i)}
//                   className="px-5 md:px-6 py-3 rounded-full text-sm flex-shrink-0 font-bold transition-all cursor-pointer"
//                   style={{
//                     background: active ? '#d4ede5' : '#f0f4f0',
//                     color:      active ? '#095041' : '#3d4943',
//                     border:     active ? '1.5px solid #95d4bc' : '1.5px solid transparent',
//                   }}>
//                   {d.label === 'Today' ? `Today, ${d.full}` : `${d.short}, ${d.full}`}
//                 </button>
//               )
//             })}
//           </div>
//         ) : (
//           <p className="text-sm mb-5" style={{ color: '#6d7a73' }}>No delivery dates available.</p>
//         )}

//         {deliverySlots.length > 0 ? (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//             {deliverySlots.map(slot => {
//               const active = selectedSlot === String(slot.id)
//               return (
//                 <button key={slot.id} disabled={!slot.is_available}
//                   onClick={() => slot.is_available && setSelectedSlot(String(slot.id))}
//                   className="p-3 md:p-4 rounded-xl text-center transition-all"
//                   style={{
//                     border:     active ? '2px solid #00694c' : '1.5px solid #e8eee8',
//                     background: active ? 'rgba(0,105,76,0.05)' : '#fff',
//                     opacity:    slot.is_available ? 1 : 0.4,
//                     cursor:     slot.is_available ? 'pointer' : 'not-allowed',
//                   }}>
//                   <span className="block text-[10px] mb-1" style={{ color: active ? 'rgba(0,105,76,0.7)' : '#6d7a73' }}>
//                     {slot.label}
//                   </span>
//                   <span className="block font-bold text-xs md:text-sm" style={{ color: active ? '#00694c' : '#151e13' }}>
//                     {slot.time}
//                   </span>
//                 </button>
//               )
//             })}
//           </div>
//         ) : (
//           <p className="text-sm" style={{ color: '#6d7a73' }}>No time slots configured yet.</p>
//         )}
//       </div>
//     </section>
//   )
// }

// function Field({ label, colSpan, children }) {
//   return (
//     <div className={`col-span-${colSpan}`}>
//       <label className="block text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#6d7a73' }}>
//         {label}
//       </label>
//       {children}
//     </div>
//   )
// }


'use client'
// src/app/checkout/components/DeliverySection.jsx

import { useState } from 'react'

const INPUT_STYLE = {
  background: '#f8faf8', border: '1px solid #e8eee8', color: '#151e13',
  width: '100%', height: '44px', padding: '0 16px',
  borderRadius: '8px', fontSize: '14px', outline: 'none',
}

function onFocus(e) { e.target.style.borderColor = '#00694c' }
function onBlur(e)  { e.target.style.borderColor = '#e8eee8' }

export default function DeliverySection({
  form, setForm,
  selectedDate, setSelectedDate,
  selectedSlot, setSelectedSlot,
  deliveryDates,
  deliverySlots,
  prefilled       = false,
  savedAddresses  = [],
  onApplyAddress  = () => {},
  isAuthenticated = false,   // ✅ নতুন prop — CheckoutShell থেকে আসবে
}) {
  const [showAddressPicker, setShowAddressPicker] = useState(false)

  function handleAddressSelect(e) {
    const id = e.target.value
    if (!id) return
    const addr = savedAddresses.find(a => String(a.id) === id)
    if (addr) {
      onApplyAddress(addr)
      setShowAddressPicker(false)
    }
  }

  return (
    <section
      className="p-6 md:p-8 rounded-xl"
      style={{ background: '#fff', border: '1px solid #eaeaea', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
    >
      {/* ── Heading ── */}
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className="text-2xl md:text-3xl italic"
            style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}
          >
            Delivery Address
          </h2>
          <span
            className="italic text-sm"
            style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#8a9e93', opacity: 0.7 }}
          >
            — provenance for the path
          </span>
        </div>

        {prefilled && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: '#edf7f2', border: '1px solid #b3e5d0' }}>
            <span className="material-symbols-outlined"
              style={{ fontSize: '14px', color: '#00694c', fontVariationSettings: "'FILL' 1" }}>
              person_check
            </span>
            <span className="text-[11px] font-bold" style={{ color: '#00694c' }}>
              Filled from your profile
            </span>
          </div>
        )}
      </div>

      {/* ── Saved address switcher ── */}
      {savedAddresses.length > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap"
          style={{ background: '#f5fbf7', border: '1px dashed #b3e5d0' }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: '#00694c' }}>
              location_on
            </span>
            <p className="text-sm truncate" style={{ color: '#3d4943' }}>
              {savedAddresses.length === 1
                ? `Using: ${savedAddresses[0].label} — ${savedAddresses[0].street}`
                : `${savedAddresses.length} saved addresses`}
            </p>
          </div>

          {savedAddresses.length > 1 ? (
            <div className="relative flex-shrink-0">
              <select
                onChange={handleAddressSelect}
                defaultValue=""
                className="cursor-pointer appearance-none pr-8 pl-3 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: '#fff', border: '1.5px solid #00694c',
                  color: '#00694c', outline: 'none',
                }}
              >
                <option value="" disabled>Switch address</option>
                {savedAddresses.map(addr => (
                  <option key={addr.id} value={String(addr.id)}>
                    {addr.label} — {addr.street}, {addr.city}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ fontSize: '14px', color: '#00694c' }}>
                expand_more
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-bold px-2 py-1 rounded-full"
              style={{ background: '#d4ede5', color: '#00694c' }}>
              Default
            </span>
          )}
        </div>
      )}

      {/* ── Address fields ── */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <Field label="Full Name *" colSpan={2}>
          <input
            type="text" placeholder="Julian Vane"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
          />
        </Field>

        {/* ✅ নতুন: Email field — Full Name-এর ঠিক নিচে, Street-এর আগে */}
        <Field label="Email Address *" colSpan={2}>
          <input
            type="email" placeholder="your@email.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            readOnly={isAuthenticated && !!form.email}
            style={{
              ...INPUT_STYLE,
              background: isAuthenticated && form.email ? '#f0f4f0' : '#f8faf8',
            }}
            onFocus={isAuthenticated && form.email ? undefined : onFocus}
            onBlur={isAuthenticated && form.email ? undefined : onBlur}
          />
          {!isAuthenticated && (
            <p className="text-[11px] mt-1" style={{ color: '#6d7a73' }}>
              Order confirmation will be sent here.
            </p>
          )}
        </Field>

        <Field label="Street Address *" colSpan={2}>
          <input
            type="text" placeholder="142 High Meadow Road"
            value={form.street} onChange={e => setForm({ ...form, street: e.target.value })}
            style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
          />
        </Field>

        <Field label="City *" colSpan={1}>
          <input
            type="text" placeholder="Dublin"
            value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
            style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
          />
        </Field>

        <Field label="Postcode *" colSpan={1}>
          <input
            type="text" placeholder="D01 F5P2"
            value={form.postcode} onChange={e => setForm({ ...form, postcode: e.target.value })}
            style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
          />
        </Field>

        <Field label="Phone Number" colSpan={2}>
          <input
            type="tel" placeholder="+44 7700 900077"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            style={INPUT_STYLE} onFocus={onFocus} onBlur={onBlur}
          />
        </Field>
      </div>

      {/* ── Delivery Window ── */}
      <div className="mt-8 md:mt-12">
        <h3 className="text-[10px] uppercase tracking-widest font-bold mb-5" style={{ color: '#00694c' }}>
          Delivery Window
        </h3>

        {deliveryDates.length > 0 ? (
          <div className="flex gap-3 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {deliveryDates.map((d, i) => {
              const active = selectedDate === i
              return (
                <button key={d.date} onClick={() => setSelectedDate(i)}
                  className="px-5 md:px-6 py-3 rounded-full text-sm flex-shrink-0 font-bold transition-all cursor-pointer"
                  style={{
                    background: active ? '#d4ede5' : '#f0f4f0',
                    color:      active ? '#095041' : '#3d4943',
                    border:     active ? '1.5px solid #95d4bc' : '1.5px solid transparent',
                  }}>
                  {d.label === 'Today' ? `Today, ${d.full}` : `${d.short}, ${d.full}`}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm mb-5" style={{ color: '#6d7a73' }}>No delivery dates available.</p>
        )}

        {deliverySlots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deliverySlots.map(slot => {
              const active = selectedSlot === String(slot.id)
              return (
                <button key={slot.id} disabled={!slot.is_available}
                  onClick={() => slot.is_available && setSelectedSlot(String(slot.id))}
                  className="p-3 md:p-4 rounded-xl text-center transition-all"
                  style={{
                    border:     active ? '2px solid #00694c' : '1.5px solid #e8eee8',
                    background: active ? 'rgba(0,105,76,0.05)' : '#fff',
                    opacity:    slot.is_available ? 1 : 0.4,
                    cursor:     slot.is_available ? 'pointer' : 'not-allowed',
                  }}>
                  <span className="block text-[10px] mb-1" style={{ color: active ? 'rgba(0,105,76,0.7)' : '#6d7a73' }}>
                    {slot.label}
                  </span>
                  <span className="block font-bold text-xs md:text-sm" style={{ color: active ? '#00694c' : '#151e13' }}>
                    {slot.time}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#6d7a73' }}>No time slots configured yet.</p>
        )}
      </div>
    </section>
  )
}

function Field({ label, colSpan, children }) {
  return (
    <div className={`col-span-${colSpan}`}>
      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#6d7a73' }}>
        {label}
      </label>
      {children}
    </div>
  )
}