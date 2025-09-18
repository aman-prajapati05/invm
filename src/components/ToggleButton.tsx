'use client'
import { useState, useEffect } from 'react'
import { getMaintenanceMode, setMaintenanceMode } from '@/lib/api/maintenance'

export default function ToggleSwitch() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch initial maintenance mode state
    getMaintenanceMode()
      .then(setEnabled)
      .catch(() => setError('Failed to fetch maintenance mode'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    setError(null)
    try {
      await setMaintenanceMode(!enabled)
      setEnabled(!enabled)
    } catch (e) {
      setError('Failed to update maintenance mode')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='cursor-pointer'>
      <div
        onClick={loading ? undefined : handleToggle}
        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-disabled={loading}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  )
}
