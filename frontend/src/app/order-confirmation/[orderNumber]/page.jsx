// src/app/order-confirmation/[orderNumber]/page.jsx

import { cookies }  from 'next/headers'
import { auth }     from '@/auth'
import { notFound } from 'next/navigation'
import OrderConfirmationClient from './OrderConfirmationClient'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

async function getOrder(orderNumber) {
  try {
    // ✅ FIX: cookie থেকে token নাও (regular user)
    const cookieStore = await cookies()
    const regularToken = cookieStore.get('access_token')?.value

    // ✅ FIX: NextAuth session থেকে token নাও (wholesale user)
    const session = await auth()
    const wholesaleToken = session?.user?.accessToken

    const token = wholesaleToken || regularToken || null

    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}/orders/${orderNumber}/`, {
      headers,
      cache: 'no-store',
    })

    if (res.status === 404) return null
    // ✅ 401 হলে null return করো — notFound দেখাবে
    if (res.status === 401) {
      console.warn('[OrderConfirmation] 401 — no valid token for order:', orderNumber)
      return null
    }
    if (!res.ok) throw new Error(`API ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[OrderConfirmation] fetch failed:', err)
    return null
  }
}

function normalizeOrder(raw) {
  return {
    orderNumber:   raw.order_number   || raw.orderNumber   || '',
    customerName:  raw.customer_name  || raw.customerName  || '',
    status:        (raw.status        || 'PENDING').toLowerCase(),
    street:        raw.street_address || raw.street        || '',
    city:          raw.city           || '',
    postcode:      raw.postcode       || '',
    fullAddress:   !!(raw.street_address || raw.street),
    deliveryDate:  raw.delivery_date  || raw.deliveryDate  || '',
    deliverySlot:  raw.delivery_slot_label || raw.deliverySlot || '',
    paymentMethod: raw.payment_method || raw.paymentMethod || 'cash',
    subtotal:      Number(raw.cart_subtotal  || raw.subtotal      || 0),
    deliveryFee:   Number(raw.delivery_fee   || raw.deliveryFee   || 0),
    total:         Number(raw.total_amount   || raw.total         || 0),
    items: (raw.items || []).map(item => ({
      id:           item.id,
      productName:  item.product_name  || item.productName  || '',
      productImage: item.product_image || item.productImage || '',
      productOrigin:item.product_origin|| item.productOrigin|| '',
      quantity:     Number(item.quantity   || 1),
      unitPrice:    Number(item.unit_price || item.unitPrice || 0),
      lineTotal:    Number(item.line_total || item.lineTotal ||
                    (item.quantity * item.unit_price) || 0),
    })),
  }
}

export async function generateMetadata({ params }) {
  const { orderNumber } = await params
  return { title: `Order ${orderNumber} — El Árbol` }
}

export default async function OrderConfirmationPage({ params }) {
  const { orderNumber } = await params
  const raw = await getOrder(orderNumber)
  if (!raw) notFound()

  const order = normalizeOrder(raw)
  return <OrderConfirmationClient order={order} />
}