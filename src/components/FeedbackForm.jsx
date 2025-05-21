import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function FeedbackForm() {
  const { user } = useAuth();
  const [type, setType] = useState('bug');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { type, content };
      if (!user) {
        payload.email = email; // Add email only if user is not logged in
      }

      await api.post('feedback/', payload);
      setShowModal(true);
      setContent('');
      setEmail('');
      setType('bug');
    } catch (err) {
      console.error('Error submitting feedback', err);
      alert('Failed to send feedback');
    }
  };

  return (
    <>
      {/* Feedback Form */}
      <form 
        onSubmit={handleSubmit} 
        className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow"
      >
        <h1 className="text-2xl font-bold mb-4">Send Feedback</h1>

        <label className="block mb-2">
          Feedback Type:
          <select
            value={type} dark:text-white dark:bg-gray-900
            onChange={(e) => setType(e.target.value)}
            className="w-full border p-2 rounded mt-1"
          >
            <option value="bug">🐞 Bug Report</option>
            <option value="feature">🌟 Feature Request</option>
            <option value="other">💬 Other</option>
          </select>
        </label>

        <label className="block mb-4">
          Your Feedback:
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Explain the bug, suggest a feature, or share your thoughts..."
            className="w-full border p-2 rounded mt-1 h-32"
          />
        </label>

        {!user && (
          <label className="block mb-4">
            Your Email (optional):
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email if you'd like us to contact you"
              className="w-full border p-2 rounded mt-1"
            />
          </label>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send Feedback
        </button>
      </form>

      {/* Success Modal */}
      {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow text-center transform transition-transform duration-300 scale-95 animate-fade-in-up">
      <h2 className="text-xl font-bold mb-2">Thank You!</h2>
      <p className="text-gray-600 mb-4">We’ve received your feedback 🙌</p>
      <button
        onClick={() => setShowModal(false)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Close
      </button>
    </div>
  </div>
)}
    </>
  );
}

export default FeedbackForm;
