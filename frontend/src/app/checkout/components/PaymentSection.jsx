'use client'

import { CreditCard, ShieldCheck, Wallet, Banknote, Lock, CheckCircle2 } from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'card', label: 'Debit / Credit Card', Icon: CreditCard },
  { id: 'tpv', label: 'TPV', Icon: ShieldCheck },
  { id: 'paypal', label: 'PayPal', Icon: Wallet },
  { id: 'cash', label: 'Cash on Delivery', Icon: Banknote },
]

const INPUT_CLASS =
  'w-full h-[42px] px-4 rounded-full text-[13.5px] bg-[#FAFBF6] border border-[#DDE2D5] text-[#14261B] placeholder:text-[#8E9B92] outline-none transition-colors focus:border-[#0B462B] focus:bg-white'

export default function PaymentSection({
  paymentMethod,
  setPaymentMethod,
  cardForm,
  setCardForm,
  expanded = false,
  onSelectMethod,
}) {
  function handlePick(id) {
    setPaymentMethod(id)
    if (onSelectMethod) onSelectMethod(id)
  }

  return (
    <section
      id="checkout-payment-section"
      className="rounded-[20px] bg-[#EAEFE1] border border-[#DAE3CE] p-5 sm:p-6 shadow-[0_6px_22px_-10px_rgba(18,45,28,0.08)] space-y-5"
    >
      {/* Top Secure Payment Header + Horizontal Method Pills (Always Visible like Mockup) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#0B462B] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2
              className="text-[20px] font-bold text-[#142D1E] leading-tight"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              Secure Payment
            </h2>
            <p className="text-[12.5px] text-[#556A5D]">
              Your payment information is safe with us.
            </p>
          </div>
        </div>

        {/* 4 Payment Method Pills */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5">
          {PAYMENT_METHODS.map(({ id, label, Icon }) => {
            const active = paymentMethod === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => handlePick(id)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold transition-all cursor-pointer select-none border"
                style={{
                  background: active ? '#0B462B' : '#FAFBF6',
                  color: active ? '#FFFFFF' : '#183424',
                  borderColor: active ? '#0B462B' : '#DCE3D2',
                  boxShadow: active ? '0 4px 12px rgba(11, 70, 43, 0.22)' : '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Expandable Payment Details Panel */}
      {expanded && (
        <div className="basket-fade-slide rounded-[18px] bg-white border border-[#DCE3D2] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EDF1E6] flex-wrap">
            <span className="text-[13px] font-bold text-[#142D1E]">
              {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label} Details
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#195E38] bg-[#E5F2DE] px-3 py-1 rounded-full">
              <Lock className="w-3 h-3" />
              End-to-end Encrypted
            </span>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
                  Card Number <span className="text-[#0B462B]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardForm.number || ''}
                  onChange={(e) => {
                    const input = e.target.value
                    if (input.length < (cardForm.number || '').length) {
                      setCardForm({
                        ...cardForm,
                        number: input.endsWith(' ') ? input.slice(0, -1) : input,
                      })
                      return
                    }
                    const val = input.replace(/\D/g, '').substring(0, 16)
                    setCardForm({
                      ...cardForm,
                      number: val.match(/.{1,4}/g)?.join(' ') || val,
                    })
                  }}
                  className={`${INPUT_CLASS} font-mono`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
                    Expiry Date <span className="text-[#0B462B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-0 left-0 h-full flex items-center pointer-events-none font-mono text-[13.5px] pl-4">
                      <span className="opacity-0">{cardForm.expiry || ''}</span>
                      <span className="text-[#9AA59D]">
                        {'MM/YY'.substring((cardForm.expiry || '').length)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={cardForm.expiry || ''}
                      onChange={(e) => {
                        const input = e.target.value
                        if (input.length < (cardForm.expiry || '').length) {
                          setCardForm({
                            ...cardForm,
                            expiry: input.endsWith('/') ? input.slice(0, -1) : input,
                          })
                          return
                        }
                        const digits = input.replace(/\D/g, '').substring(0, 4)
                        if (digits.length >= 2) {
                          let m = digits.substring(0, 2)
                          if (parseInt(m, 10) > 12) m = '12'
                          if (m === '00') m = '01'
                          const y = digits.substring(2)
                          setCardForm({
                            ...cardForm,
                            expiry: y ? `${m}/${y}` : `${m}/`,
                          })
                        } else {
                          setCardForm({ ...cardForm, expiry: digits })
                        }
                      }}
                      className={`${INPUT_CLASS} font-mono relative z-10 bg-transparent`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#2E4234] mb-1.5">
                    CVV <span className="text-[#0B462B]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardForm.cvv || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      setCardForm({ ...cardForm, cvv: val.substring(0, 4) })
                    }}
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'tpv' && (
            <div className="p-4 rounded-[14px] bg-[#F5F8F0] border border-[#DCE5D1] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DCEFD3] text-[#0B462B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#14261B]">
                      TPV Virtual / Pasarela Bancaria Oficial
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0B462B] text-white">
                      Redsys · 3D Secure
                    </span>
                  </div>
                  <p className="text-xs text-[#4F6355] mt-1">
                    Terminal Punto de Venta para pago bancario seguro con tarjeta de crédito/débito o datáfono.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#E2E9D9] text-xs text-[#2E4836]">
                <span>Compatible con Visa, Mastercard, Maestro y Bizum.</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#195E38]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> TPV Gateway Activo
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="p-4 rounded-[14px] bg-[#F5F8F0] border border-[#DCE5D1] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003087] text-white flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14261B]">PayPal Checkout</h3>
                <p className="text-xs text-[#4F6355] mt-0.5">
                  Paga de forma rápida y protegida con tu cuenta de PayPal o tarjeta asociada.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-[14px] bg-[#F5F8F0] border border-[#DCE5D1] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCEFD3] text-[#0B462B] flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14261B]">
                  Pago en Efectivo (Contra Reembolso)
                </h3>
                <p className="text-xs text-[#4F6355] mt-0.5">
                  Paga en efectivo directamente al repartidor cuando entregue tu pedido en mano.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
