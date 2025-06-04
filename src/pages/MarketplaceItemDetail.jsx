// src/pages/MarketplaceItemDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchMarketplaceItemDetail,
  toggleSaveListing,
  getOrCreateConversation,
} from '../requests';
import { useAuth } from '../context/AuthContext';
import BidForm from '../components/BidForm';
import BidList from '../components/BidList';
import MarketplaceCarousel from '../components/MarketplaceCarousel';
import MarketplaceCard from './MarketplaceCard'; // we’ll still use its style for similar cards
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function MarketplaceItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('details');

  // Fetch item detail
  const loadItem = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMarketplaceItemDetail(id);
      const data = res.data || res;
      setItem(data);
      setIsSaved(data.is_saved || false);
    } catch (err) {
      console.error('Error loading item:', err);
      setError('Item not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
    setTab('details');
  }, [id]);

  // Toggle save/un-save
  const handleToggleSave = async () => {
    if (!user) {
      navigate('/user/auth/');
      return;
    }
    try {
      const res = await toggleSaveListing(item.id);
      setIsSaved(res.data.status === 'saved');
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  };

  // Message Seller
  const handleMessageSeller = async () => {
    if (!user) {
      navigate('/user/auth/');
      return;
    }
    try {
      const res = await getOrCreateConversation(item.id);
      const convoId = res.data.conversation_id;
      navigate(`/inbox?conversation=${convoId}&to=${item.seller.id}`);
    } catch (err) {
      console.error('Conversation error:', err);
      alert('Could not open chat with seller.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }
  if (error || !item) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-red-600 dark:text-red-400">
        {error || 'Item not found.'}
      </div>
    );
  }

  const isSeller = user?.user?.id === item.seller;
  const isBuyer = user?.user?.id === item.buyer_id;
  const sold = item.status === 'sold';
  const hasBids = item.is_bidding;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg space-y-6">
      {/* ── Title & Save Button ───────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {item.title}
        </h1>
        <button
          onClick={handleToggleSave}
          className="text-2xl focus:outline-none"
          title={isSaved ? 'Unsave' : 'Save'}
        >
          {isSaved ? '💖' : '🤍'}
        </button>
      </div>

      {/* ── Image Carousel ────────────────────────────────────────────────────── */}
      {Array.isArray(item.images) && item.images.length > 0 ? (
        <MarketplaceCarousel media={item.images} />
      ) : (
        <div className="h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No images available
        </div>
      )}

      {/* ── Category / Status / Seller / City / Last Edited ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div className="flex flex-wrap items-center space-x-3">
          <span className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {item.category.replace('_', ' ')}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold ${
              sold
                ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
            }`}
          >
            {sold
              ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
              : 'Available'}
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center space-x-2">
          <span>
            Seller:
            <Link
              to={`/profile/${item.seller_username}`}
              className="ml-1 text-blue-600 hover:underline"
            >
              @{item.seller_username}
            </Link>
          </span>
          <span className="text-gray-400 dark:text-gray-500">·</span>
          <span className="capitalize">{item.city}</span>
          <span className="text-gray-400 dark:text-gray-500">·</span>
          <span>
            Last Edited{' '}
            <span className="font-medium">
              {formatDistanceToNow(parseISO(item.last_edited), {
                addSuffix: true,
              })}
            </span>
          </span>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab('details')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              tab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          {hasBids && !isSeller && !sold && (
            <button
              onClick={() => setTab('bid')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                tab === 'bid'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              Place a Bid
            </button>
          )}
          {hasBids && isSeller && (
            <button
              onClick={() => setTab('bids')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                tab === 'bids'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              View Bids
            </button>
          )}
        </nav>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────────── */}
      {tab === 'details' && (
        <div className="space-y-6">
          <div className="text-gray-700 dark:text-gray-200">
            <p className="mb-4">{item.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p>
                  <strong>Price: </strong>${item.price}
                </p>
                {item.is_bidding && (
                  <>
                    <p>
                      <strong>Starting Bid: </strong>${item.starting_bid}
                    </p>
                    {Number(item.buy_now_price) > 0 && (
                      <p>
                        <strong>Buy Now: </strong>${item.buy_now_price}
                      </p>
                    )}
                    <p>
                      <strong>Current Bid: </strong>
                      {item.highest_bid ? `$${item.highest_bid}` : 'No bids yet'}
                    </p>
                  </>
                )}
              </div>
              <div>
                <p>
                  <strong>Condition: </strong>
                  {item.condition}
                </p>
                <p>
                  <strong>Delivery: </strong>
                  {item.delivery_options.replace('_', ' ')}
                </p>
                {item.delivery_note && (
                  <p>
                    <strong>Note: </strong>
                    {item.delivery_note}
                  </p>
                )}
                <p>
                  <strong>Views: </strong>
                  {item.views_count}
                </p>
              </div>
            </div>
          </div>

          {!sold && user && user.user?.id !== item.seller && (
            <div>
              <button
                onClick={handleMessageSeller}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Message Seller
              </button>
            </div>
          )}

          {sold && isSeller && (
            <div className="text-green-700 dark:text-green-300 font-semibold">
              Sold to @{item.buyer_username} on{' '}
              {new Date(item.sold_at).toLocaleDateString()}
            </div>
          )}
          {sold && isBuyer && (
            <div className="text-green-700 dark:text-green-300 font-semibold">
              You purchased this item on{' '}
              {new Date(item.sold_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {tab === 'bid' && !isSeller && !sold && (
        <BidForm
          itemId={item.id}
          currentHighestBid={item.highest_bid}
          onBidSuccess={loadItem}
          startBid={item.starting_bid}
        />
      )}

      {tab === 'bids' && isSeller && (
        <BidList itemId={item.id} onActionSuccess={loadItem} />
      )}

      {/* ── Similar Items “Peek” Carousel ───────────────────────────────────────── */}
      {Array.isArray(item.similar_items) && item.similar_items.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Similar Items
          </h2>

          {/* Horizontal scroll container */}
          <div
            className="
              flex 
              overflow-x-auto 
              space-x-4 
              -mx-4 
              px-4 
              pb-2 
              scrollbar-thin 
              scrollbar-thumb-gray-300 scrollbar-track-gray-100 
              dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-800
            "
          >
            {item.similar_items.map((sim) => (
              <Link
                key={sim.id}
                to={`/marketplace/${sim.id}`}
                className="
                  flex-shrink-0 
                  w-48 md:w-56 lg:w-64 
                  bg-white dark:bg-gray-800 
                  rounded-lg 
                  shadow-md hover:shadow-xl 
                  transform hover:scale-105 
                  transition duration-150
                "
              >
                <div className="w-full h-32 md:h-40 lg:h-48 relative overflow-hidden rounded-t-lg">
                  {sim.thumbnail ? (
                    <img
                      src={sim.thumbnail}
                      alt={sim.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        No Image
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {sim.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    ${sim.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
