import api from '../../api';
import React from 'react'

export default function AccountDelete() {
  const handleDeactivate = async () => {
    if (confirm('Are you sure you want to deactivate your account?')) {
      await api.delete('user/account/');
      alert('Account deactivated.');
      window.location.href = '/auth';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-red-600">Account Management</h2>
      <button onClick={handleDeactivate} className="bg-red-600 text-white px-4 py-2 rounded">
        Deactivate Account
      </button>
    </div>
  );
}
