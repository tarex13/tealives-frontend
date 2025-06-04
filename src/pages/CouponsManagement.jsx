// src/pages/CouponsManagement.jsx
import React, { useEffect, useState } from 'react';
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCouponById,
} from '../requests';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function CouponsManagement() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    item: '',
    code: '',
    description: '',
    discount_pct: '',
    expires_at: '',
    max_uses: '',
  });

  useEffect(() => {
    if (user) loadCoupons();
  }, [user]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await listCoupons();
      setCoupons(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    }
    setLoading(false);
  };

  const openNewForm = () => {
    setEditing(null);
    setFormData({
      item: '',
      code: '',
      description: '',
      discount_pct: '',
      expires_at: '',
      max_uses: '',
    });
    setShowForm(true);
  };

  const openEditForm = (coupon) => {
    setEditing(coupon);
    setFormData({
      item: coupon.item,
      code: coupon.code,
      description: coupon.description,
      discount_pct: coupon.discount_pct,
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
      max_uses: coupon.max_uses || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCoupon(editing.id, {
          item: formData.item,
          code: formData.code,
          description: formData.description,
          discount_pct: formData.discount_pct,
          expires_at: formData.expires_at || null,
          max_uses: formData.max_uses || null,
        });
        setEditing(null);
      } else {
        await createCoupon({
          item: formData.item,
          code: formData.code,
          description: formData.description,
          discount_pct: formData.discount_pct,
          expires_at: formData.expires_at || null,
          max_uses: formData.max_uses || null,
        });
      }
      setShowForm(false);
      loadCoupons();
    } catch (err) {
      console.error('Failed to save coupon:', err);
      alert('Error saving coupon.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteCouponById(id);
      loadCoupons();
    } catch (err) {
      console.error('Delete coupon failed:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Coupons</h2>
        <button
          onClick={openNewForm}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Item ID"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              required
              className="border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Coupon Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              className="border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Discount %"
              value={formData.discount_pct}
              onChange={(e) => setFormData({ ...formData, discount_pct: e.target.value })}
              required
              className="border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="Expires At"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Uses"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
              className="border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-gray-300 dark:border-gray-600 rounded px-2 py-1 col-span-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading coupons…</p>
      ) : coupons.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No coupons defined.</p>
      ) : (
        <ul className="space-y-4">
          {coupons.map((c) => (
            <li key={c.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{c.code}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {c.discount_pct}% off • Expires: {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                </p>
                {c.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {c.description}
                  </p>
                )}
                {c.max_uses !== null && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Uses: {c.uses} / {c.max_uses}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditForm(c)}
                  className="p-1 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded transition"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded transition"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
