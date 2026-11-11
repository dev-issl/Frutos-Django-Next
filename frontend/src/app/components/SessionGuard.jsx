'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useSafeSession } from '@/lib/useSafeSession'

export default function SessionGuard() {
  const { data: session } = useSafeSession()

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/wholesale' })
    }
  }, [session])

  return null
}