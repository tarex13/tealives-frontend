import { useState } from 'react'
import axios from 'axios'
import api from '../api'

function SwappOfferCard({ offer }) {
  const [status, setStatus] = useState(offer.status)

  const handleUpdate = async (newStatus) => {
    const user = JSON.parse(localStorage.getItem('user'))
    try {
      await api.patch(
        `${import.meta.env.VITE_API_BASE_URL}swapp/offer/${offer.id}/`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${user.access}` },
        }
      )
      setStatus(newStatus)
    } catch (err) {
      alert('Failed to update offer')
    }
  }

  return (
    <div className="bg-white rounded shadow p-4 mb-3">
      <h3 className="text-lg font-bold">Offer on: {offer.item?.title}</h3>
      {offer.offered_item && (
        <p className="text-sm text-gray-700">
          They’re offering: <strong>{offer.offered_item.title}</strong>
        </p>
      )}
      {offer.cash_difference > 0 && (
        <p className="text-sm text-gray-700">
          Plus <strong>${offer.cash_difference}</strong>
        </p>
      )}
      {offer.message && (
        <p className="text-sm italic text-gray-500">“{offer.message}”</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Status: <strong className="capitalize">{status}</strong>
      </p>

      {status === 'pending' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleUpdate('accepted')}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={() => handleUpdate('declined')}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Decline
          </button>
          <button
            onClick={() => handleUpdate('countered')}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            Counter
          </button>
        </div>
      )}
    </div>
  )
}

export default SwappOfferCard
