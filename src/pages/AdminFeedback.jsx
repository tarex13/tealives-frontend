import React, { useEffect, useState } from 'react';
import api from '../api';

function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const feedbackCategories = ['Bug', 'Feature Request', 'General', 'Other']; // Adjust based on your backend categories

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (category) params.append('category', category);
    return params.toString();
  };

  const loadFeedback = async (url = 'feedback/admin/') => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams();
      const finalUrl = url.includes('?') ? `${url}&${queryParams}` : `${url}?${queryParams}`;

      const res = await api.get(finalUrl);
      const data = res.data;

      const feedbackData = Array.isArray(data.results) ? data.results : data;
      setFeedback(feedbackData);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (err) {
      console.error('Failed to load feedback', err);
      setError('Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    loadFeedback('feedback/admin/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Feedback Submissions</h1>

      {/* Search and Filter */}
      <div className="flex flex-wrap mb-4 space-x-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback..."
          className="flex-1 p-2 border rounded mr-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border rounded mr-2"
        >
          <option value="">All Categories</option>
          {feedbackCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button 
          onClick={handleSearch} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {feedback.length === 0 ? (
        <p className="text-gray-500">No feedback found.</p>
      ) : (
        feedback.map((fb, index) => (
          <div
            key={fb.id || `feedback-${index}`} // Safe fallback using index
            className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-3"
          >
            <p className="text-sm text-gray-500">
              {new Date(fb.created_at).toLocaleString()}
            </p>
            <p className="font-medium">
              {fb.type} — from {fb?.username || 'Anonymous'}
            </p>
            <p className="mt-1">{fb.content}</p>
          </div>
        ))
        
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => loadFeedback(prevPage)}
          disabled={!prevPage}
          className={`px-4 py-2 rounded ${prevPage ? 'bg-gray-300 hover:bg-gray-400' : 'bg-gray-200 cursor-not-allowed'}`}
        >
          Previous
        </button>
        <button
          onClick={() => loadFeedback(nextPage)}
          disabled={!nextPage}
          className={`px-4 py-2 rounded ${nextPage ? 'bg-gray-300 hover:bg-gray-400' : 'bg-gray-200 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminFeedback;
