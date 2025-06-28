// src/pages/CreateListing.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  createListing,
  updateListing,
  fetchListingDetail,
} from '../requests';
import { useNotification } from '../context/NotificationContext';
import MediaManager from '../components/MediaManager';
import ImageEditorModal from '../components/ImageEditorModal';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext'

const CATEGORY_CHOICES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'home_garden', label: 'Home & Garden' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'other', label: 'Other' },
];

const TAG_CHOICES = [
  { value: 'bogo', label: 'BOGO (Buy One, Get One)' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'new_arrival', label: 'New Arrival' },
  { value: 'on_sale', label: 'On Sale' },
  { value: 'limited_time', label: 'Limited Time' },
  { value: 'featured', label: 'Featured' },
  { value: 'free_shipping', label: 'Free Shipping' },
];

const DELIVERY_CHOICES = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'dropoff', label: 'Drop-off' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'meetup', label: 'Meet in Public' },
];

const CONDITION_CHOICES = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'fair', label: 'Fair' },
];

export default function CreateListing({ isEdit = false }) {
  const { cities, city: City } = useCity();
  const { id: paramId } = useParams();
  const { user } = useAuth()
  const listingId = paramId ? parseInt(paramId, 10) : null;
  const navigate = useNavigate();

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('electronics');
  const [city, setCity] = useState(cities.length > 0 ? cities[0] : '');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('used');
  const [startingBid, setStartingBid] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [tags, setTags] = useState([]); // array of string codes
  
  const { showNotification }   = useNotification();
  // Media manager state
  const [mediaFiles, setMediaFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  useEffect(() => setCity(City), []);
  // ─── Prefill on “edit” ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    if (!listingId) {
      setErrorMessage('Invalid listing ID.');
      return;
    }

    let canceled = false;
    setLoading(true);

    fetchListingDetail(listingId)
      .then((data) => {
        if (canceled) return;
        
        // Basic fields
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPrice(data.price != null ? data.price.toString() : '');
        setCategory(data.category || 'electronics');
        setCity(data.city || (cities.length > 0 ? cities[0] : ''));
        setQuantity(data.quantity != null ? data.quantity : 1);
        setCondition(data.condition || 'used');
        setExpiryDate(data.expiry_date || '');
        setStartingBid(
          data.starting_bid != null ? data.starting_bid.toString() : ''
        );
        setBuyNowPrice(
          data.buy_now_price != null ? data.buy_now_price.toString() : ''
        );
        setDeliveryOption(data.delivery_options || 'pickup');
        setDeliveryNote(data.delivery_note || '');

        // Tags
        if (Array.isArray(data.tags)) {
          setTags(data.tags.map((t) => (typeof t === 'string' ? t : t.code)));
        }

        // Existing media: store URL in preview, leave file null
        if (Array.isArray(data.images)) {
          const existingMedia = data.images.map((img) => ({
            id: img.id,
            file: null,
            url: img.file, // <— explicitly give a preview URL
            editedFile: null,
            caption: img.caption || '',
            status: 'existing',
            hash: null,
          }));
          setMediaFiles(existingMedia);
        }

        setLoading(false);
      })
      .catch((err) => {
        if (canceled) return;
        console.error(err);
        setErrorMessage('Failed to load listing data.');
        setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [isEdit, listingId]);

  const handleTagToggle = (tagValue) => {
    setTags((prev) =>
      prev.includes(tagValue)
        ? prev.filter((t) => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    // Enforce at least one media file
    if (mediaFiles.length === 0) {
      setErrorMessage('Please upload at least one image or video.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('city', city);
      formData.append('quantity', quantity);
      formData.append('condition', condition);

      if (startingBid) {
        formData.append('starting_bid', startingBid);
        formData.append('is_bidding', 'true');
      } else {
        formData.append('is_bidding', 'false');
      }

      if (buyNowPrice) {
        formData.append('buy_now_price', buyNowPrice);
      }

      if (expiryDate) {
        formData.append('expiry_date', expiryDate);
      }

      formData.append('delivery_options', deliveryOption);
      if (deliveryNote) {
        formData.append('delivery_note', deliveryNote);
      }

      tags.forEach((tag) => {
        formData.append('tags', tag);
      });

      // Append media files: skip “existing” unless edited
      mediaFiles.forEach((f) => {
        if (f.status === 'existing') {
          return;
        }
        const uploadFile = f.editedFile || f.file;
        formData.append('images', uploadFile, uploadFile.name);
        if (f.caption) {
          formData.append('captions', f.caption);
        }
      });

      if (isEdit && listingId) {
        await updateListing(listingId, formData);
        navigate(`/marketplace/${listingId}`);
      } else {
        const res = await createListing(formData);
        const newId = res.data.id;
        navigate(`/marketplace/${newId}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Unable to save listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          Loading listing…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">
          {isEdit ? 'Edit Listing' : 'Create New Listing'}
        </h1>

        {errorMessage && (
          <div className="mb-6 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Title & Price ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                    $
                  </span>
                </div>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.1"
                  min="0"
                  required
                  className="block w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* ── Category & City ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {CATEGORY_CHOICES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                City
              </label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Description ── */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* ── Tags (Checkboxes) ── */}
          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TAG_CHOICES.map((opt) => (
                <label
                  key={opt.value}
                  className="inline-flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={tags.includes(opt.value)}
                    onChange={() => handleTagToggle(opt.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Delivery Options & Note ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="deliveryOption"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Delivery Option
              </label>
              <select
                id="deliveryOption"
                value={deliveryOption}
                onChange={(e) => setDeliveryOption(e.target.value)}
                className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {DELIVERY_CHOICES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="deliveryNote"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Delivery Note (optional)
              </label>
              <textarea
                id="deliveryNote"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                rows={2}
                className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* ── Quantity & Condition ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                min="1"
                required
                className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Condition
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {CONDITION_CHOICES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Starting Bid & Buy Now Price ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startingBid"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Starting Bid (optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                    $
                  </span>
                </div>
                <input
                  id="startingBid"
                  type="number"
                  value={startingBid}
                  onChange={(e) => setStartingBid(e.target.value)}
                  step="0.01"
                  min="0"
                  className="block w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                If set, listing becomes a bidding item.
              </p>
            </div>

            <div>
              <label
                htmlFor="buyNowPrice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Buy Now Price (optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                    $
                  </span>
                </div>
                <input
                  id="buyNowPrice"
                  type="number"
                  value={buyNowPrice}
                  onChange={(e) => setBuyNowPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  className="block w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Buyers can instantly purchase at this price.
              </p>
            </div>
          </div>

          {/* ── Expiry Date ── */}
          <div>
            <label
              htmlFor="expiryDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Expiry Date (optional)
            </label>
            <input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1 block w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              If set, listing auto‐expires on this date.
            </p>
          </div>

          {/* ── Media Uploader ── */}
          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Images / Videos
            </p>
            <MediaManager
              mediaFiles={mediaFiles}
              setMediaFiles={setMediaFiles}
              openEditor={setEditingFile}
            />
            {isEdit && mediaFiles.length === 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                No images currently attached.
              </p>
            )}
          </div>

          {/* ── Submit Button ── */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${
                submitting
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition`}
            >
              {submitting
                ? isEdit
                  ? 'Saving Changes…'
                  : 'Creating…'
                : isEdit
                ? 'Save Changes'
                : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Image Editor Modal ───────────────────────────────────────────────── */}
      {editingFile && (
        <ImageEditorModal
          fileObj={editingFile}
          onSave={(updatedFileObj) => {
            setMediaFiles((prev) =>
              prev.map((f) =>
                f.id === updatedFileObj.id ? updatedFileObj : f
              )
            );
            setEditingFile(null);
          }}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
}
