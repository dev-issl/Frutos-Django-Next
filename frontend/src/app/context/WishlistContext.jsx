'use client'
// src/app/context/WishlistContext.jsx
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/app/context/AuthContext'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { isAuthenticated, authFetch } = useAuth()

  const [items,  setItems]  = useState([])   // { id, name, price, image, ... }
  const [loaded, setLoaded] = useState(false)

  // Prevent duplicate in-flight requests
  const pendingRef = useRef({})

  // ── hydrate (called by SavedItemsTab with server-fetched data) ────────────
  const hydrate = useCallback((data) => {
    if (!data) return
    const arr = Array.isArray(data) ? data
      : Array.isArray(data.results) ? data.results
      : []
    setItems(arr.map(normalizeProduct))
    setLoaded(true)
  }, [])

  // ── isSaved ───────────────────────────────────────────────────────────────
  const isSaved = useCallback(
    (productId) => items.some(i => i.id === productId),
    [items]
  )

  // ── toggle (add / remove) ─────────────────────────────────────────────────
  const toggle = useCallback(async (product) => {
    if (!isAuthenticated) return

    const id      = product.id
    const already = items.some(i => i.id === id)

    // 1. Optimistic UI update first
    if (already) {
      setItems(prev => prev.filter(i => i.id !== id))
    } else {
      setItems(prev => [...prev, normalizeProduct(product)])
    }

    // 2. Prevent duplicate concurrent calls for the same product
    if (pendingRef.current[id]) return
    pendingRef.current[id] = true

    try {
      if (already) {
        // DELETE — remove from wishlist
        await authFetch(`${API_BASE}/auth/wishlist/${id}/`, {
          method: 'DELETE',
        })
      } else {
        // POST — add to wishlist
        await authFetch(`${API_BASE}/auth/wishlist/`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ product_id: id }),
        })
      }
    } catch (err) {
      // Rollback optimistic update on failure
      console.error('[Wishlist] toggle failed, rolling back', err)
      if (already) {
        setItems(prev => [...prev, normalizeProduct(product)])
      } else {
        setItems(prev => prev.filter(i => i.id !== id))
      }
    } finally {
      delete pendingRef.current[id]
    }
  }, [isAuthenticated, authFetch, items])

  // ── remove (used by SavedItemsTab's confirm modal) ────────────────────────
  const remove = useCallback(async (productId) => {
    // Optimistic
    setItems(prev => prev.filter(i => i.id !== productId))

    if (!isAuthenticated) return
    try {
      await authFetch(`${API_BASE}/auth/wishlist/${productId}/`, { method: 'DELETE' })
    } catch (err) {
      console.error('[Wishlist] remove failed', err)
      // We don't roll back here since the user explicitly confirmed removal
    }
  }, [isAuthenticated, authFetch])

  // ── clearAll ──────────────────────────────────────────────────────────────
  const clearAll = useCallback(async () => {
    const snapshot = items
    setItems([])

    if (!isAuthenticated) return
    try {
      await authFetch(`${API_BASE}/auth/wishlist/clear/`, { method: 'DELETE' })
    } catch (err) {
      console.error('[Wishlist] clearAll failed', err)
      setItems(snapshot) // rollback
    }
  }, [isAuthenticated, authFetch, items])

  return (
    <WishlistContext.Provider value={{ items, loaded, hydrate, isSaved, toggle, remove, clearAll }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}

// ── helpers ───────────────────────────────────────────────────────────────────
function normalizeProduct(p) {
  // If this is a Wishlist object wrapper, extract the inner product
  if (p && p.product && p.product.id) {
    p = p.product;
  }
  
  let image = p.thumbnail || p.thumbnail_url || p.image_url || p.image || null;
  if (image && !image.startsWith('http') && !image.startsWith('data:')) {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
    const mediaBase = base.replace('/api', '');
    const clean = image.replace(/^\/+/, '');
    image = `${mediaBase}/${clean}`;
  }
  
  return {
    id:             p.id,
    name:           p.name           || p.product_name || '',
    price:          Number(p.price)  || 0,
    oldPrice:       p.oldPrice       || p.old_price    || null,
    image:          image            || '',
    origin:         p.origin         || '',
    unit:           p.unit           || '',
    inStock:        p.inStock        ?? p.in_stock     ?? true,
    wholesalePrice: p.wholesalePrice || p.wholesale_price || null,
    wholesaleUnit:  p.wholesaleUnit  || p.wholesale_unit  || '',
    minWholesaleQty: p.minWholesaleQty || p.min_wholesale_qty || 1,
    badge:          p.badge          || '',
    badgeColor:     p.badgeColor     || '',
    onSale:         p.onSale         || p.on_sale      || false,
    category:       p.category       || '',
  }
}