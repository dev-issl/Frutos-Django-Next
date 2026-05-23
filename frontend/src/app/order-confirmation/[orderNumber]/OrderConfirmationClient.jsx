'use client'
// src/app/order-confirmation/[orderNumber]/OrderConfirmationClient.jsx

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STATUS_CONFIG = {
  pending:          { label: 'Pending',           color: '#6D7A73', icon: 'schedule'           },
  confirmed:        { label: 'Order Confirmed',    color: '#00694C', icon: 'check_circle'       },
  preparing:        { label: 'Being Prepared',     color: '#855000', icon: 'restaurant'         },
  out_for_delivery: { label: 'Out for Delivery',   color: '#1976D2', icon: 'local_shipping'     },
  delivered:        { label: 'Delivered',          color: '#2E7D32', icon: 'inventory_2'        },
  cancelled:        { label: 'Cancelled',          color: '#BA1A1A', icon: 'cancel'             },
}

export default function OrderConfirmationClient({ order }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const statusCfg = STATUS_CONFIG[order.status?.toLowerCase()] || STATUS_CONFIG['pending']
  // Format currency safely
  const fmt = (n) => Number(n).toFixed(2)

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', width: '100%' }}>
      <div className="max-w-md mx-auto px-6 pt-8 pb-24">

        {/* ── Success Hero ─────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: '#d4ede5' }}>
              <span className="material-symbols-outlined text-5xl"
                style={{ color: '#00694c', fontVariationSettings: "'FILL' 1" }}>
                {statusCfg.icon}
              </span>
            </div>
            <div className="absolute inset-0 rounded-full -z-10"
              style={{ background: 'rgba(0,105,76,0.08)', filter: 'blur(20px)' }} />
          </div>

          <h1 className="text-4xl italic mb-2"
            style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}>
            Order Confirmed!
          </h1>
          <p className="text-sm mb-3" style={{ color: '#3d4943' }}>
            Your artisan selection is being prepared, {order.customerName?.split(' ')[0]}.
          </p>

          {/* Order number pill */}
          <div className="px-4 py-1.5 rounded-full inline-block mb-3"
            style={{ background: '#f0f4f0', border: '1px solid #e0e6e0' }}>
            <span className="font-mono text-xs tracking-tight" style={{ color: '#095041' }}>
              ORDER #{order.orderNumber}
            </span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: `${statusCfg.color}15`, border: `1px solid ${statusCfg.color}40` }}>
            <span className="material-symbols-outlined text-base"
              style={{ color: statusCfg.color, fontVariationSettings: "'FILL' 1" }}>
              {statusCfg.icon}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>
        </section>

        {/* ── Order Details ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Items card */}
          <section className="p-6 rounded-xl"
            style={{
              background: '#ffffff',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: '1px solid #eeeeee',
            }}>
            <h2 className="text-lg italic mb-4"
              style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}>
              Your Items
            </h2>

            <div className="space-y-4 mb-6">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#f0f4f0]">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl text-[#bccac1]">
                          shopping_bag
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#151e13' }}>
                      {item.productName}
                    </p>
                    <p className="text-xs italic"
                      style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#5a6b63' }}>
                      {item.productOrigin ? `from ${item.productOrigin}` : ''}
                    </p>
                    <p className="text-xs" style={{ color: '#6d7a73' }}>
                      Qty: {item.quantity} × €{fmt(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: '#855000' }}>
                    €{fmt(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>

            {/* Delivery + address info */}
            <div className="space-y-4 pt-4" style={{ borderTop: '1px solid #eeeeee' }}>
              {order.fullAddress && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl" style={{ color: '#00694c' }}>
                    location_on
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6d7a73' }}>
                      Delivery Address
                    </p>
                    <p className="text-sm leading-snug mt-0.5" style={{ color: '#151e13' }}>
                      {order.street && <>{order.street}<br /></>}
                      {[order.city, order.postcode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {(order.deliveryDate || order.deliverySlot) && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl" style={{ color: '#00694c' }}>
                    schedule
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6d7a73' }}>
                      Estimated Delivery
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: '#151e13' }}>
                      {[order.deliveryDate, order.deliverySlot].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-xl" style={{ color: '#00694c' }}>
                  payments
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6d7a73' }}>
                    Payment Method
                  </p>
                  <p className="text-sm mt-0.5 capitalize" style={{ color: '#151e13' }}>
                    {order.paymentMethod === 'card'   ? 'Debit / Credit Card'  :
                     order.paymentMethod === 'paypal' ? 'PayPal'               : 'Cash'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Totals card */}
          <section className="p-6 rounded-xl"
            style={{ background: '#f5f8f5', border: '1px solid #e0e8e0' }}>
            <div className="flex justify-between items-center text-sm mb-2"
              style={{ color: '#3d4943' }}>
              <span>Subtotal</span>
              <span>€{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-4"
              style={{ color: '#3d4943' }}>
              <span>Delivery Fee</span>
              <span>{Number(order.deliveryFee) === 0 ? 'Free' : `€${fmt(order.deliveryFee)}`}</span>
            </div>
            <div className="flex justify-between items-center pt-4"
              style={{ borderTop: '1px solid #d8e4d8' }}>
              <span className="text-xl italic"
                style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}>
                Total Paid
              </span>
              <span className="font-bold text-xl" style={{ color: '#00694c' }}>
                €{fmt(order.total)}
              </span>
            </div>
          </section>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <section className="mt-10 space-y-3">
          {/* <button
            className="cursor-pointer w-full py-4 rounded-lg font-bold uppercase tracking-widest text-sm text-white transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)',
              boxShadow: '0 8px 24px -4px rgba(0,105,76,0.25)',
            }}>
            Track My Order
          </button> */}

          <Link href="/shop"
            className="w-full py-4 rounded-lg font-bold uppercase tracking-widest text-sm flex items-center justify-center transition-colors"
            style={{
              border: '1.5px solid rgba(0,105,76,0.35)',
              color: '#00694c',
              background: '#ffffff',
            }}>
            Continue Shopping
          </Link>
        </section>

        <p className="text-center mt-8 text-[11px] italic"
          style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#8a9e93' }}>
          Packaging is 100% compostable and sourced sustainably.
        </p>
      </div>
    </div>
  )
}