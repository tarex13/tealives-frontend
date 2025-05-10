// SwappModal.js
import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { sendSwappOffer } from '../requests';

function SwappModal({ targetItem, onClose }) {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cashDifference, setCashDifference] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      const res = await api.get(`marketplace/?seller=${user.user.id}`);
      setMyItems(res.data.results || []);
    };
    loadItems();
  }, [user]);

  const submitOffer = async () => {
    setSubmitting(true);
    try {
      await sendSwappOffer({
        item: targetItem.id,
        offered_item: selectedItem,
        cash_difference: cashDifference,
        message,
      });
      alert('Offer Sent Successfully!');
      onClose();
    } catch (err) {
      alert('Error submitting offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded shadow max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Propose a Swapp</h2>
        <select
          value={selectedItem || ''}
          onChange={(e) => setSelectedItem(e.target.value)}
          className="w-full border p-2 rounded mb-2"
        >
          <option value="">Select an Item to Offer</option>
          {myItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Cash Difference (Optional)"
          value={cashDifference}
          onChange={(e) => setCashDifference(e.target.value)}
          className="w-full border p-2 rounded mb-2"
        />

        <textarea
          placeholder="Optional Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded mb-2"
          rows={3}
        ></textarea>

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={submitOffer}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {submitting ? 'Sending...' : 'Send Offer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SwappModal;
