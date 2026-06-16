// 'use client'
// import { useState, useEffect, useRef, useCallback } from 'react'
// import StatusBadge from '../components/StatusBadge'
// import ConfirmModal from '../components/ConfirmModal'

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
// const fmt = (n) => Number(n || 0).toFixed(2)

// const NOTIF_ICON_COLORS = {
//   order_update:  '#00694C',
//   promo:         '#855000',
//   price_change:  '#1976D2',
//   leftover_pack: '#6D4C41',
// }

// export default function NotificationsTab({ authFetch }) {
//   const [notifs,        setNotifs]        = useState([])
//   const [loading,       setLoading]       = useState(true)
//   const [expanded,      setExpanded]      = useState(null)
//   const [orderCache,    setOrderCache]    = useState({})
//   const [fetchingOrder, setFetchingOrder] = useState({})
//   const [confirmDelete, setConfirmDelete] = useState(null)
//   const [hasNew,        setHasNew]        = useState(false)  // ← নতুন নোটিফ indicator
//   const prevIdsRef = useRef(new Set())

//   // ── Fetch notifications ──────────────────────────────────────────────────
//   const fetchNotifs = useCallback(async (isInitial = false) => {
//     try {
//       const r    = await authFetch(`${API_BASE}/auth/notifications/`)
//       const data = await r.json()
//       const list = Array.isArray(data) ? data : (data.results || [])  // ← এটাই fix

//       if (!isInitial) {
//         const newIds = list.map(n => n.id)
//         const hasNewNotif = newIds.some(id => !prevIdsRef.current.has(id))
//         if (hasNewNotif) setHasNew(true)
//       }

//       prevIdsRef.current = new Set(list.map(n => n.id))
//       setNotifs(list)
//     } catch {
//       if (isInitial) setNotifs([])
//     } finally {
//       if (isInitial) setLoading(false)
//     }
//   }, [authFetch])

//   // ── Initial load ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     fetchNotifs(true)
//   }, [fetchNotifs])

//   // ── Real-time polling — every 8 seconds ──────────────────────────────────
//   useEffect(() => {
//     const interval = setInterval(() => fetchNotifs(false), 8_000)
//     return () => clearInterval(interval)
//   }, [fetchNotifs])

//   // ── Page visibility — tab active হলে তুরন্ত refresh ──────────────────────
//   useEffect(() => {
//     function onVisible() {
//       if (document.visibilityState === 'visible') fetchNotifs(false)
//     }
//     document.addEventListener('visibilitychange', onVisible)
//     return () => document.removeEventListener('visibilitychange', onVisible)
//   }, [fetchNotifs])

//   async function markAll() {
//     await authFetch(`${API_BASE}/auth/notifications/mark-read/`, {
//       method: 'POST', body: JSON.stringify({ all: true }),
//     })
//     setNotifs(p => p.map(n => ({ ...n, isRead: true })))
//     setHasNew(false)
//   }

//   async function handleClick(notif) {
//     const isOpening = expanded !== notif.id
//     setExpanded(isOpening ? notif.id : null)
//     if (notif.id === expanded) setHasNew(false)

//     if (!notif.isRead) {
//       await authFetch(`${API_BASE}/auth/notifications/mark-read/`, {
//         method: 'POST', body: JSON.stringify({ ids: [notif.id] }),
//       })
//       setNotifs(p => p.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
//     }

//     if (isOpening && notif.type === 'order_update' && !orderCache[notif.id]) {
//       const meta = notif.metadata || {}
//       const hasCompleteData = meta.items?.length > 0 && Number(meta.total) > 0
//       if (!hasCompleteData) {
//         setFetchingOrder(p => ({ ...p, [notif.id]: true }))
//         try {
//           const res    = await authFetch(`${API_BASE}/auth/orders/`)
//           const orders = await res.json()
//           const match  = meta.orderNumber
//             ? orders.find(o => o.orderNumber === meta.orderNumber)
//             : orders[0]
//           if (match) setOrderCache(p => ({ ...p, [notif.id]: match }))
//         } catch { /* silently fail */ }
//         setFetchingOrder(p => ({ ...p, [notif.id]: false }))
//       }
//     }
//   }

//   async function confirmDeleteNotif() {
//     const id = confirmDelete
//     setConfirmDelete(null)
//     try {
//       await authFetch(`${API_BASE}/auth/notifications/${id}/`, { method: 'DELETE' })
//       setNotifs(p => p.filter(n => n.id !== id))
//       if (expanded === id) setExpanded(null)
//     } catch { /* ignore */ }
//   }

