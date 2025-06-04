// src/components/RateUserModal.jsx
import React, { useState } from 'react';
import { rateUser } from '../requests'; // :contentReference[oaicite:8]{index=8}

const RateUserModal = ({ buyerId, onClose }) => {
  const [score, setScore] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // rateUser expects: { to_user, rating, comment }
      await rateUser({
        to_user: buyerId,
        rating: score,
        comment: message,
      });
      alert('Rating submitted!');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 space-y-4">
        <h2 className="text-lg font-bold">Rate User</h2>
        <select
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value))}
          className="w-full border p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>
              {s} Star{s !== 1 && 's'}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Optional comment"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateUserModal;
