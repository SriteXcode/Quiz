import { useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export const NetworkErrorPage = ({ onNavigate, onRetry }) => {
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  }, [onRetry]);

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.href = '/';
    }
  };

  // Automatically trigger handleRetry as soon as the user comes back online
  useEffect(() => {
    const handleOnline = () => {
      handleRetry();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('app:online-reconnected', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('app:online-reconnected', handleOnline);
    };
  }, [handleRetry]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 animate-fadeIn">
      {/* CENTERED NETWORK ERROR CARD */}
      <div className="max-w-2xl w-full bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-[36px] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden space-y-8">
        
        {/* Background Ambient Amber Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Animated WifiOff Graphic */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500/15 dark:bg-amber-950/50 border-2 border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shadow-xl shadow-amber-500/10">
            <WifiOff className="w-12 h-12 sm:w-14 sm:h-14 animate-pulse" />
          </div>
          <span className="absolute -top-2 -right-2 text-3xl animate-bounce">
            ⚡
          </span>
        </div>

        {/* Text Heading & Subtitle */}
        <div className="space-y-3 relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 font-poppins font-bold text-xs uppercase tracking-wider border border-amber-500/30">
            No Internet Connection
          </span>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold font-poppins text-[var(--text-main)]">
            Page Couldn't Load Offline
          </h1>

          <p className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            You are currently offline and this page has no preloaded offline data available. Check your internet connection and try again, or browse available cached content.
          </p>
        </div>

        {/* CTA ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
          {/* Primary Retry Button */}
          <button
            onClick={handleRetry}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-poppins font-bold text-sm shadow-lg shadow-amber-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Reconnecting</span>
          </button>

          {/* Secondary Home & Quizzes Buttons */}
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] font-poppins font-bold text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Go to Preloaded Home</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('quiz')}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] font-poppins font-bold text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>⚡ Browse Offline Quizzes</span>
          </button>
        </div>

        {/* HELPFUL OFFLINE STATUS TIPS */}
        <div className="pt-6 border-t border-[var(--border-theme)] relative z-10">
          <span className="text-xs font-lato text-[var(--text-muted)] block mb-2">
            💡 Tip: Preloaded quizzes and cached leaderboards remain accessible while offline.
          </span>
        </div>

      </div>
    </div>
  );
};

export default NetworkErrorPage;
