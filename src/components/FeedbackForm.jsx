import React, { useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { Helmet } from 'react-helmet-async';
function FeedbackForm() {
  const { user } = useAuth()
  const [type, setType] = useState('bug')
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { type, content }
      if (!user) {
        payload.email = email
      }

      await api.post('feedback/', payload)
      setShowModal(true)
      setContent('')
      setEmail('')
      setType('bug')
    } catch (err) {
      console.error('Error submitting feedback', err)
      alert('Failed to send feedback')
    }
  }

  return (
    <>
    <Helmet>
        <title>Feedback | Tealives</title>
      </Helmet>
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md space-y-5"
      >
        <h1 className="md:text-3xl text-xl  font-extrabold text-center text-gray-800 dark:text-white">
          👉 Send Us Feedback 👈
        </h1>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            What kind of feedback?
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="bug">🐞 Bug Report</option>
            <option value="feature">🌟 Feature Request</option>
            <option value="other">💬 Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your feedback
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Explain the bug, suggest a feature, or share your thoughts..."
            className="w-full h-32 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {!user && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="We'll contact you if needed"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
        >
          🚀 Send Feedback
        </button>
      </form>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm text-center animate-fade-in-up scale-95 transition-all duration-300">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">🎉 Thank You!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We’ve received your feedback 🙌
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default FeedbackForm
