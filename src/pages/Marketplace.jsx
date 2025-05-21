import React, { useEffect, useState } from 'react';
import { fetchMarketplace } from '../requests';
import MarketplaceCard from './MarketplaceCard';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { Link } from 'react-router-dom';

function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    min_price: '',
    max_price: '',
    search: '',
    sort: 'newest',
  });

  const { user } = useAuth();
  const { city } = useCity();

  useEffect(() => {
    const load = async () => {
      if (!city) return;
      setLoading(true);
      try {
        const response = await fetchMarketplace(city, filters);
        const results = Array.isArray(response.results) ? response.results : [];
        setListings(results.filter(item => item.status === 'available'));
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [city, filters]);

  const handleFilterChange = (field) => (e) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketplace ({city})</h1>
        {user && (
          <Link
            to="/marketplace/create"
            className="mt-2 sm:mt-0 bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition"
          >
            + New Listing
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={handleFilterChange('search')}
          className="flex-1 min-w-[150px] border p-2 rounded"
        />

        <select
          value={filters.category}
          onChange={handleFilterChange('category')}
          className="border p-2 rounded min-w-[140px]"
        >
          <option value="">All Categories</option>
          <option value="Electronics">📱 Electronics</option>
          <option value="Clothing">👕 Clothing</option>
          <option value="Furniture">🛋️ Furniture</option>
          <option value="Books">📚 Books</option>
          <option value="Toys">🧸 Toys</option>
          <option value="Other">🎁 Other</option>
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={filters.min_price}
          onChange={handleFilterChange('min_price')}
          className="border p-2 rounded w-28"
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.max_price}
          onChange={handleFilterChange('max_price')}
          className="border p-2 rounded w-28"
        />

        <select
          value={filters.sort}
          onChange={handleFilterChange('sort')}
          className="border p-2 rounded min-w-[150px]"
        >
          <option value="newest">🆕 Newest</option>
          <option value="oldest">📅 Oldest</option>
          <option value="price_low_high">💰 Price: Low to High</option>
          <option value="price_high_low">💰 Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500 text-center">No items available in your area.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((item) => (
            <MarketplaceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Marketplace;
