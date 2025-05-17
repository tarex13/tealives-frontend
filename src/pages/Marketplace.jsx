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
        const filtered = results.filter(item => item.status === 'available');
        setListings(filtered);
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [city, filters]);

  const handleFilterChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Marketplace ({city})</h1>
        {user && (
          <Link
            to="/marketplace/create"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            + New Listing
          </Link>
        )}
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={handleFilterChange('search')}
          className="border p-2 rounded w-full sm:w-auto"
        />

        <select
          value={filters.category}
          onChange={handleFilterChange('category')}
          className="border p-2 rounded"
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
          className="border p-2 rounded w-24"
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.max_price}
          onChange={handleFilterChange('max_price')}
          className="border p-2 rounded w-24"
        />

        <select
          value={filters.sort}
          onChange={handleFilterChange('sort')}
          className="border p-2 rounded"
        >
          <option value="newest">🆕 Newest</option>
          <option value="oldest">📅 Oldest</option>
          <option value="price_low_high">💰 Price: Low to High</option>
          <option value="price_high_low">💰 Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">No items available in your area.</p>
      ) : (
        listings.map((item) => <MarketplaceCard key={item.id} item={item} />)
      )}
    </div>
  );
}

export default Marketplace;
