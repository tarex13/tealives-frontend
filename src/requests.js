// requests.js
import api from './api';

// 🛡️ Auth
export const login = async (credentials) => {
  const response = await api.post('login/', credentials);
  const { access, refresh, user } = response.data;
  const authUser = { access, refresh, user };
  localStorage.setItem('user', JSON.stringify(authUser));
  localStorage.setItem('accessToken', access);
  return authUser;
};

// 🌆 Fetch all supported city codes
export const fetchCities = async () => {
  const res = await api.get('cities/');
  return res.data;
};


export async function markMessageSeen(messageId) {
  return api.post(`/messages/${messageId}/mark-seen/`);
}

export const toggleFollow = userId =>
  api.post(`users/${userId}/follow/`).then(r => r.data);

// ⭐ Business Reviews (for business profiles)
export const fetchBusinessReviews = async (businessId) => {
  const res = await api.get(`reviews/?business=${businessId}`);
  return res.data;
};

export function fetchBusinessTypes() {
  return api.get('user/business-types/').then(res => res.data);
}

// 📊 Business Analytics (your /analytics/ endpoint)
export const fetchBusinessAnalytics = async () => {
  const res = await api.get('analytics/');
  return res.data;
};

export const register = async (payload) => {
  const response = await api.post('register/', payload);
  return response.data;
};

// 📬 Messaging
export const fetchThreads = async (url = 'messages/threads/', params = {}) => {
  // returns { count, next, previous, results }
  const res = await api.get(url, { params });
  return res.data;
};
export const fetchThread = async (userId, opts = {}) => {
  // returns { count, next, previous, results }
  const params = {};
  if (opts.conversation) params.conversation = opts.conversation;
  const res = await api.get(`messages/thread/${userId}/`, { params });
  return res.data;
};
export const searchUsers = (query) =>
  api.get(`/users/search/`, { params: { q: query } }).then(res => res.data);

export const sendMessage = (recipientId, content) =>
  api.post('messages/', { recipient: recipientId, content });

// 👤 Profile
export const fetchPublicProfile = (id) =>
  api.get(`user/public/${id}/`).then(res => res.data);
export const updateProfile = (data) =>
  api.patch('profile/', data);

// 📅 Events
export const fetchEvents = async (city, isFeed = false, url = null) => {
  const params = new URLSearchParams({ city });

  if (isFeed) {
    params.set('type', 'feed');
  }

  const finalUrl = url || `events/?${params.toString()}`;
  console.log("Events URL:", finalUrl);

  const response = await api.get(finalUrl);
  return response.data;
};

export const createEvent = (data) => api.post('events/', data);
export const rsvpToEvent = (id) => api.patch(`events/${id}/rsvp/`);

