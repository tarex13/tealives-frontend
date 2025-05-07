import axios from 'axios'
import { getStoredUser, setStoredUser } from './utils/tokenStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// 🔁 Auto-refresh expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.data?.code === 'token_not_valid' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      const stored = getStoredUser()
      if (!stored?.refresh) return Promise.reject(error)

      try {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}token/refresh/`, {
          refresh: stored.refresh,
        })

        const updatedUser = { ...stored, access: res.data.access }
        setStoredUser(updatedUser)

        originalRequest.headers.Authorization = `Bearer ${res.data.access}`
        return api(originalRequest)
      } catch (err) {
        console.error('Refresh failed, user will be logged out')
        localStorage.removeItem('user')
      }
    }

    return Promise.reject(error)
  }
)

export default api
