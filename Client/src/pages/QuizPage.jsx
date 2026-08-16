import { useState, useEffect, useRef } from 'react';
import Skeleton from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { apiGetPreviousWorks, apiGetQuizzes } from '../services/api';
import { getQuizAutoStatus } from '../utils/dateUtils';
import QuizCountdownBadge from '../components/QuizCountdownBadge';

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
  const { addToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'running' | 'upcoming' | 'past'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicQuizzes, setDynamicQuizzes] = useState([]);
  const [pastWorksList, setPastWorksList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    return () => {
      isMounted = false;
    };
  }, []);

  const defaultQuizzes = [
    {
      id: 1,
      title: 'JavaScript ES6+ & Async Architecture Challenge',
      category: 'Web Dev',
      quizType: 'multiple_choice',
      mcqSubtype: 'quick',
      participants: '1.4k',
      duration: '15m',
      startDate: '2026-08-14',
      startTime: '10:00 AM',
      endDate: '2026-08-14',
      endTime: '11:00 AM',
      techStack: ['JavaScript', 'ES6+', 'Async/Await', 'Promises', 'Vite']
    },
    {
      id: 2,
      title: 'Real-World Algorithm: Two Sum Settlement Engine',
      category: 'CS Algo',
      quizType: 'code',
      participants: '3.2k',
      duration: '30m',
      startDate: '2026-08-14',
      startTime: '10:00 AM',
      endDate: '2026-08-14',
      endTime: '12:00 PM',
      techStack: ['Algorithms', 'Data Structures', 'JavaScript', 'HashMaps']
    },
    {
      id: 3,
      title: 'React 19 & Next.js Architecture Exam',
      category: 'Frontend',
      quizType: 'multiple_choice',
      mcqSubtype: 'standard',
      participants: '980',
      duration: '20m',
      startDate: '2026-08-20',
      startTime: '02:00 PM',
      endDate: '2026-08-20',
      endTime: '03:00 PM',
      techStack: ['React 19', 'Next.js', 'Server Actions', 'SSR']
    },
    {
      id: 4,
      title: 'Node.js & Express API Security',
      category: 'Backend',
      quizType: 'multiple_choice',
      mcqSubtype: 'standard',
      participants: '750',
      duration: '25m',
      startDate: '2026-08-14',
      startTime: '09:00 AM',
      endDate: '2026-08-14',
      endTime: '10:00 AM',
      techStack: ['Node.js', 'Express', 'JWT', 'Security', 'MongoDB']
    }
  ];

  const sourceQuizzes = dynamicQuizzes.length > 0 ? dynamicQuizzes : defaultQuizzes;

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
    { id: 'all', label: '🌟 All Challenges' },
    { id: 'running', label: '🔴 Live Now' },
    { id: 'upcoming', label: '⏳ Upcoming' },
    { id: 'past', label: '🎯 Completed / Practice' }
  ];

  const categories = ['All', 'Web Dev', 'Frontend', 'Backend', 'CS Algo', 'Data & AI', 'UI / UX', 'DevOps'];

  const handleFilterClick = (tabId, label) => {
    setActiveFilter(tabId);
    addToast(`Viewing ${label}`, 'info');
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    addToast(`Filtered by category: ${cat}`, 'info');
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
      const matchesSearch =
        (quiz.title && quiz.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(quiz.techStack) && quiz.techStack.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesFilter && matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      return getStatusPriorityWeight(a.computedStatus) - getStatusPriorityWeight(b.computedStatus);
    });

  if (propLoading || isLoading) return <QuizPageSkeleton />;

  return (
    <div className="space-y-8 py-4 animate-fadeIn">
      
      {/* Top Banner Box */}
      <div className="bg-gradient-to-r from-[var(--color-primary-600)] via-indigo-700 to-[var(--color-secondary-600)] text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-poppins font-bold uppercase tracking-wider mb-2">
            Explore All Quizzes & Challenges
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-poppins mb-2">
            Assessments & Works Hub
          </h1>
          <p className="text-xs sm:text-sm font-lato text-blue-100 max-w-xl">
            Prioritized by active Live Competitions 🔴, Upcoming challenges ⏳, and Completed Practice tests 🎯 with live countdowns.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search challenges or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-2xl bg-white/15 border border-white/20 text-white placeholder-blue-100 text-xs sm:text-sm focus:outline-none focus:bg-white/25 backdrop-blur-md"
          />
          <span className="absolute left-3.5 top-3.5 text-blue-200 text-sm">🔍</span>
        </div>
      </div>

      {/* FILTER TABS & CATEGORY DROPDOWN (PARALLEL RIGHT) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-[var(--border-theme)]">
        {/* Left: Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const count = allQuizzes.filter((q) => tab.id === 'all' || q.computedStatus === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => handleFilterClick(tab.id, tab.label)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-poppins font-bold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[var(--color-primary-600)] text-white shadow-md'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Right: Category Dropdown (All, Web Dev, Frontend, Backend, CS Algo, Data & AI, UI / UX, DevOps) */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto shrink-0 relative" ref={categoryDropdownRef}>
          <span className="text-xs font-poppins font-bold text-[var(--text-muted)] whitespace-nowrap flex items-center space-x-1">
            <span>📂</span>
            <span>Category:</span>
          </span>
          <div className="relative flex-1 md:w-56">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-xs sm:text-sm font-poppins font-semibold text-[var(--text-main)] cursor-pointer focus:outline-none focus:border-[var(--color-primary-600)] shadow-sm transition-all"
            >
              <span className="truncate">
                {selectedCategory === 'All' ? '🌐 All Categories' : `💻 ${selectedCategory}`}
              </span>
              <span className={`text-[10px] text-[var(--text-muted)] transition-transform duration-200 ml-2 font-bold ${isCategoryDropdownOpen ? 'rotate-180 text-[var(--color-primary-600)]' : ''}`}>
                ▼
              </span>
            </button>

            {/* Floating Dropdown Menu: Adds scrollbar when list goes larger than 5 */}
            {isCategoryDropdownOpen && (
              <div
                className={`absolute right-0 mt-1.5 w-full min-w-[210px] bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl shadow-2xl z-30 p-1.5 animate-fadeIn ${
                  categories.length > 5 ? 'max-h-[195px] overflow-y-auto custom-scrollbar' : ''
                }`}
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        handleCategoryClick(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-poppins font-semibold transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-slate-800 dark:text-blue-400 font-bold'
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                      }`}
                    >
                      <span className="truncate">
                        {cat === 'All' ? '🌐 All Categories' : `💻 ${cat}`}
                      </span>
                      {isSelected && (
                        <span className="text-[var(--color-primary-600)] font-bold text-xs ml-2">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUIZ CARDS GRID */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-theme)] p-8">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">No quizzes found</h3>
          <p className="text-xs font-lato text-[var(--text-muted)] mt-1">
            Try adjusting your search criteria or filter tags.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredQuizzes.map((quiz) => {
            const isCode = quiz.quizType === 'code';
            const isQuick = quiz.mcqSubtype === 'quick';
            const isCompleted = quiz.computedStatus === 'past';

            return (
              <div
                key={quiz._id || quiz.id || quiz.title}
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-blue-950 dark:text-blue-300">
                      {quiz.category || 'Web Dev'}
                    </span>

                    {/* Quiz Type Pill */}
                    {isCode ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-poppins font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        💻 Code
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-poppins font-bold ${
                        isQuick
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
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
                    <div className="bg-[var(--bg-main)] p-2 rounded-xl border border-[var(--border-theme)] text-[11px] font-lato text-amber-600 dark:text-amber-400 font-semibold mb-3 flex items-center space-x-1.5">
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
                  <span className="text-[11px] font-lato text-[var(--text-muted)] font-bold">
                    ⏱️ {quiz.durationMinutes ? `${quiz.durationMinutes}m` : quiz.duration || '20m'}
                  </span>

                  <button
                    className={`px-3.5 py-1.5 rounded-xl font-poppins font-bold text-xs transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : quiz.computedStatus === 'running'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white'
                    }`}
                  >
                    {isCompleted ? '🎯 Practice' : quiz.computedStatus === 'running' ? 'Compete 🚀' : 'View Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default QuizPage;
