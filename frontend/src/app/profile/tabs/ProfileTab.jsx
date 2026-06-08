'use client'
import { useState, useRef } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00694C] focus:ring-1 focus:ring-[#00694C] outline-none transition-all text-sm bg-gray-50/50 text-[#151e13] placeholder-gray-400";

export default function ProfileTab({ user, authFetch, uploadAvatar, onUserUpdate }) {
  const [form, setForm] = useState({
    firstName:          user?.firstName || '',
    lastName:           user?.lastName  || '',
    phone:              user?.profile?.phone || '',
    bio:                user?.profile?.bio   || '',
    notifOrderUpdates:  user?.profile?.notifOrderUpdates  ?? true,
    notifPromotions:    user?.profile?.notifPromotions    ?? true,
    notifPriceChanges:  user?.profile?.notifPriceChanges  ?? true,
    notifLeftoverPacks: user?.profile?.notifLeftoverPacks ?? true,
  })

  //  Server থেকে আসা avatar আলাদা রাখো
  const serverAvatar = user?.profile?.resolvedAvatar || ''

  //  Local preview URL (blob) — server/AuthContext এর উপর নির্ভর করে না
  const [previewUrl,    setPreviewUrl]    = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [passForm,      setPassForm]      = useState({ oldPassword: '', newPassword: '' })
  const [passError,     setPassError]     = useState('')
  const [passSaved,     setPassSaved]     = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarSaved,   setAvatarSaved]   = useState(false)
  const [avatarError,   setAvatarError]   = useState('')
  const fileRef = useRef(null)

  // যে URL দেখাবে: local preview > server avatar
  const displayAvatar = previewUrl || serverAvatar

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    //  ফাইল select করার সাথে সাথেই local blob URL দিয়ে preview দেখাও
    const blobUrl = URL.createObjectURL(file)
    setPreviewUrl(blobUrl)

    setAvatarError(''); setAvatarSaved(false); setAvatarLoading(true)
    try {
      await uploadAvatar(file)
      setAvatarSaved(true)
      setTimeout(() => setAvatarSaved(false), 3000)
    } catch {
      setPreviewUrl('')   // error হলে preview সরাও
      setAvatarError('Upload failed. Please try a smaller image.')
    } finally {
      setAvatarLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res  = await authFetch(`${API_BASE}/auth/profile/`, { method: 'PATCH', body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error()

      //  server response-এ avatar না থাকলে previewUrl বা serverAvatar preserve করো
      const finalAvatar = data.profile?.resolvedAvatar || previewUrl || serverAvatar || ''
      const merged = {
        ...data,
        profile: { ...data.profile, resolvedAvatar: finalAvatar },
      }
      onUserUpdate(merged)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function changePassword(e) {
    e.preventDefault()
    setPassError('')
    try {
      const res = await authFetch(`${API_BASE}/auth/change-password/`, { method: 'POST', body: JSON.stringify(passForm) })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.oldPassword?.[0] || d.detail || 'Error')
      }
      setPassSaved(true)
      setPassForm({ oldPassword: '', newPassword: '' })
      setTimeout(() => setPassSaved(false), 3000)
    } catch (err) { setPassError(err.message) }
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-6 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-emerald-50 border-4 border-emerald-500/10 relative">
            {/*  displayAvatar ব্যবহার করো — blob URL বা server URL */}
            {displayAvatar
              ? <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-emerald-200">person</span>
                </div>
            }
            {avatarLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
          <button 
            onClick={() => fileRef.current?.click()} 
            disabled={avatarLoading}
            className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer bg-[#00694C] border-[2.5px] border-white shadow-md hover:bg-[#085041] transition-colors ${avatarLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-white text-[14px]">edit</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-bold text-xl text-[#151e13] font-['Newsreader'] tracking-tight">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {avatarLoading && <p className="text-xs font-medium mt-1.5 text-amber-600">Uploading photo…</p>}
          {avatarSaved && !avatarLoading && (
            <p className="text-xs font-medium mt-1.5 flex items-center gap-1 text-[#00694C]">
              <span className="material-symbols-outlined text-[16px]">check_circle</span> Photo updated!
            </p>
          )}
          {avatarError && !avatarLoading && <p className="text-xs font-medium mt-1.5 text-red-600">{avatarError}</p>}
          {!avatarLoading && !avatarSaved && !avatarError && (
            <button 
              onClick={() => fileRef.current?.click()} 
              className="text-xs font-semibold mt-2 text-[#00694C] hover:text-[#085041] transition-colors"
            >
              Change photo
            </button>
          )}
        </div>
      </div>

      {/* Personal info */}
      <form onSubmit={saveProfile} className="p-6 rounded-2xl space-y-5 bg-white border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-[#151e13] font-['Newsreader']">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
            <input className={inputClass} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Jane" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
            <input className={inputClass} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Phone</label>
          <input className={inputClass} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+44 7700 900077" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Bio</label>
          <textarea 
            className={`${inputClass} min-h-[100px] resize-y`}
            value={form.bio} 
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} 
            placeholder="Tell us a little about yourself…" 
          />
        </div>

        <h3 className="font-bold text-lg text-[#151e13] font-['Newsreader'] pt-4 border-t border-gray-100">Notification Preferences</h3>
        <div className="space-y-1">
          {[
            { key: 'notifOrderUpdates',  label: 'Order updates',        sub: 'Status changes for your orders' },
            { key: 'notifPromotions',    label: 'Promotional offers',   sub: 'Exclusive deals and discounts'  },
            { key: 'notifPriceChanges',  label: 'Price changes',        sub: 'When favourites drop in price'  },
            { key: 'notifLeftoverPacks', label: 'Leftover pack alerts', sub: 'End-of-day fresh packs'         },
          ].map(({ key, label, sub }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-50 last:border-0 group">
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#00694C] transition-colors">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
              <div 
                onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${form[key] ? 'bg-[#00694C]' : 'bg-gray-300'}`}
              >
                <div 
                  className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${form[key] ? 'left-[22px]' : 'left-[3px]'}`} 
                />
              </div>
            </label>
          ))}
        </div>

        <button 
          type="submit" 
          disabled={saving} 
          className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all mt-4 ${
            saved 
              ? 'bg-[#085041] shadow-md shadow-[#085041]/20' 
              : saving 
                ? 'bg-[#00694C]/70 cursor-not-allowed' 
                : 'bg-[#00694C] hover:bg-[#085041] shadow-md shadow-[#00694C]/20 hover:-translate-y-0.5'
          }`}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved Successfully!' : 'Save Changes'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={changePassword} className="p-6 rounded-2xl space-y-5 bg-white border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-[#151e13] font-['Newsreader']">Change Password</h3>
        
        {passError && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {passError}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Current Password</label>
            <input type="password" className={inputClass} value={passForm.oldPassword}
              onChange={e => setPassForm(p => ({ ...p, oldPassword: e.target.value }))} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">New Password</label>
            <input type="password" className={inputClass} value={passForm.newPassword}
              onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 8 characters" />
          </div>
        </div>
        
        <button 
          type="submit" 
          className={`px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all ${
            passSaved 
              ? 'bg-[#085041] shadow-md shadow-[#085041]/20' 
              : 'bg-[#151e13] hover:bg-black shadow-md hover:-translate-y-0.5'
          }`}
        >
          {passSaved ? '✓ Password Changed!' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
