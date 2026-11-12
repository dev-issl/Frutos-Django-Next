'use client'

import { Home, CreditCard, Check } from 'lucide-react'

export default function CheckoutProgress({ activeStep = 'delivery', onSelectStep }) {
  const isPayment = activeStep === 'payment'

  const steps = [
    {
      id: 'delivery',
      label: 'Delivery',
      Icon: Home,
      state: isPayment ? 'done' : 'active',
    },
    {
      id: 'payment',
      label: 'Payment',
      Icon: CreditCard,
      state: isPayment ? 'active' : 'pending',
    },
    {
      id: 'confirm',
      label: 'Confirm',
      Icon: Check,
      state: 'pending',
    },
  ]

  return (
    <div className="mb-8 md:mb-10 max-w-[660px] mx-auto px-2">
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          const isActiveOrDone = step.state === 'active' || step.state === 'done'
          const canClick = onSelectStep && step.id !== 'confirm'
          const StepIcon = step.Icon

          return (
            <div
              key={step.id}
              className="flex items-center"
              style={{ flex: isLast ? 'none' : 1 }}
            >
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onSelectStep(step.id)}
                className={`flex flex-col items-center gap-2 shrink-0 bg-transparent border-0 p-0 ${
                  canClick ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                  style={
                    isActiveOrDone
                      ? {
                          background: '#0B462B',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(11, 70, 43, 0.25)',
                        }
                      : {
                          background: '#ECEFE4',
                          border: '1.5px solid #D3DBC9',
                          color: '#738277',
                        }
                  }
                >
                  <StepIcon className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </div>

                <span
                  className="text-[12.5px] font-semibold whitespace-nowrap transition-colors"
                  style={{
                    color: isActiveOrDone ? '#142D1E' : '#6A7A6F',
                  }}
                >
                  {step.label}
                </span>
              </button>

              {!isLast && (
                <div
                  className="flex-1 h-[2px] mx-3 mb-6 rounded-full transition-all duration-300"
                  style={{
                    background:
                      idx === 0 && isPayment
                        ? '#0B462B'
                        : idx === 0
                          ? 'linear-gradient(to right, #0B462B 45%, #D3DBC9 45%)'
                          : '#D6DEC9',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
