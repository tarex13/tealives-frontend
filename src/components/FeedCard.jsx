import React, { useState } from 'react';
import { sendReaction } from '../requests';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import MediaCarousel from './MediaCarousel';
import PostActionMenu from './PostActionMenu';
import PollCardEnhanced from './PollCardEnhanced';
import CommentSection from '../pages/CommentSection';

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '🔥'];

function FeedCard({ post }) {
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const [summary, setSummary] = useState(post.reaction_summary || {});
    const [userReacts, setUserReacts] = useState(post.user_reactions || []);
    const [loadingEmoji, setLoadingEmoji] = useState(null);
    const [showComments, setShowComments] = useState(false);

    const handleReaction = async (emoji) => {
        try {
            setLoadingEmoji(emoji);
            await sendReaction(post.id, emoji);

            const newSummary = { ...summary };
            const newUserReacts = [...userReacts];
            const hasReacted = newUserReacts.includes(emoji);

            if (hasReacted) {
                newSummary[emoji] = Math.max(0, (newSummary[emoji] || 1) - 1);
                newUserReacts.splice(newUserReacts.indexOf(emoji), 1);
            } else {
                newSummary[emoji] = (newSummary[emoji] || 0) + 1;
                newUserReacts.push(emoji);
            }

            setSummary(newSummary);
            setUserReacts(newUserReacts);
        } catch (err) {
            console.error('Reaction error:', err);
            showNotification('Failed to update reaction. Please try again.', 'error');
        } finally {
            setLoadingEmoji(null);
        }
    };

    return (
        <>
            {post.post_type === 'poll' && post.poll_details ? (
                <PollCardEnhanced pollData={post.poll_details} />
            ) : (
                <div className="rounded-lg shadow-lg mb-4 bg-white dark:bg-gray-800 p-4">
                    {/* Post Header */}
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                            @{post.anonymous ? 'Anonymous' : post?.username || 'Unknown User'} -{' '}
                            <span className="ml-1">{post.title}</span>
                        </p>
                        <PostActionMenu 
                            postId={post.id} 
                            postOwnerId={post.user?.id} 
                            postOwnerUsername={post.user?.username}
                            currentUserId={user?.id}
                            isAnonymous={post.anonymous}
                        />
                    </div>

                    {/* Post Content */}
                    <p className="mb-2 text-gray-700 dark:text-gray-300">{post.content}</p>

                    {/* Media Section */}
                    {post.media_files?.length > 0 && (
                        <MediaCarousel mediaFiles={post.media_files} />
                    )}

                    {/* Reaction Section */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {ALLOWED_REACTIONS.map((emoji) => {
                            const count = summary[emoji] || 0;
                            const hasReacted = userReacts.includes(emoji);

                            return (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    disabled={loadingEmoji === emoji}
                                    className={`flex items-center gap-1 text-xl px-3 py-1 rounded-md transition-transform transform ${
                                        hasReacted ? 'bg-blue-100 dark:bg-blue-700' : 'bg-gray-100 dark:bg-gray-700'
                                    } hover:scale-105 ${loadingEmoji === emoji ? 'scale-110' : ''}`}
                                >
                                    <span>{emoji}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Comments Section */}
                    {!['poll', 'alert'].includes(post.post_type) && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className="text-blue-500 text-sm hover:underline"
                            >
                                {showComments ? 'Hide Comments' : `View Comments (${post.comment_count || 0})`}
                            </button>

                            {showComments && (
                                <CommentSection 
                                    postId={post.id} 
                                    simpleMode={post.post_type === 'rant'} 
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default FeedCard;
