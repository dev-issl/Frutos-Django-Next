// src/app/checkout/page.jsx — SERVER COMPONENT
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { getDeliveryWindows, getDeliveryOption } from '@/lib/api'
import { getProducts } from '@/lib/api_product'
import CheckoutShell from '@/app/checkout/components/CheckoutShell'
import SeasonalEssentials from '@/app/checkout/components/SeasonalEssentials'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Checkout | El Árbol',
  description: 'Complete your order.',
}

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

async function fetchRegularUserData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  try {
    const [profileRes, addressRes] = await Promise.allSettled([
      fetch(`${API_BASE}/auth/profile/`, { headers, cache: 'no-store' }),
      fetch(`${API_BASE}/auth/addresses/`, { headers, cache: 'no-store' }),
    ])
    const profile = profileRes.status === 'fulfilled' && profileRes.value.ok ? await profileRes.value.json() : null
    const addressData = addressRes.status === 'fulfilled' && addressRes.value.ok ? await addressRes.value.json() : null
    const addresses = Array.isArray(addressData) ? addressData : addressData?.results || []
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null

    return {
      type: 'regular',
      name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '',
      email: profile?.email || '',
      phone: defaultAddr?.phone || profile?.profile?.phone || '',
      street: defaultAddr?.street || '',
      city: defaultAddr?.city || '',
      postcode: defaultAddr?.postcode || '',
      addresses,
    }
  } catch {
    return null
  }
}

export default async function CheckoutPage() {
  const session = await auth()
  const token = session?.user?.accessToken

  const [windowsResult, productsResult, regularData, deliveryResult] = await Promise.allSettled([
    getDeliveryWindows(),
    getProducts({ token, pageSize: 12, fetchAll: false }),
    session?.user ? Promise.resolve(null) : fetchRegularUserData(),
    getDeliveryOption(),
  ])

  const { dates, slots } =
    windowsResult.status === 'fulfilled' ? windowsResult.value : { dates: [], slots: [] }

  const allProducts = productsResult.status === 'fulfilled' ? productsResult.value : []
  const displayedFruits = allProducts.slice(0, 12)
  const deliveryConfig = deliveryResult.status === 'fulfilled' ? deliveryResult.value : null

  let initialUserData = null
  if (session?.user) {
    initialUserData = {
      type: 'wholesale',
      name: session.user.contactName || '',
      email: session.user.email || '',
      phone: session.user.phone || '',
      street: '',
      city: '',
      postcode: session.user.postcode || '',
      addresses: [],
    }
  } else if (regularData.status === 'fulfilled' && regularData.value) {
    initialUserData = regularData.value
  }

  return (
    <CheckoutShell
      deliveryDates={dates}
      deliverySlots={slots}
      initialUserData={initialUserData}
      deliveryConfig={deliveryConfig}
    >
      <SeasonalEssentials products={displayedFruits} />
    </CheckoutShell>
  )
}
