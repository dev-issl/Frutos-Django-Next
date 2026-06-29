// src/app/shop/page.jsx
import { getProducts, getCategories, getCategoryObjects } from '@/lib/api_product'
import ProductListingClient from './ProductListingClient'

import { Suspense } from 'react'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0  // always fresh on every request

export const metadata = {
  title: 'Market — El Árbol',
  description: 'Fresh produce, sourced with care.',
}

export default async function MarketPage() {
  const session = await auth()
  const token = session?.user?.accessToken

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  const catalogUrl = `${API_URL}/api/website/site-settings/?group=catalog`

  const [products, categoryObjects, catalogRes] = await Promise.all([
    getProducts({ token }),
    getCategoryObjects(),
    fetch(catalogUrl, { cache: 'no-store' }).catch(() => null)
  ])

  let productClasses = []
  if (catalogRes && catalogRes.ok) {
    const catalogData = await catalogRes.json()
    const productClassesStr = catalogData.results?.find(s => s.key === 'product_classes')?.value || ""
    productClasses = productClassesStr.split(',').map(s => s.trim()).filter(Boolean)
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Market...</div>}>
      <ProductListingClient
        initialProducts={products}
        categories={categoryObjects}
        productClasses={productClasses}
      />
    </Suspense>
  )
}