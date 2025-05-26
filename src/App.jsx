import React, { useState, useEffect } from 'react';
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
import InviteMembers from './components/InviteMembers';
import BidForm from './components/BidForm';
import ResetPass from './components/Settings/ResetPass';
import AppInitializer from './AppInitializer';
import GroupMembersList from './pages/GroupMembersList';
import GroupJoinRequests from './pages/GroupJoinRequests';
import GroupEventsPage from './pages/GroupEventsPage';
import GroupPollsPage from './pages/GroupPollsPage';
import { NotificationProvider } from './context/NotificationContext';
import GroupPage from './pages/GroupPage'; 
import ModDashboard from './pages/ModDashboard'; 
import GroupPostCreate from './pages/GroupPostCreate';
import CreateGroup from './pages/CreateGroup';
import GroupDetailPage from './components/GroupDetailPage';
import MarketplaceItemDetail from './pages/MarketplaceItemDetail';


function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => { return localStorage.getItem('sidebarOpen') === 'true'});
  useEffect(() => {localStorage.setItem('sidebarOpen', sidebarOpen)}, [sidebarOpen]);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  if (loading) return null;
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <>
        <AppInitializer />
        <div className="min-h-screen py-10 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-white flex relative">
          {user &&  (
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}

          <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'sm:ml-64' : 'ml-0'}`}>
            <Navbar toggleSidebar={toggleSidebar} />

            <main className="px-2 sm:px-4 pt-[5vh] pb-10">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                {/*<Route path="/login" element={<Login />} />*/}
                <Route path="/user/auth" element={<Login  isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/event/:id" element={<Event />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/feedback" element={<FeedbackForm />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/groups" element={<GroupDirectory />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/marketplace/:id" element={<MarketplaceItemDetail />} />


                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                <Route path="/marketplace/:id/bid" element={<BidForm />} />

                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/saved" element={<SavedListings />} />
                  <Route path="/my-swapps" element={<MySwapps />} />
                  <Route path="/events/create" element={<CreateEvent />} />
                  <Route path="/marketplace/create" element={<CreateListing />} />
                  <Route path="/mod/dashboard" element={<ModDashboard />} />
                  <Route path="/mod" element={<ModPanel />} />
                  <Route path="/mod/feedback" element={<AdminFeedback />} />
                  <Route path="/group-chat/:groupId" element={<GroupChatPage />} />
                  <Route path="/groups/create" element={<CreateGroup />} />
                  <Route path="/groups/:groupId/invite" element={<InviteMembers />} />
                  <Route path="/groups/:id/posts/create" element={<GroupPostCreate />} />
                  <Route path="/groups/:id/events" element={<GroupEventsPage />} />
                  <Route path="/groups/:id/polls" element={<GroupPollsPage />} />
                  <Route path="/groups/:id/members" element={<GroupMembersList />} />
                  <Route path="/groups/:id/join-requests" element={<GroupJoinRequests />} />
                  <Route path="/settings/profile" element={<ProfileSettings />} />
                  <Route path="/settings/reset" element={<ResetPass />} />
                  <Route path="/settings/notifications" element={<NotificationSettings />} />
                  <Route path="/settings/privacy" element={<PrivacySettings />} />
                  <Route path="/settings/preferences" element={<PreferencesSettings />} />
                  <Route path="/settings/delete" element={<AccountDelete />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </main>
          </div>
        </div>
        </>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
