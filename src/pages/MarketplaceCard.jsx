import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import SwappModal from '../components/SwappModal'
import { useNavigate } from 'react-router-dom'

function MarketplaceCard({ item }) {
  const [showSwapp, setShowSwapp] = useState(false)
  const [isSaved, setIsSaved] = useState(item.is_saved || false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const toggleSave = async () => {
    if (!user) return navigate('/login')
    try {
      const res = await api.post(
        `${import.meta.env.VITE_API_BASE_URL}marketplace/${item.id}/save/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.access}`,
          },
        }
      )
      setIsSaved(res.data.status === 'saved')
    } catch (err) {
      console.error('Failed to toggle save', err)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-3 flex items-start gap-4 relative">
      <img
        src={item.image}
        alt={item.title}
        className="w-24 h-24 object-cover rounded border"
      />

      {/* Save Button */}
      <button
        onClick={toggleSave}
        className="absolute top-2 right-2 text-xl"
        title={isSaved ? 'Unsave' : 'Save'}
      >
        {isSaved ? '💖' : '🤍'}
      </button>

      <div className="flex-1">
        <h3 className="text-lg font-bold">{item.title}</h3>
        <p className="text-sm text-gray-500">{item.description.slice(0, 100)}...</p>
        <p className="text-sm font-semibold mt-1">${item.price}</p>
        <p className="text-sm mt-2">
  <strong>Delivery:</strong> {item.delivery_options.replace('_', ' ')}
</p>
{item.delivery_note && (
  <p className="text-xs italic text-gray-500">{item.delivery_note}</p>
)}
        {item.is_swappable && (
          <button
            onClick={() => setShowSwapp(true)}
            className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded"
          >
            Propose Swapp
          </button>
        )}

        {user?.user?.id !== item.seller_id && (
          <button
            onClick={() => navigate(`/inbox?to=${item.seller_id}`)}
            className="mt-2 ml-2 text-xs bg-purple-600 text-white px-3 py-1 rounded"
          >
            Message Seller
          </button>
        )}
      </div>

      {showSwapp && (
        <SwappModal
          targetItem={item}
          onClose={() => setShowSwapp(false)}
        />
      )}
    </div>
  )
}

export default MarketplaceCard
