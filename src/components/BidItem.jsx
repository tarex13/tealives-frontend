import React from 'react';
import BidActionButtons from './BidActionButtons';

function BidItem({ bid, onAction }) {
  return (
    <div className="p-3 border rounded mb-3">
      <div className="flex justify-between items-center">
        <div>
          <p><strong>@{bid.bidder_username}</strong> offered <strong>${bid.amount}</strong></p>
          {bid.message && <p className="text-sm text-gray-500 italic">"{bid.message}"</p>}
          <p className="text-xs text-gray-400">Status: {bid.status}</p>
        </div>
        {bid.status === 'pending' && (
          <BidActionButtons bidId={bid.id} onDone={onAction} />
        )}
      </div>
    </div>
  );
}

export default BidItem;
