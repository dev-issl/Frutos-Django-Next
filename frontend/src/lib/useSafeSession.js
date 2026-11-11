'use client'

import { createContext, useContext } from 'react'
import { SessionContext } from 'next-auth/react'

const NOOP_CONTEXT = createContext(null)

const FALLBACK_SESSION = {
  data: null,
  status: 'unauthenticated',
  async update() {
    return null
  },
}

/**
 * Safely read NextAuth SessionContext without throwing when Turbopack HMR or
 * an isolated SSR chunk momentarily renders outside a shared SessionProvider context.
 */
export function useSafeSession() {
  const ctx = useContext(SessionContext || NOOP_CONTEXT)
  return ctx ?? FALLBACK_SESSION
}

