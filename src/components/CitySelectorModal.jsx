import { useEffect, useState } from 'react'
import { useCity } from '../context/CityContext'
import React from 'react'

function CitySelectorModal() {
  const { city, setCity } = useCity()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!city) setVisible(true)
  }, [city])

  const handleSelect = (e) => {
    const selected = e.target.value
    if (selected !== 'Select') {
      setCity(selected)
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center">
        <h2 className="text-lg font-semibold mb-4">Choose Your Community</h2>
        <select
          onChange={handleSelect}
          className="p-2 rounded border w-full"
          defaultValue="Select"
        >
          <option disabled value="Select">Select</option>
          <option value="toronto">Toronto</option>
          <option value="vancouver">Vancouver</option>
          <option value="calgary">Calgary</option>
          <option value="montreal">Montreal</option>
        </select>
      </div>
    </div>
  )
}

export default CitySelectorModal
