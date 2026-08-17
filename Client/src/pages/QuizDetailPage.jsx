import { useState } from 'react';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getQuizAutoStatus } from '../utils/dateUtils';
import { apiGetQuizLeaderboard } from '../services/api';
import QuizCountdownBadge from '../components/QuizCountdownBadge';

export const QuizDetailSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Skeleton type="card" className="h-64 sm:h-80 w-full rounded-3xl" />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <Skeleton type="heading" className="h-10 w-3/4" />
          <div className="flex gap-2">
            <Skeleton type="rect" className="h-6 w-16 rounded-lg" />
            <Skeleton type="rect" className="h-6 w-16 rounded-lg" />
            <Skeleton type="rect" className="h-6 w-16 rounded-lg" />
          </div>
          <Skeleton type="card" className="h-36 w-full rounded-2xl" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Skeleton type="rect" className="h-12 w-36 rounded-xl" />
        <Skeleton type="rect" className="h-12 w-48 rounded-xl" />
        <Skeleton type="rect" className="h-12 w-48 rounded-xl" />
      </div>
      <Skeleton type="card" className="h-48 w-full rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} type="card" className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
};

export const QuizDetailPage = ({ quiz, onBack, onStartQuiz, onRequireLogin, isLoading }) => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const LEADERBOARD_PAGE_SIZE = 5;

  const isCode = quiz?.quizType === 'code';
  const isQuick = quiz?.mcqSubtype === 'quick';
  const timerType = quiz?.timerType || (isQuick ? 'per_question_general' : 'total_quiz');
  const autoStatus = getQuizAutoStatus(quiz);
  const isEnded = autoStatus === 'past';
  const isUpcoming = autoStatus === 'upcoming';

  const title = quiz?.title || 'JavaScript ES6+ & Async Architecture Challenge';
  const category = quiz?.category || 'Web Dev';
  const techStack = quiz?.techStack || ['JavaScript', 'ES6+', 'Async/Await', 'Promises', 'Event Loop', 'Fetch API', 'Vite'];
  const quickDetails = quiz?.quickDetails || (isCode
    ? 'Solve real-world financial settlement and algorithmic reconciliation in a live interactive code IDE with test cases.'
    : 'Comprehensive interactive assessment testing asynchronous patterns, closure mechanics, and modern web application logic under timed execution.');
  const startDate = quiz?.startDate || '2026-08-14';
  const startTime = quiz?.startTime || '10:00 AM';
  const endDate = quiz?.endDate || quiz?.startDate || '2026-08-14';
  const endTime = quiz?.endTime || '11:00 AM';
  const description = quiz?.description || `Welcome to the live ${title}!

This competition is designed to evaluate your deep technical comprehension and problem-solving speed. Participants will encounter real-world scenarios, algorithmic logic, and state management challenges.

Rules & Guidelines:
1. ${isCode ? 'Real-world coding challenge with live automated test cases.' : 'Multiple Choice Questions with timed execution.'}
2. ${
    timerType === 'per_question_custom'
      ? '🎯 Custom Time Per Question: Each question has an individual speed countdown.'
      : timerType === 'per_question_general'
      ? `⏱️ General Question Time: ${quiz?.generalQuestionTimerSeconds || 15} seconds per question.`
      : `⏳ Total Quiz Duration: ${quiz?.durationMinutes || 30} minutes total exam timer.`
  }
3. ${isCode ? '🛡️ Live Camera & Microphone Anti-Cheating Proctoring with Tab Lockout is strictly active.' : 'Option choices with instant scoring.'}
4. 🏆 Leaderboard Rule: Candidate's 1st attempt is recorded on the Live Quiz leaderboard. Subsequent replays are recorded as Practice Mode without disrupting live quiz rankings.
5. 🎯 Post-Exam Practice: After the quiz has ended, you can replay and practice with all questions freely.`;

  const rewards = quiz?.rewards && quiz.rewards.length > 0 ? quiz.rewards : [
    { place: '1st', badge: '🥇 Winner', prize: '$500 Cash + Gold Trophy', description: 'Top Rank Award + Exclusive Swag Kit' },
    { place: '2nd', badge: '🥈 Runner Up', prize: '$250 Cash + Silver Medal', description: '2nd Rank Certificate + Pro Subscription' },
    { place: '3rd', badge: '🥉 3rd Place', prize: '$100 Cash + Bronze Medal', description: '3rd Rank Certificate + Pro Subscription' },
    { place: '4-10th', badge: '🏅 Top 10', prize: 'Pro Membership & Swag', description: 'Top 10 Certificate + Swag Box' }
  ];

  const handleStart = () => {
    // Check if user is logged in
    if (!isAuthenticated && !user) {
      addToast('🔒 Please sign in or create an account to start this assessment!', 'warning');
      if (onRequireLogin) onRequireLogin();
      return;
    }

    if (isUpcoming) {
      addToast(`⏳ Live Quiz is scheduled for ${startDate} at ${startTime}. Entry will unlock at the exact start time!`, 'warning');
      return;
    }

    if (onStartQuiz) onStartQuiz(isEnded);
  };

  const handleOpenLeaderboard = async () => {
    setIsLeaderboardModalOpen(true);
    setIsLoadingLeaderboard(true);
    setCurrentPage(1);
    try {
      const quizId = quiz?._id || quiz?.id;
      if (quizId) {
        const res = await apiGetQuizLeaderboard(quizId);
        if (res.success && res.leaderboard) {
          setLeaderboardList(res.leaderboard);
        } else {
          setLeaderboardList([]);
        }
      }
    } catch (err) {
      console.warn('Leaderboard load fallback', err);
      setLeaderboardList([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  // Robust multi-factor attendance verification
  const quizId = quiz?._id || quiz?.id;
  const currentUserId = user?._id || user?.id || user?.userId;
  const currentUserEmail = (user?.email || '').trim().toLowerCase();
  const currentUserName = (user?.name || '').trim().toLowerCase();
  const currentUsernamePrefix = currentUserEmail ? currentUserEmail.split('@')[0].toLowerCase() : '';

  // 1. Check local session attempt cache
  let localAttempt = null;
  if (typeof window !== 'undefined' && quizId) {
    try {
      const stored = localStorage.getItem(`quiz_attempted_${quizId}`);
      if (stored) localAttempt = JSON.parse(stored);
    } catch {
      // Ignore localStorage read errors
    }
  }

  // 2. Check leaderboard records with multi-factor matching
  const userAttempt = leaderboardList.find((entry) => {
    // ID Match
    const entryUserId = entry.userId ? (entry.userId._id || entry.userId.id || entry.userId).toString() : null;
    if (entryUserId && currentUserId && entryUserId === currentUserId.toString()) {
      return true;
    }

    // Email Match
    const entryEmail = (entry.userEmail || '').trim().toLowerCase();
    if (currentUserEmail && entryEmail && entryEmail === currentUserEmail) {
      return true;
    }

    // Email username prefix match (e.g. riteshgang)
    const entryUsername = (entry.username || (entryEmail ? entryEmail.split('@')[0] : '')).trim().toLowerCase();
    if (currentUsernamePrefix && entryUsername && (entryUsername === currentUsernamePrefix || entryEmail.startsWith(currentUsernamePrefix))) {
      return true;
    }

    // Full name match (ignoring generic 'candidate')
    const entryName = (entry.userName || '').trim().toLowerCase();
    if (currentUserName && entryName && entryName !== 'candidate' && entryName === currentUserName) {
      return true;
    }

    return false;
  });

  const hasAttended = Boolean(userAttempt || localAttempt);
  const userRank = userAttempt ? leaderboardList.indexOf(userAttempt) + 1 : (localAttempt?.rank || null);
  const displayScore = userAttempt?.score ?? localAttempt?.score ?? 100;
  const displayTime = userAttempt?.timeTakenSeconds ?? localAttempt?.timeTakenSeconds ?? 45;

  // Pagination calculation
  const totalPages = Math.ceil(leaderboardList.length / LEADERBOARD_PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * LEADERBOARD_PAGE_SIZE;
  const paginatedLeaderboard = leaderboardList.slice(startIndex, startIndex + LEADERBOARD_PAGE_SIZE);

  if (isLoading) return <QuizDetailSkeleton />;

  return (
    <div className="space-y-8 py-4 animate-fadeIn">
      
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-4 flex-wrap gap-2">
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-main)] hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-400)] transition-all font-poppins font-semibold text-xs sm:text-sm cursor-pointer active:scale-95 flex items-center space-x-2"
        >
          <span>← Back to Quizzes</span>
        </button>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Timing Mode Badge */}
          <span className="px-2.5 py-1 rounded-lg text-xs font-poppins font-bold bg-slate-200 dark:bg-slate-800 text-[var(--text-main)] border border-[var(--border-theme)]">
            {timerType === 'per_question_custom'
              ? '🎯 Custom Time/Q'
              : timerType === 'per_question_general'
              ? `⏱️ ${quiz?.generalQuestionTimerSeconds || 15}s / Q`
              : `⏳ ${quiz?.durationMinutes || 30}m Total`}
          </span>

          <QuizCountdownBadge quiz={quiz} />

          {isCode ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-poppins font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-400">
              💻 Code Challenge (Proctored)
            </span>
          ) : (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-poppins font-bold ${
              isQuick ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            }`}>
              {isQuick ? '⚡ MCQ Quick' : '📝 MCQ Standard'}
            </span>
          )}
        </div>
      </div>

      {/* TOP HEADER HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Left: Poster / Logo Box */}
        <div className={`lg:col-span-4 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg border border-white/20 relative overflow-hidden min-h-[260px] sm:min-h-[300px] text-white ${
          isCode
            ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900'
            : 'bg-gradient-to-br from-[var(--color-secondary-400)] to-[var(--color-secondary-600)]'
        }`}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-poppins font-bold text-4xl shadow-md mb-4">
            {isCode ? '💻' : '⚡'}
          </div>
          <span className="px-3 py-1 rounded-full bg-black/20 text-xs font-poppins font-bold uppercase tracking-wider mb-2">
            {category}
          </span>
          <h3 className="font-poppins font-bold text-xl sm:text-2xl leading-tight">
            {isCode ? 'Real-World Code IDE' : 'Interactive Assessment'}
          </h3>
        </div>

        {/* Right: Title, Tech Stack Pills & Details Box */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-poppins text-[var(--text-main)] leading-tight mb-3">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)] mr-1">
                Tech :
              </span>
              {techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-secondary)] font-poppins font-semibold text-xs shadow-sm hover:border-[var(--color-primary-400)] transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="relative pt-3">
            <span className="absolute -top-1 left-4 px-3 py-0.5 rounded-lg bg-[var(--accent-yellow-banner)] text-slate-900 font-poppins font-bold text-xs shadow-sm border border-amber-300">
              Details
            </span>

            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 pt-6 shadow-sm">
              <p className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {quickDetails}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ACTION & SCHEDULE ROW WITH LIVE COUNTDOWN TIMER */}
      <div className={`grid grid-cols-1 ${isEnded ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4 items-center`}>
        
        {/* Practice or Start Assessment */}
        <button
          onClick={handleStart}
          disabled={isUpcoming}
          className={`h-full py-4 px-5 rounded-2xl text-white font-poppins font-bold text-sm sm:text-base shadow-lg transition-all border flex items-center justify-center space-x-2 ${
            isEnded
              ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-400 shadow-indigo-500/20 active:scale-95 cursor-pointer'
              : isUpcoming
              ? 'bg-slate-700/80 border-slate-600/60 text-slate-300 opacity-90 cursor-not-allowed shadow-none'
              : 'bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)] border-emerald-400 shadow-emerald-500/20 active:scale-95 cursor-pointer'
          }`}
        >
          <span>
            {isEnded
              ? '🎯 Practice Quiz'
              : isUpcoming
              ? `🔒 Live Quiz Locked (Starts at ${startTime})`
              : isCode
              ? 'Start Code Challenge 🚀'
              : 'Start Live Assessment 🚀'}
          </span>
        </button>

        {/* View Leaderboard Button (For completed / ended quiz) */}
        {isEnded && (
          <button
            onClick={handleOpenLeaderboard}
            className="h-full py-4 px-5 rounded-2xl text-amber-950 dark:text-amber-200 font-poppins font-extrabold text-sm sm:text-base shadow-lg transition-all active:scale-95 cursor-pointer border bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 dark:from-amber-900 dark:via-amber-800 dark:to-yellow-900 border-amber-400/60 shadow-amber-500/20 flex items-center justify-center space-x-2"
          >
            <span>🏆 Live Quiz Leaderboard</span>
          </button>
        )}

        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs font-poppins font-semibold text-[var(--text-muted)] uppercase mb-1">
            Start Schedule
          </div>
          <div className="text-xs sm:text-sm font-lato text-[var(--text-main)] font-bold">
            Start Date : {startDate}
          </div>
          <div className="text-xs font-lato text-[var(--color-primary-600)] font-bold">
            Start Time : {startTime}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs font-poppins font-semibold text-[var(--text-muted)] uppercase mb-1">
            End Schedule
          </div>
          <div className="text-xs sm:text-sm font-lato text-[var(--text-main)] font-bold">
            End Date : {endDate}
          </div>
          <div className="text-xs font-lato text-rose-500 font-bold">
            End Time : {endTime}
          </div>
        </div>

      </div>

      {/* PROMINENT LIVE COUNTDOWN BANNER CARD */}
      <QuizCountdownBadge quiz={quiz} size="lg" className="w-full shadow-sm" />

      {/* DESCRIPTION SECTION */}
      <div className="relative pt-3">
        <span className="absolute -top-1 left-4 px-4 py-1 rounded-xl bg-[var(--accent-yellow-banner)] text-slate-900 font-poppins font-bold text-xs sm:text-sm shadow-sm border border-amber-300">
          Description
        </span>

        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 pt-7 sm:pt-9 shadow-sm">
          <div className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
            {description}
          </div>
        </div>
      </div>

      {/* REWARDS SECTION */}
      <div className="relative pt-3">
        <span className="absolute -top-1 left-4 px-4 py-1 rounded-xl bg-[var(--accent-yellow-banner)] text-slate-900 font-poppins font-bold text-xs sm:text-sm shadow-sm border border-amber-300">
          Rewards
        </span>

        <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 pt-8 sm:pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[var(--color-secondary-300)] to-[var(--color-secondary-400)] dark:from-emerald-900/80 dark:to-emerald-800/80 text-slate-900 dark:text-emerald-50 rounded-2xl p-5 shadow-sm border border-emerald-400/40 flex flex-col justify-between hover:scale-105 transition-transform"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-poppins font-extrabold text-xl sm:text-2xl">
                      {reward.place}
                    </span>
                    <span className="text-xs font-poppins font-bold px-2 py-0.5 rounded-md bg-white/40 dark:bg-black/30">
                      {reward.badge}
                    </span>
                  </div>

                  <div className="font-poppins font-bold text-sm sm:text-base mb-1">
                    {reward.prize}
                  </div>
                </div>

                <div className="text-[11px] font-lato opacity-80 pt-2 border-t border-slate-900/10 dark:border-white/10">
                  {reward.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏆 DEDICATED LIVE QUIZ LEADERBOARD MODAL WITH PAGINATION */}
      {/* ========================================================================= */}
      {isLeaderboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-3xl bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar relative space-y-6">
            
            {/* Close Button */}
            <button
              onClick={() => setIsLeaderboardModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-sm"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 border-b border-[var(--border-theme)] pb-4 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm">
                🏆
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-poppins text-[var(--text-main)]">
                  Live Quiz Final Leaderboard
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  {title} • Verified Single-Entry Rank List
                </p>
              </div>
            </div>

            {/* ATTENDANCE NOTICE BANNER */}
            {hasAttended ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-lato space-y-1.5 shadow-sm">
                <div className="font-poppins font-bold flex items-center space-x-1.5 uppercase text-xs tracking-wider">
                  <span>⭐</span>
                  <span>Your Live Quiz Attempt Verified:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-poppins font-bold">
                  {userRank && <span>Rank: <span className="text-amber-500">#{userRank}</span></span>}
                  {userRank && <span>•</span>}
                  <span>Score: <span className="text-emerald-500">{displayScore}%</span></span>
                  <span>•</span>
                  <span>Time: <span className="text-indigo-500">{displayTime}s</span></span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Completed</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-lato space-y-2 shadow-sm">
                <div className="font-poppins font-bold flex items-center space-x-1.5 uppercase text-xs tracking-wider">
                  <span>📢</span>
                  <span>Attendance Notice:</span>
                </div>
                <p className="leading-relaxed">
                  You didn't attend this quiz during the live quiz competition window. You can still review the live leaderboard rank list below or click <strong>Practice Mode</strong> to test yourself with all questions freely!
                </p>
              </div>
            )}

            {/* LEADERBOARD TABLE WITH PAGINATION */}
            {isLoadingLeaderboard ? (
              <div className="text-center py-12 text-xs font-lato text-[var(--text-muted)]">
                Loading live quiz leaderboard ranks...
              </div>
            ) : leaderboardList.length === 0 ? (
              <div className="text-center py-12 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-theme)] p-6 text-xs font-lato text-[var(--text-muted)] space-y-2">
                <span className="text-3xl block">📋</span>
                <p className="font-poppins font-bold text-sm text-[var(--text-main)]">No Live Quiz Submissions Recorded Yet</p>
                <p>Be the first to practice with this completed challenge!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-lato text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-theme)] text-[var(--text-muted)] uppercase text-[10px] font-poppins font-bold">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Candidate</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3 text-center">Time Taken</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-theme)]">
                      {paginatedLeaderboard.map((entry, idx) => {
                        const globalRank = (currentPage - 1) * LEADERBOARD_PAGE_SIZE + idx + 1;
                        const isCurrentUser = user && (
                          (entry.userEmail && user.email && entry.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                          (entry.userName && user.name && entry.userName.toLowerCase() === user.name.toLowerCase()) ||
                          (currentUserId && entry.userId && (entry.userId._id || entry.userId.id || entry.userId).toString() === currentUserId.toString())
                        );
                        const emailUsername = entry.userEmail ? entry.userEmail.split('@')[0] : (entry.username || '');
                        const displayName = (entry.userName && entry.userName !== 'Candidate')
                          ? entry.userName
                          : (emailUsername ? (emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)) : 'Candidate');

                        return (
                          <tr
                            key={entry._id || idx}
                            className={`hover:bg-[var(--bg-main)] transition-colors ${
                              isCurrentUser ? 'bg-[var(--color-primary-50)]/60 dark:bg-blue-950/40 font-bold' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-poppins font-bold">
                              {globalRank === 1 ? '🥇 1st' : globalRank === 2 ? '🥈 2nd' : globalRank === 3 ? '🥉 3rd' : `#${globalRank}`}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-poppins font-semibold text-[var(--text-main)] flex flex-wrap items-center gap-1.5">
                                <span>{displayName}</span>
                                {emailUsername && (
                                  <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                    @{emailUsername}
                                  </span>
                                )}
                                {isCurrentUser && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary-600)] text-white font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">{entry.userEmail || (emailUsername ? `${emailUsername}@example.com` : '')}</div>
                            </td>
                            <td className="py-3 px-3 text-center font-poppins font-bold text-emerald-500">
                              {entry.score}%
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-xs text-[var(--text-secondary)]">
                              {entry.timeTakenSeconds}s
                            </td>
                            <td className="py-3 px-3 text-right text-[11px] text-[var(--text-muted)]">
                              {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Today'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-theme)] text-xs font-poppins">
                    <span className="text-[var(--text-muted)] text-[11px] font-lato">
                      Showing <strong className="text-[var(--text-main)]">{Math.min((currentPage - 1) * LEADERBOARD_PAGE_SIZE + 1, leaderboardList.length)}</strong> to <strong className="text-[var(--text-main)]">{Math.min(currentPage * LEADERBOARD_PAGE_SIZE, leaderboardList.length)}</strong> of <strong className="text-[var(--text-main)]">{leaderboardList.length}</strong> entries
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-theme)] text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-main)] font-semibold transition-colors cursor-pointer"
                      >
                        ← Prev
                      </button>

                      {Array.from({ length: totalPages }).map((_, pIdx) => {
                        const pageNum = pIdx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                                : 'border border-[var(--border-theme)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-theme)] text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-main)] font-semibold transition-colors cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-theme)]">
              <button
                onClick={() => {
                  setIsLeaderboardModalOpen(false);
                  handleStart();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-poppins font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <span>🎯 Practice with Questions</span>
              </button>

              <button
                onClick={() => setIsLeaderboardModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)] font-poppins font-semibold text-xs cursor-pointer hover:bg-[var(--bg-main)]"
              >
                Close Leaderboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default QuizDetailPage;
