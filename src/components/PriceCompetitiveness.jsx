// src/components/PriceCompetitiveness.jsx
import React, { useEffect, useState } from 'react';
import { fetchPriceCompetitiveness } from '../requests';
import { useParams } from 'react-router-dom';

export default function PriceCompetitiveness({item}) {
  const { id } = useParams(); // listing ID
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompetitiveness();
  }, [id]);

  const loadCompetitiveness = async () => {
    setLoading(true);
    try {
      const res = await fetchPriceCompetitiveness(item.id);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load price competitiveness:', err);
    }
    setLoading(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Checking price…</p>;
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-6">
      <h3 className="font-semibold mb-2">Price Competitiveness</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Your Price</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">${data.your_price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Avg Price</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${parseFloat(data.avg_price_for_similar || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Min Price</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${parseFloat(data.min_price_for_similar || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Max Price</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${parseFloat(data.max_price_for_similar || 0).toFixed(2)}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm">
          Price Score:{' '}
          <span className="font-semibold text-green-600 dark:text-green-400">
            {data.price_score}%
          </span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          (0% = most expensive, 100% = cheapest among comparables)
        </p>
      </div>
    </div>
  );
}
