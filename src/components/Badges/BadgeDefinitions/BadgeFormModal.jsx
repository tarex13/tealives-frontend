// src/components/Badges/BadgeDefinitions/BadgeFormModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../Modal';

export default function BadgeFormModal({ isOpen, onClose, onSubmit, initialData }) {
  // initialData: null for create, or existing badge object for edit
  const [name, setName] = useState('');
  const [code, setCode] = useState(''); // if you have code separate from name
  const [description, setDescription] = useState('');
  const [badgeType, setBadgeType] = useState('user');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setDescription(initialData.description || '');
      setBadgeType(initialData.badge_type || 'user');
      setImageFile(null);
      setImagePreview(initialData.icon_url || null);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setBadgeType('user');
      setImageFile(null);
      setImagePreview(null);
    }
  }, [initialData, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate fields
    if (!name.trim()) {
      alert('Name is required'); // or useNotification
      return;
    }
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('code', code.trim());
    formData.append('description', description.trim());
    formData.append('badge_type', badgeType);
    if (imageFile) {
      formData.append('icon', imageFile);
    }
    onSubmit(formData, !!initialData, initialData?.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showtop={false} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {initialData ? 'Edit Badge' : 'Create Badge'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer dark:hover:text-gray-200"
          >
           X
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name *
            </label>
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Code (unique) *
            </label>
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={!!initialData} // if code is immutable after create
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              rows={3}
              className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Badge Type *
            </label>
            <select
              className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={badgeType}
              onChange={(e) => setBadgeType(e.target.value)}
            >
              <option value="user">User Badge</option>
              <option value="seller">Seller Badge</option>
              <option value="mod">Mod Badge</option>
              <option value="business">Business Badge</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image (optional)
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Badge preview"
                  className="w-20 h-20 rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">📷</span>
                </div>
              )}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  {imageFile ? 'Change' : 'Upload'} Image
                </button>
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(initialData?.image_url || null);
                    }}
                    className="mt-1 px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                  >
                    Remove
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG, GIF. Max size 2MB.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
          >
            {initialData ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
