import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const GoogleAuthButton = ({ onSuccess, buttonText = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const googleBtnRef = useRef(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Load Google Identity Services SDK Script
  useEffect(() => {
    if (!googleClientId) return;

    if (window.google?.accounts?.id) {
      setIsSdkLoaded(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setIsSdkLoaded(true);
        clearInterval(checkInterval);
      }
    }, 50);

    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsSdkLoaded(true);
        clearInterval(checkInterval);
      };
      script.onerror = () => {
        console.warn('[GIS Warning]: Failed to load Google SDK script');
        clearInterval(checkInterval);
      };
      document.head.appendChild(script);
    }

    return () => clearInterval(checkInterval);
  }, [googleClientId]);

  // Handle Google Credential Response
  const handleCredentialResponse = useCallback(async (response) => {
    if (!response || !response.credential) {
      addToast('Failed to retrieve Google credentials', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle(response.credential, googleClientId);
      if (res && res.success && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('[Google Login Error]:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [addToast, loginWithGoogle, googleClientId, onSuccess]);

  // Render Google GIS Official Button
  useEffect(() => {
    if (isSdkLoaded && window.google?.accounts?.id && googleBtnRef.current && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false
        });

        // Render official GIS button inside container
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left'
        });
      } catch (err) {
        console.warn('[GIS Render Error]:', err);
      }
    }
  }, [isSdkLoaded, googleClientId, handleCredentialResponse]);

  // Trigger Google OneTap or Popup prompt manually if custom button clicked
  const handleManualClick = () => {
    if (!googleClientId) {
      addToast('Google Sign-In is not configured yet (VITE_GOOGLE_CLIENT_ID missing)', 'info');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse
      });
      window.google.accounts.id.prompt();
    } else {
      addToast('Google SDK is loading, please try again in a moment', 'info');
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Official GIS Render Container */}
      {googleClientId && isSdkLoaded ? (
        <div ref={googleBtnRef} className="w-full flex justify-center min-h-[34px]" />
      ) : (
        /* Branded Fallback Button */
        <button
          type="button"
          onClick={handleManualClick}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-full border border-[var(--border-theme)] bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-main)] font-poppins font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2.5 active:scale-[0.99] disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isSubmitting ? 'Connecting...' : buttonText}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleAuthButton;
