import { XIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState } from 'react'
import Button from './Button';

interface DeactivateUserProps {
    userName?: string;
    onClose?: () => void;
    onDelete?: () => Promise<void>; // Updated to async function
}

const DeactivateUser: React.FC<DeactivateUserProps> = ({ userName, onClose, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDeactivate = async () => {
    if (!onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete();
      console.log('User deactivated successfully');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error deactivating user:', error);
      // Keep modal open on error so user can try again
    } finally {
      setIsLoading(false);
    }
  };

  return (
        <div className='bg-white p-4 rounded-xl shadow-lg max-w-xl w-full'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-base font-medium text-[#191A1B]'>Deactivate User</h2>
       <div className='cursor-pointer' onClick={onClose}>
        <XIcon size={16} color='#191A1B'/>
       </div>
      </div>
      <div className='text-[#90919B] text-sm mb-6'>
        {userName ? (
          <>This will deactivate <span className='font-medium text-[#191A1B]'>{userName}</span>. They will lose access to the dashboard. You can reactivate the account anytime from the User Management panel.</>
        ) : (
          'This user will lose access to the dashboard. You can reactivate the account anytime from the User Management panel.'
        )}
      </div>
      <div className='flex justify-end'>
        <div className='flex gap-2'>
        <Button text="Cancel" white={true} error={false} onClick={onClose} disabled={isLoading} />
        <Button 
          text={isLoading ? "Deactivating..." : "Deactivate"} 
          error={true} 
          onClick={handleDeactivate}
          disabled={isLoading}
        />
        </div>
      </div>
    </div>
  )
}

export default DeactivateUser

