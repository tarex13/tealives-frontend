import React, { useState } from 'react';
import Spinner from './components/Spinner';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';

import GroupDirectory from './pages/GroupDirectory';
import Marketplace from './pages/Marketplace';
import Event from './pages/Event';
import Login from './pages/Auth';
import Register from './pages/Auth';
import CreateEvent from './pages/CreateEvent';
import MySwapps from './pages/MySwapps';
import Inbox from './pages/Inbox';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Navbar from './components/Navbar';
import ModPanel from './pages/ModPanel';
import PrivateRoute from './components/PrivateRoute';
import PageNotFound from './pages/PageNotFound';
import SavedListings from './pages/SavedListings';
import FeedbackForm from './components/FeedbackForm';
import EventsPage from './pages/EventsPage';
import TermsPage from './pages/TermsPage';
import Leaderboard from './pages/Leaderboard';
import AdminFeedback from './pages/AdminFeedback';
import EditProfile from './pages/EditProfile';
import Sidebar from './components/Sidebar';
import CreateListing from './components/CreateListing';
import GroupChatPage from './pages/GroupChatPage';
import SettingsDashboard from './components/Settings/SettingsDashboard';
import ProfileSettings from './components/Settings/ProfileSettings';
import NotificationSettings from './components/Settings/NotificationSettings';
import PrivacySettings from './components/Settings/PrivacySettings';
import PreferencesSettings from './components/Settings/PreferencesSettings';
import AccountDelete from './components/Settings/AccountDelete';
import ErrorBoundary from './components/ErrorBoundary';
import ResetPass from './components/Settings/ResetPass';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
      <div className="min-h-screen bg-gray-50 text-gray-800 flex">
        {user && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />}
        <div className="flex-1 ml-0">
          <Navbar toggleSidebar={toggleSidebar} />
          <div style={{paddingTop: '5vw'}}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user/auth" element={<Login />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event/:id" element={<Event />} />
          <Route path="/profile/:id" element={<PublicProfile />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/groups" element={<GroupDirectory />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/marketplace/create" element={<CreateListing />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/my-swapps" element={<MySwapps />} />
            <Route path="/saved" element={<SavedListings />} />
            <Route path="/events/create" element={<CreateEvent />} />
            <Route path="/mod" element={<ModPanel />} />
            <Route path="/mod/feedback" element={<AdminFeedback />} />
            <Route path="/group-chat/:groupId" element={<GroupChatPage />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/reset" element={<ResetPass />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/settings/privacy" element={<PrivacySettings />} />
            <Route path="/settings/preferences" element={<PreferencesSettings />} />
            <Route path="/settings/delete" element={<AccountDelete />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        </div>
      </div>
    </div>
    </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
