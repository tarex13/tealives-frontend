import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useCity } from '../context/CityContext'

const rankIcons = ['🥇', '🥈', '🥉']

function getBorderAccent(index) {
  switch (index) {
    case 0: return 'border-l-4 border-yellow-400'
    case 1: return 'border-l-4 border-gray-400'
    case 2: return 'border-l-4 border-amber-500'
    default: return 'border-l-4 border-transparent'
  }
}

function Leaderboard() {
  const { city } = useCity()
  const [leaders, setLeaders] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`leaderboard/?city=${city}`)
      setLeaders(res.data)
    }
    load()
  }, [city])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-center">
      Leaderboard: Top Users in {city} 
      </h1>

      {leaders.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No rankings yet! U_U
        </p>
      ) : (
        <ul className="space-y-4">
          {leaders.map((user, idx) => (
            <li
              key={idx}
              onClick={() => navigate(`/profile/${user.username}`)}
              className={`cursor-pointer flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 hover:shadow-lg hover:border-blue-400 transition-all ${getBorderAccent(idx)}`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {rankIcons[idx] || `#${idx + 1}`}
                </div>
                <div>
                  <span className="block font-semibold text-lg text-gray-800 dark:text-gray-100">
                    {user.username}
                  </span>
                 {/* <div className="mt-1 h-2 w-32 bg-gray-300 dark:bg-gray-700 rounded">
                    <div
                      className="h-2 rounded bg-green-500 transition-all"
                      style={{ width: `${Math.min(user.xp / 10, 100)}%` }}
                    ></div>
                  </div>*/}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm text-gray-500 dark:text-gray-400">XP</div>
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  {user.xp}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Leaderboard
