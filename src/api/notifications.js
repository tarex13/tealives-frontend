import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.access) {
    config.headers.Authorization = `Bearer ${user.access}`
  }
  return config
})

export const fetchNotifications = async () => {
  const res = await API.get('notifications/')
  return res.data
}

export const markNotificationRead = async (id) => {
  const res = await API.patch(`notifications/${id}/`, { is_read: true })
  return res.data
}