//   if (loading) return (
//     <div className="py-12 text-center" style={{ color: '#6d7a73' }}>
//       Loading notifications…
//     </div>
//   )

//   const unread = notifs.filter(n => !n.isRead).length

//   return (
//     <>
//       {confirmDelete !== null && (
//         <ConfirmModal onConfirm={confirmDeleteNotif} onCancel={() => setConfirmDelete(null)} />
//       )}
//       <div>
//         <div className="flex items-center justify-between mb-4">
//           {/* ← নতুন notification এলে subtle banner */}
//           {hasNew && (
//             <button onClick={() => { setHasNew(false) }}
//               className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
//               style={{ background: '#D1FAE5', color: '#00694C', border: '1px solid #6EE7B7' }}>
//               <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>fiber_new</span>
//               New notification arrived
//             </button>
//           )}
//           {unread > 0 && (
//             <button onClick={markAll} className="text-sm font-medium cursor-pointer ml-auto"
//               style={{ color: '#00694C', background: 'none', border: 'none' }}>
//               Mark all as read ({unread})
//             </button>
//           )}
//         </div>

//         {!notifs.length ? (
//           <div className="py-16 text-center">
//             <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#BCCAC1' }}>notifications_none</span>
//             <p className="italic text-lg" style={{ fontFamily: '"Newsreader",Georgia,serif', color: '#6d7a73' }}>No notifications yet</p>
//           </div>
//         ) : (
//           <div className="space-y-2">
//             {notifs.map(notif => {
//               const iconColor    = NOTIF_ICON_COLORS[notif.type] || '#6D7A73'
//               const isExpanded   = expanded === notif.id
//               const rawMeta      = notif.metadata || {}
//               const fetchedOrder = orderCache[notif.id]
//               const isFetching   = fetchingOrder[notif.id]

//               const meta = fetchedOrder ? {
//                 orderNumber:  fetchedOrder.orderNumber  || rawMeta.orderNumber,
//                 status:       fetchedOrder.status       || rawMeta.status,
//                 customerName: fetchedOrder.customerName || rawMeta.customerName,
//                 street:       fetchedOrder.street       || rawMeta.street,
//                 city:         fetchedOrder.city         || rawMeta.city,
//                 postcode:     fetchedOrder.postcode     || rawMeta.postcode,
//                 deliveryDate: fetchedOrder.deliveryDate || rawMeta.deliveryDate,
//                 deliverySlot: fetchedOrder.deliverySlot || rawMeta.deliverySlot,
//                 subtotal:     fetchedOrder.subtotal     ?? rawMeta.subtotal,
//                 deliveryFee:  fetchedOrder.deliveryFee  ?? rawMeta.deliveryFee,
//                 total:        fetchedOrder.total        ?? rawMeta.total,
//                 items: fetchedOrder.items?.map(i => ({
//                   product_name:  i.productName,
//                   product_image: i.productImage,
//                   quantity:      i.quantity,
//                   unit_price:    i.unitPrice,
//                 })) || rawMeta.items,
//               } : rawMeta

//               return (
//                 <div key={notif.id} className="rounded-xl overflow-hidden"
//                   style={{ border: `1px solid ${notif.isRead ? '#eaeaea' : '#B3E5D0'}` }}>
//                   <div className="flex items-start gap-4 p-4" style={{ background: notif.isRead ? '#fff' : '#F0FAF5' }}>
//                     <div onClick={() => handleClick(notif)}
//                       className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
//                       style={{ background: `${iconColor}18` }}>
//                       <span className="material-symbols-outlined"
//                         style={{ color: iconColor, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
//                         {notif.icon}
//                       </span>
//                     </div>
//                     <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(notif)}>
//                       <div className="flex items-start justify-between gap-2">
//                         <p className="text-sm font-bold" style={{ color: '#151e13' }}>{notif.title}</p>
//                         <div className="flex items-center gap-1.5 flex-shrink-0">
//                           {!notif.isRead && <div className="w-2 h-2 rounded-full" style={{ background: '#00694C' }} />}
//                           <span className="material-symbols-outlined text-base"
//                             style={{ color: '#BCCAC1', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
//                             expand_more
//                           </span>
//                         </div>
//                       </div>
//                       <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6d7a73' }}>{notif.message}</p>
//                       <p className="text-[10px] mt-1.5" style={{ color: '#BCCAC1' }}>
//                         {new Date(notif.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
//                       </p>
//                     </div>
//                     <button onClick={e => { e.stopPropagation(); setConfirmDelete(notif.id) }}
//                       style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#BCCAC1', flexShrink: 0, borderRadius: '8px', transition: 'color .15s, background .15s' }}
//                       onMouseEnter={e => { e.currentTarget.style.color = '#BA1A1A'; e.currentTarget.style.background = '#FEE2E2' }}
//                       onMouseLeave={e => { e.currentTarget.style.color = '#BCCAC1'; e.currentTarget.style.background = 'transparent' }}>
//                       <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
//                     </button>
//                   </div>

