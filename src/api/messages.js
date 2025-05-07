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

export const fetchThreads = async () => {
  const res = await API.get('messages/')
  return res.data
}

export const fetchThread = async (userId) => {
  const res = await API.get(`messages/thread/${userId}/`)
  return res.data
}

export const sendMessage = async (recipientId, content) => {
  const res = await API.post('messages/', {
    recipient: recipientId,
    content,
  })
  return res.data
}
