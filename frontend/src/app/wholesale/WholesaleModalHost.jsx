'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const WholesaleModal = dynamic(() => import('./WholesaleModal'), { ssr: false })

export default function WholesaleModalHost() {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => {
      setHasLoaded(true)
      setModalOpen(true)
    }
    const onPrefetch = () => {
      import('./WholesaleModal')
    }
    window.addEventListener('ws:open-apply-modal', onOpen)
    window.addEventListener('ws:prefetch-apply-modal', onPrefetch)
    return () => {
      window.removeEventListener('ws:open-apply-modal', onOpen)
      window.removeEventListener('ws:prefetch-apply-modal', onPrefetch)
    }
  }, [])

  if (!hasLoaded) return null

  return <WholesaleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
}

