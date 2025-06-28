// src/pages/EditPostPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreatePost from '../components/CreatePost';
import { fetchPostById, updatePost, deletePost } from '../requests';
import Spinner from '../components/Spinner';

export default function EditPostPage() {
  const { postId } = useParams();
  const navigate    = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // 1) Fetch the existing post on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const post = await fetchPostById(postId);

        // Ownership check: make sure current user can edit
        if (post.user.id !== post.current_user_id) {
          navigate(-1);
          return;
        }

        // Build the shape that CreatePost expects for “initialData”:
        setInitialData({
          id:          post.id,
          title:       post.title,
          content:     post.content,
          post_type:   post.post_type,
          anonymous:   post.anonymous,
          priority:    post.priority,
          group:       post.group_info?.id || null,
          mediaFiles:  post.media_files?.map((m) => ({
            id:      m.id,      // existing media ID
            file:    null,      // no File object initially
            editedFile: null,
            status: 'existing',
            url:     m.file_url,     // used by MediaManager for preview
            caption: m.caption,
          })) || [],
          pollOptions:
            post.post_type === 'poll'
              ? post.poll_details.options.map((o) => o.text)
              : ['', ''],
          expiresAt:   post.poll_details?.expires_at || '',
          ownerId: post.ownerId,
        });
      } catch (err) {
        console.error(err);
        setError('Could not load post for editing.');
      } finally {
        setLoading(false);
      }
    })();
  }, [postId, navigate]);

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-500">{error}</p>;
  if (!initialData) return null;

  // 2) onEditSubmit: send PATCH to /api/posts/:id/
  const handleEditSubmit = async (payload) => {
    try {
      await updatePost(postId, payload);
      navigate(`/?start=${postId}`);
    } catch (err) {
      console.error('Error updating post:', err);
      alert('Failed to save changes.');
    }
  };

  // 3) Delete button (optional)
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?'))
      return;
    try {
      await deletePost(postId);
      navigate(-1);
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-6">
      <CreatePost
        initialData={initialData}
        onEditSubmit={handleEditSubmit}
      />

      <div className="mt-4 text-right">
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete This Post
        </button>
      </div>
    </div>
  );
}
