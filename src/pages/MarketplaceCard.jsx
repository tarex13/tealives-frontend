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
    <div className="bg-white dark:bg-gray-800 rounded shadow mb-3 relative" style={{ boxShadow: "4px 2px 2px rgba(17, 17, 26, 0.05), 0px 0px 8px rgb(17 17 26 / 52%)" }}>
      {Array.isArray(item.images) && item.images.length > 0 && (
        <Link to={`/marketplace/${item.id}`}>
        <MarketplaceCarousel media={item.images} price={item.price} />
        </Link>
      )}

      <button
        onClick={toggleSave}
        className="absolute top-2 right-2 text-xl"
        title={isSaved ? 'Unsave' : 'Save'}
        aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
      >
        {isSaved ? '💖' : '🤍'}
      </button>

      <div className="flex-1" style={{ display: 'flex', padding: '2vw', color: 'whitesmoke' }}>
        <div style={{ width: '50%' }}>
          <strong>Seller:</strong> <Link to={`/profile/${item.seller}`}>@{item.seller_username}</Link>

          <p className="text-sm mt-2">
            <strong>Delivery:</strong> {item.delivery_options?.replace('_', ' ') ?? 'Not specified'}
          </p>

          {item.delivery_note && (
            <p className="text-gray-500"><label>Note: </label><label className='text-s italic'>{item.delivery_note}</label></p>
          )}

          {/* 👇 Bidding Info */}
          {item.is_bidding ? (
            <>
              <p className="text-sm">
                <strong>Starting Bid:</strong> ${item.starting_bid}
              </p>
              {item.buy_now_price && (
                <p className="text-sm">
                  <strong>Buy Now:</strong> ${item.buy_now_price}
                </p>
              )}
              <p className="text-sm">
                <strong>Current Bid:</strong> {item.highest_bid ? `$${item.highest_bid}` : 'No bids yet'}
              </p>

              {user?.user?.id !== item.seller && (
                <button
                  onClick={() => navigate(`/marketplace/${item.id}/bid`)}
                  className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  Place a Bid
                </button>
              )}
            </>
          ) : (
            <p className="text-lg font-bold text-green-600">${item.price}</p>
          )}

          {item.is_swappable && (
            <button
              onClick={() => setShowSwapp(true)}
              className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded"
            >
              Propose Swapp
            </button>
          )}

          {user?.user?.id !== item.seller && (
            <button
              onClick={() => navigate(`/inbox?to=${item.seller}`)}
              className="mt-2 text-xs bg-gray-700 text-white px-3 py-1 rounded"
            >
              Message Seller
            </button>
          )}
        </div>

        <div style={{ width: '50%' }}>
        <Link to={`/marketplace/${item.id}`}>
          <p className="text-lg font-bold">{item.title}</p>
        </Link>
          <label className="text-sm text-gray-500">
            {item.description?.slice(0, 100) ?? 'No description'}...
          </label>
        </div>
      </div>

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
