import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SwappModal from '../components/SwappModal';
import MarketplaceCarousel from '../components/MarketplaceCarousel';

function MarketplaceCard({ item }) {
  const [showSwapp, setShowSwapp] = useState(false);
  const [isSaved, setIsSaved] = useState(item?.is_saved || false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleSave = async () => {
    if (!user) {
      navigate('/user/auth/');
      return;
    }
    try {
      const res = await api.post(`marketplace/${item.id}/save/`, {});
      setIsSaved(res.data.status === 'saved');
    } catch (err) {
      console.error('Failed to toggle save', err);
    }
  };

  if (!item) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow relative flex flex-col h-full overflow-hidden">

      {/* Save Button */}
      <button
        onClick={toggleSave}
        className="absolute top-2 right-2 text-xl z-10"
        title={isSaved ? 'Unsave' : 'Save'}
        aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
      >
        {isSaved ? '💖' : '🤍'}
      </button>

      {/* Media Carousel */}
      {Array.isArray(item.images) && item.images.length > 0 && (
          <MarketplaceCarousel media={item.images} price={item.price} />
      )}

      {/* Title and Description */}
      <div className="px-4 pt-3">
        <Link to={`/marketplace/${item.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {item.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {item.description?.slice(0, 100) || 'No description'}...
        </p>
      </div>

      {/* Seller and Delivery Info */}
      <div className="px-4 pt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
        <div>
          <strong>Seller:</strong>{' '}
          <Link to={`/profile/${item.seller}`} className="text-blue-600">
            @{item.seller_username}
          </Link>
        </div>
        <div>
          <strong>Delivery:</strong>{' '}
          {item.delivery_options?.replace('_', ' ') ?? 'N/A'}
        </div>
        {item.delivery_note && (
          <div className="italic text-gray-500">{item.delivery_note}</div>
        )}
      </div>

      {/* Pricing or Bidding */}
<div className="px-4 py-2">
  {item.is_bidding ? (
    <div className="border border-grey-300 dark:border-grey-300 rounded-md p-3 space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-700 dark:text-gray-300 font-medium">Starting Bid:</span>
        <span className="text-gray-900 dark:text-white">${item.starting_bid}</span>
      </div>

      {item.buy_now_price && (
        <div className="flex justify-between">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Buy Now:</span>
          <span className="text-gray-900 dark:text-white">${item.buy_now_price}</span>
        </div>
      )}

      <div className="flex justify-between">
        <span className="text-gray-700 dark:text-gray-300 font-medium">Current Bid:</span>
        <span className="text-gray-900 dark:text-white">
          {item.highest_bid ? `$${item.highest_bid}` : 'No bids yet'}
        </span>
      </div>

      {user?.id !== item.seller && (
        <div className="pt-2 text-right">
          <button
            onClick={() => navigate(`/marketplace/${item.id}/bid`)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Place a Bid
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="text-xl font-semibold text-green-700 dark:text-green-400">
      ${item.price}
    </div>
  )}
</div>


      {/* Action Buttons: Swapp + Message */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {item.is_swappable && (
          <button
            onClick={() => setShowSwapp(true)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
          >
            Propose Swapp
          </button>
        )}

        {user?.id !== item.seller && (
          <button
            onClick={() => navigate(`/inbox?to=${item.seller}`)}
            className="text-xs bg-gray-700 text-white px-3 py-1 rounded"
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
  );
}

export default MarketplaceCard;
