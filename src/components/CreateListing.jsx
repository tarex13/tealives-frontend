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
    if (name === 'delivery_option') {
      const selected = DELIVERY_OPTIONS.find(opt => opt.value === value);
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB).`);
        return false;
      }
      if (!file.type.startsWith('image') && !file.type.startsWith('video')) {
        alert(`${file.name} is not a supported file type.`);
        return false;
      }
      return true;
    });

    const uniqueFiles = validFiles.filter(
      (file) => !form.files.some((f) => f.name === file.name && f.size === file.size)
    );

    const previews = uniqueFiles.map((file) => URL.createObjectURL(file));

    setForm((prev) => ({
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
    setForm((prev) => ({
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

    form.files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      await createListing(formData, (progressEvent) => {
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
      console.error('Failed to create listing:', err);
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
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">Create a New Listing</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <input
          type="text"
          name="title"
          placeholder="Title"
          className="w-full border p-2 rounded"
          value={form.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full border p-2 rounded"
          rows={4}
          value={form.description}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          className="w-full border p-2 rounded"
          value={form.price}
          onChange={handleChange}
          required
        />

        {/* Category Selector */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border p-2 rounded bg-white"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Delivery Options */}
        <select
          name="delivery_option"
          value={form.delivery_option}
          onChange={handleChange}
          className="w-full border p-2 rounded bg-white"
        >
          {DELIVERY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Delivery Note */}
        <textarea
          name="delivery_note"
          placeholder="Optional Delivery Note (e.g., I can meet downtown at noon)"
          className="w-full border p-2 rounded"
          rows={2}
          value={form.delivery_note}
          onChange={handleChange}
        />

        <label className="block w-full p-4 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
          <span className="text-gray-600">Click or Drag & Drop Files Here</span>
          <input
            type="file"
            name="images"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Media Preview */}
        {form.previews.length > 0 && (
          <>
            <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden flex items-center justify-center mb-4">
              {form.files[currentPreview]?.type.startsWith('video') ? (
                <video src={form.previews[currentPreview]} controls className="max-h-full max-w-full object-contain" />
              ) : (
                <img src={form.previews[currentPreview]} alt="Preview" className="max-h-full max-w-full object-contain" />
              )}
              <button
                type="button"
                onClick={() => setCurrentPreview((prev) => (prev - 1 + form.previews.length) % form.previews.length)}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => setCurrentPreview((prev) => (prev + 1) % form.previews.length)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800"
              >
                ▶
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {form.previews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={preview}
                    alt="Thumbnail"
                    className={`w-20 h-20 object-cover border-2 rounded cursor-pointer ${
                      currentPreview === idx ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => setCurrentPreview(idx)}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {submitting && (
          <div className="flex flex-col items-center space-y-2 mt-4">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-700">{uploadProgress}%</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
    </div>
  );
}

export default CreateListing;
