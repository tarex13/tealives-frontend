import { useEffect, useState } from 'react'
import React from 'react'
import api from '../api'

function ModPanel() {
  const [reports, setReports] = useState([])

  const loadReports = async () => {
    try {
      const res = await api.get('reports/')
      setReports(res.data)
    } catch (err) {
      console.error('Error loading reports', err)
    }
  }

  const handleAction = async (id, action) => {
    try {
      await api.patch(`report/${id}/`, { action })
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert('Action failed')
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Moderator Panel</h1>
      {reports.length === 0 ? (
        <p>No pending reports 🎉</p>
      ) : (
        reports.map((report) => (
          <div key={report.id} className="bg-white p-4 rounded shadow mb-4">
            <p className="text-sm">
              <strong>{report.content_type.toUpperCase()}</strong> ID {report.content_id} reported by user {report.reported_by}
            </p>
            <p className="mb-2"><strong>Reason:</strong> {report.reason}</p>
            <p className="text-sm italic text-gray-500 mb-3">
              Preview: {report.content_snippet || 'N/A'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleAction(report.id, 'delete')}
                className="bg-red-600 text-white px-3 py-1 rounded text-xs"
              >
                Delete Content
              </button>
              <button
                onClick={() => handleAction(report.id, 'suspend')}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
              >
                Suspend User
              </button>
              <button
                onClick={() => handleAction(report.id, 'dismiss')}
                className="bg-gray-500 text-white px-3 py-1 rounded text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default ModPanel
