
import { cookies } from 'next/headers'
import ProfileClient from './ProfileClient'

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export const metadata = { title: 'My Account — El Árbol' }

// ── Server-side authenticated fetch ──────────────────────────────────────────
// Reads the JWT from an httpOnly cookie set at login.
// If your auth stores the token under a different cookie name, update 'access_token' below.
async function serverFetch(path) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null

  try {
    const separator = path.includes('?') ? '&' : '?'
    const fetchPath = `${path}${separator}t=${Date.now()}`
    
    const res = await fetch(API_BASE + fetchPath, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      cache: 'no-store', // always fresh — profile data changes often
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Page (Server Component) ───────────────────────────────────────────────────
// Fires all four requests in parallel — no waterfall, no client spinners.
export default async function ProfilePage() {
  const [profile, addresses, orders, notifications] = await Promise.allSettled([
    serverFetch('/auth/profile/'),
    serverFetch('/auth/addresses/'),
    serverFetch('/auth/orders/'),
    serverFetch('/auth/notifications/'),
  ])

  // allSettled → extract .value safely (null on failure)
  const val = (r) => (r.status === 'fulfilled' ? r.value : null)

  return (
    <ProfileClient
      initialProfile={val(profile)}
      initialAddresses={val(addresses)}
      initialOrders={val(orders)}
      initialNotifications={val(notifications)}
    />
  )
}