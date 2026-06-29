'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Plus, Minus, Trash2, Printer, ShoppingCart } from 'lucide-react'
import { getProducts, getCategories } from '@/lib/api'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useCart } from '@/app/context/CartContext'
import { siteSettingsService } from '@/app/dashboard/_lib/services'

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

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeCategory])

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
        if (err.message && err.message.includes('401')) {
          console.warn('Session expired (401), logging out...')
          signOut({ callbackUrl: '/wholesale' })
          return
        }
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

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      const step = parseInt(product.minimum_purchase) || parseInt(product.minWholesaleQty) || 1
      const stock = product.inStock || 0

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + step, stock) } : item)
      }

      const initialQty = Math.min(step, stock)
      if (initialQty <= 0) return prev

      return [...prev, { ...product, quantity: initialQty }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQ = (parseInt(item.quantity) || 0) + delta
        if (newQ <= 0) return null
        const stock = item.inStock || 0
        return { ...item, quantity: Math.min(newQ, stock) }
      }
      return item
    }).filter(Boolean))
  }

  const setExactQuantity = (productId, value) => {
    if (value === '') {
      setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: '' } : item))
      return
    }
    const num = parseInt(value)
    if (isNaN(num)) return

    if (num <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const stock = item.inStock || 0
        return { ...item, quantity: Math.min(num, stock) }
      }
      return item
    }))
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

  const subtotal = cart.reduce((sum, item) => sum + (getDisplayPrice(item) * (parseInt(item.quantity) || 0)), 0)

  // Calculate tax per product using its individual tax_rate (defaulting to 5% if missing)
  const tax = cart.reduce((sum, item) => {
    const itemTaxRate = item.tax_rate ? parseFloat(item.tax_rate) / 100 : 0.05
    return sum + (getDisplayPrice(item) * (parseInt(item.quantity) || 0) * itemTaxRate)
  }, 0)

  const effectiveTaxRate = subtotal > 0 ? (tax / subtotal * 100) : 0
  const total = subtotal + tax

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return
    setPlacingOrder(true)
    try {
      clearCart()
      cart.forEach(item => {
        const step = parseInt(item.minimum_purchase) || parseInt(item.minWholesaleQty) || 1
        const finalQty = Math.max(parseInt(item.quantity) || 1, step)
        addItem(item, getDisplayPrice(item), finalQty)
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
        <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#085041]/20 focus:border-[#085041] transition-all"
            />
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="px-3 py-2 border-b border-gray-100 bg-white flex flex-wrap gap-2 z-10">
          <button
            onClick={() => setActiveCategory('All')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${activeCategory === 'All'
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
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${activeCategory === catName
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
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-[#085041] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No products found.</div>
          ) : (
            <>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {paginatedProducts.map((product) => {
                  const qty = getQuantityInCart(product.id)
                  const isSelected = qty > 0
                  const step = parseInt(product.minimum_purchase) || parseInt(product.minWholesaleQty) || 1
                  const stock = product.inStock || 0
                  const canAddMore = (qty + step) <= stock
                  return (
                    <div key={product.id} className={`bg-white rounded-xl border transition-all duration-300 flex flex-row h-[72px] overflow-hidden group ${isSelected ? 'border-[#085041] shadow-sm ring-1 ring-[#085041]/10' : 'border-gray-200 shadow-sm hover:shadow hover:border-gray-300'}`}>

                      {/* Image Area (Left) */}
                      <div className="relative w-[72px] h-full bg-transparent shrink-0 flex items-center justify-center overflow-hidden">
                        {product.image_url || product.image ? (
                          <div className="relative w-[52px] h-[52px]">
                            <Image
                              src={product.image_url || product.image}
                              alt={product.name || product.title}
                              fill
                              className="object-contain mix-blend-multiply rounded-md transition-transform duration-300 group-hover:scale-105"
                              sizes="52px"
                            />
                          </div>
                        ) : (
                          <div className="text-[9px] text-[#085041]/50 font-medium">No Image</div>
                        )}
                        {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                          <div className="absolute top-0 left-0 bg-[#D32F2F] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-md tracking-wider uppercase shadow-sm">
                            Sale
                          </div>
                        )}
                      </div>

                      {/* Content Area (Middle) */}
                      <div className="flex flex-col justify-center flex-1 min-w-0 pl-3 py-1">
                        <h4 className="font-semibold text-gray-800 text-[13px] leading-tight truncate mb-1 group-hover:text-[#085041]" title={product.name || product.title}>
                          {product.name || product.title}
                        </h4>
                        <div className="flex items-baseline gap-1 truncate">
                          <span className="font-extrabold text-[#085041] text-[14px] leading-none">
                            €{getDisplayPrice(product).toFixed(2)}
                          </span>
                          {getDisplayUnit(product) && <span className="text-[9px] text-gray-500 font-medium truncate">/ {getDisplayUnit(product)}</span>}
                        </div>
                        {step > 1 && (
                          <div className="text-[9px] text-orange-600 font-medium mt-0.5">
                            Min: {step}
                          </div>
                        )}
                      </div>

                      {/* Controls Area (Right) */}
                      <div className="flex items-center justify-center shrink-0 pr-3 pl-1">
                        {isSelected ? (
                          <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                            <button
                              onClick={() => qty > step && updateQuantity(product.id, -1)}
                              disabled={qty <= step}
                              className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-md transition-colors ${qty > step ? 'bg-white text-gray-700 shadow-sm cursor-pointer hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed bg-transparent'}`}
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>

                            <input
                              type="text"
                              value={qty}
                              readOnly
                              className="w-8 text-[12px] font-bold text-center leading-none bg-transparent outline-none border-none p-0 text-[#085041] cursor-default"
                            />

                            <button
                              onClick={() => canAddMore && updateQuantity(product.id, 1)}
                              disabled={!canAddMore}
                              className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-md transition-colors ${canAddMore ? 'bg-[#085041] text-white shadow-sm cursor-pointer hover:bg-[#064034]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product, step)}
                            disabled={stock < step}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all duration-200 ${stock < step
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#085041]/10 text-[#085041] cursor-pointer hover:bg-[#085041] hover:text-white hover:shadow-md'
                              }`}
                          >
                            {stock < step ? 'Out of Stock' : (
                              <>
                                <Plus size={12} strokeWidth={3} />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 mb-2 gap-2 w-full">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) => (
                        p === '...' ? (
                          <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400">...</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${currentPage === p
                              ? 'bg-[#085041] text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                            {p}
                          </button>
                        )
                      ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Right Sidebar - Cart */}
      {cart.length > 0 && (
        <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px] lg:h-auto animate-in slide-in-from-right-8 fade-in duration-500">
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
                const step = parseInt(item.minimum_purchase) || parseInt(item.minWholesaleQty) || 1
                const stock = item.inStock || 0
                const canAddMore = (item.quantity + step) <= stock
                const canDecrease = item.quantity > step
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                      {(item.image_url || item.image) && <Image src={item.image_url || item.image} alt={item.name || item.title} fill className="object-contain mix-blend-multiply p-1" />}
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
                        {canDecrease ? (
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                            <Trash2 size={12} strokeWidth={2.5} />
                          </button>
                        )}
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
                <span>Tax {cart.length > 0 ? `(${Number(effectiveTaxRate.toFixed(1))}%)` : ''}</span>
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
      )}

    </div>
  )
}