//                   {isExpanded && notif.type === 'order_update' && (
//                     <div style={{ borderTop: '1px solid #E8F5EE', background: '#FAFDF9' }}>
//                       {isFetching ? (
//                         <div className="flex items-center justify-center gap-2 py-6">
//                           <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none">
//                             <circle cx="12" cy="12" r="10" stroke="#00694C" strokeWidth="3" strokeOpacity=".25"/>
//                             <path d="M12 2a10 10 0 0 1 10 10" stroke="#00694C" strokeWidth="3" strokeLinecap="round"/>
//                           </svg>
//                           <span className="text-sm" style={{ color: '#6d7a73' }}>Loading order details…</span>
//                         </div>
//                       ) : (
//                         <>
//                           <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8F5EE' }}>
//                             <span className="font-mono text-xs font-bold" style={{ color: '#3d4943' }}>{meta.orderNumber || '—'}</span>
//                             {meta.status && <StatusBadge status={meta.status} />}
//                           </div>
//                           <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
//                             <div className="p-4" style={{ borderRight: '1px solid #E8F5EE', borderBottom: '1px solid #E8F5EE' }}>
//                               <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#6d7a73' }}>Customer</p>
//                               <div className="space-y-1.5">
//                                 {meta.customerName && <p className="text-xs" style={{ color: '#3d4943' }}>{meta.customerName}</p>}
//                                 {meta.street && <p className="text-xs" style={{ color: '#3d4943' }}>{meta.street}, {meta.city} {meta.postcode}</p>}
//                                 {meta.deliveryDate && <p className="text-xs" style={{ color: '#3d4943' }}>{meta.deliveryDate}{meta.deliverySlot && ` · ${meta.deliverySlot}`}</p>}
//                               </div>
//                             </div>
//                             <div className="p-4" style={{ borderBottom: '1px solid #E8F5EE' }}>
//                               <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#6d7a73' }}>Order Summary</p>
//                               <div className="space-y-1">
//                                 <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}><span>Subtotal</span><span>€{fmt(meta.subtotal)}</span></div>
//                                 <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}><span>Delivery</span><span>{Number(meta.deliveryFee) === 0 ? 'Free' : `€${fmt(meta.deliveryFee)}`}</span></div>
//                                 <div className="flex justify-between text-sm font-bold pt-1.5" style={{ borderTop: '1px solid #e0eee8' }}>
//                                   <span style={{ color: '#151e13' }}>Total</span>
//                                   <span style={{ color: '#855000' }}>€{fmt(meta.total)}</span>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                           {meta.items?.length > 0 && (
//                             <div className="px-4 pb-4">
//                               <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pt-3" style={{ color: '#6d7a73' }}>Items</p>
//                               <div className="space-y-2">
//                                 {meta.items.map((item, i) => (
//                                   <div key={i} className="flex items-center gap-3">
//                                     {item.product_image && (
//                                       <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#ECF7E4' }}>
//                                         <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
//                                       </div>
//                                     )}
//                                     <div className="flex-1 min-w-0">
//                                       <p className="text-xs font-medium truncate" style={{ color: '#151e13' }}>{item.product_name}</p>
//                                       <p className="text-[10px]" style={{ color: '#6d7a73' }}>{item.quantity} × €{fmt(item.unit_price)}</p>
//                                     </div>
//                                     <p className="text-xs font-bold" style={{ color: '#855000' }}>€{fmt(item.quantity * item.unit_price)}</p>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           )}
//                         </>
//                       )}
//                     </div>
//                   )}

//                   {isExpanded && notif.type !== 'order_update' && (
//                     <div className="px-5 py-4" style={{ borderTop: '1px solid #E8F5EE', background: '#FAFDF9' }}>
//                       <p className="text-sm leading-relaxed" style={{ color: '#3d4943' }}>{notif.message}</p>
//                     </div>
//                   )}
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </div>
//     </>
//   )
// }

