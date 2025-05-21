import React, { useEffect, useState } from 'react';
import { useCity } from '../context/CityContext';
import { CITIES } from '../../constants';

function CitySelectorModal() {
  const { city, setCity } = useCity();
  const [visible, setVisible] = useState(false);
  const [rememberCity, setRememberCity] = useState(false);

  useEffect(() => {
    if (!city) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [city]);

  const handleSelect = (e) => {
    const selected = e.target.value;
    if (selected !== 'Select') {
      setCity(selected);
      if (rememberCity) {
        localStorage.setItem('city', selected);
      }
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-11/12 max-w-sm animate-fade-in-up">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">🌆 Choose Your Community</h2>
        <select
          onChange={handleSelect}
          defaultValue="Select"
          className="block w-full p-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        >
          <option disabled value="Select">Select a city</option>
          {CITIES.map(city => (
            <option key={city} value={city}>{city.charAt(0).toUpperCase() + city.slice(1)}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300 text-sm justify-center">
          <input
            type="checkbox"
            checked={rememberCity}
            onChange={(e) => setRememberCity(e.target.checked)}
            className="accent-blue-500"
          />
          Remember my city
        </label>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">You can always change this later.</p>
      </div>
    </div>
  );
}

export default CitySelectorModal;
