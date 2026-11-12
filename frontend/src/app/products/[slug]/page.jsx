// src/app/products/[slug]/page.jsx
import { notFound } from 'next/navigation'
import { getProductBySlug, getProducts } from '@/lib/api_product'
import ProductDetailClient from './ProductDetailClient'
import { auth } from '@/auth'


export const dynamic = 'force-dynamic'

// export async function generateStaticParams() {
//   const { slugify } = await import('@/app/lib/slugify')
//   const products = await getProducts()
//   return products.map(p => ({ slug: slugify(p.name) }))
// }

export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const product = await getProductBySlug(slug)
    return {
      title: `${product.name} — El Árbol`,
      description: product.shortDesc || product.description,
    }
  } catch {
    return { title: 'Product — El Árbol' }
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  
  const session = await auth()
  const token = session?.user?.accessToken
  
  let product

  try {
    product = await getProductBySlug(slug, { token })
  } catch (error) {
    console.error(`Error fetching product ${slug}:`, error)
    notFound()
  }

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} related={product.related ?? []} session={session} />
}