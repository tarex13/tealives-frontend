No longer in use

import React, { useState } from 'react';
import { zonedTimeToUtc } from 'date-fns-tz';
import { createPoll } from '../requests';
import { useNotification } from '../context/NotificationContext';

function CreatePoll({ onPollCreated, onCancel }) {
  const { showNotification } = useNotification();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      setError('At least two poll options are required.');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      let expiresAtUTC = null;

  
      if (expiresAt) {
        // Treat expiresAt string as local time in userTimeZone
        const utcDate = zonedTimeToUtc(expiresAt, userTimeZone);
        expiresAtUTC = utcDate.toISOString();
      }

      console.log("User input:", expiresAt); // should be "2025-05-19T23:50"
      console.log("UTC:", zonedTimeToUtc(expiresAt, userTimeZone).toISOString())
  
      const payload = {
        title: title.trim(),
        description: description.trim(),
        expires_at: expiresAtUTC,
        options: validOptions,
      };
  
      const response = await createPoll(payload);
      showNotification('Poll created successfully!', 'success');
      onPollCreated?.(response.data);
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setExpiresAt('');
    } catch (err) {
      console.error(err);
      setError('Failed to create poll.');
      showNotification('Failed to create poll. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white p-6 rounded-xl shadow mb-6 max-w-xl mx-auto transition">
      <h2 className="text-2xl font-bold mb-4">📊 Create a Poll</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Poll Title"
        required
        className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded mb-3 bg-white dark:bg-gray-800 placeholder-gray-400"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional Description"
        rows={2}
        className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded mb-4 bg-white dark:bg-gray-800 placeholder-gray-400"
      />

      <h4 className="font-medium mb-2">Options:</h4>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={opt}
            onChange={(e) => handleOptionChange(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`}
            required={idx < 2}
            className="flex-1 border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-800 placeholder-gray-400"
          />
          {options.length > 2 && (
            <button type="button" onClick={() => removeOption(idx)} className="text-red-500 hover:text-red-700 text-lg">
              ❌
            </button>
          )}
        </div>
      ))}

      {options.length < 5 && (
        <button type="button" onClick={addOption} className="text-sm text-blue-600 hover:underline mb-4">
          + Add Option
        </button>
      )}

      <label className="block font-medium mb-1">Expiration (optional):</label>
      <input
        type="datetime-local"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded mb-6 bg-white dark:bg-gray-800 text-gray-700 dark:text-white"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Poll'}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full mt-3 text-gray-600 dark:text-gray-300 text-sm underline hover:text-gray-800 dark:hover:text-white"
      >
        Cancel
      </button>
    </form>
  );
}

export default CreatePoll;
