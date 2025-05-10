import React, { useEffect, useState } from 'react';
import { fetchGroups, joinGroup } from '../requests';

function GroupDirectory() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchGroups();
        setGroups(Array.isArray(data) ? data : []); // Ensure data is always an array
      } catch (err) {
        setError('Failed to load groups.');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  const handleJoin = async (groupId) => {
    try {
      setJoiningGroupId(groupId);
      await joinGroup(groupId);
      alert('Joined group successfully!');
    } catch (err) {
      alert('Failed to join group.');
    } finally {
      setJoiningGroupId(null);
    }
  };

  if (loading) {
    return <p className="p-4">Loading groups...</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Available Groups</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {Array.isArray(groups) && groups.length > 0 ? (
        groups.map((g) => (
          <div key={g.id} className="p-3 border-b flex justify-between items-center">
            <span>{g.name}</span>
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
              onClick={() => handleJoin(g.id)}
              disabled={joiningGroupId === g.id}
            >
              {joiningGroupId === g.id ? 'Joining...' : 'Join'}
            </button>
          </div>
        ))
      ) : (
        <p>No groups found.</p>
      )}
    </div>
  );
}

export default GroupDirectory;
