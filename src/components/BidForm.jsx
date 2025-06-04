// src/components/BidForm.jsx
import React, { useState } from 'react';
import { submitBid } from '../requests';
import { useAuth } from '../context/AuthContext';

export default function BidForm({
  itemId,
  currentHighestBid = null, // might be null/undefined/string/number
  startBid = 0,
  onBidSuccess,
}) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Figure out “highest” as a number.
  //    If currentHighestBid is nullish or not parseable, fall back to startBid.
  const rawHighest = currentHighestBid == null ? startBid : currentHighestBid;
  const highest = parseFloat(rawHighest) || 0; 
  // now `highest` is a true number

  // 2. One-cent above “highest”:
  const minBidNum = highest + 0.01; 
  // keep it as a number (e.g. if highest=10, minBidNum=10.01)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Coerce the entered amount into a number
    const numericAmount = parseFloat(amount);

    // Validate: must be a number and strictly ≥ minBidNum
    if (isNaN(numericAmount) || numericAmount < minBidNum) {
      return setError(
        // Display “$10.01” style: highest+0.01, fixed to two decimals
        `Your bid must be at least $${minBidNum.toFixed(2)}`
      );
    }

    if (!user) {
      return setError('You must be logged in to place a bid.');
    }

    setSubmitting(true);
    try {
      await submitBid({
        item: itemId,
        amount: numericAmount,
        message,
      });
      setAmount('');
      setMessage('');
      if (typeof onBidSuccess === 'function') {
        onBidSuccess();
      }
    } catch (err) {
      console.error('Bid submission failed:', err);
      setError('Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Place Your Bid
      </h2>
      {error && (
        <div
          className="mb-4 p-3 bg-red-100 dark:bg-red-200 text-red-700 dark:text-red-800 rounded"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="bid-amount"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Your Bid ($)
          </label>
          <input
            id="bid-amount"
            type="number"
            step="0.01"
            // pass a numeric min (not a string)
            min={minBidNum}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            // placeholder just shows ">$10.00" if highest is 10
            placeholder={`>= $${minBidNum.toFixed(2)}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="bid-message"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Message (optional)
          </label>
          <textarea
            id="bid-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note to the seller…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Bid'}
        </button>
      </form>
    </div>
  );
}
