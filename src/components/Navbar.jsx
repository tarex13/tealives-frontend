import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import useDarkMode from '../hooks/useDarkMode';

function Navbar({ toggleSidebar }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useDarkMode();

  const linkClasses = ({ isActive }) =>
    `block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
      isActive ? 'bg-gray-300 dark:bg-gray-700 font-semibold' : ''
    }`;

  return (
    <nav
      style={{ zIndex: '1', position: 'fixed', left: '0', width: '100%', height: '4vw' }}
      className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow px-4 py-2 flex justify-between items-center"
    >
      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
        <Link to="/">Tealives</Link>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <NavLink to="/" className={linkClasses}>Home</NavLink>
        <NavLink to="/marketplace" className={linkClasses}>Marketplace</NavLink>
        <NavLink to="/events" className={linkClasses}>Events</NavLink>
        <NavLink to="/groups" className={linkClasses}>Groups</NavLink>
        <NavLink to="/feedback" className={linkClasses}>Feedback</NavLink>
        <NavLink to="/terms" className={linkClasses}>Terms</NavLink>
        <NavLink to="/leaderboard" className={linkClasses}>Leaderboard</NavLink>
        {user && <NotificationDropdown />}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="ml-2 text-xs px-2 py-1 border rounded dark:border-gray-600"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>

        {user?.profile_image_url && (
          <img
            src={user.profile_image_url}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        )}

        {user ? (
          <button
            onClick={logoutUser}
            className="ml-2 text-red-600 hover:underline"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="ml-2 text-blue-600 hover:underline"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
