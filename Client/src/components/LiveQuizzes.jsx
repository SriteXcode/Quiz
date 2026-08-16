import React, { useState, useEffect } from 'react';
import Skeleton from './Skeleton';
import { apiGetQuizzes } from '../services/api';
import QuizCountdownBadge from './QuizCountdownBadge';
import { getQuizAutoStatus } from '../utils/dateUtils';

const DEFAULT_QUIZ_DATA = [
  {
    id: 1,
    title: 'JavaScript ES6+ & Async Architecture Challenge',
    quizType: 'multiple_choice',
    mcqSubtype: 'quick',
    category: 'Web Dev',
    participants: '1.4k',
    duration: '15m',
    startDate: '2026-08-14',
    startTime: '10:00 AM',
    endDate: '2026-08-14',
    endTime: '11:00 AM',
    rewards: [
      { place: '1st', badge: '🥇 Winner', prize: '$500 Cash + Trophy' },
      { place: '2nd', badge: '🥈 Runner Up', prize: '$250 Cash' },
      { place: '3rd', badge: '🥉 3rd Place', prize: '$100 Cash' },
      { place: '4-10th', badge: '🏅 Top 10', prize: 'Pro Membership' }
    ]
  },
  {
    id: 2,
    title: 'Algorithm Speedrun: Two Sum & Transaction Balance',
    quizType: 'code',
    category: 'CS Algo',
    participants: '3.2k',
    duration: '30m',
    startDate: '2026-08-14',
    startTime: '10:00 AM',
    endDate: '2026-08-14',
    endTime: '12:00 PM',
    rewards: [
      { place: '1st', badge: '🥇 Winner', prize: '$1,000 Cash + Swag Kit' },
      { place: '2nd', badge: '🥈 Runner Up', prize: '$500 Cash' },
      { place: '3rd', badge: '🥉 3rd Place', prize: '$250 Cash' },
      { place: '4-10th', badge: '🏅 Top 10', prize: 'Annual Pro Access' }
    ]
  },
  {
    id: 3,
    title: 'React 19 & Next.js Architecture Exam',
    quizType: 'multiple_choice',
    mcqSubtype: 'standard',
    category: 'Frontend',
    participants: '980',
    duration: '20m',
    startDate: '2026-08-20',
    startTime: '02:00 PM',
    endDate: '2026-08-20',
    endTime: '03:00 PM',
    rewards: [
      { place: '1st', badge: '🥇 Winner', prize: '$300 Cash' },
      { place: '2nd-5th', badge: '🎖️ Top 5', prize: 'Pro Subscription' }
    ]
  },
  {
    id: 4,
    title: 'Node.js & Express API Security',
    quizType: 'multiple_choice',
    mcqSubtype: 'standard',
    category: 'Backend',
    participants: '750',
    duration: '25m',
    startDate: '2026-08-14',
    startTime: '09:00 AM',
    endDate: '2026-08-14',
    endTime: '10:00 AM',
    rewards: [
      { place: '1st', badge: '🥇 Winner', prize: '$200 Cash' }
    ]
  }
];

export const LiveQuizSkeletonCard = () => {
  return (
    <div className="w-[220px] sm:w-[260px] md:w-[280px] shrink-0 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-56 skeleton-shimmer">
      <div>
        <div className="flex justify-between items-center mb-3">
          <Skeleton type="rect" className="h-4 w-16 rounded-full" />
          <Skeleton type="rect" className="h-3.5 w-10 rounded" />
        </div>
        <Skeleton type="heading" className="h-5 w-5/6 mb-2" />
        <Skeleton type="text" className="h-3.5 w-full mb-1" />
        <Skeleton type="text" className="h-3.5 w-2/3" />
      </div>
      <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
        <Skeleton type="rect" className="h-3.5 w-16 rounded" />
        <Skeleton type="rect" className="h-7 w-16 rounded-xl" />
      </div>
    </div>
  );
};

