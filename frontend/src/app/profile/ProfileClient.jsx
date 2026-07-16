

// 'use client'
// import { useState, useEffect } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { useAuth } from '@/app/context/AuthContext'

// import ProfileTab       from './tabs/ProfileTab'
// import AddressesTab     from './tabs/AddressesTab'
// import OrdersTab        from './tabs/OrdersTab'
// import NotificationsTab from './tabs/NotificationsTab'
// // 1. SavedItemsTab import koro
// import SavedItemsTab    from './tabs/SavedItemsTab' 

// const TABS = [
//   { id: 'profile',       label: 'My Profile',       icon: 'person'        },
//   { id: 'saved',         label: 'Saved Items',      icon: 'favorite'      }, // 2. Notun tab add koro
//   { id: 'addresses',     label: 'Saved Addresses',  icon: 'location_on'   },
//   { id: 'orders',        label: 'Order History',    icon: 'receipt_long'  },
//   { id: 'notifications', label: 'Notifications',    icon: 'notifications' },
// ]

// export default function ProfileClient({
//   initialProfile       = null,
//   initialAddresses     = null,
//   initialOrders        = null,
//   initialNotifications = null,
//   initialWishlist      = null, // 3. initialWishlist prop-ti add koro
// }) {
//   const { user, loading, isAuthenticated, authFetch, logout, uploadAvatar } = useAuth()
//   const searchParams = useSearchParams()
//   const router       = useRouter()

//   const [activeTab, setActiveTab] = useState(() => {
//     const tab = searchParams?.get('tab')
//     return tab && TABS.find(t => t.id === tab) ? tab : 'profile'
//   })

//   const [localUser, setLocalUser] = useState(initialProfile || null)

//   useEffect(() => {
//     if (!loading && !isAuthenticated) router.replace('/')
//   }, [loading, isAuthenticated, router])

//   useEffect(() => {
//     if (user && !localUser) setLocalUser(user)
//   }, [user])

//   useEffect(() => {
//     const tab = searchParams?.get('tab')
//     if (tab && TABS.find(t => t.id === tab)) setActiveTab(tab)
//   }, [searchParams])

//   if ((loading && !localUser)) {
//     return (
//       <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f9f5' }}>
//         <div className="flex flex-col items-center gap-3">
//           <svg style={{ animation: 'spin 1s linear infinite', width: '32px', height: '32px' }} fill="none" viewBox="0 0 24 24">
//             <circle cx="12" cy="12" r="10" stroke="#00694C" strokeWidth="3" strokeOpacity=".2"/>
//             <path d="M12 2a10 10 0 0 1 10 10" stroke="#00694C" strokeWidth="3" strokeLinecap="round"/>
//           </svg>
//           <p className="text-sm" style={{ color: '#6d7a73' }}>Loading profile…</p>
//         </div>
//         <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//       </div>
//     )
//   }

//   const displayUser = localUser || user

//   return (
//     <div style={{ background: '#f5f9f5', minHeight: '100vh' }}>
//       <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-3xl md:text-4xl italic font-light"
//               style={{ fontFamily: '"Newsreader",Georgia,serif', color: '#151e13' }}>
//               My Account
//             </h1>
//             <p className="text-sm mt-1" style={{ color: '#6d7a73' }}>
//               Welcome back, <span className="font-medium" style={{ color: '#151e13' }}>{displayUser?.firstName || displayUser?.email}</span>
//             </p>
//           </div>
//           <button onClick={logout} className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#eaeaea] bg-white text-[#6d7a73]">
//             <span className="material-symbols-outlined text-base">logout</span>
//             <span className="hidden sm:inline">Sign Out</span>
//           </button>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
//           {/* Sidebar */}
//           <nav className="flex  lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
//             {TABS.map(tab => {
//               const isActive = activeTab === tab.id
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className="cursor-pointer flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium flex-shrink-0 w-auto lg:w-full text-left"
//                   style={{
//                     background: isActive ? '#00694C' : '#fff',
//                     color: isActive ? '#fff' : '#3d4943',
//                     border: isActive ? 'none' : '1px solid #eaeaea',
//                   }}
//                 >
//                   <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
//                     {tab.icon}
//                   </span>
//                   <span className="whitespace-nowrap">{tab.label}</span>
//                 </button>
//               )
//             })}
//           </nav>

//           {/* Main Content */}
//           <main>
//             {activeTab === 'profile' && displayUser && (
//               <ProfileTab user={displayUser} authFetch={authFetch} uploadAvatar={uploadAvatar} onUserUpdate={setLocalUser} />
//             )}
            
//             {/* 4. Saved Items Tab Rendering */}
//             {activeTab === 'saved' && (
//               <SavedItemsTab 
//                 authFetch={authFetch} 
//                 initialWishlist={initialWishlist} 
//               />
//             )}

//             {activeTab === 'addresses' && <AddressesTab authFetch={authFetch} initialAddresses={initialAddresses} />}
//             {activeTab === 'orders' && <OrdersTab authFetch={authFetch} initialOrders={initialOrders} />}
//             {activeTab === 'notifications' && <NotificationsTab authFetch={authFetch} initialNotifications={initialNotifications} />}
//           </main>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

import ProfileTab       from './tabs/ProfileTab'
import AddressesTab     from './tabs/AddressesTab'
import OrdersTab        from './tabs/OrdersTab'
import NotificationsTab from './tabs/NotificationsTab'
import SavedItemsTab    from './tabs/SavedItemsTab'
import TrackingTab      from './tabs/TrackingTab'
import SupportTicketsTab from './tabs/SupportTicketsTab'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

