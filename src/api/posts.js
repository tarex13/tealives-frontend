import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Helper: Get saved tokens
function getTokens() {
  const user = JSON.parse(localStorage.getItem('user'))
  return {
    access: user?.access,
    refresh: user?.refresh,
    user: user?.user,
  }
}

// Set token before every request
API.interceptors.request.use((config) => {
  const { access } = getTokens()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// Intercept responses to handle token refresh
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    const { refresh } = getTokens()

    // If token is expired and we haven't already tried refreshing:
    if (
      err.response?.status === 401 &&
      err.response?.data?.code === 'token_not_valid' &&
      refresh &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}refresh/`,
          { refresh }
        )

        // Save new access token
        const stored = JSON.parse(localStorage.getItem('user'))
        stored.access = res.data.access
        localStorage.setItem('user', JSON.stringify(stored))

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`
        return API(originalRequest)
      } catch (refreshErr) {
        console.error('Refresh failed:', refreshErr)
        localStorage.removeItem('user') // Force logout
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)


export const fetchPosts = async (city = '') => {
  const res = await API.get(`posts/?city=${city}`)
  return res.data
}

export const createPost = async (data) => {
  const res = await API.post('posts/', data)
  return res.data
}