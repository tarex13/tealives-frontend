// src/components/MarkSoldModal.jsx
import React, { useState, useEffect } from 'react';
import { fetchListingConversations, markItemSold, fetchUserByUsername } from '../requests'; // :contentReference[oaicite:0]{index=0}
import RateUserModal from './RateUserModal'; // :contentReference[oaicite:1]{index=1}

export default function MarkSoldModal({ itemId, onClose, onSoldComplete }) {
  const [conversations, setConversations] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationBuyer, setSelectedConversationBuyer] = useState(null);
  const [manualUsername, setManualUsername] = useState('');
  const [manualBuyer, setManualBuyer] = useState(null);
  const [isOffMarket, setIsOffMarket] = useState(false);

  const [ratingOpen, setRatingOpen] = useState(false);
  // This will hold whichever buyer object (from convo list or manual) we want to rate
  const [buyerForRating, setBuyerForRating] = useState(null);

  // ── Prevent clicks inside modal from bubbling to parent cards ──
  // We’ll attach `onClick={e => e.stopPropagation()}` in the JSX below.

  // ── 1) Fetch first page of conversations on mount ──
  useEffect(() => {
    setLoading(true);
    fetchListingConversations(itemId)
      .then((res) => {
        setConversations(res.data.results);
        setNextPageUrl(res.data.next);
      })
      .catch((err) => console.error('Conversations fetch error:', err))
      .finally(() => setLoading(false));
  }, [itemId]);

  // ── 2) Load more pages when “Load more…” is clicked ──
  const loadMore = () => {
    if (!nextPageUrl) return;
    setLoading(true);
    fetch(nextPageUrl, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setConversations((prev) => [...prev, ...data.results]);
        setNextPageUrl(data.next);
      })
      .catch((err) => console.error('Pagination error:', err))
      .finally(() => setLoading(false));
  };

  // ── 3) Filter conversation buyers by username prefix ──
  const filtered = conversations.filter((c) =>
    c.buyer.username.toLowerCase().startsWith(searchTerm.toLowerCase())
  );


  // ── 4) Handle “Mark as Sold” click ──
  const handleSubmit = async () => {
    let chosenUsername = null;
    let chosenBuyerObj = null;
    if (selectedConversationBuyer) {
      // Seller clicked a user from the convo list
      chosenUsername = selectedConversationBuyer.username;
      chosenBuyerObj = selectedConversationBuyer;
    } else if (manualUsername.trim()) {
      // Seller typed a username: fetch that user
      try {
       const userObj = await fetchUserByUsername(manualUsername.trim());
        chosenBuyerObj = userObj;
        chosenUsername = userObj.username;
      } catch (err) {
        alert(err.response?.data?.error || 'That username was not found.');
        return;
      }
    } else if (isOffMarket) {
      // Sold off‐market: no buyer
      chosenUsername = null;
    } else {
      // Nothing chosen → do nothing
      return;
    }
    try {
      await markItemSold(itemId, chosenUsername);
      console.log(chosenUsername);
      if (chosenUsername) {
        // Only open rating if we have a real buyer object
        setBuyerForRating(chosenBuyerObj);
        setRatingOpen(true);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Mark sold failed:', err);
      alert(err.response?.data?.error || 'Failed to mark as sold.');
    }
  };

  return (
    // Outermost wrapper: clicking anywhere here (backdrop or content) does NOT bubble up
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Mark Item as Sold</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the buyer from your conversation list, or leave blank if sold off-market.
        </p>

        {/* ── Off-market toggle ── */}
        <div className="flex items-center space-x-2">
          <input
            id="offMarket"
            type="checkbox"
            checked={isOffMarket}
            onChange={() => {
              setIsOffMarket((prev) => !prev);
              setSelectedConversationBuyer(null);
              setManualUsername('');
              setManualBuyer(null);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="offMarket" className="text-sm">
            Sold outside marketplace (no buyer)
          </label>
        </div>

        {!isOffMarket && (
          <>
            {/* ── Search box ── */}
            <input
              type="text"
              placeholder="Filter by username…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedConversationBuyer(null);
              }}
              className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />

            {/* ── Conversation participants list ── */}
            <div className="max-h-48 overflow-auto border rounded">
              {loading && (
                <p className="p-2 text-gray-500 dark:text-gray-400">Loading…</p>
              )}

              {!loading && filtered.length === 0 && (
                <p className="p-2 text-gray-500 dark:text-gray-400">
                  No matches. You can type a username below.
                </p>
              )}

              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedConversationBuyer(c.buyer);
                    setManualUsername('');
                    setManualBuyer(null);
                  }}
                  className={`w-full flex items-center space-x-2 px-4 py-2 text-left ${
                    selectedConversationBuyer?.id === c.buyer.id
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {c.buyer.profile_image_url ? (
                    <img
                      src={c.buyer.profile_image_url}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {c.buyer.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {c.buyer.username}
                  </span>
                </button>
              ))}

              {nextPageUrl && (
                <button
                  onClick={loadMore}
                  className="w-full py-2 text-center text-blue-600 hover:underline"
                >
                  Load more…
                </button>
              )}
            </div>

            {/* ── Manual username entry ── */}
            <div className="pt-2 space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Or type an exact username if not listed above:
              </p>
              <input
                type="text"
                placeholder="Enter username…"
                value={manualUsername}
                onChange={(e) => {
                  setManualUsername(e.target.value);
                  setSelectedConversationBuyer(null);
                  setManualBuyer(null);
                }}
                className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </>
        )}

        {/* ── Action buttons ── */}
        <div className="flex justify-end space-x-2 pt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !isOffMarket &&
              !selectedConversationBuyer &&
              manualUsername.trim().length === 0
            }
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded disabled:opacity-50"
          >
            Mark as Sold
          </button>
        </div>
      </div>

      {/* ── Rating modal (if a buyer was chosen) ── */}
      {buyerForRating  && (
        <RateUserModal
          buyerId={buyerForRating.id}
          onClose={() => {
            setRatingOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
