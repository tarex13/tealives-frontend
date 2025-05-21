import React, { useState } from 'react';
import { createGroupPost } from '../requests';
import { useParams } from 'react-router-dom';

const GroupPostCreate = () => {
  const { id: groupId } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMediaChange = (e) => setMedia([...e.target.files]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    media.forEach((file, idx) => formData.append(`media_files[]`, file));

    try {
      await createGroupPost(groupId, formData);
      alert('Post created successfully!');
      setTitle('');
      setContent('');
      setMedia([]);
    } catch (err) {
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Create Group Post</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Post Content"
          rows="5"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
        <input type="file" multiple onChange={handleMediaChange} />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default GroupPostCreate;
