// src/components/NavDrawer.jsx
import React, { useEffect, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { NavLink } from 'react-router-dom'
import {
  User,
  Mail,
  Bookmark,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  Menu as MenuIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function NavDrawer({
  isOpen,
  onClose,
  isMinimized,
  onMinimize,
}) {
  const { user } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [moderationOpen, setModerationOpen] = useState(false)

  // close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* drawer */}
      <FocusLock returnFocus>
        <aside
          className={`
            fixed top-0 left-0 h-full w-64
            bg-white dark:bg-gray-900
            shadow-xl z-50
            transform transition-transform duration-300 translate-x-0
          `}
          role="dialog"
          aria-modal="true"
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {!isMinimized && <h2 className="text-xl font-bold">Menu</h2>}
            <button
              onClick={onMinimize}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isMinimized ? 'Expand menu' : 'Collapse menu'}
            >
              <MenuIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            </button>
          </div>

          {/* nav links */}
          <nav className="px-4 py-4 space-y-2 overflow-y-auto text-sm">
            {/* Profile / Inbox / Saved */}
            <NavLink
              to={`/profile/${user?.username}`}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <User className="w-5 h-5" />
              My Profile
            </NavLink>

            <NavLink
              to="/inbox"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <Mail className="w-5 h-5" />
              Inbox
            </NavLink>

            <NavLink
              to="/saved"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <Bookmark className="w-5 h-5" />
              Saved
            </NavLink>

            {/* Settings accordion */}
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className="flex justify-between w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
            >
              <span className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                Settings
              </span>
              {settingsOpen ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>

            {settingsOpen && (
              <div className="pl-8 space-y-1">
                <NavLink
                  to="/settings/profile"
                  className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onClose}
                >
                  Edit Profile
                </NavLink>
                <NavLink
                  to="/settings/reset"
                  className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onClose}
                >
                  Reset Password
                </NavLink>
                <NavLink
                  to="/settings/notifications"
                  className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onClose}
                >
                  Notifications
                </NavLink>
                <NavLink
                  to="/settings/privacy"
                  className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onClose}
                >
                  Privacy
                </NavLink>
                <NavLink
                  to="/settings/preferences"
                  className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onClose}
                >
                  Preferences
                </NavLink>
              </div>
            )}

            {/* Moderation accordion */}
            {(user?.is_superuser || user?.is_staff || user?.is_moderator) && (
              <>
                <button
                  onClick={() => setModerationOpen((o) => !o)}
                  className="flex justify-between w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-red-600 dark:text-red-300"
                >
                  <span className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    Moderation
                  </span>
                  {moderationOpen ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                {moderationOpen && (
                  <div className="pl-8 space-y-1">
                    <NavLink
                      to="/mod/dashboard"
                      className="block px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-800"
                      onClick={onClose}
                    >
                      Moderator Dashboard
                    </NavLink>
                    <NavLink
                      to="/mod/feedback"
                      className="block px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-800"
                      onClick={onClose}
                    >
                      Feedback Admin
                    </NavLink>
                    <NavLink
                      to="/mod/reports"
                      className="block px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-800"
                      onClick={onClose}
                    >
                      Reported Users
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {/* Admin */}
            {user?.is_superuser && (
              <NavLink
                to="/admin/dashboard"
                className="block mt-4 px-3 py-2 rounded bg-red-100 dark:bg-red-800 text-red-700 dark:text-white font-bold hover:bg-red-200 dark:hover:bg-red-700"
                onClick={onClose}
              >
                Admin Dashboard
              </NavLink>
            )}

            {/* Business */}
            {user?.is_business && (
              <NavLink
                to="/business/analytics"
                className="block mt-2 px-3 py-2 rounded bg-green-100 dark:bg-green-800 text-green-700 dark:text-white font-semibold hover:bg-green-200 dark:hover:bg-green-700"
                onClick={onClose}
              >
                Business Analytics
              </NavLink>
            )}
          </nav>
        </aside>
      </FocusLock>
    </>
  )
}
