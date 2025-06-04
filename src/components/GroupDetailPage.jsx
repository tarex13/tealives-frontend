// src/pages/GroupDetailPage.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import FeedCard from '../components/FeedCard';
import CreatePost from '../components/CreatePost';
import InviteMembers from '../components/InviteMembers';
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
    loading: loadingPosts,
    hasMore,
    sentinelRef,
  } = usePaginatedGroupPosts(id);

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  if (loadingGroup) {
    return (
      <div className="text-center p-4 text-gray-700 dark:text-gray-300">
        Loading group…
      </div>
    );
  }
  if (!group) {
    return (
      <div className="text-center p-4 text-red-500 dark:text-red-400">
        Group not found.
      </div>
    );
  }

  const isMember = group.is_member;
  const isCreator = group.is_creator;
  const isModerator = group.moderators.some((m) => m.id === user?.id);

  // — Join / Leave (optimistic) —
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
      // rollback
      setGroup((g) => ({ ...g, is_member: isMember }));
      showNotification('Action failed.', 'error');
    }
  };

  // — Promote / Demote moderator (optimistic) —
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
      // rollback
      setGroup((g) => ({
        ...g,
        moderators: currentlyMod
          ? [...g.moderators, { id: memberId }]
          : g.moderators.filter((m) => m.id !== memberId),
      }));
      showNotification('Action failed.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* — Header — */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {group.description}
            </p>
          )}
        </div>
        <button
          onClick={handleJoinLeave}
          className={`
            mt-4 sm:mt-0
            px-4 py-2
            rounded-md
            text-white
            focus:outline-none
            focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
            transition
            ${isMember
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {isMember ? 'Leave Group' : 'Join Group'}
        </button>
      </div>

      {/* — Stats — */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-md shadow">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {members.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {group.moderators.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Moderators
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {group.post_count}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {new Date(group.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
        </div>
      </div>

      {/* — Moderator Management + Invite Button — */}
      {(isCreator || isModerator) && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Manage Moderators
            </h2>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="
                px-3 py-1
                bg-green-600 hover:bg-green-700
                text-white
                rounded-md
                focus:outline-none
                focus:ring-2 focus:ring-offset-2 focus:ring-green-400
                transition
              "
            >
              Invite Members
            </button>
          </div>

          {loadingMembers ? (
            <p className="text-gray-600 dark:text-gray-400">Loading members…</p>
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
                      src={mem.profile_image_url || '/default-avatar.png'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-gray-800 dark:text-gray-100">
                      {mem.username}
                    </span>
                  </div>
                  {!isSelf && (
                    <button
                      onClick={() => handleModToggle(mem.id, currentlyMod)}
                      className={`
                        px-3 py-1
                        rounded-md text-white text-sm
                        focus:outline-none
                        focus:ring-2 focus:ring-offset-2
                        focus:ring-red-400
                        transition
                        ${
                          currentlyMod
                            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-600'
                            : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-600'
                        }
                      `}
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

      {/* — Create Post (only if member) — */}
      {isMember && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-md shadow">
          <CreatePost
            context="group"
            groupId={id}
            onPostCreated={(newPost) =>
              setGroup((g) => ({ ...g, post_count: g.post_count + 1 }))
            }
          />
        </div>
      )}

      {/* — Feed (infinite-scroll) — */}
<div className="space-y-6">
  {posts.map((post, index) => {
    const isLast = index === posts.length - 1;
    return (
      <div
        key={post.id}
        ref={isLast && hasMore ? sentinelRef : null}
      >
        <FeedCard post={post} />
      </div>
    );
  })}

  {loadingPosts && (
    <p className="text-center text-gray-500 dark:text-gray-400">
      Loading posts…
    </p>
  )}

  {!loadingPosts && posts.length === 0 && (
    <p className="text-center text-gray-500 dark:text-gray-400">
      No posts yet.
    </p>
  )}
</div>

      {/* — Invite Members Modal — */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="
                absolute top-3 right-3
                text-gray-600 dark:text-gray-400
                hover:text-gray-800 dark:hover:text-gray-200
                focus:outline-none
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <InviteMembers />
          </div>
        </div>
      )}
    </div>
  );
}
