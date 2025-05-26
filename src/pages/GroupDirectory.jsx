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

  const loadGroups = async () => {
    try {
      const data = await fetchGroups();
      const groupsList = Array.isArray(data.results) ? data.results : [];
      setGroups(groupsList);
      setFilteredGroups(groupsList);
    } catch {
      showNotification('Failed to load groups.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    let filtered = [...groups];
    if (!user) filtered = filtered.filter(g => g.is_public);
    else filtered = filtered.filter(g => g.is_public || g.is_member);

    if (filter === 'public') filtered = filtered.filter(g => g.is_public);
    if (filter === 'private') filtered = filtered.filter(g => !g.is_public);
    if (filter === 'mine' && user) filtered = filtered.filter(g => g.is_member);

    if (searchTerm) {
      filtered = filtered.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sort === 'members') filtered.sort((a, b) => b.member_count - a.member_count);

    setFilteredGroups(filtered);
  }, [filter, searchTerm, sort, groups, user]);

  const handleJoin = async (groupId) => {
    if (!user) {
      showNotification('You need to be logged in to join groups.', 'warning');
      return;
    }
    try {
      setJoiningGroupId(groupId);
      await joinGroup(groupId);
      showNotification('Joined group successfully!', 'success');
      loadGroups();
    } catch {
      showNotification('Failed to join group.', 'error');
    } finally {
      setJoiningGroupId(null);
    }
  };

  if (loading) return <p className="p-4 text-center">Loading groups...</p>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Available Groups</h2>
        {user && (
          <button onClick={() => navigate('/groups/create')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Create Group</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map(g => (
          <GroupCard key={g.id} group={g} onPreview={() => setSelectedGroup(g)} />
        ))}
      </div>

      {selectedGroup && (
        <GroupPreviewModal 
          group={selectedGroup} 
          onClose={() => setSelectedGroup(null)} 
          onJoin={handleJoin} 
        />
      )}
    </div>
  );
}
