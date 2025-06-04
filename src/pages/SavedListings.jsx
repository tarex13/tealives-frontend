// src/pages/SavedListings.jsx
import React, { useEffect, useState } from 'react';
import { fetchSavedListings, toggleSaveListing } from '../requests';
import { useAuth } from '../context/AuthContext';
import MarketplaceCard from './MarketplaceCard';
import { useNavigate } from 'react-router-dom';

export default function SavedListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSaved = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSavedListings();
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (err) {
      console.error('Failed to load saved listings:', err);
      setError('Could not load saved items.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, [user]);

  const handleUnsave = async (itemId) => {
    try {
      await toggleSaveListing(itemId);
      // Remove it locally
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      console.error('Error unsaving item:', err);
      alert('Could not remove saved item.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-gray-700 dark:text-gray-300">
        You must be logged in to view saved listings.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Saved Listings
      </h1>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading…
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-200 text-red-700 dark:text-red-800 p-4 rounded">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          You haven’t saved any listings yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <MarketplaceCard item={item} />
              {/* Unsave overlay on hover */}
              <button
                onClick={() => handleUnsave(item.id)}
                className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                title="Unsave"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
