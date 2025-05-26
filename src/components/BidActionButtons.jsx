import React from 'react';
import { takeBidAction } from '../requests';

function BidActionButtons({ bidId, onDone }) {
  const handleAction = async (action) => {
    try {
      await takeBidAction(bidId, action);
      onDone();
    } catch (err) {
      console.error(`Failed to ${action} bid`, err);
    }
  };

  return (
    <div className="space-x-2">
      <button onClick={() => handleAction('accept')} className="bg-green-600 text-white px-2 py-1 rounded">
        Accept
      </button>
      <button onClick={() => handleAction('reject')} className="bg-red-600 text-white px-2 py-1 rounded">
        Reject
      </button>
    </div>
  );
}

export default BidActionButtons;
