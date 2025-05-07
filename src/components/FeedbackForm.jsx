import { useState } from 'react'
import axios from 'axios'
import api from '../api'
import { useAuth } from '../context/AuthContext'

function FeedbackForm() {
  const { user } = useAuth()
  const [type, setType] = useState('bug')
  const [content, setContent] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axiapios.post(
        `${import.meta.env.VITE_API_BASE_URL}feedback/`,
        { type, content },
        user ? { headers: { Authorization: `Bearer ${user.access}` } } : {}
      )
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting feedback', err)
      alert('Failed to send feedback')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Thank you!</h2>
        <p className="text-gray-600">We’ve received your feedback 🙌</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Send Feedback</h1>

      <label className="block mb-2">
        Feedback Type:
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        >
          <option value="bug">🐞 Bug Report</option>
          <option value="feature">🌟 Feature Request</option>
          <option value="other">💬 Other</option>
        </select>
      </label>

      <label className="block mb-4">
        Your Feedback:
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="Explain the bug, suggest a feature, or share your thoughts..."
          className="w-full border p-2 rounded mt-1 h-32"
        />
      </label>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send Feedback
      </button>
    </form>
  )
}

export default FeedbackForm
