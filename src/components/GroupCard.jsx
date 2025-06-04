import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GroupCard({ group, currentUser, onJoinLeave, joiningGroupId }) {
  
  const navigate = useNavigate();
  const [isMember, setIsMember] = useState(group.is_member);

  const isCreator = group?.is_creator;
  const isModerator = group.moderators?.some(mod => mod.id === currentUser?.id);
  const isLoading = joiningGroupId === group.id;

  const handleJoinLeave = (e) => {
    e.stopPropagation();
    onJoinLeave(isMember);
    if(currentUser) setIsMember(!isMember);
  };

  return (
    <div
      onClick={() => navigate(`/groups/${group.id}`)}
      className="cursor-pointer bg-white dark:bg-gray-800 hover:shadow-xl hover:scale-[1.01] transition-transform border rounded-lg p-4 space-y-3"
    >
      {/* Title & Type */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{group.name}</h2>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            group.is_public ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {group.is_public ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Status (Creator Only) */}
      {isCreator && group.status && (
        <span
          className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
            group.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : group.status === 'approved'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
        </span>
      )}

      {/* Avatar */}
      {group.avatar && (
        <img
          src={group.avatar_url}
          alt="Group Avatar"
          className="w-full h-36 object-cover rounded-lg border"
        />
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
        {group.description || 'No description provided.'}
      </p>

      {/* Creator & Category */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>👤 {group.creator?.username || 'Unknown'}</span>
        {group.category && (
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-white px-2 py-0.5 rounded-full text-xs">
            {group.category}
          </span>
        )}
      </div>

      {/* Members */}
      <div className="flex items-center gap-2 mt-2">
        {group.members?.slice(0, 3).map((m, idx) => (
          <img
            key={idx}
            src={m.profile_image || '/default-avatar.png'}
            alt="Member"
            className="w-7 h-7 rounded-full object-cover border"
          />
        ))}
        {group.member_count > 3 && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            +{group.member_count - 3} more
          </span>
        )}
      </div>

      {/* Moderators (Preview Only) */}
      {group.moderators?.length > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-medium text-gray-500">Mods:</span>
          {group.moderators.slice(0, 2).map((mod) => (
            <img
              key={mod.id}
              src={mod.profile_image || '/default-avatar.png'}
              alt="Moderator"
              title={mod.username}
              className="w-6 h-6 rounded-full border"
            />
          ))}
          {group.moderators.length > 2 && (
            <span className="text-xs text-gray-500">+{group.moderators.length - 2}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 mt-4">
        {isMember ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/groups/${group.id}`);
              }}
              className="w-full px-4 py-2 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Go to Group
            </button>
            <button
              onClick={handleJoinLeave}
              disabled={isLoading}
              className={`w-full px-4 py-2 text-xs font-semibold rounded ${
                isLoading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
              } text-white transition`}
            >
              {isLoading ? 'Processing...' : 'Leave Group'}
            </button>
          </>
        ) : (
          <button
            onClick={handleJoinLeave}
            disabled={isLoading}
            className={`w-full px-4 py-2 text-xs font-semibold rounded ${
              isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition`}
          >
            {isLoading ? 'Processing...' : 'Join Group'}
          </button>
        )}

        {(isCreator || isModerator) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/groups/${group.id}/invite`);
            }}
            className="w-full px-4 py-2 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700 transition"
          >
            Invite Members
          </button>
        )}
      </div>
    </div>
  );
}
