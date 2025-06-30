// src/pages/BadgeAssignmentsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useCity } from '../context/CityContext';
import {
  fetchBadges,
  fetchUsers,
  fetchUserAssignments,
  assignUserBadge,
  removeUserBadge,
  bulkAssignUserBadges,
  bulkRemoveUserBadges,
  fetchSellerAssignments,
  assignSellerBadge,
  removeSellerBadge,
  bulkAssignSellerBadges,
  bulkRemoveSellerBadges,
  fetchModAssignments,
  assignModBadge,
  removeModBadge,
  bulkAssignModBadges,
  bulkRemoveModBadges,
} from '../../src/api/adminRequests';
import SearchFilterBar from '../components/Badges/BadgeAssignments/SearchFilterBar';
import BadgeCardSmall from '../components/Badges/BadgeAssignments/BadgeCard';
import UserCard from '../components/Badges/BadgeAssignments/UserCard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function BadgeAssignmentsPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const notifyRef = useRef(showNotification);
  const { cities, city: currentCity } = useCity();

  // Keep notification fn stable so its identity doesn’t break our effects:
  useEffect(() => {
    notifyRef.current = showNotification;
  }, [showNotification]);

  // --- UI state ---
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'seller' | 'mod'
  const [badges, setBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  // user list pagination & filters
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userCityFilter, setUserCityFilter] = useState(currentCity || '');

  // badge filter
  const [badgeSearch, setBadgeSearch] = useState('');

  // bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState([]);

  const BULK_LIMIT = 50;

  // Whenever the global city changes, reset our filter
  useEffect(() => {
    setUserCityFilter(currentCity || '');
  }, [currentCity]);

  // — 1) Reset on tab switch —
  useEffect(() => {
    if (!user?.is_admin) return;
    setUserPage(1);
    setUserSearch('');
    setUserCityFilter(currentCity || '');
    setBadgeSearch('');
    setSelectedUserIds([]);
    setSelectedBadgeIds([]);
  }, [activeTab, user, currentCity]);

  // — 2) Load badges on tab or search change —
  useEffect(() => {
    if (!user?.is_admin) return;
    (async () => {
      try {
        const { results = [] } = await fetchBadges({
          badge_type: activeTab,
          is_active: true,
          search: badgeSearch,
        });
        setBadges(results);
      } catch (err) {
        console.error(err);
        notifyRef.current('Failed to fetch badges', 'error');
      }
    })();
  }, [activeTab, badgeSearch, user]);

  // — 3) Load users on page, search, or city-filter change —
  useEffect(() => {
    if (!user?.is_admin) return;
    (async () => {
      setLoadingUsers(true);
      try {
        const params = { page: userPage };
        if (userSearch) params.search = userSearch;
        if (userCityFilter) params.city = userCityFilter;

        const { results = [] } = await fetchUsers(params);
        setUsers(results);
      } catch (err) {
        console.error(err);
        notifyRef.current('Failed to fetch users', 'error');
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [userPage, userSearch, userCityFilter, user]);

  // — 4) Load assignments on tab change —
  useEffect(() => {
    if (!user?.is_admin) return;
    (async () => {
      try {
        let payload;
        if (activeTab === 'user') payload = await fetchUserAssignments();
        else if (activeTab === 'seller') payload = await fetchSellerAssignments();
        else if (activeTab === 'mod') payload = await fetchModAssignments();
        else return;

        const map = {};
        (payload.results || []).forEach(({ user: u, badge: b }) => {
          map[u.id] = map[u.id] || [];
          map[u.id].push(b);
        });
        setAssignmentsMap(map);
      } catch (err) {
        console.error(err);
        notifyRef.current('Failed to fetch assignments', 'error');
      }
    })();
  }, [activeTab, user]);

  // — Single assign/remove, updates local map to avoid full reload —
  const handleAssign = async (uid, bid) => {
    try {
      if (activeTab === 'user') await assignUserBadge(uid, bid);
      else if (activeTab === 'seller') await assignSellerBadge(uid, bid);
      else if (activeTab === 'mod') await assignModBadge(uid, bid);

      notifyRef.current('Assigned successfully', 'success');
      setAssignmentsMap((m) => {
        const next = { ...m };
        next[uid] = next[uid] || [];
        if (!next[uid].some((b) => b.id === bid)) {
          const badgeObj = badges.find((b) => b.id === bid);
          if (badgeObj) next[uid].push(badgeObj);
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      notifyRef.current('Failed to assign badge', 'error');
    }
  };

  const handleRemove = async (uid, bid) => {
    try {
      if (activeTab === 'user') await removeUserBadge(uid, bid);
      else if (activeTab === 'seller') await removeSellerBadge(uid, bid);
      else if (activeTab === 'mod') await removeModBadge(uid, bid);

      notifyRef.current('Removed successfully', 'success');
      setAssignmentsMap((m) => {
        const next = { ...m };
        next[uid] = (next[uid] || []).filter((b) => b.id !== bid);
        return next;
      });
    } catch (err) {
      console.error(err);
      notifyRef.current('Failed to remove badge', 'error');
    }
  };

  // — Bulk operations —
  const handleBulk = async (assign = true) => {
    const actionName = assign ? 'assign' : 'remove';
    const opLimit = selectedUserIds.length * selectedBadgeIds.length;
    if (opLimit > BULK_LIMIT) {
      return alert(
        `Bulk ${actionName} exceeds limit of ${BULK_LIMIT}. Reduce your selection.`
      );
    }

    const payload = selectedUserIds.flatMap((uid) =>
      selectedBadgeIds.map((bid) => ({ user_id: uid, badge_id: bid }))
    );
    if (!payload.length) {
      return notifyRef.current(
        `Nothing to ${actionName} (already ${actionName}ed).`,
        'warning'
      );
    }

    try {
      if (activeTab === 'user') {
        assign
          ? await bulkAssignUserBadges(payload)
          : await bulkRemoveUserBadges(payload);
      } else if (activeTab === 'seller') {
        assign
          ? await bulkAssignSellerBadges(payload)
          : await bulkRemoveSellerBadges(payload);
      } else if (activeTab === 'mod') {
        assign
          ? await bulkAssignModBadges(payload)
          : await bulkRemoveModBadges(payload);
      }

      notifyRef.current(`Bulk ${actionName} successful`, 'success');
      // simplest: re-load assignments
      const reload = activeTab === 'user'
        ? fetchUserAssignments
        : activeTab === 'seller'
        ? fetchSellerAssignments
        : fetchModAssignments;
      const { results = [] } = await reload();
      const map = {};
      results.forEach(({ user: u, badge: b }) => {
        map[u.id] = map[u.id] || [];
        map[u.id].push(b);
      });
      setAssignmentsMap(map);

      setSelectedUserIds([]);
      setSelectedBadgeIds([]);
    } catch (err) {
      console.error(err);
      notifyRef.current(`Bulk ${actionName} failed`, 'error');
    }
  };

  // — DnD handler —
  const onDragEnd = ({ source, destination, draggableId }) => {
    if (
      source.droppableId === 'badges' &&
      destination?.droppableId?.startsWith('user-')
    ) {
      const bid = draggableId.replace('badge-', '');
      const uid = destination.droppableId.replace('user-', '');
      handleAssign(uid, bid);
    }
  };

  if (!user?.is_admin) {
    return (
      <p className="p-4 text-red-500">
        You must be an admin to view badge assignments.
      </p>
    );
  }

  const tabs = [
    { key: 'user',   label: 'User Badges'   },
    { key: 'seller', label: 'Seller Badges' },
    { key: 'mod',    label: 'Mod Badges'    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Badge Assignments
      </h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1 font-medium ${
              activeTab === t.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'dark:text-white text-gray-800 hover:text-gray-800 cursor-pointer'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:space-x-4 gap-4">
        <SearchFilterBar
          searchValue={badgeSearch}
          onSearchChange={setBadgeSearch}
          placeholder="Filter badges…"
        />
        <SearchFilterBar
          searchValue={userSearch}
          onSearchChange={setUserSearch}
          placeholder="Filter users…"
          filters={[
            {
              name: 'city',
              label: 'City',
              options: [
                { value: '', label: 'All Cities' },
                ...cities.map((c) => ({ value: c, label: c })),
              ],
              value: userCityFilter,
            },
          ]}
          onFilterChange={(name, val) => {
            if (name === 'city') setUserCityFilter(val);
          }}
        />
      </div>

      {/* Bulk mode toggle */}
      <label className="inline-flex items-center space-x-2">
        <input
          type="checkbox"
          checked={bulkMode}
          onChange={() => {
            setBulkMode((b) => !b);
            setSelectedUserIds([]);
            setSelectedBadgeIds([]);
          }}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
        <span>Bulk Mode</span>
      </label>

      {/* Main panels */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Badges */}
          <Droppable droppableId="badges" isDropDisabled>
            {(prov) => (
              <div
                ref={prov.innerRef}
                {...prov.droppableProps}
                className="lg:w-1/3 bg-white dark:bg-gray-800 p-4 rounded shadow space-y-2 max-h-[70vh] overflow-auto"
              >
                <h2 className="text-xl">Badges ({badges.length})</h2>
                {!badges.length && <p className="text-gray-500">No badges found.</p>}
                {badges.map((b, i) => (
                  <Draggable key={b.id} draggableId={`badge-${b.id}`} index={i}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                      >
                        <BadgeCardSmall
                          badge={b}
                          selectable={bulkMode}
                          selected={selectedBadgeIds.includes(b.id)}
                          onSelectToggle={() => {
                            setSelectedBadgeIds((prev) =>
                              prev.includes(b.id)
                                ? prev.filter((x) => x !== b.id)
                                : [...prev, b.id]
                            );
                          }}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {prov.placeholder}
              </div>
            )}
          </Droppable>

          {/* Users */}
          <div className="lg:w-2/3 bg-white dark:bg-gray-800 p-4 rounded shadow max-h-[70vh] overflow-auto">
            <h2 className="text-xl">Users ({users.length})</h2>
            {loadingUsers ? (
              <p>Loading users…</p>
            ) : !users.length ? (
              <p className="text-gray-500">No users match your filters.</p>
            ) : (
              users.map((u) => {
                const did = `user-${u.id}`;
                return (
                  <Droppable key={did} droppableId={did}>
                    {(prov) => (
                      <div className={"py-2"} ref={prov.innerRef} {...prov.droppableProps}>
                        <UserCard
                          user={{
                            id: u.id,
                            username: u.username,
                            display_name: u.display_name,
                            profile_image_url: u.profile_image,
                            city: u.city,
                          }}
                          currentBadges={assignmentsMap[u.id] || []}
                          onRemoveBadge={bulkMode ? null : handleRemove}
                          selectable={bulkMode}
                          selected={selectedUserIds.includes(u.id)}
                          onSelectToggle={() => {
                            setSelectedUserIds((prev) =>
                              prev.includes(u.id)
                                ? prev.filter((x) => x !== u.id)
                                : [...prev, u.id]
                            );
                          }}
                        />
                        {prov.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })
            )}
          </div>
        </div>
      </DragDropContext>

      {/* Bulk action buttons */}
      {bulkMode && (
        <div className="flex space-x-4">
          <button
            onClick={() => handleBulk(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Bulk Assign
          </button>
          <button
            onClick={() => handleBulk(false)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Bulk Remove
          </button>
        </div>
      )}
    </div>
  );
}
