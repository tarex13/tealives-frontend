import React, { useState } from 'react';
import { inviteMembers } from '../requests';
import { useNotification } from '../context/NotificationContext';
import { useParams } from 'react-router-dom';

export default function InviteMembers() {
  const { groupId } = useParams();
  const [userIds, setUserIds] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleInvite = async () => {
    const ids = userIds.split(',').map(id => id.trim()).filter(id => id);
    if (ids.length === 0) {
      showNotification('Please enter at least one user ID.', 'error');
      return;
    }

    setLoading(true);
    try {
      await inviteMembers(groupId, ids);
      showNotification('Members invited successfully!', 'success');
      setUserIds('');
    } catch {
      showNotification('Failed to invite members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Invite Members</h2>
      <textarea
        className="border p-2 w-full rounded mb-4"
        rows="3"
        value={userIds}
        onChange={(e) => setUserIds(e.target.value)}
        placeholder="Enter User IDs, separated by commas (e.g., 1, 2, 3)"
      />
      <button
        className={`w-full p-2 rounded text-white ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} transition`}
        onClick={handleInvite}
        disabled={loading}
      >
        {loading ? 'Inviting...' : 'Invite Members'}
      </button>
    </div>
  );
}
