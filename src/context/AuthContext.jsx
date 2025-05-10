// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode' // ✅ ESM-compatible import
import api from '../api'
import { setUpdateAccessTokenCallback } from './AuthContextHelper'

const AuthContext = createContext()
let refreshTimeoutId = null

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch (err) {
      console.error('[AuthContext] Failed to parse user:', err)
      return null
    }
  })

  const loginUser = (authData) => {
    localStorage.setItem('user', JSON.stringify(authData))
    setUser(authData)
    scheduleSilentRefresh(authData.access, authData.refresh)
  }

  const logoutUser = () => {
    localStorage.removeItem('user')
    setUser(null)
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId)
      refreshTimeoutId = null
    }
  }

  const updateAccessToken = (newAccess) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, access: newAccess }
      localStorage.setItem('user', JSON.stringify(updated))
      scheduleSilentRefresh(newAccess, updated.refresh)
      return updated
    })
  }

  const scheduleSilentRefresh = (accessToken, refreshToken) => {
    if (!accessToken || !refreshToken) {
      console.warn('[AuthContext] Cannot schedule refresh — missing tokens')
      return
    }

    let decoded
    try {
      decoded = jwtDecode(accessToken)
    } catch (e) {
      console.error('[AuthContext] Invalid token during decode:', e)
      logoutUser()
      return
    }

    const expiresAt = decoded.exp * 1000
    const buffer = 60 * 1000 // refresh 1 minute early
    const delay = expiresAt - Date.now() - buffer

    if (delay <= 0 || isNaN(delay)) {
      console.warn('[AuthContext] Invalid delay, skipping refresh')
      return
    }

    if (refreshTimeoutId) clearTimeout(refreshTimeoutId)

    refreshTimeoutId = setTimeout(async () => {
      try {
        const res = await api.post('token/refresh/', { refresh: refreshToken })
        const { access, refresh: newRefresh } = res.data
        const updated = { ...user, access, refresh: newRefresh }
        localStorage.setItem('user', JSON.stringify(updated))
        setUser(updated)
        scheduleSilentRefresh(access, newRefresh)
        console.log('[AuthContext] Silent refresh succeeded')
      } catch (err) {
        console.error('[AuthContext] Silent refresh failed:', err)
        logoutUser()
      }
    }, delay)

    console.log(`[AuthContext] Refresh scheduled in ${Math.round(delay / 1000)}s`)
  }

  useEffect(() => {
    setUpdateAccessTokenCallback(updateAccessToken)

    const stored = localStorage.getItem('user')
    const userData = stored ? JSON.parse(stored) : null

    if (userData?.access && userData?.refresh) {
      setUser(userData)
      scheduleSilentRefresh(userData.access, userData.refresh)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, updateAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
