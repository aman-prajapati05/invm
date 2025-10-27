"use client"
import { AlarmIcon, BarcodeIcon, HeadCircuitIcon, HouseIcon, ListDashesIcon, PackageIcon, ShippingContainerIcon, StorefrontIcon, TagIcon, TruckIcon, UsersIcon } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string; // Permission key required to see this menu item
}

const SideBar: React.FC = () => {
  const pathname = usePathname()
  const { user } = useAuth()

  const menuItems: MenuItem[] = [
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: <HouseIcon size={16} weight="bold" color='#191A1B' />,
      permission: 'dashboard'
    },
    { 
      href: '/inventory', 
      label: 'Inventory', 
      icon: <PackageIcon size={16} weight="bold" color='#191A1B' />,
      permission: 'inventory'
    },
    { 
      href: '/expiry-alert', 
      label: 'Expiry Alert', 
      icon: <AlarmIcon size={16} weight="bold" color='#191A1B' />,
      permission: 'expiry'
    },
    { 
      href: '/sales', 
      label: 'Sales', 
      icon: <TruckIcon size={16} weight="bold" color='#191A1B'/>,
      permission: 'categories'
    },
    {
      href: '/forecast',
      label: 'Forecast',
      icon: <HeadCircuitIcon size={16} weight="bold" color='#191A1B' />
      // No permission required, always visible
    },
    { 
      href: '/user', 
      label: 'User', 
      icon: <UsersIcon size={16} weight="bold" color='#191A1B' />,
      permission: 'user'
    },
  ]

  // Function to check if user has permission for a menu item
  const hasPermission = (permission?: string) => {
    if (!permission) return true; // No permission required
    if (!user?.permissions) return false; // No permissions set
    
    // Check if user has the specific permission
    return Boolean(user.permissions[permission as keyof typeof user.permissions]);
  };


  const { isSidebarOpen, setSidebarOpen } = useSidebar();
  // Filter menu items based on user permissions, but always show items with no permission key
  const filteredMenuItems = menuItems.filter(item => {
    // If permission is undefined, always show
    if (typeof item.permission === 'undefined') return true;
    return hasPermission(item.permission);
  });

  if (!isSidebarOpen) return null;

  return (
    <div className='xl:w-[16%] lg:w-[18%] h-full bg-white border-r border-[#EAEAEA] flex flex-col justify-between relative'>
      <div className='flex flex-col gap-1 px-4 py-4'>
        {filteredMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-[#191A1B] text-sm font-medium px-2 flex gap-1 items-center cursor-pointer rounded-sm py-2 ${
              pathname === item.href ? 'bg-[#F5F5F5]' : 'hover:bg-[#F5F5F5]'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SideBar