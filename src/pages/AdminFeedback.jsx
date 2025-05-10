import { useEffect, useState } from 'react'
import api from '../api'
import React from 'react'

function AdminFeedback() {
  const [feedback, setFeedback] = useState([])

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const res = await api.get('feedback/admin/')
        setFeedback(res.data)
      } catch (err) {
        console.error('Failed to load feedback', err)
      }
    }

    loadFeedback()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Feedback Submissions</h1>
      {feedback.length === 0 ? (
        <p>No feedback yet.</p>
      ) : (
        feedback.map((fb) => (
          <div
            key={fb.id}
            className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-3"
          >
            <p className="text-sm text-gray-500">
              {new Date(fb.created_at).toLocaleString()}
            </p>
            <p className="font-medium">{fb.category} — from {fb.user?.username || 'Anonymous'}</p>
            <p className="mt-1">{fb.message}</p>
          </div>
        ))
      )}
    </div>
  )
}

export default AdminFeedback
