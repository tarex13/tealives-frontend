import { useState, useEffect } from 'react';
import api from '../../api';
import React from 'react'

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    email_promotions: false,
    activity_notifications: true,
  });

  useEffect(() => {
    // Load user notification preferences if stored in backend (optional future feature)
  }, []);

  const handleSave = () => {
    alert('Notification preferences saved.');
    // Add backend API integration here if needed
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notification Preferences</h2>
      <label>
        <input type="checkbox" checked={preferences.email_promotions} onChange={(e) => setPreferences({ ...preferences, email_promotions: e.target.checked })} />
        Receive Promotional Emails
      </label>
      <br />
      <label>
        <input type="checkbox" checked={preferences.activity_notifications} onChange={(e) => setPreferences({ ...preferences, activity_notifications: e.target.checked })} />
        Activity Notifications
      </label>
      <br />
      <button className="btn bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={handleSave}>
        Save Preferences
      </button>
    </div>
  );
}
