"use client";
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr'
import React from 'react'
import ToggleSwitch from './ToggleButton'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasAllRequiredPermissions } from '@/lib/utils/checkPermission';

const Settings = () => {
    const router = useRouter();

    const {user} = useAuth();
  return (
    <div className='w-full h-screen bg-[#F5F5F5] p-6 '>
        <div className='text-xl font-medium text-[#191A1B] mb-4'>Settings</div>
        <div className='flex flex-col gap-6'>
        <div>
            <div className='text-[#545659] text-base font-medium mb-2'>
            Security
            </div>
            <div className='flex justify-between items-end bg-white w-full p-4 rounded-lg shadow-md'>
                <div className='flex flex-col gap-1 '>
                <div className='text-[#191A1B] text-base font-medium '>Email</div>
                <div className='flex items-center gap-1'>
                    <div className='text-sm text-[#90919B] '>{user?.email}</div>
                    <div onClick={() => {
                        router.push('/update-email');
                    }} className='cursor-pointer'><PencilSimpleIcon  size={16} color='#90919B' /></div>
                </div>
                </div>
                <div className=' text-[#005BD3] text-xs cursor-pointer' onClick={() => router.push('/update-password')}>
                    Change Password
                </div>
            </div>
        </div>
        {/* Show Maintenance Mode only if user has all permissions */}
        {hasAllRequiredPermissions(user!) && (
          <div>
              <div className='text-[#545659] text-base font-medium mb-2'>
              Maintenance
              </div>
              <div className='flex justify-between items-center bg-white w-full p-4 rounded-lg shadow-md'>
                  <div className='flex flex-col gap-1 '>
                  <div className='text-[#191A1B] text-base font-medium '>Maintenance Mode</div>
                  <div className='flex items-center gap-1'>
                      <div className='text-sm text-[#90919B] '>Temporarily disable dashboard operations for all users except Admins.</div>
                  </div>
                  </div>
              <ToggleSwitch/>
              </div>
          </div>
        )}
        </div>
    </div>
  )
}

export default Settings
