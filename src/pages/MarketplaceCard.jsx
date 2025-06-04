// src/components/MarketplaceCard.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleSaveListing } from '../requests';
import MarketplaceCarousel from '../components/MarketplaceCarousel';
import ListingActionMenu from '../components/ListingActionMenu';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function MarketplaceCard({ item, onHide }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(item.is_saved || false);

  // 1) Determine “outbid” status:
  //    – Only if item.is_bidding && user has a bid (item.my_bid) 
  //      and item.highest_bid > item.my_bid → “You’ve been outbid!”
  const hasPlacedBid = Boolean(item.my_bid); // assume backend gives my_bid
  const isOutbid =
    item.is_bidding &&
    hasPlacedBid &&
    Number(item.highest_bid) > Number(item.my_bid);

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      navigate('/user/auth/');
      return;
    }
    try {
      const res = await toggleSaveListing(item.id);
      setIsSaved(res.data.status === 'saved');
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  // Clicking anywhere except buttons should go to detail
  const handleCardClick = () => {
    navigate(`/marketplace/${item.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition flex flex-col h-full overflow-hidden cursor-pointer"
    >
      {/* ─── TOP: Carousel & Action Buttons ──────────────────────────────────── */}
      <div className="relative">
        {/* Save/Unsave Button (top-right) */}
        <button
          onClick={handleToggleSave}
          className="absolute top-2 right-10 z-10 text-2xl"
          title={isSaved ? 'Unsave' : 'Save'}
          aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
        >
          {isSaved ? '💖' : '🤍'}
        </button>

        {/* Listing Action Menu (three-dot) */}
        <div className="absolute top-2 right-2 z-10">
          <ListingActionMenu
            item={item}
            onEdited={() => {}}
            onDeleted={() => {}}
            onSold={() => {}}
            onRelisted={() => {}}
            onHide={onHide} 
          />
        </div>

        {/* Carousel or Placeholder */}
        {Array.isArray(item.images) && item.images.length > 0 ? (
          <MarketplaceCarousel media={item.images} />
        ) : (
          <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No Image
          </div>
        )}

        {/* ─── “Outbid” Banner (only if isOutbid) ───────────────────────────── */}
        {isOutbid && (
          <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
            You’ve been outbid!
          </div>
        )}
      </div>

      {/* ─── MIDDLE: Details ─────────────────────────────────────────────────── */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title (clickable) */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
          <Link
            to={`/marketplace/${item.id}`}
            className="hover:text-blue-600 transition"
            onClick={(e) => e.stopPropagation()}
          >
            {item.title}
          </Link>
        </h3>

        {/* Category & Status */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 uppercase">
            {item.category.replace('_', ' ')}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              item.status === 'available'
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        </div>

        {/* Seller Username & City */}
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-2 space-x-2">
          <span>Seller:</span>
          <Link
            to={`/profile/${item.seller.username}`}
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            @{item.seller_username}
          </Link>
          <span className="text-gray-400 dark:text-gray-500">·</span>
          <span className="capitalize">{item.city}</span>
        </div>

        {/* Short Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
          {item.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.map((tag) => (
              <span
                key={tag.id}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded"
              >
                {tag.name.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Price / Bidding / Delivery Info */}
        <div className="mt-auto space-y-1">
          {item.is_bidding ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Start Bid:</span>
                <span className="font-medium">${item.starting_bid}</span>
              </div>
              {item.buy_now_price && Number(item.buy_now_price) > 0 && (
                <div className="flex justify-between">
                  <span>Buy Now:</span>
                  <span className="font-medium">${item.buy_now_price}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Current Bid:</span>
                <span className="font-medium">
                  {item.highest_bid ? `$${item.highest_bid}` : 'No bids'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xl font-semibold text-green-700 dark:text-green-400">
              ${item.price}
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>
              Delivery:{' '}
              <span className="capitalize">
                {item.delivery_options.replace('_', ' ')}
              </span>
            </span>
            <span>
              Edited{' '}
              {formatDistanceToNow(parseISO(item.last_edited), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ─── FOOTER: View Details Button ─────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/marketplace/${item.id}`);
          }}
          className="text-sm bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
