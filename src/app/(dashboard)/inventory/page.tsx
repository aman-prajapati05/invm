'use client'

import Orders from '@/components/Orders'
import React from 'react'
import useProtectedRoute from '@/lib/useProtectedRoute'
import Inventory from '@/components/Inventory'

const page = () => {
  const loading = useProtectedRoute(['inventory'])

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    // <Orders/>
    <Inventory/>
  )
}

export default page
