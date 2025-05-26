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
    `px-2 py-1 sm:px-3 sm:py-2 rounded-md transition font-medium text-sm ${
      isActive
        ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;

  return (
    <nav className="fixed h-[8vh] top-0 left-0 w-full z-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm py-2 lg:py-1 px-1 sm:px-4 flex justify-between items-center">
      <Link to="/" className="sm:text-xl text-sm font-bold text-blue-600 dark:text-blue-400">
        Tealives
      </Link>

      <div className="flex items-center gap-1 sm:gap-3 flex-wrap justify-end">
        <NavLink to="/" className={linkClasses}>Home</NavLink>
        <NavLink to="/marketplace" className={linkClasses}>Marketplace</NavLink>
        <NavLink to="/events" className={linkClasses}>Events</NavLink>
        <NavLink to="/groups" className={linkClasses}>Groups</NavLink>
        <NavLink to="/feedback" className={(navData) => `${linkClasses(navData)} hidden md:inline-block`}>Feedback</NavLink>
        <NavLink to="/leaderboard" className={(navData) => `${linkClasses(navData)} hidden sm:inline-block`}>Leaderboard</NavLink>
        <NavLink to="/terms" className={(navData) => `${linkClasses(navData)} hidden lg:inline-block`}>Terms</NavLink>

        {user && <NotificationDropdown />}


        {user ? (
          <button
            onClick={logoutUser}
            className="text-red-600 hover:underline text-sm font-medium"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate('/user/auth')}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
