// src/api.js
import axios from 'axios'
import { getUpdateAccessTokenCallback } from './context/AuthContextHelper'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',
})

// ✅ Add access token to requests
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('user')
  const user = stored ? JSON.parse(stored) : null

  if (user?.access) {
    config.headers.Authorization = `Bearer ${user.access}`
    console.log('[api.js] Access token attached')
  }
  return config
}, (error) => Promise.reject(error))

// ✅ Refresh token logic on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'token_not_valid' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      const stored = localStorage.getItem('user')
      if (!stored) return Promise.reject(error)

      const user = JSON.parse(stored)

      try {
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/'}token/refresh/`,
          { refresh: user.refresh }
        )

        const { access, refresh } = refreshRes.data
        const updatedUser = { ...user, access, refresh }
        localStorage.setItem('user', JSON.stringify(updatedUser))

        const updateAccessToken = getUpdateAccessTokenCallback()
        if (updateAccessToken) updateAccessToken(access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('[api.js] Refresh failed:', refreshError)
        localStorage.removeItem('user')
        window.location.href = '/user/auth/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
