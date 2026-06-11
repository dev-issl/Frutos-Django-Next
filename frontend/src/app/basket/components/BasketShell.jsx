'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/app/context/CartContext'
import { useAuth } from '@/app/context/AuthContext'
import BasketItemList from './BasketItemList'
import OrderSummary from './OrderSummary'
import EmptyBasket from './EmptyBasket'
import FulfillmentSwitcher from './FulfillmentSwitcher'

export default function BasketShell({ initialDelivery, initialStore }) {
  const { items, subtotal, updateQty, removeItem, discountedSubtotal, promoState } = useCart()
  const { user } = useAuth()
  
  const isApprovedWholesale = user?.wholesale_status === 'APPROVED'

  const [mounted, setMounted] = useState(false)
  const [fulfillment, setFulfillment] = useState('delivery')

  useEffect(() => setMounted(true), [])

  if (!mounted) return null
  if (items.length === 0) return <EmptyBasket />

  const deliveryConfig = initialDelivery

  function calcDeliveryFee(config, subtotalAmt) {
    if (fulfillment !== 'delivery') return 0
    if (!config || !config.is_active || config.charge_type === 'free') return 0
    if (config.charge_type === 'flat') return Number(config.flat_fee)
    if (config.charge_type === 'threshold') {
      return subtotalAmt >= Number(config.free_threshold) ? 0 : Number(config.flat_fee)
    }
    return 0
  }

  const effectiveSubtotal = promoState ? discountedSubtotal : subtotal
  const deliveryFee = calcDeliveryFee(deliveryConfig, effectiveSubtotal)
  const grandTotal = effectiveSubtotal + deliveryFee

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', width: '100%' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <span className="material-symbols-outlined text-4xl" style={{ color: '#00694c' }}>
            shopping_basket
          </span>
          <h1 className="text-4xl md:text-5xl font-light italic" style={{ fontFamily: '"Newsreader", Georgia, serif', color: '#151e13' }}>
            Your Basket
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Col: Items & Fulfillment */}
          <div className="lg:col-span-7 space-y-10">
            <BasketItemList 
              items={items} 
              updateQty={updateQty} 
              removeItem={removeItem} 
              isApprovedWholesale={isApprovedWholesale} 
            />
            
            <div className="space-y-4 pt-6 border-t border-slate-100">
               <FulfillmentSwitcher 
                 fulfillment={fulfillment}
                 setFulfillment={setFulfillment}
                 initialDelivery={initialDelivery}
                 initialStore={initialStore}
               />
            </div>
          </div>

          {/* Right Col: Summary */}
          <div className="lg:col-span-5">
            <OrderSummary 
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              deliveryConfig={deliveryConfig}
              grandTotal={grandTotal}
              items={items}
              isApprovedWholesale={isApprovedWholesale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