const TABS = [
  { id: 'profile',       label: 'My Profile',       icon: 'person'          },
  { id: 'tracking',      label: 'Track Order',      icon: 'local_shipping'  },
  { id: 'saved',         label: 'Saved Items',      icon: 'favorite'        },
  { id: 'addresses',     label: 'Saved Addresses',  icon: 'location_on'     },
  { id: 'orders',        label: 'Order History',    icon: 'receipt_long'    },
  { id: 'notifications', label: 'Notifications',    icon: 'notifications'   },
  { id: 'tickets',       label: 'Support Tickets',  icon: 'help'            },
]

export default function ProfileClient({
  initialProfile       = null,
  initialAddresses     = null,
  initialOrders        = null,
  initialNotifications = null,
  initialWishlist      = null,
}) {
  const { user, loading, isAuthenticated, authFetch, logout, uploadAvatar } = useAuth()
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [activeTab,    setActiveTab]    = useState(() => {
    const tab = searchParams?.get('tab')
    return tab && TABS.find(t => t.id === tab) ? tab : 'profile'
  })
  const [localUser,    setLocalUser]    = useState(initialProfile || null)
  const [unreadCount,  setUnreadCount]  = useState(0)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (user && !localUser) setLocalUser(user)
  }, [user])

  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab && TABS.find(t => t.id === tab)) setActiveTab(tab)
  }, [searchParams])

  // ── Unread notification count (sidebar badge) — via SSE + fallback poll ──
  useEffect(() => {
    // Initial fetch
    async function fetchUnread() {
      try {
        const res  = await authFetch(`${API_BASE}/auth/notifications/unread-count/`)
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
      } catch { /* ignore */ }
    }
    fetchUnread()

    // SSE connection for instant badge updates
    let es = null
    let retryTimeout = null
    function playNotifSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        // First tone
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(880, ctx.currentTime)  // A5
        gain1.gain.setValueAtTime(0.4, ctx.currentTime)
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(ctx.currentTime)
        osc1.stop(ctx.currentTime + 0.3)
        // Second tone (slightly lower, delayed)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.15)  // E5
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(ctx.currentTime + 0.15)
        osc2.stop(ctx.currentTime + 0.5)
      } catch { /* browser may block audio before user gesture */ }
    }
    function connectSSE() {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const url = `${API_BASE}/auth/notifications/stream/?token=${encodeURIComponent(token)}`
      es = new EventSource(url)
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // Ignore heartbeats
          if (!data || !data.id) return
          // Play sound
          playNotifSound()
          // Increment badge
          setUnreadCount(prev => prev + 1)
        } catch {
          // Fallback: still increment badge even if parse fails
          setUnreadCount(prev => prev + 1)
        }
      }
      es.onerror = () => {
        es.close()
        retryTimeout = setTimeout(connectSSE, 3000)
      }
    }
    connectSSE()

    // Fallback poll every 15s
    const id = setInterval(fetchUnread, 15_000)
    return () => {
      clearInterval(id)
      if (es) es.close()
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [authFetch])

  if (loading && !localUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-[#00694C]" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".2"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-gray-500 font-medium">Loading profile…</p>
        </div>
      </div>
    )
  }

  const displayUser = localUser || user

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#151e13] font-['Newsreader'] tracking-tight">
              My Account
            </h1>
            <p className="text-sm mt-1 text-gray-500">
              Welcome back,{' '}
              <span className="font-semibold text-[#151e13]">
                {[displayUser?.firstName, displayUser?.lastName].filter(Boolean).join(' ') || displayUser?.email}
              </span>
            </p>
          </div>
          <button
            onClick={logout}
            className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">

          {/* Sidebar */}
          <nav className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer relative flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold flex-shrink-0 w-auto lg:w-full text-left transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#00694C] text-white shadow-md' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-[#00694C]/30 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px] transition-transform duration-300"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap tracking-wide">{tab.label}</span>

                  {/* Live dot on tracking tab */}
                  {tab.id === 'tracking' && !isActive && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#00694C] animate-pulse flex-shrink-0" />
                  )}

                  {/* Unread count badge on notifications tab */}
                  {tab.id === 'notifications' && unreadCount > 0 && (
                    <span
                      className="ml-auto flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#BA1A1A', color: '#fff' }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Main content */}
          <main>
            {activeTab === 'profile' && displayUser && (
              <ProfileTab
                user={displayUser}
                authFetch={authFetch}
                uploadAvatar={uploadAvatar}
                onUserUpdate={setLocalUser}
              />
            )}

            {/* ── Track Order ── */}
            {activeTab === 'tracking' && (
              <TrackingTab
                authFetch={authFetch}
                initialOrders={initialOrders}
              />
            )}

            {activeTab === 'saved' && (
              <SavedItemsTab authFetch={authFetch} initialWishlist={initialWishlist} />
            )}

            {activeTab === 'addresses' && (
              <AddressesTab authFetch={authFetch} initialAddresses={initialAddresses} />
            )}

            {activeTab === 'orders' && (
              <OrdersTab authFetch={authFetch} initialOrders={initialOrders} />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab
                authFetch={authFetch}
                initialNotifications={initialNotifications}
                onCountChange={setUnreadCount}
              />
            )}

            {activeTab === 'tickets' && (
              <SupportTicketsTab authFetch={authFetch} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}