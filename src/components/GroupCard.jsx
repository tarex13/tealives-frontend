// src/components/GroupCard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaSignOutAlt, FaUserPlus, FaUsers } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
export default function GroupCard({
  group,
  currentUser,
  onJoinLeave,       // function: (groupId, currentlyMember) => Promise or void
  joiningGroupId,    // id of group currently processing join/leave
  onDeleteGroup,     // function: (groupId) => Promise or void
}) {
  const navigate = useNavigate();

  // Keep track of membership state locally for optimistic UI:
  const [isMember, setIsMember] = useState(group.is_member);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync if group.is_member prop changes externally:
  useEffect(() => {
    setIsMember(group.is_member);
  }, [group.is_member]);
  const { showNotification } = useNotification();
  const isCreator = group?.is_creator;
  const isModerator = group.moderators?.some(mod => mod.id === currentUser?.id);
  const isLoading = joiningGroupId === group.id;

  // Handler for join/leave:
  const handleJoinLeave = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      // not logged in: navigate to login or show prompt
      navigate('/auth');
      showNotification('Login Required.', 'error');
      return;
    }
    const prev = isMember;
    // Optimistic toggle
    setIsMember(!prev);
    try {
      await onJoinLeave(group.id, prev);
      // assume parent updates joiningGroupId etc.
    } catch (err) {
      // rollback
      setIsMember(prev);
      console.error('Join/Leave failed:', err);
    }
  };

  // Handler for delete (only for creator):
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    const ok = window.confirm(
      'Are you sure you want to delete this group? This action cannot be undone.'
    );
    if (!ok) return;
    setDeleteLoading(true);
    try {
      await onDeleteGroup(group.id);
      // Optionally navigate away, or parent removes card from list
    } catch (err) {
      console.error('Delete failed:', err);
      // Optionally show notification of failure
    } finally {
      setDeleteLoading(false);
    }
  };

  // Render:
  return (
    <div
      onClick={() => navigate(`/groups/${group.id}`)}
      className="
        cursor-pointer 
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 
        rounded-lg 
        shadow-sm hover:shadow-lg 
        transform hover:scale-[1.02] 
        transition-transform duration-150 
        flex flex-col
        h-full
      "
    >
      {/* Top area: avatar/banner or color band */}
      {group.avatar_url && (
        <div className="h-36 w-full overflow-hidden rounded-t-lg">
          <img
            src={group.avatar_url}
            alt={`${group.name} avatar`}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <div className="flex-1 p-4 flex flex-col">
        {/* Title & public/private badge */}
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
            {group.name}
          </h2>
          <span
            className={`
              text-xs font-medium px-2 py-0.5 rounded-full 
              ${group.is_public 
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'}
            `}
          >
            {group.is_public ? 'Public' : 'Private'}
          </span>
        </div>

        {/* Status badge for creator */}
        {isCreator && group.status && (
          <div className="mt-1">
            <span
              className={`
                inline-block text-xs font-semibold px-2 py-0.5 rounded 
                ${group.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200'
                  : group.status === 'approved'
                  ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200'}
              `}
            >
              {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 flex-1 line-clamp-3">
          {group.description || 'No description provided.'}
        </p>

        {/* Creator & category */}
        <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>👤 {group.creator?.username || 'Unknown'}</span>
          {group.category && (
            <span className="
              px-2 py-0.5 rounded-full 
              bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100
            ">
              {group.category}
            </span>
          )}
        </div>

        {/* Member avatars */}
        <div className="mt-3 flex items-center">
          {Array.isArray(group.members) && group.members.slice(0, 3).map((m, idx) => (
            <img
              key={m.id || idx}
              src={m.profile_image || '/default-avatar.png'}
              alt={m.username}
              className="
                w-7 h-7 
                rounded-full 
                object-cover 
                border-2 border-white dark:border-gray-800 
                -ml-2 first:ml-0
              "
            />
          ))}
          {group.member_count > 3 && (
            <span className="ml-3 text-xs text-gray-600 dark:text-gray-400">
              +{group.member_count - 3} more
            </span>
          )}
        </div>

        {/* Moderators (small) */}
        {group.moderators?.length > 0 && (
          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium mr-1">Mods:</span>
            {group.moderators.slice(0, 2).map((mod) => (
              <img
                key={mod.id}
                src={mod.profile_image || '/default-avatar.png'}
                alt={mod.username}
                title={mod.username}
                className="
                  w-5 h-5 
                  rounded-full 
                  object-cover 
                  border-2 border-white dark:border-gray-800 
                  mr-1
                "
              />
            ))}
            {group.moderators.length > 2 && (
              <span>+{group.moderators.length - 2}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {isMember ? (
            <>
              {/* “Go to Group” always shown if member */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/groups/${group.id}`);
                }}
                className="
                  w-full text-center 
                  bg-indigo-600 hover:bg-indigo-700 
                  text-white text-sm font-medium 
                  py-2 rounded-md 
                  transition
                "
              >
                Go to Group
              </button>

              {isCreator ? (
                // If creator: show Delete instead of leave
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className={`
                    w-full text-center 
                    ${deleteLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'} 
                    text-white text-sm font-medium 
                    py-2 rounded-md 
                    flex items-center justify-center
                    transition
                  `}
                >
                  {deleteLoading ? 'Deleting...' : <><FaTrash className="mr-1"/> Delete Group</>}
                </button>
              ) : (
                // Regular member (non-creator): Leave
                <button
                  onClick={handleJoinLeave}
                  disabled={isLoading}
                  className={`
                    w-full text-center 
                    ${isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'} 
                    text-white text-sm font-medium 
                    py-2 rounded-md 
                    flex items-center justify-center
                    transition
                  `}
                >
                  {isLoading ? 'Processing...' : <><FaSignOutAlt className="mr-1"/> Leave Group</>}
                </button>
              )}
            </>
          ) : (
            // Not a member: Join button
            <button
              onClick={handleJoinLeave}
              disabled={isLoading}
              className={`
                w-full text-center 
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'} 
                text-white text-sm font-medium 
                py-2 rounded-md 
                flex items-center justify-center
                transition
              `}
            >
              {isLoading ? 'Processing...' : <><FaUserPlus className="mr-1"/> Join Group</>}
            </button>
          )}

          {/* Invite for mods/creator */}
          {(isCreator || isModerator) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/groups/${group.id}/invite`);
              }}
              className="
                w-full text-center 
                bg-green-600 hover:bg-green-700 
                text-white text-sm font-medium 
                py-2 rounded-md 
                flex items-center justify-center
                transition
              "
            >
              Invite Members
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
