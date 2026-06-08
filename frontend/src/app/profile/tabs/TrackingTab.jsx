'use client'
import { useState, useEffect, useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

// ── Status pipeline (cancelled is a side-branch) ─────────────────────────────
const STEPS = [
  {
    key:   'PENDING',
    label: 'Order Placed',
    sub:   'We received your order',
    icon:  'receipt_long',
  },
  {
    key:   'PROCESSING',
    label: 'Processing',
    sub:   'Being carefully packed',
    icon:  'inventory_2',
  },
  {
    key:   'SHIPPED',
    label: 'Shipped',
    sub:   'On its way to you',
    icon:  'local_shipping',
  },
  {
    key:   'DELIVERED',
    label: 'Delivered',
    sub:   'Enjoy your order!',
    icon:  'where_to_vote',
  },
]

const STATUS_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]))

const STATUS_LABEL = {
  PENDING:    'Pending',
  PROCESSING: 'Processing',
  SHIPPED:    'Shipped',
  DELIVERED:  'Delivered',
  CANCELLED:  'Cancelled',
}

const FULFILLMENT_ICON = {
  delivery: 'local_shipping',
  collect:  'store',
  instore:  'storefront',
}

// helper: human-readable date
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IE', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Single order tracking card ────────────────────────────────────────────────
function TrackingCard({ order, onClose }) {
  const isCancelled = order.status === 'CANCELLED'
  const activeIdx   = isCancelled ? -1 : (STATUS_INDEX[order.status] ?? 0)

  return (
    <div
      style={{
        background: '#fff',
        border: '1.5px solid #e0e8e0',
        borderRadius: '20px',
        overflow: 'hidden',
        animation: 'slideIn .25s ease',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: isCancelled ? '#FFF0F0' : 'linear-gradient(135deg,#00694C 0%,#085041 100%)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: isCancelled ? '#BA1A1A' : 'rgba(255,255,255,.7)',
              marginBottom: '4px',
            }}
          >
            Order Number
          </p>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: isCancelled ? '#BA1A1A' : '#fff',
              fontFamily: '"Newsreader",Georgia,serif',
              letterSpacing: '.5px',
            }}
          >
            {order.orderNumber}
          </p>
          <p style={{ fontSize: '12px', color: isCancelled ? '#BA1A1A' : 'rgba(255,255,255,.65)', marginTop: '4px' }}>
            Placed on {fmtDate(order.createdAt)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status pill */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '99px',
              background: isCancelled ? '#BA1A1A' : 'rgba(255,255,255,.18)',
              color: isCancelled ? '#fff' : '#fff',
              backdropFilter: 'blur(4px)',
              border: isCancelled ? 'none' : '1px solid rgba(255,255,255,.25)',
            }}
          >
            {STATUS_LABEL[order.status] || order.status}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,.15)',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: '8px',
                padding: '4px 6px',
                cursor: 'pointer',
                color: isCancelled ? '#BA1A1A' : '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* ── Cancelled banner ── */}
        {isCancelled && (
          <div
            style={{
              background: '#FFF0F0',
              border: '1.5px solid #FFBAB1',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#BA1A1A', fontSize: '22px' }}>cancel</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: '#BA1A1A' }}>Order Cancelled</p>
              <p style={{ fontSize: '12px', color: '#BA1A1A', opacity: .75 }}>
                This order has been cancelled and will not be delivered.
              </p>
            </div>
          </div>
        )}

        {/* ── Stepper ── */}
        {!isCancelled && (
          <div style={{ marginBottom: '24px' }}>
            {/* Desktop: horizontal */}
            <div className="tracking-stepper-desktop" style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              {STEPS.map((step, idx) => {
                const done    = idx <= activeIdx
                const current = idx === activeIdx
                const isLast  = idx === STEPS.length - 1

                return (
                  <div
                    key={step.key}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* Connector line (before each step except first) */}
                    {idx > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '20px',
                          left: '-50%',
                          width: '100%',
                          height: '3px',
                          background: idx <= activeIdx ? '#00694C' : '#E5EDE8',
                          transition: 'background .4s ease',
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* Circle */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: done ? '#00694C' : '#F0F5F1',
                        border: current ? '3px solid #00694C' : done ? '3px solid #00694C' : '2.5px solid #D4E3D9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        zIndex: 1,
                        transition: 'all .35s ease',
                        // boxShadow: current ? '0 0 0 5px rgba(0,105,76,.12)' : 'none',
                      }}
                    >
                      {done && !current ? (
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fff', fontVariationSettings: "'FILL' 1" }}>
                          check
                        </span>
                      ) : (
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: '18px',
                            color: current ? '#00694C' : '#BCCAC1',
                            fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          {step.icon}
                        </span>
                      )}

                      {/* Pulse ring for active */}
                      {current && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: '-6px',
                            borderRadius: '50%',
                            border: '2px solid #00694C',
                            opacity: .3,
                            animation: 'pulse 1.8s ease-in-out infinite',
                          }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <p
                      style={{
                        fontSize: '10px',
                        fontWeight: current ? 700 : done ? 600 : 400,
                        color: done ? '#00694C' : '#9DAAA3',
                        textAlign: 'center',
                        marginTop: '8px',
                        lineHeight: 1.3,
                        transition: 'color .35s ease',
                      }}
                    >
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Active step description */}
            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                background: '#F0F8F4',
                borderRadius: '10px',
                border: '1px solid #C8E6D5',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: '#00694C', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
              >
                {STEPS[activeIdx]?.icon || 'info'}
              </span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#00694C' }}>
                  {STEPS[activeIdx]?.label}
                </p>
                <p style={{ fontSize: '12px', color: '#3d6b52' }}>
                  {STEPS[activeIdx]?.sub}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Order Meta ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {[
            {
              icon: FULFILLMENT_ICON[order.fulfillment] || 'local_shipping',
              label: 'Fulfillment',
              value: order.fulfillment === 'delivery' ? 'Home Delivery'
                   : order.fulfillment === 'collect'  ? 'Click & Collect'
                   : 'In-Store',
            },
            {
              icon: 'calendar_today',
              label: 'Delivery Date',
              value: order.deliveryDate || '—',
            },
            {
              icon: 'schedule',
              label: 'Time Slot',
              value: order.deliverySlot || '—',
            },
            {
              icon: 'payments',
              label: 'Payment',
              value: order.paymentMethod === 'card' ? 'Card'
                   : order.paymentMethod === 'paypal' ? 'PayPal'
                   : 'Cash',
            },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              style={{
                padding: '12px',
                background: '#FAFBFA',
                borderRadius: '10px',
                border: '1px solid #eaeaea',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9DAAA3' }}>
                  {icon}
                </span>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#9DAAA3', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {label}
                </p>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#151e13' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Delivery address ── */}
        {order.fullAddress && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: '#FAFBFA',
              borderRadius: '10px',
              border: '1px solid #eaeaea',
              marginBottom: '20px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00694C', fontVariationSettings: "'FILL' 1", marginTop: '1px' }}>
              location_on
            </span>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9DAAA3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>
                Delivery Address
              </p>
              <p style={{ fontSize: '13px', color: '#151e13', fontWeight: 500 }}>{order.fullAddress}</p>
            </div>
          </div>
        )}

        {/* ── Items ── */}
        {order.items && order.items.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9DAAA3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Items ({order.itemCount})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: '#FAFBFA',
                    borderRadius: '10px',
                    border: '1px solid #eaeaea',
                  }}
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#ECF7E4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#BCCAC1' }}>nutrition</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#151e13', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.productName}
                    </p>
                    {item.productOrigin && (
                      <p style={{ fontSize: '11px', color: '#9DAAA3' }}>{item.productOrigin}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '12px', color: '#6d7a73' }}>×{item.quantity}</p>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#151e13' }}>€{Number(item.lineTotal).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Price summary ── */}
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            background: '#F0F8F4',
            borderRadius: '12px',
            border: '1px solid #C8E6D5',
          }}
        >
          {Number(order.promo_discount) > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#6d7a73' }}>Original Subtotal</span>
                <span style={{ fontSize: '13px', color: '#6d7a73' }}>€{Number(order.original_subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#00694C' }}>Promo ({order.promo_code})</span>
                <span style={{ fontSize: '13px', color: '#00694C' }}>−€{Number(order.promo_discount).toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#6d7a73' }}>Subtotal</span>
            <span style={{ fontSize: '13px', color: '#3d4943' }}>€{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#6d7a73' }}>Delivery Fee</span>
            <span style={{ fontSize: '13px', color: '#3d4943' }}>
              {Number(order.deliveryFee) === 0 ? 'Free' : `€${Number(order.deliveryFee).toFixed(2)}`}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #C8E6D5',
              paddingTop: '10px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#151e13' }}>Total</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#00694C' }}>€{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Order list item (compact row) ─────────────────────────────────────────────
function OrderRow({ order, isSelected, onClick }) {
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'
  const activeIdx   = STATUS_INDEX[order.status] ?? 0
  const progress    = isCancelled ? 0 : Math.round(((activeIdx + 1) / STEPS.length) * 100)

  const pillColor = isCancelled ? { bg: '#FFF0F0', txt: '#BA1A1A' }
                  : isDelivered ? { bg: '#D4EDE5', txt: '#00694C' }
                  : { bg: '#FFF8ED', txt: '#855000' }

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: isSelected ? '#F0F8F4' : '#fff',
        border: `1.5px solid ${isSelected ? '#00694C' : '#eaeaea'}`,
        borderRadius: '14px',
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all .2s ease',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#A8C9B8' }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#eaeaea' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#151e13', marginBottom: '2px' }}>
            {order.orderNumber}
          </p>
          <p style={{ fontSize: '11px', color: '#9DAAA3' }}>{fmtDate(order.createdAt)} · {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '99px',
              background: pillColor.bg,
              color: pillColor.txt,
            }}
          >
            {STATUS_LABEL[order.status] || order.status}
          </span>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#151e13' }}>€{Number(order.total).toFixed(2)}</p>
        </div>
      </div>

      {/* Mini progress bar */}
      {!isCancelled && (
        <div style={{ height: '4px', background: '#E8F0EA', borderRadius: '99px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: isDelivered
                ? 'linear-gradient(90deg,#00694C,#2E7D32)'
                : 'linear-gradient(90deg,#00694C,#52B788)',
              borderRadius: '99px',
              transition: 'width .5s ease',
            }}
          />
        </div>
      )}
    </button>
  )
}

// ── Main Tab Component ─────────────────────────────────────────────────────────

function normalizeOrder(o) {
  return {
    id: o.id,
    orderNumber: o.order_number || o.orderNumber,
    createdAt: o.ordered_at || o.createdAt,
    status: o.status,
    total: o.total_amount || o.total,
    subtotal: o.cart_subtotal || o.subtotal,
    deliveryFee: (Number(o.total_amount || 0) - Number(o.cart_subtotal || 0)) || 0,
    promo_discount: o.promo_discount || 0,
    original_subtotal: Number(o.cart_subtotal || o.subtotal) + Number(o.promo_discount || 0),
    promo_code: o.promo_code || '',
    itemCount: (o.items || []).length,
    items: (o.items || []).map(i => ({
      id: i.id,
      productName: i.product_name || i.productName,
      productImage: i.product_image || i.productImage,
      productOrigin: i.product_origin || i.productOrigin,
      quantity: i.quantity,
      unitPrice: i.unit_price || i.unitPrice,
      lineTotal: i.line_total || i.lineTotal,
    }))
  }
}

export default function TrackingTab({ authFetch, initialOrders = null }) {
  const [orders,      setOrders]      = useState(() => {
    const arr = Array.isArray(initialOrders) ? initialOrders : (initialOrders?.results || [])
    return arr.map(normalizeOrder)
  })
  const [loading,     setLoading]     = useState(initialOrders === null)
  const [selectedId,  setSelectedId]  = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [pulseKey,    setPulseKey]    = useState(0)     // force re-render on update

  // ── Fetch / refresh ──────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res  = await authFetch(`${API_BASE}/auth/orders/`)
      const data = await res.json()
      const list = (Array.isArray(data) ? data : (data.results || [])).map(normalizeOrder)

      setOrders((prev) => {
        // detect if anything changed so we can animate
        const prevStatuses = Object.fromEntries(prev.map((o) => [o.orderNumber, o.status]))
        const changed = list.some((o) => prevStatuses[o.orderNumber] !== o.status)
        if (changed) setPulseKey((k) => k + 1)
        return list
      })
      setLastUpdated(new Date())
    } catch {
      /* network error — keep previous data */
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  // Initial load if no server data
  useEffect(() => {
    if (initialOrders === null) fetchOrders(false)
    else setLastUpdated(new Date())
  }, [])

  // Real-time polling every 3 s
  useEffect(() => {
    const id = setInterval(() => fetchOrders(true), 3_000)
    return () => clearInterval(id)
  }, [fetchOrders])

  // Auto-select most-recent non-delivered / first order
  useEffect(() => {
    if (orders.length > 0 && selectedId === null) {
      const active = orders.find((o) => !['DELIVERED', 'CANCELLED'].includes(o.status))
      setSelectedId((active || orders[0]).orderNumber)
    }
  }, [orders])

  const selectedOrder = orders.find((o) => o.orderNumber === selectedId) || null

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <svg style={{ animation: 'spin 1s linear infinite', width: '32px', height: '32px' }} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#00694C" strokeWidth="3" strokeOpacity=".2"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#00694C" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: '13px', color: '#9DAAA3' }}>Loading orders…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          gap: '12px',
          textAlign: 'center',
          padding: '40px 24px',
          background: '#fff',
          borderRadius: '20px',
          border: '1.5px solid #eaeaea',
        }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0F8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '30px', color: '#BCCAC1' }}>receipt_long</span>
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#151e13' }}>No orders yet</p>
        <p style={{ fontSize: '13px', color: '#9DAAA3', maxWidth: '240px' }}>
          Your order history will appear here once you place your first order.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Live indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#151e13',
            fontFamily: '"Newsreader",Georgia,serif',
          }}
        >
          Order Tracking
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00694C',
                animation: 'livePulse 2s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#00694C' }}>Live</span>
          </div>
          <button
            onClick={() => fetchOrders(true)}
            style={{
              background: 'none',
              border: '1px solid #e0e8e0',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6d7a73',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p style={{ fontSize: '11px', color: '#BCCAC1', marginBottom: '16px', marginTop: '-10px' }}>
          Updated {lastUpdated.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })} · auto-refreshes every 3s
        </p>
      )}

      {/* ── Two-column layout: list + detail ── */}
      <div
        className="tracking-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: orders.length > 1 ? '1fr' : '1fr',
          gap: '16px',
        }}
      >
        {/* Order list */}
        {orders.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9DAAA3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Recent Orders
            </p>
            {orders.map((order) => (
              <OrderRow
                key={order.orderNumber + pulseKey}
                order={order}
                isSelected={selectedId === order.orderNumber}
                onClick={() => setSelectedId(order.orderNumber)}
              />
            ))}
          </div>
        )}

        {/* Detail card */}
        {selectedOrder && (
          <TrackingCard
            key={selectedOrder.orderNumber + pulseKey}
            order={selectedOrder}
            onClose={orders.length === 1 ? null : null}
          />
        )}
      </div>

      <style>{`
        @keyframes spin        { to { transform: rotate(360deg) } }
        @keyframes pulse       { 0%,100% { opacity:.3; transform:scale(1) } 50% { opacity:.6; transform:scale(1.15) } }
        @keyframes livePulse   { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes slideIn     { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }

        /* Responsive: side-by-side when viewport is wide and there are multiple orders */
        @media (min-width: 900px) {
          .tracking-layout-multi {
            grid-template-columns: 260px 1fr !important;
          }
        }

        /* Hide desktop stepper on mobile, show vertical */
        @media (max-width: 600px) {
          .tracking-stepper-desktop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}