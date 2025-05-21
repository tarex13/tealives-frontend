import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GroupCard({ group, currentUser, onJoinLeave, joiningGroupId }) {
  const navigate = useNavigate();
  const [isMember, setIsMember] = useState(group.is_member);
  console.log(group)
  const isCreator = group?.is_creator;
  const isModerator = group.moderators?.some(mod => mod.id === currentUser?.id);
  const isLoading = joiningGroupId === group.id;

  const handleJoinLeave = (e) => {
    e.stopPropagation();
    onJoinLeave(isMember);
    setIsMember(!isMember);
  };

  return (
    <div
      onClick={() => navigate(`/groups/${group.id}`)}
      className="cursor-pointer hover:scale-[1.02] hover:shadow-xl bg-white p-4 rounded-lg border border-gray-200 transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">{group.name}</h2>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            group.is_public ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {group.is_public ? 'Public' : 'Private'}
        </span>
      </div>

      {isCreator && (
        <span
          className={`inline-block text-xs px-2 py-1 rounded-full mb-2 ${
            group.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : group.status === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
        </span>
      )}

      {group.avatar && (
        <img
          src={group.avatar}
          alt="Group Avatar"
          className="w-full h-40 object-cover rounded-lg mb-2"
        />
      )}

      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
        {group.description || 'No description provided.'}
      </p>

      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
        <span>👤 Created by {group.creator?.username || 'Unknown'}</span>
        {group.category && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            {group.category}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 mb-4">
        {group.members?.slice(0, 3).map((member, idx) => (
          <img
            key={idx}
            src={member.profile_image || '/default-avatar.png'}
            alt="Member"
            className="w-8 h-8 rounded-full object-cover border"
          />
        ))}
        {group.member_count > 3 && (
          <span className="text-xs text-gray-600">+{group.member_count - 3} more</span>
        )}
      </div>

      {/* Member Actions */}
      {isMember ? (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/groups/${group.id}`);
            }}
            className="px-4 py-2 text-xs font-semibold rounded w-full bg-blue-500 text-white hover:bg-blue-600 transition mb-2"
          >
            Go to Group
          </button>
          <button
            onClick={handleJoinLeave}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded w-full ${
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
          className={`px-4 py-2 text-xs font-semibold rounded w-full ${
            isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition`}
        >
          {isLoading ? 'Processing...' : 'Join Group'}
        </button>
      )}

      {/* Invite Members */}
      {(isCreator || isModerator) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/groups/${group.id}/invite`);
          }}
          className="mt-2 px-4 py-2 text-xs font-semibold rounded w-full bg-green-500 text-white hover:bg-green-600 transition"
        >
          Invite Members
        </button>
      )}
    </div>
  );
}
