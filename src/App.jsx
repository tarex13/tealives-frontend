import React, { useState, useEffect, useRef } from 'react';
import Spinner from './components/Spinner';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { createWebSocket } from './utils/websocket';
import { HelmetProvider } from 'react-helmet-async';
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
import Notifications from './pages/Notifications';
import PublicProfile from './pages/PublicProfile';
import Navbar from './components/Navbar';
import ModPanel from './pages/ModPanel';
import PrivateRoute from './components/PrivateRoute';
import PageNotFound from './pages/PageNotFound';
import SavedListings from './pages/SavedListings';
{/* \ import editlisting from '.\pages\EditListing'; \\ if\when you create an Edit form */}
import FeedbackForm from './components/FeedbackForm';
import EventsPage from './pages/EventsPage';
import TermsPage from './pages/TermsPage';
import Leaderboard from './pages/Leaderboard';
import Loader from './components/Loader';
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

import ModDashboard from './pages/ModDashboard'; 
import BadgeAssignmentsPage from './pages/BadgeAssignmentsPage';
import BadgeDefinitionsPage from './pages/BadgeDefinitionsPage'; 
import GroupPostCreate from './pages/GroupPostCreate';
import CreateGroup from './pages/CreateGroup';
import GroupDetailPage from './components/GroupDetailPage';
import MarketplaceItemDetail from './pages/MarketplaceItemDetail';
import BusinessAnalytics from './pages/BusinessAnalytics';
import AdminReportsDashboard from './pages/AdminReportsDashboard';
import EditPostPage from './pages/EditPostPage';
import MyListings from './pages/MyListings';
import SellerAnalytics from './pages/SellerAnalytics';
import LandingPage from './pages/LandingPage';
import MyBadges from './pages/SellerBadges';
import TopSellerOfMonth from './pages/TopSellerOfMonth';
import LeaderboardListings from './pages/LeaderboardListings';
import CouponsManagement from './pages/CouponsManagement';
import RelistReminderModal from './components/RelistReminderModal';
import ListingConversations from './pages/ListingConversations';
import MessageTemplates from './pages/MessageTemplates';
import MyRatings from './pages/MyRatings';
import PriceCompetitiveness from './components/PriceCompetitiveness';
import PrivacyPolicyPage from './pages/PrivacyPolicy';
import BestTimeToPost from './components/BestTimeToPost';
import ModBadgeAssignmentsPage from './pages/ModBadgeAssignmentsPage';
{/*import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/next"*/}
function App() {
  const { user, loading } = useAuth();
  // App‐wide loading state to show our <Loader />
  const [appLoading, setAppLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    localStorage.getItem('sidebarOpen') === 'true'
  );
  const [sidebarMinimized, setSidebarMinimized] = useState(() =>
    localStorage.getItem('sidebarMinimized') === 'true'
  );

  // Persist to localStorage whenever the flags change
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen);
    localStorage.setItem('sidebarMinimized', sidebarMinimized);
  }, [sidebarOpen, sidebarMinimized]);

  // As soon as `user` exists (logged in), force the sidebar to open.
  // Conversely, when `user` becomes null (logged out), you could automatically close it.
  useEffect(() => {
    if (user) {
      setSidebarOpen(true);
    } else {
      // Optionally, close it when the user logs out:
      setSidebarOpen(false);
    }
  }, [user]);
   const wsNotifRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const ws = createWebSocket('/ws/notifications/', token);
    wsNotifRef.current = ws;

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
    };

    ws.onerror = (e) => console.error('Notification WebSocket error', e);

    return () => {
      ws.close();
    };
  }, [user]);

  const toggleSidebar = () => setSidebarOpen(o => !o);
  const toggleMinimize = () => setSidebarMinimized(m => !m);

   // when auth is done, hide the loader
  useEffect(() => {
    if (!loading) {
      setAppLoading(false);
    }
  }, [loading]);

  // show our Loader while auth (or any app init) is loading
  if (appLoading) return <Loader visible={true} />;

  return (
    <ErrorBoundary>
        <HelmetProvider>
      <NotificationProvider>
        <>
        <AppInitializer />
        <div className="min-h-screen py-10 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-white flex relative">
          {user &&  (
                 <Sidebar
              isOpen={sidebarOpen}
              setSidebarMinimized={setSidebarMinimized}
              toggleSidebar={toggleSidebar}
              isMinimized={sidebarMinimized}
              toggleMinimize={toggleMinimize}
            />
          )}

 <div
   className={`
     flex-1 max-w-full transition-all duration-300
     ${sidebarOpen
       ? (sidebarMinimized ? 'md:ml-12' : 'lg:ml-64')
       : 'md:ml-0'}
   `}
 >
   <Navbar toggleSidebar={toggleSidebar} />
   <main className={`px-2 sm:px-4 pt-[5vh] pb-10     `}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                {/*<Route path="/login" element={<Login />} />*/}
                <Route path="/user/auth" element={<Login  isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>} />
                <Route path="/auth" element={<Login  isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/event/:id" element={<Event />} />
                <Route path="/event/:id/edit" element={<CreateEvent isEdit={true} />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/feedback" element={<FeedbackForm />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/groups" element={<GroupDirectory />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/listings/leaderboard" element={<LeaderboardListings />} />
                <Route path="/marketplace/:id" element={<MarketplaceItemDetail />} />
                <Route path="/new" element={<LandingPage/>} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />

                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                {user && <>
                <Route path="/marketplace/:id/bid" element={<BidForm />} />
                <Route path="/mylistings" element={<MyListings />} />
                
                 <Route path="/posts/:postId/edit" element={<EditPostPage />} />
                <Route path="/business/analytics" element={<BusinessAnalytics />} />
                <Route path="/notifications" element={<Notifications />} />

                    {/* ─── Analytics Widgets (Embed in pages where needed) ─────── */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/inbox" element={<Inbox setSidebarMinimized={setSidebarMinimized}/>} />
                  <Route path="/saved" element={<SavedListings />} />
                  <Route path="/events/create" element={<CreateEvent />} />
                  <Route path="/marketplace/create" element={<CreateListing />} />
                  <Route path="/marketplace/:id/edit" element={<CreateListing isEdit={true} />} />
                  <Route path="/groups/create" element={<CreateGroup />} />
                  <Route path="/groups/:groupId/invite" element={<InviteMembers />} />
                  <Route path="/groups/:id/posts/create" element={<GroupPostCreate />} />
                  <Route path="/groups/:id/events" element={<GroupEventsPage />} />
                  <Route path="/groups/:id/polls" element={<GroupPollsPage />} />
                  <Route path="/groups/:id/members" element={<GroupMembersList />} />
                  <Route path="/settings/profile" element={<ProfileSettings />} />
                  <Route path="/settings/reset" element={<ResetPass />} />
                  <Route path="/settings/notifications" element={<NotificationSettings />} />
                  <Route path="/settings/privacy" element={<PrivacySettings />} />
                  <Route path="/settings/preferences" element={<PreferencesSettings />} />
                  <Route path="/settings/delete" element={<AccountDelete />} />
                  {(user.is_moderator || user.is_admin) && <>
                  
                  <Route path="/mod/dashboard" element={<ModDashboard />} />
                  <Route path="/mod" element={<ModPanel />} />
                  <Route path="/mod/feedback" element={<AdminFeedback />} />
                  <Route path="/mod/reports" element={<AdminReportsDashboard />} />
                  <Route path="/mod/badges/assignments" element={<ModBadgeAssignmentsPage />} />
                  {user.is_admin && 
                  <>
                  <Route path="/admin/badges/definitions" element={<BadgeDefinitionsPage />}/>
                  <Route path="/admin/badges/assignments" element={<BadgeAssignmentsPage />} />
                  </>
                  }
                  </>
                  }                                    
                  <Route
                      path="/top-seller-of-month"
                      element={<TopSellerOfMonth />}
                    />
                    <Route
                      path="/coupons"
                      element={<CouponsManagement />}
                    />
                    {/*<Route
                      path="/listing/:id/conversations"
                      element={<ListingConversations />}
                    />*/}
                    {/*<Route
                      path="/my-ratings/:userId"
                      element={<MyRatings />}
                    />*/}
                    {/* Currently not being used but the ideas is sellers/businesses can create message templates 
                    that can be used in inbox <Route
                      p/ath="/message-templates"
                      element={<MessageTemplates />}
                    />*}
                    <Route path="/price-competitiveness/:id" element={<PriceCompetitiveness />} />
                    <Route path="/best-time-to-post" element={<BestTimeToPost />} />
                  <Route path="/group-chat/:groupId" element={<GroupChatPage />} />{/*Not Currently used*/}
                  {/*<Route path="/groups/:id/join-requests" element={<GroupJoinRequests />} />Not Currently used*/}
                  {/*<Route path="/my-swapps" element={<MySwapps />} />Not Currently used removed feature*/}
                    </>
                    }
                </Route>

                {/* 404 */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </main>
          </div>
        </div>
        {/*<SpeedInsights />
        <Analytics />*/}
        </>
      </NotificationProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
