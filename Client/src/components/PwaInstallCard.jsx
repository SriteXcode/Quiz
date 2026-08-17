import { useState, useEffect } from 'react';
import { isPwaInstalled, requestNotificationPermission, registerServiceWorker } from '../services/pwaService';

export default function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker immediately
    registerServiceWorker();

    // 2. Check standalone & dismissed state
    const alreadyInstalled = isPwaInstalled();
    const alreadyDismissed = localStorage.getItem('pwa_card_dismissed') === 'true';

    setIsInstalled(alreadyInstalled);
    setIsDismissed(alreadyDismissed);

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    if (isAppleDevice && isSafari && !alreadyInstalled) {
      setIsIOS(true);
    }

    // 4. Check initial notification status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // 5. Capture PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 6. Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Dismiss / Remove card handler
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_card_dismissed', 'true');
  };

  // Trigger browser native install flow
  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers that don't emit prompt or already primed
      alert('To install the app, tap your browser menu (⋮ or Share) and select "Install app" or "Add to Home Screen".');
      return;
    }

    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('PWA install error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  // Request Notification permission
  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  };

  // Do not render if installed, dismissed, or unsupported
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="PWA App Installation and Notification Card"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 animate-slideUp"
    >
      <div className="relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border-theme)] shadow-2xl p-4 sm:p-5 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95 text-[var(--text-main)] overflow-hidden transition-all duration-300">
        
        {/* Subtle Brand Gradient Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400" />

        {/* Dismiss / Close Button */}
        <button
          onClick={handleDismiss}
          title="Dismiss Install Prompt"
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer text-sm font-bold"
        >
          ✕
        </button>

        <div className="flex items-start space-x-3.5 pr-6">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-md p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full">
              <path
                d="M32 14 C23.16 14 16 21.16 16 30 C16 38.84 23.16 46 32 46 C35.48 46 38.68 44.88 41.28 43.0 L45.2 47.0 C45.98 47.78 47.24 47.78 48.02 47.0 C48.8 46.22 48.8 44.96 48.02 44.18 L44.3 40.46 C46.6 37.52 48 33.92 48 30 C48 21.16 40.84 14 32 14 Z M32 20 C37.52 20 42 24.48 42 30 C42 32.74 40.9 35.22 39.12 37.04 L35.6 33.52 C35.98 32.44 36.2 31.26 36.2 30 C36.2 27.68 34.32 25.8 32 25.8 C29.68 25.8 27.8 27.68 27.8 30 C27.8 32.32 29.68 34.2 32 34.2 C32.78 34.2 33.52 33.98 34.16 33.6 L37.28 36.72 C35.74 38.74 33.32 40 32 40 C26.48 40 22 35.52 22 30 C22 24.48 26.48 20 32 20 Z"
                fill="#FFFFFF"
              />
              <circle cx="45" cy="18" r="3" fill="#FBBF24" />
            </svg>
          </div>

          {/* Card Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h4 className="font-poppins font-bold text-sm tracking-tight text-[var(--text-main)]">
                Install Quiz Platform
              </h4>
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                PWA
              </span>
            </div>
            <p className="font-lato text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Faster load times, offline tests & live contest notifications.
            </p>
          </div>
        </div>

        {/* iOS Step-by-Step Instructions Modal / Box */}
        {showIOSInstructions && (
          <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-800/40 text-xs font-lato text-[var(--text-secondary)] space-y-1">
            <p className="font-semibold text-blue-700 dark:text-blue-300">To install on iOS:</p>
            <p>1. Tap the <strong className="text-[var(--text-main)]">Share button</strong> (⎋) in Safari.</p>
            <p>2. Scroll down & tap <strong className="text-[var(--text-main)]">&quot;Add to Home Screen&quot;</strong> (➕).</p>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="mt-3.5 pt-3 border-t border-[var(--border-theme)] flex items-center justify-between gap-2">
          {/* Notification Permission Prompt if not granted */}
          {notificationPermission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              type="button"
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-poppins font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all flex items-center space-x-1 cursor-pointer"
              title="Allow notifications for live quiz alerts"
            >
              <span>🔔</span>
              <span>Allow Alerts</span>
            </button>
          )}

          {notificationPermission === 'granted' && (
            <span className="text-[11px] font-poppins text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span>✓</span>
              <span>Alerts On</span>
            </span>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={handleDismiss}
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-poppins font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
            >
              Later
            </button>

            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              type="button"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-poppins font-bold shadow-md hover:shadow-lg cursor-pointer active:scale-95 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>📲</span>
              <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
