

// src/app/wholesale/profile/_tabs/OrdersTab.jsx
import { useState } from 'react'
import Card from '../_shared/Card'

const STATUS_CONFIG = {
  pending:          { label: 'Pending',          bg: '#FEF3C7', color: '#92400E' },
  confirmed:        { label: 'Confirmed',        bg: '#D1FAE5', color: '#065F46' },
  preparing:        { label: 'Preparing',        bg: '#FEF3C7', color: '#92400E' },
  out_for_delivery: { label: 'Out for Delivery', bg: '#DBEAFE', color: '#1E40AF' },
  delivered:        { label: 'Delivered',        bg: '#D1FAE5', color: '#065F46' },
  cancelled:        { label: 'Cancelled',        bg: '#FEE2E2', color: '#991B1B' },
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
function CancelModal({ orderNumber, onConfirm, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8, 30, 19, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '28px 28px 22px',
        width: 'min(380px, calc(100vw - 32px))',
        boxShadow: '0 20px 60px rgba(8,30,19,0.18), 0 4px 16px rgba(8,30,19,0.08)',
        animation: 'popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>

        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" fill="none" stroke="#991B1B" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6l-1,14H6L5,6M10,11v6M14,11v6M9,6V4h6v2"/>
          </svg>
        </div>

        {/* Text */}
        <h3 style={{
          margin: '0 0 8px', textAlign: 'center',
          fontSize: 17, fontWeight: 700, color: '#151E13',
          fontFamily: 'inherit',
        }}>
          Cancel Order?
        </h3>
        <p style={{
          margin: '0 0 24px', textAlign: 'center',
          fontSize: 13.5, color: '#6D7A73', lineHeight: 1.5,
          fontFamily: 'inherit',
        }}>
          Are you sure you want to cancel order{' '}
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#085041' }}>
            #{orderNumber}
          </span>
          ? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0',
              background: '#F3F6F4', border: '1px solid #E2EAE5',
              borderRadius: 10, cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600, color: '#374151',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E8F0EA'}
            onMouseLeave={e => e.currentTarget.style.background = '#F3F6F4'}
          >
            Keep Order
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0',
              background: '#991B1B', border: 'none',
              borderRadius: 10, cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600, color: '#FFFFFF',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#7F1D1D'}
            onMouseLeave={e => e.currentTarget.style.background = '#991B1B'}
          >
            Yes, Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn  {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.92) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
      `}</style>
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrdersTab({ orders, onDeleteOrder }) {
  const [confirmOrder, setConfirmOrder] = useState(null) // orderNumber | null
  const [expandedOrders, setExpandedOrders] = useState({})

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const handleCancelClick = (orderNumber) => {
    setConfirmOrder(orderNumber)
  }

  const handleConfirm = () => {
    onDeleteOrder(confirmOrder)
    setConfirmOrder(null)
  }

  const handleClose = () => {
    setConfirmOrder(null)
  }

  return (
    <>
      {/* Confirmation Modal */}
      {confirmOrder && (
        <CancelModal
          orderNumber={confirmOrder}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}

      <Card title="My Orders" icon={
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
      }>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9DAAA3' }}>
            <svg width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"
              style={{ margin: '0 auto 12px', display: 'block' }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <p style={{ fontSize: 14, margin: 0 }}>No orders yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => {
              const sc = STATUS_CONFIG[order.status] || { label: order.status, bg: '#F3F4F6', color: '#374151' }
              const cancellable = !['out_for_delivery', 'delivered'].includes(order.status)
              const isExpanded = !!expandedOrders[order.id]

              return (
                <div key={order.id} style={{
                  background: '#FAFCFA', border: '1px solid #E8F0EA',
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div 
                    onClick={() => toggleOrder(order.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '11px 14px', borderBottom: isExpanded ? '1px solid #F0F5F2' : 'none',
                      flexWrap: 'wrap', gap: 8, cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <svg 
                        width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                        style={{ 
                          color: '#085041', 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#085041' }}>
                        #{order.order_number}
                      </span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '3px 9px',
                        borderRadius: 100, background: sc.bg, color: sc.color,
                        textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                      }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#085041' }}>
                        €{Number(order.total_amount).toFixed(2)}
                      </span>
                      {cancellable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelClick(order.order_number); }}
                          style={{
                            background: 'none', border: '1px solid #FEE2E2', borderRadius: 8,
                            padding: '4px 9px', cursor: 'pointer', color: '#991B1B',
                            fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6l-1,14H6L5,6M10,11v6M14,11v6M9,6V4h6v2"/>
                          </svg>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                      {/* Date */}
                      <div style={{ padding: '4px 14px', fontSize: 11.5, color: '#9DAAA3' }}>
                    {new Date(order.ordered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Items */}
                  <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(order.items || []).map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          {item.product_image && (
                            <div style={{ width: 30, height: 30, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                              <img src={item.product_image} alt={item.product_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                          <span style={{ color: '#151E13', fontWeight: 500, fontSize: 13, wordBreak: 'break-word' }}>
                            {item.product_name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#6D7A73', fontSize: 12 }}>×{item.quantity}</span>
                          <span style={{ fontWeight: 600, color: '#151E13', fontSize: 13 }}>
                            €{Number(item.line_total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery info */}
                  {(order.delivery_date || order.delivery_slot_label) && (
                    <div style={{
                      padding: '8px 14px', borderTop: '1px solid #F0F5F2',
                      fontSize: 11.5, color: '#6D7A73', display: 'flex', gap: 12, flexWrap: 'wrap',
                    }}>
                      {order.delivery_date && <span> {order.delivery_date}</span>}
                      {order.delivery_slot_label && <span> {order.delivery_slot_label}</span>}
                    </div>
                  )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}