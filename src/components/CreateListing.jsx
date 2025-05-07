import { useState } from 'react'
import axios from 'axios'
import { useCity } from '../context/CityContext'
import { useAuth } from '../context/AuthContext'

import api from '../api'

function CreateListing({ onListingCreated }) {
  const { city } = useCity()
  const { user } = useAuth()

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    is_swappable: false,
    image: null,
    delivery_options: 'pickup', 
    delivery_note: '',         
    swapp_wishlist: '',
  })

  const [loading, setLoading] = useState(false)

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) data.append(key, value)
    })
    data.append('city', city)

    try {
      const res = await api.post(
        `${import.meta.env.VITE_API_BASE_URL}marketplace/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user.access}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (onListingCreated) onListingCreated(res.data)
      setForm({
        title: '',
        description: '',
        price: '',
        category: '',
        is_swappable: false,
        image: null,
        delivery_options: 'pickup',
        delivery_note: '',
      })
    } catch (err) {
      console.error('Failed to create listing', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Create New Listing</h2>

      <input
        type="text"
        placeholder="Title"
        value={form.title}
        onChange={(e) => updateForm('title', e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => updateForm('description', e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />

      <input
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={(e) => updateForm('price', e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />

      <input
        type="text"
        placeholder="Category (e.g. electronics, books)"
        value={form.category}
        onChange={(e) => updateForm('category', e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <label className="block mb-3">
        <input
          type="checkbox"
          checked={form.is_swappable}
          onChange={(e) => updateForm('is_swappable', e.target.checked)}
          className="mr-2"
        />
        Swappable?
      </label>
      {form.is_swappable && (
  <label className="block mb-3">
    Wishlist (what would you swap for?)
    <input
      type="text"
      value={form.swapp_wishlist}
      onChange={(e) => updateForm('swapp_wishlist', e.target.value)}
      placeholder="e.g. headphones, books, plants"
      className="w-full border p-2 rounded mt-1"
    />
  </label>
)}
      <label className="block mb-3">
        Delivery Option
        <select
          value={form.delivery_options}
          onChange={(e) => updateForm('delivery_options', e.target.value)}
          className="w-full border p-2 rounded mt-1"
        >
          <option value="pickup">Local Pickup</option>
          <option value="dropoff">Drop-off Available</option>
          <option value="shipping">Shipping</option>
          <option value="meetup">Meet in Public</option>
        </select>
      </label>

      <label className="block mb-3">
        Delivery Notes (optional)
        <textarea
          value={form.delivery_note}
          onChange={(e) => updateForm('delivery_note', e.target.value)}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block mb-4">
        Upload Image
        <input
          type="file"
          onChange={(e) => updateForm('image', e.target.files[0])}
          className="mt-1"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Posting...' : 'Post Listing'}
      </button>
    </form>
  )
}

export default CreateListing
