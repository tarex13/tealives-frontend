// src/components/BidList.jsx
import React, { useEffect, useState } from 'react';
import { fetchBids, takeBidAction, markItemSold } from '../requests';
import BidItem from './BidItem';

export default function BidList({ itemId, messageBuyer, onActionSuccess }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bids on mount (and when itemId changes)
  useEffect(() => {
    const loadBids = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBids(itemId);
        // res.data may be { results: [...] } or an array
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setBids(data);
      } catch (err) {
        console.error('Failed to load bids:', err);
        setError('Could not load bids.');
      } finally {
        setLoading(false);
      }
    };
    loadBids();
  }, [itemId]);

  // Handle accept/reject
  const handleAction = async (bidId, bidderId, action) => {
    try {
      await takeBidAction(bidId, action);
      if (action === 'accept') {
        await markItemSold(itemId, bidderId);
      }
      if (typeof onActionSuccess === 'function') {
        onActionSuccess();
      }
    } catch (err) {
      console.error('Error processing bid action:', err);
      alert('Failed to update bid. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading bids…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-200 text-red-700 dark:text-red-800 p-4 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Bids Received
      </h2>
      {bids.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No bids yet for this item.</p>
      ) : (
        <ul className="space-y-4">
          {bids.map((bid) => (
            <BidItem
              messageBuyer={messageBuyer}
              key={bid.id}
              bid={bid}
              onAction={(action) => handleAction(bid.id, bid.bidder, action)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
