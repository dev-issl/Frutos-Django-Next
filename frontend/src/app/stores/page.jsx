// src/app/stores/page.jsx
// SERVER COMPONENT — no 'use client'

import { Suspense } from 'react'
import { getStores } from '@/lib/stores-api'
import StoreFinderClient from './StoreFinderClient'
import { StoresHeroShell } from './StoresHero'
import StoresFinderSkeleton from './StoresFinderSkeleton'

export const metadata = {
  title: 'Our Stores | El Árbol',
  description: 'Find our artisan produce stores near you and experience care in every delivery.',
}

// Revalidate every 60 s so store data stays fresh without a full rebuild
export const revalidate = 60

export default function StorePage() {
  return (
    <StoresHeroShell>
      <Suspense fallback={<StoresFinderSkeleton />}>
        <StoresFinderLoader />
      </Suspense>
    </StoresHeroShell>
  )
}

async function StoresFinderLoader() {
  const stores = await getStores().catch(() => [])
  return <StoreFinderClient initialStores={stores} embedded />
}