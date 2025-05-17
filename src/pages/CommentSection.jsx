import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// Recursive Comment Component
function Comment({ comment, depth = 0, replyTo, onReply, onSubmitReply, user }) {
    const [replyText, setReplyText] = useState('');

    return (
        <div className="ml-4 mt-2">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <p className="text-sm font-semibold">
                    {comment.anonymous ? 'Anonymous' : comment.user?.username || 'Unknown User'}
                </p>
                <p className="mb-1">{comment.content}</p>

                {depth < 5 && (
                    <button
                        onClick={() => onReply(comment.id)}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Reply
                    </button>
                )}

                {user?.id === comment.user?.id && (
                    <button
                        onClick={() => onSubmitReply(comment.id, 'DELETE')}
                        className="text-xs text-red-500 ml-2 hover:underline"
                    >
                        Delete
                    </button>
                )}

                {/* Reply Input */}
                {replyTo === comment.id && (
                    <div className="mt-2">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full border p-2 rounded mt-1"
                            rows={2}
                            placeholder="Write your reply..."
                        />
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={() => {
                                    onSubmitReply(comment.id, replyText);
                                    setReplyText('');
                                }}
                                disabled={!replyText.trim()}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                                Send
                            </button>
                            <button
                                onClick={() => onReply(null)}
                                className="text-xs text-gray-600 hover:underline"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Render Replies */}
            {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                <div className="ml-4 mt-2">
                    {comment.replies.map((child) => (
                        <Comment
                            key={child.id}
                            comment={child}
                            depth={depth + 1}
                            replyTo={replyTo}
                            onReply={onReply}
                            onSubmitReply={onSubmitReply}
                            user={user}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CommentSection({ postId, simpleMode = false }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [anonymous, setAnonymous] = useState(false);
    const { user } = useAuth();

    const loadComments = async () => {
        try {
            const res = await api.get(`posts/${postId}/comments/`);
            const data = res.data?.results || res.data || [];
            setComments(data);
        } catch (err) {
            console.error('Failed to load comments:', err);
        }
    };

    useEffect(() => {
        loadComments();
    }, [postId]);

    const handleSubmitMain = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`posts/${postId}/comments/`, {
                content: newComment,
                anonymous,
            });
            setNewComment('');
            loadComments();
        } catch (err) {
            console.error('Main comment error:', err);
        }
    };

    const handleReplySubmit = async (parentId, contentOrAction) => {
        if (contentOrAction === 'DELETE') {
            try {
                await api.delete(`comments/${parentId}/`);
                loadComments();
            } catch (err) {
                console.error('Delete error:', err);
            }
            return;
        }

        if (!contentOrAction.trim()) return;
        try {
            await api.post(`posts/${postId}/comments/`, {
                content: contentOrAction,
                parent: parentId,
                anonymous,
            });
            setReplyTo(null);
            loadComments();
        } catch (err) {
            console.error('Reply error:', err);
        }
    };

    return (
        <div className="mt-6">
            <h4 className="font-bold mb-2">Comments</h4>
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full border p-2 rounded"
                rows={3}
                placeholder="Write a comment..."
            />
            <div className="flex items-center gap-2 mt-2">
                <label className="text-sm text-gray-600">
                    <input 
                        type="checkbox" 
                        checked={anonymous} 
                        onChange={() => setAnonymous(!anonymous)} 
                        className="mr-1"
                    />
                    Post Anonymously
                </label>
                <button
                    onClick={handleSubmitMain}
                    disabled={!newComment.trim()}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                    Submit
                </button>
            </div>

            {/* Comments List */}
            <div className="mt-6">
                {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">No comments yet.</p>
                ) : (
                    comments.map((c) => (
                        <Comment
                            key={c.id}
                            comment={c}
                            replyTo={replyTo}
                            onReply={setReplyTo}
                            onSubmitReply={handleReplySubmit}
                            user={user}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
