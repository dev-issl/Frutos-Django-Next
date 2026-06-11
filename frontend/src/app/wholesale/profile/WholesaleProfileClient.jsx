

'use client'
// src/app/wholesale/profile/WholesaleProfileClient.jsx
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import {
  updateWholesaleProfile, changeWholesalePassword, uploadWholesaleProfileImage,
  markWholesaleNotificationsRead, deleteWholesaleOrder, deleteWholesaleNotification,
} from '@/lib/api'

import ProfileHeader      from './ProfileHeader'
import OverviewTab        from './_tabs/OverviewTab'
import OrdersTab          from './_tabs/OrdersTab'
import NotificationsTab   from './_tabs/NotificationsTab'
import SettingsTab        from './_tabs/SettingsTab'

export default function WholesaleProfileClient({ initialProfile, initialNotifications, initialOrders, accessToken }) {
  const router = useRouter()
  const { update: updateSession } = useSession()

  const [profile,       setProfile]       = useState(initialProfile)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [orders,        setOrders]        = useState(initialOrders || [])
  const [activeTab,     setActiveTab]     = useState('overview')

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
      setProfile(p => ({ ...p, profile_image: updated.profile_image_url || p.profile_image }))
      await updateSession({ profileImage: updated.profile_image_url })
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

  const handleLogout = async () => { await signOut({ redirect: false }); router.push('/wholesale') }

  const tabs = [
    { id: 'overview',       label: 'Overview' },
    { id: 'orders',         label: `Orders${orders.length ? ` (${orders.length})` : ''}` },
    { id: 'notifications',  label: `Notification${unreadCount ? ` (${unreadCount})` : ''}` },
    { id: 'settings',       label: 'Settings' },
  ]

  return (
    <div className="bg-gray-50/50 min-h-screen pb-12">
      <ProfileHeader
        profile={profile} activeTab={activeTab} setActiveTab={setActiveTab}
        tabs={tabs} onLogout={handleLogout}
        onImageUpload={handleImageUpload}
        imageUploading={imageUploading}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col gap-6">
          {activeTab === 'overview' && (
            <OverviewTab profile={profile} orders={orders} />
          )}
          {activeTab === 'orders' && (
            <OrdersTab orders={orders} onDeleteOrder={handleDeleteOrder} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={notifications} unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead} onDelete={handleDeleteNotif}
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