import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import React from 'react'

function EditProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    bio: '',
    city: '',
    profile_image: null
  })

  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('user/profile/')
        setForm({ ...res.data, profile_image: null }) // Keep file input blank
      } catch (err) {
        console.error('Error loading profile')
      }
    }

    load()
  }, [])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'profile_image') {
      setForm({ ...form, profile_image: files[0] })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('bio', form.bio)
      formData.append('city', form.city)
      if (form.profile_image) {
        formData.append('profile_image', form.profile_image)
      }

      await api.put('user/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setSuccess(true)
    } catch {
      alert('Update failed')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Your Profile</h1>
      {success && <p className="text-green-600">Profile updated!</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="City"
          className="w-full border p-2 rounded"
        />
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Bio"
          className="w-full border p-2 rounded"
        />
        <input
          type="file"
          name="profile_image"
          accept="image/*"
          onChange={handleChange}
          className="w-full"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </form>
    </div>
  )
}

export default EditProfile
