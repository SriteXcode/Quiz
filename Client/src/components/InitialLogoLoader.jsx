import { useState, useEffect } from 'react';

export const InitialLogoLoader = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Graceful fade out timing
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      if (onComplete) {
        setTimeout(onComplete, 400);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      aria-label="Initial Page Loading"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center space-y-6">
        
        {/* Animated Spinning Gradient Halo Ring */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 animate-spin blur-xs opacity-75" />
          <div className="absolute inset-1 rounded-2xl bg-[var(--bg-main)]" />

          {/* Central Animated Brand Badge */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-white font-poppins font-black text-3xl sm:text-4xl tracking-wider select-none drop-shadow-md">
              Q
            </span>
          </div>
        </div>

        {/* Brand Name & Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 tracking-tight">
            Quiz Platform
          </h1>
          <p className="text-xs sm:text-sm font-lato text-[var(--text-muted)] flex items-center justify-center space-x-1.5">
            <span>Loading Knowledge Hub</span>
            <span className="inline-flex space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </p>
        </div>

        {/* Bottom Loading Progress Bar */}
        <div className="w-48 h-1.5 bg-[var(--border-theme)] rounded-full overflow-hidden relative mt-4 shadow-inner">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 rounded-full w-full animate-pulse" />
        </div>

      </div>
    </div>
  );
};

export default InitialLogoLoader;
