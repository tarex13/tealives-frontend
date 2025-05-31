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
  const res = await api.get('user/cities/');
  return res.data;
};

export const toggleFollow = userId =>
  api.post(`users/${userId}/follow/`).then(r => r.data)

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
export const fetchThreads = async () => {
  const res = await api.get('messages/threads/');
  return res.data.map(t => ({ ...t, type: t.type || 'direct' }));
};

export const fetchThread = (userId) => api.get(`messages/thread/${userId}/`).then(res => res.data);

export const searchUsers = (query) =>
  api.get(`/users/search/`, { params: { q: query } }).then(res => res.data);

export const sendMessage = (recipientId, content) => 
  api.post('messages/', { recipient: recipientId, content });

// 👤 Profile
export const fetchPublicProfile = (id) => api.get(`user/public/${id}/`).then(res => res.data);
export const updateProfile = (data) => api.patch('profile/', data);

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
  export const takeSwappAction = async (id, action, extraData = {}) => {
    return api.post(`swapp/offer/${id}/action/`, { action, ...extraData });
  };

export const toggleSaveListing = (id) => api.post(`marketplace/${id}/toggle-save/`);

// 🔁 Swapp
export const updateSwappOffer = (id, data) => api.patch(`swapp/offer/${id}/`, data);
export const createPoll = (data) => api.post('polls/', data);
export const fetchPostById = (id) => 
    api.get(`posts/${id}/`).then(res => res.data).catch(() => null);

// 🔔 Notifications
export const fetchNotifications = () => api.get('notifications/').then(res => res.data);
export const markNotificationRead = (id) => api.patch(`notifications/${id}/`, { is_read: true });

// 📣 Feedback
export const sendFeedback = (data) => api.post('feedback/', data);
export const fetchFeedback = () => api.get('feedback/').then(res => res.data);

// 🧑‍💼 Moderation
export const fetchReports = () => api.get('reports/').then(res => res.data);
export const handleReport = (id, action) => api.patch(`report/${id}/`, { action });

// 📚 Groups
export const getJoinRequests = (groupId) => api.get(`/groups/${groupId}/join_requests/`);
export const approveJoinRequest = (groupId, requestId) => api.post(`/groups/${groupId}/join_requests/${requestId}/approve/`);
export const declineJoinRequest = (groupId, requestId) => api.post(`/groups/${groupId}/join_requests/${requestId}/decline/`);

export const getGroupMembers = (groupId) => api.get(`/groups/${groupId}/members/`);
export const promoteModerator = (groupId, userId) => api.post(`/groups/${groupId}/members/${userId}/promote/`);
export const demoteModerator = (groupId, userId) => api.post(`/groups/${groupId}/members/${userId}/demote/`);
export const removeGroupMember = (groupId, userId) => api.post(`/groups/${groupId}/members/${userId}/remove/`);

export const getGroups = (params = {}) => api.get(`/groups/`, { params });
export const joinGroup = (groupId) => api.post(`/groups/${groupId}/join/`);
export const leaveGroup = (groupId) => api.post(`/groups/${groupId}/leave/`);

export const createGroupPost = (groupId, data) => api.post(`/groups/${groupId}/posts/`, data);
export const createGroupEvent = (groupId, data) => api.post(`/groups/${groupId}/events/`, data);
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
export const getGroupEvents = (groupId) => api.get(`groups/${groupId}/events/`).then(res => res.data);

// Group Polls
export const getGroupPolls = (groupId) => api.get(`groups/${groupId}/polls/`).then(res => res.data);
export const votePollOption = (pollId, selectedOptionId) => api.post(`poll/vote/`, { poll: pollId, selected_option: selectedOptionId });

export const sendReaction = (postId, emoji) => api.post('reactions/', { post: postId, emoji });

export const toggleRSVP = (eventId) => api.patch(`events/${eventId}/rsvp/`);

// 🧑‍⚖️ Moderator APIs
export const fetchPendingGroups = () => api.get('groups/pending/');

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
  return api.delete(`/api/posts/${postId}/`);
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
    api.post(`/groups/${groupId}/invite/`, { user_ids: userIds });
  

export const submitBid = (data) => api.post('marketplace/bids/', data);
export const fetchBidsForItem = (itemId) => api.get(`marketplace/${itemId}/bids/`).then(res => res.data);
export const takeBidAction = (bidId, action) =>
  api.post(`marketplace/bids/${bidId}/action/`, { action });

export const rateUser = (data) => api.post('user/rate/', data);
export const fetchRatings = (userId) => api.get(`/ratings/?user_id=${userId}`);
export const fetchPosts = (city, sort = 'newest', url = null) => 
  url ? api.get(url).then(res => res.data) : api.get(`posts/?city=${city}&sort=${sort}`).then(res => res.data);

export const fetchGroups = () => api.get('groups-public/').then(res => res.data);
export const createPost = async (data, onProgress = null) => {
    return api.post('posts/', data, {
      onUploadProgress: onProgress,
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  };

  export const votePoll = async (pollId, selectedOptionId) => {
    return api.post('poll/vote/', { poll: pollId, selected_option: selectedOptionId });
  };

export const markGroupMessagesRead = (groupId) => api.post(`groups/${groupId}/read/`);

export const fetchLeaderboard = (city) => api.get(`leaderboard/?city=${city}`).then(res => res.data);


export const logout = async () => {
  const refresh = JSON.parse(localStorage.getItem('user'))?.refresh;
  try {
    await api.post('logout/', { refresh });
  } catch (err) {
    console.warn('Failed to logout cleanly.', err);
  }
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('hasLoggedIn');
  localStorage.setItem('sidebarOpen', 'false');
};
