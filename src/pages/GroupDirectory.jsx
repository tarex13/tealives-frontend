import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGroups, joinGroup } from '../requests';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import GroupCard from '../components/GroupCard';
import GroupPreviewModal from '../components/GroupPreviewModal';

export default function GroupDirectory() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedGroup, setSelectedGroup] = useState(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchGroups();
        const list = Array.isArray(data.results) ? data.results : [];
        setGroups(list);
        setFilteredGroups(list);
      } catch {
        showNotification('Failed to load groups.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    let result = [...groups];

    if (!user) result = result.filter(g => g.is_public);
    else result = result.filter(g => g.is_public || g.is_member);

    if (filter === 'public') result = result.filter(g => g.is_public);
    if (filter === 'private') result = result.filter(g => !g.is_public);
    if (filter === 'mine' && user) result = result.filter(g => g.is_member);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        g =>
          g.name.toLowerCase().includes(term) ||
          g.description?.toLowerCase().includes(term)
      );
    }

    if (sort === 'newest') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sort === 'members') result.sort((a, b) => b.member_count - a.member_count);

    setFilteredGroups(result);
  }, [groups, searchTerm, filter, sort, user]);

  const handleJoin = async (groupId) => {
    if (!user) {
      showNotification('Please log in to join groups.', 'warning');
      return;
    }

    try {
      setJoiningGroupId(groupId);
      await joinGroup(groupId);
      showNotification('Successfully joined the group!', 'success');
      const updated = await fetchGroups();
      setGroups(updated.results || []);
    } catch {
      showNotification('Could not join group.', 'error');
    } finally {
      setJoiningGroupId(null);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">🧑‍🤝‍🧑 Group Directory</h2>
        {user && (
          <button
            onClick={() => navigate('/groups/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create Group
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search groups..."
          className="p-2 border rounded w-full sm:w-64 dark:bg-gray-900"
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="dark:bg-gray-700 p-2 border rounded">
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
          {user && <option value="mine">My Groups</option>}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="dark:bg-gray-700 p-2 border rounded">
          <option value="newest">Newest</option>
          <option value="members">Most Members</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center">Loading groups...</p>
      ) : filteredGroups.length === 0 ? (
        <p className="text-center text-gray-500">No groups match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              currentUser={user?.user}
              onJoinLeave={() => handleJoin(group.id)}
              joiningGroupId={joiningGroupId}
              onPreview={() => setSelectedGroup(group)}
            />
          ))}
        </div>
      )}

      {selectedGroup && (
        <GroupPreviewModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onJoin={() => handleJoin(selectedGroup.id)}
        />
      )}
    </div>
  );
}
