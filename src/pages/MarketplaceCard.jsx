import React, { useState } from 'react';
import { useNavigate, Link, } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SwappModal from '../components/SwappModal';
import MarketplaceCarousel from '../components/MarketplaceCarousel'; // ✅ Import Carousel

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
    <div className="bg-white dark:bg-gray-800 rounded shadow mb-3 relative" style={{boxShadow: "4px 2px 2px rgba(17, 17, 26, 0.05), 0px 0px 8px rgb(17 17 26 / 52%)"}}>
      {/* ✅ Carousel for Media */}
      {Array.isArray(item.images) && item.images.length > 0 && (
        <MarketplaceCarousel media={item.images} price={item.price} />
      )}

      {/* Save Button */}
      <button
        onClick={toggleSave}
        className="absolute top-2 right-2 text-xl"
        title={isSaved ? 'Unsave' : 'Save'}
        aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
      >
        {isSaved ? '💖' : '🤍'}
      </button>

      {/* Details */}
      <div className="flex-1" style={{display: 'flex',padding: '2vw', color: 'whitesmoke'}}>
        <div style={{width: '50%', alignContent: 'space-evenly'}}>
          <strong>Seller:</strong> <Link to={`/profile/${item.seller}`}>@{item.seller_username}</Link>
          <p className="text-sm mt-2">
            <strong>Delivery:</strong> {item.delivery_options?.replace('_', ' ') ?? 'Not specified'}
          </p>
          {item.delivery_note && (
             <p className="text-gray-500"><label className=''>Note: </label><label className='text-s italic'>{item.delivery_note}</label></p>
          )}

          {/* Action Buttons */}
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
              className="mt-2 text-xs bg-gray-700 text-white px-3 py-1 rounded" style={{padding: '10px'}}
            >
              Message Seller
            </button>
          )}
        </div>
        <div style={{width: '50%'}}>
        <div className="">
          
        <p className="text-lg font-bold">{item.title}</p>
          <label className="text-sm text-gray-500">{item.description?.slice(0, 100) ?? 'No description'}...</label>
        </div>
        </div>
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
