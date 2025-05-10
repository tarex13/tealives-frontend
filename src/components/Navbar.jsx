import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationDropdown from './NotificationDropdown'
import useDarkMode from '../hooks/useDarkMode'

function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useDarkMode()

  return (
    <nav style={{zIndex: '1', position: 'absolute', left: '0', width:'100%'}} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow px-4 py-2 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
        <Link to="/">Tealives</Link>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/marketplace" className="hover:underline">Marketplace</Link>
        <Link to="/events" className="hover:underline">Events</Link>
        <Link to="/groups" className="px-4 py-2 hover:underline">Groups</Link>
        {user && <Link to="/profile" className="hover:underline">My Profile</Link>}
        <Link to="/feedback">Feedback</Link>
        <Link to="/terms" className="text-sm text-gray-500 hover:underline">Terms</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        
        {user && <Link to="/saved">Saved</Link>}
        {user && <NotificationDropdown />}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="ml-2 text-xs px-2 py-1 border rounded dark:border-gray-600"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        {user?.user?.profile_image && (
  <img
    src={user.user.profile_image}
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
  )
}

export default Navbar
