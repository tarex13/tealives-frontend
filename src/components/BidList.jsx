import React, { useEffect, useState } from 'react';
import api from '../api';

function BidList({ itemId }) {
  const [bids, setBids] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`marketplace/${itemId}/bids/`);
        setBids(res.data);
      } catch (err) {
        console.error('Failed to load bids:', err);
      }
    };
    load();
  }, [itemId]);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold">Bids Received</h2>
      {bids.length === 0 ? (
        <p className="text-gray-500">No bids yet.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {bids.map(bid => (
            <li key={bid.id} className="border p-3 rounded">
              <p><strong>Amount:</strong> ${bid.amount}</p>
              <p><strong>Bidder:</strong> @{bid.bidder_username}</p>
              <p><strong>Message:</strong> {bid.message || '—'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BidList;
