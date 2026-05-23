// 'use client'
// // src/app/checkout/components/CheckoutShell.jsx

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useSession, signOut } from 'next-auth/react'
// import { useCart } from '@/app/context/CartContext'
// import { useAuth } from '@/app/context/AuthContext'
// import CheckoutProgress from './CheckoutProgress'
// import DeliverySection  from './DeliverySection'
// import PaymentSection   from './PaymentSection'
// import OrderSidebar     from './OrderSidebar'

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

// function toArray(data) {
//   if (Array.isArray(data)) return data
//   if (data && Array.isArray(data.results)) return data.results
//   return []
// }

// function normalizeCartItem(item) {
//   const rawId =
//     item?.product_id ??
//     item?.productId  ??
//     item?.product    ??
//     item?.id         ??
//     null

//   const productId = rawId != null ? String(rawId) : null
//   const quantity  = parseInt(item?.qty ?? item?.quantity ?? item?.count ?? 0, 10)
//   return { product: productId, quantity }
// }

// export default function CheckoutShell({ deliveryDates, deliverySlots, initialUserData, deliveryConfig }) {
//   const router = useRouter()
//   const { data: session, status } = useSession()

//   const {
//     items, subtotal, clearCart,
//     promoState, promoDiscount, discountedSubtotal,
//   } = useCart()

//   const { authFetch, isAuthenticated, loading: authLoading, user } = useAuth()

//   const isWholesale    = session?.user?.isApproved === true
//   const sessionLoading = status === 'loading'

//   useEffect(() => {
//     if (sessionLoading || authLoading) return
//     if (!isWholesale) return
//     const hasViolation = items.some(
//       item => item.wholesalePrice && item.qty < (item.minWholesaleQty || 1)
//     )
//     if (hasViolation) router.replace('/basket')
//   }, [items, isWholesale, sessionLoading, authLoading, router])

//   const [form, setForm] = useState({
//     name:     initialUserData?.name     || '',
//     street:   initialUserData?.street   || '',
//     city:     initialUserData?.city     || '',
//     postcode: initialUserData?.postcode || '',
//     phone:    initialUserData?.phone    || '',
//   })

//   const [savedAddresses,  setSavedAddresses]  = useState(initialUserData?.addresses || [])
//   const [prefilled,       setPrefilled]       = useState(!!initialUserData?.street)
//   const [addressesLoaded, setAddressesLoaded] = useState(!!initialUserData)

//   useEffect(() => {
//     if (!user) return
//     const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
//     setForm(prev => ({
//       ...prev,
//       name:  prev.name  || fullName,
//       phone: prev.phone || user?.profile?.phone || '',
//     }))
//   }, [user])

//   useEffect(() => {
//     if (!isAuthenticated || !authFetch || addressesLoaded) return
//     setAddressesLoaded(true)
//     authFetch(`${API_BASE}/auth/addresses/`)
//       .then(r => r.json())
//       .then(data => {
//         const list = toArray(data)
//         setSavedAddresses(list)
//         const preferred = list.find(a => a.isDefault) ?? list[0]
//         if (!preferred) return
//         setForm(prev => ({
//           ...prev,
//           street:   prev.street   || preferred.street   || '',
//           city:     prev.city     || preferred.city     || '',
//           postcode: prev.postcode || preferred.postcode  || '',
//           phone:    prev.phone    || preferred.phone     || '',
//         }))
//         setPrefilled(true)
//       })
//       .catch(() => {})
//   }, [isAuthenticated, authFetch, addressesLoaded])

//   function applyAddress(addr) {
//     setForm(prev => ({
//       ...prev,
//       street:   addr.street   || '',
//       city:     addr.city     || '',
//       postcode: addr.postcode || '',
//       phone:    addr.phone    || prev.phone,
//     }))
//   }

//   const [cardForm, setCardForm]           = useState({ number: '', expiry: '', cvv: '' })
//   const [paymentMethod, setPaymentMethod] = useState('card')
//   const [selectedDate,  setSelectedDate]  = useState(0)
//   const firstAvailable                    = deliverySlots.find(s => s.is_available)
//   const [selectedSlot,  setSelectedSlot]  = useState(firstAvailable ? String(firstAvailable.id) : '')
//   const [loading, setLoading]             = useState(false)
//   const [error,   setError]               = useState('')

