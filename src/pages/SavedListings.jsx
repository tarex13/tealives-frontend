import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import MarketplaceCard from './MarketplaceCard'

function SavedListings() {
  const [items, setItems] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const res = await api.get(`${import.meta.env.VITE_API_BASE_URL}marketplace/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      })
      const saved = res.data.filter((item) => item.is_saved)
      setItems(saved)
    }

    load()
  }, [user])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Saved Listings</h1>
      {items.length === 0 ? (
        <p>You haven’t saved any items yet.</p>
      ) : (
        items.map((item) => <MarketplaceCard key={item.id} item={item} />)
      )}
    </div>
  )
}

export default SavedListings
