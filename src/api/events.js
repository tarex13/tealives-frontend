import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Attach access token
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.access) {
    config.headers.Authorization = `Bearer ${user.access}`
  }
  return config
})

export const fetchEvents = async (city = '') => {
  const res = await API.get(`events/?city=${city}`)
  return res.data
}

export const rsvpToEvent = async (eventId) => {
  const res = await API.patch(`events/${eventId}/rsvp/`)
  return res.data
}
