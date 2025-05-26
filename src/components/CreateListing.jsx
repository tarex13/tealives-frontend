import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { createListing } from '../requests';

const CATEGORY_OPTIONS = [
  { label: '📱 Electronics', value: 'Electronics' },
  { label: '👕 Clothing', value: 'Clothing' },
  { label: '🛋️ Furniture', value: 'Furniture' },
  { label: '📚 Books', value: 'Books' },
  { label: '🧸 Toys', value: 'Toys' },
  { label: '🎁 Other', value: 'Other' },
];

const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Pickup (Meet in Person)' },
  { value: 'dropoff', label: 'Drop-off Available' },
  { value: 'shipping', label: 'Shipping (Buyer Pays)' },
  { value: 'meetup', label: 'Meet in Public (Safe Location)' },
];

function CreateListing() {
  const { city } = useCity();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: CATEGORY_OPTIONS[0].value,
    delivery_option: DELIVERY_OPTIONS[0].value,
    delivery_note: '',
    files: [],
    previews: [],
    is_bidding: false,
    starting_bid: '',
    bid_deadline: '',
    buy_now_price: '',
    agreed_to_terms: false,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPreview, setCurrentPreview] = useState(0);
  const errorRef = useRef(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB.`);
        return false;
      }
      if (!file.type.startsWith('image') && !file.type.startsWith('video')) {
        alert(`${file.name} is not supported.`);
        return false;
      }
      return true;
    });

    const uniqueFiles = validFiles.filter(
      file => !form.files.some(f => f.name === file.name && f.size === file.size)
    );

    const previews = uniqueFiles.map(file => URL.createObjectURL(file));

    setForm(prev => ({
      ...prev,
      files: [...prev.files, ...uniqueFiles],
      previews: [...prev.previews, ...previews],
    }));
    setCurrentPreview(form.previews.length);
  };

  const removeFile = (index) => {
    const newFiles = [...form.files];
    const newPreviews = [...form.previews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setForm(prev => ({
      ...prev,
      files: newFiles,
      previews: newPreviews,
    }));
    setCurrentPreview(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.title.length < 3) return setError('Title must be at least 3 characters.');
    if (!form.price && !form.is_bidding) return setError('Price is required unless listing is for bidding.');
    if (form.is_bidding) {
      const bid = parseFloat(form.starting_bid);
      const buyNow = parseFloat(form.buy_now_price || 0);
      if (!bid || bid <= 0) return setError('Starting bid must be greater than zero.');
      if (form.buy_now_price && buyNow <= bid) return setError('Buy Now price must be greater than the starting bid.');
      if (!form.bid_deadline) return setError('Bid deadline is required for bidding.');
    }
    if (!form.agreed_to_terms) {
      return setError('You must agree to the Terms of Use and Bidding Policy before creating a listing.');
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('price', form.price || (form.is_bidding ? form.starting_bid : 0));
    formData.append('category', form.category);
    formData.append('delivery_options', form.delivery_option);
    formData.append('delivery_note', form.delivery_note);
    formData.append('is_bidding', form.is_bidding);
    if (form.is_bidding) {
      formData.append('starting_bid', form.starting_bid);
      formData.append('bid_deadline', form.bid_deadline);
      if (form.buy_now_price) formData.append('buy_now_price', form.buy_now_price);
    }

    form.files.forEach(file => formData.append('images', file));

    try {
      await createListing(formData, progressEvent => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      setSuccess('🎉 Listing created successfully!');
      setForm({
        title: '',
        description: '',
        price: '',
        category: CATEGORY_OPTIONS[0].value,
        delivery_option: DELIVERY_OPTIONS[0].value,
        delivery_note: '',
        files: [],
        previews: [],
        is_bidding: false,
        starting_bid: '',
        bid_deadline: '',
        buy_now_price: '',
        agreed_to_terms: false,
      });
      setCurrentPreview(0);
      setTimeout(() => navigate('/marketplace'), 2000);
    } catch (err) {
      console.error(err);
      setError('Could not create listing. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return <p className="text-red-600 text-center mt-10">You must be logged in to create a listing.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">Create a New Listing</h1>

      {error && <div ref={errorRef} tabIndex="-1" aria-live="polite" className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
      {success && <div aria-live="polite" className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main fields */}
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="w-full border p-2 rounded bg-white dark:bg-gray-800" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows="4" required className="w-full border p-2 rounded bg-white dark:bg-gray-800" />
        {!form.is_bidding && (<input name="price" value={form.price} onChange={handleChange} min={0} placeholder="Price" type="number" disabled={form.is_bidding} className="w-full border p-2 rounded bg-white dark:bg-gray-800" />)}

        <select name="category" value={form.category} onChange={handleChange} className="w-full border p-2 rounded bg-white dark:bg-gray-800">
          {CATEGORY_OPTIONS.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
        </select>

        <select name="delivery_option" value={form.delivery_option} onChange={handleChange} className="w-full border p-2 rounded bg-white dark:bg-gray-800">
          {DELIVERY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>

        <textarea name="delivery_note" value={form.delivery_note} onChange={handleChange} placeholder="Optional delivery note..." rows="2" className="w-full border p-2 rounded bg-white dark:bg-gray-800" />

        {/* Bidding toggle */}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_bidding" checked={form.is_bidding} onChange={handleChange} />
          Enable Bidding for this item
        </label>

        {/* Bidding fields */}
        {form.is_bidding && (
          <div className="space-y-3">
            <input type="number" name="starting_bid" value={form.starting_bid} min={0} onChange={handleChange} placeholder="Starting Bid (required)" className="w-full border p-2 rounded" />
            <input type="datetime-local" name="bid_deadline" value={form.bid_deadline} onChange={handleChange} className="w-full border p-2 rounded" />
            <input type="number" name="buy_now_price" value={form.buy_now_price} onChange={handleChange} placeholder="Buy Now Price (optional)" className="w-full border p-2 rounded" />
          </div>
        )}

        {/* File upload */}
        <label className="block w-full p-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
          <span>Click or drag files</span>
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
        </label>

        {/* Preview UI */}
        {form.previews.length > 0 && (
          <>
            <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden">
              {form.files[currentPreview]?.type.startsWith('video') ? (
                <video src={form.previews[currentPreview]} controls className="max-h-full max-w-full" />
              ) : (
                <img src={form.previews[currentPreview]} alt="Preview" className="max-h-full max-w-full object-contain" />
              )}
              <button onClick={() => setCurrentPreview((currentPreview - 1 + form.previews.length) % form.previews.length)} type="button" className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-700 text-white px-2 py-1 rounded-full">◀</button>
              <button onClick={() => setCurrentPreview((currentPreview + 1) % form.previews.length)} type="button" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 text-white px-2 py-1 rounded-full">▶</button>
            </div>
          </>
        )}

        {/* Terms agreement */}
        <label className="flex items-start gap-2 text-sm mt-4">
          <input
            type="checkbox"
            name="agreed_to_terms"
            checked={form.agreed_to_terms}
            onChange={handleChange}
            className="mt-1"
          />
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Terms of Use</a>{' '}
            and{' '}
            <a href="/bidding-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Bidding Policy</a>.
          </span>
        </label>

        {/* Progress bar */}
        {submitting && (
          <div className="mt-4 space-y-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-dashed rounded-full animate-spin mx-auto"></div>
            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
              <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-center">{uploadProgress}%</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
    </div>
  );
}

export default CreateListing;