//   const delivery = calcDeliveryFee(deliveryConfig, discountedSubtotal)
//   const total    = discountedSubtotal + delivery

//   if (authLoading || sessionLoading) return null

//   function validate() {
//     if (isWholesale) {
//       for (const item of items) {
//         if (item.wholesalePrice && item.qty < (item.minWholesaleQty || 1)) {
//           return `"${item.name}" requires minimum ${item.minWholesaleQty} ${item.wholesaleUnit || 'units'}.`
//         }
//       }
//     }
//     if (!form.name.trim())     return 'Please enter your full name.'
//     if (!form.street.trim())   return 'Please enter your street address.'
//     if (!form.city.trim())     return 'Please enter your city.'
//     if (!form.postcode.trim()) return 'Please enter your postcode.'
//     if (paymentMethod === 'card') {
//       if (!cardForm.number.trim()) return 'Please enter your card number.'
//       if (!cardForm.expiry.trim()) return 'Please enter the card expiry date.'
//       if (!cardForm.cvv.trim())    return 'Please enter the CVV.'
//     }
//     return null
//   }

//   async function handleOrder() {
//     const validationError = validate()
//     if (validationError) { setError(validationError); return }
//     if (items.length === 0) { setError('Your basket is empty.'); return }

//     setLoading(true)
//     setError('')

//     const slotObj = deliverySlots.find(s => String(s.id) === selectedSlot)
//     const dateObj = deliveryDates[selectedDate]

//     const sanitizedItems = items
//         .map(normalizeCartItem)
//         .filter(item => item.product != null && String(item.product).trim() !== '' && item.quantity > 0)

//     console.log('[Checkout] Raw cart items:',   items)
//     console.log('[Checkout] Sanitized items:',   sanitizedItems)

//     if (sanitizedItems.length === 0) {
//       const sample = items[0]
//       console.error(
//         '[Checkout] Could not extract integer product id.\n' +
//         'Raw item keys:', sample ? Object.keys(sample) : '(items empty)', '\n' +
//         'Raw item:', sample
//       )
//       setError(
//         'Your basket has invalid items — product IDs could not be resolved. ' +
//         'Please empty your basket and re-add the items.'
//       )
//       setLoading(false)
//       return
//     }

//     const payload = {
//       customer_name:       form.name.trim(),
//       customer_email:      user?.email || session?.user?.email || '',
//       customer_phone:      form.phone.trim(),
//       street_address:      form.street.trim(),
//       city:                form.city.trim(),
//       postcode:            form.postcode.trim(),
//       payment_method:      paymentMethod,
//       delivery_date:       dateObj?.date  || dateObj?.full  || dateObj?.label || '',
//       delivery_slot:       slotObj?.id    ?? selectedSlot,
//       delivery_slot_label: slotObj?.time  || slotObj?.label || '',
//       ...(promoState?.code ? { coupon_code: promoState.code } : {}),
//       items: sanitizedItems,
//     }

//     console.log('[Checkout] Payload to Django:', payload)

//     try {
//       const orderUrl = `${API_BASE}/orders/submit/`

//       const wholesaleToken = session?.user?.accessToken
//       let res

//       if (wholesaleToken) {
//         res = await fetch(orderUrl, {
//           method:  'POST',
//           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wholesaleToken}` },
//           body:    JSON.stringify(payload),
//         })
//         if (res.status === 401) { signOut({ callbackUrl: '/wholesale' }); return }
//       } else if (isAuthenticated) {
//         res = await authFetch(orderUrl, {
//           method:  'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body:    JSON.stringify(payload),
//         })
//       } else {
//         res = await fetch(orderUrl, {
//           method:  'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body:    JSON.stringify(payload),
//         })
//       }

//       // ─── FIX: Clone response to prevent "body stream already read" ───
//       let data
//       try { 
//         const resClone = res.clone()
//         data = await resClone.json() 
//       } catch { 
//         data = await res.text() 
//       }

//       if (!res.ok) {
//         console.error('[Checkout] Django error response:', data)

