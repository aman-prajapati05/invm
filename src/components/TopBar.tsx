"use client"
import { GearSixIcon, SignOutIcon, WarningCircleIcon,MagnifyingGlassIcon,BellIcon, CommandIcon,  ArrowLeftIcon, ListDashesIcon, SidebarSimpleIcon } from '@phosphor-icons/react/dist/ssr'
import { useSidebar } from '@/contexts/SidebarContext'

import Image from 'next/image'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useBulkEdit } from '@/contexts/BulkEditContext'
import { useNotifications } from '@/contexts/NotificationContext'

interface TopBarProps {
  openModal: (modalType: string, data?: any) => void;
  showNotification?: boolean;
  setShowNotification?: (show: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  openModal, 
  showNotification, 
  setShowNotification
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user} = useAuth();
  const { isBulkEditMode, hasUnsavedChanges, onSaveBulkEdit, onDiscardBulkEdit, onResetChanges } = useBulkEdit();
  const { unreadCount } = useNotifications();
  const { isSidebarOpen, setSidebarOpen } = useSidebar();
  // Function to get user initials
  const getUserInitials = () => {
    // Try to use user.displayName, fallback to email, then 'U'
    const displayName = (user as any)?.name || (user as any)?.displayName || (user as any)?.email;
    if (!displayName) return 'U'; // Default fallback

    const names = displayName.trim().split(' ');
    if (names.length === 1) {
      // If only one name, take first two characters
      return names[0].substring(0, 2).toUpperCase();
    } else {
      // If multiple names, take first character of first two names
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
  };

  
  // Global keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openModal('search');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openModal]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Function to handle logout
  const handleLogout = () => {
    // Open the logout modal
    openModal('logout');
    setShowDropdown(false); // Close dropdown after opening modal
  };

  // Function to handle account settings
  const handleAccountSettings = () => {
    // Logic for navigating to account settings
    console.log("Navigating to account settings");
    setShowDropdown(false); // Close dropdown after navigation
    router.push('/settings'); // Example route, adjust as needed
  };
  
  // Function to handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    // Logic for handling search input    

    console.log("Search query:", query);
  };

  // Function to handle key commands
  const handleKeyCommand = (event: React.KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      openModal('search');
    }
  };





  return (
    <div className='flex bg-white  justify-between items-center px-5 py-3 border-b border-[#EAEAEA]'>
      {/* Sidebar open/close buttons */}
      <div className='flex gap-2 items-center'>
       <Link href={'/'} className='cursor-pointer'><Image
        src="/logo.png"
        alt="Logo"
        width={60}
        height={60}
        className='object-contain cursor-pointer'
      />
      </Link>
      {isSidebarOpen ? (
        <button
          className='mr-3 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors flex items-center'
          aria-label='Close sidebar'
          onClick={() => setSidebarOpen(false)}
        >
          {/* X icon */}
          <SidebarSimpleIcon size={22} color='#191A1B' />
        </button>
      ) : (
        <button
          className='mr-3 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors flex items-center'
          aria-label='Open sidebar'
          onClick={() => setSidebarOpen(true)}
        >
          <SidebarSimpleIcon size={22} color='#191A1B' />
        </button>
      )}
     
     </div>
      <div 
        className={`border-[#EAEAEA] text-sm border w-[40%] h-12 rounded-lg flex justify-between items-center px-2 cursor-pointer ${
          isBulkEditMode ? 'hidden' : ''
        }`}
        onClick={() => openModal('search')}
      >
        <div className='flex text-[#90919B] gap-1 items-center flex-1 cursor-pointer'>
          <MagnifyingGlassIcon size={16} color='#191A1B' />
          <div className="flex-1 text-[#90919B]">Search</div>
        </div>
        <div className='flex text-sm text-[#90919B] items-center'>
          <CommandIcon size={14} color='#90919B' />
          K
        </div>
      </div>

      {/* Bulk Edit Mode Bar - Only show when there are unsaved changes */}
      {isBulkEditMode && hasUnsavedChanges && (
        <div className='border-[#EAEAEA] text-sm border w-[40%] h-12 rounded-lg flex justify-between items-center px-4 '>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <WarningCircleIcon size={16} color='#545659' />
              <span className='text-[#545659] text-sm'>Unsaved changes</span>
            </div>
          </div>
          <div className='flex gap-2'>
            {/* <Button text='Discard' onClick={onDiscardBulkEdit} white={true} error={false} /> */}
            <button
              onClick={onResetChanges}
              className='px-3 py-1.5 text-[#344054] text-sm font-medium ] rounded-md border cursor-pointer border-[#EAEAEA] '
            >
              Discard
            </button>
            {/* <Button text='Save' onClick={onSaveBulkEdit} white={false} error={false} /> */}
            <button 
              onClick={onSaveBulkEdit}
              className='bg-[#191A1B] text-white px-3 py-1 rounded-md  cursor-pointer'
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className='flex gap-2 relative' ref={dropdownRef}>
        <div 
          className='bg-[#F5F5F5] rounded-lg w-10 h-10 flex justify-center items-center cursor-pointer relative'
          onClick={() => setShowNotification && setShowNotification(!showNotification)}
        >
          <BellIcon size={16} color='#191A1B' />
          {/* Red dot indicator for unread notifications */}
          {unreadCount > 0 && (
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center'>
              {unreadCount > 9 ? (
                <span className='text-white text-[8px] font-bold'>9+</span>
              ) : (
                <span className='text-white text-[8px] font-bold'>{unreadCount}</span>
              )}
            </div>
          )}
        </div>
        <div 
          className='text-white text-sm bg-red-400 rounded-lg w-10 h-10 flex justify-center items-center cursor-pointer'
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {getUserInitials()}
        </div>
        {showDropdown && (
          <div className="absolute  right-0 top-12 flex flex-col bg-white w-max p-2 rounded-lg shadow border border-[#EAEAEA] gap-2.5 z-20">
            <div 
              className="text-sm text-[#191A1B] font-medium flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={handleAccountSettings}
            >
              <GearSixIcon size={16} weight="bold" color="#191A1B" />
              Account and settings
            </div>
            <div 
              className="text-sm text-[#F04438] font-medium flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={handleLogout}
            >
              <SignOutIcon size={16} weight="bold" color="#F04438" />
              Log out
            </div>
          </div>
        )}


      </div>
    </div>
  )
}

export default TopBar
