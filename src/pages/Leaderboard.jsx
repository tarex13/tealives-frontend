import { useEffect, useState } from 'react'
import axios from 'axios'
import React from 'react'
import api from '../api'
import { useCity } from '../context/CityContext'

function Leaderboard() {
  const { city } = useCity()
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`leaderboard/?city=${city}`)
      setLeaders(res.data)
    }
    load()
  }, [city])

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🏆 Top Users in {city}</h1>
      {leaders.length === 0 ? (
        <p>No rankings yet!</p>
      ) : (
        <ul className="space-y-2">
          {leaders.map((user, idx) => (
            <li key={idx} className="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between">
              <span>#{idx + 1} {user.username}</span>
              <span>{user.xp} XP</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Leaderboard
