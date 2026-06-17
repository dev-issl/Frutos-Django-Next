// 'use client'

// import { createContext, useContext, useReducer, useState, useEffect } from 'react'

// const CartContext = createContext(null)

// function cartReducer(state, action) {
//   switch (action.type) {
//     case 'ADD_ITEM': {
//       const existing = state.items.find(i => i.id === action.product.id)
//       if (existing) {
//         return {
//           ...state,
//           items: state.items.map(i =>
//             i.id === action.product.id
//               ? {
//                   ...i,
//                   qty: i.qty + action.qty,
//                   price: action.effectivePrice || action.product.price,
//                 }
//               : i
//           ),
//         }
//       }
//       return {
//         ...state,
//         items: [
//           ...state.items,
//           {
//             ...action.product,
//             price:         action.effectivePrice || action.product.price,
//             originalPrice: action.product.price,
//             qty:           action.qty,
//           },
//         ],
//       }
//     }
//     case 'REMOVE_ITEM':
//       return { ...state, items: state.items.filter(i => i.id !== action.id) }
//     case 'UPDATE_QTY': {
//       if (action.qty < 1) {
//         return { ...state, items: state.items.filter(i => i.id !== action.id) }
//       }
//       return {
//         ...state,
//         items: state.items.map(i =>
//           i.id === action.id ? { ...i, qty: action.qty } : i
//         ),
//       }
//     }
//     case 'HYDRATE':
//       return { ...state, items: action.items }
//     case 'CLEAR_CART':
//       return { ...state, items: [] }
//     default:
//       return state
//   }
// }

// export function CartProvider({ children }) {
//   const [state, dispatch]             = useReducer(cartReducer, { items: [] })
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const [fulfillment, setFulfillment] = useState('delivery')
//   const [hydrated, setHydrated]       = useState(false)

//   // ── Restore cart from localStorage on first mount
//   useEffect(() => {
//     try {
//       const saved = localStorage.getItem('cart_items')
//       if (saved) {
//         const parsed = JSON.parse(saved)
//         if (Array.isArray(parsed) && parsed.length > 0) {
//           dispatch({ type: 'HYDRATE', items: parsed })
//         }
//       }
//     } catch {}
//     setHydrated(true)
//   }, [])

//   // ── Persist to localStorage whenever items change (only after hydration)
//   useEffect(() => {
//     if (hydrated) {
//       localStorage.setItem('cart_items', JSON.stringify(state.items))
//     }
//   }, [state.items, hydrated])

//   const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0)
//   const subtotal   = state.items.reduce((sum, i) => sum + i.price * i.qty, 0)

//   function addItem(product, effectivePrice = null, qty = 1) {
//     dispatch({ type: 'ADD_ITEM', product, effectivePrice, qty })
//     setSidebarOpen(true)
//   }

//   function removeItem(id)     { dispatch({ type: 'REMOVE_ITEM', id }) }
//   function updateQty(id, qty) { dispatch({ type: 'UPDATE_QTY', id, qty }) }
//   function clearCart()        { dispatch({ type: 'CLEAR_CART' }) }

//   return (
//     <CartContext.Provider value={{
//       items: state.items,
//       totalItems,
//       subtotal,
//       fulfillment,
//       setFulfillment,
//       sidebarOpen,
//       setSidebarOpen,
//       addItem,
//       removeItem,
//       updateQty,
//       clearCart,
//     }}>
//       {children}
//     </CartContext.Provider>
//   )
// }

// export function useCart() {
//   const ctx = useContext(CartContext)
//   if (!ctx) throw new Error('useCart must be used within CartProvider')
//   return ctx
// }


'use client'

