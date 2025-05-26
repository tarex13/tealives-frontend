import React from 'react';
import BidList from './BidList';

function BidsTab({ itemId }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
      <BidList itemId={itemId} />
    </div>
  );
}

export default BidsTab;
