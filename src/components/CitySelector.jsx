import { useEffect, useState } from 'react'
import { useCity } from '../context/CityContext'
import React from 'react'

function CitySelector() {
  const { city, setCity } = useCity()
  const [show, setShow] = useState(false)
  const [selected, setSelected] = useState(city || '')

  useEffect(() => {
    if (!city) setShow(true)
  }, [city])

  const handleConfirm = () => {
    if (selected.trim()) {
      setCity(selected)
      setShow(false)
    }
  }

  const cities = ['Toronto', 'Vancouver', 'Calgary', 'Montreal']

  return show ? (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow w-[90%] max-w-md text-center">
        <h2 className="text-lg font-semibold mb-3">Select Your City</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        >
          <option value="">-- Select a city --</option>
          {cities.map((c) => (
            <option key={c} value={c.toLowerCase()}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={handleConfirm}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  ) : null
}

export default CitySelector