//         let detail = ''
//         if (typeof data === 'string' && data.trim()) {
//           detail = data.trim()
//         } else if (data && typeof data === 'object') {
//           if (data.detail) {
//             detail = data.detail
//           } else {
//             const entries = Object.entries(data)
//             if (entries.length > 0) {
//               detail = entries
//                 .map(([k, v]) => `${k}: ${[v].flat().join(', ')}`)
//                 .join(' | ')
//             }
//           }
//         }
//         if (!detail) {
//           detail = `Order submission failed (HTTP ${res.status}). Please check your details and try again.`
//         }

//         throw new Error(detail)
//       }

//       clearCart()
//       router.push(`/order-confirmation/${data.order_number || data.orderNumber}`)

//     } catch (err) {
//       console.error('[Checkout] Order failed:', err)
//       setError(err.message || 'Something went wrong. Please try again.')
//       setLoading(false)
//     }
//   }

//   return (
//     <div style={{ background: '#fff', minHeight: '100vh', width: '100%' }}>
//       <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
//         <CheckoutProgress />

//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
//           <div className="lg:col-span-8 space-y-6 md:space-y-8">
//             {error && (
//               <div className="flex items-center gap-3 p-4 rounded-xl"
//                 style={{ background: '#FFF0F0', border: '1px solid #FFCDD2' }}>
//                 <span className="material-symbols-outlined" style={{ color: '#BA1A1A' }}>error</span>
//                 <p className="text-sm font-medium" style={{ color: '#BA1A1A' }}>{error}</p>
//               </div>
//             )}

//             <DeliverySection
//               form={form}
//               setForm={setForm}
//               selectedDate={selectedDate} setSelectedDate={setSelectedDate}
//               selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
//               deliveryDates={deliveryDates}
//               deliverySlots={deliverySlots}
//               prefilled={prefilled}
//               savedAddresses={savedAddresses}
//               onApplyAddress={applyAddress}
//             />

//             <PaymentSection
//               paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
//               cardForm={cardForm} setCardForm={setCardForm}
//             />
//           </div>

//           <OrderSidebar
//             items={items}
//             subtotal={subtotal}
//             promoState={promoState}
//             promoDiscount={promoDiscount}
//             discountedSubtotal={discountedSubtotal}
//             delivery={delivery}
//             total={total}
//             loading={loading}
//             onPlaceOrder={handleOrder}
//           />
//         </div>

//         <footer className="py-12 text-center" />
//       </div>
//     </div>
//   )
// }

// function calcDeliveryFee(config, subtotal) {
//   if (!config || !config.is_active || config.charge_type === 'free') return 0
//   if (config.charge_type === 'flat') return Number(config.flat_fee)
//   if (config.charge_type === 'threshold') {
//     return subtotal >= Number(config.free_threshold) ? 0 : Number(config.flat_fee)
//   }
//   return 0
// }

'use client'
// src/app/checkout/components/CheckoutShell.jsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/app/context/CartContext'
import { useAuth } from '@/app/context/AuthContext'
import CheckoutProgress from './CheckoutProgress'
import DeliverySection  from './DeliverySection'
import PaymentSection   from './PaymentSection'
import OrderSidebar     from './OrderSidebar'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

function normalizeCartItem(item) {
  const rawId =
    item?.product_id ??
    item?.productId  ??
    item?.product    ??
    item?.id         ??
    null

  const productId = rawId != null ? String(rawId) : null
  const quantity  = parseInt(item?.qty ?? item?.quantity ?? item?.count ?? 0, 10)
  return { product: productId, quantity }
}

