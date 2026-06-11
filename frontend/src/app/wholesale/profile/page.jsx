
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getWholesaleProfile, getWholesaleNotifications, getWholesaleOrders } from '@/lib/api'
import WholesaleProfileClient from '@/app/wholesale/profile/WholesaleProfileClient'

export const metadata = {
  title: 'Wholesale Profile | El Árbol',
  description: 'Manage your El Árbol wholesale account',
}

export default async function WholesaleProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/wholesale')
  }

  const accessToken = session.user.accessToken

  const [profile, notifications, orders] = await Promise.allSettled([
    getWholesaleProfile(accessToken),
    getWholesaleNotifications(accessToken),
    getWholesaleOrders(accessToken),
  ])

  // ── Normalize session.user (camelCase) → snake_case for the client component
  // This ensures the fallback works even if the API call fails
  const sessionFallback = {
    id:                    session.user.id,
    email:                 session.user.email,
    business_name:         session.user.businessName,
    contact_name:          session.user.contactName,
    phone:                 session.user.phone,
    postcode:              session.user.postcode,
    business_type:         session.user.businessType,
    display_business_type: session.user.displayBusinessType,
    monthly_volume:        session.user.monthlyVolume,
    display_volume:        session.user.displayVolume,
    status:                session.user.status,
    is_approved:           session.user.isApproved,
    applied_at:            session.user.appliedAt,
    approved_at:           session.user.approvedAt,
    account_manager_name:  session.user.accountManagerName,
    account_manager_email: session.user.accountManagerEmail,
    total_orders:          session.user.totalOrders,
    total_spent:           session.user.totalSpent,
    profile_image_url:     session.user.profileImage,
  }

  const profileData = profile.status === 'fulfilled'
    ? profile.value
    : sessionFallback     // ← now uses snake_case keys

  const notificationsData = notifications.status === 'fulfilled'
    ? (Array.isArray(notifications.value) ? notifications.value : notifications.value.results || [])
    : []

  const ordersData = orders.status === 'fulfilled' ? orders.value : []

  return (
    <WholesaleProfileClient
      initialProfile={profileData}
      initialNotifications={notificationsData}
      initialOrders={ordersData}
      accessToken={accessToken}
    />
  )
}