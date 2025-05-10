import React, { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import MarketplaceCard from './MarketplaceCard'

function SavedListings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('marketplace/?saved=true')

        const listings = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : []

        console.log('Loaded saved listings:', listings)
        setItems(listings)
      } catch (err) {
        console.error('Failed to load saved listings:', err)
        setError('Could not load saved listings.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Saved Listings</h1>

      {loading ? (
        <p className="text-gray-500">Loading saved listings...</p>
      ) : error ? (
        <div className="text-red-600 bg-red-100 p-3 rounded">{error}</div>
      ) : items.length === 0 ? (
        <p className="text-gray-600">You haven't saved any listings yet.</p>
      ) : (
        items.map((item) => <MarketplaceCard key={item.id} item={item} />)
      )}
    </div>
  )
}

export default SavedListings
