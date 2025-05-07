import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../api'
import SwappOfferCard from '../components/SwappOfferCard'

function MySwapps() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOffers = async () => {
      const user = JSON.parse(localStorage.getItem('user'))
      try {
        const res = await api.get(`${import.meta.env.VITE_API_BASE_URL}swapp/offer/`, {
          headers: { Authorization: `Bearer ${user.access}` },
        })
        setOffers(res.data)
      } catch (err) {
        console.error('Failed to load Swapp offers', err)
      } finally {
        setLoading(false)
      }
    }

    loadOffers()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Swapp Offers</h1>
      {loading ? (
        <p>Loading...</p>
      ) : offers.length === 0 ? (
        <p>No swapp offers yet.</p>
      ) : (
        offers.map((offer) => (
          <SwappOfferCard key={offer.id} offer={offer} />
        ))
      )}
    </div>
  )
}

export default MySwapps
