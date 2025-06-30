// src/pages/Inbox.jsx
import React, { useCallback, useRef,  useState, useEffect  } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { ClipboardIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Virtuoso } from 'react-virtuoso';
import { sendReaction } from '../requests';
import api from '../api';import {fetchThreads,fetchThread,fetchPublicProfile, editMessage, deleteMessage, fetchMarketplaceItemDetail, reportMessage, markMessageSeen,} from '../requests';
import { createWebSocket } from '../utils/websocket';
import NewMessageModal from '../components/NewMessageModal';
import { formatDistanceToNow, parseISO, isToday, isYesterday, isValid } from 'date-fns';
import {Search,Plus,ArrowLeft,Edit2,Trash2,Check,X,Flag,MessageCircle,Eye, ThumbsUp, Paperclip, Loader} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import BidForm from '../components/BidForm';
import MarkSoldModal from '../components/MarkSoldModal';
import BidList from '../components/BidList';
import ReportModal from '../components/ReportModal';



/**
 * Group an array of messages into “Today” / “Yesterday” / date string.
 */
function groupByDate(items = []) {
  return items.reduce((acc, n) => {
    // 1) pick your date field (notifications use created_at)
    const rawDate = n.sent_at ?? n.timestamp ?? n.date;

   // 2) if it's missing, bucket under "Unknown"
    if (!rawDate) {
      (acc['Unknown'] ||= []).push(n);
      return acc;
    }

    // 3) try/catch parseISO so bad strings don’t crash
    let parsed;
   try {
      parsed = parseISO(rawDate);
    } catch {
      (acc['Unknown'] ||= []).push(n);
     return acc;
    }

    // 4) if parseISO gives an invalid date, treat as unknown
    if (!isValid(parsed)) {
      (acc['Unknown'] ||= []).push(n);
      return acc;
    }

    // 5) now group into Today / Yesterday / full date
    const day = isToday(parsed)
     ? 'Today'
      : isYesterday(parsed)
      ? 'Yesterday'
      : parsed.toLocaleDateString();

    (acc[day] ||= []).push(n);
    return acc;
  }, {});
}



function buildVirtualItems(messages) {
  const grouped = groupByDate(messages);
  const items = [];
  Object.entries(grouped).forEach(([day, msgs]) => {
    items.push({ type: 'header', label: day });
    msgs.forEach(m => items.push({ type: 'message', data: m }));
  });
  return items;
}

/**
 * Utility to check whether a given URL looks like an image.
 */
function isImageUrl(url) {
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
}

