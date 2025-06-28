import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGroups, joinGroup } from '../requests'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import GroupCard from '../components/GroupCard'
import { Helmet } from 'react-helmet-async';
import GroupPreviewModal from '../components/GroupPreviewModal'

export default function GroupDirectory() {
  const [groups, setGroups] = useState([])
  const [filteredGroups, setFilteredGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [joiningGroupId, setJoiningGroupId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [selectedGroup, setSelectedGroup] = useState(null)

  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { user } = useAuth()

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchGroups()
        const list = Array.isArray(data.results) ? data.results : []
        setGroups(list)
        setFilteredGroups(list)
      } catch {
        showNotification('Failed to load groups.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadGroups()
  }, [])

  useEffect(() => {
    let result = [...groups]

    if (!user) result = result.filter(g => g.is_public)
    else result = result.filter(g => g.is_public || g.is_member)

    if (filter === 'public') result = result.filter(g => g.is_public)
    if (filter === 'private') result = result.filter(g => !g.is_public)
    if (filter === 'mine' && user) result = result.filter(g => g.is_member)

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        g =>
          g.name.toLowerCase().includes(term) ||
          g.description?.toLowerCase().includes(term)
      )
    }

    if (sort === 'newest') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sort === 'members') result.sort((a, b) => b.member_count - a.member_count)

    setFilteredGroups(result)
  }, [groups, searchTerm, filter, sort, user])

  const handleJoin = async (groupId) => {
    if (!user) {
      showNotification('Please log in to join groups.', 'warning')
      return
    }

    try {
      setJoiningGroupId(groupId)
      await joinGroup(groupId)
      showNotification('Successfully joined the group!', 'success')
      const updated = await fetchGroups()
      setGroups(updated.results || [])
    } catch {
      showNotification('Could not join group.', 'error')
    } finally {
      setJoiningGroupId(null)
    }
  }

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <Helmet>
        <title>Groups | Tealives</title>
      </Helmet>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          🧑‍🤝‍🧑 Group Directory
        </h2>
        {user && (
          <button
            onClick={() => navigate('/groups/create')}
            className="dark:bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 text-blue-700 dark:text-white px-5 py-2 rounded-md font-medium shadow-sm transition"
          >
            + Create Group
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search groups..."
          className="w-full sm:w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full sm:w-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
          {user && <option value="mine">My Groups</option>}
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="w-full sm:w-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="newest">Newest</option>
          <option value="members">Most Members</option>
        </select>
      </div>

      {/* Group Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          No groups match your filters. Try adjusting them!
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Modal */}
      {selectedGroup && (
        <GroupPreviewModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onJoin={() => handleJoin(selectedGroup.id)}
        />
      )}
    </div>
  )
}