import { createContext, useContext, useReducer, useState, useEffect } from 'react'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemType = action.product.item_type || 'product'
      const existing = state.items.find(i => i.id === action.product.id && (i.item_type || 'product') === itemType)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            (i.id === action.product.id && (i.item_type || 'product') === itemType)
              ? {
                  ...i,
                  qty: i.qty + action.qty,
                  price: action.effectivePrice || action.product.price,
                }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            ...action.product,
            item_type:     itemType,
            price:         action.effectivePrice || action.product.price,
            originalPrice: action.product.price,
            qty:           action.qty,
          },
        ],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => !(i.id === action.id && (i.item_type || 'product') === action.item_type)) }
    case 'UPDATE_QTY': {
      if (action.qty < 1) {
        return { ...state, items: state.items.filter(i => !(i.id === action.id && (i.item_type || 'product') === action.item_type)) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          (i.id === action.id && (i.item_type || 'product') === action.item_type) ? { ...i, qty: action.qty } : i
        ),
      }
    }
    case 'HYDRATE':
      return { ...state, items: action.items }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch]             = useReducer(cartReducer, { items: [] })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fulfillment, setFulfillment] = useState('delivery')
  const [hydrated, setHydrated]       = useState(false)

  // ── Promo state ────────────────────────────────────────────────────────────
  // shape: { code, discount_percent, applicable_product_ids, discount_amount, message }
  const [promoState, setPromoState]   = useState(null)

  // ── Restore cart from localStorage on first mount ──────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart_items')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'HYDRATE', items: parsed })
        }
      }
    } catch {}
    setHydrated(true)
  }, [])

  // ── Persist to localStorage whenever items change (only after hydration) ───
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('cart_items', JSON.stringify(state.items))
    }
  }, [state.items, hydrated])

  // ── Listen for cross-component clear cart events (e.g. logout) ─────────────
  useEffect(() => {
    function handleClear() {
      dispatch({ type: 'CLEAR_CART' })
      setPromoState(null)
    }
    window.addEventListener('cart_clear', handleClear)
    return () => window.removeEventListener('cart_clear', handleClear)
  }, [])

  const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0)
  const subtotal   = state.items.reduce((sum, i) => sum + i.price * i.qty, 0)

  // ── Promo discount calculation ─────────────────────────────────────────────
  // applicable_product_ids = [] means coupon applies to ALL products
  // applicable_product_ids = [id1, id2] means ONLY those products get discount
  const applicableIds = promoState?.applicable_product_ids || []
  const hasApplicableRestriction = applicableIds.length > 0

  // Items that qualify for this coupon
  const qualifyingItems = promoState
    ? state.items.filter(item =>
        !hasApplicableRestriction ||
        applicableIds.includes(String(item.id))
      )
    : []

  // min_quantity check: only count qualifying items' qty
  const qualifyingQty = qualifyingItems.reduce((sum, i) => sum + i.qty, 0)
  const promoStillValid = promoState
    ? qualifyingQty >= (promoState.min_quantity_required || 1)
    : false

  const promoDiscount = (promoState && promoStillValid)
    ? (() => {
        if (promoState.discount_type === 'FLAT') {
          // Flat: fixed amount, but only if qualifying items exist in cart
          return qualifyingItems.length > 0 ? Number(promoState.flat_discount_amount || 0) : 0
        }
        // Percentage: sum discount across qualifying items only
        return qualifyingItems.reduce((sum, item) => {
          const price = item.effectivePrice ?? item.price
          return sum + price * item.qty * (promoState.discount_percent / 100)
        }, 0)
      })()
    : 0

  const discountedSubtotal = Math.max(0, subtotal - promoDiscount)

  function addItem(product, effectivePrice = null, qty = 1) {
    dispatch({ type: 'ADD_ITEM', product, effectivePrice, qty })
  }

  function removeItem(id, item_type = 'product') { dispatch({ type: 'REMOVE_ITEM', id, item_type }) }
  function updateQty(id, qty, item_type = 'product') { dispatch({ type: 'UPDATE_QTY', id, qty, item_type }) }

  // ── clearCart — promo ও reset হয় ──────────────────────────────────────────
  function clearCart() {
    dispatch({ type: 'CLEAR_CART' })
    setPromoState(null)
  }

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems,
      subtotal,
      fulfillment,
      setFulfillment,
      sidebarOpen,
      setSidebarOpen,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      // ── Promo ──────────────────────────────────────────────────────────────
      promoState,
      setPromoState,
      promoDiscount,
      discountedSubtotal,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}