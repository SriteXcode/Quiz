import { useState, useEffect, useRef } from 'react';
import { apiGetAdByPlacement, apiRecordAdImpression, apiRecordAdClick } from '../services/api';

/**
 * Reusable Responsive Ad Banner Component
 * Handles Custom Banners + Google AdSense scripts with IntersectionObserver view tracking.
 */
export const AdBanner = ({ placement = 'homepage_hero_bottom', className = '' }) => {
  const [ad, setAd] = useState(null);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const bannerRef = useRef(null);

  // Fetch ad by placement slot
  useEffect(() => {
    let isMounted = true;
    const fetchAd = async () => {
      try {
        const res = await apiGetAdByPlacement(placement);
        if (isMounted) {
          if (res && res.isAdFree) {
            setAd(null);
          } else if (res && res.success && res.ad) {
            setAd(res.ad);
          }
        }
      } catch (err) {
        console.warn(`[AdBanner]: Failed to load ad for ${placement}`, err.message);
      }
    };

    fetchAd();
    return () => { isMounted = false; };
  }, [placement]);

  // Viewport IntersectionObserver to record view impressions when 50%+ visible
  useEffect(() => {
    if (!ad || hasRecordedImpression || !bannerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          apiRecordAdImpression(ad._id).catch(() => {});
          setHasRecordedImpression(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(bannerRef.current);
    return () => observer.disconnect();
  }, [ad, hasRecordedImpression]);

  // Google AdSense Script Injection Handling
  useEffect(() => {
    if (ad && ad.adType === 'google_adsense' && ad.adSenseClient && ad.adSenseSlot) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('[AdSense Error]:', e);
      }
    }
  }, [ad]);

  if (!ad || isDismissed) return null;

  const handleAdClick = () => {
    if (ad._id) {
      apiRecordAdClick(ad._id).catch(() => {});
    }
    if (ad.targetUrl && ad.targetUrl !== '#') {
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      ref={bannerRef}
      className={`w-full relative overflow-hidden rounded-2xl border border-[var(--border-theme)] bg-[var(--bg-card)] shadow-xs transition-all duration-300 ${className}`}
    >
      {/* Top Header Tags Bar: Sponsored Tag + Cross Dismiss Button */}
      <div className="absolute top-2 right-2 z-20 flex items-center space-x-1.5">
        <div className="bg-black/70 backdrop-blur-xs text-[9.5px] font-bold tracking-wider text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase flex items-center space-x-1">
          <span>⚡ SPONSORED</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white/80 hover:text-white flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer shadow-sm"
          title="Hide sponsored advertisement"
        >
          ✕
        </button>
      </div>

      {ad.adType === 'google_adsense' ? (
        <div className="w-full flex justify-center items-center py-2 overflow-hidden min-h-[90px]">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client={ad.adSenseClient}
            data-ad-slot={ad.adSenseSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        <div
          onClick={handleAdClick}
          className="group cursor-pointer p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          {ad.imageUrl && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-2xl overflow-hidden shrink-0 border border-[var(--border-theme)] bg-slate-900/50 p-1.5 flex items-center justify-center">
              <img
                src={ad.imageUrl}
                alt={ad.title || 'Sponsor Logo'}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
              {ad.sponsorName || 'Featured Sponsor'}
            </div>
            <h4 className="text-sm sm:text-base font-extrabold font-poppins text-[var(--text-main)] group-hover:text-blue-600 transition-colors line-clamp-1">
              {ad.headlineText || ad.title}
            </h4>
            <p className="text-xs text-[var(--text-muted)] line-clamp-2">
              {ad.descriptionText || 'Click to explore exclusive partner deals and opportunities.'}
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2 text-xs font-bold font-poppins rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 active:scale-95 cursor-pointer">
              {ad.buttonText || 'Explore Now →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdBanner;
