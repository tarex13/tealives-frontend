// src/pages/Event.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchEventDetail,
  rsvpToEvent,
  fetchEventRSVPs,
  fetchEventWaitlist,
  removeEventRSVP,
  removeWaitlistMember,
  exportEventRSVPCSV,
  fetchHostGroups,
  addEventParticipantsToGroup,
  notifyEventParticipants,
  deleteEvent,
} from '../requests';
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaEdit,
  FaTrashAlt,
} from 'react-icons/fa';
import AddToGroupModal from '../components/AddToGroupModal';
import NotifyUsersModal from '../components/NotifyUsersModal';
import { useNotification } from '../context/NotificationContext';
export default function Event() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  // ─── Core Event State ──────────────────────────────────────────────────────
  const [event, setEvent]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [timeLeft, setTimeLeft]   = useState(0);
  const [rsvpStatus, setRsvpStatus] = useState(null);

  // ─── Host-only Participants ────────────────────────────────────────────────
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants]         = useState([]);
  const [pFilter, setPFilter]                   = useState('');
  const [pSelected, setPSelected]               = useState(new Set());
  const [hostGroups, setHostGroups]             = useState([]);

  // ─── Host-only Wait-list ───────────────────────────────────────────────────
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlist, setWaitlist]         = useState([]);
  const [wFilter, setWFilter]           = useState('');
  const [wSelected, setWSelected]       = useState(new Set());
  const [wlNextPage, setWlNextPage]     = useState(1);
  const [wlLoadingMore, setWlLoadingMore] = useState(false);
  const wlSentinel = useRef(null);

  // ─── Bulk-modals ────────────────────────────────────────────────────────────
  const [modalAddGroup, setModalAddGroup] = useState(false);
  const [modalNotify, setModalNotify]     = useState(false);

  const [waitlistLoaded, setWaitlistLoaded] = useState(false);

  const isHost      = user?.id === event?.host.id;
  const eventDate   = event ? new Date(event.datetime) : null;
  const eventPassed = eventDate && Date.now() - eventDate.getTime() > 3_600_000;
  const isFull      = event?.is_full;

  // — Load event detail
  const loadEvent = async () => {
    setLoading(true);
    try {
      const data = await fetchEventDetail(id);
      setEvent(data);
      const ms = new Date(data.datetime).getTime() - Date.now();
      setTimeLeft(ms > 0 ? ms : 0);
    } finally {
      setLoading(false);
    }
  };

  // — Load RSVPs (once)
  const loadParticipants = useCallback(async () => {
    const [{ results }, groups] = await Promise.all([
      fetchEventRSVPs(id),
      fetchHostGroups(),
    ]);
    setParticipants(results);
    setHostGroups(groups);
  }, [id]);

  // — Load one page of wait-list
  const loadWaitlistPage = useCallback(async page => {
    setWlLoadingMore(true);
    try {
      const { results, next } = await fetchEventWaitlist(id, page);
      setWaitlist(old => page === 1 ? results : [...old, ...results]);
      setWlNextPage(next);
      setWaitlistLoaded(true);
    } finally {
      setWlLoadingMore(false);
    }
  }, [id]);

  // — Countdown updater
  useEffect(() => {
    if (!event?.show_countdown) return;
    const iv = setInterval(() => {
      const diff = new Date(event.datetime).getTime() - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(iv);
  }, [event]);

  // — Initial event fetch
  useEffect(() => {
    loadEvent();
  }, [id]);

  // — First-time load RSVPs
  useEffect(() => {
    if (showParticipants && isHost && participants.length === 0) {
      loadParticipants();
    }
  }, [showParticipants, isHost, participants.length, loadParticipants]);

  // — First-time load wait-list (page 1)
  useEffect(() => {
    if (showWaitlist && isHost && !waitlistLoaded &&  waitlist.length === 0) {
      loadWaitlistPage(1);
    }
  }, [showWaitlist, isHost, waitlist.length, loadWaitlistPage]);

  // — Infinite-scroll for wait-list
  useEffect(() => {
    if (!showWaitlist || !isHost) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && wlNextPage && !wlLoadingMore) {
        loadWaitlistPage(wlNextPage);
      }
    }, { rootMargin: '200px' });
    if (wlSentinel.current) obs.observe(wlSentinel.current);
    return () => obs.disconnect();
  }, [showWaitlist, isHost, wlNextPage, wlLoadingMore, loadWaitlistPage]);

  // — RSVP toggle
  const handleRsvp = async () => {
    if (!user) {
      navigate('/auth');
      showNotification('Login Required.', 'error');
      return;
    }
    try {
      const res = await rsvpToEvent(id);
      const { message, has_rsvped, on_waitlist, rsvp_count } = res.data;
      showNotification(message);
      // update local event state so button flips correctly
      setEvent(evt => ({
        ...evt,
        has_rsvped,
        on_waitlist,
        rsvp_count,
      }));
    } catch {
      showNotification('Something went wrong.');
    }
  };

  // — Delete event
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      navigate('/events');
    } catch {
      alert("Could not delete event.");
    }
  };

  // — Countdown formatter
  const formatCountdown = ms => {
    if (ms <= 0) return 'Started';
    const secs  = Math.floor(ms/1000);
    const days  = Math.floor(secs/(3600*24));
    const hours = Math.floor((secs % (3600*24)) / 3600);
    const mins  = Math.floor((secs % 3600)/60);
    if (days)  return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) return <p className="p-6 text-center text-gray-500 dark:text-gray-400">Loading…</p>;
  if (!event)  return <p className="p-6 text-center text-red-600 dark:text-red-400">Event not found.</p>;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Hero Banner */}
        <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
          {event.banner_url
            ? <img src={event.banner_url}
                   alt={event.title}
                   loading="lazy"
                   className="w-full h-full object-cover"/>
            : <div className="w-full h-full bg-gray-300 dark:bg-gray-700
                             flex items-center justify-center text-gray-600 dark:text-gray-400">
                No image
              </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 flex flex-col sm:flex-row
                          sm:justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow">{event.title}</h1>
              <p className="mt-1 text-sm text-white/90 drop-shadow">
                {eventDate.toLocaleString()} • {event.location}
              </p>
            </div>
            {isHost && (
              <div className="flex gap-2">
                <button onClick={() => navigate(`/event/${id}/edit`)}
                        className="inline-flex items-center cursor-pointer gap-1 px-3 py-1 bg-yellow-500
                                   hover:bg-yellow-600 text-white rounded shadow transition">
                  <FaEdit /> Edit
                </button>
                <button onClick={handleDelete}
                        className="inline-flex cursor-pointer items-center gap-1 px-3 py-1 bg-red-600
                                   hover:bg-red-700 text-white rounded shadow transition">
                  <FaTrashAlt /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                About this event
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {event.description}
              </p>
            </section>

            {event.tags.length > 0 && (
              <section className="flex flex-wrap gap-2">
                {event.tags.map(tag => (
                  <span key={tag}
                        className="bg-teal-100 dark:bg-teal-900 text-teal-800
                                   dark:text-teal-200 text-xs px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </section>
            )}

            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-2">
              {event.minimum_age && (
                <div className="flex items-center text
Gray-600 dark:text-gray-400">
                  🔞 Minimum age: {event.minimum_age}+
                </div>
              )}
              {event.external_url && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  🌐{' '}
                  <a href={event.external_url} target="_blank" rel="noreferrer"
                     className="underline hover:text-teal-600 dark:hover:text-teal-400">
                    {event.external_url}
                  </a>
                </div>
              )}
              {event.contact_email && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  📧 {event.contact_email}
                </div>
              )}
              {event.contact_phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  📞 {event.contact_phone}
                </div>
              )}
            </section>
          </div>

          {/* Right: RSVP & Countdown */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
              <div className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                {event.rsvp_count}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">RSVPs</div>
              {!eventPassed && !isHost && (
                <button
                  onClick={handleRsvp}
                  className={`
                    w-full inline-flex items-center justify-center gap-2
                    py-2 rounded-lg font-semibold text-white transition
                    ${
                      event.has_rsvped
                        ? 'bg-red-600 hover:bg-red-700'
                        : event.on_waitlist
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : isFull
                            ? 'bg-purple-500 hover:bg-purple-600'
                            : 'bg-teal-600 hover:bg-teal-700'
                    }
                  `}
                >
                  {event.has_rsvped && <><FaTimesCircle/> Cancel RSVP</>}
                  {!event.has_rsvped && event.on_waitlist && <><FaTimesCircle/> Exit Wait-list</>}
                  {!event.has_rsvped && !event.on_waitlist && isFull && <><FaClock/> Join Wait-list</>}
                  {!event.has_rsvped && !event.on_waitlist && !isFull && <><FaCheckCircle/> RSVP</>}
                </button>
              )}
              {isHost && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Hosts cannot RSVP
                </div>
              )}
              {eventPassed && (
                <div className="text-red-600 dark:text-red-400 text-sm mt-2">
                  This event has passed
                </div>
              )}
              {rsvpStatus && (
                <p className="mt-3 text-sm text-teal-600 dark:text-teal-400">
                  {rsvpStatus}
                </p>
              )}
            </section>

            {event.show_countdown && !eventPassed && (
              <section className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-center gap-2">
                <FaClock className="text-teal-600"/>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {formatCountdown(timeLeft)}
                </span>
              </section>
            )}

            {isHost && (
              <div className="flex flex-col gap-2">
                <button onClick={() => setShowParticipants(v => !v)}
                        className="w-full inline-flex items-center  cursor-pointer justify-center gap-2 py-2 rounded-lg
                                   border border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white transition">
                  {showParticipants
                    ? <><FaChevronUp/> Hide Participants</>
                    : <><FaChevronDown/> View Participants</>}
                </button>
                <button onClick={() => setShowWaitlist(v => !v)}
                        className="w-full inline-flex items-center  cursor-pointer justify-center gap-2 py-2 rounded-lg
                                   border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition">
                  {showWaitlist
                    ? <><FaChevronUp/> Hide Wait-list</>
                    : <><FaChevronDown/> View Wait-list</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Participants Section */}
        {showParticipants && isHost && (
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Participants ({participants.length})
              </h3>
              <div className="flex items-center gap-4">
                <button onClick={() => exportEventRSVPCSV(id)}
                        className="inline-flex  cursor-pointer items-center gap-2 text-sm px-3 py-1 rounded-lg
                                   border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                                   hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <FaDownload/> Export CSV
                </button>
                <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <input type="checkbox"
                         checked={pSelected.size === participants.length && participants.length > 0}
                         onChange={e => {
                           const all = e.target.checked;
                           setPSelected(all
                             ? new Set(participants.map(u => u.id))
                             : new Set());
                         }}
                         className="form-checkbox h-5 w-5 text-teal-600 dark:text-teal-400"/>
                  <span className="text-sm">Select all</span>
                </label>
                <input type="text"
                       placeholder="Search…"
                       value={pFilter}
                       onChange={e => setPFilter(e.target.value)}
                       className="px-3 py-1  cursor-text rounded-lg border border-gray-300 dark:border-gray-600
                                  bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex-1
                                  focus:outline-none focus:ring-2 focus:ring-teal-500"/>
              </div>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
              {participants
                .filter(u => u.username.toLowerCase().includes(pFilter.toLowerCase()))
                .map(u => {
                  const sel = pSelected.has(u.id);
                  return (
                    <li key={u.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="checkbox"
                               checked={sel}
                               onChange={() => {
                                 const s = new Set(pSelected);
                                 sel ? s.delete(u.id) : s.add(u.id);
                                 setPSelected(s);
                               }}
                               className="form-checkbox h-5 w-5 text-purple-600 dark:text-purple-400"/>
                        <img loading="lazy"
                             src={u.profile_image}
                             alt={u.username}
                             className="h-8 w-8 rounded-full object-cover"/>
                        <span className="text-gray-800 dark:text-gray-100 font-medium">
                          {u.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/inbox?to=${u.id}`)}
                                className="px-3 py-1 text-sm rounded-lg border border-teal-600
                                           text-teal-600  cursor-pointer hover:bg-teal-600 hover:text-white transition">
                          Message
                        </button>
                        <button onClick={async () => {
                          await removeEventRSVP(id, u.id);
                          loadParticipants();
                          loadEvent();
                        }}
                                className="px-3 py-1  cursor-pointer text-sm rounded-lg border border-red-500
                                           text-red-500 hover:bg-red-500 hover:text-white transition">
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setModalAddGroup(true)}
                      disabled={!pSelected.size}
                      className="flex-1 inline-flex  cursor-pointer items-center justify-center gap-2 py-2 rounded-lg
                                 bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-50">
                Add to Group
              </button>
              <button onClick={() => setModalNotify(true)}
                      disabled={!pSelected.size}
                      className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 py-2 rounded-lg
                                 bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50">
                Notify Users
              </button>
            </div>
          </section>
        )}

        {/* Wait-list Section */}
        {showWaitlist && isHost && (
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Wait-list ({waitlist.length})
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <input type="checkbox"
                         checked={wSelected.size === waitlist.length && waitlist.length > 0}
                         onChange={e => {
                           const all = e.target.checked;
                           setWSelected(all
                             ? new Set(waitlist.map(ent => ent.user.id))
                             : new Set());
                         }}
                         className="form-checkbox h-5 w-5 text-purple-600 dark:text-purple-400"/>
                  <span className="text-sm">Select all</span>
                </label>
                <input type="text"
                       placeholder="Search…"
                       value={wFilter}
                       onChange={e => setWFilter(e.target.value)}
                       className="px-3 py-1 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600
                                  bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex-1
                                  focus:outline-none focus:ring-2 focus:ring-purple-500"/>
              </div>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
              {waitlist
                .filter(ent => ent.user.username.toLowerCase().includes(wFilter.toLowerCase()))
                .map(ent => {
                  const u = ent.user;
                  const sel = wSelected.has(u.id);
                  return (
                    <li key={u.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="checkbox"
                               checked={sel}
                               onChange={() => {
                                 const s = new Set(wSelected);
                                 sel ? s.delete(u.id) : s.add(u.id);
                                 setWSelected(s);
                               }}
                               className="form-checkbox h-5 w-5 text-purple-600 dark:text-purple-400"/>
                        <img loading="lazy"
                             src={u.profile_image}
                             alt={u.username}
                             className="h-8 w-8 rounded-full object-cover"/>
                        <span className="text-gray-800 dark:text-gray-100 font-medium">
                          {u.username}
                        </span>
                      </div>
                      <button onClick={async () => {
                        await removeWaitlistMember(id, u.id);
                        loadWaitlistPage(1);
                      }}
                              className="px-3 cursor-pointer py-1 text-sm rounded-lg border border-red-500
                                         text-red-500 hover:bg-red-500 hover:text-white transition">
                        Remove
                      </button>
                    </li>
                  );
                })}
            </ul>
            <div ref={wlSentinel} className="h-8" />
            {wlLoadingMore && (
              <p className="text-center text-gray-500 dark:text-gray-400">Loading more…</p>
            )}
          </section>
        )}

        {/* Modals */}
        <AddToGroupModal
          open={modalAddGroup}
          onClose={() => setModalAddGroup(false)}
          groups={hostGroups}
          selectedUserIds={[...pSelected]}
          onAdd={async groupId => {
            await addEventParticipantsToGroup(id, {
              group_id: groupId,
              user_ids: [...pSelected],
            });
            setModalAddGroup(false);
            setPSelected(new Set());
          }}
        />
        <NotifyUsersModal
          open={modalNotify}
          onClose={() => setModalNotify(false)}
          selectedUserIds={[...pSelected]}
          onNotify={async message => {
            await notifyEventParticipants(id, {
              user_ids: [...pSelected],
              message,
            });
            setModalNotify(false);
          }}
        />
      </div>
    </div>
  );
}
