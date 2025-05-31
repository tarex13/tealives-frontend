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
  setSidebarOpen,
  toggleSidebar,
  isMinimized,
  toggleMinimize,
}) {
  const { user } = useAuth();
  const isAdmin = user?.is_superuser;
  const isStaff = user?.is_staff;
  const isModerator = user?.is_moderator;
  const isBusiness = user?.is_business;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);

  // If a user is logged in, force the sidebar open on desktop (lg+).  
  // But on tablet/mobile we rely on `isOpen` alone.
  useEffect(() => {
    if (user) {
      // On desktop, we want it “open” (but collapse/minimize is handled by isMinimized).
      // On tablet/mobile, isOpen remains false until toggleSidebar is called.
      // We won't call setSidebarOpen(true) here because that would open the slide‐in on tablet immediately.
    }
  }, [user]);

  // Utility classes for links
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
      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 1️⃣ DESKTOP (lg+) FULL SIDEBAR, COLLAPSIBLE BY isMinimized */}
      {/* ──────────────────────────────────────────────────────────────────── */}
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
        {/* Header: “Menu” title + Minimize/Expand button */}
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
          // ─────── Minimized: Just a vertical stack of icon‐buttons ───────
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
              onClick={() => setSettingsOpen(o => !o)}
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
                <NavLink to="/settings/notifications" className={linkClasses}>
                  Notifications
                </NavLink>
                <NavLink to="/settings/privacy" className={linkClasses}>
                  Privacy
                </NavLink>
                <NavLink to="/settings/preferences" className={linkClasses}>
                  Preferences
                </NavLink>
              </div>
            )}
            {(isAdmin || isStaff || isModerator) && (
              <>
                <button
                  onClick={() => setModerationOpen(o => !o)}
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
                    <NavLink to="/mod/feedback" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Feedback Admin
                    </NavLink>
                    <NavLink to="/mod/reports" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Reported Users
                    </NavLink>
                  </div>
                )}
              </>
            )}
            {isAdmin && (
              <NavLink
                to="/admin/dashboard"
                className="block px-3 py-2 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-white font-bold hover:bg-red-200 dark:hover:bg-red-700 transition"
                title="Admin Dashboard"
              >
                <BarChart className="w-5 h-5 inline-block" /> {/* optional icon */}
              </NavLink>
            )}
            {isBusiness && (
              <NavLink
                to="/business/analytics"
                className="block px-3 py-2 rounded-lg bg-green-100 dark:bg-green-800 text-green-700 dark:text-white font-semibold hover:bg-green-200 dark:hover:bg-green-700 transition"
                title="Business Analytics"
              >
                <Layers className="w-5 h-5 inline-block" /> {/* optional icon */}
              </NavLink>
            )}
          </div>
        ) : (
          // ─────── Expanded: Full‐text links with icons ───────
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
                  Saved
                </NavLink>
              </>
            )}

            {/* Settings Accordion */}
            {user && (
              <>
                <button
                  onClick={() => setSettingsOpen(o => !o)}
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
                    <NavLink to="/settings/notifications" className={linkClasses}>
                      Notifications
                    </NavLink>
                    <NavLink to="/settings/privacy" className={linkClasses}>
                      Privacy
                    </NavLink>
                    <NavLink to="/settings/preferences" className={linkClasses}>
                      Preferences
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {/* Moderation Section */}
            {(isAdmin || isStaff || isModerator) && (
              <>
                <button
                  onClick={() => setModerationOpen(o => !o)}
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
                    <NavLink to="/mod/feedback" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Feedback Admin
                    </NavLink>
                    <NavLink to="/mod/reports" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                      Reported Users
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {/* Admin Dashboard */}
            {isAdmin && (
              <NavLink
                to="/admin/dashboard"
                className="block mt-4 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-white font-bold hover:bg-red-200 dark:hover:bg-red-700 transition"
              >
                Admin Dashboard
              </NavLink>
            )}

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
        )}
      </aside>




      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 3️⃣ MOBILE (<md) BOTTOM FAB + BOTTOM SHEET (quick actions)       */}
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* Floating Action Button (FAB) at bottom-right */}
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
            className="fixed inset-0"
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
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <button onClick={toggleMinimize}>
                <X className="w-6 cursor-pointer h-6 text-gray-800 dark:text-gray-200" />
              </button>
            </div>
            <nav className="flex flex-col space-y-4">
              <NavLink to={`/profile/${user.username}`} className="flex items-center gap-3" onClick={toggleMinimize}>
                <User className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                <span className="text-base">Profile</span>
              </NavLink>
              <NavLink to="/inbox" className="flex items-center gap-3" onClick={toggleMinimize}>
                <Mail className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                <span className="text-base">Inbox</span>
              </NavLink>
              <NavLink to="/saved" className="flex items-center gap-3" onClick={toggleMinimize}>
                <Bookmark className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                <span className="text-base">Saved</span>
              </NavLink>
              <NavLink to="/settings" className="flex items-center gap-3" onClick={toggleMinimize}>
                <Settings className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                <span className="text-base">Settings</span>
              </NavLink>
              { (isAdmin || isStaff || isModerator) && (
                <NavLink to="/mod/dashboard" className="flex items-center gap-3 text-red-600" onClick={toggleMinimize}>
                  <Shield className="w-5 h-5" />
                  <span className="text-base">Moderator Dashboard</span>
                </NavLink>
              )}
              { isAdmin && (
                <NavLink to="/admin/dashboard" className="flex items-center gap-3 text-red-600 font-bold" onClick={toggleMinimize}>
                  <BarChart className="w-5 h-5" />
                  <span className="text-base">Admin Dashboard</span>
                </NavLink>
              )}
              { isBusiness && (
                <NavLink to="/business/analytics" className="flex items-center gap-3 text-green-700 font-semibold" onClick={toggleMinimize}>
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
