import axios from 'axios'

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
  })

export const login = async (credentials) => {
  const res = await API.post('login/', credentials)
  return res.data
}

export const register = async (data) => {
  const res = await API.post('register/', data)
  return res.data
}


