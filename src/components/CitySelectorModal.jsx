import React, { useEffect, useState } from 'react';
import { useCity } from '../context/CityContext';
import '../css/CitySelectorModal.css'
import { CITIES } from '../../constants';
function CitySelectorModal() {
  const { city, setCity } = useCity();
  const [visible, setVisible] = useState(false);
  const [rememberCity, setRememberCity] = useState(false);

  useEffect(() => {
    if (!city) {
      setVisible(true);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto'; // Cleanup on unmount
    };
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center w-11/12 max-w-sm animate-fade-in-up">
        <h2 className="text-xl font-bold mb-4">Choose Your Community</h2>
        <select
          onChange={handleSelect}
          className="p-2 rounded border w-full focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 mb-4"
          defaultValue="Select"
        >
          <option disabled value="Select">Select</option>
          {CITIES.map((cityName) => (
    <option key={cityName} value={cityName}>
      {cityName.charAt(0).toUpperCase() + cityName.slice(1)}
    </option>
  ))}
        </select>

        <label className="flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-300 text-sm mb-4">
          <input
            type="checkbox"
            checked={rememberCity}
            onChange={(e) => setRememberCity(e.target.checked)}
            className="accent-blue-600"
          />
          <span>Remember my city</span>
        </label>

        <p className="text-gray-500 text-sm">You can always change this later from the city selector.</p>
      </div>
    </div>
  );
}

export default CitySelectorModal;
