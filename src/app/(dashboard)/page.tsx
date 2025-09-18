'use client';

import Dashboard from '@/components/Dashboard'
import React, { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { urlBase64ToUint8Array } from '@/lib/utils/push'
import { useToast } from '@/hooks/useToast'

const page = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Check current permission state
    setPermissionState(Notification.permission);

    // Check if user is already subscribed
    checkSubscriptionStatus();

    // Auto-request permission if not already decided
    if (Notification.permission === 'default') {
      autoRequestNotificationPermission();
    }
    // Don't show warning toast on page load for denied permissions
    // Only show toasts when user actively interacts with permission requests
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.getSubscription();
        const subscribed = !!subscription;
        setIsSubscribed(subscribed);
        
        // Don't show toast on page load - only when user takes action
        // This just silently checks the status
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const autoRequestNotificationPermission = async () => {
    try {
      // Wait a bit before showing the permission dialog to not overwhelm user
      setTimeout(async () => {
        const permission = await Notification.requestPermission();
        setPermissionState(permission);
        
        if (permission === 'granted') {
          // Automatically subscribe user to push notifications
          await autoSubscribeToPush();
        } else if (permission === 'denied') {
          toast.warning('Notifications blocked. You can enable them later in browser settings.', 4000);
        }
      }, 2000); // 2 second delay
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission.', 3000);
    }
  };

  const autoSubscribeToPush = async () => {
    try {
      // Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // Check if already subscribed
      const existingSubscription = await reg.pushManager.getSubscription();
      if (existingSubscription) {
        try {
          // Test if the existing subscription is still valid by saving it
          await api.post('/api/save-subscription', existingSubscription);
          setIsSubscribed(true);
          return;
        } catch (error) {
          console.warn('⚠️ Existing subscription may be invalid, creating new one:', error);
          // If saving fails, unsubscribe and create a new one
          try {
            await existingSubscription.unsubscribe();
          } catch (unsubError) {
            console.warn('Failed to unsubscribe from invalid subscription:', unsubError);
          }
        }
      }

      // Subscribe the user
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });

      console.log('🔔 Auto push subscription:', subscription);

      // Send subscription to backend
      await api.post('/api/save-subscription', subscription);
      setIsSubscribed(true);

      // Show success toast
      toast.success('🔔 Notifications enabled! You\'ll receive important updates automatically.', 4000);
    } catch (error) {
      console.error('❌ Auto subscription failed:', error);
      toast.error('Failed to enable notifications. Please try again later.', 3000);
    }
  };

  return (
    <div>
      <Dashboard/>
    </div>
  )
}

export default page
