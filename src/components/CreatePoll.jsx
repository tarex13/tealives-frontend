import React, { useState } from 'react';
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

    try {
      setLoading(true);

      const expiresAtUTC = expiresAt ? new Date(expiresAt).toISOString() : null;

      const payload = {
        title: title.trim(),
        description: description.trim(),
        expires_at: expiresAtUTC,
        options: validOptions,
      };

      const response = await createPoll(payload);
      showNotification('Poll created successfully!', 'success');
      onPollCreated?.(response.data);

      // Reset form
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setExpiresAt('');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to create poll.');
      showNotification('Failed to create poll. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
};

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-3">Create a Poll</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Poll Title"
        required
        className="w-full border p-2 rounded mb-2"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional Description"
        rows={2}
        className="w-full border p-2 rounded mb-2"
      />

      <h4 className="font-medium mb-1">Poll Options:</h4>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-1">
          <input
            type="text"
            value={opt}
            onChange={(e) => handleOptionChange(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`}
            required={idx < 2}
            className="flex-1 border p-2 rounded"
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="text-red-500 hover:text-red-700"
            >
              ❌
            </button>
          )}
        </div>
      ))}

      {options.length < 5 && (
        <button
          type="button"
          onClick={addOption}
          className="text-xs text-blue-600 hover:underline mb-2"
        >
          + Add Option
        </button>
      )}

      <label className="block font-medium mt-2 mb-1">Poll Expiration (Optional):</label>
      <input
        type="datetime-local"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50 mb-2"
      >
        {loading ? 'Creating...' : 'Create Poll'}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-gray-500 hover:text-gray-700 text-sm mt-2"
      >
        Cancel
      </button>
    </form>
  );
}

export default CreatePoll;
