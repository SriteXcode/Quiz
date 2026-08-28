import Skeleton from './Skeleton';

export const HeroSkeleton = () => {
  return (
    <div className="w-full rounded-3xl p-8 sm:p-12 mb-10 skeleton-shimmer min-h-[300px] flex flex-col justify-between">
      <div className="space-y-4 max-w-2xl">
        <Skeleton type="heading" className="h-10 sm:h-12 w-4/5" />
        <Skeleton type="text" className="h-5 w-full" />
        <Skeleton type="text" className="h-5 w-3/4" />
      </div>
      <div className="flex gap-4 mt-8">
        <Skeleton className="h-12 w-36 rounded-xl" />
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>
    </div>
  );
};

export const HeroBanner = ({ isLoading, onExploreLiveQuizzes }) => {
  if (isLoading) return <HeroSkeleton />;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--color-primary-600)] text-white p-8 sm:p-12 mb-10 shadow-xl border-2 border-white/10 ">


      <div className="relative z-10 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-poppins leading-tight mb-2 text-white">
          Master Any Skill Through Interactive Live Quizzes
        </h1>

        <p className="text-base sm:text-lg font-lato text-blue-50 mb-4 max-w-2xl leading-relaxed drop-shadow-xs">
          Test your knowledge, compete in real-time leaderboards, and elevate your learning experience with thousands of community-crafted quizzes.
        </p>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={onExploreLiveQuizzes}
            className="px-6 py-3.5 rounded-xl font-poppins font-bold text-sm bg-white text-[var(--color-primary-700)] hover:bg-blue-50 transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            Explore Live Quizzes
          </button>
        </div>

        {/* Feature stats */}
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center sm:text-left">
          <div>
            <div className="font-poppins font-bold text-2xl">5K+</div>
            <div className="text-xs font-lato text-blue-100 font-medium">Active Learners</div>
          </div>
          <div>
            <div className="font-poppins font-bold text-2xl">100+</div>
            <div className="text-xs font-lato text-blue-100 font-medium">Live Quizzes</div>
          </div>
          <div>
            <div className="font-poppins font-bold text-2xl">96.4%</div>
            <div className="text-xs font-lato text-blue-100 font-medium">Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
