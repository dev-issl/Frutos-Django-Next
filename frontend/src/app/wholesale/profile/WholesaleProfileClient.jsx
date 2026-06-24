

'use client'
// src/app/wholesale/profile/WholesaleProfileClient.jsx
import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  updateWholesaleProfile, changeWholesalePassword, uploadWholesaleProfileImage,
  markWholesaleNotificationsRead, deleteWholesaleOrder, deleteWholesaleNotification,
} from '@/lib/api'

import ProfileSidebar      from './ProfileSidebar'
import OverviewTab        from './_tabs/OverviewTab'
import OrdersTab          from './_tabs/OrdersTab'
import NotificationsTab   from './_tabs/NotificationsTab'
import SettingsTab        from './_tabs/SettingsTab'
import OrderLineTab       from './_tabs/OrderLineTab'
import AccountInfoTab     from './_tabs/AccountInfoTab'
import WholesaleSupportTicketsTab from './_tabs/WholesaleSupportTicketsTab'
export default function WholesaleProfileClient({ initialProfile, initialNotifications, initialOrders, accessToken }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update: updateSession } = useSession()

  const [profile,       setProfile]       = useState(initialProfile)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [orders,        setOrders]        = useState(initialOrders || [])
  
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams?.get('tab')
    return tab || 'overview'
  })

  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  // ── Edit profile ──────────────────────────────────────────────────────────
  const [editForm,    setEditForm]    = useState({
    contact_name:   profile.contact_name   || '',
    phone:          profile.phone          || '',
    postcode:       profile.postcode       || '',
    monthly_volume: profile.monthly_volume || '',
  })
  const [editSaving,  setEditSaving]  = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)
  const [editError,   setEditError]   = useState('')

  const handleEditChange = e => {
    setEditForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setEditSuccess(false); setEditError('')
  }
  const handleEditSave = async () => {
    setEditSaving(true); setEditError('')
    try {
      const updated = await updateWholesaleProfile(accessToken, editForm)
      setProfile(p => ({ ...p, ...updated }))
      setEditSuccess(true)
      await updateSession({ contactName: updated.contact_name })
    } catch { setEditError('Failed to save changes. Please try again.') }
    finally  { setEditSaving(false) }
  }

  const [imageUploading, setImageUploading] = useState(false)
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageUploading(true)
    try {
      const updated = await uploadWholesaleProfileImage(accessToken, file)
      const newImageUrl = updated.profile_image_url || updated.profile_image || p.profile_image;
      setProfile(p => ({ 
        ...p, 
        profile_image: newImageUrl,
        profile_image_url: newImageUrl
      }))
      await updateSession({ profileImage: newImageUrl })
    } catch (err) {
      console.error('Failed to upload image:', err)
      alert('Failed to upload image. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  const [pwForm,    setPwForm]    = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError,   setPwError]   = useState('')

  const handlePwChange = e => { setPwForm(p => ({ ...p, [e.target.name]: e.target.value })); setPwError(''); setPwSuccess(false) }
  const handlePasswordSave = async () => {
    if (pwForm.new_password !== pwForm.confirm) return setPwError('Passwords do not match.')
    if (pwForm.new_password.length < 8)         return setPwError('Min 8 characters.')
    setPwSaving(true); setPwError('')
    try {
      await changeWholesalePassword(accessToken, pwForm.old_password, pwForm.new_password)
      setPwSuccess(true)
      setPwForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwError(err?.old_password?.[0] || err?.detail || 'Failed to change password.')
    } finally { setPwSaving(false) }
  }

  // ── Notifications 
  const unreadCount = notifications.filter(n => !n.is_read).length
  const handleMarkAllRead   = async () => {
    await markWholesaleNotificationsRead(accessToken, [])
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
  }
  const handleDeleteNotif = async id => {
  try {
    await deleteWholesaleNotification(accessToken, id)
    setNotifications(p => p.filter(n => n.id !== id))
  } catch {
    console.error('Failed to remove notification.')
  }
}

  // ── Orders ────────────────────────────────────────────────────────────────
  const handleDeleteOrder = async orderNumber => {
  try {
    await deleteWholesaleOrder(accessToken, orderNumber)
    setOrders(p => p.filter(o => o.orderNumber !== orderNumber))
  } catch {
    console.error('Failed to cancel order.') 
  }
}

  const handleLogout = async () => {
    localStorage.removeItem('cart_items')
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart_clear'))
    await signOut({ redirect: false })
    router.push('/wholesale')
  }

  const tabs = [
    { id: 'overview',       label: 'Dashboard' },
    { id: 'order_line',     label: 'Order Line' },
    { id: 'account_info',   label: 'Account Info' },
    { id: 'orders',         label: `Orders${orders.length ? ` (${orders.length})` : ''}` },
    { id: 'support_tickets',label: 'Support Tickets' },
    { id: 'notifications',  label: `Notification${unreadCount ? ` (${unreadCount})` : ''}` },
    { id: 'settings',       label: 'Settings' },
  ]

  return (
    <div className="bg-[#f8fcfb] min-h-screen flex flex-col md:flex-row">
      <ProfileSidebar
        profile={profile} activeTab={activeTab} setActiveTab={setActiveTab}
        tabs={tabs} onLogout={handleLogout}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 md:p-3 h-full">
          {activeTab === 'overview' && (
            <OverviewTab profile={profile} orders={orders} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'order_line' && (
            <OrderLineTab accessToken={accessToken} />
          )}
          {activeTab === 'account_info' && (
            <AccountInfoTab profile={profile} onImageUpload={handleImageUpload} imageUploading={imageUploading} />
          )}
          {activeTab === 'orders' && (
            <OrdersTab orders={orders} onDeleteOrder={handleDeleteOrder} setProfileActiveTab={setActiveTab} accessToken={accessToken} />
          )}
          {activeTab === 'support_tickets' && (
            <WholesaleSupportTicketsTab accessToken={accessToken} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead}
              onDelete={handleDeleteNotif}
              orders={orders}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              profile={profile} editForm={editForm} onChange={handleEditChange}
              onSave={handleEditSave} saving={editSaving} success={editSuccess} error={editError}
              pwForm={pwForm} pwOnChange={handlePwChange} pwOnSave={handlePasswordSave}
              pwSaving={pwSaving} pwSuccess={pwSuccess} pwError={pwError}
            />
          )}
        </div>
      </div>
    </div>
  )
}