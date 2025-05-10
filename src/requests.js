import api from './api';

// 🛡️ Auth
export const login = async (credentials) => {
  const response = await api.post('login/', credentials);
  const { access, refresh, user } = response.data;
  const authUser = { access, refresh, user };
  localStorage.setItem('user', JSON.stringify(authUser));
  localStorage.setItem('userToken', access);
  return authUser;
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

export const sendMessage = (recipientId, content) => 
  api.post('messages/', { recipient: recipientId, content });

// 👤 Profile
export const fetchPublicProfile = (id) => api.get(`user/public/${id}/`).then(res => res.data);
export const updateProfile = (data) => api.patch('profile/', data);

// 📅 Events
export const fetchEvents = (city, url = null) => 
  url ? api.get(url).then(res => res.data) : api.get(`events/?city=${city}`).then(res => res.data);

export const createEvent = (data) => api.post('events/', data);
export const rsvpToEvent = (id) => api.patch(`events/${id}/rsvp/`);

// 🛒 Marketplace
export const fetchMarketplace = (city) => 
  api.get(`marketplace/?city=${encodeURIComponent(city)}`).then(res => res.data);

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
export const joinGroup = (groupId) => api.post(`groups/${groupId}/join/`);
export const leaveGroup = (groupId) => api.post(`groups/${groupId}/leave/`);
export const createGroup = (data) => api.post('groups/', data);

export const fetchGroupMessages = (groupId) => 
  api.get(`groups/${groupId}/messages/`).then(res => res.data);

export const sendGroupMessage = (groupId, content) => 
  api.post(`groups/${groupId}/messages/`, { content });

export const sendReaction = (postId, emoji) => api.post('reactions/', { post: postId, emoji });

export const toggleRSVP = (eventId) => api.patch(`events/${eventId}/rsvp/`);

export const fetchPosts = (city, sort = 'newest', url = null) => 
  url ? api.get(url).then(res => res.data) : api.get(`posts/?city=${city}&sort=${sort}`).then(res => res.data);

export const fetchGroups = () => api.get('groups-public/').then(res => res.data);
export const createPost = (data) => api.post('posts/', data);

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
  localStorage.removeItem('userToken');
};
