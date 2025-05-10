import axios from 'axios'
import api from '../api'
const API = api.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.access) {
    config.headers.Authorization = `Bearer ${user.access}`
  }
  return config
})

export const fetchListings = async () => {
  const res = await API.get('marketplace/')
  return res.data
}
