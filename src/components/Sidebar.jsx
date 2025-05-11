import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

function Sidebar({ isOpen, toggleSidebar }) {
  const { user } = useAuth();

  const isAdmin = user?.is_superuser;
  const isStaff = user?.is_staff;
  const isModerator = user?.is_moderator;
  const isBusiness = user?.is_business;

  const linkClasses = ({ isActive }) =>
    `block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
      isActive ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : ''
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      <div
        style={{ top: '4vw', zIndex: '0', position: 'fixed', overflow:'auto', color: '#fff' }}
        className={`fixed top-0 left-0 h-full w-64 bg-gray-100 dark:bg-gray-800 p-4 z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 md:translate-x-0 md:static md:block`}
      >
        <h2 className="text-lg font-bold mb-4">Navigation</h2>
        <ul className="space-y-2">
                {user && <NavLink to="/profile" className={linkClasses}>My Profile</NavLink>}
          {user && <li><NavLink to="/inbox" className={linkClasses}>Inbox</NavLink></li>}
          {user && <li><NavLink to="/saved" className={linkClasses}>Saved</NavLink></li>}

          {user && (
            <>
              <h3 className="text-md font-semibold mt-4">Settings</h3>
              <li><NavLink to="/settings/profile" className={linkClasses}>Edit Profile</NavLink></li>
              <li><NavLink to="/settings/ResetPass" className={linkClasses}>Reset Password</NavLink></li>
              <li><NavLink to="/settings/notifications" className={linkClasses}>Notifications</NavLink></li>
              <li><NavLink to="/settings/privacy" className={linkClasses}>Privacy</NavLink></li>
              <li><NavLink to="/settings/preferences" className={linkClasses}>Preferences</NavLink></li>
              <li>
                <NavLink
                  to="/settings/delete"
                  className={({ isActive }) => `${linkClasses({ isActive })} text-red-600`}
                >
                  Delete Account
                </NavLink>
              </li>
            </>
          )}

          {(isModerator || isStaff || isAdmin) && (
            <li>
              <NavLink to="/mod/feedback" className="text-red-600 font-semibold hover:underline">
                Feedback Admin
              </NavLink>
            </li>
          )}

          {isAdmin && (
            <li>
              <NavLink to="/admin/dashboard" className="text-red-700 font-bold hover:underline">
                Admin Dashboard
              </NavLink>
            </li>
          )}

          {isBusiness && (
            <li>
              <NavLink to="/business/dashboard" className="text-green-600 font-semibold hover:underline">
                Business Dashboard
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
