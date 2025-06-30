// src/components/CitySelectorModal.jsx
import React, { useEffect, useState } from 'react'
import { useCity } from '../context/CityContext'
import { Link } from 'react-router-dom';

export default function CitySelectorModal() {
  const { city, setCity, cities } = useCity()
  const [visible, setVisible] = useState(false)
  const [rememberCity, setRememberCity] = useState(false)

  // Show modal whenever there’s no selected city;
  // also lock page scroll while it’s open.
  useEffect(() => {
    if (!city) {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      // ensure we always restore scrolling if this component unmounts
      document.body.style.overflow = 'auto'
    }
  }, [city])

  const handleSelect = (e) => {
    const selected = e.target.value
    if (selected === 'Select') return

    // // update context (which by default writes with TTL)
    // setCity(selected)

    // if (!rememberCity) {
    //   // if the user opted *not* to remember, immediately remove the persisted data
    //   try {
    //     localStorage.removeItem('city')
    //     localStorage.removeItem('city_expires')
    //   } catch {
    //     // ignore quota errors
    //   }
    // }
    setCity(selected);
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-11/12 max-w-sm animate-fade-in-up">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">
          🏘️ Choose Your Community
        </h2>

        {/* City dropdown: options come from React-managed `cities` */}
        <select
          onChange={handleSelect}
          defaultValue="Select"
          className="block w-full p-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        >
          <option disabled value="Select">
            Select a city
          </option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

        {/* Checkbox to opt into persistent storage */}
{/*         <label className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300 text-sm justify-center">
          <input
            type="checkbox"
            checked={rememberCity}
            onChange={(e) => setRememberCity(e.target.checked)}
            className="accent-blue-500"
          />
          Remember my city
        </label> */}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          You can always change this later.
        </p>
        {/* ———————————————————————————————————————————————— */}
     {/* Terms notice: */}
     <p className="mt-4  text-center text-xs text-gray-600">
       By continuing, you agree to our{' '}
       <Link to="/terms" className="underline hover:text-gray-800">
         Terms of Service
       </Link>{' '}
       and{' '}
       <Link to="/privacy" className="underline hover:text-gray-800">
         Privacy Policy
       </Link>.
     </p>
     {/* ———————————————————————————————————————————————— */}
      </div>
          
    </div>
  )
}
