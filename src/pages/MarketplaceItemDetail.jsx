import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import BidForm from '../components/BidForm';
import BidList from '../components/BidList';
import MarketplaceCarousel from '../components/MarketplaceCarousel';
import RateUserModal from '../components/RateUserModal';

function MarketplaceItemDetail() {
  
  const [showRating, setShowRating] = useState(false);
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [tab, setTab] = useState('details');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`marketplace/${id}/`);
        setItem(response.data);
      } catch (err) {
        console.error('Failed to fetch item:', err);
        navigate('/marketplace');
      }
    };

    fetchItem();
  }, [id, navigate]);

  const markAsSold = async () => {
    const confirmed = window.confirm("Are you sure you want to mark this item as sold?");
    if (!confirmed) return;
  
    try {
      await api.patch(`marketplace/${item.id}/`, { status: 'sold' });
      setItem(prev => ({ ...prev, status: 'sold' }));
      alert('Item marked as sold.');
    } catch (err) {
      console.error('Failed to mark as sold:', err);
      alert('Could not update item status.');
    }
  };


  if (!item) return <div className="text-center py-8">Loading item...</div>;

  const isSeller = user?.user?.id === item.seller;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 bg-white dark:bg-gray-800 shadow rounded">
      <h1 className="text-2xl font-bold mb-2">{item.title}</h1>

      {item.images && <MarketplaceCarousel media={item.images} />}

      {/* Tabs */}
      <div className="flex gap-4 my-4 border-b">
        <button onClick={() => setTab('details')} className={tab === 'details' ? 'font-bold' : ''}>Details</button>
        {isSeller && <button onClick={() => setTab('bids')} className={tab === 'bids' ? 'font-bold' : ''}>Bids</button>}
        {!isSeller && user && <button onClick={() => setTab('bid')} className={tab === 'bid' ? 'font-bold' : ''}>Place a Bid</button>}
      </div>

      {/* Tab Content */}
      {tab === 'details' && (
        <div>
          <p className="text-gray-600 mb-2">{item.description}</p>
          <p><strong>Price:</strong> ${item.price}</p>
          <p><strong>Condition:</strong> {item.condition}</p>
          <p><strong>Delivery:</strong> {item.delivery_options}</p>
          <p><strong>Views:</strong> {item.views_count}</p>
          {item.delivery_note && <p><strong>Note:</strong> {item.delivery_note}</p>}
        </div>
      )}

      {tab === 'bid' && !isSeller && <BidForm itemId={item.id} />}

      {tab === 'bids' && isSeller && <BidList itemId={item.id} />}

      {isSeller && item.status === 'sold' && (
  <button onClick={() => setShowRating(true)} className="text-sm text-blue-600 mt-2">
    Rate Buyer
  </button>
)}

{isSeller && item.status === 'sold' && (
  <>
    <button
      onClick={() => setShowRating(true)}
      className="mt-4 bg-yellow-500 text-white px-3 py-1 rounded"
    >
      Rate Buyer
    </button>
    {showRating && (
      <RateUserModal
        buyerId={item.buyer_id}
        onClose={() => setShowRating(false)}
      />
    )}
  </>
)}
{user?.user?.id === item.buyer_id && item.status === 'sold' && (
  <>
    <button
      onClick={() => setShowRating(true)}
      className="mt-4 bg-green-600 text-white px-3 py-1 rounded"
    >
      Rate Seller
    </button>
    {showRating && (
      <RateUserModal
        buyerId={item.seller}  // reuse same modal
        onClose={() => setShowRating(false)}
      />
    )}
  </>
)}

    </div>
  );
}

export default MarketplaceItemDetail;
