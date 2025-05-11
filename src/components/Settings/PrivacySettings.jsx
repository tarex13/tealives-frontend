import { useState, useEffect } from 'react';
import api from '../../api';
import React from 'react'

export default function PrivacySettings() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');

  useEffect(() => {
    api.get('user/privacy/').then((res) => setBlockedUsers(res.data.blocked_users));
  }, []);

  const blockUser = (fullBlock = false) => {
    api.post('user/privacy/', { action: 'block', target_user_id: targetUserId, full_block: fullBlock }).then(() => window.location.reload());
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Privacy Settings</h2>
      <label className="block mb-2">
        Block User by ID:
        <input className="border p-2 ml-2" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} />
      </label>
      <button className="btn bg-yellow-500 text-white px-4 py-2 rounded mr-2" onClick={() => blockUser(false)}>
        Soft Block
      </button>
      <button className="btn bg-red-600 text-white px-4 py-2 rounded" onClick={() => blockUser(true)}>
        Full Block
      </button>

      <h3 className="mt-6 text-lg font-bold">Blocked Users</h3>
      <ul>
        {blockedUsers.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}
