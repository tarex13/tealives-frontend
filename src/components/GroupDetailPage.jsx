// src/pages/GroupDetailPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import FeedCard from '../components/FeedCard';
import CreatePost from '../components/CreatePost';
import { fetchPostById } from '../requests';
import {
  useGroupDetail,
  useGroupMembers,
  usePaginatedGroupPosts,
} from '../hooks/useGroupData';
import * as groupApi from '../requests/group';

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const { group, setGroup, loading: loadingGroup } = useGroupDetail(id);
  const { members, setMembers, loadingMembers } = useGroupMembers(id);
  const {
    posts,
    setPosts,
    loading: loadingPosts,
    hasMore,
    sentinelRef,
  } = usePaginatedGroupPosts(id);

  if (loadingGroup) {
    return <div className="text-center p-6 text-gray-500">Loading group…</div>;
  }

  if (!group) {
    return <div className="text-center p-6 text-red-500">Group not found.</div>;
  }

  const isMember = group.is_member;
  const isCreator = group.is_creator;
  const isModerator = group.moderators?.some((m) => m.id === user?.id) ?? false;

  const handleJoinLeave = async () => {
    setGroup((g) => ({ ...g, is_member: !g.is_member }));
    try {
      if (isMember) {
        await groupApi.leaveGroup(id);
        showNotification('You left the group.', 'success');
      } else {
        await groupApi.joinGroup(id);
        showNotification('You joined the group!', 'success');
      }
    } catch {
      setGroup((g) => ({ ...g, is_member: isMember }));
      showNotification('Action failed.', 'error');
    }
  };

  const handleModToggle = async (memberId, currentlyMod) => {
    setGroup((g) => ({
      ...g,
      moderators: currentlyMod
        ? g.moderators.filter((m) => m.id !== memberId)
        : [...g.moderators, { id: memberId }],
    }));
    try {
      if (currentlyMod) {
        await groupApi.demoteModerator(id, memberId);
        showNotification('Moderator demoted.', 'success');
      } else {
        await groupApi.promoteModerator(id, memberId);
        showNotification('Moderator promoted!', 'success');
      }
    } catch {
      setGroup((g) => ({
        ...g,
        moderators: currentlyMod
          ? [...g.moderators, { id: memberId }]
          : g.moderators.filter((m) => m.id !== memberId),
      }));
      showNotification('Action failed.', 'error');
    }
  };

const handlePostCreated = async (newPost) => {
  let fullPost;
  try {
    fullPost = await fetchPostById(newPost.id);
  } catch {
    fullPost = null;
  }
  setPosts(prev => [fullPost || newPost, ...prev]);
};


  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{group.description}</p>
          )}
        </div>
        {user && (
          <button
            onClick={handleJoinLeave}
            className={`mt-2 sm:mt-0 px-4 py-2 text-sm font-semibold rounded shadow text-white transition ${
              isMember ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isMember ? 'Leave Group' : 'Join Group'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="text-center">
          <p className="text-xl font-bold">{members.length}</p>
          <p className="text-sm text-gray-500">Members</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{group.moderators.length}</p>
          <p className="text-sm text-gray-500">Moderators</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{group.post_count}</p>
          <p className="text-sm text-gray-500">Posts</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">
            {group.created_at ? new Date(group.created_at).toLocaleDateString() : '—'}
          </p>
          <p className="text-sm text-gray-500">Created</p>
        </div>
      </div>

      {/* Moderator Management */}
      {(isCreator || isModerator) && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Manage Moderators</h2>
          {loadingMembers ? (
            <p className="text-gray-500">Loading members…</p>
          ) : (
            members.map((mem) => {
              const currentlyMod = group.moderators.some((m) => m.id === mem.id);
              const isSelf = mem.id === user?.id;
              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={mem.profile_image || '/default-avatar.png'}
                      alt="User"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                    <span className="text-sm">{mem.username}</span>
                  </div>
                  {!isSelf && (
                    <button
                      onClick={() => handleModToggle(mem.id, currentlyMod)}
                      className={`text-sm px-3 py-1 rounded text-white font-medium transition ${
                        currentlyMod
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {currentlyMod ? 'Demote' : 'Promote'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Post */}
{isMember && user && (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <CreatePost
      groupId={id}
      onPostCreated={handlePostCreated}
    />
  </div>
)}

      {/* Group Feed */}
      <div className="space-y-6">
        {posts
          .filter((p) => p && typeof p === 'object' && p.id)
          .map((p, i) => ( 
            <div key={p.id} ref={i === posts.length - 1 ? sentinelRef : null}>
              <FeedCard post={p} />
            </div>
          ))}
        {loadingPosts && (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading posts…</p>
        )}
        {!loadingPosts && posts.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
