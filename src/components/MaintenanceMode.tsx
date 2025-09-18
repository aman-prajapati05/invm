import Image from 'next/image'
import React from 'react'

const MaintenanceMode = () => {
  return (
    <div className='w-screen h-screen flex items-center justify-center bg-white'>
        <div className='flex flex-col items-center gap-4'>
      <Image
        src='/maintenance2.png'
        alt='Maintenance Mode'
        width={500}
        height={300}
      />
      <div className='font-medium text-4xl text-[#404040] '>
        We’ll be back soon.
      </div>
      <div className='text-center text-[#A8A8A7] text-lg'>
        The system is currently under maintenance. You’ll be <br /> able to access the dashboard once we're done.
      </div>
      </div>

    </div>
  )
}

export default MaintenanceMode
