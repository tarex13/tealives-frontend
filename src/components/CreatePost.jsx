import React, { useState } from 'react';
import { createPost, createPoll, fetchPostById } from '../requests';
import MediaManager from './MediaManager';
import ImageEditorModal from './ImageEditorModal';
import { useNotification } from '../context/NotificationContext';

const MAX_MEDIA_FILES = 5;

function CreatePost({ onPostCreated }) {
  const [form, setForm] = useState({ title: '', content: '', post_type: 'discussion', anonymous: false });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { showNotification } = useNotification();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const addOption = () => {
    if (pollOptions.length < 5) setPollOptions([...pollOptions, '']);
  };

  const removeOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const resetForm = () => {
    setForm({ title: '', content: '', post_type: 'discussion', anonymous: false });
    setMediaFiles([]);
    setPollOptions(['', '']);
    setExpiresAt('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required.');

    if (form.post_type === 'poll') {
      const validOptions = pollOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) return setError('At least two poll options are required.');
    }

    try {
      setLoading(true);
      if (form.post_type === 'poll') {
        const payload = {
          title: form.title.trim(),
          description: form.content.trim(),
          expires_at: expiresAt || null,
          options: pollOptions.filter((opt) => opt.trim()),
        };
        const response = await createPoll(payload);
        onPostCreated?.(response.data);
        showNotification('Poll created successfully!', 'success');
      } else {
        const postData = new FormData();
        Object.entries(form).forEach(([key, value]) => postData.append(key, value));

        mediaFiles.forEach(({ editedFile, file, caption }) => {
          postData.append('media_files[]', editedFile || file);
          postData.append('media_captions[]', caption || '');
        });

        const newPost = await createPost(postData);
        const fullPost = await fetchPostById(newPost.id);
        onPostCreated?.(fullPost || newPost);

        showNotification('Post created successfully!', 'success');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      setError('Failed to create post. Please try again.');
      showNotification('Failed to create post.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-3">Create a New Post</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <input
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        required
        className="w-full border p-2 rounded mb-2"
      />

      {form.post_type === 'poll' ? (
        <>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Poll Description (Optional)"
            rows={2}
            className="w-full border p-2 rounded mb-2"
          />
          <h4 className="font-medium mb-1">Poll Options:</h4>
          {pollOptions.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                required={idx < 2}
                className="flex-1 border p-2 rounded"
              />
              {pollOptions.length > 2 && (
                <button type="button" onClick={() => removeOption(idx)} className="text-red-500 hover:text-red-700">
                  ❌
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
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
        </>
      ) : (
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="What's on your mind?"
          rows={4}
          required
          className="w-full border p-2 rounded mb-2"
        />
      )}

      <div className="flex gap-4 items-center mb-2">
        <select name="post_type" value={form.post_type} onChange={handleChange} className="border p-2 rounded">
          <option value="discussion">Discussion</option>
          <option value="alert">Alert</option>
          <option value="question">Question</option>
          <option value="rant">Rant</option>
          <option value="poll">Poll</option>
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            name="anonymous"
            checked={form.anonymous}
            onChange={handleChange}
          />
          Anonymous
        </label>
      </div>

      {form.post_type !== 'poll' && (
        <MediaManager
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          openEditor={(fileObj) => setEditingFile(fileObj)}
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50 mt-4"
      >
        {loading ? 'Posting...' : form.post_type === 'poll' ? 'Create Poll' : 'Post'}
      </button>

      {editingFile && (
        <ImageEditorModal
          fileObj={editingFile}
          onSave={(editedFile) => {
            setMediaFiles((prev) =>
              prev.map((f) => (f.id === editingFile.id ? { ...f, editedFile, status: 'edited' } : f))
            );
            setEditingFile(null);
          }}
          onClose={() => setEditingFile(null)}
        />
      )}
    </form>
  );
}

export default CreatePost;
