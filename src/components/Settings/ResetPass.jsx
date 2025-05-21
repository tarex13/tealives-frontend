import { useState } from 'react';
import api from '../../api';

import React from 'react'
export default function ResetPass() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('user/change-password/', { old_password: oldPass, new_password: newPass });
      alert('Password changed successfully!');
      setOldPass('');
      setNewPass('');
    } catch {
      alert('Failed to change password.');
    }
  };

  return (
    <form  onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
      <input className="border p-2 mb-2 w-full" type="password" placeholder="Old Password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} required />
      <input className="border p-2 mb-2 w-full" type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
      <button className="btn bg-blue-600 text-white px-4 py-2 rounded" type="submit">Change Password</button>
    </form>
  );
}
