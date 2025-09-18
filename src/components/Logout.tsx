import React from 'react'
import Button from './Button'

interface LogoutProps {
  onLogout: () => void;
  onCancel: () => void;
}

const Logout: React.FC<LogoutProps> = ({ onLogout, onCancel }) => {
  return (
    <div className='bg-white p-4 rounded-lg shadow-lg max-w-md w-full mx-4'>
      <div className='mb-4'>
        <div className='text-lg font-medium text-[#191A1B] mb-1'>Log Out</div>
        <div className='text-[#90919B] text-sm'>
          Are you sure you want to log out? You will need to enter your credentials to log back in.
        </div>
      </div>
      <div className='flex gap-2 justify-end'>
        <Button error={false} text="Cancel" onClick={onCancel} />
        <Button error={true} text="Log Out" onClick={onLogout} />
      </div>
    </div>
  )
}

export default Logout
