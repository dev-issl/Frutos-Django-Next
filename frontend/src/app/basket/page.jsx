// src/app/basket/page.jsx — SERVER COMPONENT
import { auth } from '@/auth'
import BasketShell from '@/app/basket/components/BasketShell'
import { getDeliveryOption, getNearestStore } from '@/lib/api'
import { getProducts } from '@/lib/api_product'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Your Basket | El Árbol',
  description: 'Review your selected products before checkout.',
}

export default async function BasketPage() {
  const session = await auth()
  const token = session?.user?.accessToken || null

  const [deliveryResult, storeResult, productsResult] = await Promise.allSettled([
    getDeliveryOption(),
    getNearestStore(),
    getProducts({ token, pageSize: 16, fetchAll: false }),
  ])

  const products = productsResult.status === 'fulfilled' && Array.isArray(productsResult.value)
    ? productsResult.value.slice(0, 12)
    : []

  return (
    <BasketShell
      initialDelivery={deliveryResult.status === 'fulfilled' ? deliveryResult.value : null}
      initialStore={storeResult.status === 'fulfilled' ? storeResult.value : null}
      recommendedProducts={products}
    />
  )
}
