// src/pages/GroupDetailPage.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import FeedCard from '../components/FeedCard'
import CreatePost from '../components/CreatePost'
import {
  useGroupDetail,
  useGroupMembers,
  usePaginatedGroupPosts
} from '../hooks/useGroupData'
import * as groupApi from '../requests/group'

export default function GroupDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showNotification } = useNotification()

  const { group, setGroup, loading: loadingGroup } = useGroupDetail(id)
  const { members, setMembers, loadingMembers } = useGroupMembers(id)
  const {
    posts,
    loading: loadingPosts,
    hasMore,
    sentinelRef
  } = usePaginatedGroupPosts(id)

  if (loadingGroup) {
    return <div className="text-center p-4">Loading group…</div>
  }
  if (!group) {
    return <div className="text-center p-4 text-red-500">Group not found.</div>
  }

  const isMember    = group.is_member
  const isCreator   = group.is_creator
  const isModerator = group.moderators.some(m => m.id === user?.id)

  // — Join / Leave (optimistic) —
  const handleJoinLeave = async () => {
    setGroup(g => ({ ...g, is_member: !g.is_member }))
    try {
      if (isMember) {
        await groupApi.leaveGroup(id)
        showNotification('You left the group.', 'success')
      } else {
        await groupApi.joinGroup(id)
        showNotification('You joined the group!', 'success')
      }
    } catch {
      // rollback
      setGroup(g => ({ ...g, is_member: isMember }))
      showNotification('Action failed.', 'error')
    }
  }

  // — Promote / Demote moderator (optimistic) —
  const handleModToggle = async (memberId, currentlyMod) => {
    // update UI immediately
    setGroup(g => ({
      ...g,
      moderators: currentlyMod
        ? g.moderators.filter(m => m.id !== memberId)
        : [...g.moderators, { id: memberId }]
    }))
    try {
      if (currentlyMod) {
        await groupApi.demoteModerator(id, memberId)
        showNotification('Moderator demoted.', 'success')
      } else {
        await groupApi.promoteModerator(id, memberId)
        showNotification('Moderator promoted!', 'success')
      }
    } catch {
      // rollback
      setGroup(g => ({
        ...g,
        moderators: currentlyMod
          ? [...g.moderators, { id: memberId }]
          : g.moderators.filter(m => m.id !== memberId)
      }))
      showNotification('Action failed.', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* — Header — */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {group.description}
            </p>
          )}
        </div>
        <button
          onClick={handleJoinLeave}
          className={`mt-4 sm:mt-0 px-4 py-2 rounded-md text-white transition 
            ${isMember ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isMember ? 'Leave Group' : 'Join Group'}
        </button>
      </div>

      {/* — Stats — */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-md shadow">
        <div className="text-center">
          <p className="text-xl font-semibold">{members.length}</p>
          <p className="text-sm text-gray-500">Members</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{group.moderators.length}</p>
          <p className="text-sm text-gray-500">Moderators</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{group.post_count}</p>
          <p className="text-sm text-gray-500">Posts</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">
            {new Date(group.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">Created</p>
        </div>
      </div>

      {/* — Moderator Management — */}
      {(isCreator || isModerator) && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow">
          <h2 className="text-xl font-semibold mb-3">Manage Moderators</h2>
          {loadingMembers ? (
            <p>Loading members…</p>
          ) : (
            members.map(mem => {
              const currentlyMod = group.moderators.some(m => m.id === mem.id)
              const isSelf = mem.id === user?.id
              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={mem.profile_image_url || '/default-avatar.png'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span>{mem.username}</span>
                  </div>
                  {!isSelf && (
                    <button
                      onClick={() => handleModToggle(mem.id, currentlyMod)}
                      className={`px-3 py-1 rounded-md text-white text-sm transition 
                        ${currentlyMod
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {currentlyMod ? 'Demote' : 'Promote'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* — Create Post (reuses your Home flow) — */}
      {isMember && (
        <div className="p-4 rounded-md shadow">
          <CreatePost
            context="group"
            groupId={id}
            onPostCreated={newPost =>
              setGroup(g => ({
                ...g,
                post_count: g.post_count + 1
              })) &
              null /* side-effect: update count */
              /* and prepend to feed: */
              /* setPosts(prev => [newPost, ...prev]) if you lift posts state up */
            }
          />
        </div>
      )}

      {/* — Feed (infinite-scroll) — */}
      <div className="space-y-6">
        {posts.map((p, i) => (
          <div key={p.id} ref={i === posts.length - 1 ? sentinelRef : null}>
            <FeedCard post={p} />
          </div>
        ))}
        {loadingPosts && (
          <p className="text-center text-gray-500">Loading posts…</p>
        )}
        {!loadingPosts && posts.length === 0 && (
          <p className="text-center text-gray-500">No posts yet.</p>
        )}
      </div>
    </div>
  )
}
