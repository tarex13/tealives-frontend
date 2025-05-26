import React, { useState } from 'react';
import { rateUser } from '../requests';

const RateUserModal = ({ buyerId, onClose }) => {
  const [score, setScore] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await rateUser({
        to_user: buyerId,
        score,
        message,
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
        <h2 className="text-lg font-bold">Rate the Buyer</h2>
        <select
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value))}
          className="w-full border p-2 rounded"
        >
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{s} Star{s !== 1 && 's'}</option>
          ))}
        </select>
        <textarea
          placeholder="Optional message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 text-gray-600">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateUserModal;
