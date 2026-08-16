import { useState, useEffect } from 'react';
import Skeleton from './Skeleton';

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

export const ReviewSection = ({ isLoading }) => {
  const reviews = [
    {
      id: 1,
      quote: "This quiz platform transformed how our engineering team prepares for certifications. Instant feedback and real-time leaderboards are unmatched!",
      author: "Elena Rostova",
      role: "Lead Architect at CloudTech",
      rating: 5,
      bgColor: "bg-emerald-500 dark:bg-emerald-700 text-white",
      avatarBg: "bg-white text-emerald-700"
    },
    {
      id: 2,
      quote: "Creating live quizzes and seeing real-time student engagement has made learning interactive, fast, and exciting for our computer science class.",
      author: "Marcus Thorne",
      role: "Computer Science Professor",
      rating: 5,
      bgColor: "bg-[var(--color-secondary-600)] text-white",
      avatarBg: "bg-white text-[var(--color-secondary-700)]"
    },
    {
      id: 3,
      quote: "The UI is super clean, responsive on phone and tablet, and dark mode is sleek. Competing with peers daily keeps my skills sharp!",
      author: "Aria Takahashi",
      role: "Frontend Developer",
      rating: 5,
      bgColor: "bg-teal-600 dark:bg-teal-800 text-white",
      avatarBg: "bg-white text-teal-800"
    }
  ];

  // active index points to the FRONT card
  const [activeIndex, setActiveIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play interval timer (4 seconds delay)
  useEffect(() => {
    if (isLoading || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isLoading, isPaused, reviews.length]);

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (isLoading) return <ReviewSkeleton />;

  /**
   * Calculate position for each card index relative to activeIndex:
   * 'front' (active), 'left' (behind left), 'right' (behind right)
   */
  const getCardPosition = (index) => {
    const total = reviews.length;
    const diff = (index - activeIndex + total) % total;

    if (diff === 0) return 'front';
    if (diff === 1 || (diff === -2 && total === 3)) return 'right';
    return 'left';
  };

  return (
    <section className="mb-2 overflow-hidden py-2">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[var(--text-main)]">
            Review
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={prevCard}
            className="p-2 sm:p-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 text-xs sm:text-base"
            aria-label="Previous Review Card"
          >
            ←
          </button>
          <button
            onClick={nextCard}
            className="p-2 sm:p-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 text-xs sm:text-base"
            aria-label="Next Review Card"
          >
            →
          </button>
        </div>
      </div>

      {/* 3D Stack Deck Container tailored for mobile phone display */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative min-h-[220px] xs:min-h-[240px] sm:min-h-[280px] flex items-center justify-center"
      >
        {reviews.map((review, index) => {
          const position = getCardPosition(index);

          // Position style mappings optimized for phone & desktop screens
          let positionClasses = '';
          if (position === 'front') {
            positionClasses = 'z-30 scale-100 opacity-100 translate-x-0 shadow-xl rotate-0 pointer-events-auto';
          } else if (position === 'left') {
            positionClasses = 'z-10 lg:scale-95 md:scale-85 sm:scale-70 opacity-50 sm:opacity-60 -translate-x-6 sm:-translate-x-32 md:-translate-x-24 -rotate-5 hover:opacity-80 cursor-pointer pointer-events-auto';
          } else if (position === 'right') {
            positionClasses = 'z-10 lg:scale-95 md:scale-85 sm:scale-70 opacity-50 sm:opacity-60 translate-x-6 sm:translate-x-32 md:translate-x-24 rotate-5 hover:opacity-80 cursor-pointer pointer-events-auto';
          }

          return (
            <div
              key={review.id}
              onClick={() => position !== 'front' && setActiveIndex(index)}
              className={`absolute w-[78%] xs:w-[82%] sm:w-full max-w-[270px] sm:max-w-xl md:max-w-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 transition-all duration-300 ease-in-out transform border border-white/20 ${review.bgColor} ${positionClasses}`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6">
                
                {/* Avatar */}
                <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${review.avatarBg} flex items-center justify-center font-poppins font-bold text-lg sm:text-2xl shadow-md shrink-0`}>
                  {review.author.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 text-center sm:text-left">
                  {/* Rating Stars */}
                  <div className="flex items-center justify-center sm:justify-start space-x-1 mb-1.5 sm:mb-3 text-amber-300">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i} className="text-xs sm:text-lg">★</span>
                    ))}
                  </div>

                  <p className="font-lato italic text-xs sm:text-base leading-snug sm:leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                    "{review.quote}"
                  </p>

                  <div>
                    <h4 className="font-poppins font-bold text-xs sm:text-lg">
                      {review.author}
                    </h4>
                    <p className="font-lato text-[10px] sm:text-xs opacity-90">
                      {review.role}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Card Indicators */}
      <div className="flex justify-center items-center space-x-2 sm:space-x-3 mt-4 sm:mt-6">
        {reviews.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === activeIndex
                ? 'w-6 sm:w-8 bg-[var(--color-secondary-500)]'
                : 'w-2 sm:w-2.5 bg-[var(--border-theme)] hover:bg-[var(--text-muted)]'
            }`}
            aria-label={`Select Review ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default ReviewSection;
