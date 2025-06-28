// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Bookmark,
  Settings,
  Shield,
  BarChart,
  Layers
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  setSidebarMinimized,
  toggleSidebar,
  isMinimized,
  toggleMinimize,
}) {
  const { user } = useAuth();
  const isAdmin     = user?.is_superuser;
  const isStaff     = user?.is_staff;
  const isModerator = user?.is_moderator;
  const isBusiness  = user?.is_business;

  const [settingsOpen, setSettingsOpen]       = useState(false);
  const [moderationOpen, setModerationOpen]   = useState(false);

  // If a user is logged in, force the sidebar open on desktop (lg+).
  // On tablet/mobile we still rely on `isOpen`.
  useEffect(() => {
    if (user) {
      // No need to call setSidebarOpen(true) here; we handle desktop via CSS.
    }
  }, [user]);

  useEffect(()=>{
    if(isMinimized){
      setModerationOpen(false);
      setSettingsOpen(false);
    }
  }, [isMinimized])

  // ────────────────────────────────────────────────────────────────────
  // 1) DESKTOP (lg+) FULL SIDEBAR, COLLAPSIBLE BY isMinimized
  // ────────────────────────────────────────────────────────────────────
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-all
     ${isActive
       ? 'bg-blue-100 dark:bg-blue-600 text-blue-900 dark:text-white'
       : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-300'
     }`;

  const iconOnlyClasses =
    "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition";

  return (
    <>
      <aside
        className={`
          hidden md:flex flex-col
          fixed top-16 left-0 z-40
          ${isMinimized ? 'w-16' : 'w-64'}
          h-[calc(100vh-4rem)]
          bg-white dark:bg-gray-900
          lg:left-auto lg:z-auto
          text-gray-900 dark:text-white
          overflow-y-auto
          transition-all duration-200 ease-in-out
        `}
      >
        {/* Header: “Menu” + Minimize button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {!isMinimized && <h2 className="text-xl font-bold">Menu</h2>}
          <button
            onClick={toggleMinimize}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>

        {isMinimized ? (
          // ─────── Minimized: Icon buttons only ───────
          <div className="flex flex-col items-center py-4 space-y-4">
            <NavLink to={`/profile/${user?.username}`} className={iconOnlyClasses} title="Profile">
              <User className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            </NavLink>
            <NavLink to="/inbox" className={iconOnlyClasses} title="Inbox">
              <Mail className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            </NavLink>
            <NavLink to="/saved" className={iconOnlyClasses} title="Saved">
              <Bookmark className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            </NavLink>
            <button
              onClick={() => {setSettingsOpen(o => !o); setSidebarMinimized(false);}}
              className={iconOnlyClasses}
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            </button>
            {settingsOpen && (
              <div className="space-y-2 mt-2">
                <NavLink to="/settings/profile" className={linkClasses}>
                  Edit Profile
                </NavLink>
                <NavLink to="/settings/reset" className={linkClasses}>
                  Reset Password
                </NavLink>
                {/*<NavLink to="/settings/notifications" className={linkClasses}>
                  Notifications
                </NavLink>
                <NavLink to="/settings/privacy" className={linkClasses}>
                  Privacy
                </NavLink>
                <NavLink to="/settings/preferences" className={linkClasses}>
                  Preferences
                </NavLink>*/}
              </div>
            )}
            {(isAdmin || isStaff || isModerator) && (
              <>
                <button
                  onClick={() => {setModerationOpen(o => !o); setSidebarMinimized(false);}}
                  className={iconOnlyClasses}
                  title="Moderation"
                >
                  <Shield className="w-5 h-5 text-red-600" />
                </button>
                {moderationOpen && (
                  <div className="space-y-2 mt-2">
                    <NavLink to="/mod/dashboard" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Moderator Dashboard
                    </NavLink>
                    {isAdmin && <NavLink to="/mod/feedback" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Feedback Admin
                    </NavLink>}
                    <NavLink to="/mod/reports" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Reported Admin
                    </NavLink>
                  </div>
                )}
              </>
            )}
            {/*isAdmin && (
              <NavLink
                to="/admin/dashboard"
                className="block px-3 py-2 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-white font-bold hover:bg-red-200 dark:hover:bg-red-700 transition"
                title="Admin Dashboard"
              >
                <BarChart className="w-5 h-5 inline-block" />{/* icon + text /**}
              </NavLink>
            )*/}
            {isBusiness && (
              <NavLink
                to="/business/analytics"
                className="block px-3 py-2 rounded-lg bg-green-100 dark:bg-green-800 text-green-700 dark:text-white font-semibold hover:bg-green-200 dark:hover:bg-green-700 transition"
                title="Business Analytics"
              >
                <Layers className="w-5 h-5 inline-block" />{/* icon + text */}
              </NavLink>
            )}
          </div>
        ) : (
          // ─────── Expanded: Full‐text links ───────
          <>
          {/**For Regular desktops */}
          <nav className="px-4 py-4 space-y-2 text-sm">
            {user && (
              <>
                <NavLink to={`/profile/${user.username}`} className={linkClasses}>
                  <User className="w-4 h-4" />
                  My Profile
                </NavLink>
                <NavLink to="/inbox" className={linkClasses}>
                  <Mail className="w-4 h-4" />
                  Inbox
                </NavLink>
                <NavLink to="/saved" className={linkClasses}>
                  <Bookmark className="w-4 h-4" />
                  Saved Listings
                </NavLink>
              </>
            )}

            {/* Settings Accordion */}
            {user && (
              <>
                <button
                  onClick={() => {setSettingsOpen(o => !o); setSidebarMinimized(false);}}
                  className="flex justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    Settings
                  </span>
                  {settingsOpen
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </button>
                {settingsOpen && (
                  <div className="pl-4 space-y-1">
                    <NavLink to="/settings/profile" className={linkClasses}>
                      Edit Profile
                    </NavLink>
                    <NavLink to="/settings/reset" className={linkClasses}>
                      Reset Password
                    </NavLink>
                    {/*<NavLink to="/settings/notifications" className={linkClasses}>
                      Notifications
                    </NavLink>
                    <NavLink to="/settings/privacy" className={linkClasses}>
                      Privacy
                    </NavLink>
                    <NavLink to="/settings/preferences" className={linkClasses}>
                      Preferences
                    </NavLink>*/}
                  </div>
                )}
              </>
            )}

            {/* Moderation Section */}
            {(isAdmin || isStaff || isModerator) && (
              <>
                <button
                  onClick={() => {setModerationOpen(o => !o); setSidebarMinimized(false);}}
                  className="flex justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
                >
                  <span className="flex items-center gap-3 text-red-600">
                    <Shield className="w-4 h-4" />
                    Moderation
                  </span>
                  {moderationOpen
                    ? <ChevronDown className="w-4 h-4 text-red-600" />
                    : <ChevronRight className="w-4 h-4 text-red-600" />
                  }
                </button>
                {moderationOpen && (
                  <div className="pl-4 space-y-1">
                    <NavLink to="/mod/dashboard" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Moderator Dashboard
                    </NavLink>
                    {isAdmin && <NavLink to="/mod/feedback" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Feedback Admin
                    </NavLink>}
                    <NavLink to="/mod/reports" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Reported Admin
                    </NavLink>
                    {isAdmin && (
                      <>
                        <NavLink to="/admin/badges/definitions" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                        Badge Definitions{/* icon={<FaImage />} */ }
                        </NavLink>
                        <NavLink to="/admin/badges/assignments"  className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition"> 
                        Badge Assignments{/* icon={<FaUsers />} */ }
                        </NavLink>
                      </>
                    )}
                    {isModerator && !isAdmin && (
                      <>
                        <NavLink to="/mod/badges/assignments" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition"> 
                        Badge Assignments
                        </NavLink>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Admin Dashboard */}
            {/*isAdmin && (
              <NavLink
                to="/admin/dashboard"
                className="block mt-4 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-white font-bold hover:bg-red-200 dark:hover:bg-red-700 transition"
              >
                Admin Dashboard
              </NavLink>
            )*/}

            {/* Business Analytics */}
            {isBusiness && (
              <NavLink
                to="/business/analytics"
                className="block mt-4 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-800 text-green-700 dark:text-white font-semibold hover:bg-green-200 dark:hover:bg-green-700 transition"
              >
                Business Analytics
              </NavLink>
            )}
          </nav>
          </>
        )}
      </aside>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 3) MOBILE (<md) BOTTOM FAB + BOTTOM SHEET (accordion‐style)        */}
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* Floating Action Button (FAB) at bottom‐right */}
      <button
        className="
          fixed bottom-6 right-6 z-50
          block md:hidden
          p-3 bg-blue-600 text-white rounded-full shadow-lg
          hover:bg-blue-700 transition-colors
        "
        onClick={toggleMinimize}
        aria-label="Open quick actions"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Bottom Sheet */}
      {!isMinimized && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={toggleMinimize}
          />

          {/* Panel */}
          <div className="
            relative w-full h-2/3
            bg-white dark:bg-gray-900
            rounded-t-2xl
            p-4 flex flex-col
          ">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quick Actions
              </h2>
              <button onClick={toggleMinimize}>
                <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              </button>
            </div>

            <nav className="flex flex-col space-y-4 overflow-y-auto">
              {/* Profile, Inbox, Saved (always link) */}
              <NavLink
                to={`/profile/${user.username}`}
                className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                onClick={toggleMinimize}
              >
                <User className="w-5 h-5" />
                <span className="text-base">Profile</span>
              </NavLink>

              <NavLink
                to="/inbox"
                className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                onClick={toggleMinimize}
              >
                <Mail className="w-5 h-5" />
                <span className="text-base">Inbox</span>
              </NavLink>

              <NavLink
                to="/saved"
                className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                onClick={toggleMinimize}
              >
                <Bookmark className="w-5 h-5" />
                <span className="text-base">Saved Listings</span>
              </NavLink>

              {/* Settings Accordion */}
              <div>
                <button
                  onClick={() => {setSettingsOpen(o => !o); setSidebarMinimized(false);}}
                  className="flex justify-between w-full items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
                >
                  <div className="flex items-center gap-3 text-gray-800 dark:text-gray-200">
                    <Settings className="w-5 h-5" />
                    <span className="text-base">Settings</span>
                  </div>
                  {settingsOpen
                    ? <ChevronDown className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                    : <ChevronRight className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                  }
                </button>
                {settingsOpen && (
                  <div className="pl-4 mt-2 space-y-2">
                    <NavLink
                      to="/settings/profile"
                      className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                      onClick={toggleMinimize}
                    >
                      Edit Profile
                    </NavLink>
                    <NavLink
                      to="/settings/reset"
                      className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                      onClick={toggleMinimize}
                    >
                      Reset Password
                    </NavLink>
                    {/*<NavLink
                      to="/settings/notifications"
                      className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                      onClick={toggleMinimize}
                    >
                      Notifications
                    </NavLink>
                    <NavLink
                      to="/settings/privacy"
                      className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                      onClick={toggleMinimize}
                    >
                      Privacy
                    </NavLink>
                    <NavLink
                      to="/settings/preferences"
                      className="flex items-center gap-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-3 py-2 transition"
                      onClick={toggleMinimize}
                    >
                      Preferences
                    </NavLink>*/}
                  </div>
                )}
              </div>

              {/* Moderation Accordion */}
              {(isAdmin || isStaff || isModerator) && (
                <div>
                  <button
                    onClick={() => {setModerationOpen(o => !o); setSidebarMinimized(false);}}
                    className="flex justify-between w-full items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
                  >
                    <div className="flex items-center gap-3 text-red-600">
                      <Shield className="w-5 h-5" />
                      <span className="text-base">Moderation</span>
                    </div>
                    {moderationOpen
                      ? <ChevronDown className="w-5 h-5 text-red-600" />
                      : <ChevronRight className="w-5 h-5 text-red-600" />
                    }
                  </button>
                  {moderationOpen && (
                    <div className="pl-4 mt-2 space-y-2">
                      <NavLink
                        to="/mod/dashboard"
                        className="flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md px-3 py-2 transition"
                        onClick={toggleMinimize}
                      >
                        Moderator Dashboard
                      </NavLink>
                     {isAdmin && <NavLink
                        to="/mod/feedback"
                        className="flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md px-3 py-2 transition"
                        onClick={toggleMinimize}
                      >
                        Feedback Admin
                      </NavLink>}
                      <NavLink
                        to="/mod/reports"
                        className="flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md px-3 py-2 transition"
                        onClick={toggleMinimize}
                      >
                        Reported Admin
                      </NavLink>
                                          {isAdmin && (
                      <>
                        <NavLink to="/admin/badges/definitions" className="flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md px-3 py-2 transition"
                        onClick={toggleMinimize}>
                        Badge Definitions{/* icon={<FaImage />} */ }
                        </NavLink>
                        <NavLink to="/admin/badges/assignments" className="flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md px-3 py-2 transition"
                        onClick={toggleMinimize}> 
                        Badge Assignments{/* icon={<FaUsers />} */ }
                        </NavLink>
                      </>
                    )}
                    {isModerator && !isAdmin && (
                      <>
                        <NavLink to="/mod/badges/assignments" className="flex items-center gap-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md px-3 py-2 transition"
                        onClick={toggleMinimize}> 
                        Badge Assignments
                        </NavLink>
                      </>
                    )}
                    </div>
                  )}
                </div>
              )}

              {/* Admin Dashboard */}
              {/*isAdmin && (
                <NavLink
                  to="/admin/dashboard"
                  className="flex items-center gap-3 text-red-600 font-bold hover:bg-red-100 dark:hover:bg-red-800 rounded-md px-3 py-2 transition mt-4"
                  onClick={toggleMinimize}
                >
                  <BarChart className="w-5 h-5" />
                  <span className="text-base">Admin Dashboard</span>
                </NavLink>
              )*/}

              {/* Business Analytics */}
              {isBusiness && (
                <NavLink
                  to="/business/analytics"
                  className="flex items-center gap-3 text-green-700 font-semibold hover:bg-green-100 dark:hover:bg-green-700 rounded-md px-3 py-2 transition mt-2"
                  onClick={toggleMinimize}
                >
                  <Layers className="w-5 h-5" />
                  <span className="text-base">Business Analytics</span>
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
