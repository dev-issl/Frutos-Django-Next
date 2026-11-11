// src/app/shop/page.jsx
import { Suspense } from 'react'
import { auth } from '@/auth'
import { getProducts, getCategoryObjects } from '@/lib/api_product'
import { checkIsInternalWholesale } from '@/lib/categoryHelper'
import ProductListingClient from './ProductListingClient'
import ShopShell from './ShopShell'
import ShopContentSkeleton from './ShopContentSkeleton'

export const dynamic = 'force-dynamic'
export const revalidate = 0  // always fresh on every request

export const metadata = {
  title: 'Market — El Árbol',
  description: 'Fresh produce, sourced with care.',
}

export default async function MarketPage({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {}
  const rawCategory =
    typeof resolvedParams?.category === 'string'
      ? resolvedParams.category.trim()
      : ''

  return (
    <ShopShell initialCategory={rawCategory || 'All Produce'}>
      <Suspense fallback={<ShopContentSkeleton />}>
        <ShopAsyncContent />
      </Suspense>
    </ShopShell>
  )
}

async function ShopAsyncContent() {
  const session = await auth()
  const token = session?.user?.accessToken

  const rawBase = (
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
  ).replace(/\/$/, '')
  const apiBase = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`
  const catalogUrl = `${apiBase}/website/site-settings/?group=catalog`

  const [products, categoryObjects, catalogRes] = await Promise.all([
    getProducts({ token }).catch(() => []),
    getCategoryObjects().catch(() => []),
    fetch(catalogUrl, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(1500),
    }).catch(() => null),
  ])

  let productClasses = []
  if (catalogRes && catalogRes.ok) {
    try {
      const catalogData = await catalogRes.json()
      const productClassesStr =
        catalogData.results?.find((s) => s.key === 'product_classes')?.value || ''
      productClasses = productClassesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } catch {
      productClasses = []
    }
  }

  const isInternalWholesale = checkIsInternalWholesale(session)

  return (
    <ProductListingClient
      initialProducts={products}
      categories={categoryObjects}
      productClasses={productClasses}
      isInternalWholesaleUser={isInternalWholesale}
    />
  )
}