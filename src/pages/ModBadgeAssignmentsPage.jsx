// src/pages/ModBadgeAssignmentsPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  fetchBadgesForMod,
  fetchUsersForMod,
  fetchAssignmentsForMod,
  assignBadgeForMod,
  removeBadgeForMod,
  bulkAssignForMod,
  bulkRemoveForMod,
} from '../api/modRequests';
import SearchFilterBar from '../components/Badges/BadgeAssignments/SearchFilterBar';
import BadgeCardSmall from '../components/Badges/BadgeAssignments/BadgeCard';
import UserCard from '../components/Badges/BadgeAssignments/UserCard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Simple debouncer hook
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export default function ModBadgeAssignmentsPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const notifyRef = useRef(showNotification);
  useEffect(() => { notifyRef.current = showNotification; }, [showNotification]);

  if (!user?.is_moderator && !user?.is_staff) {
    return <p className="p-4 text-red-500">Not authorized.</p>;
  }

  // ─── UI state ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('user'); // or 'seller'
  const [badgeSearch, setBadgeSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const debouncedBadgeSearch = useDebounce(badgeSearch, 400);
  const debouncedUserSearch = useDebounce(userSearch, 400);
  const [userPage, setUserPage] = useState(1);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedBadges, setSelectedBadges] = useState([]);
  const BULK_LIMIT = 50;

  // ─── Data state ───────────────────────────────────────
  const [badges, setBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ─── Reset filters & selections on tab change ────────
  useEffect(() => {
    setBadgeSearch('');
    setUserSearch('');
    setUserPage(1);
    setSelectedUsers([]);
    setSelectedBadges([]);
  }, [activeTab]);

  // ─── 1) Fetch badges whenever tab or search changes ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { results = [] } = await fetchBadgesForMod(activeTab, {
          search: debouncedBadgeSearch,
        });
        if (!cancelled) setBadges(results);
      } catch (err) {
        console.error(err);
        notifyRef.current('Failed to load badges.', 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, debouncedBadgeSearch]);

  // ─── 2) Fetch users list whenever city, page or search ▷─
  useEffect(() => {
    let cancelled = false;
    setLoadingUsers(true);
    (async () => {
      try {
        const { results = [] } = await fetchUsersForMod(user.city, {
          page: userPage,
          search: debouncedUserSearch,
        });
        if (!cancelled) setUsers(results);
      } catch (err) {
        console.error(err);
        notifyRef.current('Failed to load users.', 'error');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user.city, userPage, debouncedUserSearch]);

  // ─── 3) Fetch assignments when tab changes ────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { results = [] } = await fetchAssignmentsForMod(activeTab);
        if (cancelled) return;
        const map = {};
        results.forEach(({ user: u, badge: b }) => {
          map[u.id] = map[u.id] || [];
          map[u.id].push(b);
        });
        setAssignmentsMap(map);
      } catch (err) {
        console.error(err);
        notifyRef.current('Failed to load assignments.', 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  // ─── Assignment handlers ──────────────────────────────
  const handleAssign = async (uid, bid) => {
    try {
      await assignBadgeForMod(activeTab, uid, bid);
      notifyRef.current('Assigned successfully', 'success');
      setAssignmentsMap(m => ({
        ...m,
        [uid]: [...(m[uid]||[]), badges.find(b=>b.id===bid)]
      }));
    } catch {
      notifyRef.current('Assign failed', 'error');
    }
  };

  const handleRemove = async (uid, bid) => {
    try {
      await removeBadgeForMod(activeTab, uid, bid);
      notifyRef.current('Removed successfully', 'success');
      setAssignmentsMap(m => ({
        ...m,
        [uid]: (m[uid]||[]).filter(b=>b.id!==bid)
      }));
    } catch {
      notifyRef.current('Remove failed', 'error');
    }
  };

  // ─── Bulk handlers ────────────────────────────────────
  const handleBulkAssign = async () => {
    if (selectedUsers.length*selectedBadges.length > BULK_LIMIT) {
      return alert(`Limit is ${BULK_LIMIT}.`);
    }
    const payload = selectedUsers.flatMap(uid =>
      selectedBadges.map(bid => ({ user_id: uid, badge_id: bid }))
    );
    if (!payload.length) {
      return notifyRef.current('Nothing to assign','warning');
    }
    try {
      await bulkAssignForMod(activeTab, payload);
      notifyRef.current('Bulk assign OK','success');
      // refresh assignments
      const { results=[] } = await fetchAssignmentsForMod(activeTab);
      const map = {};
      results.forEach(({user:u,badge:b})=>{
        map[u.id]=map[u.id]||[];
        map[u.id].push(b);
      });
      setAssignmentsMap(map);
      setSelectedUsers([]);
      setSelectedBadges([]);
    } catch {
      notifyRef.current('Bulk assign failed','error');
    }
  };

  const handleBulkRemove = async () => {
    const payload = selectedUsers.flatMap(uid =>
      selectedBadges
        .filter(bid => (assignmentsMap[uid]||[]).some(b=>b.id===bid))
        .map(bid => ({ user_id: uid, badge_id: bid }))
    );
    if (!payload.length) {
      return notifyRef.current('Nothing to remove','warning');
    }
    try {
      await bulkRemoveForMod(activeTab, payload);
      notifyRef.current('Bulk remove OK','success');
      // refresh assignments
      const { results=[] } = await fetchAssignmentsForMod(activeTab);
      const map = {};
      results.forEach(({user:u,badge:b})=>{
        map[u.id]=map[u.id]||[];
        map[u.id].push(b);
      });
      setAssignmentsMap(map);
      setSelectedUsers([]);
      setSelectedBadges([]);
    } catch {
      notifyRef.current('Bulk remove failed','error');
    }
  };

  // ─── Drag & Drop ──────────────────────────────────────
  const onDragEnd = ({ source, destination, draggableId }) => {
    if (!destination || source.droppableId!=='badges') return;
    const bid = +draggableId.replace('badge-','');
    const uid = +destination.droppableId.replace('user-','');
    handleAssign(uid,bid);
  };

  // ─── JSX ──────────────────────────────────────────────
  const tabs = [
    { key:'user', label:'User Badges' },
    { key:'seller', label:'Seller Badges' }
  ];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Moderator Badge Assignments
      </h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-300 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={()=>setActiveTab(t.key)}
            className={
              activeTab===t.key
                ? 'pb-2 text-blue-600 border-b-2 border-blue-600'
                : 'pb-2 text-gray-600 hover:text-gray-800 dark:text-gray-300'
            }
          >{t.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SearchFilterBar
          value={badgeSearch}
          onChange={setBadgeSearch}
          filters={[]}
          placeholder="Search badges…"
        />
        <SearchFilterBar
          value={userSearch}
          onChange={setUserSearch}
          filters={[]}
          placeholder="Search users…"
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-blue-600"
            checked={bulkMode}
            onChange={()=>{setBulkMode(m=>!m); setSelectedUsers([]); setSelectedBadges([]);}}
          />
          <span className="text-gray-700 dark:text-gray-300">Bulk Mode</span>
        </label>
      </div>

      {/* Lists */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Badges */}
          <Droppable droppableId="badges" isDropDisabled>
            {prov => (
              <div
                ref={prov.innerRef}
                {...prov.droppableProps}
                className="
                  backdrop-blur-md bg-white/40 dark:bg-gray-800/40 
                  rounded-2xl p-6 shadow-inner shadow-black/10 
                  overflow-auto max-h-[60vh]
                "
              >
                <h2 className="text-xl font-semibold mb-4">
                  Badges ({badges.length})
                </h2>
                {badges.map((b,i)=>(
                  <Draggable key={`badge-${b.id}`} draggableId={`badge-${b.id}`} index={i}>
                    {dr => (
                      <div
                        ref={dr.innerRef}
                        {...dr.draggableProps}
                        {...dr.dragHandleProps}
                        className="mb-3"
                      >
                        <BadgeCardSmall
                          badge={b}
                          selectable={bulkMode}
                          selected={selectedBadges.includes(b.id)}
                          onSelectToggle={bid=>
                            setSelectedBadges(s=>
                              s.includes(bid)?s.filter(x=>x!==bid):[...s,bid]
                            )
                          }
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
          <div className="
            col-span-1 lg:col-span-2
            backdrop-blur-md bg-white/40 dark:bg-gray-800/40 
            rounded-2xl p-6 shadow-inner shadow-black/10 
            overflow-auto max-h-[60vh]
          ">
            <h2 className="text-xl font-semibold mb-4">
              Users in {user.city} ({users.length})
            </h2>
            {loadingUsers
              ? <p className="text-gray-500">Loading users…</p>
              : users.length===0
                ? <p className="text-gray-600">No users found.</p>
                : users.map(u => {
                  const dropId = `user-${u.id}`;
                  return (
                    <Droppable key={dropId} droppableId={dropId}>
                      {prov => (
                        <div
                          ref={prov.innerRef}
                          {...prov.droppableProps}
                          className="mb-4 last:mb-0"
                        >
                          <UserCard
                            user={{
                              id: u.id,
                              username: u.username,
                              display_name: u.display_name,
                              profile_image_url: u.profile_image_url,
                              city: u.city,
                            }}
                            currentBadges={assignmentsMap[u.id]||[]}
                            onRemoveBadge={bulkMode?null:handleRemove}
                            selectable={bulkMode}
                            selected={selectedUsers.includes(u.id)}
                            onSelectToggle={uid=>
                              setSelectedUsers(s=>
                                s.includes(uid)?s.filter(x=>x!==uid):[...s,uid]
                              )
                            }
                          />
                          {prov.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })
            }
          </div>
        </div>
      </DragDropContext>

      {/* Bulk actions */}
      {bulkMode && (
        <div className="flex space-x-4">
          <button
            onClick={handleBulkAssign}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Bulk Assign
          </button>
          <button
            onClick={handleBulkRemove}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Bulk Remove
          </button>
        </div>
      )}
    </div>
  );
}
