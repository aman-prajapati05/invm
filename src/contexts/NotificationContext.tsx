"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

interface NotificationData {
  _id: string;
  type: string;
  data: string;
  createdAt: Date;
  expiresAt: Date;
  read?: boolean;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: NotificationData) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, accessToken } = useAuth();

  // Load read notifications from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedReadNotifications = localStorage.getItem('readNotifications');
      if (savedReadNotifications) {
        try {
          const readIds = JSON.parse(savedReadNotifications);
          setReadNotifications(new Set(readIds));
        } catch (error) {
          console.error('Error parsing read notifications from localStorage:', error);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Save read notifications to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      const readArray = Array.from(readNotifications);
      localStorage.setItem('readNotifications', JSON.stringify(readArray));
    }
  }, [readNotifications, isInitialized]);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use accessToken from auth context or fallback to localStorage
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/api/notifications');
      // console.log('Fetched notifications:', response.data);

      if (response.data) {
        const data = response.data;
        // Get current read notifications from localStorage at fetch time
        const savedReadNotifications = typeof window !== 'undefined' ? localStorage.getItem('readNotifications') : null;
        let currentReadIds = new Set<string>();
        
        if (savedReadNotifications) {
          try {
            const readIds = JSON.parse(savedReadNotifications);
            currentReadIds = new Set(readIds);
          } catch (error) {
            console.error('Error parsing read notifications from localStorage:', error);
          }
        }
        
        // Transform the data to match our interface and add read status from localStorage
        const transformedNotifications = data.notifications.map((notif: any) => ({
          ...notif,
          createdAt: new Date(notif.createdAt),
          expiresAt: new Date(notif.expiresAt),
          read: currentReadIds.has(notif._id), // Set read status from localStorage
        }));
        
        setNotifications(transformedNotifications);
      } else {
        console.error('Failed to fetch notifications: No data in response');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const addNotification = useCallback((notification: NotificationData) => {
    // Get current read notifications from localStorage
    const savedReadNotifications = typeof window !== 'undefined' ? localStorage.getItem('readNotifications') : null;
    let currentReadIds = new Set<string>();
    
    if (savedReadNotifications) {
      try {
        const readIds = JSON.parse(savedReadNotifications);
        currentReadIds = new Set(readIds);
      } catch (error) {
        console.error('Error parsing read notifications from localStorage:', error);
      }
    }
    
    setNotifications(prev => [{ ...notification, read: currentReadIds.has(notification._id) }, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    
    // Update read status in localStorage
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });

    // Update UI immediately
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    // Get all notification IDs and mark them as read in localStorage
    const allIds = notifications.map(notif => notif._id);
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      allIds.forEach(id => newSet.add(id));
      return newSet;
    });

    // Update UI immediately
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, [notifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    // Also clear read notifications from localStorage
    setReadNotifications(new Set());
  }, []);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Fetch notifications when user/token becomes available
  useEffect(() => {
    if (user && accessToken) {
      fetchNotifications();
    }
  }, [user, accessToken, fetchNotifications]);

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