'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge  from '../components/StatusBadge'
import ConfirmModal from '../components/ConfirmModal'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
const fmt = (n) => Number(n || 0).toFixed(2)

const NOTIF_ICON_COLORS = {
  order_update:  '#00694C',
  promo:         '#855000',
  price_change:  '#1976D2',
  leftover_pack: '#6D4C41',
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

// initialNotifications — pre-fetched by the server component; no spinner on first load.
export default function NotificationsTab({ authFetch, initialNotifications = null, onCountChange }) {
  const router = useRouter()
  const [notifs,        setNotifs]        = useState(() => toArray(initialNotifications))
  const [loading,       setLoading]       = useState(true)  // always load fresh
  const [expanded,      setExpanded]      = useState(null)
  const [orderCache,    setOrderCache]    = useState({})
  const [fetchingOrder, setFetchingOrder] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [hasNew,        setHasNew]        = useState(false)
  const prevIdsRef = useRef(new Set(toArray(initialNotifications).map(n => n.id)))

  // ── Fetch / refresh notifications ─────────────────────────────────────────
  const fetchNotifs = useCallback(async (isInitial = false) => {
    try {
      const r    = await authFetch(`${API_BASE}/auth/notifications/`)
      const data = await r.json()
      const list = toArray(data)

      if (!isInitial) {
        const hasNewNotif = list.some(n => !prevIdsRef.current.has(n.id))
        if (hasNewNotif) setHasNew(true)
      }
      prevIdsRef.current = new Set(list.map(n => n.id))
      setNotifs(list)
    } catch {
      if (isInitial) setNotifs([])
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [authFetch, onCountChange])

  // ── Sync Unread Count ──────────────────────────────────────────────────────
  useEffect(() => {
    if (onCountChange) {
      const unread = notifs.filter(n => !n.isRead).length
      onCountChange(unread)
    }
  }, [notifs, onCountChange])

  // ── Initial full fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifs(true)
  }, [fetchNotifs])

  // ── SSE — real-time push (instant when dashboard changes status) ───────────
  useEffect(() => {
    let es = null
    let retryTimeout = null

    function connect() {
      // Get token from localStorage (set by AuthContext)
      const token = localStorage.getItem('access_token')
      if (!token) return

      const url = `${API_BASE}/auth/notifications/stream/?token=${encodeURIComponent(token)}`
      es = new EventSource(url)

      es.onmessage = (event) => {
        try {
          const notif = JSON.parse(event.data)
          setNotifs(prev => {
            // avoid exact duplicates
            if (prev.some(n => n.id === notif.id)) return prev

            // If it's a grouped ticket reply, remove the older one for the same ticket
            let nextPrev = prev;
            if (notif.type === 'ticket_reply' && notif.metadata?.ticket_id) {
              const existingIdx = prev.findIndex(n => n.type === 'ticket_reply' && n.metadata?.ticket_id === notif.metadata.ticket_id);
              if (existingIdx !== -1) {
                nextPrev = [...prev];
                nextPrev.splice(existingIdx, 1);
              }
            }

            setHasNew(true)
            const next = [notif, ...nextPrev]
            return next
          })
          prevIdsRef.current.add(notif.id)
        } catch { /* ignore parse errors */ }
      }

      es.onerror = () => {
        es.close()
        // Reconnect after 3s on error
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      if (es) es.close()
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [onCountChange])

  // ── Fallback polling every 10s (keeps data fresh if SSE drops) ────────────
  useEffect(() => {
    const interval = setInterval(() => fetchNotifs(false), 10_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  // Refresh immediately when tab becomes visible
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') fetchNotifs(false)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchNotifs])

  async function markAll() {
    await authFetch(`${API_BASE}/auth/notifications/mark-read/`, {
      method: 'POST', body: JSON.stringify({ all: true }),
    })
    setNotifs(p => p.map(n => ({ ...n, isRead: true })))
    setHasNew(false)
  }

  async function handleClick(notif) {
    if (notif.type === 'ticket_reply' && notif.metadata?.ticket_id) {
      if (!notif.isRead) {
        authFetch(`${API_BASE}/auth/notifications/mark-read/`, {
          method: 'POST', body: JSON.stringify({ ids: [notif.id] }),
        })
        setNotifs(p => p.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
      }
      router.push(`/profile?tab=tickets&ticket_id=${notif.metadata.ticket_id}`)
      return
    }

    const isOpening = expanded !== notif.id
    setExpanded(isOpening ? notif.id : null)
    if (notif.id === expanded) setHasNew(false)

    if (!notif.isRead) {
      await authFetch(`${API_BASE}/auth/notifications/mark-read/`, {
        method: 'POST', body: JSON.stringify({ ids: [notif.id] }),
      })
      setNotifs(p => p.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
    }

    if (isOpening && notif.type === 'order_update' && !orderCache[notif.id]) {
      const meta = notif.metadata || {}
      const hasCompleteData = meta.items?.length > 0 && Number(meta.total) > 0
      if (!hasCompleteData) {
        setFetchingOrder(p => ({ ...p, [notif.id]: true }))
        try {
          const res    = await authFetch(`${API_BASE}/auth/orders/`)
          const orders = await res.json()
          const list   = toArray(orders)
          const match  = meta.orderNumber
            ? list.find(o => (o.order_number || o.orderNumber) === meta.orderNumber)
            : list[0]
          if (match) setOrderCache(p => ({ ...p, [notif.id]: match }))
        } catch { /* silently fail */ }
        setFetchingOrder(p => ({ ...p, [notif.id]: false }))
      }
    }
  }

  async function confirmDeleteNotif() {
    const id = confirmDelete
    setConfirmDelete(null)
    try {
      await authFetch(`${API_BASE}/auth/notifications/${id}/`, { method: 'DELETE' })
      setNotifs(p => p.filter(n => n.id !== id))
      if (expanded === id) setExpanded(null)
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="py-12 text-center" style={{ color: '#6d7a73' }}>Loading notifications…</div>
  )

  const unread = notifs.filter(n => !n.isRead).length

  return (
    <>
      {confirmDelete !== null && (
        <ConfirmModal onConfirm={confirmDeleteNotif} onCancel={() => setConfirmDelete(null)} />
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          {hasNew && (
            <button onClick={() => setHasNew(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
              style={{ background: '#D1FAE5', color: '#00694C', border: '1px solid #6EE7B7' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>fiber_new</span>
              New notification arrived
            </button>
          )}
          {unread > 0 && (
            <button onClick={markAll} className="text-sm font-medium cursor-pointer ml-auto"
              style={{ color: '#00694C', background: 'none', border: 'none' }}>
              Mark all as read ({unread})
            </button>
          )}
        </div>

        {!notifs.length ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#BCCAC1' }}>notifications_none</span>
            <p className="italic text-lg" style={{ fontFamily: '"Newsreader",Georgia,serif', color: '#6d7a73' }}>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(notif => {
              const iconColor    = NOTIF_ICON_COLORS[notif.type] || '#6D7A73'
              const isExpanded   = expanded === notif.id
              const rawMeta      = notif.metadata || {}
              const fetchedOrder = orderCache[notif.id]
              const isFetching   = fetchingOrder[notif.id]

              const meta = fetchedOrder ? {
                orderNumber:  fetchedOrder.order_number || fetchedOrder.orderNumber  || rawMeta.orderNumber,
                status:       fetchedOrder.status       || rawMeta.status,
                customerName: fetchedOrder.customer_name || fetchedOrder.customerName || rawMeta.customerName,
                street:       fetchedOrder.street_address || fetchedOrder.street       || rawMeta.street,
                city:         fetchedOrder.city         || rawMeta.city,
                postcode:     fetchedOrder.postcode     || rawMeta.postcode,
                deliveryDate: fetchedOrder.delivery_date || fetchedOrder.deliveryDate || rawMeta.deliveryDate,
                deliverySlot: fetchedOrder.delivery_slot_label || fetchedOrder.deliverySlot || rawMeta.deliverySlot,
                subtotal:     fetchedOrder.cart_subtotal ?? fetchedOrder.subtotal     ?? rawMeta.subtotal,
                deliveryFee:  (fetchedOrder.total_amount && fetchedOrder.cart_subtotal) ? (Number(fetchedOrder.total_amount) - Number(fetchedOrder.cart_subtotal)) : (fetchedOrder.deliveryFee ?? rawMeta.deliveryFee),
                total:        (fetchedOrder.total_amount || fetchedOrder.total) ?? rawMeta.total,
                items: fetchedOrder.items?.map(i => ({
                  product_name:  i.product_name || i.productName,
                  product_image: i.product_image || i.productImage,
                  quantity:      i.quantity,
                  unit_price:    i.unit_price || i.unitPrice,
                })) || rawMeta.items,
              } : rawMeta

              return (
                <div key={notif.id} className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${notif.isRead ? '#eaeaea' : '#B3E5D0'}` }}>
                  <div className="flex items-start gap-4 p-4"
                    style={{ background: notif.isRead ? '#fff' : '#F0FAF5' }}>
                    <div onClick={() => handleClick(notif)}
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                      style={{ background: `${iconColor}18` }}>
                      <span className="material-symbols-outlined"
                        style={{ color: iconColor, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                        {notif.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(notif)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#151e13' }}>
                          {notif.title}
                          {rawMeta.message_count > 1 && (
                            <span className="inline-flex items-center justify-center bg-[#00694C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                              {rawMeta.message_count}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!notif.isRead && <div className="w-2 h-2 rounded-full" style={{ background: '#00694C' }} />}
                          <span className="material-symbols-outlined text-base"
                            style={{ color: '#BCCAC1', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
                            expand_more
                          </span>
                        </div>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6d7a73' }}>{notif.message}</p>
                      <p className="text-[10px] mt-1.5" style={{ color: '#BCCAC1' }}>
                        {new Date(notif.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(notif.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#BCCAC1', flexShrink: 0, borderRadius: '8px', transition: 'color .15s, background .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#BA1A1A'; e.currentTarget.style.background = '#FEE2E2' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#BCCAC1'; e.currentTarget.style.background = 'transparent' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>

                  {isExpanded && notif.type === 'order_update' && (
                    <div style={{ borderTop: '1px solid #E8F5EE', background: '#FAFDF9' }}>
                      {isFetching ? (
                        <div className="flex items-center justify-center gap-2 py-6">
                          <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#00694C" strokeWidth="3" strokeOpacity=".25"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#00694C" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                          <span className="text-sm" style={{ color: '#6d7a73' }}>Loading order details…</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8F5EE' }}>
                            <span className="font-mono text-xs font-bold" style={{ color: '#3d4943' }}>{meta.orderNumber || '—'}</span>
                            {meta.status && <StatusBadge status={meta.status} />}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                            <div className="p-4" style={{ borderRight: '1px solid #E8F5EE', borderBottom: '1px solid #E8F5EE' }}>
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#6d7a73' }}>Customer</p>
                              <div className="space-y-1.5">
                                {meta.customerName && <p className="text-xs" style={{ color: '#3d4943' }}>{meta.customerName}</p>}
                                {meta.street && <p className="text-xs" style={{ color: '#3d4943' }}>{meta.street}, {meta.city} {meta.postcode}</p>}
                                {meta.deliveryDate && <p className="text-xs" style={{ color: '#3d4943' }}>{meta.deliveryDate}{meta.deliverySlot && ` · ${meta.deliverySlot}`}</p>}
                              </div>
                            </div>
                            <div className="p-4" style={{ borderBottom: '1px solid #E8F5EE' }}>
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#6d7a73' }}>Order Summary</p>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}><span>Subtotal</span><span>€{fmt(meta.subtotal)}</span></div>
                                <div className="flex justify-between text-xs" style={{ color: '#6d7a73' }}><span>Delivery</span><span>{Number(meta.deliveryFee) === 0 ? 'Free' : `€${fmt(meta.deliveryFee)}`}</span></div>
                                <div className="flex justify-between text-sm font-bold pt-1.5" style={{ borderTop: '1px solid #e0eee8' }}>
                                  <span style={{ color: '#151e13' }}>Total</span>
                                  <span style={{ color: '#855000' }}>€{fmt(meta.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {meta.items?.length > 0 && (
                            <div className="px-4 pb-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pt-3" style={{ color: '#6d7a73' }}>Items</p>
                              <div className="space-y-2">
                                {meta.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    {item.product_image && (
                                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#ECF7E4' }}>
                                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate" style={{ color: '#151e13' }}>{item.product_name}</p>
                                      <p className="text-[10px]" style={{ color: '#6d7a73' }}>{item.quantity} × €{fmt(item.unit_price)}</p>
                                    </div>
                                    <p className="text-xs font-bold" style={{ color: '#855000' }}>€{fmt(item.quantity * item.unit_price)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isExpanded && notif.type !== 'order_update' && (
                    <div className="px-5 py-4" style={{ borderTop: '1px solid #E8F5EE', background: '#FAFDF9' }}>
                      <p className="text-sm leading-relaxed" style={{ color: '#3d4943' }}>{notif.message}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}