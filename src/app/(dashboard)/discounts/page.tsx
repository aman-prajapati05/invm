'use client'

import ShippingManifest from '@/components/ShippingManifest'
import React from 'react'
import useProtectedRoute from '@/lib/useProtectedRoute'

const page = () => {
  const loading = useProtectedRoute(['shipping'])

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
   <ShippingManifest/>
  )
}

export default page
