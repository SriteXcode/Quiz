import { useState, useEffect, useCallback } from 'react';
import Skeleton from './Skeleton';
import UniversalReviewModal from './UniversalReviewModal';
import { apiGetPublicReviews } from '../services/api';

export const ReviewSkeleton = () => {
  return (
    <div className="w-full rounded-3xl p-6 sm:p-12 mb-12 skeleton-shimmer space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton type="circle" className="w-12 h-12 sm:w-16 sm:h-16" />
        <div className="space-y-2">
          <Skeleton type="heading" className="h-5 w-36 sm:w-48" />
          <Skeleton type="text" className="h-3.5 w-24 sm:w-32" />
        </div>
      </div>
      <Skeleton type="text" className="h-4 w-full" />
      <Skeleton type="text" className="h-4 w-5/6" />
    </div>
  );
};

export const ReviewSection = ({ isLoading: propIsLoading }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(propIsLoading || false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchPublicReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGetPublicReviews();
      if (res && res.success !== false && Array.isArray(res.reviews)) {
        setReviews(res.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.warn('[Review Fetch Notice]: Could not fetch reviews from backend DB', err.message);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicReviews();
  }, [fetchPublicReviews]);

  // Auto-play interval timer (4 seconds delay)
  useEffect(() => {
    if (isLoading || isPaused || reviews.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isLoading, isPaused, reviews.length]);

  const nextCard = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevCard = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (isLoading && reviews.length === 0) return <ReviewSkeleton />;

  const getCardPosition = (index) => {
    const total = reviews.length;
    if (total === 1) return 'front';
    const diff = (index - activeIndex + total) % total;

    if (diff === 0) return 'front';
    if (diff === 1 || (diff === -2 && total === 3)) return 'right';
    return 'left';
  };

  return (
    <section className="mb-6 overflow-hidden py-4">
      {/* Section Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-2xl font-bold font-poppins text-[var(--text-main)]">
              Student & Community Reviews
            </h2>
          </div>
          <p className="text-[11px] sm:text-sm text-[var(--text-muted)] font-lato mt-0.5">
            Real feedback from candidates, developers, and educators.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end xs:self-auto ml-auto">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 flex items-center space-x-1 cursor-pointer"
          >
            <span>+ Write Review</span>
          </button>
          <div className="flex items-center space-x-1 pl-1.5 sm:pl-2 border-l border-[var(--border-theme)]">
            <button
              onClick={prevCard}
              className="p-1.5 sm:p-2 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 text-xs sm:text-base"
              aria-label="Previous Review Card"
            >
              ←
            </button>
            <button
              onClick={nextCard}
              className="p-1.5 sm:p-2 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 text-xs sm:text-base"
              aria-label="Next Review Card"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* 3D Stack Deck Container */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative min-h-[200px] xs:min-h-[215px] sm:min-h-[230px] flex items-center justify-center"
      >
        {reviews.map((review, index) => {
          const position = getCardPosition(index);

          let positionClasses = '';
          if (position === 'front') {
            positionClasses = 'z-30 scale-100 opacity-100 translate-x-0 shadow-xl rotate-0 pointer-events-auto';
          } else if (position === 'left') {
            positionClasses = 'z-10 lg:scale-95 md:scale-85 sm:scale-70 opacity-100 -translate-x-6 sm:-translate-x-32 md:-translate-x-24 -rotate-5 cursor-pointer pointer-events-auto';
          } else if (position === 'right') {
            positionClasses = 'z-10 lg:scale-95 md:scale-85 sm:scale-70 opacity-100 translate-x-6 sm:translate-x-32 md:translate-x-24 rotate-5 cursor-pointer pointer-events-auto';
          }

          const isBackgroundCard = position !== 'front';
          const cardBgClass = review.bgColor || 'bg-[var(--color-secondary-600)] text-white';
          const avatarBgClass = isBackgroundCard
            ? 'bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 text-slate-950 shadow-lg border-2 border-white/80 font-black'
            : (review.avatarBg || 'bg-white text-[var(--color-secondary-700)] dark:bg-slate-900 dark:text-emerald-400 shadow-md border-2 border-white/50 font-bold');
          const authorName = review.userName || review.author || 'Anonymous';

          const userImageSrc = review.avatarUrl || review.avatar || review.userAvatar || review.profileImage || review.picture ||
            (review.userId && typeof review.userId === 'object' ? (review.userId.avatarUrl || review.userId.avatar || review.userId.profileImage || review.userId.picture) : null) || null;
          const rawQuote = review.quote || '';
          const displayQuote = rawQuote.length > 170 ? `${rawQuote.slice(0, 170)}...` : rawQuote;

          return (
            <div
              key={review._id || review.id || index}
              onClick={() => position !== 'front' && setActiveIndex(index)}
              className={`absolute w-[84%] xs:w-[88%] sm:w-full max-w-[300px] sm:max-w-xl md:max-w-2xl h-[175px] xs:h-[185px] sm:h-[200px] rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 ease-in-out transform border border-white/20 overflow-hidden flex flex-col justify-between ${cardBgClass} ${positionClasses}`}
            >
              <div className="flex flex-col space-y-2 sm:space-y-3">
                
                {/* 1. TOP SECTION: NAME CARD (AVATAR + BOLD NAME + CLASS/ROLE/DESIGNATION BELOW IT) */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Profile Avatar Image with Seamless Fallback */}
                  <div className={`w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl shrink-0 overflow-hidden relative shadow-md flex items-center justify-center border-2 border-white/60 ${avatarBgClass} font-poppins text-base sm:text-xl`}>
                    {userImageSrc ? (
                      <img
                        src={userImageSrc}
                        alt={authorName}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl sm:rounded-2xl z-10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <span className="font-extrabold">{authorName.charAt(0).toUpperCase()}</span>
                  </div>

                  {/* Name (Bold) & Designation Below Name */}
                  <div>
                    <h3 className="font-poppins font-extrabold text-sm sm:text-base leading-tight text-white truncate max-w-[180px] sm:max-w-[280px]">
                      {authorName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-lato px-1.5 py-0.5 rounded bg-white/20 font-semibold text-[10px] sm:text-xs text-white/90 truncate max-w-[120px] sm:max-w-[180px]">
                        {review.role || review.designation || review.studentClass || 'Student Candidate'}
                      </p>
                      <div className="flex items-center text-amber-300 space-x-0.5">
                        {Array.from({ length: review.rating || 5 }).map((_, i) => (
                          <span key={i} className="text-xs sm:text-sm">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SECOND ROW: REAL WORDS & REVIEW DESCRIPTION */}
                <p className="font-lato italic text-xs sm:text-sm leading-relaxed text-white/95 line-clamp-3 sm:line-clamp-4 pt-1">
                  "{displayQuote}"
                </p>

              </div>
            </div>
          );
        })}
      </div>

      {/* Card Indicators */}
      {reviews.length > 1 && (
        <div className="flex justify-center items-center space-x-1.5 sm:space-x-2 mt-4 sm:mt-6">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="p-2 cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
              aria-label={`Select Review ${idx + 1}`}
            >
              <span
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 block ${
                  idx === activeIndex
                    ? 'w-6 sm:w-8 bg-[var(--color-secondary-500)]'
                    : 'w-2.5 sm:w-3 bg-[var(--border-theme)] hover:bg-[var(--text-muted)]'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Universal Review Modal */}
      <UniversalReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={(newReview) => {
          if (newReview) {
            setReviews((prev) => [newReview, ...prev.filter((r) => (r._id || r.id) !== (newReview._id || newReview.id))]);
          }
          fetchPublicReviews();
        }}
      />
    </section>
  );
};

export default ReviewSection;
