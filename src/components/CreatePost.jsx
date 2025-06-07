// src/components/CreatePost.jsx
import React, { useState, useEffect } from 'react';
import { createPost, createPoll, fetchPostById } from '../requests';
import MediaManager from './MediaManager';
import ImageEditorModal from './ImageEditorModal';
import { useNotification } from '../context/NotificationContext';
import { toZonedTime } from 'date-fns-tz';

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

export default function CreatePost({
  onPostCreated,       // callback after a new post is created
  initialData = null,  // if provided, we’re in “edit” mode
  onEditSubmit = null, // callback FormData ⇒ Promise to PATCH an existing post
  groupId = null,      // (optional) if posting inside a group
}) {
  // ─── State Definitions ───────────────────────────────────────────────────────
  const [form, setForm] = useState(
    initialData
      ? {
          title:     initialData.title || '',
          content:   initialData.content || '',
          post_type: initialData.post_type || 'discussion',
          anonymous: initialData.anonymous || false,
          priority:  initialData.priority || 'low',
        }
      : {
          title:     '',
          content:   '',
          post_type: 'discussion',
          anonymous: false,
          priority:  'low',
        }
  );

  const [mediaFiles, setMediaFiles] = useState(
    initialData
      ? // existing media: shape { id, file: null, url, caption }
        initialData.mediaFiles || []
      : []
  );
  const [editingFile, setEditingFile] = useState(null);

  const [pollOptions, setPollOptions] = useState(
    initialData
      ? initialData.pollOptions || ['', '']
      : ['', '']
  );
  const [expiresAt, setExpiresAt] = useState(
    initialData ? initialData.expiresAt || '' : ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const { showNotification }   = useNotification();

  const cfg = TYPE_CONFIG[form.post_type];

  // ─── Keep form state in sync if `initialData` changes (e.g. on fetch) ───────
  useEffect(() => {
    if (!initialData) return;
    setForm({
      title:     initialData.title || '',
      content:   initialData.content || '',
      post_type: initialData.post_type || 'discussion',
      anonymous: initialData.anonymous || false,
      priority:  initialData.priority || 'low',
    });
    setMediaFiles(initialData.mediaFiles || []);
    if (initialData.post_type === 'poll') {
      setPollOptions(initialData.pollOptions || ['', '']);
      setExpiresAt(initialData.expiresAt || '');
    }
  }, [initialData]);

  // ─── Input Handlers ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOptionChange = (idx, val) =>
    setPollOptions((opts) => opts.map((o, i) => (i === idx ? val : o)));

  const addOption = () =>
    pollOptions.length < 5 && setPollOptions([...pollOptions, '']);

  const removeOption = (idx) =>
    pollOptions.length > 2 &&
    setPollOptions((opts) => opts.filter((_, i) => i !== idx));

  const resetForm = () => {
    setForm({
      title:     '',
      content:   '',
      post_type: 'discussion',
      anonymous: false,
      priority:  'low',
    });
    setMediaFiles([]);
    setPollOptions(['', '']);
    setExpiresAt('');
    setError(null);
  };

  // ─── Submit Handler (Create vs Edit) ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1) Basic validation:
    if (!form.title.trim()) {
      return setError('Title is required.');
    }
    if (
      form.post_type === 'question' &&
      form.content.length > cfg.maxDesc
    ) {
      return setError(`Question max length is ${cfg.maxDesc} characters.`);
    }
    if (
      form.post_type === 'poll' &&
      pollOptions.filter((o) => o.trim()).length < 2
    ) {
      return setError('At least two poll options are required.');
    }

    try {
      setLoading(true);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // ─── If we’re editing, build FormData and call onEditSubmit ─────────────
      if (onEditSubmit) {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        fd.append('content', form.content.trim());
        fd.append('post_type', form.post_type);
        fd.append('anonymous', cfg.forceAnonymous || form.anonymous);
        if (cfg.allowPriority) {
          fd.append('priority', form.priority);
        }
        if (groupId) {
          fd.append('group', groupId);
        }

        if (form.post_type === 'poll') {
          if (expiresAt) {
            fd.append(
              'expires_at',
              toZonedTime(new Date(expiresAt), tz).toISOString()
            );
          }
          pollOptions.forEach((opt, i) => {
            if (opt.trim()) {
              fd.append(`options[${i}]`, opt.trim());
            }
          });
        }

        // Handle media files (existing vs new):
        // Each entry in mediaFiles is { id, file: File|null, url, caption, editedFile }
        mediaFiles.forEach((m) => {
          if (m.file) {
            // newly added file
            fd.append('media_files[]', m.file);
            fd.append('media_captions[]', m.caption || '');
          } else if (m.editedFile) {
            // user edited an existing image
            fd.append('media_files[]', m.editedFile);
            fd.append('media_captions[]', m.caption || '');
            fd.append('media_ids[]', m.id);
          } else {
            // keep existing file
            fd.append('existing_media_ids[]', m.id);
            fd.append('media_captions[]', m.caption || '');
          }
        });

        await onEditSubmit(fd);
        showNotification('Post updated!', 'success');
        setLoading(false);
        return;
      }

      // ─── Else: we’re creating a brand‐new post ────────────────────────────────
      if (form.post_type === 'poll') {
        const payload = {
          title:       form.title.trim(),
          description: form.content.trim(),
          expires_at:  expiresAt ? toZonedTime(new Date(expiresAt), tz).toISOString() : null,
          options:     pollOptions.filter((o) => o.trim()),
          ...(groupId && { group: groupId }),
        };

        const pollRes = await createPoll(payload);
        const newPostId = pollRes.data?.post;
        let fullPost = null;
        if (newPostId) {
          try {
            fullPost = await fetchPostById(newPostId);
          } catch {
            fullPost = pollRes.data;
          }
        }
        onPostCreated?.(fullPost || pollRes.data);
        showNotification('Poll created successfully!', 'success');
      } else {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        fd.append('content', form.content.trim());
        fd.append('post_type', form.post_type);
        fd.append('anonymous', cfg.forceAnonymous || form.anonymous);
        if (cfg.allowPriority) {
          fd.append('priority', form.priority);
        }
        if (groupId) {
          fd.append('group', groupId);
        }
        mediaFiles.forEach((m) => {
          fd.append('media_files[]', m.editedFile || m.file);
          fd.append('media_captions[]', m.caption || '');
        });

        const created = await createPost(fd);
        const newPost = created?.data || created;
        let fullPost = null;
        if (newPost?.id) {
          try {
            fullPost = await fetchPostById(newPost.id);
          } catch {
            fullPost = newPost;
          }
        }
        if (fullPost?.id) {
          onPostCreated?.(fullPost);
          showNotification(`${cfg.label} posted!`, 'success');
        } else {
          throw new Error('Post was created but could not be retrieved.');
        }
      }

      resetForm();
    } catch (err) {
      console.error('❌ Post submit failed:', err);
      setError('Failed to submit post.');
      showNotification('Failed to submit post.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-xl shadow bg-white dark:bg-gray-900 mb-8"
    >
      {/* Header changes depending on create vs edit */}
      <h2 className="text-2xl font-semibold mb-4">
        {initialData ? `Edit ${cfg.label}` : `New ${cfg.label}`}
      </h2>
      {error && <p className="text-red-500 mb-3">{error}</p>}

      {/* Title Input */}
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        required
        className="w-full p-3 border rounded mb-4 bg-white dark:bg-gray-800"
      />

      {/* Post Type (disabled in edit mode) */}
      <div className="mb-4">
        <label htmlFor="post_type" className="block mb-1 font-medium">
          Type
        </label>
        <select
          id="post_type"
          name="post_type"
          value={form.post_type}
          onChange={handleChange}
          disabled={!!initialData}
          className="w-full p-2 border rounded bg-white dark:bg-gray-800"
        >
          {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {initialData && (
          <p className="text-xs text-gray-500 mt-1 italic">
            (Cannot change type when editing)
          </p>
        )}
      </div>

      {/* Content / Poll Options */}
      {form.post_type === 'poll' ? (
        <>
          {pollOptions.map((opt, idx) => (
            <div key={idx} className="flex mb-2 gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={cfg.placeholder}
                required={idx < 2}
                className="flex-1 p-2 border rounded bg-white dark:bg-gray-800"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="text-red-500"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button
              type="button"
              onClick={addOption}
              className="text-blue-600 hover:underline mb-4"
            >
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
          className="w-full p-3 border rounded mb-4 bg-white dark:bg-gray-800"
        />
      )}

      {/* Priority (if allowed) */}
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

      {/* Anonymous Checkbox (unless forced) */}
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

      {cfg.disclaimer && (
        <p className="text-xs italic text-gray-500 mb-4">
          {cfg.disclaimer}
        </p>
      )}

      {/* Media Uploader (if allowed) */}
      {cfg.showMedia && (
        <MediaManager
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          openEditor={setEditingFile}
        />
      )}

      {/* Submit Button */}
      <button
        type="submit"
        onClick={(e)=>e.preventDefault()}
        disabled={loading}
        className="w-full py-3 font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading
          ? initialData
            ? 'Saving…'
            : 'Posting…'
          : initialData
          ? 'Save Changes'
          : cfg.submitText}
      </button>

{editingFile && (
  <ImageEditorModal
    fileObj={editingFile}
    onSave={(updatedFileObj) => {
      setMediaFiles((prev) =>
        prev.map((f) =>
          f.id === updatedFileObj.id ? updatedFileObj : f
        )
      );
      setEditingFile(null);
    }}
    onClose={() => setEditingFile(null)}
  />
)}
    </form>
  );
}
