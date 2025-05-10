// MySwappsPage.js
import React, { useEffect, useState } from 'react';
import api from '../api';

function MySwappsPage() {
  const [offers, setOffers] = useState({ sent: [], received: [] });

  useEffect(() => {
    const loadOffers = async () => {
      const res = await api.get('swapp/my-offers/');
      setOffers(res.data);
    };
    loadOffers();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`swapp/offer/${id}/action/`, { action });
      alert(`Offer ${action}ed!`);
      const updated = await api.get('swapp/my-offers/');
      setOffers(updated.data);
    } catch (err) {
      alert('Failed to perform action.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Swapp Offers</h1>

      <h2 className="text-xl font-semibold mb-2">📤 Sent Offers</h2>
      {offers.sent.map((offer) => (
        <div key={offer.id} className="border p-2 rounded mb-2">
          <p><strong>Item:</strong> {offer.item}</p>
          <p><strong>Status:</strong> {offer.status}</p>
          <p><strong>Message:</strong> {offer.message}</p>
        </div>
      ))}

      <h2 className="text-xl font-semibold mt-6 mb-2">📥 Received Offers</h2>
      {offers.received.map((offer) => (
        <div key={offer.id} className="border p-2 rounded mb-2">
          <p><strong>Item:</strong> {offer.item}</p>
          <p><strong>From:</strong> {offer.offered_by}</p>
          <p><strong>Cash Difference:</strong> ${offer.cash_difference}</p>
          <p><strong>Message:</strong> {offer.message}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleAction(offer.id, 'accept')}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Accept
            </button>
            <button
              onClick={() => handleAction(offer.id, 'decline')}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MySwappsPage;
