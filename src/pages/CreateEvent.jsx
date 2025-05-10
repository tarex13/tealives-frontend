import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'
import api from '../api'

function CreateEvent() {
  const { city } = useCity()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    datetime: '',
    location: '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await api.post('events/', {
        ...form,
        city: city.toLowerCase(),
      })
      navigate('/events')
    } catch (err) {
      console.error(err)
      setError('Failed to create event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Event</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          placeholder="Event Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          rows={4}
          className="w-full p-2 border rounded"
        />
        <input
          type="datetime-local"
          name="datetime"
          value={form.datetime}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
  type="number"
  name="rsvp_limit"
  placeholder="Max attendees (optional)"
  value={form.rsvp_limit}
  onChange={handleChange}
/>

<label className="flex items-center space-x-2">
  <input
    type="checkbox"
    name="show_countdown"
    checked={form.show_countdown}
    onChange={(e) =>
      setForm((prev) => ({ ...prev, show_countdown: e.target.checked }))
    }
  />
  <span>Show countdown to event</span>
</label>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}

export default CreateEvent
