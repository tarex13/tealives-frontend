import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getGroupDetail, getGroupPosts, joinGroup, leaveGroup, 
    getGroupMembers, promoteModerator, demoteModerator 
} from '../requests';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function GroupDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState({ title: '', content: '' });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [groupRes, postsRes, membersRes] = await Promise.all([
                    getGroupDetail(id),
                    getGroupPosts(id),
                    getGroupMembers(id),
                ]);
                setGroup(groupRes);
                setPosts(Array.isArray(postsRes) ? postsRes : []);
                setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
            } catch {
                showNotification('Failed to load group data.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleJoinLeave = async () => {
        if (!currentUser) {
            showNotification('Please log in to perform this action.', 'warning');
            return;
        }
        try {
            if (group.is_member) {
                await leaveGroup(id);
                showNotification('Left the group.', 'success');
            } else {
                await joinGroup(id);
                showNotification('Joined the group.', 'success');
            }
            navigate(`/groups/${id}`, { replace: true });
        } catch {
            showNotification('Failed to update group membership.', 'error');
        }
    };

    const handlePromoteDemote = async (userId, action) => {
        try {
            if (action === 'promote') {
                await promoteModerator(id, userId);
                showNotification('User promoted to moderator.', 'success');
            } else {
                await demoteModerator(id, userId);
                showNotification('User demoted from moderator.', 'success');
            }
            const updatedGroup = await getGroupDetail(id);
            setGroup(updatedGroup);
            const updatedMembers = await getGroupMembers(id);
            setMembers(updatedMembers);
        } catch {
            showNotification(`Failed to ${action} moderator.`, 'error');
        }
    };

    const handlePostCreate = () => {
        if (!newPost.title.trim() || !newPost.content.trim()) {
            showNotification('Post title and content are required.', 'warning');
            return;
        }
        // TODO: Implement API call for creating post here
        showNotification('Post created (simulate).', 'success');
        setNewPost({ title: '', content: '' });
    };

    if (loading) return <p className="text-center p-4">Loading...</p>;
    if (!group) return <p className="text-center p-4 text-red-500">Group not found.</p>;

    const isCreator = group.is_creator;
    const isModerator = group.moderators?.some(mod => mod.id === currentUser?.id);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            {/* Group Header */}
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-600 mb-4">{group.description || 'No description provided.'}</p>

            {/* Join/Leave Button */}
            <button
                onClick={handleJoinLeave}
                className={`mb-6 px-4 py-2 rounded text-white ${
                    group.is_member ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
                {group.is_member ? 'Leave Group' : 'Join Group'}
            </button>

            {/* Moderator Management */}
            {(isCreator || isModerator) && (
                <div className="bg-white p-4 rounded shadow mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Manage Moderators</h2>
                    {members.length > 0 ? (
                        members.map(member => {
                            const isMod = group.moderators.some(mod => mod.id === member.id);
                            const isSelf = currentUser?.id === member.id;
                            return (
                                <div key={member.id} className="flex justify-between items-center border-b py-2">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={member.profile_image || '/default-avatar.png'}
                                            alt={`${member.username}'s avatar`}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span>{member.username}</span>
                                    </div>
                                    {!isSelf && (
                                        <button
                                            onClick={() => handlePromoteDemote(member.id, isMod ? 'demote' : 'promote')}
                                            className={`text-xs px-3 py-1 rounded text-white ${
                                                isMod ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                                            }`}
                                        >
                                            {isMod ? 'Demote' : 'Promote'}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500">No members in this group yet.</p>
                    )}
                </div>
            )}

            {/* Create Post Section */}
            {group.is_member && (
                <div className="my-6 p-4 border rounded bg-white shadow">
                    <h2 className="text-xl font-semibold mb-2">Create a Post</h2>
                    <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Post Title"
                        className="border p-2 w-full rounded mb-2"
                    />
                    <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Post Content"
                        rows="4"
                        className="border p-2 w-full rounded mb-2"
                    />
                    <button
                        onClick={handlePostCreate}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                        Submit Post
                    </button>
                </div>
            )}

            {/* Posts Section */}
            <h2 className="text-2xl font-bold mt-8 mb-4">Group Posts</h2>
            {Array.isArray(posts) && posts.length > 0 ? (
                posts.map(post => (
                    <div key={post.id} className="border rounded p-4 mb-4 shadow-sm">
                        <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                        <p className="text-gray-700">{post.content}</p>
                        <p className="text-gray-500 text-xs mt-2">
                            Posted by {post.anonymous ? 'Anonymous' : post.username} on{' '}
                            {new Date(post.created_at).toLocaleDateString()}
                        </p>
                        {/* Media Handling */}
                        {post.media && post.media.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {post.media.map((mediaItem, idx) => (
                                    <img
                                        key={idx}
                                        src={typeof mediaItem === 'string' ? mediaItem : mediaItem.url}
                                        alt="Post Media"
                                        className="w-32 h-32 object-cover rounded"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p className="text-gray-500">No posts yet in this group.</p>
            )}
        </div>
    );
}
