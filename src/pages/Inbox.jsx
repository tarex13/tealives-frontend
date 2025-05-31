// src/pages/Inbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchThreads,
  fetchThread,
  fetchPublicProfile,
  sendMessage,
  searchUsers,
} from '../requests';
import { createWebSocket } from '../utils/websocket';
import NewMessageModal from '../components/NewMessageModal';
import {
  formatDistanceToNow,
  parseISO,
  isToday,
  isYesterday,
} from 'date-fns';
import { Search, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function groupByDate(messages) {
  return messages.reduce((acc, m) => {
    const d = parseISO(m.sent_at);
    const day = isToday(d)
      ? 'Today'
      : isYesterday(d)
      ? 'Yesterday'
      : d.toLocaleDateString();
    (acc[day] ||= []).push(m);
    return acc;
  }, {});
}

export default function Inbox({ setSidebarMinimized }) {
  const wsRef = useRef(null);
  const inboxMessagesRef = useRef(null);
  const typingTimeout = useRef(null);

  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoOpenId = searchParams.get('to');

  // Threads & messages state
  const [threads, setThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentTypingTrue, setHasSentTypingTrue] = useState(false);

  // “Contacts Pane” toggle on mobile (<768px)
  const [showContacts, setShowContacts] = useState(true);

  // Composer
  const [content, setContent] = useState('');

  // “New Message” modal
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  // Search inside contacts
  const [searchThreads, setSearchThreads] = useState('');
  const [searchQueryResults, setSearchQueryResults] = useState([]);
  const [searchResultsLoading, setSearchResultsLoading] = useState(false);

  // ─── 1️⃣ Fetch threads initially ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      setLoadingThreads(true);
      setSidebarMinimized(true);
      try {
        const list = await fetchThreads();
        if (cancelled) return;
        setThreads(list);
        setFilteredThreads(list);

        // If URL has ?to=USER_ID, auto‐open that thread
        if (autoOpenId) {
          let t = list.find(
            (t) => t.type === 'direct' && String(t.user.id) === autoOpenId
          );
          if (!t) {
            // create a stub if no existing thread
            const u = await fetchPublicProfile(autoOpenId);
            t = {
              type: 'direct',
              user: u,
              last_message: '',
              last_message_time: new Date().toISOString(),
              unread_count: 0,
            };
          }
          setActiveThread(t);
          setShowContacts(false);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    }
    loadThreads();
    return () => {
      cancelled = true;
    };
  }, [autoOpenId, setSidebarMinimized]);

  // ─── 2️⃣ Filter “threads” list as user types ───────────────────────────────
  useEffect(() => {
    const filtered = threads.filter((t) => {
      const name = t.type === 'group' ? t.group.name : t.user.username;
      return name.toLowerCase().includes(searchThreads.toLowerCase());
    });
    setFilteredThreads(filtered);
  }, [searchThreads, threads]);

  // ─── 3️⃣ Fetch messages + connect WebSocket on thread select ─────────────
  useEffect(() => {
    if (!activeThread) return;

    let cancelled = false;
    setLoadingMessages(true);

    async function loadMessagesAndConnect() {
      try {
        if (activeThread.type === 'direct') {
          const m = await fetchThread(activeThread.user.id);
          if (!cancelled) setMessages(m);

          // Close prior socket if any
          if (wsRef.current) wsRef.current.close();

          // Open new WebSocket
          const token = localStorage.getItem('accessToken');
          const sortedIds = [currentUser.id, activeThread.user.id].sort((a, b) => a - b);
          const chatKey = `${sortedIds[0]}_${sortedIds[1]}`;
          const socket = createWebSocket(`/ws/chat/${chatKey}/`, token);
          wsRef.current = socket;

          socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.message) {
              setMessages((prev) => [
                ...prev,
                {
                  content: data.message,
                  is_own: data.sender_id === currentUser.id,
                  sent_at: data.sent_at || new Date().toISOString(),
                },
              ]);
            } else if (
              typeof data.typing === 'boolean' &&
              data.sender_id === activeThread.user.id
            ) {
              setIsTyping(data.typing);
            }
          };

          socket.onclose = () => {
            /* no-op */
          };
          socket.onerror = (err) => {
            console.error('WebSocket error:', err);
          };
        } else {
          // If group‐chat type, navigate away
          navigate(`/group-chat/${activeThread.group.id}`);
        }

        // Scroll to bottom after loading
        setTimeout(() => {
          inboxMessagesRef.current?.scrollTo(0, inboxMessagesRef.current.scrollHeight);
        }, 50);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    loadMessagesAndConnect();
    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeThread, navigate, currentUser]);

  // ─── 4️⃣ Send a message (optimistic + WebSocket + API) ────────────────────
  const handleSend = async () => {
    if (!content.trim() || !activeThread?.user?.id) return;
    const temp = {
      content,
      is_own: true,
      sent_at: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, temp]);
    setContent('');

    // Send via WS if open
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: content }));
    }
    // Scroll down
    inboxMessagesRef.current?.scrollTo(0, inboxMessagesRef.current.scrollHeight);

    // Fire & forget to server
   // try {
     // await sendMessage(activeThread.user.id, content);
   // } catch {
      // ignore
    //}
  };

  // ─── 5️⃣ Typing indicator ─────────────────────────────────────────────────
  const handleTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (!hasSentTypingTrue) {
        wsRef.current.send(JSON.stringify({ typing: true }));
        setHasSentTypingTrue(true);
      }
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ typing: false }));
      }
      setIsTyping(false);
      setHasSentTypingTrue(false);
    }, 5000);
  };

  // Group messages by date
  const grouped = groupByDate(messages);

  return (
    // ─── Outer “100vh minus Navbar” container ─────────────────────────────────
    // Assume parent <main> already applies e.g. `pt-[5vh]` to leave room for Navbar,
    // and `lg:ml-64` (or similar) to leave room for a desktop Sidebar.
    <div className="h-[80vh] flex flex-col md:px-4 py-4">
      {/* Inner “chat box” with padding (never touches very bottom) */}
      <div className="max-w-6xl mx-auto flex-1 bg-gray-800 dark:bg-gray-900 rounded-xl overflow-hidden">
        <div className="h-full flex">
          {/* ─── Contacts Pane (Left) ────────────────────────────────────────────── */}
          <div
            className={`
              fixed inset-y-0 left-0 z-40 w-100 md:w-[30vw]
              
              bg-gray-900 dark:bg-gray-800
              border-r border-gray-700
              transform transition-transform duration-300 ease-in-out
              ${showContacts ? 'translate-x-0' : '-translate-x-full'}
              md:relative md:translate-x-0 md:inset-auto md:z-auto
              flex flex-col
            `}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-100">Messages</h2>
              {/* Back button on mobile */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition"
                onClick={() => setShowContacts(false)}
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search + “New Message” */}
            <div className="px-6 py-4 space-y-3">
              <div className="relative text-gray-400">
                <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search threads…"
                  value={searchThreads}
                  onChange={(e) => setSearchThreads(e.target.value)}
                  className="
                    w-full pl-10 pr-3 py-2
                    bg-gray-800 dark:bg-gray-700
                    border border-gray-600 dark:border-gray-600
                    rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    text-gray-100
                  "
                />
              </div>

              <button
                onClick={() => setShowNewMessageModal(true)}
                className="
                  w-full flex items-center justify-center gap-2
                  py-2 bg-blue-600 hover:bg-blue-700
                  text-white font-semibold rounded-lg shadow-sm
                  transition
                "
              >
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
              {loadingThreads ? (
                <p className="px-6 py-4 text-center text-gray-400">
                  Loading…
                </p>
              ) : filteredThreads.length === 0 ? (
                <p className="px-6 py-4 text-center text-gray-400">
                  No conversations
                </p>
              ) : (
                <ul className="px-4 space-y-2">
                  {filteredThreads.map((t) => {
                    const id = t.type === 'group' ? t.group.id : t.user.id;
                    const name =
                      t.type === 'group' ? t.group.name : t.user.username;
                    const lastAt = t.last_message_time
                      ? formatDistanceToNow(parseISO(t.last_message_time), {
                          addSuffix: true,
                        })
                      : '';
                    const unread = t.unread_count > 0;
                    const isActive =
                      activeThread &&
                      activeThread.type === t.type &&
                      ((t.type === 'group' &&
                        activeThread.group.id === id) ||
                        (t.type === 'direct' &&
                          activeThread.user.id === id));

                    return (
                      <li
                        key={`${t.type}-${id}`}
                        onClick={() => {
                          setActiveThread(t);
                          setShowContacts(false);
                        }}
                        className={`
                          flex items-center justify-between p-3 rounded-lg cursor-pointer
                          ${
                            isActive
                              ? 'bg-gray-700'
                              : 'hover:bg-gray-700'
                          }
                          transition-colors
                        `}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`
                              h-10 w-10 flex-shrink-0 rounded-full overflow-hidden
                              bg-gray-600
                              ring-2 ${
                                isActive
                                  ? 'ring-blue-500'
                                  : 'ring-transparent'
                              }
                              transition
                            `}
                          >
                            {t.type === 'direct' && t.user.profile_image ? (
                              <img
                                src={t.user.profile_image}
                                alt={t.user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-white font-bold">
                                {name[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-medium text-gray-100 truncate">
                              {name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {t.last_message || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs text-gray-400">
                            {lastAt}
                          </span>
                          {unread && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs">
                              {t.unread_count}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ─── Chat Pane (Right) ───────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col w-80 md:w-[40vw]">
            {/* Mobile Chat Header */}
            <div
              className={`
                flex items-center justify-between px-6 py-4 border-b border-gray-700
                bg-gray-900 dark:bg-gray-900 md:hidden
              `}
            >
              <button
                onClick={() => setShowContacts(true)}
                className="p-2 rounded-lg hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h3 className="text-lg font-semibold text-gray-100 truncate">
                {activeThread
                  ? activeThread.type === 'direct'
                    ? activeThread.user.username
                    : activeThread.group.name
                  : 'Select a conversation'}
              </h3>
              <div style={{ width: 24 }} />
            </div>

            {activeThread ? (
              <>
                {/* Desktop Chat Header */}
                <div className="hidden md:flex items-center px-8 py-5 border-b border-gray-700 bg-gray-900">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-600 overflow-hidden">
                      {activeThread.type === 'direct' &&
                      activeThread.user.avatar_url ? (
                        <img
                          src={activeThread.user.avatar_url}
                          alt={activeThread.user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-white font-bold">
                          {activeThread.type === 'direct'
                            ? activeThread.user.username[0].toUpperCase()
                            : activeThread.group.name[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-100 truncate">
                      {activeThread.type === 'direct'
                        ? activeThread.user.username
                        : activeThread.group.name}
                    </h3>
                  </div>
                </div>

                {/* Message List */}
                <div
                  ref={inboxMessagesRef}
                  className="flex-1 overflow-y-auto px-8 py-6 space-y-4 bg-gray-800 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent"
                >
                  {loadingMessages ? (
                    <p className="text-center text-gray-400">Loading…</p>
                  ) : Object.keys(grouped).length === 0 ? (
                    <p className="text-center text-gray-400">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    Object.entries(grouped).map(([day, msgs]) => (
                      <div key={day} className="space-y-3">
                        <div className="sticky top-0 px-4 py-2 bg-gray-900 text-center text-xs font-medium text-gray-400 uppercase rounded-lg">
                          {day}
                        </div>
                        {msgs.map((m, idx) => (
                          <div
                            key={idx}
                            className={`flex ${
                              m.is_own ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`
                                max-w-xs md:max-w-lg px-4 py-2 rounded-2xl shadow
                                ${
                                  m.is_own
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-100'
                                }
                              `}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {m.content}
                              </p>
                              <div
                                className={`mt-1 text-2xs ${
                                  m.is_own
                                    ? 'text-blue-200'
                                    : 'text-gray-400'
                                }`}
                              >
                                {new Date(m.sent_at).toLocaleTimeString([], {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <p className="text-sm text-gray-400 px-8">
                            {activeThread.user.username} is typing…
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Composer (fixed) */}
                <div className="bg-gray-900 border-t border-gray-700 px-8 py-4 flex items-center">
                  <input
                    type="text"
                    placeholder="Type your message…"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="
                      flex-1 px-4 py-2
                      bg-gray-800
                      border border-gray-700
                      rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500
                      text-gray-100
                    "
                  />
                  <button
                    onClick={handleSend}
                    className="
                      ml-4 p-2 rounded-full
                      bg-blue-600 hover:bg-blue-700
                      text-white shadow transition
                    "
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              // Placeholder if no thread selected
              <div className="flex-1 flex items-center justify-center bg-gray-800">
                <p className="text-gray-400">Select a conversation to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onUserSelect={async (user) => {
          const existingThread = threads.find(
            (t) => t.type === 'direct' && t.user.id === user.id
          );
          if (existingThread) {
            setActiveThread(existingThread);
          } else {
            const newThread = {
              type: 'direct',
              user,
              last_message: '',
              last_message_time: new Date().toISOString(),
              unread_count: 0,
            };
            setThreads((prev) => [newThread, ...prev]);
            setActiveThread(newThread);
          }
          setShowContacts(false);
          navigate(`/inbox?to=${user.id}`);
        }}
      />
    </div>
  );
}
