// src/api.js
import axios from 'axios'
import { getUpdateAccessTokenCallback } from './context/AuthContextHelper'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',
})

// ✅ Attach access token from localStorage
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
    console.log('[api.js] Access token attached')
  }
  return config
}, (error) => Promise.reject(error))

// ✅ Refresh token on 401
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

      const refresh = localStorage.getItem('refreshToken')
      if (!refresh) return Promise.reject(error)

      try {
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/'}token/refresh/`,
          { refresh }
        )

        const { access, refresh: newRefresh } = refreshRes.data
        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', newRefresh)

        const updateAccessToken = getUpdateAccessTokenCallback()
        if (updateAccessToken) updateAccessToken(access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('[api.js] Refresh failed:', refreshError)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/user/auth/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
