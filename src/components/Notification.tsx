import { 
  CalendarDotsIcon, 
  CheckIcon, 
  PackageIcon, 
  XCircleIcon, 
  XIcon,
  WarningIcon,
  InfoIcon,
  TruckIcon,
  UserIcon,
  ClockIcon,
  SpinnerGapIcon
} from '@phosphor-icons/react/dist/ssr'
import React from 'react'
import Button from './Button'
import { useNotifications } from '@/contexts/NotificationContext'

interface NotificationProps {
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, isLoading } = useNotifications();

  // Function to get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'manual_po':
      case 'email_po':
      case 'po_created':
        return <PackageIcon size={16} color='#545659' />;
      case 'po_approved':
      case 'po_completed':
      case 'po_released':
      case 'task_completed':
      case 'picklist_completed':
      case 'picklist_bulk_completed':
        return <CheckIcon size={16} color='#10B981' />;
      case 'po_on_hold':
        return <ClockIcon size={16} color='#F59E0B' />;
      case 'picklist_rollover':
        return <ClockIcon size={16} color='#F59E0B' />;
      case 'docket_created':
        return <PackageIcon size={16} color='#10B981' />;
      case 'price_mismatch':
      case 'validation_error':
      case 'po_rejected':
        return <XCircleIcon size={16} color='#F04438' />;
      case 'delivery_scheduled':
      case 'shipment_created':
        return <TruckIcon size={16} color='#545659' />;
      case 'user_action':
      case 'admin_action':
        return <UserIcon size={16} color='#545659' />;
      case 'reminder':
      case 'deadline':
        return <CalendarDotsIcon size={16} color='#F59E0B' />;
      case 'warning':
        return <WarningIcon size={16} color='#F59E0B' />;
      case 'info':
      case 'system_update':
        return <InfoIcon size={16} color='#3B82F6' />;
      case 'pending':
      case 'processing':
        return <ClockIcon size={16} color='#F59E0B' />;
      default:
        return <InfoIcon size={16} color='#545659' />;
    }
  };

  // Function to format time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Helper function to safely render notification data
  const renderNotificationData = (data: any) => {
    if (typeof data === 'string') {
      return data;
    } else if (typeof data === 'object' && data !== null) {
      // Handle object data - extract meaningful text
      if (data.poNumber) {
        return `PO ${data.poNumber} has been processed`;
      } else if (data.message) {
        return data.message;
      } else {
        return JSON.stringify(data);
      }
    }
    return String(data);
  };

  return (
    <div className='w-full bg-white h-full relative'>
      <div className='py-4 w-full flex items-center justify-between  '>
        <div className='px-4 flex items-center justify-between w-full'>
          <div className='font-medium text-[#313134]'>
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className='ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full'>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div className='cursor-pointer' onClick={onClose}>
            <XIcon size={16} color='#313134' weight='bold' />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className='flex-1 overflow-y-auto max-h-[calc(100vh-200px)]'>
        {isLoading ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <SpinnerGapIcon size={24} color='#9CA3AF' className='animate-spin' />
            <div className='text-[#6B7280] text-sm mt-2'>Loading notifications...</div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification._id}
              className={`py-3 px-3 flex items-start gap-2 border-t border-[#EAEAEA] cursor-pointer hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification._id)}
            >
              <div className={`flex rounded-full border p-2 ${
                !notification.read ? 'border-blue-200 bg-blue-100' : 'border-[#EAEAEA]'
              }`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className='flex flex-col justify-start gap-[2px] flex-1'>
                <div className={`text-xs ${
                  !notification.read ? 'text-[#191A1B] font-medium' : 'text-[#191A1B]'
                }`}>
                  {renderNotificationData(notification.data)}
                </div>
                <div className='text-[#90919B] text-[10px]'>
                  {getTimeAgo(notification.createdAt)}
                </div>
              </div>
              {!notification.read && (
                <div className='w-2 h-2 bg-blue-500 rounded-full mt-1'></div>
              )}
            </div>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3'>
              <PackageIcon size={24} color='#9CA3AF' />
            </div>
            <div className='text-[#6B7280] text-sm font-medium mb-1'>No notifications</div>
            <div className='text-[#9CA3AF] text-xs'>You're all caught up!</div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className='py-[14px] border-t px-3 bottom-0 w-full absolute border-[#EAEAEA] bg-white'>
        <div className='flex items-center justify-between'>
          <Button text='Close' onClick={onClose} error={false} white={true}/>
          {notifications.filter(n => !n.read).length > 0 && (
            <button 
              className='text-[#191A1B] text-sm font-medium underline cursor-pointer hover:text-blue-600 transition-colors'
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Notification
