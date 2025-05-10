import api from '../api'
import axios from 'axios'

const API = api.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Attach access token if present
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.access) {
    config.headers.Authorization = `Bearer ${user.access}`
  }
  return config
})

// ✅ Safely fetch events and return an array
export const fetchEvents = async (city = '') => {
  try {
    const res = await API.get(`events/?city=${city}`)

    if (Array.isArray(res.data)) {
      return res.data
    } else if (res.data?.results && Array.isArray(res.data.results)) {
      return res.data.results
    } else {
      return []
    }
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return []
  }
}

export const rsvpToEvent = async (eventId) => {
  const res = await API.patch(`events/${eventId}/rsvp/`)
  return res.data
}
