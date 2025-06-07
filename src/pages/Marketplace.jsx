// src/pages/Marketplace.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { fetchMarketplace, fetchTags } from '../requests';
import MarketplaceCard from './MarketplaceCard';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';

const CATEGORY_OPTIONS = [
  { label: '📱 Electronics',   value: 'electronics'  },
  { label: '👕 Clothing',      value: 'clothing'     },
  { label: '🛋️ Furniture',     value: 'furniture'    },
  { label: '📚 Books',         value: 'books'        },
  { label: '🧸 Toys',          value: 'toys'         },
  { label: '🏠 Home & Garden',  value: 'home_garden'  },
  { label: '🚗 Automotive',     value: 'automotive'   },
  { label: '💄 Beauty',        value: 'beauty'       },
  { label: '🎁 Other',         value: 'other'        },
];

function groupByDate(items) {
  return items.reduce((acc, item) => {
    const d = parseISO(item.created_at || item.last_edited || item.created);
    const day = isToday(d)
      ? 'Today'
      : isYesterday(d)
      ? 'Yesterday'
      : d.toLocaleDateString();
    (acc[day] ||= []).push(item);
    return acc;
  }, {});
}

export default function Marketplace() {
  const { user } = useAuth();
  const { city } = useCity();

  // ── Filters (unchanged) ──
  const [filters, setFilters] = useState({
    category: '',
    tags: '',
    min_price: '',
    max_price: '',
    search: '',
    sort: 'newest',
  });

  // ── Fetched listings and pagination ──
  const [listings, setListings]       = useState([]);
  const [nextPage, setNextPage]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Tag options ──
  const [tagsOptions, setTagsOptions]     = useState([]);
  const [popularTags, setPopularTags]     = useState([]);

  // ── NEW: Keep track of which listing IDs have been “hidden” in localStorage ──
  const [hiddenIds, setHiddenIds] = useState(() => {
    // On first render, try to read localStorage.getItem('hiddenListings')
    try {
      const raw = localStorage.getItem('hiddenListings');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });

  // ── Whenever `hiddenIds` changes, sync back to localStorage ──
  useEffect(() => {
    localStorage.setItem('hiddenListings', JSON.stringify(hiddenIds));
  }, [hiddenIds]);

  // ── Handler passed down to MarketplaceCard → ListingActionMenu. 
  //     When invoked, it adds the given ID to `hiddenIds`. ──
  const handleHide = (listingId) => {
    // If it’s already hidden, do nothing
    if (hiddenIds.includes(listingId)) return;
    setHiddenIds((prev) => [...prev, listingId]);
  };

  // ── 1. Load tag options on mount ──
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetchTags();
        const data = Array.isArray(res.data?.results) ? res.data.results : [];
        setTagsOptions(data);
        setPopularTags([...data].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Failed to load tags:', err);
        setTagsOptions([]);
        setPopularTags([]);
      }
    };
    loadTags();
  }, []);

  // ── 2. Fetch first page whenever city or filters change ──
  const loadListings = useCallback(async () => {
    if (!city) {
      setListings([]);
      setNextPage(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchMarketplace(city, filters);
      const payload = res?.data ?? res;
      const results = Array.isArray(payload.results)
        ? payload.results
        : Array.isArray(payload)
        ? payload
        : [];

      // Filter out any items whose id is in hiddenIds
      const visible = results.filter((item) => !hiddenIds.includes(item.id));

      setListings(visible);
      setNextPage(payload.next ?? null);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setListings([]);
      setNextPage(null);
    } finally {
      setLoading(false);
    }
  }, [city, filters, hiddenIds]); // add hiddenIds to dependency array

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // ── 3. Load more pages when “Load More” is clicked ──
  const loadMore = async () => {
    if (!nextPage) return;
    setLoadingMore(true);
    try {
      const res = await fetchMarketplace(null, null, nextPage);
      const payload = res?.data ?? res;
      const moreResults = Array.isArray(payload.results)
        ? payload.results
        : Array.isArray(payload)
        ? payload
        : [];

      // Again, filter out any we’ve hidden
      const visibleMore = moreResults.filter((item) => !hiddenIds.includes(item.id));

      setListings((prev) => [...prev, ...visibleMore]);
      setNextPage(payload.next ?? null);
    } catch (err) {
      console.error('Failed to load more listings:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── 4. Filter & tag handlers (unchanged) ──
  const handleFilterChange = (field) => (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tagName) => {
    setFilters((prev) => {
      const existing = prev.tags ? prev.tags.split(',').map((t) => t.trim()) : [];
      let updated;
      if (existing.includes(tagName)) {
        updated = existing.filter((t) => t !== tagName);
      } else {
        updated = [...existing, tagName];
      }
      return { ...prev, tags: updated.filter((t) => t).join(',') };
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ─── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-3xl font-bold">
          Marketplace {city && <span className="text-lg font-medium text-gray-600 dark:text-gray-400">— {city}</span>}
        </h1>
        <div className="flex flex-wrap gap-2">
          {user && (
            <>
              <Link
                to="/mylistings"
                className="
                  inline-block
                  border-2
                  border-black
                  bg-transparent
                  dark:bg-gray-800
                  dark:text-gray-300
                  dark:border-none
                  px-5 py-2.5
                  rounded-lg
                  hover:bg-indigo-50
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300
                  transition-colors duration-200
                "
              >
                My Listings
              </Link>

              <Link
                to="/marketplace/create"
                className="
                  inline-block
                  border-2
                  border-green-600
                  text-green-600
                  px-5 py-2.5
                  rounded-lg
                  bg-transparent
                  hover:bg-green-50
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300
                  transition-colors duration-200
                "
              >
                + New Listing
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ─── Filters + Tag Cloud ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={handleFilterChange('search')}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />

          <select
            value={filters.category}
            onChange={handleFilterChange('category')}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={handleFilterChange('sort')}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">🆕 Newest</option>
            <option value="oldest">📅 Oldest</option>
            <option value="price_low_high">💰 Price: Low → High</option>
            <option value="price_high_low">💰 Price: High → Low</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <input
            type="number"
            placeholder="Min Price"
            value={filters.min_price}
            onChange={handleFilterChange('min_price')}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full sm:w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.max_price}
            onChange={handleFilterChange('max_price')}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full sm:w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ─── Multi-Tag Filter ─────────────────────────────────────────────────── */}
        <div>
          <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">Tags:</p>
          <div className="max-w-xl grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array.isArray(tagsOptions) && tagsOptions.length > 0 ? (
              tagsOptions.map((tag) => (
                <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={filters.tags.split(',').map((t) => t.trim()).includes(tag.name)}
                    onChange={() => toggleTag(tag.name)}
                  />
                  <span className="text-gray-700 dark:text-gray-200 text-sm">
                    {tag.name.replace('_', ' ')}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No tags available.</p>
            )}
          </div>
        </div>

        {/* ─── Tag Cloud ─────────────────────────────────────────────────────────── */}
        {popularTags.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Popular Tags:</p>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, tags: tag.name }));
                  }}
                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  {tag.name.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Listings Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-10">
          Loading listings...
        </p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-10">
          No items found.
        </p>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <MarketplaceCard
                key={item.id}
                item={item}
                onHide={handleHide}  // ← pass down our new onHide handler
              />
            ))}
          </div>

          {/* Load More Button */}
          {nextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
