import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import useDarkMode from '../hooks/useDarkMode';

export default function Navbar({ toggleSidebar }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClasses = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition
     ${isActive
       ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
       : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`;

  return (
    <nav className="fixed inset-x-0 top-0 h-16 z-50 bg-white dark:bg-gray-900 shadow-sm flex items-center px-4 md:px-8">
      {/* Left: logo & mobile menu button */}
      <div className="flex items-center flex-1">
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Bars3Icon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
        </button>
        <Link
          to="/"
          className="ml-2 text-lg font-bold text-blue-600 dark:text-blue-400"
        >
          Tealives
        </Link>
      </div>

      {/* Center / Right: desktop links + utilities */}
      <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
        <NavLink to="/" className={linkClasses}>Home</NavLink>
        <NavLink to="/marketplace" className={linkClasses}>Marketplace</NavLink>
        <NavLink to="/events" className={linkClasses}>Events</NavLink>
        <NavLink to="/groups" className={linkClasses}>Groups</NavLink>
        <NavLink to="/feedback" className={nav =>
          `${linkClasses(nav)} hidden md:inline`
        }>Feedback</NavLink>
        <NavLink to="/leaderboard" className={nav =>
          `${linkClasses(nav)} hidden lg:inline`
        }>Leaderboard</NavLink>
        <NavLink to="/terms" className={nav =>
          `${linkClasses(nav)} hidden xl:inline`
        }>Terms</NavLink>

        {user && <NotificationDropdown />}

        {user ? (
          <button
            onClick={logoutUser}
            className="text-red-600 hover:underline px-3 py-2 text-sm font-medium"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate('/user/auth')}
            className="text-blue-600 hover:underline px-3 py-2 text-sm font-medium"
          >
            Login
          </button>
        )}
      </div>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-900 h-full shadow-xl p-4">
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/"
                className="text-lg font-bold text-blue-600 dark:text-blue-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tealives
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <XMarkIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
              </button>
            </div>

            <nav className="flex flex-col space-y-2">
              <NavLink
                to="/"
                className={linkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >Home</NavLink>
              <NavLink
                to="/marketplace"
                className={linkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >Marketplace</NavLink>
              <NavLink
                to="/events"
                className={linkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >Events</NavLink>
              <NavLink
                to="/groups"
                className={linkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >Groups</NavLink>
              <NavLink
                to="/feedback"
                className={link => `${linkClasses(link)} hidden md:block`}
                onClick={() => setMobileMenuOpen(false)}
              >Feedback</NavLink>
              <NavLink
                to="/leaderboard"
                className={link => `${linkClasses(link)} hidden lg:block`}
                onClick={() => setMobileMenuOpen(false)}
              >Leaderboard</NavLink>
              <NavLink
                to="/terms"
                className={link => `${linkClasses(link)} hidden xl:block`}
                onClick={() => setMobileMenuOpen(false)}
              >Terms</NavLink>

 

              {user && (
                <>
                  <div className="mt-2 hidden md:block">
                    <NotificationDropdown isMobile onClose={() => setMobileMenuOpen(false)} />
                      
                  </div>
                  <NavLink to="/notifications"
                className={link => `${linkClasses(link)} mt-2 md:hidden`}
                onClick={() => setMobileMenuOpen(false)}>Notifications</NavLink>
                </>
              )}

              {user ? (
                <button
                  onClick={() => {
                    logoutUser();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-4 text-red-600 hover:underline px-3 py-2 text-sm font-medium"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/user/auth');
                    setMobileMenuOpen(false);
                  }}
                  className="mt-4 text-blue-600 hover:underline px-3 py-2 text-sm font-medium"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
          {/* Overlay */}
          <div
            className="flex-1 bg-opacity-50 bg-opacity-50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
        
      )}
    </nav>
  );
}
