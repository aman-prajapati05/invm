// self.addEventListener('push', function (event) {
//   console.log('📩 Push event received:', event);

//   const data = event.data?.json() || {};

//   const title = data.title || 'Notification';
//   const options = {
//     body: data.body || 'No body content',
//     icon: 'logo.png',
//     requireInteraction: true, // keeps notification visible until dismissed
//   };

//   console.log('📤 Showing notification:', title, options);

//   event.waitUntil(
//     self.registration.showNotification(title, options)
//   );
// });

// public/sw.js

self.addEventListener('push', (event) => {
  console.log('📩 Push event received:', event);

  // be safe if payload isn't JSON
  const data = (() => {
    try { return event.data?.json() || {}; } catch { return {}; }
  })();

  const title = data.title || 'Notification';
  const options = {
    body: data.body || 'No body content',
    icon: 'logo.png',
    requireInteraction: true,        // stays visible until dismissed
    tag: data.tag || 'default',      // collapses duplicates if same tag
    data: { url: data.url || '/', ...data }, // used on click
  };

  console.log('📤 Showing notification:', title, options);
  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ Focus existing tab or open a new one on click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      try {
        const u = new URL(c.url);
        if (u.origin === self.location.origin) {
          await c.focus();
          // optionally navigate:
          // if (!c.url.endsWith(url)) await c.navigate(url);
          return;
        }
      } catch {}
    }
    return clients.openWindow(url);
  })());
});

// 🔁 OPTIONAL: auto re-subscribe if browser drops the sub
// If you want this, set your PUBLIC VAPID key (base64url) below.
// Otherwise remove this block; your client code already re-subscribes.
const APP_SERVER_KEY_B64 = ''; // e.g. paste NEXT_PUBLIC_VAPID_PUBLIC_KEY here

function b64ToU8(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const str = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(str);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

self.addEventListener('pushsubscriptionchange', (event) => {
  if (!APP_SERVER_KEY_B64) return; // skip if you didn't fill it

  event.waitUntil((async () => {
    try {
      const reg = await self.registration;
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(APP_SERVER_KEY_B64),
      });
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newSub),
      });
      console.log('🔄 Re-subscribed from pushsubscriptionchange');
    } catch (e) {
      console.warn('⚠️ pushsubscriptionchange re-subscribe failed', e);
    }
  })());
});
