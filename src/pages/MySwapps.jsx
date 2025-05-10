import React, { useEffect, useState } from 'react';
import { fetchSwappOffers, takeSwappAction } from '../requests';
import SwappOfferCard from '../components/SwappOfferCard';

function MySwapps() {
  const [sentOffers, setSentOffers] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    try {
      const sent = await fetchSwappOffers('sent');
      const received = await fetchSwappOffers('received');
      setSentOffers(sent);
      setReceivedOffers(received);
    } catch (err) {
      console.error('Failed to load swapp offers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await takeSwappAction(id, action);
      loadOffers();
    } catch (err) {
      alert('Failed to perform action.');
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Swapp Offers</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-2">📤 Sent Offers</h2>
          {sentOffers.length === 0 ? (
            <p>No sent offers yet.</p>
          ) : (
            sentOffers.map((offer) => (
              <SwappOfferCard key={offer.id} offer={offer} />
            ))
          )}

          <h2 className="text-xl font-semibold mt-6 mb-2">📥 Received Offers</h2>
          {receivedOffers.length === 0 ? (
            <p>No received offers yet.</p>
          ) : (
            receivedOffers.map((offer) => (
              <div key={offer.id} className="border p-3 rounded mb-2">
                <SwappOfferCard offer={offer} />
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
            ))
          )}
        </>
      )}
    </div>
  );
}

export default MySwapps;
