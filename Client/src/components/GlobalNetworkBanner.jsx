import { Wifi, WifiOff } from 'lucide-react';

export const GlobalNetworkBanner = ({ isOnline, showReconnectedBanner, onDismissReconnected }) => {
  if (isOnline && !showReconnectedBanner) return null;

  return (
    <div className="sticky top-0 z-[60] w-full transition-all duration-300 animate-slideDown shadow-md">
      {!isOnline ? (
        /* STICKY GLOBAL OFFLINE BANNER */
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-lato border-b border-amber-400/30">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 px-1 sm:px-4">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-6.5 h-6.5 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                <WifiOff className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <span className="font-poppins font-bold text-white mr-1.5">You are currently offline.</span>
                <span className="text-amber-100 hidden sm:inline">Browsing preloaded data & cached content. Live sync will resume once reconnected.</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-white/20 text-white shrink-0 border border-white/30">
              ⚡ OFFLINE MODE
            </span>
          </div>
        </div>
      ) : (
        /* STICKY GLOBAL RECONNECTED ONLINE BANNER (Auto-dismisses in 3 seconds) */
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white px-4 py-2.5 text-xs sm:text-sm font-lato border-b border-emerald-400/30">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 px-1 sm:px-4">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-6.5 h-6.5 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <span className="font-poppins font-bold text-white mr-1.5">We are online!</span>
                <span className="text-emerald-100 hidden sm:inline">Internet connection restored. Live features & real-time rankings active.</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-white/20 text-white border border-white/30">
                ✓ ONLINE
              </span>
              <button
                onClick={onDismissReconnected}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white cursor-pointer"
                aria-label="Close online banner"
                title="Close notification"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalNetworkBanner;
