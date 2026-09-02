import { useState, useEffect, useRef } from 'react';
import { apiGetAdByPlacement, apiRecordAdImpression, apiRecordAdClick } from '../services/api';

/**
 * Native Sponsored Card for Shorts Gyaan Vertical Feed
 * Formatted like a native Shorts card with sponsored badge and high-converting CTA.
 */
export const NativeShortsAdCard = ({ ad: propAd = null, timerSeconds = null, onSkip = null }) => {
  const [ad, setAd] = useState(propAd);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (propAd) return;
    let isMounted = true;

    const fetchAd = async () => {
      try {
        const res = await apiGetAdByPlacement('shorts_gyaan_feed');
        if (isMounted) {
          if (res && res.isAdFree) {
            setAd(null);
          } else if (res && res.success && res.ad) {
            setAd(res.ad);
          }
        }
      } catch (err) {
        console.warn('[NativeShortsAdCard]: Ad fetch error', err.message);
      }
    };

    fetchAd();
    return () => { isMounted = false; };
  }, [propAd]);

  useEffect(() => {
    if (!ad || hasRecordedImpression || !cardRef.current) return;

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

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [ad, hasRecordedImpression]);

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
      ref={cardRef}
      className="w-full max-w-lg mx-auto bg-[var(--bg-card)] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-6 my-4 animate-fadeIn"
    >
      {/* Top Sponsored Tag with Cross Dismiss Button & 10s Timer */}
      <div className="flex justify-between items-center border-b border-[var(--border-theme)] pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-extrabold font-poppins text-amber-500 uppercase tracking-widest">
            SPONSORED ANNOUNCEMENT
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {timerSeconds !== null && (
            <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center space-x-1">
              <span>⏱️ Next in {timerSeconds}s</span>
            </span>
          )}
          <span className="text-xs text-[var(--text-muted)] font-mono">{ad.sponsorName || 'Partner'}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
              if (onSkip) onSkip();
            }}
            className="w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white/80 hover:text-white flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer shadow-sm"
            title="Hide sponsored advertisement"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Ad Image / Graphic Banner */}
      {ad.imageUrl && (
        <div className="w-24 h-24 sm:w-28 sm:h-28 aspect-square mx-auto rounded-2xl overflow-hidden border border-[var(--border-theme)] bg-slate-900/50 p-2 flex items-center justify-center shadow-inner">
          <img
            src={ad.imageUrl}
            alt={ad.title || 'Sponsored Logo'}
            className="w-full h-full object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Headline & Details */}
      <div className="space-y-3 text-center sm:text-left">
        <h3 className="text-lg sm:text-xl font-extrabold font-poppins text-[var(--text-main)]">
          {ad.headlineText || ad.title}
        </h3>
        <p className="text-sm font-lato text-[var(--text-secondary)] leading-relaxed">
          {ad.descriptionText || 'Explore exclusive opportunities and partner offers with brainArena.'}
        </p>
      </div>

      {/* Bottom CTA Action Button */}
      <div className="pt-2">
        <button
          onClick={handleAdClick}
          className="w-full py-3.5 px-6 rounded-2xl font-poppins font-extrabold text-sm text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-xl hover:shadow-2xl transition-all cursor-pointer transform active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>{ad.buttonText || (ad.targetUrl ? 'Learn More / Visit Sponsor →' : 'Explore Offer →')}</span>
        </button>
      </div>
    </div>
  );
};

export default NativeShortsAdCard;
