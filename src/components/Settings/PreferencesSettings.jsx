import { useState, useEffect } from 'react';
import api from '../../api';
import React from 'react'

export default function PreferencesSettings() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    api.get('user/preferences/').then((res) => {
      setTheme(res.data.preferred_theme);
      setLanguage(res.data.language);
    });
  }, []);

  const savePreferences = () => {
    api.post('user/preferences/', { preferred_theme: theme, language }).then(() => alert('Preferences saved.'));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Preferences</h2>
      <label className="block mb-2">
        Theme:
        <select className="border p-2 ml-2" value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label className="block mb-2">
        Language:
        <input className="border p-2 ml-2" value={language} onChange={(e) => setLanguage(e.target.value)} />
      </label>
      <button className="btn bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={savePreferences}>
        Save Preferences
      </button>
    </div>
  );
}
