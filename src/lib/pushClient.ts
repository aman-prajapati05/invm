// lib/pushClient.ts
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function b64ToU8(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const str = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(str);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function ensurePushSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (Notification.permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  const exp = sub?.expirationTime ?? null;
  const needsRenew =
    !sub || (typeof exp === 'number' && exp - Date.now() < 7 * 24 * 3600 * 1000);

  if (!needsRenew) return;

  sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: b64ToU8(PUBLIC_KEY),
  });

  // 👇 send the PushSubscription object to your API
  await fetch('/api/save-subscription', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sub),
  });
}
