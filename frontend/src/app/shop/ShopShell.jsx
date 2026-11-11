'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import ShopHeroBanner from './ShopHeroBanner'

export const ShopHeroContext = createContext(null)

/**
 * Wraps the Shop route with an immediately painted ShopHeroBanner outside the
 * async products Suspense boundary, while syncing category/sub-category state
 * from ProductListingClient as the user interacts with filters.
 */
export default function ShopShell({ initialCategory = 'All Produce', children }) {
  const [heroMeta, setHeroMeta] = useState({
    activeCategory: initialCategory || 'All Produce',
    activeSubCategory: null,
    isInternalWholesale: false,
  })

  const syncHeroMeta = useCallback((nextMeta) => {
    setHeroMeta((prev) => {
      if (
        prev.activeCategory === nextMeta.activeCategory &&
        prev.activeSubCategory === nextMeta.activeSubCategory &&
        prev.isInternalWholesale === nextMeta.isInternalWholesale
      ) {
        return prev
      }
      return nextMeta
    })
  }, [])

  return (
    <ShopHeroContext.Provider value={syncHeroMeta}>
      <div className="min-h-screen bg-[#EFF9F2]">
        <ShopHeroBanner
          activeCategory={heroMeta.activeCategory}
          activeSubCategory={heroMeta.activeSubCategory}
          isInternalWholesale={heroMeta.isInternalWholesale}
        />
        {children}
      </div>
    </ShopHeroContext.Provider>
  )
}

export function useShopHeroSync() {
  return useContext(ShopHeroContext)
}