export default function Inbox({ setSidebarMinimized }) {
  const [isDragging, setIsDragging] = useState(false);
  const wsRef = useRef(null);
  const [wsReady, setWsReady] = useState(false);
  const[messageId, setMessageId] = useState(null);
  const[reportedUser, setReportedUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const inboxMessagesRef = useRef(null);
  const typingTimeout = useRef(null);

  const [reportOpen, setReportOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [threadsPage, setThreadsPage] = useState({
    results: [], next: null, previous: null, count: 0
  });
  const [isLoadingMoreThreads, setIsLoadingMoreThreads] = useState(false);
  const autoOpenUserId = searchParams.get('to');
  const autoItemId = searchParams.get('item');
  // ─ Threads & messages state
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const virtualItems = React.useMemo(
  () => buildVirtualItems(messages),
  [messages]
);
// Block of code doesnt work as expected so an after thought for now it links to the search box also commendted btw
// const [searchMessages, setSearchMessages] = useState('');
// const filteredMessages = React.useMemo(() => {
//   if (!searchMessages.trim()) return messages;
//   return messages.filter(m =>
//     m.content.toLowerCase().includes(searchMessages.toLowerCase())
//   );
// }, [messages, searchMessages]);
// const virtualItems = React.useMemo(
//   () => buildVirtualItems(filteredMessages),
//   [filteredMessages]
// );
/**
 * Returns a stable key for any given thread, so we can
 * stash per‐thread drafts in localStorage under "draft_<key>".
 */
function getThreadKey(thread) {
  if (!thread || !thread.type) return '';

  switch (thread.type) {
    case 'direct':
      // `thread.user` is the "other" user in a DM
      return `direct-${thread.user.id}`;

    case 'marketplace':
      // `conversation_id` is unique per marketplace convo
      return `marketplace-${thread.conversation_id}`;

    case 'group':
      // if you have group chats, use their id
      return `group-${thread.group.id}`;

    default:
      // fallback to the raw thread.id if you have one
      return `thread-${thread.id ?? ''}`;
  }
}
const messagesRef = useRef(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  async function loadThreadsPage(url = 'messages/threads/') {
    setIsLoadingMoreThreads(true);
    try {
      const page = await fetchThreads(url, { page_size: 20 });
            // ── 1) normalize each thread into a common shape ───────────────────
    const normalized = page.results.map(t => ({
      ...t,
      // for direct: API returns "user"; for marketplace: it returns "other_user"
      other_user: t.type === 'direct' ? t.user : t.other_user,
      // bring profile image into a single field
      avatar: t.type === 'direct'
        ? t.user.profile_image
        : t.item_thumbnail,
      // display name: username vs. item title
      display_name: t.type === 'direct'
        ? t.user.username
        : t.type === 'marketplace'
          ? t.item_title
          : t.group.name,
    }));
    setThreadsPage(prev => ({
      results: normalized,         // now hold your normalized array
      next:    page.next,
      previous: page.previous,
      count:   page.count,
    }));
      return page;
    } finally {
      setIsLoadingMoreThreads(false);
    }
  }
      async function loadMessagesPage(url = null) {
        setIsLoadingMoreMessages(true);
        try {
              const otherId = activeThread.type === 'direct'
      // direct → the thread.user is the other person
      ? activeThread.user.id
      // marketplace → the thread.other_user is the other person
      : activeThread.other_user.id;

   // now fetch using the right user ID
    const page = await fetchThread(
      otherId,
      { conversation: activeThread.conversation_id, url }
    );
          // prepend or replace
          setMessagesPage(prev => ({
            results: url
              ? [...page.results, ...prev.results]
              : [...page.results],
            next: page.next,
          }));
          // map into your messages shape
          const mapped = page.results.map(m => ({
            id:              m.id,
            content:         m.content,
            sender_id:       m.sender_id,
            recipient_id:    m.recipient_id,
            message_type:    m.message_type,
            sent_at:         m.sent_at,
            is_read:         m.is_read,
            is_deleted:      m.is_deleted,
            attachment_url:  m.attachment_url,
            edited_at:       m.edited_at,
            isModerator:     m.is_moderator_message,
            reactions_summary: m.reactions_summary,
            user_reactions:    m.user_reactions,
            subject:           m.subject,
            is_own: String(m.sender_id) === String(currentUser.id),
          }));
          setMessages(prev => url ? [...mapped, ...prev] : mapped);
        } finally {
          setIsLoadingMoreMessages(false);
        }
      }
  async function handleReact(messageId, emoji) {
    let previousMessages = [];

    setMessages(prevMessages => {
      previousMessages = prevMessages; // Capture previous state for rollback

      return prevMessages.map(m => {
        if (m.id !== messageId) return m;

        const userReacted = (m.user_reactions || []).includes(emoji);
        const newUserReactions = userReacted
          ? m.user_reactions.filter(e => e !== emoji)
          : [...(m.user_reactions || []), emoji];

        let newReactionsSummary = [...(m.reactions_summary || [])];

        const existingIndex = newReactionsSummary.findIndex(r => r.emoji === emoji);

        if (existingIndex >= 0) {
          const updated = { ...newReactionsSummary[existingIndex] };
          updated.count += userReacted ? -1 : 1;

          if (updated.count <= 0) {
            newReactionsSummary.splice(existingIndex, 1); // remove if 0
          } else {
            newReactionsSummary[existingIndex] = updated;
          }
        } else if (!userReacted) {
          newReactionsSummary.push({ emoji, count: 1 });
        }

        return {
          ...m,
          user_reactions: newUserReactions,
          reactions_summary: newReactionsSummary
        };
      });
    });

    try {
      await sendReaction('message_id', messageId, emoji);
    } catch {
      showNotification('Could not add reaction', 'error');
      // Revert to previous state
      setMessages(previousMessages);
    }
  }

  // ─ Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentTypingTrue, setHasSentTypingTrue] = useState(false);
  // We'll disable typing events until user starts typing:
  const messageListRef = useRef(null);

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
  const [messagesPage, setMessagesPage] = useState({ results: [], next: null });
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);

  function extractUrls(text) {
    if (typeof text !== 'string') return [];

    // match http(s)://… or www.… up to whitespace or some closing punctuation
    const urlRegex = /((https?:\/\/)|(www\.))[^\s<>"']+/gi;
    const raw = text.match(urlRegex) || [];
    return raw
      .map(u => u.replace(/[.,!?:;]+$/, ''))         // strip trailing .,;!?: 
      .map(u => (u.startsWith('www.') ? 'https://' + u : u))
      .filter(u => {
        try { new URL(u); return true; }
        catch { return false; }
      });
  }
 // 1️⃣ Fetch threads initially (and auto-open if needed)
useEffect(() => {
  let cancelled = false;
  setLoadingThreads(true);

  async function init() {
    const page = await loadThreadsPage();
    if (cancelled) return;

    // Priority 1: marketplace thread if both `to` and `item` params are present
    if (autoOpenUserId && autoItemId) {
      console.log({ autoOpenUserId, autoItemId, threads: page.results });
      const existingMp = page.results.find(t =>
        t.type === 'marketplace' &&
        String(t.other_user.public_id) === String(autoOpenUserId) &&
        (
          String(t.item_id) === String(autoItemId) ||
          String(t.item?.id) === String(autoItemId) ||
          String(t.conversation_id) === String(autoItemId)
        )
      );
      if (existingMp) {
        setActiveThread(existingMp);
        setShowContacts(false);
        return;
      }

      // No existing → create a “virtual” marketplace thread in UI only
      try {
        const [user, itemResp] = await Promise.all([
          fetchPublicProfile(autoOpenUserId),
          fetchMarketplaceItemDetail(autoItemId),
        ]);
        const item = itemResp.data || itemResp;

        setActiveThread({
          type: 'marketplace',
          conversation_id: undefined,  // we’ll get it once they actually send
          item_id:          item.id,
          item_title:       item.title,
          item_status:      item.status,
          item_bidding:     item.is_bidding,
          item_thumbnail:   item.thumbnail,
          item_price:       item.price,
          starting_bid:     item.starting_bid,
          highest_bid:      item.highest_bid,
          buyer:            { id: user.id },
          seller:           item.seller,
          other_user:       user,
          last_message:     '',
          last_message_time:new Date().toISOString(),
          unread_count:     0,
          is_virtual:       true,
        });
        setShowContacts(false);

        // → **Removed** the empty‐message POST here. 
        //    We’ll only create the conversation when the user actually sends.

      } catch (err) {
        console.error('Error initializing marketplace thread:', err);
      }
      return;
    }

    // Priority 2: direct message if only `to` param is present
    if (autoOpenUserId && !autoItemId) {
      let t = page.results.find(
        t => t.type === 'direct' &&
             String(t.user.public_id) === String(autoOpenUserId)
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
        setThreadsPage(prev => ({
          ...prev,
          results: [t, ...(prev.results || [])],
        }));
      }
      setActiveThread(t);
      setShowContacts(false);
      return;
    }
  }

  init()
    .catch(console.error)
    .finally(() => {
      if (!cancelled) setLoadingThreads(false);
    });

  return () => {
    cancelled = true;
  };
}, [autoOpenUserId, autoItemId, setSidebarMinimized]);

      // ── 1️⃣ Auto‐scroll to bottom on thread switch ───────────────────────
      useEffect(() => {
        if (!activeThread) return;

        const list = messageListRef.current;
          if (!list) return;

          // recompute all sizes before scrolling
          list.resetAfterIndex(0, false);

          // compute final index (accounting for “load earlier” at index 0)
          const lastIndex =
            virtualItems.length - 1 + (messagesPage.next ? 1 : 0);

          // scroll once the new layout is painted
          requestAnimationFrame(() => {
            list.scrollToItem(lastIndex, 'end');
          });
  }, [activeThread, virtualItems.length, messagesPage.next]);

// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣ Filter “threads” list as user types
useEffect(() => {
  let threads = threadsPage?.results || [];

  // Inject activeThread if missing from the list
  if (activeThread) {
    const exists = threads.some(t => {
      if (t.type === 'marketplace' && activeThread.type === 'marketplace') {
        return t.conversation_id === activeThread.conversation_id;
      }
      if (t.type === 'direct' && activeThread.type === 'direct') {
        return t.user?.id === activeThread.user?.id;
      }
      return false;
    });

    if (!exists) {
      threads = [activeThread, ...threads];
    }
  }

  // Deduplicate threads by stable key
  const uniqueThreads = Array.from(
    new Map(
      threads.map(t => {
        const key =
          t.type === 'direct'
            ? `direct-${t.user?.id}`
            : t.type === 'marketplace'
            ? `mp-${t.conversation_id}`
            : `group-${t.group?.id}`;
        return [key, t];
      })
    ).values()
  );

  // Filter by search input
  const filtered = uniqueThreads.filter(t => {
    let name;
    if (t.type === 'direct') {
      name = t.user?.username || '';
    } else if (t.type === 'marketplace') {
      name = t.item_title || '';
    } else {
      name = t.group?.name || '';
    }
    return name.toLowerCase().includes(searchThreads.toLowerCase());
  });

  setFilteredThreads(filtered);
}, [searchThreads, threadsPage?.results, activeThread]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3️⃣ Fetch messages + connect WebSocket on thread select :contentReference[oaicite:2]{index=2}
  useEffect(() => {
    if (!activeThread || !currentUser?.id) return;
    let cancelled = false;
    setLoadingMessages(true);
    setContent('');
    setAttachmentFile(null);
    setUserHasInteracted(false); // Reset interaction flag so prefill won't trigger typing

    async function loadMessagesAndConnect() {
      
              // ── 1) Load messages (errors here no longer block the socket)
        try {
          setMessagesPage({ results: [], next: null });
          await loadMessagesPage();
        } catch (err) {
        console.error('Failed to load messages:', err);
        } finally {
          if (!cancelled) setLoadingMessages(false);
        }

        // ── 2) Open WebSocket channel
        if (wsRef.current) wsRef.current.close();
        const token   = localStorage.getItem('accessToken');
        const otherId = activeThread.type === 'direct'
          ? activeThread.user.id
          : activeThread.other_user.id;
        const sortedIds = [currentUser.id, otherId]
          .map((id) => String(id))
          .sort((a, b) => (a < b ? -1 : 1));
       const chatKey = `${sortedIds[0]}_${sortedIds[1]}`;
          const socket = createWebSocket(`/ws/chat/${chatKey}/`, token);
      wsRef.current = socket;

      // 2a) Track ready state for the Send button:
      socket.onopen = () => {
        setWsReady(true);
      };
      socket.onerror = (e) => {
        setWsReady(false);
      };
      socket.onclose = (e) => {
        setWsReady(false);
      };

        socket.onmessage = (e) => {
          const data = JSON.parse(e.data);
          // New chat message
          if (data.message_id && data.type === "message.new") {
            const incoming = {
              id: data.message_id,
              content: data.content,
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
              reactions_summary: data.reactions_summary || [],
              user_reactions:    data.user_reactions    || [],
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
              )            )                      }
          else if (data.event === 'reaction') {
            setMessages(prev =>
              prev.map(m => {
                if (String(m.id) !== String(data.messageId)) return m;
                // bump summary count
                const summary = [...(m.reactions_summary||[])];
                const idx = summary.findIndex(r=>r.emoji===data.emoji);
                if (idx > -1) summary[idx].count += 1;
                else summary.push({emoji:data.emoji,count:1});
                // add to your own reactions if it’s you
                const userReacts = data.userId===currentUser.id
                  ? [...(m.user_reactions||[]), data.emoji]
                  : m.user_reactions;
                return { ...m, reactions_summary:summary, user_reactions:userReacts };
              }))
            }
    
        };
        socket.onclose = () => {};
        socket.onerror = (err) => console.error('WebSocket error:', err);

        // After loading messages, mark any unseen as “seen”
        setTimeout(() => {
          if (!cancelled) {
            messages.forEach((m) => {
              if (
                m.recipient_id === currentUser.id &&   // I’m actually the recipient
                !m.is_read
              ) {
                markMessageSeen(m.id).catch(() => {});
              }
            });
          }
        }, 200);

    }

    loadMessagesAndConnect();
    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeThread, currentUser.id]);

  

  // ─────────────────────────────────────────────────────────────────────────────
  // 4️⃣ Always scroll to bottom whenever messages (or typing) change :contentReference[oaicite:3]{index=3}
  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;

    // force re‐layout with any newly measured rows
    list.resetAfterIndex(0, false);

    // compute final index
    const lastIndex = messagesPage.next
      ? virtualItems.length
      : virtualItems.length - 1;

    // and scroll on next frame
    requestAnimationFrame(() => {
      list.scrollToItem(lastIndex, 'end');
    });
  }, [virtualItems.length, isTyping, messagesPage.next]);


  // ─────────────────────────────────────────────────────────────────────────────
  // 5️⃣ Send a message or upload an attachment :contentReference[oaicite:4]{index=4}
// ── Updated handleSendOrUpload ────────────────────────────────────────────
  const handleSendOrUpload = async () => {
    // 1️⃣ Handle file attachments
    if (attachmentFile) {
      setIsUploading(true);
      const previewUrl = URL.createObjectURL(attachmentFile);

      const formData = new FormData();
      formData.append(
        'recipient_id',
        activeThread.type === 'direct'
          ? activeThread.user.id
          : activeThread.other_user.id
      );
      formData.append('conversation', activeThread.conversation_id || '');
      if (activeThread.type === 'marketplace' && autoItemId) {
        formData.append('item', autoItemId);
      }
      formData.append('content', content);
      formData.append('attachment_file', attachmentFile);

      try {
        const resp = await api.post('/messages/upload/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const newMsg = resp.data;

        setMessages(prev => [
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
            reactions_summary: [],
            user_reactions: [],
            subject: newMsg.subject,
          },
        ]);
      } catch (err) {
        console.error('Upload failed', err);
        alert('Failed to send attachment.');
      } finally {
        URL.revokeObjectURL(previewUrl);
        setIsUploading(false);
        setContent('');
        setAttachmentFile(null);
        setUserHasInteracted(false);
      }
    }

    // 2️⃣ Handle text-only messages
    else if (content.trim()) {
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

      // 2a. Optimistically add message
      setMessages(prev => [...prev, tempMsg]);

      // 2b. Try WebSocket first
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            command: 'new_message',
            toUserId:
              activeThread.type === 'direct'
                ? activeThread.user.id
                : activeThread.other_user.id,
            content,
            item: autoItemId,
            conversationId:
              activeThread.type === 'marketplace'
                ? activeThread.conversation_id
                : undefined,
            message_type: 'user',
          })
        );
      }

      // 2c. Fallback to REST if WebSocket not open
      else {
        console.warn('WebSocket not open, using fallback REST endpoint');

        try {
          const response = await api.post('/messages/', {
            recipient_id:
              activeThread.type === 'direct'
                ? activeThread.user.id
                : activeThread.other_user.id,
            content,
             item: activeThread.type === 'marketplace' ? autoItemId : undefined,
            message_type: 'user',
            conversation:
              activeThread.type === 'marketplace'
                ? activeThread.conversation_id
                : undefined,
          });

          const newMsg = response.data;

          setMessages(prev => [
            ...prev.slice(0, -1), // remove temp
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
              reactions_summary: [],
              user_reactions: [],
              subject: newMsg.subject,
            },
          ]);
        } catch (err) {
          console.error('Fallback REST message failed', err);
          showNotification('Failed to send message. Try again.', 'error');
        }
      }

      // 2d. Clear composer
      setContent('');
      setUserHasInteracted(false);
    }

    // 3️⃣ Clear draft if no attachment
    if (!attachmentFile) {
      localStorage.removeItem(`draft_${getThreadKey(activeThread)}`);
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

  const handleReport = async (msg) => {
    console.log(msg);
    setMessageId(msg.id);
    setReportedUser(msg.sender_id);
    setReportOpen(true);
    
  };

  
    // create a debounced save function
    const saveDraft = useDebouncedCallback((key, text) => {
      if (text.trim()) {
        localStorage.setItem(key, text);
      } else {
        localStorage.removeItem(key);
      }
    }, 500);

    // on content or thread change, load or queue save:
 useEffect(() => {
   if (!activeThread) return;
   const key = `draft_${getThreadKey(activeThread)}`;
   const existing = localStorage.getItem(key);
   // on thread switch, immediately populate (or clear) the composer
   setContent(existing ?? '');
 }, [activeThread]);

 useEffect(() => {
   if (!activeThread) return;

  const key = `draft_${getThreadKey(activeThread)}`;
   // every time content changes, schedule (debounced) save or removal
   saveDraft(key, content);
 }, [content, activeThread, saveDraft]);
  // Group messages by date
  const grouped = groupByDate(messages);

  async function selectThread(thread) {
  setActiveThread(thread);
  setLoadingMessages(true);
  setMessages([]);           // clear UI immediately
  try {
    
       const { results } = await fetchThread(
     thread.type==='direct' ? thread.user.id : thread.other_user.id,
     thread.type==='marketplace' ? { conversation: thread.conversation_id } : {}
   );
    const mapped = results.map(msg => ({
      id:               msg.id,
      content:          msg.content,
      message_type:     msg.message_type,
      sender_id:        msg.sender_id,
      recipient_id:     msg.recipient_id,
      is_read:          msg.is_read,
      attachment_url:   msg.attachment_url,
      edited_at:        msg.edited_at,
      is_deleted:       msg.is_deleted,
      sent_at:          msg.sent_at,
      is_own:           String(msg.sender_id) === String(currentUser.id),
      isModerator:      msg.is_moderator_message,
      subject:          msg.subject || '',
      reactions_summary: msg.reactions_summary  || [],
      user_reactions:    msg.user_reactions    || [],
    }));
    setMessages(mapped);
  } catch (err) {
    console.error('Failed to fetch thread', err);
    showNotification('Could not load messages for that thread','error');
  } finally {
    setLoadingMessages(false);
  }
  setShowContacts(false);
}

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return bytes + ' B';
}

 // only mark new incoming messages as “seen”
 useEffect(() => {
   // skip first render
  if (!messagesRef.current) {
     messagesRef.current = messages;
     return;
   }
   // for each message now, if unread & not own, mark as seen
   messages.forEach((m) => {
     if (
      m.recipient_id === currentUser.id &&   // I’m actually the recipient
      !m.is_read
    ) {
      markMessageSeen(m.id).catch(() => {});
    }
   });
   messagesRef.current = messages;
 }, [messages]);

  return (
    <div className="h-[80vh] w-full flex flex-col md:flex-row md:px-6 py-4">
      <Helmet>
        <title>Inbox | Tealives</title>
      </Helmet>
      {/* Chat container */}
      <div className="max-w-7xl mx-auto flex-1 bg-gray-800 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
        <div className="h-full flex">
          {/* ─── Contacts Pane (Left) ────────────────────────────────────────────── */}
          <div
            className={`
              fixed inset-y-0 left-0 z-40 w-full md:w-[35vw] lg:w-[28vw]
              bg-gray-50 dark:bg-gray-800 my-[10vh] md:my-0
              border-r border-gray-700
              transform transition-transform duration-300 ease-in-out
              ${showContacts ? 'translate-x-0' : '-translate-x-full'}
              md:relative md:translate-x-0 md:inset-auto md:z-auto
              flex flex-col
            `}
          >
            {/* Header */}
            <div className="px-6 py-5	bg-gray-200 border-gray-700 flex items-center justify-between dark:bg-gray-800">
              <h2 className="text-xl font-semibold dark:text-gray-100 text-gray-600">Messages</h2>
  
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
                    bg-gray-200 dark:bg-gray-700
                    border border-gray-600 dark:border-gray-600
                    rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    dark:text-gray-100 text-800
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
                    console.log(t, "price")
                    let displayName, subtitle;
                    if (t.type === 'direct') {
                      displayName = t.user.username;
                      subtitle = t.last_message || 'No messages yet';
                    } else if (t.type === 'marketplace') {
                      displayName = `${t.item_title} with ${t.other_user.username}`;
                      subtitle = [
                        t.item_price != null && !isNaN(parseFloat(t.item_price))
                          ? `$${parseFloat(t.item_price).toFixed(2)}` : '',
                        t.last_message || 'No messages yet'
                      ].join(' • ');
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
                    const isActive = (() => {
                      if (!activeThread || t.type !== activeThread.type) return false;
                      if (t.type === 'direct') {
                        // compare the two users
                        return t.user?.id === activeThread.user?.id;
                      }
                      if (t.type === 'marketplace') {
                        // compare conversation IDs
                        return String(t.conversation_id) === String(activeThread.conversation_id);
                      }
                      if (t.type === 'group') {
                        return t.group?.id === activeThread.group?.id;
                      }
                      return false;
                    })();

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
                            // Clear unread count for selected thread
                              // Clear unread count for selected thread
                            if (t.unread_count > 0) {
                              setThreadsPage(prev => ({
                                ...prev,
                                results: prev.results.map(p =>
                                  p === t ? { ...p, unread_count: 0 } : p
                                ),
                              }));
                            }
                          setActiveThread(t);
                          setShowContacts(false);
                        }}
                        className={`
                          flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer
                          ${
                            isActive
                              ? 'dark:bg-gray-700 bg-gray-300 border-l-4 border-blue-500'
                              : 'hover:dark:bg-gray-300 hover:bg-gray-300'
                          }
                          transition-colors 
                        `}
                      >
                        <div className="flex items-center space-x-3 min-w-0 max-w-[75%]">
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
                                loading="lazy"
                                decoding="async"
                                src={t.user.profile_image}
                                alt={t.user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : t.type === 'marketplace' ? (
                              t.item_thumbnail ? (
                                <img
                                  loading="lazy"
                                  decoding="async"
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
                            <p className="text-sm font-semibold dark:text-gray-100 text-gray-700 truncate">
                              {displayName}
                            </p>
                            <p className="text-xs dark:text-gray-400 text-gray-500 truncate">
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
          <div   className={`
    flex-1 flex flex-col min-h-0
    w-full md:w-[50vw] lg:w-[50vw]
    bg-white dark:bg-gray-900
    ${isDragging ? 'ring-2 ring-blue-400' : ''}
  `}
        
  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={e => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setAttachmentFile(file);
  }}
>
            {/* Mobile Chat Header */}
            <div
              className={`
                flex items-center justify-between px-6 py-4 border-b border-gray-700
                dark:bg-gray-900 bg-gray-300 md:hidden
              `}
            >
              <button
                onClick={() => {setShowContacts(true);  setActiveThread(null);}}
                className="p-2 rounded-lg hover:bg-gray-700 transition"
                type="button"
              >
                <ArrowLeft className="w-5 h-5 dark:text-gray-400 text-gray-800 " />
              </button>
              <h3 className="text-lg font-semibold dark:text-gray-100  text-gray-800 truncate">
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
                  <div className="hidden md:flex items-center px-8 py-5 border-b border-gray-700 bg-gray-200 dark:bg-gray-900">
                    <div className="flex items-center space-x-5">
                      <div className="h-12 w-12 rounded-full bg-gray-600 dark:bg-gray-900 overflow-hidden flex items-center justify-center text-white font-bold">
                        {activeThread.user.username[0].toUpperCase()}
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-100 dark: text-gray-900 truncate">
                        {activeThread.user.username}
                      </h3>
                    </div>
                  </div>
                )}

                {/* ─── DESKTOP MARKETPLACE HEADER ────────────────── */}
                {activeThread.type === 'marketplace' && (
                  <div className="hidden md:flex items-center px-8 py-5 border-b border-blue-500 dark:text-white">
                    {/* Thumbnail */}
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {activeThread.item_thumbnail ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={activeThread.item_thumbnail}
                          alt={activeThread.item_title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        activeThread.conversation_id ?
                        <span className="flex h-full w-full items-center justify-center text-white text-lg">
                                  🛒
                                </span> :
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
                        navigate(`/marketplace/${activeThread.item_id}`)
                      }
                      className="underline"
                    >
                      View Item
                    </button>
                  </div>
                )}

                {/* ─── MESSAGE LIST ───────────────────────────────── */}
                {/* ─── MESSAGE LIST ───────────────────────────────── */}
    <div
      ref={inboxMessagesRef}
      className="flex-1 min-h-0 bg-white dark:bg-gray-900"
    >
      {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <Loader className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
      ) : virtualItems.length === 0 ? (
        <p className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          No messages yet. Say hello!{console.log(virtualItems)}
        </p>
      ) : (
        <>
    {/*         {/* ── Message‐search bar ───────────────────────────────────────────── *}
    <div className="px-6 py-2 border-b border-gray-700 bg-gray-900">
      <div className="relative text-gray-400">
        <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5" />
        <input
          type="text"
          placeholder="Search messages…"
          value={searchMessages}
          onChange={e => setSearchMessages(e.target.value)}
          className="
            w-full pl-12 pr-4 py-2
            bg-gray-800 border border-gray-600 rounded-lg
            text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
      </div>
    </div> */}
      <Virtuoso
        style={{ height: '100%' }}
        data={virtualItems}
        initialTopMostItemIndex={virtualItems.length - 1}
        // when the top is reached, load older messages
        startReached={() => {
          if (messagesPage.next) loadMessagesPage(messagesPage.next);
        }}
        // how many pixels of buffer to render above/below
        overscan={200}
        // always scroll to bottom on new messages
        followOutput
        // render a “Load earlier” header at the very top
        components={{
          Header: () =>
            messagesPage.next ? (
              <div
                className="p-2 text-center text-gray-400 cursor-pointer"
                onClick={() => loadMessagesPage(messagesPage.next)}
              >
                {isLoadingMoreMessages
                  ? 'Loading earlier…'
                  : 'Load earlier messages'}
              </div>
            ) : null,
        }}
        // how to render each item
        itemContent={(index, item) => {
          if (item.type === 'header') {
            return (
              <div className="sticky top-0 px-4 py-1 bg-gray-900 bg-opacity-85 text-center text-xs font-semibold text-gray-300 uppercase rounded">
                {item.label}
              </div>
            );
          }
          // for message bubbles, you can extract your existing JSX
          const m = item.data;
          const isOwner = m.sender_id === currentUser.id;
          const isSystem = m.message_type === 'system';
          
            // Message bubble
            const isEditing = editingMessageId === m.id;
            const isDeleted = m.is_deleted;
            const isModerator = m.isModerator;


            if (
              m.recipient_id === currentUser.id &&   // I’m actually the recipient
              !m.is_read
            ) {
              markMessageSeen(m.id).catch(() => {});
            }
              const links = extractUrls(m.content);

              const copyToClipboard = async (txt) => {
                try { await navigator.clipboard.writeText(txt); }
                catch { /* fallback or ignore */ }
              };
    
          return (
            <div
              key={m.id}
              className={`flex w-full ${
                isSystem
                  ? 'justify-center'
                  : isOwner
                  ? 'justify-end'
                  : 'justify-start'
              } px-4 py-2`}
            >
              
                {/* ─── SYSTEM BUBBLE ─────────────────────────── */}
                {isSystem ? (
                  <div className="max-w-[60%] bg-gray-600 text-gray-200 italic text-center px-4 py-2 rounded-lg">
                    {m.content}
                  </div>
                ) : (
                  /** ─── USER / MODERATOR BUBBLE ──────────── **/
                  <div
                    className={`
                      ${isOwner ? 'ml-auto group' : ''} relative group
                      max-w-[70%]
                      ${
                        isModerator
                          ? 'bg-purple-600 text-white'
                          : isOwner
                          ? 'dark:bg-blue-500 bg-[#298F9B] text-white'
                          : 'dark:bg-gray-700   bg-[#6c7b5a] text-gray-100'
                      }
                      ${
                        isDeleted
                          ? 'opacity-50 italic'
                          : 'opacity-100'
                      }
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
                    {/* Attachment */}
                    {m.attachment_url && (
                      isImageUrl(m.attachment_url) ? (
                        <img
                          src={m.attachment_url}
                            loading="lazy"
                            decoding="async"
                          className="mb-2 rounded max-h-40"
                        />
                      ) : (
                        <a
                          href={m.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mb-2 underline text-sm"
                        >
                          {m.attachment_url.split('/').pop()}
                        </a>
                      )
                    )}

                    {/* Edit mode / deleted */}
                    {isDeleted ? (
                      <p className="text-sm">
                        This message was deleted
                      </p>
                    ) : isEditing ? (
                    <div className="relative">
                      <div
                          contentEditable
                        suppressContentEditableWarning
                        className="
                          px-5 py-3
                          bg-slate-600 border border-slate-500
                            rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400
                          text-gray-100 whitespace-pre-wrap break-words
                        "
                        onInput={e => {
                         // pull plain text out
                            const text = e.currentTarget.innerText;
                            setEditingContent(text);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit(m.id);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditing();
                          }
                        }}
                      onBlur={() => saveEdit(m.id)}
                        ref={el => {
                          if (el) {
                              el.innerText = editingContent;
                           // move caret to end
                              const range = document.createRange();
                              const sel = window.getSelection();
                            range.selectNodeContents(el);
                            range.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(range);
                          }
                        }}
                      />
                     {/* Explicit save/cancel buttons (optional) */}
                      <div className="absolute top-1 right-1 flex space-x-1">
                        <button
                          onClick={() => saveEdit(m.id)}
                          className="p-1 text-green-400 hover:bg-slate-700 rounded transition"
                          aria-label="Save"
                        >
                          <Check className="w-4 h-4" />
                          </button>
                        <button
                          onClick={cancelEditing}
                            className="p-1 text-red-400 hover:bg-slate-700 rounded transition"
                          aria-label="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    ) : (
                      <>
                        {/* Moderator subject */}
                        {isModerator && m.subject && (
                          <div className="mb-1 text-sm font-semibold">
                            <MessageCircle className="inline w-4 h-4 mr-1" />
                            {m.subject}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words ">
                          {m.content}
                        </p>
                        {/* Auto-link preview */}
                          {links.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {links.map(url => {
                      const hostname = new URL(url).hostname.replace(/^www\./, '');
                      return (
                        <div
                          key={url+Math.random()}
                          className="
                            flex items-center justify-between
                            border border-gray-300 dark:border-gray-700
                            bg-gray-50 dark:bg-gray-800
                            rounded-lg px-3 py-2
                            transition-colors hover:bg-gray-100 dark:hover:bg-gray-700
                          "
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center space-x-2 truncate"
                          >
                            <span
                              className="
                                inline-block px-2 py-0.5
                                bg-blue-100 dark:bg-blue-700
                                text-blue-800 dark:text-blue-100
                                text-xs font-semibold
                                rounded
                              "
                            >
                              {hostname}
                            </span>
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                              {url}
                            </span>
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(url)}
                            className="
                              ml-2 p-1 rounded-full
                              text-gray-500 dark:text-gray-400
                              hover:bg-gray-200 dark:hover:bg-gray-700
                              transition-colors
                            "
                            title="Copy link"
                          >
                            <ClipboardIcon className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                            <span className="text-gray-300">
                              (edited)
                            </span>
                          )}
                        {isOwner && (
                          m.is_read
                            ? <Check className="w-4 h-4 text-blue-300 ml-1" />
                            : <Check className="w-4 h-4 text-gray-500 ml-1" />
                        )}
                        </div>
                      </>
                    )}

                    {/* ─── Reactions UI ───────────────────────────── */}
                    <div className="mt-2 flex items-center space-x-1">
                      {(m.reactions_summary || []).map(r => (
                        <button
                          key={r.emoji}
                          onClick={() => handleReact(m.id, r.emoji)}
                          className={`
                            flex items-center space-x-1 px-1 py-0.5 rounded
                            ${
                              (m.user_reactions || []).includes(r.emoji)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }
                            transition
                          `}
                        >
                          <span>{r.emoji}</span>
                          <span className="text-2xs">{r.count}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => handleReact(m.id, '👍')}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition cursor-pointer"
                      >
                        <ThumbsUp size={14} />
                      </button>
                    </div>

                    {/* Edit/Delete for own messages */}
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

                    {/* Report for incoming user messages */}
                    {!isDeleted &&
                      !isOwner &&
                      !isModerator &&
                      m.message_type === 'user' && (
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReport(m)}
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
        }}
      />
     
     </>
  )}
</div>

{isTyping && (
  <div className="px-8 py-2 text-sm italic text-gray-400">
    {activeThread.type === 'direct'
      ? `${activeThread.user.username} is typing…`
      : 'Someone is typing…'}
  </div>
)}

                {/* ─── MARKETPLACE QUICK-ACTIONS / COMPOSER ─────────────────────── */}
                {activeThread.type === 'marketplace' && (activeThread.item_bidding || currentUser.id === activeThread.seller.id) && (
                  <div className="dar:text-white px-4 py-2 flex items-center justify-between space-x-4">
                    {currentUser.id === activeThread.buyer.id && activeThread.item_bidding &&
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
                    {currentUser.id === activeThread.seller.id &&  (
                      <>
                        {activeThread.item_bidding && (<button
                          onClick={() => setShowSeeBidsModal(true)}
                          className="
                            bg-white text-blue-600 px-3 py-1 rounded-lg hover:bg-gray-100
                            text-sm font-semibold transition
                          "
                          type="button"
                        >
                          See Bids
                        </button>)}
                        {currentUser.id === activeThread.seller.id && (
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
                  </div>
                )}

                {/* ─── COMPOSER ───────────────────────────────────────────────── */}
                    {attachmentFile && (
                        <div
                          className="
                            flex flex-col sm:flex-row sm:items-center
                            p-3 mb-4 rounded-lg
                            bg-gray-100 dark:bg-gray-800
                            space-y-2 sm:space-y-0 sm:space-x-4
                          "
                        >
                          {/* Thumbnail or PDF icon */}
                          {isImageUrl(attachmentFile.name) ? (
                            <img
                              src={URL.createObjectURL(attachmentFile)}
                              alt="Preview"
                                loading="lazy"
                                decoding="async"
                              className="w-full sm:w-24 h-24 object-cover rounded"
                            />
                          ) : (
                            <div
                              className="
                                flex items-center justify-center
                                w-full sm:w-24 h-24
                                bg-gray-200 dark:bg-gray-700
                                rounded
                              "
                            >
                              <Paperclip className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}

                          {/* Name & size */}
                          <div className="flex-grow min-w-0">
                            <p
                              className="
                                text-sm font-medium truncate
                                text-gray-900 dark:text-gray-100
                              "
                            >
                              {attachmentFile.name}
                            </p>
                            <p
                              className="
                                text-xs truncate
                                text-gray-500 dark:text-gray-400
                              "
                            >
                              {formatFileSize(attachmentFile.size)}
                            </p>
                          </div>

                          {/* Remove button or spinner */}
                          <div className="flex-shrink-0">
                            {isUploading ? (
                              <Loader className="w-6 h-6 text-gray-500 dark:text-gray-400 animate-spin" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAttachmentFile(null)}
                                className="
                                  p-1 rounded-full
                                  text-red-500 hover:text-red-400
                                  bg-red-50 hover:bg-red-100
                                  dark:bg-red-900 dark:hover:bg-red-800
                                "
                                aria-label="Remove attachment"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                <div
                  className={`
                    ${
                      activeThread.type === 'marketplace'
                        ? 'bg-gray-900 border-t border-blue-500'
                        : 'bg-gray-900 border-t border-gray-700'
                    }
                    px-8 py-4 flex items-end space-x-4 
                  `}
                  style={{alignItems: 'center'}}
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
                    className="     flex-1 px-4 py-3     bg-gray-800     border border-gray-700     rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400     text-gray-100 resize-none   " />
                    {/*content.trim() && (
                      <span className="absolute bottom-1 right-3 text-2xs text-gray-400 italic">
                        Draft saved
                      </span>
                     )*/}
                    <label className="relative inline-block">
                        <Paperclip className="w-6 h-6 text-gray-400 hover:text-gray-200 cursor-pointer transition" />
                        <input
                          type="file"
                          accept="image/*,application/pdf"
     onChange={e => {
       const file = e.target.files?.[0];
       if (file) {
         if (file.size > MAX_ATTACHMENT_SIZE) {
           alert(`File too big. Maximum is ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
           e.target.value = null;
           return;
         }
         setAttachmentFile(file);
       }
     }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </label>
                  <button
                    onClick={handleSendOrUpload}
                    disabled={!wsReady}    
                    title={!wsReady ? 'Connecting…' : 'Send'}
                    className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md transition  cursor-pointer"
                    type="button"
                  >
                    <label className="cursor-pointer">Send</label>
                  </button>
                    
                </div>
              </>
            ) : (
              // Placeholder if no thread selected
              <div className="flex-1 flex items-center justify-center 	bg-gray-200 dark:bg-gray-800">
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
   // check for an existing in the paginated list
   let existing = threadsPage.results.find(
     t => t.type==='direct' && t.user.id===user.id
   );
   if (!existing) {
     existing = {
       type: 'direct',
       user,
       last_message: '',
       last_message_time: new Date().toISOString(),
       unread_count: 0
     };
     // inject into page results
     setThreadsPage(p => ({
       ...p,
       results: [existing, ...p.results]
     }));
   }
   setActiveThread(existing);
   setShowContacts(false);
   navigate(`/inbox?to=${user.p_id}`);
 }}
      />

      {/* ─── PLACE BID MODAL (stub) ───────────────────────────────────────────── */}
      {showPlaceBidModal && (<BidForm 
      itemId={activeThread.id}
          currentHighestBid={activeThread.highest_bid}
          onBidSuccess={loadItem}
          startBid={activeThread.starting_bid}
           /> )}

      {/* ─── SEE BIDS MODAL (stub) ────────────────────────────────────────────── */}
            {showSeeBidsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">All Bids</h3>
            <p><BidList  itemId={activeThread.item_id} /></p>
            <button
              onClick={() => setShowSeeBidsModal(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {reportOpen && <ReportModal
              isOpen={reportOpen}
              contentType="message"
              reportedUser={reportedUser}
              contentId={messageId}
              onClose={() => setReportOpen(false)}
              onSuccess={() => {
                setReportOpen(false);
                setMessageId(null);
                showNotification(
                  'Thanks for reporting. Our team will review shortly.',
                  'success'
                );
              }}
            />}

      {/* ─── MARK SOLD MODAL (stub) ───────────────────────────────────────────── */}
      {showMarkSoldModal && <MarkSoldModal itemId={activeThread.item_id} onClose={() => setShowMarkSoldModal(false)}/>}
    </div>
  );
}
