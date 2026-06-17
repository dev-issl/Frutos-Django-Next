'use client'
// src/app/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // full user object from API
  const [loading, setLoading] = useState(true)   // initial hydration
  const refreshTimerRef       = useRef(null)

  // ── Token helpers ─────────────────────────────────────────────────────────

  const getAccess  = () => typeof window !== 'undefined' ? localStorage.getItem('access_token')  : null
  const getRefresh = () => typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null

  function storeTokens(access, refresh) {
    localStorage.setItem('access_token',  access)
    localStorage.setItem('refresh_token', refresh)
    if (typeof document !== 'undefined') {
      document.cookie = `access_token=${access}; path=/; max-age=86400; SameSite=Lax`
    }
  }

  function clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    if (typeof document !== 'undefined') {
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }

  // ── Auto-refresh: re-issue access token 5 min before it expires ───────────

  function scheduleRefresh(accessToken) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    try {
      const payload  = JSON.parse(atob(accessToken.split('.')[1]))
      const expiresIn = (payload.exp * 1000) - Date.now() - 5 * 60 * 1000
      if (expiresIn > 0) {
        refreshTimerRef.current = setTimeout(refreshAccessToken, expiresIn)
      }
    } catch { /* ignore decode errors */ }
  }

  const refreshAccessToken = useCallback(async () => {
    const refresh = getRefresh()
    if (!refresh) { setUser(null); setLoading(false); return }

    try {
      const res  = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh }),
      })
      if (!res.ok) throw new Error('refresh failed')

      const data = await res.json()
      storeTokens(data.access, data.refresh || refresh)
      scheduleRefresh(data.access)
      // Decode user from new token
      const payload = JSON.parse(atob(data.access.split('.')[1]))
      setUser(prev => prev ? { ...prev, _tokenPayload: payload } : null)
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [])

  // ── Hydrate on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    async function hydrate() {
      const access = getAccess()
      if (!access) { setLoading(false); return }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(access.split('.')[1]))
        if (payload.exp * 1000 < Date.now()) {
          await refreshAccessToken()
          setLoading(false)
          return
        }
        // Token valid — fetch fresh profile
        const res = await fetch(`${API_BASE}/auth/profile/?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
          scheduleRefresh(access)
        } else {
          clearTokens()
        }
      } catch {
        clearTokens()
      }
      setLoading(false)
    }
    hydrate()
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current) }
  }, [])

  // ── Auth actions ──────────────────────────────────────────────────────────

  async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    const text = await res.text()
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      throw new Error(text || 'Login failed: invalid server response')
    }

    if (!res.ok) throw new Error(data.detail || data.non_field_errors?.[0] || data.error || 'Login failed')

    storeTokens(data.access, data.refresh)
    scheduleRefresh(data.access)
    setUser(data.user)
    return data.user
  }

  async function register({ email, password, confirmPassword, firstName, lastName }) {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ email, password, confirmPassword, firstName, lastName }),
    })
    const text = await res.text()
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      throw new Error(text || 'Signup failed: invalid server response')
    }

    if (!res.ok) {
      const firstError = Object.values(data)[0]
      throw new Error(Array.isArray(firstError) ? firstError[0] : firstError || data.detail || data.error || 'Signup failed')
    }
    storeTokens(data.access, data.refresh)
    scheduleRefresh(data.access)
    setUser(data.user)
    return data.user
  }

  async function logout() {
    const refresh = getRefresh()
    const access  = getAccess()
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body:    JSON.stringify({ refresh }),
      })
    } catch { /* ignore */ }
    clearTokens()
    setUser(null)
    
    // Clear cart on logout to prevent wholesale/normal user mixups
    localStorage.removeItem('cart_items')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cart_clear'))
    }
    
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }

  // ── Authenticated fetch helper ────────────────────────────────────────────

  async function authFetch(url, options = {}) {
    const access = getAccess()
    const isFormData = typeof window !== 'undefined' && options.body instanceof FormData
    const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' }

    const headers = {
      ...defaultHeaders,
      ...options.headers,
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    }

    const res = await fetch(url, { ...options, headers })

    // Auto-retry once if 401 (try refresh)
    if (res.status === 401) {
      await refreshAccessToken()
      const newAccess = getAccess()
      if (!newAccess) throw new Error('Unauthenticated')
      return fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
          Authorization: `Bearer ${newAccess}`,
        },
      })
    }
    return res
  }

  // ── Profile update ────────────────────────────────────────────────────────

  async function updateProfile(data) {
    const res = await authFetch(`${API_BASE}/auth/profile/`, {
      method: 'PATCH',
      body:   JSON.stringify(data),
    })
    const updated = await res.json()
    if (!res.ok) throw new Error(JSON.stringify(updated))
    setUser(updated)
    return updated
  }

  async function uploadAvatar(file) {
    const access = getAccess()
    const form   = new FormData()
    form.append('avatar', file)
    const res = await fetch(`${API_BASE}/auth/avatar/`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${access}` },
      body:    form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error('Avatar upload failed')
    setUser(prev => ({
      ...prev,
      profile: { ...prev?.profile, resolvedAvatar: data.avatar },
    }))
    return data.avatar
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated,
      login, register, logout,
      authFetch, updateProfile, uploadAvatar,
      getAccess,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}