// 🛒 Marketplace
export const fetchMarketplace = async (city, filters = {}, isFeed = false, url = null) => {
  if (typeof filters === 'string') {
    throw new Error("Filters should be an object, not a string.");
  }



  const params = new URLSearchParams({
    ...filters,
    city,
  });

  if (filters.category) params.category  = filters.category;
  if (filters.tags)     params.tags      = filters.tags;  

  if (isFeed) {
    params.set('type', 'feed');
  }

  const finalUrl = url || `marketplace/?${params.toString()}`;
  console.log("Marketplace URL:", finalUrl);

  const response = await api.get(finalUrl);
  return response.data;
};
// 🚀 Create Listing with Progress Callback
export const createListing = async (data, onProgress) => {
  return api.post('marketplace/create/', data, {
    onUploadProgress: onProgress,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const fetchSwappOffers = async (type = 'received') => {
  const res = await api.get(`swapp/offers/?type=${type}`);
  return res.data;
};

// Create a new swapp offer
export const sendSwappOffer = async (data) => {
  return api.post('swapp/offer/', data);
};

// Take an action on a swapp offer (accept, decline, counter)
export const takeSwappAction = (id, action, extraData = {}) => {
  return api.post(`swapp/offer/${id}/action/`, { action, ...extraData });
};
/**
 * Fetch a single listing’s detail (including similar_items & tags).
 */
export const fetchMarketplaceItemDetail = (itemId) => api.get(`marketplace/${itemId}/`);
export const toggleSaveListing = (id) =>
  api.post(`marketplace/${id}/toggle-save/`);
export const fetchSavedListings = () =>
  api.get('marketplace/saved/');

/**
 * Relist an item that was sold/expired.
 * POST /marketplace/{id}/relist/
 */
export const relistListing = (listingId) =>
  api.post(`marketplace/${listingId}/relist/`);

/**
 * Fetch the list of all Tag objects for multi‐tag filtering.
 * Endpoint returns: [ { id, name }, ... ]
 */
export const fetchTags = () => api.get('metadata/tags/');


// 🔁 Swapp
export const updateSwappOffer = (id, data) =>
  api.patch(`swapp/offer/${id}/`, data);
export const createPoll = (data) =>
  api.post('polls/', data);
export const fetchPostById = (id) =>
  api.get(`posts/${id}/`).then(res => res.data).catch(() => null);




// ───────────────────────────────────────────────────────────────────────────────
// 1) SELLER ANALYTICS (Item 1)
// ───────────────────────────────────────────────────────────────────────────────
export const fetchSellerAnalytics = () =>
  api.get('marketplace/seller-analytics/');

export const fetchBestTimeToPost = () =>
  api.get('marketplace/best-time-to-post/');

export const fetchTopPerformingListings = () =>
  api.get('marketplace/top-performing-listings/'); // optional if you choose to use it

// ───────────────────────────────────────────────────────────────────────────────
// 2) MY LISTINGS & OWNER ACTIONS (Item 2)
// ───────────────────────────────────────────────────────────────────────────────
export const fetchMyListings = (params) =>
  api.get('marketplace/my-listings/', { params });

export const bulkUpdateListings = (payload) =>
  api.post('marketplace/my-listings/bulk-update/', payload);

export const pauseResumeListing = (listingId, action) =>
  api.patch(`marketplace/${listingId}/pause-resume/`, { action });

export const deleteListing = (listingId) =>
  api.delete(`marketplace/${listingId}/delete/`);

// ───────────────────────────────────────────────────────────────────────────────
// 3) RELIST REMINDERS (Item 7)
// ───────────────────────────────────────────────────────────────────────────────
export const setRelistReminder = (itemId, days) =>
  api.post(`marketplace/${itemId}/set-relist-reminder/`, { days });

// ───────────────────────────────────────────────────────────────────────────────
// 4) LISTING COUPONS & FEATURED (Item 4)
// ───────────────────────────────────────────────────────────────────────────────
export const listCoupons = () =>
  api.get('listing-coupons/');

export const createCoupon = (data) =>
  api.post('listing-coupons/', data);

export const updateCoupon = (couponId, data) =>
  api.put(`listing-coupons/${couponId}/`, data);

export const deleteCouponById = (couponId) =>
  api.delete(`listing-coupons/${couponId}/`);

export const toggleFeatured = (listingId) =>
  api.post(`marketplace/${listingId}/toggle-featured/`);

// ➤ UPDATE an existing listing (edit)
//    PATCH /marketplace/{listingId}/edit/  (uses multipart/form-data)
export const updateListing = async (listingId, data, onProgress) => {
  return api.patch(`marketplace/${listingId}/edit/`, data, {
    onUploadProgress: onProgress,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ➤ FETCH a single listing’s detail (so you can prefill the “edit” form)
//    GET /marketplace/{listingId}/
export const fetchListingDetail = (listingId) =>
  api.get(`marketplace/${listingId}/`).then((res) => res.data);

// ─── UPDATE an event ────────────────────────────────────────────────────────
// PATCH /events/{eventId}/edit/
export const updateEvent = (eventId, data, onProgress) =>
  api.patch(`events/${eventId}/edit/`, data, {
    onUploadProgress: onProgress,
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ─── FETCH a single event’s detail (for pre-fill) ────────────────────────────
// GET /events/{eventId}/
export const fetchEventDetail = (eventId) =>
  api.get(`events/${eventId}/`).then((res) => res.data)

export const deleteEvent = (id) =>
  api.delete(`events/${id}/edit/`);

export const notInterestedEvent = (id) =>
  api.post(`events/${id}/not_interested/`)

// ─── EVENT PARTICIPANTS & HOST GROUPS ────────────────────────────────────────
/**
 * Fetch a page of RSVPs for a given event.
 *
 * @param {number|string} eventId
 * @param {number} [page=1]
 * @returns {Promise<{ results: Array, next: string|null }>}
 */
export function fetchEventRSVPs(eventId, page = 1) {
  return api
    .get(`events/${eventId}/rsvps/`, { params: { page } })
    .then(res => ({
      results: res.data.results,
      next:    res.data.next,
    }));
}

export const addEventParticipantsToGroup = (eventId, payload) =>
  api.post(`events/${eventId}/rsvps/add-to-group/`, payload);

export const fetchHostGroups = () =>
  api.get('groups/own/').then(res => res.data);

export const exportEventRSVPCSV = eventId =>
  api.get(`events/${eventId}/rsvps/export/`, { responseType: 'blob' })
     .then(res => {
       const url = URL.createObjectURL(res.data);
       const a = document.createElement('a');
       a.href = url;
       a.download = `event-${eventId}-rsvps.csv`;
       a.click();
       URL.revokeObjectURL(url);
     });

export function removeEventRSVP(eventId, userId) {
  return api.post(
    `events/${eventId}/rsvps/remove/`,
    { user_id: userId }    // matches your RemoveRSVPSerializer
  );
}

// fetch the host’s wait-list for an event

export function fetchEventWaitlist(eventId, page = 1) {
  return api
    .get(`events/${eventId}/waitlist/`, { params: { page } })
    .then(res => ({
      results: res.data.results,
      next:    res.data.next,   // assuming your DRF view is returning `next`
    }));
}

// host removes someone from wait-list
export function removeWaitlistMember(eventId, userId) {
  return api
    .post(`events/${eventId}/waitlist/remove/`, { user_id: userId })
    .then(res => res.data);
}


export const notifyEventParticipants = (eventId, payload) =>
  api.post(`events/${eventId}/rsvps/notify/`, payload);

// ───────────────────────────────────────────────────────────────────────────────
// 5) BADGES & LEADERBOARD (Item 3)
// ───────────────────────────────────────────────────────────────────────────────
export const fetchSellerBadges = () =>
  api.get('badges/fetch/?type=seller');

export const fetchUserBadges = (user) =>
  api.get(`badges/fetch/?user=${user}`);

export const fetchLeaderboardListings = (params) =>
  api.get('marketplace/leaderboard/', { params });

export const fetchTopSellerMonth = () =>
  api.get('marketplace/top-seller-month/');

// ───────────────────────────────────────────────────────────────────────────────
// 6) MESSAGE TEMPLATES & CONVERSATIONS (Item 5)
// ───────────────────────────────────────────────────────────────────────────────
export const listMessageTemplates = () =>
  api.get('message-templates/');

export const createMessageTemplate = (data) =>
  api.post('message-templates/', data);

export const updateMessageTemplate = (templateId, data) =>
  api.put(`message-templates/${templateId}/`, data);

export const deleteMessageTemplate = (templateId) =>
  api.delete(`message-templates/${templateId}/`);


export const fetchListingConversations = (itemId) =>
  api.get(`marketplace/${itemId}/conversations/`);

/**
 * Bulk‐mark multiple notifications as read.
 * POST /notifications/mark-read/  with { ids: [ … ] }
 */
export const markNotificationsRead = (ids) =>
  api.patch('notifications/mark-read/', { ids });

// 🔔 Notifications
export const fetchNotifications = () =>
  api.get('notifications/').then(res => res.data);
export const markNotificationRead = (id) =>
  api.patch(`notifications/${id}/`, { is_read: true });

// 📣 Feedback
export const sendFeedback = (data) => api.post('feedback/', data);
export const fetchFeedback = () =>
  api.get('feedback/').then(res => res.data);

// 🧑‍💼 Moderation
export const fetchReports = () =>
  api.get('reports/').then(res => res.data);
export const handleReport = (id, action) =>
  api.patch(`report/${id}/`, { action });

// ─── NEW: fetch reports for a particular piece of content ─────────────────────
//   e.g. to list all “post” reports where content_id = 123
export const fetchReportsByContent = (contentType, contentId) =>
  api
    .get('reports/', {
      params: {
        content_type: contentType,
        content_id: contentId,
      },
    })
    .then(res => res.data);

// 2. Fetch summary metrics for the dashboard
export async function fetchReportMetrics() {
  const res = await api.get('/reports/metrics/');
  return res.data;
}

// 4. Assign a report to a moderator
export async function assignReport(reportId, moderatorId) {
  const res = await api.post(`/reports/${reportId}/assign/`, {
    moderator_id: moderatorId,
  });
  return res.data;
}
export async function actionReport(reportId, actionType) {
  const res = await api.patch(`/reports/${reportId}/`, { action: actionType });
  return res.data;
}

// 6. Send a mod‐to‐user message tied to a report
export async function sendModMessage(reportId, subject, content) {
  const res = await api.post(`/reports/${reportId}/message/`, { subject, content });
  return res.data; // returns the created Message object
}
// 7. Fetch conversation (mod messages + user replies) for a report
export async function fetchReportMessages(reportId) {
  const res = await api.get(`/reports/${reportId}/messages/`);
  return res.data; // array of message objects
}
/**
 * REPORT A MESSAGE (chat)
 *
 * POST /api/report/create/
 * {
 *   content_type: "message",
 *   content_id: <messageId>,
 *   reason_code: "<reason>"
 * }
 *
 * The backend's ReportCreateView expects at least:
 *  - content_type (e.g. "message")
 *  - content_id   (the ID of the offending message)
 *  - reason_code  (one of the Report.REASON_CODE_CHOICES, e.g. "spam", "harass", etc.)
 *
 * You can prompt the user for a reason, but if you want a default, you can pass "other".
 */
export async function reportMessage(messageId, reason = 'other') {
  const payload = {
    content_type: 'message',
    content_id: messageId,
    reason_code: reason,
  };
  const res = await api.post('/report/', payload);
  return res.data;
}

// 8. Fetch internal notes for a report
export async function fetchReportNotes(reportId) {
  const res = await api.get(`/reports/${reportId}/notes/`);
  return res.data; // array of { id, content, moderator: { username, id }, created_at }
}

// 9. Add a new internal note to a report
export async function addReportNote(reportId, content) {
  const res = await api.post(`/reports/${reportId}/notes/`, { content });
  return res.data; // the newly created note object
}

// 10. Perform a bulk action on multiple reports at once
//     `reportIds` is an array of report‐IDs, `actionType` as above
export async function bulkActionReports(reportIds, actionType) {
  const res = await api.post('/reports/bulk_action/', {
    report_ids: reportIds,
    action: actionType,
  });
  return res.data;
}

// 11. Optionally: fetch list of available report reasons/severity tags (if exposed by backend)
export async function fetchReportReasons() {
  const res = await api.get('/reports/reasons/');
  return res.data; // array of available reasons/severity
}

// 📚 Groups
export const getJoinRequests = (groupId) =>
  api.get(`/groups/${groupId}/join_requests/`);
export const approveJoinRequest = (groupId, requestId) =>
  api.post(`/groups/${groupId}/join_requests/${requestId}/approve/`);
export const declineJoinRequest = (groupId, requestId) =>
  api.post(`/groups/${groupId}/join_requests/${requestId}/decline/`);

export const getGroupMembers = (groupId) =>
  api.get(`/groups/${groupId}/members/`);
export const promoteModerator = (groupId, userId) =>
  api.post(`/groups/${groupId}/members/${userId}/promote/`);
export const demoteModerator = (groupId, userId) =>
  api.post(`/groups/${groupId}/members/${userId}/demote/`);
export const removeGroupMember = (groupId, userId) =>
  api.post(`/groups/${groupId}/members/${userId}/remove/`);

{/*export const getGroups = (params = {}) =>
  api.get(`/groups/`, { params });*/}
export const joinGroup = (groupId) =>
  api.post(`/groups/${groupId}/join/`);
export const leaveGroup = (groupId) =>
  api.post(`/groups/${groupId}/leave/`);

export const createGroupPost = (groupId, data) =>
  api.post(`/groups/${groupId}/posts/`, data);
export const createGroupEvent = (groupId, data) =>
  api.post(`/groups/${groupId}/events/`, data);
export const updateGroup = (groupId, data) => {
  // assuming `api` is Axios instance with baseURL pointing to '/api/'
  return api.patch(`groups/${groupId}/`, data);
};
export const createGroup = async (data) => {
  const response = await api.post('groups/', data);
  
  // Automatically join the group after creation if the API doesn't do it
  const groupId = response.data.id;
  if (groupId) {
    try {
      await api.post(`/groups/${groupId}/join/`);
    } catch (err) {
      console.warn('Failed to auto-join group after creation:', err);
    }
  }

  return response.data;
};

export const getGroupDetail = (groupId) =>
  api.get(`groups/${groupId}/`).then(res => res.data);
export const getGroupPosts = (groupId) =>
  api.get(`groups/${groupId}/posts/`).then(res => res.data);

export const fetchGroupMessages = (groupId) =>
  api.get(`groups/${groupId}/messages/`).then(res => res.data);

export const sendGroupMessage = (groupId, content) =>
  api.post(`groups/${groupId}/messages/`, { content });
// Group Events
export const getGroupEvents = (groupId) =>
  api.get(`groups/${groupId}/events/`).then(res => res.data);

// Group Polls
export const getGroupPolls = (groupId) =>
  api.get(`groups/${groupId}/polls/`).then(res => res.data);
export const votePollOption = (pollId, selectedOptionId) =>
  api.post(`poll/vote/`, { poll: pollId, selected_option: selectedOptionId });

export const sendReaction = (type, postId, emoji) =>
  api.post('reactions/', { [type]: postId, emoji });

export const toggleRSVP = (eventId) =>
  api.patch(`events/${eventId}/rsvp/`);

// 🧑‍⚖️ Moderator APIs
export const fetchPendingGroups = () =>
  api.get('groups/pending/');

export const approveGroup = (groupId) =>
  api.post(`groups/${groupId}/approve/`);

export const rejectGroup = (groupId) =>
  api.post(`groups/${groupId}/reject/`);

export const handlePin = async (postId, scope = 'personal', unpin = false) => {
  try {
    const payload = {
      post_id: postId,
      scope,
      ...(unpin && { unpin: true })
    };

    const response = await api.post('/pin/', payload);
    return response.data;
  } catch (error) {
    console.error('Pin/unpin failed:', error);
    throw error.response?.data || { detail: 'Something went wrong during pinning.' };
  }
};

export async function deletePost(postId) {
  return api.delete(`/posts/${postId}/`);
}

export const updatePost = (postId, payload) =>
  api.patch(`posts/${postId}/`, payload).then(res => res.data);

export const fetchGroupsPendingDeletion = () =>
  api.get('groups/pending-deletion/');

export const finalizeGroupDeletion = (groupId) =>
  api.post(`groups/${groupId}/final-delete/`);

export const cancelGroupDeletion = (groupId) =>
  api.post(`groups/${groupId}/cancel-delete/`);

// 🙋 Member Action
export const voteToDeleteGroup = (groupId) =>
  api.post(`groups/${groupId}/vote-delete/`);

export const inviteMembers = (groupId, userIds) =>
  api.post(`/groups/${groupId}/invite/`, { usernames: userIds });

export const submitBid = (data) =>
  api.post('marketplace/bids/', data);
export const fetchBidsForItem = (itemId) =>
  api.get(`marketplace/${itemId}/bids/`).then(res => res.data);
/**
 * Fetch all bids for a given item.
 */
export const fetchBids = (itemId) =>
  api.get(`marketplace/${itemId}/bids/`);

export const takeBidAction = (bidId, action) =>
  api.post(`marketplace/bids/${bidId}/action/`, { action });


/**
 * Mark an item as sold to a given buyerId:
 * POST /marketplace/{itemId}/mark-sold/  →  { status: 'marked as sold' }
 * (body: { buyer_id: <id> })
 */
export const markItemSold = (itemId, buyerUsername = null) => {
  const body = {};
  if (buyerUsername && buyerUsername.trim().length) {
    body.buyer_username = buyerUsername.trim();
  }
  return api.post(`marketplace/${itemId}/mark-sold/`, body);};
/**
 * Get or create a MarketplaceConversation for a given item:
 * POST /marketplace/{itemId}/get-or-create-conversation/ → { conversation_id: <id> }
 */
//export const getOrCreateConversation = (itemId) =>
 // api.post(`marketplace/${itemId}/get-or-create-conversation/`);

/**
 * Fetch all messages for a given conversation (direct or item):
 * GET /messages/thread/?conversation={conversationId}
 */
export const fetchConversationMessages = (conversationId) =>
  api.get(`messages/thread/?conversation=${conversationId}`);

/**
 * Send a message into a conversation (via REST fallback)—not used if using WebSocket.
 * POST /messages/  →  { …newMessage }
 *   body: { conversation: <id>, content: <text> }
 */
export const sendConversationMessage = (conversationId, content) =>
  api.post('messages/', { conversation: conversationId, content });



export const rateUser = (data) =>
  api.post('ratings/', data);
export const fetchRatings = (userId) =>
  api.get(`/ratings/?user_id=${userId}`);

export const fetchPosts = (city, sort = 'newest', url = null) =>
  url
    ? api.get(url).then(res => res.data)
    : api.get(`posts/?city=${city}&sort=${sort}`).then(res => res.data);

export const fetchGroups = () =>
  api.get('groups-public/').then(res => res.data);
export const createPost = async (data, onProgress = null) => {
  return api.post('posts/', data, {
    onUploadProgress: onProgress,
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data);
};

export const votePoll = async (pollId, selectedOptionId) => {
  return api.post('poll/vote/', { poll: pollId, selected_option: selectedOptionId });
};

export const markGroupMessagesRead = (groupId) =>
  api.post(`groups/${groupId}/read/`);

export const fetchLeaderboardUsers = (city) =>
  api.get(`leaderboard/?city=${city}`).then(res => res.data);

export const logout = async () => {
  try {
    await api.post('logout/', null, {
      withCredentials: true,        // if using axios
      // OR if you use fetch:
      // credentials: 'include'
    });
  } catch (err) {
    console.warn('Failed to logout cleanly.', err);
  } finally {
    // Remove any client‐side user state (e.g. accessToken)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('hasLoggedIn');
    localStorage.setItem('sidebarOpen', 'false');
  }
};

// ─── New: Pending Alerts / Approve Alert ───

// Fetch all unapproved medium/high-priority alerts (paginated)
export const fetchPendingAlerts = () =>
  api.get('posts/alerts/pending/').then(res => res.data);

// Approve a specific alert (and bump its created_at on the server)
export const approveAlert = (alertId) =>
  api.post(`posts/alerts/${alertId}/approve/`).then(res => res.data);

export const editMessage = (messageId, newContent) =>
  api.patch(`messages/${messageId}/`, { content: newContent }).then(res => res.data);

export const deleteMessage = (messageId) =>
  api.delete(`messages/${messageId}/`).then(res => res.data);

// ───────────────────────────────────────────────────────────────────────────────
// 7) RATINGS & REVIEWS (Item 5)
// ───────────────────────────────────────────────────────────────────────────────
export const createRating = (data) =>
  api.post('ratings/', data);

export const fetchUserRatings = (userId, params) =>
  api.get(`ratings/user/${userId}/`, { params });

export function createReview({ business, rating, comment }) {
  return api.post('reviews/', { business, rating, comment });
}



// ───────────────────────────────────────────────────────────────────────────────
// 8) PRICE COMPETITIVENESS & BEST TIME TO POST (Item 8)
// ───────────────────────────────────────────────────────────────────────────────
export const fetchPriceCompetitiveness = (itemId) =>
  api.get(`marketplace/${itemId}/price-competitiveness/`);

export const fetchHourlyViews = () =>
  api.get('marketplace/best-time-to-post/');

export const fetchUserByUsername = async (username) => {
  const res = await api.get('/users/search/', { params: { q: username } });
  // Find the exact match (case-insensitive):
  const matches = res.data; // e.g. [ { id, username, profile_image_url, … }, … ]
  const found = matches.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!found) {
    const error = new Error('User not found.');
    error.response = { data: { error: 'User not found.' } };
    throw error;
  }
  return found;
};