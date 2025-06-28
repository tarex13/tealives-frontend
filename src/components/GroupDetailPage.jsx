// src/pages/GroupDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import FeedCard from '../components/FeedCard';
import CreatePost from '../components/CreatePost';
import InviteMembers from '../components/InviteMembers';
import {
  useGroupDetail,
  useGroupMembers,
  usePaginatedGroupPosts,
} from '../hooks/useGroupData';
import { Helmet } from 'react-helmet-async';
import * as groupApi from '../requests/group';
import {
  FaTimes,
  FaPencilAlt,
  FaUsers,
  FaUserShield,
  FaRegCalendarAlt,
  FaImage,
  FaTrash,
  FaSignOutAlt,
} from 'react-icons/fa';
import { removeGroupMember } from '../requests';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Fetch group detail, members, posts via custom hooks
  const { group, setGroup, loading: loadingGroup } = useGroupDetail(id);
  const { members, setMembers, loadingMembers } = useGroupMembers(id);
  const {
    posts,
    loading: loadingPosts,
    hasMore,
    sentinelRef,
  } = usePaginatedGroupPosts(id);

  // Invite modal open state
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  // Edit Group state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    is_public: true,
    city: '',
    max_members: '', // new field
  });
  const [editingLoading, setEditingLoading] = useState(false);

  // Avatar handling
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
   // — Delete Group (only for creator) —
  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDeleteGroup = async () => {
    if (!isCreator) return;
    const confirm = window.confirm(
      'Are you sure you want to delete this group? This action cannot be undone.'
    );
    if (!confirm) return;
    setDeleteLoading(true);
    try {
      await groupApi.deleteGroup(id);
      showNotification('Group deleted.', 'success');
      // Navigate away, e.g., back to groups list
      navigate('/groups');
    } catch (err) {
      console.error('Delete failed:', err);
      showNotification('Failed to delete group.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Prefill currentAvatarUrl when group loads
  useEffect(() => {
    if (!loadingGroup && group) {
      setCurrentAvatarUrl(group.avatar_url || null);
      // If editing modal already open, sync fields:
      if (isEditing) {
        setEditData({
          name: group.name || '',
          description: group.description || '',
          is_public: group.is_public,
          city: group.city || '',
          max_members:
            group.max_members != null ? String(group.max_members) : '',
        });
        setNewAvatarFile(null);
        setNewAvatarPreview(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingGroup, group]);

  if (loadingGroup) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-700 dark:text-gray-300 animate-pulse">
          Loading group…
        </p>
      </div>
    );
  }
  if (!group) {
    return (
      <div className="text-center p-4 text-red-500 dark:text-red-400">
        Group not found.
      </div>
    );
  }

  const isMember = group.is_member;
  const isCreator = group.is_creator;
  const isModerator = group.moderators.some((m) => m.id === user?.id);

  // — Join / Leave (optimistic) —
  const handleJoinLeave = async () => {
    if(!user){
      showNotification('Login Required.', 'error');
      navigate('/auth');
      return;
    }
    const prevMember = isMember;
    setGroup((g) => ({ ...g, is_member: !g.is_member }));
    try {
      if (prevMember) {
        await groupApi.leaveGroup(id);
        showNotification('You left the group.', 'success');
      } else {
        await groupApi.joinGroup(id);
        showNotification('You joined the group!', 'success');
      }
    } catch {
      // rollback
      setGroup((g) => ({ ...g, is_member: prevMember }));
      showNotification('Action failed.', 'error');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the group?`)) {
      return;
    }
    try {
      // Optionally disable UI or show spinner per-member
      await removeGroupMember(id, memberId);
      showNotification(`${memberName} removed from group.`, 'success');
      // Update local members list and group state:
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setGroup((prev) => {
        // Also update moderator list if needed
        const newMods = prev.moderators.filter((m) => m.id !== memberId);
        return {
          ...prev,
          moderators: newMods,
          member_count: prev.member_count ? prev.member_count - 1 : undefined,
          // Note: if you rely on group.member_count in UI, decrement it.
        };
      });
    } catch (err) {
      console.error('Failed to remove member:', err);
      showNotification('Failed to remove member.', 'error');
    }
  };

  // — Promote / Demote moderator (optimistic) —
  const handleModToggle = async (memberId, currentlyMod) => {
    setGroup((g) => ({
      ...g,
      moderators: currentlyMod
        ? g.moderators.filter((m) => m.id !== memberId)
        : [...g.moderators, { id: memberId }],
    }));
    try {
      if (currentlyMod) {
        await groupApi.demoteModerator(id, memberId);
        showNotification('Moderator demoted.', 'success');
      } else {
        await groupApi.promoteModerator(id, memberId);
        showNotification('Moderator promoted!', 'success');
      }
    } catch {
      // rollback
      setGroup((g) => ({
        ...g,
        moderators: currentlyMod
          ? [...g.moderators, { id: memberId }]
          : g.moderators.filter((m) => m.id !== memberId),
      }));
      showNotification('Action failed.', 'error');
    }
  };

  // Open edit modal: prefill fields
  const openEditModal = () => {
    setEditData({
      name: group.name || '',
      description: group.description || '',
      is_public: group.is_public,
      city: group.city || '',
      max_members:
        group.max_members != null ? String(group.max_members) : '',
    });
    setCurrentAvatarUrl(group.avatar_url || null);
    setNewAvatarFile(null);
    setNewAvatarPreview(null);
    setIsEditing(true);
  };

  // Handle avatar file selection
  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setNewAvatarPreview(previewUrl);
    }
  };

  // — Save Edit Group —
  const handleSaveEdit = async () => {
    if (!editData.name.trim()) {
      showNotification('Name is required.', 'error');
      return;
    }
    // Validate max_members if provided
    if (editData.max_members) {
      const mm = parseInt(editData.max_members, 10);
      if (isNaN(mm) || mm <= 0) {
        showNotification('Max members must be a positive number.', 'error');
        return;
      }
    }
    setEditingLoading(true);
    try {
      // Prepare payload. If avatar file is present, use FormData
      let res;
      if (newAvatarFile) {
        const fd = new FormData();
        fd.append('name', editData.name.trim());
        fd.append('description', editData.description.trim());
        fd.append('is_public', editData.is_public);
        fd.append('city', editData.city.trim() || '');
        if (editData.max_members) {
          fd.append('max_members', editData.max_members);
        } else {
          // If backend expects null to clear:
          fd.append('max_members', '');
        }
        // Append avatar file
        fd.append('avatar', newAvatarFile);
        res = await groupApi.updateGroup(id, fd);
      } else {
        // JSON body
        const payload = {
          name: editData.name.trim(),
          description: editData.description.trim(),
          is_public: editData.is_public,
          city: editData.city.trim() || '',
          max_members: editData.max_members
            ? parseInt(editData.max_members, 10)
            : null,
        };
        res = await groupApi.updateGroup(id, payload);
      }
      // Update local group state
      const updated = res.data || {};
      setGroup((prev) => ({
        ...prev,
        name: updated.name ?? editData.name.trim(),
        description:
          updated.description ?? editData.description.trim(),
        is_public: updated.is_public ?? editData.is_public,
        city: updated.city ?? editData.city.trim(),
        max_members:
          updated.max_members != null
            ? updated.max_members
            : editData.max_members
            ? parseInt(editData.max_members, 10)
            : prev.max_members,
        avatar_url:
          updated.avatar_url ??
          (newAvatarPreview || currentAvatarUrl),
      }));
      showNotification('Group updated successfully!', 'success');
      setIsEditing(false);
      // Cleanup preview object URL
      if (newAvatarPreview) {
        URL.revokeObjectURL(newAvatarPreview);
      }
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
    } catch (err) {
      console.error('Failed to update group:', err);
      showNotification('Failed to update group.', 'error');
    } finally {
      setEditingLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Helmet>
        <title>{group.name} | Tealives</title>
      </Helmet>
      {/* Banner + Title */}
      <div className="relative w-full">
        {/* Banner image (or placeholder) */}
        {group.avatar_url ? (
          <img
            src={group.avatar_url}
            alt="Group banner"
            className="w-full h-56 sm:h-64 md:h-72 lg:h-80 object-cover"
          />
        ) : (
          <div className="w-full h-56 sm:h-64 md:h-72 lg:h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <FaImage className="text-gray-400 dark:text-gray-500 text-4xl" />
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 dark:from-black/60 dark:to-black/20"></div>

        {/* Title and actions positioned over the banner */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8">
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold drop-shadow-md">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-1 text-white text-sm sm:text-base md:text-lg max-w-2xl drop-shadow">
              {group.description}
            </p>
          )}
          {group.city && (
            <span className="flex items-center">
              <FaRegCalendarAlt className="mr-1" />
              City: <span className="ml-1 capitalize">{group.city}</span>
            </span>
          )}
          {/* Actions (join/leave/edit/etc) */}
          <div className="mt-3 flex flex-wrap gap-2">
            {(isCreator || isModerator) && (
              <button
                onClick={openEditModal}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm sm:text-base shadow"
              >
                <FaPencilAlt /> Edit
              </button>
            )}
            {isMember ? (
              isCreator ? (
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleteLoading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-sm sm:text-base shadow focus:outline-none ${
                    deleteLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-400'
                  }`}
                >
                  <FaTrash className="mr-1" /> Delete
                </button>
              ) : (
                <button
                  onClick={handleJoinLeave}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm sm:text-base shadow"
                >
                  Leave
                </button>
              )
            ) : (
              <button
                onClick={handleJoinLeave}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm sm:text-base shadow"
              >
                Join
              </button>
            )}
          </div>
        </div>
      </div>

      {/* — Stats Section — */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaUsers className="text-2xl text-indigo-500 dark:text-indigo-400 mb-1" />
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {members.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaUserShield className="text-2xl text-green-500 dark:text-green-400 mb-1" />
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {group.moderators.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Moderators</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaRegCalendarAlt className="text-2xl text-yellow-500 dark:text-yellow-400 mb-1" />
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {group.post_count}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {new Date(group.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
        </div>
      </div>

      {/* — Moderator Management + Invite Button — */}
      {(isCreator || isModerator) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Manage Moderators
            </h2>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition"
            >
              Invite
            </button>
          </div>

          {loadingMembers ? (
            <p className="text-gray-600 dark:text-gray-400 animate-pulse">
              Loading members…
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((mem) => {
                const currentlyMod = group.moderators.some((m) => m.id === mem.id);
                const isSelf = mem.id === user?.id;
                return (
                  <li key={mem.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={mem.profile_image || '/default-avatar.png'}
                        alt={mem.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-gray-800 dark:text-gray-100">{mem.username}</span>
                    </div>
                    {!isSelf && (
                      <div className="flex flex-row gap-3">
                      <button
                        onClick={() => handleModToggle(mem.id, currentlyMod)}
                        className={`px-3 py-1 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
                          currentlyMod
                            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-600'
                            : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-600'
                        }`}
                      >
                        {currentlyMod ? 'Demote' : 'Promote'}
                      </button>
                      {/* Remove button: only visible if current user is creator or moderator */}
                      {/* And not shown for the creator (we skip isSelf above). */}
                      {isModerator && <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(mem.id, mem.username);
                        }}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition"
                      >
                        Remove
                      </button>}
                      </div>
                    )}
                    
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* — Create Post (only if member) — */}
      {isMember && (
        <div className="rounded-lg shadow">
          <CreatePost
            context="group"
            groupId={id}
            onPostCreated={(newPost) =>
              setGroup((g) => ({ ...g, post_count: g.post_count + 1 }))
            }
          />
        </div>
      )}

      {/* — Feed (infinite-scroll) — */}
      <div className="space-y-6">
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <div key={post.id} ref={isLast && hasMore ? sentinelRef : null}>
              <FeedCard post={post} />
            </div>
          );
        })}

        {loadingPosts && (
          <p className="text-center text-gray-500 dark:text-gray-400 animate-pulse">
            Loading posts…
          </p>
        )}

        {!loadingPosts && posts.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No posts yet.
          </p>
        )}
      </div>

      {/* — Invite Members Modal — */}
      {isInviteModalOpen && (
        <Modal onClose={() => setInviteModalOpen(false)}>
          <div className="px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Invite Members
            </h3>
            <InviteMembers onClose={() => setInviteModalOpen(false)} groupId={id} />
          </div>
        </Modal>
      )}

      {/* — Edit Group Modal — */}
      {isEditing && (
        <Modal onClose={() => !editingLoading && setIsEditing(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Group
              </h2>
              <button
                onClick={() => !editingLoading && setIsEditing(false)}
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <FaTimes size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  disabled={editingLoading}
                />
              </div>
              {/* Description (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={editData.description}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  disabled={editingLoading}
                />
              </div>
              {/* Public toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-is-public"
                  checked={editData.is_public}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, is_public: e.target.checked }))
                  }
                  className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500"
                  disabled={editingLoading}
                />
                <label
                  htmlFor="edit-is-public"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Public Group
                </label>
              </div>
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  City (optional)
                </label>
                <input
                  type="text"
                  name="city"
                  value={editData.city}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g., new city (leave blank to keep)"
                  disabled={editingLoading}
                />
              </div>
              {/* Max Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Members (optional)
                </label>
                <input
                  type="number"
                  name="max_members"
                  value={editData.max_members}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, max_members: e.target.value }))
                  }
                  className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Leave blank for no limit"
                  min="1"
                  disabled={editingLoading}
                />
              </div>
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avatar (optional)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {newAvatarPreview ? (
                      <img
                        src={newAvatarPreview}
                        alt="New avatar preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-400"
                      />
                    ) : currentAvatarUrl ? (
                      <img
                        src={currentAvatarUrl}
                        alt="Current avatar"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <FaImage className="text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                      disabled={editingLoading}
                    >
                      {newAvatarFile ? 'Change' : 'Upload'} Avatar
                    </button>
                    {newAvatarFile && (
                      <button
                        type="button"
                        onClick={() => {
                          // reset to current
                          setNewAvatarFile(null);
                          if (newAvatarPreview) {
                            URL.revokeObjectURL(newAvatarPreview);
                          }
                          setNewAvatarPreview(null);
                        }}
                        className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition"
                        disabled={editingLoading}
                      >
                        Remove
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={onAvatarChange}
                      disabled={editingLoading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      JPG, PNG, GIF. Max size 2MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => !editingLoading && setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-offset-gray-800"
                disabled={editingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition flex items-center justify-center ${
                  editingLoading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                disabled={editingLoading}
              >
                {editingLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/**
 * Modal wrapper component.
 * Renders children centered over a backdrop. Closes on backdrop click.
 * The inner container is responsive: on small screens fills most width,
 * on larger screens constrained by max-w classes.
 */
function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full h-full max-w-full max-h-full flex items-center justify-center overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
