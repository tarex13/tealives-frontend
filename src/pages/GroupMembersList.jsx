import React, { useEffect, useState } from 'react';
import { getGroupMembers, promoteModerator, demoteModerator, removeGroupMember } from '../requests';
import { useParams } from 'react-router-dom';

const GroupMembersList = () => {
  const { id: groupId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const data = await getGroupMembers(groupId);
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      if (action === 'promote') await promoteModerator(groupId, userId);
      if (action === 'demote') await demoteModerator(groupId, userId);
      if (action === 'remove') await removeGroupMember(groupId, userId);
      fetchMembers();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Group Members</h2>
      {loading ? (
        <p>Loading members...</p>
      ) : members.length === 0 ? (
        <p>No members in this group.</p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.id} className="flex justify-between items-center p-4 bg-white shadow rounded">
              <span>{member.username}</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleAction(member.id, 'promote')}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Promote
                </button>
                <button
                  onClick={() => handleAction(member.id, 'demote')}
                  className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Demote
                </button>
                <button
                  onClick={() => handleAction(member.id, 'remove')}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupMembersList;
