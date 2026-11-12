'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { MapPin, AlertCircle } from 'lucide-react'
import { useSafeSession } from '@/lib/useSafeSession'
import { useCart } from '@/app/context/CartContext'
import { useAuth } from '@/app/context/AuthContext'
import { checkIsInternalWholesale } from '@/lib/categoryHelper'
import { HeroWaveMask } from '@/app/components/BotanicalDecor'
import CheckoutProgress from './CheckoutProgress'
import DeliverySection from './DeliverySection'
import PaymentSection from './PaymentSection'
import OrderSidebar from './OrderSidebar'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

function normalizeCartItem(item) {
  if (item.item_type === 'pack') {
    return {
      leftover_pack: item.id,
      item_type: 'pack',
      quantity: parseInt(item?.qty ?? item?.quantity ?? item?.count ?? 0, 10),
      unit_price: item.price,
    }
  }

  const rawId = item?.product_id ?? item?.productId ?? item?.product ?? item?.id ?? null
  const productId = rawId != null ? String(rawId) : null
  const quantity = parseInt(item?.qty ?? item?.quantity ?? item?.count ?? 0, 10)
  const sizeId =
    item?.size != null && String(item.size).trim() !== '' && !isNaN(Number(item.size))
      ? item.size
      : null
  return {
    product: productId,
    item_type: 'product',
    quantity,
    unit_price: item.price,
    color: item.color,
    size: sizeId,
  }
}

