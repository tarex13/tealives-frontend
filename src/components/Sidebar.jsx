import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'

function Sidebar({ isOpen, toggleSidebar }) {
  const { user } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      <div style={{paddingTop: '25vh', zIndex: '0', position: 'relative'}}
        className={`fixed top-0 left-0 h-full w-64 bg-gray-100 p-4 z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 md:translate-x-0 md:static md:block`}
      >
        <h2 className="text-lg font-bold mb-4">Navigation</h2>
        <ul className="space-y-2">
        {user && <li><Link to="/profile/edit">Edit Profile</Link></li>}
        {user && <li><Link to="/inbox" className="hover:underline">Inbox</Link></li>}
        {user && <li><Link to="/saved">Saved</Link></li>}
        
        {user?.is_staff || user?.is_moderator ? (
          <li><Link to="/mod/feedback" className="text-red-600 font-semibold">
            Feedback Admin
          </Link></li>
        ) : null}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
