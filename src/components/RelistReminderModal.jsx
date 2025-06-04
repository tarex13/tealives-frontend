// src/components/RelistReminderModal.jsx
import React, { useState } from 'react';
import { setRelistReminder } from '../requests';

export default function RelistReminderModal({ isOpen, onClose, itemId, onSuccess }) {
  const [days, setDays] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseInt(days, 10);
    if (!val || val <= 0) return alert('Enter a valid number of days.');
    try {
      await setRelistReminder(itemId, val);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to set relist reminder:', err);
      alert('Error setting reminder.');
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden w-80">
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Set Relist Reminder</h3>
          <input
            type="number"
            placeholder="Days from now"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
