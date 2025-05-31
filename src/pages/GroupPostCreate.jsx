import React, { useState } from 'react';
import { createPost, createPoll, fetchPostById } from '../requests';
import MediaManager from '../components/MediaManager';
import ImageEditorModal from '../components/ImageEditorModal';
import { useNotification } from '../context/NotificationContext';
import { toZonedTime } from 'date-fns-tz';
import { useParams } from 'react-router-dom';

const MAX_MEDIA_FILES = 5;

const TYPE_CONFIG = {
  discussion: {
    label: 'Discussion',
    placeholder: "What's on your mind?",
    submitText: 'Post Discussion',
    showMedia: true,
  },
  question: {
    label: 'Question',
    placeholder: 'What would you like to ask?',
    submitText: 'Ask Question',
    showMedia: true,
    maxDesc: 250,
  },
  rant: {
    label: 'Rant',
    placeholder: 'Let it all out…',
    submitText: 'Post Rant',
    showMedia: false,
    forceAnonymous: true,
    disclaimer: 'Rants are anonymous by design—please follow our guidelines.',
  },
  alert: {
    label: 'Alert',
    placeholder: 'Share an alert…',
    submitText: 'Post Alert',
    showMedia: true,
    allowPriority: true,
    disclaimer: 'Medium/High alerts require moderator approval.',
  },
  poll: {
    label: 'Poll',
    placeholder: 'Option text…',
    submitText: 'Create Poll',
    showMedia: false,
  },
};

export default function GroupPostCreate({ onPostCreated }) {
  const { id: groupId } = useParams();
  const [form, setForm] = useState({
    title: '',
    content: '',
    post_type: 'discussion',
    anonymous: false,
    priority: 'low',
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const cfg = TYPE_CONFIG[form.post_type];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOptionChange = (i, v) =>
    setPollOptions((opts) => opts.map((o, idx) => (idx === i ? v : o)));
  const addOption = () => pollOptions.length < 5 && setPollOptions((opts) => [...opts, '']);
  const removeOption = (i) =>
    pollOptions.length > 2 && setPollOptions((opts) => opts.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      post_type: 'discussion',
      anonymous: false,
      priority: 'low',
    });
    setMediaFiles([]);
    setPollOptions(['', '']);
    setExpiresAt('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) return setError('Title is required.');
    if (form.post_type === 'question' && form.content.length > cfg.maxDesc) {
      return setError(`Question max length is ${cfg.maxDesc} characters.`);
    }
    if (form.post_type === 'poll' && pollOptions.filter((o) => o.trim()).length < 2) {
      return setError('At least two poll options are required.');
    }

    try {
      setLoading(true);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (form.post_type === 'poll') {
        const payload = {
          title: form.title.trim(),
          description: form.content.trim(),
          expires_at: expiresAt ? toZonedTime(expiresAt, tz).toISOString() : null,
          options: pollOptions.filter((o) => o.trim()),
          group: groupId,
        };
        const { data: pd } = await createPoll(payload);
        const full = await fetchPostById(pd.post);
        onPostCreated?.(full || pd);
        showNotification('Poll created!', 'success');
      } else {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        fd.append('content', form.content.trim());
        fd.append('post_type', form.post_type);
        fd.append('anonymous', cfg.forceAnonymous || form.anonymous);
        if (cfg.allowPriority) fd.append('priority', form.priority);
        fd.append('group', groupId);
        mediaFiles.forEach(({ editedFile, file, caption }) => {
          fd.append('media_files[]', editedFile || file);
          fd.append('media_captions[]', caption || '');
        });

        const { data: postData } = await createPost(fd);
        const full = await fetchPostById(postData.id);
        onPostCreated?.(full || postData);
        showNotification(`${cfg.label} posted!`, 'success');
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError('Failed to create post.');
      showNotification('Failed to create post.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-xl shadow bg-white dark:bg-gray-900 mb-8">
      <h2 className="text-2xl font-semibold mb-4">New Group {cfg.label}</h2>
      {error && <p className="text-red-500 mb-3">{error}</p>}

      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        required
        className="w-full p-3 border rounded mb-4 bg-white dark:bg-gray-800 focus:outline-none"
      />

      <div className="mb-4">
        <label htmlFor="post_type" className="block mb-1 font-medium">Type</label>
        <select
          id="post_type"
          name="post_type"
          value={form.post_type}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-white dark:bg-gray-800"
        >
          {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {form.post_type === 'poll' ? (
        <>
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex mb-2 gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={cfg.placeholder}
                required={i < 2}
                className="flex-1 p-2 border rounded bg-white dark:bg-gray-800"
              />
              {pollOptions.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="text-red-500">
                  ❌
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button type="button" onClick={addOption} className="text-blue-600 hover:underline mb-4">
              + Add Option
            </button>
          )}
          <label className="block mb-2">Expires At (optional):</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-white dark:bg-gray-800"
          />
        </>
      ) : (
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          rows={4}
          placeholder={cfg.placeholder}
          required
          className="w-full p-3 border rounded mb-4 bg-white dark:bg-gray-800"
        />
      )}

      {cfg.allowPriority && (
        <div className="mb-4">
          <label className="block mb-1">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
          >
            <option value="low">Low</option>
            <option value="medium">Medium (mod approval)</option>
            <option value="high">High (mod approval)</option>
          </select>
        </div>
      )}

      {!cfg.forceAnonymous && (
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            name="anonymous"
            checked={form.anonymous}
            onChange={handleChange}
          />
          Post anonymously
        </label>
      )}

      {cfg.disclaimer && <p className="text-xs italic text-gray-500 mb-4">{cfg.disclaimer}</p>}

      {cfg.showMedia && (
        <MediaManager
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          openEditor={setEditingFile}
          maxFiles={MAX_MEDIA_FILES}
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Posting…' : cfg.submitText}
      </button>

      {editingFile && (
        <ImageEditorModal
          fileObj={editingFile}
          onSave={(editedFile) => {
            setMediaFiles((prev) =>
              prev.map((f) => (f.id === editingFile.id ? { ...f, editedFile } : f))
            );
            setEditingFile(null);
          }}
          onClose={() => setEditingFile(null)}
        />
      )}
    </form>
  );
}
