import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitBid as submitBidRequest } from '../requests';

const BidForm = ({ itemId }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitBidRequest({ item: itemId, amount, message });
      alert('Bid submitted!');
      navigate(`/marketplace/${itemId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Place a Bid</h2>
      <input
        type="number"
        placeholder="Bid Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 w-full rounded"
      />
      <textarea
        placeholder="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border p-2 w-full rounded"
      />
      <button
        disabled={submitting}
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {submitting ? 'Submitting...' : 'Submit Bid'}
      </button>
    </div>
  );
};

export default BidForm;