export const LiveQuizzes = ({ isLoading: propLoading, onSelectQuiz, onViewAll }) => {
  const [quizzes, setQuizzes] = useState(DEFAULT_QUIZ_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveQuizzes = async () => {
      try {
        const res = await apiGetQuizzes();
        if (isMounted && res && res.success && res.quizzes && res.quizzes.length > 0) {
          setQuizzes(res.quizzes);
        }
      } catch (err) {
        console.warn('[LiveQuizzes API]: Using fallback items', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveQuizzes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Automatic Background Priority Sorting:
  // Priority 1: Running (Live Now)
  // Priority 2: Upcoming (Scheduled)
  // Priority 3: Past / Completed & Ended (Practice Mode)
  const getStatusPriorityWeight = (quiz) => {
    const status = getQuizAutoStatus(quiz);
    if (status === 'running') return 1;
    if (status === 'upcoming') return 2;
    return 3; // 'past' (completed & ended)
  };

  const prioritizedQuizzes = [...quizzes].sort((a, b) => {
    return getStatusPriorityWeight(a) - getStatusPriorityWeight(b);
  });

  const isShowLoading = propLoading || loading;

  return (
    <section className="mb-8 space-y-4">
      
      {/* CLEAN SECTION HEADER (FILTER BUTTONS REMOVED - PRIORITY RUNS IN BACKGROUND) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[var(--text-main)]">
            Live Quizzes & Challenges
          </h2>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-secondary-400)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-secondary-500)]"></span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onViewAll ? onViewAll() : onSelectQuiz && onSelectQuiz(prioritizedQuizzes[0])}
            className="text-xs sm:text-sm font-semibold font-poppins text-[var(--color-primary-600)] hover:underline cursor-pointer"
          >
            View All ({prioritizedQuizzes.length}) →
          </button>
        </div>
      </div>

      {/* QUIZZES HORIZONTAL SCROLL CAROUSEL - AUTOMATICALLY PRIORITIZED */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar snap-x snap-mandatory">
          {isShowLoading ? (
            Array.from({ length: 4 }).map((_, i) => <LiveQuizSkeletonCard key={i} />)
          ) : prioritizedQuizzes.length === 0 ? (
            <div className="w-full text-center py-12 text-xs font-lato text-[var(--text-muted)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-theme)] p-6">
              No quizzes currently available.
            </div>
          ) : (
            prioritizedQuizzes.map((quiz) => {
              const isCode = quiz.quizType === 'code';
              const isQuick = quiz.mcqSubtype === 'quick';
              const status = getQuizAutoStatus(quiz);
              const isEnded = status === 'past';

              return (
                <div
                  key={quiz._id || quiz.id || quiz.title}
                  onClick={() => onSelectQuiz && onSelectQuiz(quiz)}
                  className="w-[240px] sm:w-[280px] md:w-[300px] shrink-0 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between snap-start group cursor-pointer hover:-translate-y-1 relative overflow-hidden"
                >
                  {/* Top Priority Ribbon for Live items */}
                  {status === 'running' && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-poppins font-extrabold uppercase px-3 py-0.5 rounded-bl-xl shadow-sm">
                      🔴 Live Now
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-blue-950 dark:text-blue-300">
                        {quiz.category || 'Web Dev'}
                      </span>

                      {/* Type Badge */}
                      {isCode ? (
                        <span className="text-[10px] font-poppins font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          💻 Code
                        </span>
                      ) : (
                        <span className={`text-[10px] font-poppins font-bold px-2 py-0.5 rounded ${
                          isQuick
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {isQuick ? '⚡ Quick' : '📝 Standard'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-poppins font-bold text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--color-primary-600)] transition-colors line-clamp-2 leading-snug mb-1">
                      {quiz.title}
                    </h3>

                    <p className="font-lato text-xs text-[var(--text-muted)] line-clamp-2 mb-3">
                      {quiz.quickDetails || quiz.description || 'Test your knowledge and compete in real-time.'}
                    </p>

                    {/* REWARDS SNIPPET (Top 1st prize & group perks) */}
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
                      ⏱️ {quiz.durationMinutes || quiz.duration || '20m'}
                    </span>

                    <button
                      className={`px-3 py-1.5 rounded-xl font-poppins font-bold text-xs transition-all shadow-sm ${
                        isEnded
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : status === 'running'
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]'
                      }`}
                    >
                      {isEnded ? '🎯 Practice' : status === 'running' ? 'Compete 🚀' : 'View Details'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </section>
  );
};

export default LiveQuizzes;
