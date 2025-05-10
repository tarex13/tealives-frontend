import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import SwappModal from '../components/SwappModal'

function MarketplaceCard({ item }) {
  const [showSwapp, setShowSwapp] = useState(false)
  const [isSaved, setIsSaved] = useState(item?.is_saved || false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const toggleSave = async () => {
    if (!user) {
      navigate('/user/auth/')
      return
    }

    try {
      const res = await api.post(`marketplace/${item.id}/save/`, {})
      setIsSaved(res.data.status === 'saved')
    } catch (err) {
      console.error('Failed to toggle save', err)
    }
  }

  if (!item) return null // Prevents crashes if item is undefined

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-3 relative">
      {/* Media display */}
      {Array.isArray(item.images) && item.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {item.images.map((media, idx) =>
            media.is_video ? (
              <video
                key={idx}
                src={media.file}
                controls
                className="w-full rounded"
                preload="metadata"
              />
            ) : (
              <img
                key={idx}
                src={media.file}
                alt={`Media ${idx + 1}`}
                className="w-full rounded object-cover"
                loading="lazy"
              />
            )
          )}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={toggleSave}
        className="absolute top-2 right-2 text-xl"
        title={isSaved ? 'Unsave' : 'Save'}
        aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
      >
        {isSaved ? '💖' : '🤍'}
      </button>

      {/* Details */}
      <div className="flex-1">
        <h3 className="text-lg font-bold">{item.title}</h3>
        <p className="text-sm text-gray-500">
          {item.description?.slice(0, 100) ?? 'No description'}...
        </p>
        <p className="text-sm font-semibold mt-1">${item.price}</p>
        <p className="text-sm mt-2">
  <strong>Delivery:</strong> {item.delivery_options?.replace('_', ' ') ?? 'Not specified'}
</p>
        {item.delivery_note && (
          <p className="text-xs italic text-gray-500">{item.delivery_note}</p>
        )}

        {/* Action buttons */}
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
            onClick={() => navigate(`/inbox?to=${item.id}`)}
            className="mt-2 ml-2 text-xs bg-purple-600 text-white px-3 py-1 rounded"
          >
            Message Seller
          </button>
        )}
      </div>

      {/* Swapp Modal */}
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
