// src/pages/Inbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import api from '../api';

import {
  fetchThreads,
  fetchThread,
  fetchPublicProfile,
  editMessage,
  deleteMessage,
  reportMessage,
  markMessageSeen,
} from '../requests';
import { createWebSocket } from '../utils/websocket';
import NewMessageModal from '../components/NewMessageModal';
import { formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';
import {
  Search,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  Check,
  X,
  Flag,
  MessageCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

/**
 * Group an array of messages into “Today” / “Yesterday” / date string.
 */
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

/**
 * Utility to check whether a given URL looks like an image.
 */
function isImageUrl(url) {
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
}

export default function Inbox({ setSidebarMinimized }) {
  const wsRef = useRef(null);
  const inboxMessagesRef = useRef(null);
  const typingTimeout = useRef(null);

  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoOpenUserId = searchParams.get('to');
  const autoConvoId = searchParams.get('conversation');

  // ─ Threads & messages state
  const [threads, setThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // ─ Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentTypingTrue, setHasSentTypingTrue] = useState(false);
  // We'll disable typing events until user starts typing:
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // ─ “Contacts Pane” toggle on mobile (<768px)
  const [showContacts, setShowContacts] = useState(true);

  // ─ Composer
  const [content, setContent] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

  // ─ “New Message” modal
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  // ─ Search inside threads
  const [searchThreads, setSearchThreads] = useState('');

  // ─ Edit mode state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // ─ Quick‐action modals (Place Bid, See Bids, Mark Sold)
  const [showPlaceBidModal, setShowPlaceBidModal] = useState(false);
  const [showSeeBidsModal, setShowSeeBidsModal] = useState(false);
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1️⃣ Fetch threads initially (and auto-open if needed) :contentReference[oaicite:0]{index=0}
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

        // Auto-open marketplace thread if conversation ID is in URL
        if (autoConvoId) {
          const t = list.find(
            (t) =>
              t.type === 'marketplace' &&
              String(t.conversation_id) === String(autoConvoId)
          );
          if (t) {
            setActiveThread(t);
            setShowContacts(false);
            return;
          }
        }
        // Auto-open direct DM if "to" user ID in URL
        if (autoOpenUserId) {
          let t = list.find(
            (t) => t.type === 'direct' && String(t.user.id) === String(autoOpenUserId)
          );
          if (!t) {
            const u = await fetchPublicProfile(autoOpenUserId);
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
  }, [autoOpenUserId, autoConvoId, setSidebarMinimized]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2️⃣ Filter “threads” list as user types :contentReference[oaicite:1]{index=1}
  useEffect(() => {
    const filtered = threads.filter((t) => {
      let name;
      if (t.type === 'direct') {
        name = t.user.username;
      } else if (t.type === 'marketplace') {
        name = t.item_title;
      } else {
        name = t.group.name;
      }
      return name.toLowerCase().includes(searchThreads.toLowerCase());
    });
    setFilteredThreads(filtered);
  }, [searchThreads, threads]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3️⃣ Fetch messages + connect WebSocket on thread select :contentReference[oaicite:2]{index=2}
  useEffect(() => {
    if (!activeThread) return;
    let cancelled = false;
    setLoadingMessages(true);
    setContent('');
    setAttachmentFile(null);
    setUserHasInteracted(false); // Reset interaction flag so prefill won't trigger typing

    async function loadMessagesAndConnect() {
      try {
        let raw;
        // ── Direct DM ──
        if (activeThread.type === 'direct') {
          raw = await fetchThread(activeThread.user.id);
          const mapped = raw.map((msg) => ({
            id: msg.id,
            content: msg.content,
            message_type: msg.message_type,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            is_read: msg.is_read,
            attachment_url: msg.attachment_url,
            edited_at: msg.edited_at,
            is_deleted: msg.is_deleted,
            sent_at: msg.sent_at,
            is_own: String(msg.sender_id) === String(currentUser.id),
            isModerator: msg.is_moderator_message,
            subject: msg.subject || '',
          }));
          if (!cancelled) setMessages(mapped);
          // No prefill for direct
        }
        // ── Marketplace thread ──
        else if (activeThread.type === 'marketplace') {
          raw = await fetchThread(activeThread.other_user.id, {
            conversation: activeThread.conversation_id,
          });
          const mapped = raw.map((msg) => ({
            id: msg.id,
            content: msg.content,
            message_type: msg.message_type,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            is_read: msg.is_read,
            attachment_url: msg.attachment_url,
            edited_at: msg.edited_at,
            is_deleted: msg.is_deleted,
            sent_at: msg.sent_at,
            is_own: String(msg.sender_id) === String(currentUser.id),
            isModerator: msg.is_moderator_message,
            subject: msg.subject || '',
          }));
          if (!cancelled) setMessages(mapped);

          // Prefill if no messages
          if (mapped.length === 0) {
            setContent('Hi, is this item still available?');
            // We do NOT send a typing event for this prefill; wait until user edits.
          }
        }
        // ── Group chat (if used) ──
        else {
          navigate(`/group-chat/${activeThread.group.id}`);
          return;
        }

        // Clean up any existing socket
        if (wsRef.current) {
          wsRef.current.close();
        }

        // Build WebSocket channel key
        const token = localStorage.getItem('accessToken');
        const otherId =
          activeThread.type === 'direct'
            ? activeThread.user.id
            : activeThread.other_user.id;
        const sortedIds = [currentUser.id, otherId]
          .map((id) => String(id))
          .sort((a, b) => (a < b ? -1 : 1));
        const chatKey = `${sortedIds[0]}_${sortedIds[1]}`;
        const socket = createWebSocket(`/ws/chat/${chatKey}/`, token);
        wsRef.current = socket;

        socket.onmessage = (e) => {
          const data = JSON.parse(e.data);
          // New chat message
          if (data.message_id) {
            const incoming = {
              id: data.message_id,
              content: data.message,
              message_type: data.message_type,
              sender_id: data.sender_id,
              recipient_id: data.recipient_id,
              is_read: data.is_read,
              attachment_url: data.attachment_url,
              edited_at: data.edited_at || null,
              is_deleted: data.is_deleted || false,
              sent_at: data.sent_at || new Date().toISOString(),
              is_own: String(data.sender_id) === String(currentUser.id),
              isModerator: data.is_moderator_message || false,
              subject: data.subject || '',
            };
            setMessages((prev) => {
              if (incoming.is_own) {
                // Replace temp-ID if exists
                return prev.map((m) =>
                  m.is_own && String(m.id).startsWith('temp-') ? incoming : m
                );
              } else {
                return [...prev, incoming];
              }
            });
          }
          // Typing indicator
          else if (
            typeof data.typing === 'boolean' &&
            String(data.sender_id) === String(activeThread.other_user?.id || activeThread.user?.id)
          ) {
            setIsTyping(data.typing);
          }
          // Edit or delete events
          else if (data.type === 'edit_message') {
            setMessages((prev) =>
              prev.map((m) =>
                String(m.id) === String(data.message_id)
                  ? { ...m, content: data.new_content, edited_at: data.edited_at }
                  : m
              )
            );
          } else if (data.type === 'delete_message') {
            setMessages((prev) =>
              prev.map((m) =>
                String(m.id) === String(data.message_id)
                  ? { ...m, is_deleted: true }
                  : m
              )
            );
          }
        };
        socket.onclose = () => {};
        socket.onerror = (err) => console.error('WebSocket error:', err);

        // After loading messages, mark any unseen as “seen”
        setTimeout(() => {
          if (!cancelled) {
            messages.forEach((m) => {
              if (!m.is_own && m.is_read === false) {
                markMessageSeen(m.id).catch(() => {});
              }
            });
          }
        }, 200);

        // Scroll to bottom
        setTimeout(() => {
          inboxMessagesRef.current?.scrollTo(
            0,
            inboxMessagesRef.current.scrollHeight
          );
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
  }, [activeThread]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4️⃣ Always scroll to bottom whenever messages (or typing) change :contentReference[oaicite:3]{index=3}
  useEffect(() => {
    if (inboxMessagesRef.current) {
      inboxMessagesRef.current.scrollTo(
        0,
        inboxMessagesRef.current.scrollHeight
      );
    }
  }, [messages, isTyping]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5️⃣ Send a message or upload an attachment :contentReference[oaicite:4]{index=4}
  const handleSendOrUpload = async () => {
    // If user picked a file, do a REST upload first
    if (attachmentFile) {
      const formData = new FormData();
      formData.append(
        'recipient',
        activeThread.type === 'direct'
          ? activeThread.user.id
          : activeThread.other_user.id
      );
      formData.append('conversation', activeThread.conversation_id || '');
      formData.append('content', content);
      formData.append('attachment_file', attachmentFile);

      try {
        const resp = await api.post(
          '/messages/upload/',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );
        const newMsg = resp.data;
        setMessages((prev) => [
          ...prev,
          {
            id: newMsg.id,
            content: newMsg.content,
            message_type: newMsg.message_type,
            sender_id: newMsg.sender_id,
            recipient_id: newMsg.recipient_id,
            is_read: newMsg.is_read,
            attachment_url: newMsg.attachment_url,
            edited_at: newMsg.edited_at,
            is_deleted: newMsg.is_deleted,
            sent_at: newMsg.sent_at,
            is_own: true,
            isModerator: newMsg.is_moderator_message,
            subject: newMsg.subject,
          },
        ]);
      } catch (err) {
        console.error('Upload failed', err);
        alert('Failed to send attachment.');
      } finally {
        setContent('');
        setAttachmentFile(null);
        setUserHasInteracted(false);
      }
    }
    // Otherwise, send a text-only message via WebSocket
    else if (content.trim()) {
      // Create a temp message
      const tempMsg = {
        id: `temp-${Date.now()}`,
        content,
        message_type: 'user',
        sender_id: currentUser.id,
        recipient_id:
          activeThread.type === 'direct'
            ? activeThread.user.id
            : activeThread.other_user.id,
        is_read: true,
        attachment_url: null,
        edited_at: null,
        is_deleted: false,
        sent_at: new Date().toISOString(),
        is_own: true,
        isModerator: false,
        subject: '',
      };
      setMessages((prev) => [...prev, tempMsg]);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            command: 'new_message',
            toUserId:
              activeThread.type === 'direct'
                ? activeThread.user.id
                : activeThread.other_user.id,
            content: content,
            conversationId:
              activeThread.type === 'marketplace'
                ? activeThread.conversation_id
                : undefined,
            message_type: 'user',
          })
        );
      }
      setContent('');
      setUserHasInteracted(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6️⃣ Typing indicator (only after actual user input) :contentReference[oaicite:5]{index=5}
  const handleTyping = () => {
    // If user hasn't interacted yet, first keystroke should NOT fire typing=true
    if (!userHasInteracted) {
      setUserHasInteracted(true);
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (!hasSentTypingTrue) {
        wsRef.current.send(
          JSON.stringify({
            typing: true,
            sender_id: currentUser.id,
          })
        );
        setHasSentTypingTrue(true);
      }
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            typing: false,
            sender_id: currentUser.id,
          })
        );
      }
      setIsTyping(false);
      setHasSentTypingTrue(false);
    }, 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 7️⃣ Handle Edit / Delete / Report :contentReference[oaicite:6]{index=6}
  const startEditing = (msg) => {
    if (!msg.is_own || msg.is_deleted || msg.message_type !== 'user') return;
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEdit = async (msgId) => {
    const original = messages.find((m) => String(m.id) === String(msgId));
    if (!original) {
      cancelEditing();
      return;
    }
    if (
      original.content.trim() === editingContent.trim() ||
      !editingContent.trim()
    ) {
      cancelEditing();
      return;
    }

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        String(m.id) === String(msgId)
          ? { ...m, content: editingContent, edited_at: new Date().toISOString() }
          : m
      )
    );
    setEditingMessageId(null);
    setEditingContent('');

    try {
      await editMessage(msgId, editingContent);
    } catch {
      console.error('Edit failed');
    }
  };

  const handleDelete = async (msgId) => {
    if (msgId == null) return;
    setMessages((prev) =>
      prev.map((m) =>
        String(m.id) === String(msgId) ? { ...m, is_deleted: true } : m
      )
    );
    try {
      await deleteMessage(msgId);
    } catch {
      console.error('Delete failed');
    }
  };

  const handleReport = async (msgId) => {
    if (!window.confirm('Report this message?')) return;
    try {
      await reportMessage(msgId);
      alert('Message reported to moderation.');
    } catch {
      console.error('Report failed');
      alert('Failed to report message.');
    }
  };

  // Group messages by date
  const grouped = groupByDate(messages);

  return (
    <div className="h-[80vh] flex flex-col md:px-6 py-4">
      {/* Chat container */}
      <div className="max-w-5xl mx-auto flex-1 bg-gray-800 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
        <div className="h-full flex">
          {/* ─── Contacts Pane (Left) ────────────────────────────────────────────── */}
          <div
            className={`
              fixed inset-y-0 left-0 z-40 w-full md:w-[28vw]
              bg-gray-900 dark:bg-gray-800
              border-r border-gray-700
              transform transition-transform duration-300 ease-in-out
              ${showContacts ? 'translate-x-0' : '-translate-x-full'}
              md:relative md:translate-x-0 md:inset-auto md:z-auto
              flex flex-col
            `}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-100">Messages</h2>
              {/* Back button on mobile */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition"
                onClick={() => setShowContacts(false)}
                type="button"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search + “New Message” */}
            <div className="px-6 py-4 space-y-4">
              <div className="relative text-gray-400">
                <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search threads…"
                  value={searchThreads}
                  onChange={(e) => setSearchThreads(e.target.value)}
                  className="
                    w-full pl-12 pr-3 py-2
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
                type="button"
              >
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
              {loadingThreads ? (
                <p className="px-6 py-4 text-center text-gray-400">Loading…</p>
              ) : filteredThreads.length === 0 ? (
                <p className="px-6 py-4 text-center text-gray-400">
                  No conversations
                </p>
              ) : (
                <ul className="px-2 space-y-1">
                  {filteredThreads.map((t) => {
                    let displayName, subtitle;
                    if (t.type === 'direct') {
                      displayName = t.user.username;
                      subtitle = t.last_message || 'No messages yet';
                    } else if (t.type === 'marketplace') {
                      displayName = t.item_title;
                      subtitle = `${t.other_user.username}: ${
                        t.last_message || 'No messages yet'
                      }`;
                    } else {
                      displayName = t.group.name;
                      subtitle = t.last_message || 'No messages yet';
                    }

                    const lastAt = t.last_message_time
                      ? formatDistanceToNow(parseISO(t.last_message_time), {
                          addSuffix: true,
                        })
                      : '';
                    const unread = t.unread_count > 0;
                    const isActive =
                      activeThread &&
                      t.type === activeThread.type &&
                      ((t.type === 'direct' &&
                        activeThread.user?.id === t.user?.id) ||
                        (t.type === 'marketplace' &&
                          String(activeThread.conversation_id) ===
                            String(t.conversation_id)) ||
                        (t.type === 'group' &&
                          activeThread.group?.id === t.group?.id));

                    const keyVal =
                      t.type === 'direct'
                        ? `direct-${t.user.id}`
                        : t.type === 'marketplace'
                        ? `mp-${t.conversation_id}`
                        : `group-${t.group.id}`;

                    return (
                      <li
                        key={keyVal}
                        onClick={() => {
                          setActiveThread(t);
                          setShowContacts(false);
                        }}
                        className={`
                          flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer
                          ${
                            isActive
                              ? 'bg-gray-700 border-l-4 border-blue-500'
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
                                isActive ? 'ring-blue-500' : 'ring-transparent'
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
                            ) : t.type === 'marketplace' ? (
                              t.item_thumbnail ? (
                                <img
                                  src={t.item_thumbnail}
                                  alt={t.item_title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-white text-lg">
                                  🛒
                                </span>
                              )
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-white font-bold">
                                {displayName[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-semibold text-gray-100 truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {unread && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs">
                              {t.unread_count}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{lastAt}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ─── Chat Pane (Right) ───────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col w-full md:w-[45vw] lg:w-[50vw]">
            {/* Mobile Chat Header */}
            <div
              className={`
                flex items-center justify-between px-6 py-4 border-b border-gray-700
                bg-gray-900 md:hidden
              `}
            >
              <button
                onClick={() => setShowContacts(true)}
                className="p-2 rounded-lg hover:bg-gray-700 transition"
                type="button"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h3 className="text-lg font-semibold text-gray-100 truncate">
                {activeThread
                  ? activeThread.type === 'direct'
                    ? activeThread.user.username
                    : activeThread.type === 'marketplace'
                    ? activeThread.item_title
                    : activeThread.group.name
                  : 'Select a conversation'}
              </h3>
              <div style={{ width: 24 }} />
            </div>

            {activeThread ? (
              <>
                {/* ─── DESKTOP CHAT HEADER ───────────────────────── */}
                {activeThread.type === 'direct' && (
                  <div className="hidden md:flex items-center px-8 py-5 border-b border-gray-700 bg-gray-900">
                    <div className="flex items-center space-x-5">
                      <div className="h-12 w-12 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center text-white font-bold">
                        {activeThread.user.username[0].toUpperCase()}
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-100 truncate">
                        {activeThread.user.username}
                      </h3>
                    </div>
                  </div>
                )}

                {/* ─── DESKTOP MARKETPLACE HEADER ────────────────── */}
                {activeThread.type === 'marketplace' && (
                  <div className="hidden md:flex items-center px-8 py-5 border-b border-blue-500 bg-blue-600 text-white">
                    {/* Thumbnail */}
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {activeThread.item_thumbnail ? (
                        <img
                          src={activeThread.item_thumbnail}
                          alt={activeThread.item_title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500">No Image</span>
                      )}
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="text-2xl font-semibold truncate">
                        {activeThread.item_title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>
                          Price:{' '}
                          <span className="font-bold">${activeThread.item_price}</span>
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs uppercase ${
                            activeThread.item_status === 'available'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {activeThread.item_status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/marketplace/${activeThread.item}`)
                      }
                      className="underline"
                    >
                      View Item
                    </button>
                  </div>
                )}

                {/* ─── MESSAGE LIST ───────────────────────────────── */}
                <div
                  ref={inboxMessagesRef}
                  className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gray-800 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent"
                >
                  {loadingMessages ? (
                    <p className="text-center text-gray-400">Loading…</p>
                  ) : Object.keys(grouped).length === 0 ? (
                    <p className="text-center text-gray-400">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    Object.entries(grouped).map(([day, msgs]) => (
                      <div key={day} className="space-y-4">
                        <div className="sticky top-0 px-4 py-1 bg-gray-900 bg-opacity-85 text-center text-xs font-semibold text-gray-300 uppercase rounded">
                          {day}
                        </div>
                        {msgs.map((m) => {
                          const isOwner =
                            Number(m.sender_id) === Number(currentUser.id);
                          const isEditing = editingMessageId === m.id;
                          const isDeleted = m.is_deleted;
                          const isModerator = m.isModerator;
                          const isSystem = m.message_type === 'system';

                          // Mark incoming as “seen” as soon as they render
                          if (!m.is_own && m.is_read === false) {
                            markMessageSeen(m.id).catch(() => {});
                          }

                          return (
                            <div
                              key={m.id}
                              className={`
                                flex w-full 
                                ${
                                  isSystem
                                    ? 'justify-center'
                                    : isOwner
                                    ? 'justify-end'
                                    : 'justify-start'
                                }
                                px-4
                              `}
                            >
                              {/** ─── SYSTEM BUBBLE ─────────────────────────── **/}
                              {isSystem ? (
                                <div className="max-w-[60%] bg-gray-600 text-gray-200 italic text-center px-4 py-2 rounded-lg">
                                  {m.content}
                                </div>
                              ) : (
                                /** ─── USER / MODERATOR BUBBLE ──────────── **/
                                <div
                                  className={`
                                    ${isOwner ? 'ml-auto' : ''} relative group
                                    max-w-[70%]
                                    ${
                                      isModerator
                                        ? 'bg-purple-600 text-white'
                                        : isOwner
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-700 text-gray-100'
                                    }
                                    ${isDeleted ? 'opacity-50 italic' : 'opacity-100'}
                                    px-5 py-3
                                    transition-colors shadow-sm
                                    ${
                                      isModerator
                                        ? 'rounded-lg'
                                        : isOwner
                                        ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                                        : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
                                    }
                                  `}
                                >
                                  {/** Attachment (if any) **/}
                                  {m.attachment_url && isImageUrl(m.attachment_url) && (
                                    <a
                                      href={m.attachment_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block mb-2"
                                    >
                                      <img
                                        src={m.attachment_url}
                                        alt="attachment"
                                        className="max-h-40 rounded"
                                      />
                                    </a>
                                  )}
                                  {m.attachment_url && !isImageUrl(m.attachment_url) && (
                                    <a
                                      href={m.attachment_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block mb-2 text-sm underline"
                                    >
                                      Download Attachment
                                    </a>
                                  )}

                                  {/** If in edit-mode **/}
                                  {isDeleted ? (
                                    <p className="text-sm">This message was deleted</p>
                                  ) : isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        value={editingContent}
                                        onChange={(e) =>
                                          setEditingContent(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            saveEdit(m.id);
                                          } else if (e.key === 'Escape') {
                                            cancelEditing();
                                          }
                                        }}
                                        className="
                                          flex-1 px-3 py-1
                                          bg-slate-600 border border-slate-500
                                          rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400
                                          text-gray-100
                                        "
                                        type="text"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => saveEdit(m.id)}
                                        className="p-1 text-green-400 hover:bg-slate-600 rounded transition"
                                        type="button"
                                      >
                                        <Check className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="p-1 text-red-400 hover:bg-slate-600 rounded transition"
                                        type="button"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>
                                  ) : (
                                    /** Normal display **/ <>
                                      {isModerator && m.subject && (
                                        <div className="mb-1 text-sm font-semibold">
                                          <MessageCircle className="inline w-4 h-4 mr-1" />
                                          {m.subject}
                                        </div>
                                      )}
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {m.content}
                                      </p>
                                      <div className="mt-1 flex items-center space-x-1 text-2xs">
                                        <span
                                          className={
                                            isOwner
                                              ? 'text-blue-100'
                                              : isModerator
                                              ? 'text-purple-100'
                                              : 'text-gray-400'
                                          }
                                        >
                                          {new Date(m.sent_at).toLocaleTimeString(
                                            [],
                                            { hour: 'numeric', minute: '2-digit' }
                                          )}
                                        </span>
                                        {m.edited_at && (
                                          <span className="text-gray-300">(edited)</span>
                                        )}
                                        {m.is_read && isOwner && (
                                          <Eye className="w-4 h-4 text-gray-300 ml-1" />
                                        )}
                                      </div>
                                    </>
                                  )}

                                  {/** Edit/Delete icons: your own, if user bubble **/}
                                  {!isDeleted &&
                                    !isEditing &&
                                    isOwner &&
                                    m.message_type === 'user' && (
                                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => startEditing(m)}
                                          className="p-1 rounded hover:bg-slate-600 transition"
                                          type="button"
                                        >
                                          <Edit2 className="w-4 h-4 text-white" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(m.id)}
                                          className="p-1 rounded hover:bg-slate-600 transition"
                                          type="button"
                                        >
                                          <Trash2 className="w-4 h-4 text-white" />
                                        </button>
                                      </div>
                                    )}

                                  {/** Report icon: incoming & not moderator **/}
                                  {!isDeleted &&
                                    !isOwner &&
                                    !isModerator &&
                                    m.message_type === 'user' && (
                                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleReport(m.id)}
                                          className="p-1 rounded hover:bg-slate-600 transition"
                                          type="button"
                                        >
                                          <Flag className="w-4 h-4 text-white" />
                                        </button>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {isTyping && (
                          <p className="text-sm text-gray-400 px-8">
                            {activeThread.type === 'direct'
                              ? activeThread.user.username
                              : activeThread.other_user.username}{' '}
                            is typing…
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* ─── MARKETPLACE QUICK-ACTIONS / COMPOSER ─────────────────────── */}
                {activeThread.type === 'marketplace' && (
                  <div className="bg-blue-600 text-white px-8 py-4 flex items-center justify-between space-x-4">
                    {currentUser.id === activeThread.buyer.id &&
                      activeThread.item_status === 'available' && (
                        <button
                          onClick={() => setShowPlaceBidModal(true)}
                          className="
                            bg-white text-blue-600 px-3 py-1 rounded-lg hover:bg-gray-100
                            text-sm font-semibold transition
                          "
                          type="button"
                        >
                          Place Bid
                        </button>
                      )}
                    {currentUser.id === activeThread.seller.id && (
                      <>
                        <button
                          onClick={() => setShowSeeBidsModal(true)}
                          className="
                            bg-white text-blue-600 px-3 py-1 rounded-lg hover:bg-gray-100
                            text-sm font-semibold transition
                          "
                          type="button"
                        >
                          See Bids
                        </button>
                        {activeThread.item_status === 'available' && (
                          <button
                            onClick={() => setShowMarkSoldModal(true)}
                            className="
                              bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600
                              text-sm font-semibold transition
                            "
                            type="button"
                          >
                            Mark as Sold
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() =>
                        navigate(`/marketplace/${activeThread.item}`)
                      }
                      className="
                        underline text-sm hover:text-gray-200 transition
                      "
                    >
                      View Item
                    </button>
                  </div>
                )}

                {/* ─── COMPOSER ───────────────────────────────────────────────── */}
                <div
                  className={`
                    ${
                      activeThread.type === 'marketplace'
                        ? 'bg-gray-900 border-t border-blue-500'
                        : 'bg-gray-900 border-t border-gray-700'
                    }
                    px-8 py-4 flex items-end space-x-4
                  `}
                >
                  <textarea
                    rows={1}
                    placeholder="Type your message…"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendOrUpload();
                      }
                    }}
                    className="
                      flex-1 px-4 py-3
                      bg-gray-800
                      border border-gray-700
                      rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400
                      text-gray-100 resize-none
                    "
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      setAttachmentFile(e.target.files[0]);
                    }}
                    className="text-sm text-gray-400"
                  />
                  <button
                    onClick={handleSendOrUpload}
                    className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md transition"
                    type="button"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              // Placeholder if no thread selected
              <div className="flex-1 flex items-center justify-center bg-gray-800">
                <p className="text-gray-400 text-lg">
                  Select a conversation to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── NEW MESSAGE MODAL ────────────────────────────────────────────────── */}
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
          setShowNewMessageModal(false);
          navigate(`/inbox?to=${user.id}`);
        }}
      />

      {/* ─── PLACE BID MODAL (stub) ───────────────────────────────────────────── */}
      {showPlaceBidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Place a Bid</h3>
            <p>/* Implement your “Place Bid” form here */</p>
            <button
              onClick={() => setShowPlaceBidModal(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── SEE BIDS MODAL (stub) ────────────────────────────────────────────── */}
      {showSeeBidsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">All Bids</h3>
            <p>/* Implement your “See Bids” list here */</p>
            <button
              onClick={() => setShowSeeBidsModal(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── MARK SOLD MODAL (stub) ───────────────────────────────────────────── */}
      {showMarkSoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Mark as Sold</h3>
            <p>/* Implement your “Mark as Sold” confirmation here */</p>
            <button
              onClick={() => setShowMarkSoldModal(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
