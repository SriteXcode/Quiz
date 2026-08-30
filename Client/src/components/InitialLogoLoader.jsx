import { useState, useEffect } from 'react';

// Compressed, high-performance splash screen logo asset (< 5KB WebP)
const COMPRESSED_SPLASH_LOGO =
  'https://res.cloudinary.com/dtjkpcuy9/image/upload/q_auto,f_webp,w_160/v1788088347/quiz_platform_assets/brainarena_logo_transparent.png';

export const InitialLogoLoader = ({
  onComplete,
  gifSrc = null,
  duration = 1000 // Fast 1-second load timing
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Fast, responsive splash screen exit
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      if (onComplete) {
        setTimeout(onComplete, 250);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div
      aria-label="Initial Splash Screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] transition-opacity duration-300 transform-gpu ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center space-y-5 max-w-xs text-center px-4">
        
        {/* Compressed Logo Badge with Glowing Gradient Halo */}
        {gifSrc ? (
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center overflow-hidden shadow-xl bg-white/5 border border-[var(--border-theme)] relative p-2 backdrop-blur-xs">
            <img
              src={gifSrc}
              alt="Loading Animation"
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
            {/* Ambient Animated Halo Ring */}
            {/* <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 animate-spin blur-xs opacity-70" /> */}
            <div className="absolute inset-1 rounded-2xl bg-[var(--bg-main)]" />

            {/* Central Brand Logo Container */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center shadow-lg p-2">
              <img
                src={COMPRESSED_SPLASH_LOGO}
                alt="brainArena Logo"
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain animate-pulse"
              />
            </div>
          </div>
        )}

        {/* Compressed Brand Title & Subtitle */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 tracking-tight">
            brainArena
          </h1>
          <p className="text-[11px] sm:text-xs font-lato text-[var(--text-muted)] flex items-center justify-center space-x-1">
            <span>Loading App</span>
            <span className="inline-flex space-x-0.5">
              <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </p>
        </div>

        {/* Lightweight Compressed Progress Line */}
        <div className="w-36 sm:w-44 h-1 bg-[var(--border-theme)] rounded-full overflow-hidden relative shadow-inner">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 rounded-full w-full animate-pulse"
            style={{ transition: 'width 0.3s ease-out' }}
          />
        </div>

      </div>
    </div>
  );
};

export default InitialLogoLoader;