export default function CheckoutShell({
  deliveryDates,
  deliverySlots,
  initialUserData,
  deliveryConfig,
  children,
}) {
  const router = useRouter()
  const { data: session, status } = useSafeSession()

  const {
    items,
    subtotal,
    clearCart,
    promoState,
    promoDiscount,
    discountedSubtotal,
  } = useCart()

  const { authFetch, isAuthenticated, loading: authLoading, user } = useAuth()

  const isWholesale = session?.user?.isApproved === true || Boolean(session?.user?.accessToken)
  const isInternalWholesale = checkIsInternalWholesale(session, user)
  const sessionLoading = status === 'loading'

  useEffect(() => {
    if (sessionLoading || authLoading) return
    if (!isWholesale) return
    const hasViolation = items.some((item) => {
      if (!item.wholesalePrice && !item.effectivePrice) return false
      const isUnlimited = Boolean(
        item.is_unlimited_stock ||
          item.isUnlimitedStock ||
          item.is_unlimited_wholesale_stock ||
          item.is_unlimited_restaurant_stock
      )
      const rawMin = parseInt(item.minimum_purchase, 10) || parseInt(item.minWholesaleQty, 10) || 1
      const stock = isUnlimited
        ? Infinity
        : item.stock !== undefined && item.stock !== null
          ? Number(item.stock)
          : item.wholesale_stock !== undefined && item.wholesale_stock !== null
            ? Number(item.wholesale_stock)
            : item.restaurant_stock !== undefined && item.restaurant_stock !== null
              ? Number(item.restaurant_stock)
              : Infinity
      const minReq = stock > 0 && stock < Infinity ? Math.min(rawMin, stock) : rawMin
      return item.qty < minReq
    })
    if (hasViolation) router.replace('/basket')
  }, [items, isWholesale, sessionLoading, authLoading, router])

  const [form, setForm] = useState({
    name: initialUserData?.name || '',
    email: initialUserData?.email || '',
    street: initialUserData?.street || '',
    city: initialUserData?.city || '',
    postcode: initialUserData?.postcode || '',
    phone: initialUserData?.phone || '',
  })

  const [savedAddresses, setSavedAddresses] = useState(initialUserData?.addresses || [])
  const [prefilled, setPrefilled] = useState(!!initialUserData?.street)
  const addressesLoadedRef = useRef(!!initialUserData)
  const userLoadedRef = useRef(false)

  useEffect(() => {
    if (!user || userLoadedRef.current) return
    userLoadedRef.current = true
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    setTimeout(() => {
      setForm((prev) => ({
        ...prev,
        name: prev.name || fullName,
        email: prev.email || user.email || '',
        phone: prev.phone || user?.profile?.phone || '',
      }))
    }, 0)
  }, [user])

  useEffect(() => {
    if (!isAuthenticated || !authFetch || addressesLoadedRef.current) return
    addressesLoadedRef.current = true
    authFetch(`${API_BASE}/auth/addresses/`)
      .then((r) => r.json())
      .then((data) => {
        const list = toArray(data)
        setSavedAddresses(list)
        const preferred = list.find((a) => a.isDefault) ?? list[0]
        if (!preferred) return
        setForm((prev) => ({
          ...prev,
          street: prev.street || preferred.street || '',
          city: prev.city || preferred.city || '',
          postcode: prev.postcode || preferred.postcode || '',
          phone: prev.phone || preferred.phone || '',
        }))
        setPrefilled(true)
      })
      .catch(() => {})
  }, [isAuthenticated, authFetch])

  function applyAddress(addr) {
    setForm((prev) => ({
      ...prev,
      street: addr.street || '',
      city: addr.city || '',
      postcode: addr.postcode || '',
      phone: addr.phone || prev.phone,
    }))
  }

  async function handleSaveAddress() {
    if (!isAuthenticated || !authFetch) return
    if (!form.street.trim() || !form.city.trim() || !form.postcode.trim()) return
    try {
      const res = await authFetch(`${API_BASE}/auth/addresses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Home',
          street: form.street.trim(),
          city: form.city.trim(),
          postcode: form.postcode.trim(),
          phone: form.phone.trim(),
          is_default: savedAddresses.length === 0,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setSavedAddresses((prev) => [...prev, created])
      }
    } catch {
      // ignore if duplicate/unavailable
    }
  }

  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '' })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [paymentExpanded, setPaymentExpanded] = useState(false)
  const [activeStep, setActiveStep] = useState('delivery')

  const [selectedDate, setSelectedDate] = useState(0)
  const firstAvailable = deliverySlots.find((s) => s.is_available)
  const [selectedSlot, setSelectedSlot] = useState(firstAvailable ? String(firstAvailable.id) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const delivery = calcDeliveryFee(deliveryConfig, discountedSubtotal)
  const total = discountedSubtotal + delivery

  function validateDeliveryFields() {
    if (isWholesale) {
      for (const item of items) {
        if (item.wholesalePrice || item.effectivePrice) {
          const isUnlimited = Boolean(
            item.is_unlimited_stock ||
              item.isUnlimitedStock ||
              item.is_unlimited_wholesale_stock ||
              item.is_unlimited_restaurant_stock
          )
          const rawMin = parseInt(item.minimum_purchase, 10) || parseInt(item.minWholesaleQty, 10) || 1
          const stock = isUnlimited
            ? Infinity
            : item.stock !== undefined && item.stock !== null
              ? Number(item.stock)
              : item.wholesale_stock !== undefined && item.wholesale_stock !== null
                ? Number(item.wholesale_stock)
                : item.restaurant_stock !== undefined && item.restaurant_stock !== null
                  ? Number(item.restaurant_stock)
                  : Infinity
          const minReq = stock > 0 && stock < Infinity ? Math.min(rawMin, stock) : rawMin
          if (item.qty < minReq) {
            return `"${item.name}" requires minimum ${minReq} ${item.wholesaleUnit || 'units'}.`
          }
        }
      }
    }
    if (!form.name.trim()) return 'Please enter your full name.'
    if (!form.email.trim()) return 'Please enter your email address.'
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (!form.street.trim()) return 'Please enter your street address.'
    if (!form.city.trim()) return 'Please enter your city.'
    if (!form.postcode.trim()) return 'Please enter your postcode.'
    return null
  }

  function validate() {
    const delivErr = validateDeliveryFields()
    if (delivErr) return delivErr
    if (paymentMethod === 'card') {
      if (!cardForm.number.trim()) return 'Please enter your card number.'
      if (!cardForm.expiry.trim()) return 'Please enter the card expiry date.'
      if (!cardForm.cvv.trim()) return 'Please enter the CVV.'
    }
    return null
  }

  function handleProceedToPayment() {
    const delivErr = validateDeliveryFields()
    if (delivErr) {
      setError(delivErr)
      return
    }
    setError('')
    setPaymentExpanded(true)
    setActiveStep('payment')
    const el = document.getElementById('checkout-payment-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  async function handleOrder() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      if (!paymentExpanded) {
        setPaymentExpanded(true)
        setActiveStep('payment')
      }
      return
    }
    if (items.length === 0) {
      setError('Your basket is empty.')
      return
    }

    setLoading(true)
    setError('')

    const slotObj = deliverySlots.find((s) => String(s.id) === selectedSlot)
    const dateObj = deliveryDates[selectedDate]

    const sanitizedItems = items.map(normalizeCartItem).filter((item) => {
      if (item.item_type === 'pack') return item.leftover_pack != null && item.quantity > 0
      return item.product != null && String(item.product).trim() !== '' && item.quantity > 0
    })

    if (sanitizedItems.length === 0) {
      setError(
        'Your basket has invalid items — product IDs could not be resolved. Please empty your basket and re-add the items.'
      )
      setLoading(false)
      return
    }

    const payload = {
      customer_name: form.name.trim(),
      customer_email: form.email.trim(),
      customer_phone: form.phone.trim(),
      street_address: form.street.trim(),
      city: form.city.trim(),
      postcode: form.postcode.trim(),
      payment_method: paymentMethod,
      ...(paymentMethod === 'card' && {
        card_number: cardForm.number.trim(),
        card_expiry: cardForm.expiry.trim(),
        card_cvv: cardForm.cvv.trim(),
      }),
      delivery_date: isInternalWholesale ? '' : dateObj?.date || dateObj?.full || dateObj?.label || '',
      delivery_slot: isInternalWholesale ? '' : slotObj?.id ?? selectedSlot,
      delivery_slot_label: isInternalWholesale ? '' : slotObj?.time || slotObj?.label || '',
      ...(promoState?.code ? { coupon_code: promoState.code } : {}),
      items: sanitizedItems,
    }

    try {
      const orderUrl = `${API_BASE}/orders/submit/`
      const wholesaleToken = session?.user?.accessToken
      let res

      if (wholesaleToken) {
        res = await fetch(orderUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${wholesaleToken}`,
          },
          body: JSON.stringify(payload),
        })
        if (res.status === 401) {
          signOut({ callbackUrl: '/wholesale' })
          return
        }
      } else if (isAuthenticated) {
        res = await authFetch(orderUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(orderUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
        let detail = ''
        if (typeof data === 'string' && data.trim()) {
          detail = data.trim()
        } else if (data && typeof data === 'object') {
          if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            detail = data.errors.join('. ')
          } else if (data.detail) {
            detail = data.detail
          } else {
            const entries = Object.entries(data)
            if (entries.length > 0) {
              detail = entries.map(([k, v]) => `${k}: ${[v].flat().join(', ')}`).join(' | ')
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
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F6F6EC', minHeight: '100vh', width: '100%' }}>
      {/* Panoramic Delivery Hero Header */}
      <section className="relative overflow-hidden bg-[#F7F6EC]">
        {/* Subtle top-left corner botanical leaves framing (matches reference hero corner) */}
        <div
          className="hidden sm:block pointer-events-none select-none absolute -top-2 -left-2 w-40 h-32 z-10 opacity-75 -scale-x-100"
          style={{
            backgroundImage: 'url(/ui/botanical-leaves-tr.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'top right',
            mixBlendMode: 'multiply',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-[1440px] mx-auto h-[215px] sm:h-[250px] md:h-[270px] lg:h-[285px] w-full">
          <Image
            src="/ui/delivery-hero-banner.jpg"
            alt="El Árbol fresh produce delivery van"
            fill
            priority
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-cover object-[82%_55%] sm:object-[86%_50%] lg:object-right"
          />

          {/* Smooth cream legibility veil for responsive widths without hard edges */}
          <div
            className="hidden sm:block absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #F7F6EC 0%, rgba(247,246,236,0.92) 28%, rgba(247,246,236,0.58) 44%, rgba(247,246,236,0.12) 60%, rgba(247,246,236,0) 74%)',
            }}
          />
          <div
            className="sm:hidden absolute inset-0"
            style={{
              background:
                'linear-gradient(96deg, rgba(247,246,236,0.97) 0%, rgba(247,246,236,0.88) 46%, rgba(247,246,236,0.42) 78%, rgba(247,246,236,0.14) 100%)',
            }}
          />

          <div className="relative z-10 max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0B462B] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h1
                className="text-[32px] sm:text-[46px] md:text-[50px] font-bold tracking-tight leading-[1.05]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#0F3A22' }}
              >
                Delivery
              </h1>
            </div>

            <p
              className="text-[16.5px] sm:text-[21px] italic mt-1"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#245435' }}
            >
              Freshness delivered to your doorstep
            </p>

            <p className="text-[13px] sm:text-[14.5px] text-[#35483A] max-w-[270px] sm:max-w-[360px] leading-snug mt-2">
              We ensure your favorite fresh produce reaches you safely and on time.
            </p>
          </div>

          <div className="absolute -bottom-[1px] left-0 right-0 z-10">
            <HeroWaveMask fill="#F6F6EC" className="h-5 sm:h-7" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14 sm:pb-16 overflow-x-clip">
        <CheckoutProgress
          activeStep={activeStep}
          onSelectStep={(stepId) => {
            setActiveStep(stepId)
            if (stepId === 'payment') {
              setPaymentExpanded(true)
              const el = document.getElementById('checkout-payment-section')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }}
        />

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-[16px] bg-[#FEF2F2] border border-[#FECACA]">
            <AlertCircle className="w-5 h-5 text-[#BA1A1A] shrink-0" />
            <p className="text-sm font-medium text-[#991B1B]">{error}</p>
          </div>
        )}

        {/* 2-Column Delivery Address + Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
          <div className="lg:col-span-8 min-w-0">
            <DeliverySection
              form={form}
              setForm={setForm}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              deliveryDates={deliveryDates}
              deliverySlots={deliverySlots}
              prefilled={prefilled}
              savedAddresses={savedAddresses}
              onApplyAddress={applyAddress}
              isAuthenticated={isAuthenticated || isWholesale}
              isInternalWholesale={isInternalWholesale}
              onSaveAddress={handleSaveAddress}
            />
          </div>

          <OrderSidebar
            items={mounted ? items : []}
            subtotal={mounted ? subtotal : 0}
            promoState={mounted ? promoState : null}
            promoDiscount={mounted ? promoDiscount : 0}
            discountedSubtotal={mounted ? discountedSubtotal : 0}
            delivery={mounted ? delivery : 0}
            total={mounted ? total : 0}
            hydrating={!mounted}
            loading={loading}
            paymentExpanded={paymentExpanded}
            onPrimaryAction={paymentExpanded ? handleOrder : handleProceedToPayment}
          />
        </div>

        {/* Full-Width Secure Payment Bar + Expandable Card/TPV/PayPal/Cash Details */}
        <div className="mt-7">
          <PaymentSection
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cardForm={cardForm}
            setCardForm={setCardForm}
            expanded={paymentExpanded}
            onSelectMethod={() => {
              setPaymentExpanded(true)
              setActiveStep('payment')
            }}
          />
        </div>

        {/* Optional bottom children (Seasonal Essentials) */}
        {children}
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
