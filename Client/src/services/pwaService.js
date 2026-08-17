export const VAPID_PUBLIC_KEY = 'BAiZJjKX6wSg0OeyHcvT2TswjFab_k4qvlz2f3JZItV9VlyZ2GbzTMh7jhuEvV3MAoTim7SMcYPxF6E8IidZRGA';

// Converts base64 VAPID key to Uint8Array for PushManager subscription
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Registers the Service Worker on window load
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    return registration;
  } catch (error) {
    console.warn('PWA Service Worker registration non-fatal notice:', error);
    return null;
  }
}

// Checks if app is running as an installed standalone PWA
export function isPwaInstalled() {
  if (typeof window === 'undefined') return false;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  const isSavedInstalled = localStorage.getItem('pwa_installed') === 'true';

  return isStandalone || isIOSStandalone || isSavedInstalled;
}

// Requests Notification permission and optionally subscribes to push notifications
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && 'serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }
      } catch {
        // Push subscription is optional if browser or local push config is unavailable
      }
    }
    return permission;
  } catch (err) {
    console.warn('Notification permission request notice:', err);
    return 'default';
  }
}
