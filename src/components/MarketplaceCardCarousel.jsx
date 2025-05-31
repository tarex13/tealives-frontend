import React from 'react';
import MarketplaceCard from '../pages/MarketplaceCard';

function MarketplaceCardCarousel({ items }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-bold mb-3 text-emerald-600 dark:text-emerald-300">
        🛍️ Featured Marketplace Listings
      </h2>

      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-2">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="min-w-[260px] max-w-[300px] w-full flex-shrink-0"
            >
              <MarketplaceCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MarketplaceCardCarousel;
