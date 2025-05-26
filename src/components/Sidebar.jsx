import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar({ isOpen, toggleSidebar }) {
  const { user } = useAuth();
  const isAdmin = user?.is_superuser;
  const isStaff = user?.is_staff;
  const isModerator = user?.is_moderator;
  const isBusiness = user?.is_business;

  const linkClasses = ({ isActive }) =>
    `block w-full text-sm px-3 py-2 rounded-lg transition-all duration-200 font-medium
     ${isActive ? 'bg-blue-100 dark:bg-blue-600  text-blue-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-300'}`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
<aside
  className={`
    fixed top-[8vh] left-0 h-[calc(100vh-10vh)] w-64 
    p-6 bg-white dark:bg-gray-900 text-black dark:text-white py-2
    shadow-xl z-50 overflow-y-auto transition-transform duration-300
    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0
  `}
>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Menu</h2>

        <nav className="space-y-2">
          {user && <NavLink to="/profile" className={linkClasses}>My Profile</NavLink>}
          {user && <NavLink to="/inbox" className={linkClasses}>Inbox</NavLink>}
          {user && <NavLink to="/saved" className={linkClasses}>Saved</NavLink>}

          {user && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Settings</h3>
              <NavLink to="/settings/profile" className={linkClasses}>Edit Profile</NavLink>
              <NavLink to="/settings/reset" className={linkClasses}>Reset Password</NavLink>
              <NavLink to="/settings/notifications" className={linkClasses}>Notifications</NavLink>
              <NavLink to="/settings/privacy" className={linkClasses}>Privacy</NavLink>
              <NavLink to="/settings/preferences" className={linkClasses}>Preferences</NavLink>

            </>
          )}

          {(isAdmin || isStaff || isModerator) && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Moderation</h3>
              <NavLink to="/mod/dashboard" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                Moderator Dashboard
              </NavLink>
              <NavLink to="/mod/feedback" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                Feedback Admin
              </NavLink>
              <NavLink to="/mod/" className="block px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-800 transition">
                Reported Users
              </NavLink>
            </>
          )}

          {isAdmin && (
            <NavLink to="/admin/dashboard" className="block mt-6 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-white font-bold hover:bg-red-200 dark:hover:bg-red-700 transition">
              Admin Dashboard
            </NavLink>
          )}

          {isBusiness && (
            <NavLink to="/business/dashboard" className="block mt-4 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-800 text-green-700 dark:text-white font-semibold hover:bg-green-200 dark:hover:bg-green-700 transition">
              Business Dashboard
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
