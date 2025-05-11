import { NavLink, Outlet } from 'react-router-dom';
import React from 'react'

export default function SettingsDashboard() {
  const linkClasses = ({ isActive }) =>
    `block p-2 rounded hover:bg-gray-200 ${isActive ? 'bg-gray-300 font-semibold' : ''}`;

  return (
    <div className="flex flex-col md:flex-row mt-8">
      <nav className="w-full md:w-1/4 p-4 bg-gray-100 space-y-2">
        <NavLink to="/settings/profile" className={linkClasses}>Edit Profile</NavLink>
        <NavLink to="/settings/security" className={linkClasses}>Security</NavLink>
        <NavLink to="/settings/notifications" className={linkClasses}>Notifications</NavLink>
        <NavLink to="/settings/privacy" className={linkClasses}>Privacy</NavLink>
        <NavLink to="/settings/preferences" className={linkClasses}>Preferences</NavLink>
        <NavLink to="/settings/account" className={linkClasses + ' text-red-600'}>Account</NavLink>
      </nav>
      <main className="w-full md:w-3/4 p-4 bg-white shadow rounded">
       
      </main>
    </div>
  );
}
