import React, { useState, useEffect } from 'react'
import { useCity } from '../context/CityContext'
import { useCities } from '../hooks/useCities'

export default function CitySelector() {
  const { city, setCity } = useCity()
  const cities = useCities()         // reactive list of cities
  const [show, setShow] = useState(false)
  const [selected, setSelected] = useState('')

  // as soon as we have cities _and_ no city chosen, show the modal
  useEffect(() => {
    if (!city && cities.length > 0) {
      setShow(true)
    }
  }, [city, cities])

  const handleConfirm = () => {
    const trimmed = selected.trim()
    if (!trimmed) return

    // update your context
    setCity(trimmed)

    // cache the user’s choice
    try {
      const expires = Date.now() + 7 * 24 * 60 * 60 * 1000
      localStorage.setItem('city', trimmed)
      localStorage.setItem('city_expires', expires.toString())
    } catch {} // ignore

    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-[90%] max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Select Your City
        </h2>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-3 rounded-md"
          autoFocus
        >
          <option value="">-- Select a city --</option>
          {cities.map(c => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={handleConfirm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
