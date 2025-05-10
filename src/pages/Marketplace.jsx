import React, { useEffect, useState } from 'react'
import { fetchMarketplace } from '../requests'
import MarketplaceCard from './MarketplaceCard'
import { useAuth } from '../context/AuthContext'
import { useCity } from '../context/CityContext'
import { Link } from 'react-router-dom'

function Marketplace() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { city } = useCity()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetchMarketplace(city)
        const list = Array.isArray(res.results) ? res.results : []
        const filtered = list.filter(item => item.status === 'available')
        setListings(filtered)
      } catch (err) {
        console.error('Failed to load listings:', err)
      } finally {
        setLoading(false)
      }
    }
  
    if (city) {
      load()
    }
  }, [city])
  

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Marketplace ({city})</h1>
        {user && (
          <Link
            to="/marketplace/create"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            + New Listing
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">No items available in your area.</p>
      ) : (
        listings.map((item) => <MarketplaceCard key={item.id} item={item} />)
      )}
    </div>
  )
}

export default Marketplace
