'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  Check,
  Copy,
  Clock,
  CheckCircle2,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  ShoppingCart,
  Home,
  ArrowRight,
  Mail,
  Package,
  Truck,
  XCircle,
  Utensils,
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#4B6354', bg: '#E6EFE1', border: '#D1DEC9', Icon: Clock },
  confirmed: { label: 'Order Confirmed', color: '#0B462B', bg: '#DCF0E3', border: '#BDE0CA', Icon: CheckCircle2 },
  preparing: { label: 'Being Prepared', color: '#855000', bg: '#FEF3D6', border: '#F5DBA0', Icon: Utensils },
  out_for_delivery: { label: 'Out for Delivery', color: '#19589E', bg: '#E4F0FC', border: '#C3DCF7', Icon: Truck },
  delivered: { label: 'Delivered', color: '#1B5E38', bg: '#DCEFD3', border: '#C2E0B6', Icon: Package },
  cancelled: { label: 'Cancelled', color: '#BA1A1A', bg: '#FDECEC', border: '#F8CACA', Icon: XCircle },
}

function resolveOrderImage(src) {
  if (!src) return null
  if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/')) return src
  const mediaBase = API_BASE.replace('/api', '')
  return `${mediaBase}/${src.replace(/^\/+/, '')}`
}

export default function OrderConfirmationClient({ order }) {
  const [copied, setCopied] = useState(false)

  const statusKey = order.status?.toLowerCase() || 'pending'
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.Icon
  const fmt = (n) => Number(n || 0).toFixed(2)
  const firstName = order.customerName?.split(' ')[0]

  function handleCopyOrderNumber() {
    if (!order.orderNumber) return
    navigator.clipboard?.writeText(`ORDER #${order.orderNumber}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ background: '#F6F6EC', minHeight: '100vh', width: '100%' }}>
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Centered Top Confirmation Hero */}
        <section className="flex flex-col items-center text-center mb-9">
          <div className="relative mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
              style={{
                background:
                  statusKey === 'cancelled'
                    ? '#BA1A1A'
                    : 'linear-gradient(145deg, #106A3E 0%, #1B804D 100%)',
              }}
            >
              {statusKey === 'cancelled' ? (
                <XCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
              ) : (
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              )}
            </div>
            <div
              className="absolute -inset-3 rounded-full -z-10"
              style={{ background: 'rgba(16, 106, 62, 0.14)', filter: 'blur(12px)' }}
            />
          </div>

          <h1
            className="text-[36px] sm:text-[44px] font-bold tracking-tight leading-tight text-[#122D1E]"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            {statusKey === 'cancelled' ? 'Order Cancelled' : 'Order Confirmed!'}
          </h1>

          <p
            className="text-[17px] italic text-[#2A6747] mt-1"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Your order has been placed successfully.
          </p>

          <p className="text-[13.5px] text-[#3D5244] mt-1.5 max-w-lg">
            Thank you for choosing El Árbol{firstName ? `, ${firstName}` : ''}. Your order is being prepared and will be with you soon.
          </p>

          {/* Copyable Order Number Pill */}
          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAEDE1] border border-[#D7DEC9] hover:bg-[#E1E6D6] transition-colors cursor-pointer"
          >
            <span className="font-mono text-[12px] font-bold tracking-wide text-[#134227]">
              ORDER #{order.orderNumber}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#195E38]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#4E6455]" />
            )}
          </button>

          {/* Live Status Pill */}
          <div
            className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[12px] font-semibold"
            style={{
              background: statusCfg.bg,
              borderColor: statusCfg.border,
              color: statusCfg.color,
            }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusCfg.label}</span>
          </div>
        </section>

        {/* 2-Column Main Order Details + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Order Details Card */}
          <section className="lg:col-span-7 rounded-[20px] bg-white border border-[#E2E6DA] shadow-[0_8px_28px_-10px_rgba(18,45,28,0.1)] p-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEF1E8]">
              <FileText className="w-5 h-5 text-[#0B462B]" />
              <h2
                className="text-[20px] font-bold text-[#142D1E]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                Order Details
              </h2>
            </div>

            {/* Line Items */}
            <div className="divide-y divide-[#EEF1E8] mt-3">
              {order.items?.map((item) => {
                const imgUrl = resolveOrderImage(item.productImage)
                const cleanOrigin = item.productOrigin?.replace(/^from\s+/i, '')
                return (
                  <div key={item.id} className="flex items-center gap-4 py-3.5">
                    <div className="relative w-16 h-12 rounded-[10px] overflow-hidden shrink-0 bg-[#F7F6F0] border border-[#EAECE3]">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#9AA89F]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[16px] font-bold truncate text-[#14261B]"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                      >
                        {item.productName}
                      </p>
                      <p className="text-[12.5px] text-[#586A5F] mt-0.5">
                        {cleanOrigin ? (
                          <span className="italic text-[#2B6947] mr-2">from {cleanOrigin} ·</span>
                        ) : null}
                        Qty: {item.quantity} × €{fmt(item.unitPrice)}
                      </p>
                    </div>

                    <p
                      className="text-[18px] font-bold shrink-0 text-[#0E4228]"
                      style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                      €{fmt(item.lineTotal)}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Delivery & Payment Metadata */}
            <div className="mt-4 pt-4 border-t border-[#EAEEDF] space-y-3 text-[13.5px]">
              {order.fullAddress && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-start">
                  <div className="sm:col-span-5 flex items-center gap-2 font-semibold text-[#183825]">
                    <MapPin className="w-4 h-4 text-[#0B462B] shrink-0" />
                    <span>Delivery Address</span>
                  </div>
                  <div className="sm:col-span-7 text-[#485C4E] pl-6 sm:pl-0">
                    {[order.street, order.city, order.postcode].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}

              {(order.deliveryDate || order.deliverySlot) && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-start">
                  <div className="sm:col-span-5 flex items-center gap-2 font-semibold text-[#183825]">
                    <Calendar className="w-4 h-4 text-[#0B462B] shrink-0" />
                    <span>Estimated Delivery</span>
                  </div>
                  <div className="sm:col-span-7 text-[#485C4E] pl-6 sm:pl-0">
                    {[order.deliveryDate, order.deliverySlot].filter(Boolean).join(' · ')}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-start">
                <div className="sm:col-span-5 flex items-center gap-2 font-semibold text-[#183825]">
                  <CreditCard className="w-4 h-4 text-[#0B462B] shrink-0" />
                  <span>Payment Method</span>
                </div>
                <div className="sm:col-span-7 text-[#485C4E] pl-6 sm:pl-0">
                  {order.paymentMethod === 'card'
                    ? 'Debit / Credit Card'
                    : order.paymentMethod === 'tpv'
                      ? 'TPV (Virtual POS / Redsys)'
                      : order.paymentMethod === 'paypal'
                        ? 'PayPal'
                        : order.paymentMethod === 'cash'
                          ? 'Cash on Delivery'
                          : order.paymentMethod
                            ? String(order.paymentMethod).toUpperCase()
                            : 'Cash'}
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Dark-Header Order Summary Card */}
          <section className="lg:col-span-5 rounded-[20px] overflow-hidden bg-white border border-[#DDE4D3] shadow-[0_12px_32px_-12px_rgba(18,45,28,0.14)]">
            <div
              className="relative px-6 pt-4 pb-6 flex items-center gap-2.5"
              style={{ background: 'linear-gradient(135deg, #0B462B 0%, #155838 100%)' }}
            >
              <ShoppingCart className="w-5 h-5 text-white/95" />
              <h2
                className="text-[20px] font-bold text-white leading-none"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                Order Summary
              </h2>
              <svg
                viewBox="0 0 400 18"
                preserveAspectRatio="none"
                className="absolute -bottom-[1px] left-0 w-full h-3 pointer-events-none"
                aria-hidden="true"
              >
                <path d="M0 10C120 0 260 18 400 4V18H0V10Z" fill="#FFFFFF" />
              </svg>
            </div>

            <div className="px-6 pt-3 pb-6 space-y-4">
              <div className="space-y-2.5 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#364A3D]">Subtotal</span>
                  <span className="font-semibold text-[#14261B]">€{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#364A3D]">Delivery Fee</span>
                  {Number(order.deliveryFee) === 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#DCEFD3] text-[#1A5D38]">
                      Free
                    </span>
                  ) : (
                    <span className="font-semibold text-[#14261B]">€{fmt(order.deliveryFee)}</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8ECE2] flex items-end justify-between">
                <span
                  className="text-[19px] font-bold italic text-[#142D1E]"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  Total Paid
                </span>
                <div className="text-right">
                  <span
                    className="block text-[26px] font-bold leading-none text-[#0E4228]"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    €{fmt(order.total)}
                  </span>
                  <span className="block text-[11px] text-[#586A5F] mt-1">(VAT Included)</span>
                </div>
              </div>

              <Link
                href="/shop"
                className="w-full py-3 rounded-full font-semibold text-white text-[14.5px] flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-[0_6px_18px_-4px_rgba(16,106,62,0.35)]"
                style={{ background: 'linear-gradient(135deg, #0D5D37 0%, #177847 100%)' }}
              >
                <Home className="w-4 h-4" />
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-center text-[11.5px] text-[#566A5D] flex items-center justify-center gap-1.5 leading-snug pt-0.5">
                <Mail className="w-3.5 h-3.5 text-[#1B5E38] shrink-0" />
                <span>A confirmation email has been sent to your email address.</span>
              </p>
            </div>
          </section>
        </div>

        {/* What's Next? 3-Step Horizontal Box */}
        <section className="mt-7 rounded-[20px] bg-[#EAEFE1] border border-[#DCE4D2] px-6 py-5 shadow-[0_4px_16px_-8px_rgba(18,45,28,0.06)]">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-[1px] w-14 bg-[#C6D1BC]" />
            <h3
              className="text-[17px] font-bold text-[#142D1E]"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              What&apos;s Next?
            </h3>
            <span className="h-[1px] w-14 bg-[#C6D1BC]" />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-5">
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white border border-[#D4DFC9] flex items-center justify-center text-[#0B462B] shadow-2xs mb-2">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-[13.5px] font-bold text-[#142D1E]">1. Order Processing</p>
              <p className="text-[11.5px] text-[#566A5D]">(Usually within 1 hour)</p>
            </div>

            <ArrowRight className="hidden md:block w-5 h-5 text-[#669156]" />

            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white border border-[#D4DFC9] flex items-center justify-center text-[#0B462B] shadow-2xs mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <p className="text-[13.5px] font-bold text-[#142D1E]">2. Out for Delivery</p>
              <p className="text-[11.5px] text-[#566A5D]">(Track your order)</p>
            </div>

            <ArrowRight className="hidden md:block w-5 h-5 text-[#669156]" />

            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-white border border-[#D4DFC9] flex items-center justify-center text-[#0B462B] shadow-2xs mb-2">
                <Home className="w-5 h-5" />
              </div>
              <p className="text-[13.5px] font-bold text-[#142D1E]">3. Delivered</p>
              <p className="text-[11.5px] text-[#566A5D]">(Enjoy your fresh produce!)</p>
            </div>
          </div>
        </section>

        {/* Bottom Panoramic Farm Produce Banner */}
        <section className="relative mt-7 rounded-[22px] overflow-hidden border border-[#DCE4D2] shadow-[0_8px_24px_-10px_rgba(18,45,28,0.1)] min-h-[155px] flex items-center">
          <Image
            src="/ui/confirmation-farm-banner.jpg"
            alt="Freshness from our farm to your home"
            fill
            sizes="960px"
            className="object-cover object-right"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(238,243,230,0.97) 0%, rgba(238,243,230,0.9) 46%, rgba(238,243,230,0.1) 78%, rgba(238,243,230,0) 100%)',
            }}
          />

          <div className="relative z-10 p-6 sm:p-8 max-w-md">
            <h3
              className="text-[22px] sm:text-[24px] font-bold italic leading-tight text-[#123C24]"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              Freshness from our farm to your home
            </h3>
            <p className="text-[13px] font-medium text-[#2F4E3A] mt-1">
              Together for a healthier and greener tomorrow.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B462B] hover:bg-[#083821] text-white text-[13px] font-semibold transition-colors shadow-sm"
            >
              <span>Explore Our Shop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
