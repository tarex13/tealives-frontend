// src/pages/MyListings.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyListings,
  bulkUpdateListings,
  pauseResumeListing,
  deleteListing,
  toggleFeatured,
  setRelistReminder,
  updateListing,
  relistListing,
} from '../requests';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  ClockIcon,
  TagIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import RelistReminderModal from '../components/RelistReminderModal';
import MyBadges from './MyBadges';
import PriceCompetitiveness from '../components/PriceCompetitiveness';

export default function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkEditorVisible, setBulkEditorVisible] = useState(false);
  const [bulkFields, setBulkFields] = useState({
    price: '',
    category: '',
    is_paused: null,
    is_archived: null,
    quantity: '',
  });
  const [errors, setErrors] = useState({});

  // Smart Filters & Search
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Inline edit state
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');


  const handleRelist = async (e) => {
    e.stopPropagation();
    setOpen(false);
    try {
      await relistListing(id);
      if (onRelisted) onRelisted();
    } catch {
      alert('Failed to relist.');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadListings();
  }, [user]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const res = await fetchMyListings();
      setListings(res.data.results);
    } catch (err) {
      console.error('Failed to load my listings:', err);
    }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const validateBulkFields = () => {
    const newErrors = {};
    const hasPrice = bulkFields.price.trim() !== '';
    const hasCategory = bulkFields.category !== '';
    const hasPaused = bulkFields.is_paused !== null;
    const hasArchived = bulkFields.is_archived !== null;
    const hasQuantity = bulkFields.quantity.trim() !== '';

    if (!hasPrice && !hasCategory && !hasPaused && !hasArchived && !hasQuantity) {
      newErrors.general = 'Please provide at least one field to update.';
    }
    if (hasPrice) {
      const p = Number(bulkFields.price);
      if (isNaN(p) || p < 0) newErrors.price = 'Enter a valid non-negative number.';
    }
    if (hasQuantity) {
      const q = Number(bulkFields.quantity);
      if (!Number.isInteger(q) || q < 0) newErrors.quantity = 'Enter a valid non-negative integer.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBulkUpdate = async () => {
    if (selected.size === 0) return;
    if (!validateBulkFields()) return;
    const payload = {
      listing_ids: Array.from(selected),
      price: bulkFields.price.trim() !== '' ? bulkFields.price : undefined,
      category: bulkFields.category || undefined,
      is_paused: bulkFields.is_paused === null ? undefined : bulkFields.is_paused,
      is_archived: bulkFields.is_archived === null ? undefined : bulkFields.is_archived,
      quantity: bulkFields.quantity.trim() !== '' ? bulkFields.quantity : undefined,
    };
    try {
      await bulkUpdateListings(payload);
      setSelected(new Set());
      setBulkEditorVisible(false);
      setBulkFields({ price: '', category: '', is_paused: null, is_archived: null, quantity: '' });
      setErrors({});
      loadListings();
    } catch (err) {
      console.error('Bulk update failed:', err);
      if (err.response?.data) {
        alert(`Bulk update failed: ${JSON.stringify(err.response.data, null, 2)}`);
      } else {
        alert('Bulk update failed.');
      }
    }
  };

  const handlePauseResume = async (id, currentlyPaused) => {
    try {
      await pauseResumeListing(id, currentlyPaused ? 'resume' : 'pause');
      loadListings();
    } catch (err) {
      console.error('Pause/Resume failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      await deleteListing(id);
      loadListings();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await toggleFeatured(id);
      loadListings();
    } catch (err) {
      console.error('Toggle featured failed:', err);
    }
  };

  const handleRelistReminder = async (id) => {
    const daysRaw = window.prompt('Remind me in how many days?', '30');
    const days = parseInt(daysRaw, 10);
    if (!days || days <= 0) return alert('Enter a valid positive number.');
    try {
      await setRelistReminder(id, days);
      alert(`Reminder set in ${days} days.`);
    } catch (err) {
      console.error('Set relist reminder failed:', err);
    }
  };

  const filteredAndSorted = () => {
    let arr = [...listings];
    if (filterStatus) arr = arr.filter((it) => it.status === filterStatus);
    if (filterCategory) arr = arr.filter((it) => it.category === filterCategory);
    if (filterTag) arr = arr.filter((it) => Array.isArray(it.tags) && it.tags.includes(filterTag));
    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      arr = arr.filter(
        (it) =>
          it.title.toLowerCase().includes(lower) ||
          (it.description && it.description.toLowerCase().includes(lower))
      );
    }
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views_count - a.views_count;
        case 'price':
          return a.price - b.price;
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    return arr;
  };

  const startEditingPrice = (id, currentPrice) => {
    setEditingPriceId(id);
    setTempPrice(String(currentPrice));
  };

  const savePrice = async (id) => {
    const newP = Number(tempPrice);
    if (isNaN(newP) || newP < 0) {
      alert('Enter a valid non-negative number.');
      return;
    }
    const formData = new FormData();
    formData.append('price', tempPrice);
    try {
      await updateListing(id, formData);
      setEditingPriceId(null);
      setTempPrice('');
      loadListings();
    } catch (err) {
      console.error('Inline price update failed:', err);
      alert('Failed to update price.');
    }
  };

  const startEditingTitle = (id, currentTitle) => {
    setEditingTitleId(id);
    setTempTitle(currentTitle);
  };

  const saveTitle = async (id) => {
    if (!tempTitle.trim()) {
      alert('Title cannot be empty.');
      return;
    }
    const formData = new FormData();
    formData.append('title', tempTitle);
    try {
      await updateListing(id, formData);
      setEditingTitleId(null);
      setTempTitle('');
      loadListings();
    } catch (err) {
      console.error('Inline title update failed:', err);
      alert('Failed to update title.');
    }
  };

  if (!user)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-6">
        Please log in to view your listings.
      </p>
    );
  if (loading)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-6">
        Loading my listings…
      </p>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-12">
      {/* Section: My Badges */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          My Badges
        </h2>
        <MyBadges />
      </section>

      {/* Section: Filters & Bulk Editor */}
      <section>
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
            My Listings Filters
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <input
              type="text"
              placeholder="Search title/description…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="furniture">Furniture</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="sports">Sports & Outdoors</option>
              <option value="toys">Toys & Games</option>
              <option value="beauty">Beauty & Personal Care</option>
              <option value="automotive">Automotive</option>
              <option value="home_garden">Home & Garden</option>
              <option value="collectibles">Collectibles</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Filter by tag"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="views">Views</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        {/* Bulk Editor Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            My Listings
          </h2>
          <button
            onClick={() => {
              setBulkEditorVisible((v) => !v);
              setErrors({});
            }}
            className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            {bulkEditorVisible ? 'Hide Bulk Editor' : 'Bulk Edit'}
          </button>
        </div>

        {/* Bulk Editor */}
        {bulkEditorVisible && (
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
              Bulk Edit Selected ({selected.size})
            </h3>

            {errors.general && (
              <p className="text-red-600 dark:text-red-400 mb-2">
                {errors.general}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* PRICE */}
              <div className="col-span-1">
                <input
                  type="text"
                  placeholder="Price"
                  value={bulkFields.price}
                  onChange={(e) => {
                    setBulkFields({ ...bulkFields, price: e.target.value });
                    setErrors((prev) => ({ ...prev, price: undefined }));
                  }}
                  className={`w-full border ${
                    errors.price
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.price && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.price}
                  </p>
                )}
              </div>

              {/* CATEGORY */}
              <select
                value={bulkFields.category}
                onChange={(e) =>
                  setBulkFields({ ...bulkFields, category: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Category (no change)</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="toys">Toys & Games</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="automotive">Automotive</option>
                <option value="home_garden">Home & Garden</option>
                <option value="collectibles">Collectibles</option>
                <option value="other">Other</option>
              </select>

              {/* QUANTITY */}
              <div className="col-span-1">
                <input
                  type="text"
                  placeholder="Quantity"
                  value={bulkFields.quantity}
                  onChange={(e) => {
                    setBulkFields({ ...bulkFields, quantity: e.target.value });
                    setErrors((prev) => ({ ...prev, quantity: undefined }));
                  }}
                  className={`w-full border ${
                    errors.quantity
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.quantity && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.quantity}
                  </p>
                )}
              </div>

              {/* IS_PAUSED */}
              <select
                value={
                  bulkFields.is_paused === null
                    ? ''
                    : bulkFields.is_paused
                    ? '1'
                    : '0'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setBulkFields({
                    ...bulkFields,
                    is_paused: val === '' ? null : val === '1',
                  });
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pause (no change)</option>
                <option value="1">Pause</option>
                <option value="0">Resume</option>
              </select>

              {/* IS_ARCHIVED */}
              <select
                value={
                  bulkFields.is_archived === null
                    ? ''
                    : bulkFields.is_archived
                    ? '1'
                    : '0'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setBulkFields({
                    ...bulkFields,
                    is_archived: val === '' ? null : val === '1',
                  });
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Archive (no change)</option>
                <option value="1">Archive</option>
                <option value="0">Unarchive</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleBulkUpdate}
                disabled={selected.size === 0}
                className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
              >
                Apply Changes
              </button>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSorted().map((item) => (
            <div
              key={item.id}
              className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 flex flex-col transition-transform hover:scale-105 ${
                selected.has(item.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                className="absolute top-3 left-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />

              {/* Thumbnail */}
              <div className="h-40 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-600">
                    No Image
                  </div>
                )}
              </div>

              {/* Title / Inline Edit */}
              <div className="flex items-center mb-1">
                {editingTitleId === item.id ? (
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle(item.id);
                    }}
                    autoFocus
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate flex-1">
                      {item.title}
                    </h3>
                    <button
                      onClick={() => startEditingTitle(item.id, item.title)}
                      className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Price / Inline Edit */}
              <div className="flex items-center mb-2">
                {editingPriceId === item.id ? (
                  <input
                    type="text"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') savePrice(item.id);
                    }}
                    autoFocus
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-24 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <>
                    <p className="text-blue-600 font-bold">${item.price}</p>
                    <button
                      onClick={() => startEditingPrice(item.id, item.price)}
                      className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Category */}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <TagIcon className="h-5 w-5 mr-1" />
                <span className="truncate">{item.category.replace('_', ' ')}</span>
              </div>

              {/* Status & Counts */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'available'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : item.status === 'sold'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.views_count} views ·{' '}
                  {item.is_bidding ? `${item.bids_count} bids` : 'No bids'}
                </span>
              </div>

              {/* Last Edited */}
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Last edited{' '}
                {formatDistanceToNow(new Date(item.last_edited), {
                  addSuffix: true,
                })}
              </p>

              {/* Action Buttons */}
              {item.status === 'sold' ? 
              
              (<div className="mt-auto flex flex-wrap gap-2">
                <Link
                  to={`/marketplace/${item.id}/edit`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </Link>

                  <button
                    onClick={handleRelist}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                  >
                    Relist Item
                  </button>
                
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
                </div>) : 
                (<div className="mt-auto flex flex-wrap gap-2">
                <Link
                  to={`/marketplace/${item.id}/edit`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </Link>

                <button
                  onClick={() => handlePauseResume(item.id, item.is_paused)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  {item.is_paused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>

                {/*<button
                  onClick={() => handleToggleFeatured(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
                >
                  <StarIcon className="h-4 w-4" />
                  {item.is_featured ? 'Unfeature' : 'Feature'}
                </button> someday*/}

                <button
                  onClick={() => handleRelistReminder(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                >
                  <ClockIcon className="h-4 w-4" />
                  Remind Me
                </button>
              </div>)}
      <PriceCompetitiveness item={item} />
            </div>
          ))}
        </div>
      </section>
      <RelistReminderModal />
    </div>
                
              
  );
}
