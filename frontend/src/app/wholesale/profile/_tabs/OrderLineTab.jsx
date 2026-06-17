'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Plus, Minus, Trash2, Printer, ShoppingCart } from 'lucide-react'
import { getProducts, getCategories } from '@/lib/api'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/context/CartContext'

export default function OrderLineTab({ accessToken }) {
  const router = useRouter()
  const { clearCart, addItem } = useCart()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderNumber] = useState(`ORD-${Math.floor(Math.random() * 10000)}`)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [catsRes, prodsRes] = await Promise.all([
          getCategories(),
          getProducts({ accessToken })
        ])
        setCategories(catsRes || [])
        setProducts(prodsRes || [])
      } catch (err) {
        console.error('Error fetching data for order line:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [accessToken])

  const filteredProducts = products.filter(p => {
    const productTitle = p.name || p.title || ''
    const matchesSearch = productTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category?.name === activeCategory || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      const step = parseInt(product.wholesaleUnit) || product.minWholesaleQty || 1
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + step } : item)
      }
      return [...prev, { ...product, quantity: step }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const step = parseInt(item.wholesaleUnit) || item.minWholesaleQty || 1
        const newQ = item.quantity + (delta * step)
        if (newQ <= 0) return null
        return { ...item, quantity: newQ }
      }
      return item
    }).filter(Boolean))
  }

  const getQuantityInCart = (productId) => {
    return cart.find(item => item.id === productId)?.quantity || 0
  }

  const getDisplayPrice = (item) => {
    return item.wholesalePrice || (item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price))
  }

  const getDisplayUnit = (item) => {
    return item.wholesale_unit || item.unit || item.wholesaleUnit || ''
  }

  const subtotal = cart.reduce((sum, item) => sum + (getDisplayPrice(item) * item.quantity), 0)
  const tax = subtotal * 0.05 // Assuming 5% tax or calculate as needed
  const total = subtotal + tax

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return
    setPlacingOrder(true)
    try {
      clearCart()
      cart.forEach(item => {
        addItem(item, getDisplayPrice(item), item.quantity)
      })
      router.push('/checkout')
    } catch (err) {
      console.error(err)
      alert('Failed to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">

      {/* Left Main Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Top Search Bar */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#085041]/20 focus:border-[#085041] transition-all"
            />
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white overflow-x-auto scrollbar-hide flex gap-3 z-10">
          <button
            onClick={() => setActiveCategory('All')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeCategory === 'All'
              ? 'bg-[#085041] text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            All Products
          </button>
          {categories.filter(cat => {
            const catName = typeof cat === 'string' ? cat : cat.name;
            return catName !== 'All';
          }).map((cat, idx) => {
            const catName = typeof cat === 'string' ? cat : cat.name
            return (
              <button
                key={idx}
                onClick={() => setActiveCategory(catName)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeCategory === catName
                  ? 'bg-[#085041] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {catName}
              </button>
            )
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-[#085041] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const qty = getQuantityInCart(product.id)
                const isSelected = qty > 0
                const step = parseInt(product.wholesaleUnit) || product.minWholesaleQty || 1
                const stock = product.inStock || 0
                const canAddMore = (qty + step) <= stock
                return (
                  <div key={product.id} className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col h-full overflow-hidden ${isSelected ? 'border-[#085041] shadow-md ring-1 ring-[#085041]/10' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>

                    {/* Image Area */}
                    <div className="relative w-full pt-[75%] bg-[#F8F9FA] flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-sm bg-white border border-gray-100 shrink-0 transition-transform duration-300 hover:scale-105">
                          {product.image_url || product.image ? (
                            <Image src={product.image_url || product.image} alt={product.name || product.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#085041] bg-[#e8f5e9] font-medium">No Img</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        {typeof product.category === 'string' ? product.category : product.category?.name || 'Category'}
                      </div>
                      <h4 className="font-semibold text-gray-900 text-[13px] sm:text-[14px] leading-tight mb-3 line-clamp-2">
                        {product.name || product.title}
                      </h4>

                      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                        {/* Price */}
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-[14px] sm:text-[15px] leading-none shrink-0">
                            €{getDisplayPrice(product).toFixed(2)}
                          </span>
                          {getDisplayUnit(product) && <span className="text-[10px] text-gray-400 mt-0.5">/ {getDisplayUnit(product)}</span>}
                        </div>

                        {/* Compact Stepper Pill */}
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-50 rounded-full p-0.5 sm:p-1 border border-gray-100 shrink-0">
                          <button
                            onClick={() => isSelected && updateQuantity(product.id, -1)}
                            disabled={!isSelected}
                            className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 flex items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-white text-gray-700 shadow-sm cursor-pointer hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>

                          <span className={`text-[11px] sm:text-[12px] font-bold min-w-[14px] sm:min-w-[16px] text-center leading-none ${isSelected ? 'text-[#085041]' : 'text-gray-800'}`}>
                            {qty}
                          </span>

                          <button
                            onClick={() => !isSelected ? addToCart(product) : updateQuantity(product.id, 1)}
                            disabled={!canAddMore}
                            title={!canAddMore ? "Stock limit reached" : ""}
                            className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 flex items-center justify-center rounded-full transition-colors shadow-sm ${canAddMore
                              ? 'bg-[#085041] text-white hover:bg-[#064034] cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Right Sidebar - Cart */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px] lg:h-auto">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#085041] text-white rounded-t-xl">
          <div>
            <h3 className="font-semibold text-lg">Current Order</h3>
            <p className="text-white/70 text-xs">Order {orderNumber}</p>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            {cart.reduce((s, i) => s + i.quantity, 0)} Items
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart size={48} className="opacity-20" />
              <p className="text-sm">No items in order</p>
            </div>
          ) : (
            cart.map(item => {
              const step = parseInt(item.wholesaleUnit) || item.minWholesaleQty || 1
              const stock = item.inStock || 0
              const canAddMore = (item.quantity + step) <= stock
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                    {(item.image_url || item.image) && <Image src={item.image_url || item.image} alt={item.name || item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 line-clamp-1">{item.name || item.title}</h5>
                    <p className="text-xs text-gray-500">
                      €{getDisplayPrice(item).toFixed(2)}
                      {getDisplayUnit(item) ? <span className="text-gray-400"> / {getDisplayUnit(item)}</span> : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-gray-900">€{(getDisplayPrice(item) * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1 px-2 border border-gray-100">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="text-xs font-bold min-w-[24px] text-center flex items-baseline justify-center gap-0.5">
                        {item.quantity}
                        {getDisplayUnit(item) && <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">{getDisplayUnit(item)}</span>}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={!canAddMore}
                        title={!canAddMore ? "Stock limit reached" : ""}
                        className={canAddMore ? "text-gray-400 hover:text-[#085041]" : "text-gray-300 cursor-not-allowed"}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (5%)</span>
              <span>€{tax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-lg text-[#085041]">
              <span>Total Payable</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || placingOrder}
              className="flex-1 bg-[#085041] text-white rounded-lg font-medium py-3 hover:bg-[#064034] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              {placingOrder ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
