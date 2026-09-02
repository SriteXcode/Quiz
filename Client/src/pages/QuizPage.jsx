import { useState, useEffect, Fragment } from 'react';
import Skeleton from '../components/Skeleton';
import AdBanner from '../components/AdBanner';
import { apiGetPreviousWorks, apiGetQuizzes } from '../services/api';
import { getQuizAutoStatus } from '../utils/dateUtils';
import QuizCountdownBadge from '../components/QuizCountdownBadge';
import NetworkErrorPage from './NetworkErrorPage';
import { useAuth } from '../context/AuthContext';

export const QuizPageSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <Skeleton type="card" className="h-44 sm:h-52 w-full rounded-3xl" />

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-3">
        <Skeleton type="rect" className="h-10 w-28 rounded-xl" />
        <Skeleton type="rect" className="h-10 w-28 rounded-xl" />
        <Skeleton type="rect" className="h-10 w-28 rounded-xl" />
        <Skeleton type="rect" className="h-10 w-28 rounded-xl" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <Skeleton type="rect" className="h-4 w-16 rounded-full" />
              <Skeleton type="rect" className="h-4 w-12 rounded" />
            </div>
            <Skeleton type="heading" className="h-5 w-5/6" />
            <Skeleton type="text" className="h-3 w-full" />
            <div className="pt-3 border-t border-[var(--border-theme)] flex justify-between items-center">
              <Skeleton type="rect" className="h-3 w-16" />
              <Skeleton type="rect" className="h-8 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QuizPage = ({ isLoading: propLoading, onSelectQuiz }) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'running' | 'upcoming' | 'past'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPricing, setSelectedPricing] = useState('All'); // 'All' | 'free' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const [dynamicQuizzes, setDynamicQuizzes] = useState([]);
  const [pastWorksList, setPastWorksList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [quizRes, worksRes] = await Promise.allSettled([
          apiGetQuizzes(),
          apiGetPreviousWorks()
        ]);

        if (isMounted) {
          if (quizRes.status === 'fulfilled' && quizRes.value?.quizzes?.length > 0) {
            setDynamicQuizzes(quizRes.value.quizzes);
          }

          if (worksRes.status === 'fulfilled' && worksRes.value?.works?.length > 0) {
            const mapped = worksRes.value.works.map((w) => ({
              id: w._id || w.id,
              title: w.title,
              category: w.category || 'Web Dev',
              participants: w.participantsCount || '1.2k',
              duration: '30m',
              status: 'past',
              quizType: 'multiple_choice',
              mcqSubtype: 'standard',
              techStack: Array.isArray(w.techStack) ? w.techStack : ['Fullstack', 'Web'],
              quickDetails: w.description,
              description: w.description
            }));
            setPastWorksList(mapped);
          }
        }
      } catch (err) {
        console.warn('Fallback to local quiz data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    const handleReconnected = () => {
      loadData();
    };

    window.addEventListener('online', handleReconnected);
    window.addEventListener('app:online-reconnected', handleReconnected);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleReconnected);
      window.removeEventListener('app:online-reconnected', handleReconnected);
    };
  }, []);

  const sourceQuizzes = dynamicQuizzes;

  const allQuizzes = [
    ...sourceQuizzes.map((q) => ({
      ...q,
      computedStatus: getQuizAutoStatus(q)
    })),
    ...pastWorksList.map((w) => ({
      ...w,
      computedStatus: 'past'
    }))
  ];

  const filterTabs = [
    { id: 'all', label: 'All Challenges' },
    { id: 'running', label: 'Live Now' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Completed / Practice' }
  ];

  const categories = ['All', 'Web Dev', 'Frontend', 'Backend', 'CS Algo', 'Data & AI', 'UI / UX', 'DevOps'];

  const handleFilterClick = (tabId) => {
    setActiveFilter(tabId);
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
  };

  const handleQuizClick = (quiz) => {
    if (onSelectQuiz) onSelectQuiz(quiz);
  };

  // Priority sorting: Live (1) -> Upcoming (2) -> Completed/Practice (3)
  const getStatusPriorityWeight = (status) => {
    if (status === 'running') return 1;
    if (status === 'upcoming') return 2;
    return 3;
  };

  const filteredQuizzes = allQuizzes
    .filter((quiz) => {
      const matchesFilter = activeFilter === 'all' || quiz.computedStatus === activeFilter;
      const matchesCategory = selectedCategory === 'All' || quiz.category === selectedCategory;
      const isPaidQuiz = Boolean(quiz.isPaid && (quiz.price || 0) > 0);
      const matchesPricing = selectedPricing === 'All' || (selectedPricing === 'free' ? !isPaidQuiz : isPaidQuiz);
      const matchesSearch =
        (quiz.title && quiz.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(quiz.techStack) && quiz.techStack.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesFilter && matchesCategory && matchesPricing && matchesSearch;
    })
    .sort((a, b) => {
      return getStatusPriorityWeight(a.computedStatus) - getStatusPriorityWeight(b.computedStatus);
    });

  if (propLoading || isLoading) return <QuizPageSkeleton />;

  const hasActiveCustomFilters = activeFilter !== 'all' || selectedCategory !== 'All' || selectedPricing !== 'All';

  return (
    <div className="space-y-6 py-2 animate-fadeIn">
      {/* Top Banner Ad Slot */}
      <AdBanner placement="quiz_catalog_top" />

      {/* Sticky Compact Header Card (Title Left, Count & Controls Right) */}
      <div className="sticky top-[64px] sm:top-[72px] z-30 bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-theme)] rounded-2xl p-3.5 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300">
        {/* Left Side: Title strictly aligned left */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h1 className="text-lg sm:text-2xl font-extrabold font-poppins text-[var(--text-main)] flex items-center">
            <span>⚡ Quiz Hub</span>
          </h1>

          {/* Mobile Badge (Aligned Right on Mobile) */}
          <span className="sm:hidden px-2.5 py-0.5 rounded-full text-xs font-poppins font-bold bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-blue-950 dark:text-blue-300 border border-[var(--color-primary-200)] dark:border-blue-800 shrink-0">
            {filteredQuizzes.length} Quizzes
          </span>
        </div>

        {/* Right Side: Count Badge (Desktop Right) + Search Input + Single Filter Button */}
        <div className="flex items-center justify-end space-x-2.5 w-full sm:w-auto ml-auto">
          {/* Desktop Count Badge (Aligned Right) */}
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-poppins font-bold bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-blue-950 dark:text-blue-300 border border-[var(--color-primary-200)] dark:border-blue-800 shrink-0">
            {filteredQuizzes.length} Quizzes
          </span>

          {/* Integrated Search Input */}
          <div className="flex-1 sm:w-72 relative">
            <input
              type="text"
              placeholder="Search challenges or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary-600)] transition-all"
            />
            <span className="absolute left-3 top-2.5 text-[var(--text-muted)] text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Single Filter Icon Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0 relative"
            aria-label="Open Filter Controls"
          >
            <span>🎛️</span>
            <span>Filter</span>
            {hasActiveCustomFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse absolute -top-1 -right-1 border border-white" />
            )}
          </button>
        </div>
      </div>

      {/* QUIZ CARDS GRID */}
      {filteredQuizzes.length === 0 ? (
        typeof navigator !== 'undefined' && !navigator.onLine ? (
          <NetworkErrorPage onRetry={() => window.location.reload()} />
        ) : (
          <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-theme)] p-8">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">No quizzes found</h3>
            <p className="text-xs font-lato text-[var(--text-muted)] mt-1">
              Try adjusting your search criteria or filter tags.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredQuizzes.map((quiz, index) => {
            const isCode = quiz.quizType === 'code';
            const isQuick = quiz.mcqSubtype === 'quick';
            const isCompleted = quiz.computedStatus === 'past';
            const isUserRegistered = Boolean(user && quiz.enrolledUsers && quiz.enrolledUsers.some(u => (u.userId === user._id || u.userId === user.id || u === user._id || u === user.id)));
            const originalPrice = quiz.price || 0;
            const effectivePrice = isCompleted && quiz.isPaid ? Math.max(1, Math.round(originalPrice * 0.10)) : originalPrice;
            const isDiscounted = isCompleted && quiz.isPaid && originalPrice > 0;
            const showInlineAd = index > 0 && index % 4 === 0;

            return (
              <Fragment key={quiz._id || quiz.id || quiz.title || index}>
                {showInlineAd && (
                  <div className="col-span-full my-2">
                    <AdBanner placement="quiz_catalog_top" />
                  </div>
                )}
                <div
                  onClick={() => handleQuizClick(quiz)}
                  className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 relative overflow-hidden"
                >
                {quiz.computedStatus === 'running' && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-poppins font-extrabold uppercase px-3 py-0.5 rounded-bl-xl shadow-sm">
                    🔴 Live Now
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-blue-950 dark:text-blue-300">
                        {quiz.category || 'Web Dev'}
                      </span>
                      {isDiscounted ? (
                        <span className="text-[10px] font-poppins font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                          <span>🔥 ₹{effectivePrice}</span>
                          <span className="line-through text-rose-500 dark:text-rose-400 text-[9px] font-bold">₹{originalPrice}</span>
                        </span>
                      ) : quiz.isPaid && originalPrice > 0 ? (
                        <span className="text-[10px] font-poppins font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                          💳 ₹{originalPrice}
                        </span>
                      ) : (
                        <span className="text-[10px] font-poppins font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                          🟢 FREE
                        </span>
                      )}
                    </div>

                    {/* Quiz Type Pill */}
                    {isCode ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-poppins font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        💻 Code
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-poppins font-bold ${
                        isQuick
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {isQuick ? '⚡ Quick' : '📝 Standard'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-poppins font-bold text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--color-primary-600)] transition-colors line-clamp-2 leading-snug mb-2">
                    {quiz.title}
                  </h3>

                  <p className="font-lato text-xs text-[var(--text-muted)] line-clamp-2 mb-3">
                    {quiz.quickDetails || quiz.description || 'Test your proficiency and compete on real-time leaderboards.'}
                  </p>

                  {/* Rewards preview if available */}
                  {quiz.rewards && quiz.rewards.length > 0 && (
                    <div className="bg-[var(--bg-main)] p-2 rounded-xl border border-[var(--border-theme)] text-[11px] font-lato text-amber-900 dark:text-amber-200 font-bold mb-3 flex items-center space-x-1.5">
                      <span>🏆</span>
                      <span className="truncate">{quiz.rewards[0].badge}: {quiz.rewards[0].prize}</span>
                    </div>
                  )}

                  {/* LIVE COUNTDOWN BADGE */}
                  <div className="mb-2">
                    <QuizCountdownBadge quiz={quiz} />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[11px] font-lato text-[var(--text-muted)] font-bold">
                    <span>⏱️ {quiz.durationMinutes ? `${quiz.durationMinutes}m` : quiz.duration || '20m'}</span>
                    <span>•</span>
                    <span className="text-[var(--color-primary-600)]">👥 {quiz.enrolledUsers ? quiz.enrolledUsers.length : 0} Enrolled</span>
                  </div>

                  <button
                    className={`px-3.5 py-1.5 rounded-xl font-poppins font-bold text-xs transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : quiz.computedStatus === 'running'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : isUserRegistered
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white'
                    }`}
                  >
                    {isCompleted
                      ? (isUserRegistered || !quiz.isPaid ? '🎯 Practice' : '📝 Unlock Practice')
                      : quiz.computedStatus === 'running'
                      ? 'Compete 🚀'
                      : isUserRegistered
                      ? '✅ Registered'
                      : '📝 Register'}
                  </button>
                </div>
              </div>
            </Fragment>
          );
          })}
        </div>
      )}

      {/* MOBILE SINGLE FILTER ICON DRAWER / MODAL POPUP */}
      {isMobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          {/* Backdrop Overlay Click */}
          <div
            className="absolute inset-0"
            onClick={() => setIsMobileFilterDrawerOpen(false)}
            aria-label="Close Filter Modal"
          />

          {/* Sliding Bottom Drawer Box */}
          <div className="w-full sm:max-w-md bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative z-10 animate-slideUp max-h-[85vh] overflow-y-auto custom-scrollbar space-y-4 pb-4 sm:pb-6">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-theme)] sticky top-0 bg-[var(--bg-card)] z-20">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎛️</span>
                <h3 className="font-poppins font-bold text-base text-[var(--text-main)]">
                  Filter Quiz Challenges
                </h3>
              </div>

              <button
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                aria-label="Close Drawer"
              >
                ✕
              </button>
            </div>

            {/* 1. Challenge Status Filter Section */}
            <div className="space-y-2">
              <label className="text-xs font-poppins font-black uppercase tracking-wider text-[var(--text-muted)]">
                Challenge Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {filterTabs.map((tab) => {
                  const isSel = activeFilter === tab.id;
                  const count = allQuizzes.filter((q) => tab.id === 'all' || q.computedStatus === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleFilterClick(tab.id)}
                      className={`p-2.5 rounded-xl text-xs font-poppins font-bold flex items-center justify-between border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)] shadow-xs'
                          : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
                      }`}
                    >
                      <span className="truncate">{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSel ? 'bg-white/25 text-white' : 'bg-[var(--border-theme)] text-[var(--text-muted)]'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Category Filter Section */}
            <div className="space-y-2">
              <label className="text-xs font-poppins font-black uppercase tracking-wider text-[var(--text-muted)]">
                Technology Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSel = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-semibold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[var(--color-primary-600)] text-white font-bold shadow-xs'
                          : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-theme)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {cat === 'All' ? '🌐 All Categories' : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Pricing Access Filter Section */}
            <div className="space-y-2">
              <label className="text-xs font-poppins font-black uppercase tracking-wider text-[var(--text-muted)]">
                Pricing Access
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'All', label: 'All Access' },
                  { id: 'free', label: '🟢 Free' },
                  { id: 'paid', label: '💳 Paid' }
                ].map((item) => {
                  const isSel = selectedPricing === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPricing(item.id)}
                      className={`p-2 rounded-xl text-xs font-poppins font-bold text-center border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)] shadow-xs'
                          : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-theme)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Action Buttons (Sticky & Safe Above Mobile Nav Bar) */}
            <div className="sticky -bottom-4 sm:bottom-0 bg-[var(--bg-card)] pt-3 pb-4 border-t border-[var(--border-theme)] flex items-center gap-3 z-20 mt-4 shadow-top">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSelectedCategory('All');
                  setSelectedPricing('All');
                  setSearchQuery('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--border-theme)] text-[var(--text-muted)] hover:text-[var(--text-main)] font-poppins font-bold text-xs border border-[var(--border-theme)] transition-all cursor-pointer text-center active:scale-95"
              >
                Reset All
              </button>

              <button
                type="button"
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md transition-all cursor-pointer text-center active:scale-95"
              >
                Apply Filters ({filteredQuizzes.length})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default QuizPage;
