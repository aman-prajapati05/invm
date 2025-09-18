'use client';

import api from '@/lib/axios';
import { urlBase64ToUint8Array } from '@/lib/utils/push';
import { useState } from 'react';


const PushSubscriptionButton = () => {
  const [loading, setLoading] = useState(false);

  const subscribeToPush = async () => {
    try {
      setLoading(true);

      // 1. Ask for permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied');
        return;
      }

      // 2. Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe the user
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });

      console.log('🔔 Push subscription:', subscription);

      // 4. Send subscription to your backend to save
      await api.post('/api/save-subscription', subscription);

      alert('Subscribed to push notifications!');
    } catch (err) {
      console.error('❌ Subscription failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={subscribeToPush}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {loading ? 'Subscribing...' : 'Subscribe to Push'}
    </button>
  );
};

export default PushSubscriptionButton;