export default function CheckoutShell({ deliveryDates, deliverySlots, initialUserData, deliveryConfig }) {
  const router = useRouter()
  const { data: session, status } = useSession()

  const {
    items, subtotal, clearCart,
    promoState, promoDiscount, discountedSubtotal,
  } = useCart()

  const { authFetch, isAuthenticated, loading: authLoading, user } = useAuth()

  const isWholesale    = session?.user?.isApproved === true
  const sessionLoading = status === 'loading'

  useEffect(() => {
    if (sessionLoading || authLoading) return
    if (!isWholesale) return
    const hasViolation = items.some(
      item => item.wholesalePrice && item.qty < (item.minWholesaleQty || 1)
    )
    if (hasViolation) router.replace('/basket')
  }, [items, isWholesale, sessionLoading, authLoading, router])

  // ✅ FIX: form state-এ email যোগ করা হয়েছে
  const [form, setForm] = useState({
    name:     initialUserData?.name     || '',
    email:    initialUserData?.email    || '',
    street:   initialUserData?.street   || '',
    city:     initialUserData?.city     || '',
    postcode: initialUserData?.postcode || '',
    phone:    initialUserData?.phone    || '',
  })

  const [savedAddresses,  setSavedAddresses]  = useState(initialUserData?.addresses || [])
  const [prefilled,       setPrefilled]       = useState(!!initialUserData?.street)
  const [addressesLoaded, setAddressesLoaded] = useState(!!initialUserData)

  // ✅ FIX: user থেকে email-ও নেওয়া হচ্ছে
  useEffect(() => {
    if (!user) return
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    setForm(prev => ({
      ...prev,
      name:  prev.name  || fullName,
      email: prev.email || user.email || '',
      phone: prev.phone || user?.profile?.phone || '',
    }))
  }, [user])

  useEffect(() => {
    if (!isAuthenticated || !authFetch || addressesLoaded) return
    setAddressesLoaded(true)
    authFetch(`${API_BASE}/auth/addresses/`)
      .then(r => r.json())
      .then(data => {
        const list = toArray(data)
        setSavedAddresses(list)
        const preferred = list.find(a => a.isDefault) ?? list[0]
        if (!preferred) return
        setForm(prev => ({
          ...prev,
          street:   prev.street   || preferred.street   || '',
          city:     prev.city     || preferred.city     || '',
          postcode: prev.postcode || preferred.postcode  || '',
          phone:    prev.phone    || preferred.phone     || '',
        }))
        setPrefilled(true)
      })
      .catch(() => {})
  }, [isAuthenticated, authFetch, addressesLoaded])

  function applyAddress(addr) {
    setForm(prev => ({
      ...prev,
      street:   addr.street   || '',
      city:     addr.city     || '',
      postcode: addr.postcode || '',
      phone:    addr.phone    || prev.phone,
    }))
  }

  const [cardForm, setCardForm]           = useState({ number: '', expiry: '', cvv: '' })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [selectedDate,  setSelectedDate]  = useState(0)
  const firstAvailable                    = deliverySlots.find(s => s.is_available)
  const [selectedSlot,  setSelectedSlot]  = useState(firstAvailable ? String(firstAvailable.id) : '')
  const [loading, setLoading]             = useState(false)
  const [error,   setError]               = useState('')

  const delivery = calcDeliveryFee(deliveryConfig, discountedSubtotal)
  const total    = discountedSubtotal + delivery

  if (authLoading || sessionLoading) return null

  // ✅ FIX: validate()-এ email check যোগ করা হয়েছে
  function validate() {
    if (isWholesale) {
      for (const item of items) {
        if (item.wholesalePrice && item.qty < (item.minWholesaleQty || 1)) {
          return `"${item.name}" requires minimum ${item.minWholesaleQty} ${item.wholesaleUnit || 'units'}.`
        }
      }
    }
    if (!form.name.trim())     return 'Please enter your full name.'
    if (!form.email.trim())    return 'Please enter your email address.'
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (!form.street.trim())   return 'Please enter your street address.'
    if (!form.city.trim())     return 'Please enter your city.'
    if (!form.postcode.trim()) return 'Please enter your postcode.'
    if (paymentMethod === 'card') {
      if (!cardForm.number.trim()) return 'Please enter your card number.'
      if (!cardForm.expiry.trim()) return 'Please enter the card expiry date.'
      if (!cardForm.cvv.trim())    return 'Please enter the CVV.'
    }
    return null
  }

  async function handleOrder() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    if (items.length === 0) { setError('Your basket is empty.'); return }

    setLoading(true)
    setError('')

    const slotObj = deliverySlots.find(s => String(s.id) === selectedSlot)
    const dateObj = deliveryDates[selectedDate]

    const sanitizedItems = items
        .map(normalizeCartItem)
        .filter(item => item.product != null && String(item.product).trim() !== '' && item.quantity > 0)

    console.log('[Checkout] Raw cart items:',   items)
    console.log('[Checkout] Sanitized items:',   sanitizedItems)

    if (sanitizedItems.length === 0) {
      const sample = items[0]
      console.error(
        '[Checkout] Could not extract integer product id.\n' +
        'Raw item keys:', sample ? Object.keys(sample) : '(items empty)', '\n' +
        'Raw item:', sample
      )
      setError(
        'Your basket has invalid items — product IDs could not be resolved. ' +
        'Please empty your basket and re-add the items.'
      )
      setLoading(false)
      return
    }

    // ✅ FIX: customer_email এখন form.email থেকে আসছে, আর কখনো blank হবে না
    const payload = {
      customer_name:       form.name.trim(),
      customer_email:      form.email.trim(),
      customer_phone:      form.phone.trim(),
      street_address:      form.street.trim(),
      city:                form.city.trim(),
      postcode:            form.postcode.trim(),
      payment_method:      paymentMethod,
      delivery_date:       dateObj?.date  || dateObj?.full  || dateObj?.label || '',
      delivery_slot:       slotObj?.id    ?? selectedSlot,
      delivery_slot_label: slotObj?.time  || slotObj?.label || '',
      ...(promoState?.code ? { coupon_code: promoState.code } : {}),
      items: sanitizedItems,
    }

    console.log('[Checkout] Payload to Django:', payload)

    try {
      const orderUrl = `${API_BASE}/orders/submit/`

      const wholesaleToken = session?.user?.accessToken
      let res

      if (wholesaleToken) {
        res = await fetch(orderUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wholesaleToken}` },
          body:    JSON.stringify(payload),
        })
        if (res.status === 401) { signOut({ callbackUrl: '/wholesale' }); return }
      } else if (isAuthenticated) {
        res = await authFetch(orderUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
      } else {
        res = await fetch(orderUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
      }

      let data
      try {
        const resClone = res.clone()
        data = await resClone.json()
      } catch {
        data = await res.text()
      }

      if (!res.ok) {
        console.error('[Checkout] Django error response:', data)

        let detail = ''
        if (typeof data === 'string' && data.trim()) {
          detail = data.trim()
        } else if (data && typeof data === 'object') {
          if (data.detail) {
            detail = data.detail
          } else {
            const entries = Object.entries(data)
            if (entries.length > 0) {
              detail = entries
                .map(([k, v]) => `${k}: ${[v].flat().join(', ')}`)
                .join(' | ')
            }
          }
        }
        if (!detail) {
          detail = `Order submission failed (HTTP ${res.status}). Please check your details and try again.`
        }

        throw new Error(detail)
      }

      clearCart()
      router.push(`/order-confirmation/${data.order_number || data.orderNumber}`)

    } catch (err) {
      console.error('[Checkout] Order failed:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh', width: '100%' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <CheckoutProgress />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: '#FFF0F0', border: '1px solid #FFCDD2' }}>
                <span className="material-symbols-outlined" style={{ color: '#BA1A1A' }}>error</span>
                <p className="text-sm font-medium" style={{ color: '#BA1A1A' }}>{error}</p>
              </div>
            )}

            {/* ✅ FIX: DeliverySection-এ form.email এবং setForm pass করা হচ্ছে */}
            <DeliverySection
              form={form}
              setForm={setForm}
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
              deliveryDates={deliveryDates}
              deliverySlots={deliverySlots}
              prefilled={prefilled}
              savedAddresses={savedAddresses}
              onApplyAddress={applyAddress}
              isAuthenticated={isAuthenticated || isWholesale}
            />

            <PaymentSection
              paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              cardForm={cardForm} setCardForm={setCardForm}
            />
          </div>

          <OrderSidebar
            items={items}
            subtotal={subtotal}
            promoState={promoState}
            promoDiscount={promoDiscount}
            discountedSubtotal={discountedSubtotal}
            delivery={delivery}
            total={total}
            loading={loading}
            onPlaceOrder={handleOrder}
          />
        </div>

        <footer className="py-12 text-center" />
      </div>
    </div>
  )
}

function calcDeliveryFee(config, subtotal) {
  if (!config || !config.is_active || config.charge_type === 'free') return 0
  if (config.charge_type === 'flat') return Number(config.flat_fee)
  if (config.charge_type === 'threshold') {
    return subtotal >= Number(config.free_threshold) ? 0 : Number(config.flat_fee)
  }
  return 0
}