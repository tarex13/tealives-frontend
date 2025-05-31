// src/components/ModalEditPost.jsx
import React, { useEffect, useState } from 'react';
import { fetchPostById, updatePost } from '../requests';
import { useNavigate } from 'react-router-dom'; // Only in case we want to redirect on ownership‐fail
import { useNotification } from '../context/NotificationContext';
import CreatePost from './CreatePost';
import Modal from './Modal';
import Spinner from './Spinner';

export default function ModalEditPost({ postId, isOpen, onClose, onUpdated }) {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // 1) Fetch the post data as soon as `isOpen` becomes true:
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        setLoading(true);
        const post = await fetchPostById(postId);

        // If the current user doesn’t own the post, just bail out:
        if (post.user.id !== post.current_user_id) {
          showNotification('You cannot edit that post.', 'error');
          onClose();
          return;
        }

        // Shape the data for CreatePost’s `initialData`:
        setInitialData({
          id:          post.id,
          title:       post.title,
          content:     post.content,
          post_type:   post.post_type,
          anonymous:   post.anonymous,
          priority:    post.priority,
          group:       post.group_info?.id || null,
          mediaFiles:  post.media_files?.map((m) => ({
            id:      m.id,   // existing media ID
            file:    null,   // no File object yet
            url:     m.url,
            caption: m.caption,
          })) || [],
          pollOptions:
            post.post_type === 'poll'
              ? post.poll_details.options.map((o) => o.text)
              : ['', ''],
          expiresAt: post.poll_details?.expires_at || '',
        });
      } catch (err) {
        console.error('Error fetching post for edit modal:', err);
        setError('Unable to load post details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, postId, onClose, navigate, showNotification]);

  // 2) Build the callback that CreatePost will call on “Save Changes”:
  const handleEditSubmit = async (formData) => {
    try {
      await updatePost(postId, formData);
      showNotification('Post updated successfully!', 'success');
      onUpdated();  // let parent (FeedCard) know to refetch
      onClose();    // close the modal
    } catch (err) {
      console.error('Error updating post in modal:', err);
      showNotification('Failed to update post.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Post"
    >
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      )}
      {error && (
        <p className="text-red-500 text-center py-4">{error}</p>
      )}
      {initialData && (
        <CreatePost
          initialData={initialData}
          onEditSubmit={handleEditSubmit}
        />
      )}
    </Modal>
  );
}
