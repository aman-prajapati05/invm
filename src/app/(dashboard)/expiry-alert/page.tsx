'use client'

import LabelMaker from '@/components/LabelMaker'
import React from 'react'
import useProtectedRoute from '@/lib/useProtectedRoute'
import ExpiryDashboard from '@/components/ExpiryDashboard'

const page = () => {
  const loading = useProtectedRoute(['expiry'])

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
<>
<ExpiryDashboard/>
</>
  )
}

export default page
