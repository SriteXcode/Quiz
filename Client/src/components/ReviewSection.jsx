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

const defaultInitialReviews = [
  {
    _id: 'default-1',
    quote: "This quiz platform transformed how our engineering team prepares for certifications. Instant feedback and real-time leaderboards are unmatched!",
    userName: "Rahul Srivastav",
    role: "Web Developer",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    bgColor: "bg-emerald-500 dark:bg-emerald-700 text-white",
    avatarBg: "bg-white text-emerald-700"
  },
  {
    _id: 'default-2',
    quote: "Creating live quizzes and seeing real-time student engagement has made learning interactive, fast, and exciting for our computer science class.",
    userName: "Harsh Pandey",
    role: "BCA Student",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    bgColor: "bg-[var(--color-secondary-600)] text-white",
    avatarBg: "bg-white text-[var(--color-secondary-700)]"
  },
  {
    _id: 'default-3',
    quote: "The UI is super clean, responsive on phone and tablet, and dark mode is sleek. Competing with peers daily keeps my skills sharp!",
    userName: "Aman Yadav",
    role: "B.Tech CS",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
    bgColor: "bg-teal-600 dark:bg-teal-800 text-white",
    avatarBg: "bg-white text-teal-800"
  }
];

export const ReviewSection = ({ isLoading: propIsLoading }) => {
  const [reviews, setReviews] = useState(defaultInitialReviews);
  const [isLoading, setIsLoading] = useState(propIsLoading || false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchPublicReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGetPublicReviews();
      if (res && res.success !== false && Array.isArray(res.reviews) && res.reviews.length > 0) {
        setReviews(res.reviews);
      }
    } catch {
      // Fallback stays as defaultInitialReviews
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[var(--text-main)]">
              Student & Community Reviews
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-lato mt-0.5">
            Real feedback from candidates, developers, and educators.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <span>+ Write Review</span>
          </button>
          <div className="flex items-center space-x-1 pl-2 border-l border-[var(--border-theme)]">
            <button
              onClick={prevCard}
              className="p-2 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 text-xs sm:text-base"
              aria-label="Previous Review Card"
            >
              ←
            </button>
            <button
              onClick={nextCard}
              className="p-2 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 text-xs sm:text-base"
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
        className="relative min-h-[220px] xs:min-h-[240px] sm:min-h-[280px] flex items-center justify-center"
      >
        {reviews.map((review, index) => {
          const position = getCardPosition(index);

          let positionClasses = '';
          if (position === 'front') {
            positionClasses = 'z-30 scale-100 opacity-100 translate-x-0 shadow-xl rotate-0 pointer-events-auto';
          } else if (position === 'left') {
            positionClasses = 'z-10 lg:scale-95 md:scale-85 sm:scale-70 opacity-50 sm:opacity-60 -translate-x-6 sm:-translate-x-32 md:-translate-x-24 -rotate-5 hover:opacity-80 cursor-pointer pointer-events-auto';
          } else if (position === 'right') {
            positionClasses = 'z-10 lg:scale-95 md:scale-85 sm:scale-70 opacity-50 sm:opacity-60 translate-x-6 sm:translate-x-32 md:translate-x-24 rotate-5 hover:opacity-80 cursor-pointer pointer-events-auto';
          }

          const isBackgroundCard = position !== 'front';
          const cardBgClass = review.bgColor || 'bg-[var(--color-secondary-600)] text-white';
          const avatarBgClass = isBackgroundCard
            ? 'bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 text-slate-950 shadow-lg border-2 border-white/80 font-black'
            : (review.avatarBg || 'bg-white text-[var(--color-secondary-700)] dark:bg-slate-900 dark:text-emerald-400 shadow-md border-2 border-white/50 font-bold');
          const authorName = review.userName || review.author || 'Anonymous';

          return (
            <div
              key={review._id || review.id || index}
              onClick={() => position !== 'front' && setActiveIndex(index)}
              className={`absolute w-[82%] xs:w-[85%] sm:w-full max-w-[280px] sm:max-w-xl md:max-w-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 transition-all duration-300 ease-in-out transform border border-white/20 ${cardBgClass} ${positionClasses}`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6">
                
                {/* Avatar */}
                <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${avatarBgClass} flex items-center justify-center font-poppins text-lg sm:text-2xl shrink-0 overflow-hidden relative`}>
                  {review.avatarUrl || review.avatar || review.userAvatar || review.profileImage || review.picture ? (
                    <img
                      src={review.avatarUrl || review.avatar || review.userAvatar || review.profileImage || review.picture}
                      alt={authorName}
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span>{authorName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-center sm:text-left">
                  {/* Rating Stars & Quiz Tag */}
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1.5 sm:mb-3">
                    <div className="flex items-center text-amber-300 space-x-0.5">
                      {Array.from({ length: review.rating || 5 }).map((_, i) => (
                        <span key={i} className="text-xs sm:text-lg">★</span>
                      ))}
                    </div>
                    {review.quizTitle && (
                      <span className="text-[10px] sm:text-xs bg-black/20 text-white/90 px-2 py-0.5 rounded-full font-medium truncate max-w-[140px] sm:max-w-[200px]">
                        🎯 {review.quizTitle}
                      </span>
                    )}
                  </div>

                  <p className="font-lato italic text-xs sm:text-base leading-snug sm:leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                    "{review.quote}"
                  </p>

                  <div>
                    <h3 className="font-poppins font-bold text-xs sm:text-lg">
                      {authorName}
                    </h3>
                    <p className="font-lato text-[10px] sm:text-xs opacity-90">
                      {review.role || 'Student Candidate'}
                    </p>
                  </div>
                </div>

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
        onSuccess={() => fetchPublicReviews()}
      />
    </section>
  );
};

export default ReviewSection;
