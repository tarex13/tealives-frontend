import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import api from '../api'

function SwappModal({ targetItem, onClose }) {
  const { user } = useAuth()
  const [myItems, setMyItems] = useState([])
  const [offerItem, setOfferItem] = useState(null)
  const [cashDiff, setCashDiff] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadMyItems = async () => {
      const res = await api.get(`${import.meta.env.VITE_API_BASE_URL}marketplace/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      })
      const owned = res.data.filter(i => i.seller === user.user.id && i.is_swappable)
      setMyItems(owned)
    }

    loadMyItems()
  }, [])

  // Basic keyword-based match
  const matched = targetItem.swapp_wishlist
    ?.toLowerCase()
    .split(',')
    .map((w) => w.trim())

  const getMatchScore = (title) =>
    matched?.reduce((score, tag) => (title.toLowerCase().includes(tag) ? score + 1 : score), 0) || 0

  const sortedItems = myItems.sort((a, b) =>
    getMatchScore(b.title) - getMatchScore(a.title)
  )

  const submitOffer = async () => {
    try {
      const res = await api.post(
        `${import.meta.env.VITE_API_BASE_URL}swapp/offer/`,
        {
          item: targetItem.id,
          offered_item: offerItem,
          cash_difference: cashDiff,
          message,
        },
        {
          headers: { Authorization: `Bearer ${user.access}` },
        }
      )
      alert('Offer sent!')
      onClose()
    } catch (err) {
      console.error('Failed to submit offer', err)
      alert('Error sending offer.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded shadow max-w-lg w-full">
        <h2 className="text-lg font-bold mb-2">Propose Swapp</h2>
        <p className="mb-4">
          You’re offering to trade for: <strong>{targetItem.title}</strong>
        </p>

        <label className="block mb-2 font-semibold">Choose one of your items:</label>
        <select
          value={offerItem || ''}
          onChange={(e) => setOfferItem(e.target.value)}
          className="w-full mb-4 border p-2 rounded"
        >
          <option value="">-- Select an item --</option>
          {sortedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} {getMatchScore(item.title) > 0 && '💡'}
            </option>
          ))}
        </select>

        <label className="block mb-2">Add Cash Difference (optional):</label>
        <input
          type="number"
          value={cashDiff}
          onChange={(e) => setCashDiff(e.target.value)}
          className="w-full mb-4 border p-2 rounded"
        />

        <label className="block mb-2">Message (optional):</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full mb-4 border p-2 rounded"
        />

        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={submitOffer}
            disabled={!offerItem}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send Offer
          </button>
        </div>
      </div>
    </div>
  )
}

export default SwappModal
