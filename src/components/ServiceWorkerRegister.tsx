'use client';

import { useEffect } from 'react';
import { ensurePushSubscribed } from '@/lib/pushClient';

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        // console.log('✅ Service Worker registered', reg);

        // wait until the SW is active, then make sure we’re subscribed
        await navigator.serviceWorker.ready;
        ensurePushSubscribed();

        // also watch for permission changes (if user clicks “allow” later)
        if ('permissions' in navigator) {
          (navigator.permissions as any)
            .query({ name: 'notifications' as PermissionName })
            .then((status: PermissionStatus) => {
              status.onchange = () => {
                if (status.state === 'granted') {
                  ensurePushSubscribed();
                }
              };
            })
            .catch(() => {});
        }
      })
      .catch((err) =>
        console.error('❌ Service Worker registration failed:', err)
      );
  }, []);

  return null;
};

export default ServiceWorkerRegister;
