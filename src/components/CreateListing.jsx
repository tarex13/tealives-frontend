import React, { useState } from 'react';
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
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPreview, setCurrentPreview] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
    if (form.price <= 0) return setError('Price must be greater than 0.');

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('category', form.category);
    formData.append('delivery_options', form.delivery_option);
    formData.append('delivery_note', form.delivery_note);
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
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">Create a New Listing</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows="4"
          placeholder="Description"
          className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          required
        />

        <input
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          type="number"
          className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          required
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          {CATEGORY_OPTIONS.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <select
          name="delivery_option"
          value={form.delivery_option}
          onChange={handleChange}
          className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          {DELIVERY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <textarea
          name="delivery_note"
          value={form.delivery_note}
          onChange={handleChange}
          placeholder="Optional delivery note..."
          rows="2"
          className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
        />

        <label className="block w-full p-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
          <span>Click or drag files</span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

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

            <div className="flex flex-wrap justify-center gap-2">
              {form.previews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={preview}
                    alt="Thumb"
                    className={`w-20 h-20 object-cover border-2 rounded cursor-pointer ${
                      currentPreview === idx ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => setCurrentPreview(idx)}
                  />
                  <button
                    onClick={() => removeFile(idx)}
                    type="button"
                    className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full p-1"
                  >✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {submitting && (
          <div className="mt-4 space-y-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-dashed rounded-full animate-spin mx-auto"></div>
            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
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
