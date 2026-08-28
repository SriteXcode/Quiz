import { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';
import { downloadShortsGyaanTemplate } from '../utils/excelTemplateUtils';
import {
  apiGetShortsGyaan,
  apiToggleLikeShort,
  apiToggleSaveShort,
  apiAdminUploadExcelShorts,
  apiAdminCreateShort
} from '../services/api';
import NetworkErrorPage from './NetworkErrorPage';

const CATEGORIES = [
  { id: 'Saved', label: '🔖 Saved Gyaan', shortLabel: 'Saved', icon: '🔖', tag: 'Bookmarks' },
  { id: 'For You', label: '🔥 For You', shortLabel: 'For You', icon: '🔥', tag: 'Trending' },
  { id: 'All', label: '🌐 All Topics', shortLabel: 'All Topics', icon: '🌐', tag: 'All' },
  { id: 'Java', label: '☕ Java Core', shortLabel: 'Java', icon: '☕', tag: 'Core' },
  { id: 'OOPs', label: '🧱 OOPs Concepts', shortLabel: 'OOPs', icon: '🧱', tag: '4 Pillars' },
  { id: 'Polymorphism', label: '🧬 Polymorphism', shortLabel: 'Polymorphism', icon: '🧬', tag: 'Dynamic' },
  { id: 'Abstraction', label: '🎭 Abstraction', shortLabel: 'Abstraction', icon: '🎭', tag: 'Interfaces' },
  { id: 'Inheritance', label: '🌳 Inheritance', shortLabel: 'Inheritance', icon: '🌳', tag: 'Extends' },
  { id: 'Encapsulation', label: '🛡️ Encapsulation', shortLabel: 'Encapsulation', icon: '🛡️', tag: 'Data Hiding' },
  { id: 'JavaScript', label: '⚡ JavaScript', shortLabel: 'JavaScript', icon: '⚡', tag: 'ES6+' },
  { id: 'React', label: '⚛️ React & Next', shortLabel: 'React', icon: '⚛️', tag: 'UI' },
  { id: 'DSA / Algo', label: '🧩 Algorithms', shortLabel: 'DSA / Algo', icon: '🧩', tag: 'O(1)' },
  { id: 'Python', label: '🐍 Python', shortLabel: 'Python', icon: '🐍', tag: 'Core' },
  { id: 'System Design', label: '🏗️ System Design', shortLabel: 'System Design', icon: '🏗️', tag: 'Arch' },
  { id: 'CSS & UI', label: '🎨 CSS & UI', shortLabel: 'CSS & UI', icon: '🎨', tag: 'Design' },
  
];

// Shuffles options for MCQs while updating correctAnswerIndex to match
export const shuffleQuestionOptions = (q) => {
  if (!q || !Array.isArray(q.options) || q.options.length < 2) return q;

  const originalCorrectIndex = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;

  // Track original correct answer
  const indexed = q.options.map((opt, idx) => ({
    opt,
    isCorrect: idx === originalCorrectIndex
  }));

  // Fisher-Yates Shuffle
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  const newCorrectIndex = indexed.findIndex((item) => item.isCorrect);

  return {
    ...q,
    options: indexed.map((item) => item.opt),
    correctAnswerIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
};

export const ShortGyaanSkeleton = () => {
  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-theme)] p-3.5 sm:p-5 flex flex-col justify-between space-y-4 animate-pulse shadow-md">
      {/* Header Skeleton: Category Badge & Timer Pill */}
      <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3">
        <div className="flex items-center space-x-2">
          <Skeleton type="rect" className="h-6 w-24 rounded-lg" />
          <Skeleton type="rect" className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton type="rect" className="h-6 w-20 rounded-full" />
      </div>

      {/* Middle Content Skeleton: Question Statement, Code Block, 4 Options */}
      <div className="flex-1 space-y-3.5 overflow-hidden">
        {/* Question Statement Lines */}
        <div className="space-y-2">
          <Skeleton type="text" className="h-5 w-11/12" />
          <Skeleton type="text" className="h-5 w-3/4" />
        </div>

        {/* Code Snippet Box Skeleton */}
        <Skeleton type="rect" className="h-20 sm:h-24 w-full rounded-xl" />

        {/* 4 Option Buttons Skeleton */}
        <div className="space-y-2 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-2.5 sm:p-3 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] flex items-center space-x-3"
            >
              <Skeleton type="rect" className="h-5 w-5 rounded-md shrink-0" />
              <Skeleton type="text" className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Actions Skeleton */}
      <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
        <Skeleton type="text" className="h-4 w-28" />
        <div className="flex items-center space-x-2">
          <Skeleton type="rect" className="h-7 w-16 rounded-xl" />
          <Skeleton type="rect" className="h-7 w-8 rounded-xl" />
          <Skeleton type="rect" className="h-7 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const ShortGyaanDetailsSkeleton = () => {
  return (
    <div className="w-full h-full bg-[var(--bg-card)] border-2 border-[var(--border-theme)] rounded-2xl sm:rounded-3xl p-4 shadow-md space-y-4 animate-pulse flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3">
          <div className="flex items-center space-x-2.5">
            <Skeleton type="circle" className="w-8 h-8 shrink-0" />
            <div className="space-y-1.5">
              <Skeleton type="text" className="h-4 w-32" />
              <Skeleton type="text" className="h-3 w-20" />
            </div>
          </div>
          <Skeleton type="rect" className="h-6 w-16 rounded-full" />
        </div>

        <Skeleton type="rect" className="h-16 w-full rounded-xl" />
        <Skeleton type="rect" className="h-36 w-full rounded-2xl" />
        <Skeleton type="rect" className="h-20 w-full rounded-xl" />
      </div>

      <div className="pt-3 border-t border-[var(--border-theme)] flex justify-between items-center">
        <Skeleton type="text" className="h-4 w-24" />
        <Skeleton type="rect" className="h-6 w-20 rounded-lg" />
      </div>
    </div>
  );
};

export const ShortGyaanPage = ({ onRequireAuth, onNavigateHome }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  // Feed & Infinite Step Scroll State
  const [shorts, setShorts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem('shorts_gyaan_active_category') || 'For You';
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  // Active step index (0 to shorts.length - 1)
  const [activeCardIndex, setActiveCardIndex] = useState(() => {
    const saved = sessionStorage.getItem('shorts_gyaan_active_step');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  // State map per question: { [shortId]: { selectedIndex, isAnswered, isCorrect, isTimedOut } }
  const [answersState, setAnswersState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('shorts_gyaan_answers_state');
      return saved ? JSON.parse(saved) || {} : {};
    } catch {
      return {};
    }
  });

  // Session Accuracy Refresh Prompt Modal State
  const [showSessionPromptModal, setShowSessionPromptModal] = useState(false);
  const [savedSessionStats, setSavedSessionStats] = useState(null);

  // Active question countdown timer and per-question pausable remaining time map
  const [activeQuestionTimer, setActiveQuestionTimer] = useState(30);
  const [remainingTimes, setRemainingTimes] = useState({});
  const [isQuestionTimerPaused, setIsQuestionTimerPaused] = useState(false);

  // 15-second post-answer buffer countdown
  const [explanationBufferTimer, setExplanationBufferTimer] = useState(null);
  const [isBufferPaused, setIsBufferPaused] = useState(false);
  const [collapsedSolutions, setCollapsedSolutions] = useState({});
  const [solutionDragStartY, setSolutionDragStartY] = useState(null);

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Tab Active State: pauses timers when user switches browser tab or window blurs
  const [isTabActive, setIsTabActive] = useState(() => {
    return typeof document !== 'undefined' ? !document.hidden : true;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    const handleWindowBlur = () => {
      setIsTabActive(false);
    };
    const handleWindowFocus = () => {
      setIsTabActive(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Check on mount / reload if there is an existing session accuracy to prompt user
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('shorts_gyaan_answers_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const stats = Object.values(parsed).reduce(
            (acc, state) => {
              if (!state.isAnswered) return acc;
              const isAttempted = state.selectedIndex !== null && state.selectedIndex !== undefined;
              if (isAttempted) {
                acc.attempted++;
                if (state.isCorrect) acc.correct++;
                else acc.incorrect++;
              } else {
                acc.unattempted++;
              }
              return acc;
            },
            { attempted: 0, correct: 0, incorrect: 0, unattempted: 0 }
          );

          if (stats.attempted > 0 || stats.unattempted > 0) {
            setTimeout(() => {
              setSavedSessionStats({
                answers: parsed,
                stats,
                accuracy: stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0
              });
              setShowSessionPromptModal(true);
            }, 0);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse previous session:', e);
    }
  }, []);

  // Persist answersState to sessionStorage whenever updated
  useEffect(() => {
    if (answersState && Object.keys(answersState).length > 0) {
      sessionStorage.setItem('shorts_gyaan_answers_state', JSON.stringify(answersState));
    }
  }, [answersState]);

  const handleKeepSessionAccuracy = () => {
    setShowSessionPromptModal(false);
  };

  const handleResetSessionAccuracy = () => {
    setAnswersState({});
    setRemainingTimes({});
    sessionStorage.removeItem('shorts_gyaan_answers_state');
    sessionStorage.removeItem('shorts_gyaan_active_step');
    setActiveCardIndex(0);
    setShowSessionPromptModal(false);
  };

  // Persist category and step index across page reloads
  useEffect(() => {
    localStorage.setItem('shorts_gyaan_active_category', activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    sessionStorage.setItem('shorts_gyaan_active_step', String(activeCardIndex));
  }, [activeCardIndex]);

  // Admin Excel Upload & Creator Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState('upload'); // 'upload' | 'single'
  const [excelFile, setExcelFile] = useState(null);
  const [parsedPreviewRows, setParsedPreviewRows] = useState([]);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);

  // Single Question Creator Form
  const [singleForm, setSingleForm] = useState({
    questionText: '',
    codeSnippet: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswerIndex: 0,
    explanation: '',
    category: 'JavaScript',
    timerSeconds: 30
  });

  // DOM Container & Card Refs for Smooth Reel Scrolling
  const feedContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const observerRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollUnlockTimerRef = useRef(null);

  // Scroll Lock & Debounce Refs for Strict 1-Question Step Navigation
  const isWheelingLockedRef = useRef(false);
  const wheelInertiaTimerRef = useRef(null);
  const lastStepTimestampRef = useRef(0);

  const touchStartYRef = useRef(null);
  const touchStartXRef = useRef(null);
  const hasSteppedInTouchGestureRef = useRef(false);
  const isTouchLockedRef = useRef(false);
  const touchCooldownTimerRef = useRef(null);

  const lastKeyTimeRef = useRef(0);

  // -------------------------------------------------------------
  // AUDIO EFFECT HELPER (Web Audio API Synthesizer)
  // -------------------------------------------------------------
  const playSoundEffect = useCallback((type) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(146.83, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'step') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // -------------------------------------------------------------
  // 1. INITIAL LOAD (WITH DYNAMIC OPTION SHUFFLING)
  // -------------------------------------------------------------
  const fetchInitialShorts = useCallback(async () => {
    setIsLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const params = { page: 1, limit: 10 };
      if (activeCategory === 'Saved') {
        params.savedOnly = true;
      } else if (activeCategory !== 'For You' && activeCategory !== 'All') {
        params.category = activeCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await apiGetShortsGyaan(params);
      if (res.success && res.shorts) {
        const shuffledList = res.shorts.map((s) => shuffleQuestionOptions(s));
        setShorts(shuffledList);
        
        // Restore saved step if user refreshed the page
        const savedStep = parseInt(sessionStorage.getItem('shorts_gyaan_active_step'), 10) || 0;
        const validStep = savedStep >= 0 && savedStep < shuffledList.length ? savedStep : 0;
        setActiveCardIndex(validStep);
        setHasMore(res.hasMore !== false);
        
        if (feedContainerRef.current) {
          if (validStep === 0) {
            feedContainerRef.current.scrollTop = 0;
          }
        }
      }
    } catch (err) {
      console.warn('[Short Gyaan Fetch Error]:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    fetchInitialShorts();
  }, [fetchInitialShorts]);

  // -------------------------------------------------------------
  // REFRESH & RESET ALL QUESTIONS & USER ANSWERS
  // -------------------------------------------------------------
  const handleResetAndRefresh = useCallback(async () => {
    playSoundEffect('step');
    setAnswersState({});
    setActiveCardIndex(0);
    sessionStorage.removeItem('shorts_gyaan_active_step');
    setExplanationBufferTimer(null);
    setIsBufferPaused(false);
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = 0;
    }
    addToast('🔄 Feed refreshed!', 'info');
    await fetchInitialShorts();
  }, [fetchInitialShorts, playSoundEffect, addToast]);

  // -------------------------------------------------------------
  // 2. INFINITE SCROLL: LOAD NEXT BATCH
  // -------------------------------------------------------------
  const loadMoreShorts = useCallback(async () => {
    if (isLoadingMore || !hasMore || activeCategory === 'Saved') return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const params = { page: nextPage, limit: 8 };
      if (activeCategory !== 'For You' && activeCategory !== 'All') {
        params.category = activeCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await apiGetShortsGyaan(params);
      if (res.success && res.shorts && res.shorts.length > 0) {
        const shuffledBatch = res.shorts.map((s) => shuffleQuestionOptions(s));
        setShorts((prev) => {
          const existingIds = new Set(prev.map((s) => s._id));
          const newItems = shuffledBatch.filter((s) => !existingIds.has(s._id));
          return [...prev, ...(newItems.length > 0 ? newItems : shuffledBatch.map(s => ({ ...s, _id: s._id + '_' + Date.now() })))];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.warn('[Load More Shorts Error]:', err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, activeCategory, searchQuery]);

  const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopLayout(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setFeedContainerRef = useCallback((el, isDesktopSection) => {
    if (!el) return;
    const isDesktopEnv = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (isDesktopEnv === isDesktopSection) {
      feedContainerRef.current = el;
    }
  }, []);

  const setCardRef = useCallback((el, idx, isDesktopSection) => {
    if (!el) return;
    const isDesktopEnv = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (isDesktopEnv === isDesktopSection) {
      cardRefs.current[idx] = el;
    }
  }, []);

  // -------------------------------------------------------------
  // 3. STEP NAVIGATION FUNCTIONS (Smooth Scroll Exactly 1 Card at a Time)
  // -------------------------------------------------------------
  const scrollToStepIndex = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= shorts.length) return;
    const targetCard = cardRefs.current[targetIndex];
    if (targetCard) {
      isProgrammaticScrollRef.current = true;

      // 1. Scroll target card smoothly into view for mobile and desktop
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // 2. Also scroll feed container if present
      const container = feedContainerRef.current;
      if (container) {
        const targetTop = targetCard.offsetTop - container.offsetTop;
        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      }

      setActiveCardIndex(targetIndex);
      playSoundEffect('step');
      setExplanationBufferTimer(null);
      setIsBufferPaused(false);

      if (targetIndex >= shorts.length - 3) {
        loadMoreShorts();
      }

      if (scrollUnlockTimerRef.current) clearTimeout(scrollUnlockTimerRef.current);
      scrollUnlockTimerRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 300);
    }
  }, [shorts.length, loadMoreShorts, playSoundEffect]);

  const scrollToNextCard = useCallback(() => {
    if (activeCardIndex < shorts.length - 1) {
      scrollToStepIndex(activeCardIndex + 1);
    } else {
      loadMoreShorts();
    }
  }, [activeCardIndex, shorts.length, scrollToStepIndex, loadMoreShorts]);

  const scrollToPrevCard = useCallback(() => {
    if (activeCardIndex > 0) {
      scrollToStepIndex(activeCardIndex - 1);
    } else {
      // Scrolling UP at initial card (index 0) refreshes feed
      handleResetAndRefresh();
    }
  }, [activeCardIndex, scrollToStepIndex, handleResetAndRefresh]);

  // -------------------------------------------------------------
  // 4. PRECISION MOUSE WHEEL & TRACKPAD INTERCEPTION (Desktop)
  // -------------------------------------------------------------
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    let wheelDeltaAccumulator = 0;
    let wheelResetTimer = null;

    const handleWheel = (e) => {
      if (isAdminModalOpen) return;

      // 1. Check if user is hovering inside an inner scrollable card content box
      const scrollableInner = e.target.closest('.card-scroll-content');
      if (scrollableInner) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableInner;
        const hasOverflow = scrollHeight > clientHeight + 4;

        if (hasOverflow) {
          const delta = e.deltaY;
          // Scrolling down and not yet at bottom -> let inner content scroll naturally
          if (delta > 0 && scrollTop + clientHeight < scrollHeight - 6) {
            return;
          }
          // Scrolling up and not yet at top -> let inner content scroll naturally
          if (delta < 0 && scrollTop > 6) {
            return;
          }
        }
      }

      // 2. Prevent default container momentum scroll to strictly force single-card stepping
      e.preventDefault();

      const now = Date.now();

      // If wheel navigation is currently locked (cooldown active or trackpad inertia ongoing)
      if (isWheelingLockedRef.current || isProgrammaticScrollRef.current) {
        // Extend lock slightly while inertia wheel ticks keep arriving
        if (wheelInertiaTimerRef.current) clearTimeout(wheelInertiaTimerRef.current);
        wheelInertiaTimerRef.current = setTimeout(() => {
          isWheelingLockedRef.current = false;
        }, 120);
        return;
      }

      // Responsive minimum time interval between question steps (220ms)
      if (now - lastStepTimestampRef.current < 220) {
        return;
      }

      wheelDeltaAccumulator += e.deltaY;

      if (wheelResetTimer) clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(() => {
        wheelDeltaAccumulator = 0;
      }, 80);

      // Light threshold for smooth effortless scroll response
      if (Math.abs(wheelDeltaAccumulator) >= 14) {
        const moveDown = wheelDeltaAccumulator > 0;
        wheelDeltaAccumulator = 0;
        isWheelingLockedRef.current = true;
        lastStepTimestampRef.current = now;

        if (moveDown) {
          scrollToNextCard();
        } else {
          scrollToPrevCard();
        }

        if (wheelInertiaTimerRef.current) clearTimeout(wheelInertiaTimerRef.current);
        wheelInertiaTimerRef.current = setTimeout(() => {
          isWheelingLockedRef.current = false;
        }, 200);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelResetTimer) clearTimeout(wheelResetTimer);
      if (wheelInertiaTimerRef.current) clearTimeout(wheelInertiaTimerRef.current);
    };
  }, [scrollToNextCard, scrollToPrevCard, isAdminModalOpen]);

  // -------------------------------------------------------------
  // 5. TOUCH SWIPE INTERCEPTION (Mobile & Touch Devices - Smooth 1 Question per Swipe)
  // -------------------------------------------------------------
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (isAdminModalOpen || !e.touches || e.touches.length === 0) return;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
      hasSteppedInTouchGestureRef.current = false;
    };

    const handleTouchMove = (e) => {
      if (
        touchStartYRef.current === null ||
        isAdminModalOpen ||
        !e.touches ||
        e.touches.length === 0
      ) return;

      // Check inner scrollable card content
      const scrollableInner = e.target.closest('.card-scroll-content');
      if (scrollableInner) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableInner;
        const hasOverflow = scrollHeight > clientHeight + 4;
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartYRef.current - currentY;

        if (hasOverflow) {
          if (deltaY > 0 && scrollTop + clientHeight < scrollHeight - 6) {
            return;
          }
          if (deltaY < 0 && scrollTop > 6) {
            return;
          }
        }
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = touchStartYRef.current - currentY;
      const deltaX = touchStartXRef.current - currentX;

      // Smooth vertical touch swipe handling
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (e.cancelable) e.preventDefault();

        const now = Date.now();

        if (
          !hasSteppedInTouchGestureRef.current &&
          !isTouchLockedRef.current &&
          !isProgrammaticScrollRef.current &&
          now - lastStepTimestampRef.current >= 200
        ) {
          // Responsive 18px swipe threshold
          if (Math.abs(deltaY) >= 18) {
            hasSteppedInTouchGestureRef.current = true;
            isTouchLockedRef.current = true;
            lastStepTimestampRef.current = now;

            if (deltaY > 0) {
              scrollToNextCard();
            } else {
              scrollToPrevCard();
            }

            if (touchCooldownTimerRef.current) clearTimeout(touchCooldownTimerRef.current);
            touchCooldownTimerRef.current = setTimeout(() => {
              isTouchLockedRef.current = false;
            }, 220);
          }
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      hasSteppedInTouchGestureRef.current = false;

      if (touchCooldownTimerRef.current) clearTimeout(touchCooldownTimerRef.current);
      touchCooldownTimerRef.current = setTimeout(() => {
        isTouchLockedRef.current = false;
      }, 100);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (touchCooldownTimerRef.current) clearTimeout(touchCooldownTimerRef.current);
    };
  }, [scrollToNextCard, scrollToPrevCard, isAdminModalOpen]);

  // -------------------------------------------------------------
  // 6. KEYBOARD ARROW CONTROLS (Up, Down, PageUp, PageDown, J, K)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAdminModalOpen || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const now = Date.now();
      if (now - lastKeyTimeRef.current < 300) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        lastKeyTimeRef.current = now;
        scrollToNextCard();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        lastKeyTimeRef.current = now;
        scrollToPrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToNextCard, scrollToPrevCard, isAdminModalOpen]);

  // -------------------------------------------------------------
  // 7. INTERSECTION OBSERVER (Keeps Active Index Synced on Direct Drag)
  // -------------------------------------------------------------
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container || shorts.length === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: container,
      rootMargin: '0px',
      threshold: 0.65
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (isProgrammaticScrollRef.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index)) {
            setActiveCardIndex((prev) => {
              if (prev !== index) {
                if (index >= shorts.length - 3) {
                  loadMoreShorts();
                }
                return index;
              }
              return prev;
            });
          }
        }
      });
    }, options);

    cardRefs.current.forEach((el) => {
      if (el) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [shorts, loadMoreShorts, isDesktopLayout]);

  const activeShort = shorts[activeCardIndex] || null;
  const currentShortId = activeShort?._id || `short_${activeCardIndex}`;
  const currentAnswerState = answersState[currentShortId] || {
    isAnswered: false,
    selectedIndex: null,
    isCorrect: false,
    isTimedOut: false
  };

  // -------------------------------------------------------------
  // 6. PAUSABLE / RESUMABLE COUNTDOWN TIMER PER ACTIVE QUESTION
  // -------------------------------------------------------------
  // 6. QUESTION COUNTDOWN TIMER WITH PAUSE & RESUME
  // -------------------------------------------------------------
  const handleQuestionTimeout = useCallback((shortId) => {
    setAnswersState((prev) => ({
      ...prev,
      [shortId]: {
        isAnswered: true,
        selectedIndex: null,
        isCorrect: false,
        isTimedOut: true
      }
    }));
    playSoundEffect('step');
    setExplanationBufferTimer(10);
  }, [playSoundEffect]);

  // - When user scrolls away (to previous or next question) or switches browser tabs:
  //   Timer for that question immediately stops/pauses and preserves remaining seconds.
  // - When user returns / tab becomes visible, timer resumes where left off.
  // - Moving to next question without answering does NOT count as an attempt.
  useEffect(() => {
    if (!activeShort || currentAnswerState.isAnswered || !isTabActive || isQuestionTimerPaused) return;

    const sId = currentShortId;
    const initialTime = remainingTimes[sId] !== undefined ? remainingTimes[sId] : (activeShort.timerSeconds || 30);
    
    const initTimeout = setTimeout(() => {
      setActiveQuestionTimer(initialTime);
      setExplanationBufferTimer(null);
      setIsBufferPaused(false);

      if (initialTime <= 0) {
        handleQuestionTimeout(sId);
      }
    }, 0);

    const timer = setInterval(() => {
      setRemainingTimes((prevTimes) => {
        const prev = prevTimes[sId] !== undefined ? prevTimes[sId] : (activeShort.timerSeconds || 30);
        if (prev <= 1) {
          clearInterval(timer);
          handleQuestionTimeout(sId);
          setActiveQuestionTimer(0);
          return { ...prevTimes, [sId]: 0 };
        }
        const nextTime = prev - 1;
        setActiveQuestionTimer(nextTime);
        return { ...prevTimes, [sId]: nextTime };
      });
    }, 1000);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(timer);
    };
  }, [activeCardIndex, activeShort, currentAnswerState.isAnswered, currentShortId, handleQuestionTimeout, isTabActive, isQuestionTimerPaused, remainingTimes]);

  // -------------------------------------------------------------
  // 7. 10-SECOND EXPLANATION AUTO-STEP BUFFER
  // -------------------------------------------------------------
  // Freezes when browser tab is inactive / blurred so it does NOT move ahead in background.
  useEffect(() => {
    if (explanationBufferTimer === null || isBufferPaused || !isTabActive) return;

    if (explanationBufferTimer <= 0) {
      const stepTimer = setTimeout(() => {
        scrollToNextCard();
        setExplanationBufferTimer(null);
      }, 0);
      return () => clearTimeout(stepTimer);
    }

    const interval = setInterval(() => {
      setExplanationBufferTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [explanationBufferTimer, isBufferPaused, isTabActive, scrollToNextCard]);

  // -------------------------------------------------------------
  // 8. USER CHOOSES AN ANSWER
  // -------------------------------------------------------------
  const handleSelectOption = (shortItem, optIdx) => {
    const sId = shortItem._id;
    const existing = answersState[sId];
    if (existing && existing.isAnswered) return;

    const isCorrect = optIdx === shortItem.correctAnswerIndex;

    setAnswersState((prev) => ({
      ...prev,
      [sId]: {
        isAnswered: true,
        selectedIndex: optIdx,
        isCorrect,
        isTimedOut: false
      }
    }));

    if (isCorrect) {
      playSoundEffect('correct');
    } else {
      playSoundEffect('wrong');
    }

    // Start 10s explanation buffer before stepping to next question
    setExplanationBufferTimer(10);
  };

  // -------------------------------------------------------------
  // ACCURACY & ATTEMPT STATS (Skipped/Unattempted Do NOT Lower Accuracy)
  // -------------------------------------------------------------
  // If user didn't choose any option, it is counted as "Not Attempted" / "Skipped".
  // Accuracy = (Correct Answers / Total ATTEMPTED Questions) * 100
  const sessionStats = Object.values(answersState).reduce(
    (acc, state) => {
      if (!state.isAnswered) return acc;
      const isAttempted = state.selectedIndex !== null && state.selectedIndex !== undefined;
      if (isAttempted) {
        acc.attempted++;
        if (state.isCorrect) {
          acc.correct++;
        } else {
          acc.incorrect++;
        }
      } else {
        acc.unattempted++;
      }
      return acc;
    },
    { attempted: 0, correct: 0, incorrect: 0, unattempted: 0 }
  );

  const accuracyPercentage = sessionStats.attempted > 0
    ? Math.round((sessionStats.correct / sessionStats.attempted) * 100)
    : 0;

  // -------------------------------------------------------------
  // 9. LIKE & SAVE INTERACTIONS
  // -------------------------------------------------------------
  const handleToggleLike = async (shortItem) => {
    const shortId = shortItem._id;

    setShorts((prev) =>
      prev.map((s) => {
        if (s._id === shortId) {
          const newIsLiked = !s.isLiked;
          return {
            ...s,
            isLiked: newIsLiked,
            likesCount: newIsLiked ? (s.likesCount || 0) + 1 : Math.max(0, (s.likesCount || 0) - 1)
          };
        }
        return s;
      })
    );

    try {
      const res = await apiToggleLikeShort(shortId);
      if (res.success) {
        addToast(res.message, res.isLiked ? 'success' : 'info');
      }
    } catch (err) {
      console.warn('Like fallback:', err.message);
    }
  };

  const handleToggleSave = async (shortItem) => {
    const shortId = shortItem._id;

    setShorts((prev) =>
      prev.map((s) => {
        if (s._id === shortId) {
          return { ...s, isSaved: !s.isSaved };
        }
        return s;
      })
    );

    try {
      const res = await apiToggleSaveShort(shortId);
      if (res.success) {
        addToast(res.message, res.isSaved ? 'success' : 'info');
      }
    } catch (err) {
      console.warn('Save fallback:', err.message);
    }
  };

  const handleShareShort = (shortItem) => {
    const shareText = `🧠 Short Gyaan: ${shortItem.questionText}\n\nCan you solve it? Check it out on brainArena! ⚡`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      addToast('📋 Short Gyaan question copied to clipboard!', 'success');
    }
  };

  // -------------------------------------------------------------
  // 10. ADMIN EXCEL BULK UPLOAD & TEMPLATE DOWNLOADS
  // -------------------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setParsedPreviewRows(data);
        addToast(`📊 Detected ${data.length} rows from Excel file!`, 'info');
      } catch (err) {
        addToast('Failed to parse Excel preview: ' + err.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUploadExcelSubmit = async () => {
    if (!excelFile) {
      addToast('Please choose an Excel (.xlsx/.xls) or CSV file first', 'warning');
      return;
    }

    setIsUploadingExcel(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);

      const res = await apiAdminUploadExcelShorts(formData);
      if (res.success) {
        addToast(res.message, 'success');
        setIsAdminModalOpen(false);
        setExcelFile(null);
        setParsedPreviewRows([]);
        fetchInitialShorts();
      }
    } catch (err) {
      addToast('Excel upload failed: ' + err.message, 'error');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleDownloadSampleTemplate = (format = 'xlsx') => {
    if (format === 'xlsx') {
      downloadShortsGyaanTemplate();
      addToast('📥 Short Gyaan Excel Template (.xlsx) downloaded successfully!', 'success');
    } else {
      const sampleData = [
        {
          Question: 'What will typeof NaN evaluate to in JavaScript?',
          'Option A': '"number"',
          'Option B': '"nan"',
          'Option C': '"undefined"',
          'Option D': '"object"',
          'Correct Answer': 'A',
          Explanation: 'NaN is defined as a numeric value according to the IEEE-754 floating point standard (typeof NaN === "number").',
          Category: 'JavaScript',
          Timer: 30
        },
        {
          Question: 'Which React 19 hook allows optimistic UI updates during async mutations?',
          'Option A': 'useOptimistic',
          'Option B': 'useActionState',
          'Option C': 'useTransition',
          'Option D': 'useFormStatus',
          'Correct Answer': 'A',
          Explanation: 'useOptimistic lets you display temporary optimistic state while server background operations are pending.',
          Category: 'React',
          Timer: 30
        },
        {
          Question: 'What is the average time complexity of key lookup in a Hash Map?',
          'Option A': 'O(1)',
          'Option B': 'O(log n)',
          'Option C': 'O(n)',
          'Option D': 'O(n^2)',
          'Correct Answer': 'A',
          Explanation: 'Hash Maps use hash functions to calculate array bucket indices directly, providing constant time O(1) average lookups.',
          Category: 'DSA / Algo',
          Timer: 30
        },
        {
          Question: 'What does the CSS property box-sizing: border-box do?',
          'Option A': 'Includes padding and border within the element total width and height.',
          'Option B': 'Adds a 3D shadow around the element container.',
          'Option C': 'Hides all overflowing text inside child boxes.',
          'Option D': 'Removes all default browser margins.',
          'Correct Answer': 'A',
          Explanation: 'border-box includes padding and border within the element total width and height, preventing layout breakage.',
          Category: 'CSS & UI',
          Timer: 30
        },
        {
          Question: 'In Python, what is the output of: print([x * 2 for x in range(3)])?',
          'Option A': '[0, 2, 4]',
          'Option B': '[2, 4, 6]',
          'Option C': '[0, 1, 2]',
          'Option D': '[2, 2, 2]',
          'Correct Answer': 'A',
          Explanation: 'range(3) produces 0, 1, and 2. The list comprehension doubles each number to create [0, 2, 4].',
          Category: 'Python',
          Timer: 30
        },
        {
          Question: 'What is the primary advantage of an SQL B-Tree index over a full table scan?',
          'Option A': 'Reduces query lookup time complexity from O(N) to O(log N).',
          'Option B': 'Encrypts user passwords in AES-256.',
          'Option C': 'Compresses table image files.',
          'Option D': 'Prevents network DDoS attacks.',
          'Correct Answer': 'A',
          Explanation: 'A B-Tree index maintains a self-balancing sorted tree structure that finds matching records in logarithmic time O(log N).',
          Category: 'System Design',
          Timer: 60
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      XLSX.writeFile(wb, 'Short_Gyaan_Questions_Template.csv');
      addToast('📥 Downloaded CSV Template successfully!', 'success');
    }
  };

  const handleCreateSingleShort = async (e) => {
    e.preventDefault();
    if (!singleForm.questionText || !singleForm.optionA || !singleForm.optionB || !singleForm.explanation) {
      addToast('Please fill all required question fields and options', 'warning');
      return;
    }

    try {
      const payload = {
        questionText: singleForm.questionText,
        codeSnippet: singleForm.codeSnippet,
        options: [singleForm.optionA, singleForm.optionB, singleForm.optionC || 'None of the above', singleForm.optionD || 'All of the above'],
        correctAnswerIndex: Number(singleForm.correctAnswerIndex),
        explanation: singleForm.explanation,
        category: singleForm.category,
        timerSeconds: Number(singleForm.timerSeconds)
      };

      const res = await apiAdminCreateShort(payload);
      if (res.success) {
        addToast('🎉 Short Gyaan question created successfully!', 'success');
        setIsAdminModalOpen(false);
        fetchInitialShorts();
      }
    } catch (err) {
      addToast('Creation failed: ' + err.message, 'error');
    }
  };

  // -------------------------------------------------------------
  // NON-LOGGED IN USER AUTH GATE
  // -------------------------------------------------------------
  if (!isAuthenticated && !user) {
    return (
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8 sm:py-14 px-4 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2.5 max-w-xl mx-auto md:hidden lg:hidden">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-poppins font-bold text-xs">
            <span>⚡</span>
            <span>Short Gyaan Micro-Challenges</span>
          </div>
          <h1 className="font-poppins font-black text-2xl sm:text-4xl text-[var(--text-main)] tracking-tight">
            Unlock Short Gyaan
          </h1>
          <p className="text-xs sm:text-sm font-lato text-[var(--text-muted)] leading-relaxed">
            Byte-sized engineering questions with live countdown timers, instant explanations, and XP tracking.
          </p>
        </div>

        {/* Auth Gate Card */}
        <div className="p-4 rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--color-primary-400)] shadow-2xl space-y-4 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/20">
            🔒
          </div>

          <div className="space-y-2">
            <h2 className="font-poppins font-black text-lg sm:text-xl text-[var(--text-main)]">
              Sign In or Register to View Shorts
            </h2>
            <p className="text-xs font-lato text-[var(--text-secondary)] leading-relaxed">
              You can freely browse the public site and live quiz details, but answering Short Gyaan questions, unlocking verified solutions, and earning badges requires an account.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1">
              <span className="text-base">⏱️</span>
              <div className="font-poppins font-bold text-xs text-[var(--text-main)]">30s Timers</div>
              <div className="text-[10px] text-[var(--text-muted)]">Real-time mental agility</div>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1">
              <span className="text-base">🧠</span>
              <div className="font-poppins font-bold text-xs text-[var(--text-main)]">Deep Solutions</div>
              <div className="text-[10px] text-[var(--text-muted)]">Synced engineering takeaways</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => onRequireAuth ? onRequireAuth('signup') : null}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-poppins font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 cursor-pointer transition-all active:scale-98"
              >
                ✨ Register Free Account
              </button>
              <button
                onClick={() => onRequireAuth ? onRequireAuth('login') : null}
                className="w-full py-3 px-5 rounded-2xl bg-[var(--bg-main)] border-2 border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-98"
              >
                🔑 Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100vh] max-h-[100vh] md:h-[90vh] lg:h-[90vh] flex flex-col items-center justify-center bg-[var(--bg-main)] fixed inset-x-0 top-8 md:top-0 lg:top-0  bottom-0 z-30 md:relative md:top-auto md:bottom-auto overflow-hidden select-none">
      
      {/* ========================================================================= */}
      {/* 1. MEDIUM & LARGE DEVICES VIEW (md:flex & lg:flex MULTI-COLUMN LAYOUT)   */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col items-center h-full max-h-full overflow-hidden w-full max-w-full">
        
        {/* TOP STICKY BAR FOR MEDIUM & LARGE DEVICES */}
        <div className="w-full max-w-full px-3 md:px-4 py-2 space-y-2 shrink-0 bg-[var(--bg-main)]/95 backdrop-blur-md z-20 border-b border-[var(--border-theme)] shadow-xs">
          <div className="flex items-center justify-between gap-2">
            
            {/* Header Title with Live Accuracy Badge */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20 shrink-0">
                ⚡
              </div>
              <div className="shrink-0">
                <h1 className="font-poppins font-black text-base text-[var(--text-main)] leading-none flex items-center space-x-1.5">
                  <span>Shorts</span>
                </h1>
              </div>

              {/* Live Accuracy & Stats Pill */}
              {(sessionStats.attempted > 0 || sessionStats.unattempted > 0) && (
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-theme)] text-[11px] font-poppins shadow-xs shrink-0">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5">
                    <span>🎯</span>
                    <span>{accuracyPercentage}%</span>
                    <span className="ml-0.5 font-semibold">Acc</span>
                  </span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="text-[var(--text-secondary)] font-medium">
                    {sessionStats.correct}/{sessionStats.attempted} Correct
                  </span>
                  {sessionStats.unattempted > 0 && (
                    <>
                      <span className="text-[var(--text-muted)]">•</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {sessionStats.unattempted} Skipped
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Controls: Search, Speaker, Reset, Languages Dropdown, Admin */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearchInput((prev) => !prev)}
                className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-all shadow-sm ${
                  showSearchInput
                    ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-[var(--text-main)]'
                }`}
                title="Search Topics"
              >
                <span>🔍</span>
              </button>

              <button
                onClick={() => setSoundEnabled((p) => !p)}
                className="p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs cursor-pointer hover:border-[var(--color-primary-400)] transition-all shadow-sm text-[var(--text-main)]"
                title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              >
                <span>{soundEnabled ? '🔊' : '🔇'}</span>
              </button>

              <button
                onClick={handleResetAndRefresh}
                className="p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs cursor-pointer hover:border-[var(--color-primary-400)] transition-all shadow-sm text-[var(--text-main)]"
                title="Reset session and start from first question"
              >
                <span>🔄</span>
              </button>

              {/* Languages Dropdown */}
              <div className="relative flex items-center">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="appearance-none bg-[var(--bg-card)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs rounded-xl py-1.5 pl-3 pr-7 cursor-pointer transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  title="Filter by language or topic"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[var(--bg-card)] text-[var(--text-main)] font-poppins py-1">
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 flex items-center text-[10px] text-[var(--text-muted)]">
                  ▼
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-poppins font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1 shrink-0"
                >
                  <span>📤 Excel</span>
                </button>
              )}
            </div>

          </div>

          {showSearchInput && (
            <div className="animate-fadeIn pt-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g. closures, useState, indexes, O(1))..."
                className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-primary-400)] text-xs font-poppins text-[var(--text-main)] focus:outline-none shadow-sm"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* MAIN WRAPPER FOR MEDIUM & LARGE DEVICES */}
        <div className="w-full max-w-full flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 px-3 overflow-hidden min-h-0 py-1.5">
          
          {/* COLUMN 1: TOPIC TAGS SIDEBAR (VISIBLE ON LARGE SCREENS) */}
          <div className="hidden md:hidden lg:flex lg:col-span-3 xl:col-span-2.5 h-full overflow-hidden flex-col bg-[var(--bg-card)] border-2 border-[var(--border-theme)] rounded-2xl p-2.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2 px-1 shrink-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm">🏷️</span>
                <span className="font-poppins font-bold text-xs text-[var(--text-main)]">Topic Tags</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[var(--color-primary-600)] bg-[var(--color-primary-50)] dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-[var(--color-primary-200)] dark:border-blue-900">
                {CATEGORIES.length} Tags
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-poppins font-medium transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-[var(--color-primary-600)] to-blue-600 text-white font-bold shadow-xs shadow-blue-500/20'
                        : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-[var(--border-theme)]'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5 truncate min-w-0">
                      <span className="text-sm shrink-0">{cat.icon}</span>
                      <span className="truncate">{cat.shortLabel || cat.label}</span>
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                      isSelected ? 'bg-white/20 text-white font-bold' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-theme)]'
                    }`}>
                      {cat.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeCategory !== 'For You' && activeCategory !== 'All' && (
              <button
                onClick={() => {
                  setActiveCategory('For You');
                  setPage(1);
                }}
                className="w-full py-1 text-center text-[10px] font-poppins font-semibold text-[var(--color-primary-600)] hover:underline cursor-pointer pt-1 border-t border-[var(--border-theme)] shrink-0"
              >
                ✕ Clear Filter
              </button>
            )}
          </div>

          {/* COLUMN 2: QUESTIONS FEED ON MEDIUM & LARGE DEVICES */}
          <div
            ref={(el) => setFeedContainerRef(el, true)}
            className="col-span-12 md:col-span-7 lg:col-span-5 xl:col-span-5.5 h-full overflow-y-scroll scroll-smooth snap-y snap-mandatory overscroll-contain space-y-0 px-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-y"
          >
            {isLoading ? (
              <ShortGyaanSkeleton />
            ) : shorts.length === 0 ? (
              <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-theme)] text-center space-y-3 shadow-md my-8 max-w-md mx-auto">
                <span className="text-3xl block">📭</span>
                <h3 className="font-poppins font-bold text-sm text-[var(--text-main)]">No Questions Found</h3>
                <p className="text-[11px] font-lato text-[var(--text-muted)]">
                  {activeCategory === 'Saved' ? 'No saved questions yet.' : `No questions found under "${activeCategory}".`}
                </p>
                <button
                  onClick={() => setActiveCategory('All')}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary-600)] text-white font-poppins font-bold text-xs cursor-pointer"
                >
                  Explore All Questions →
                </button>
              </div>
            ) : (
              shorts.map((shortItem, idx) => {
                const sId = shortItem._id;
                const answerState = answersState[sId] || {
                  isAnswered: false,
                  selectedIndex: null,
                  isCorrect: false,
                  isTimedOut: false
                };
                const isActive = activeCardIndex === idx;

                return (
                  <div
                    key={sId}
                    ref={(el) => setCardRef(el, idx, true)}
                    data-index={idx}
                    onClick={() => setActiveCardIndex(idx)}
                    className={`w-full h-full min-h-full max-h-full snap-start snap-always shrink-0 rounded-3xl bg-[var(--bg-card)] border-2 transition-all duration-300 shadow-md p-3.5 flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                      isActive
                        ? 'border-[var(--color-primary-500)] ring-2 ring-blue-500/20 shadow-blue-500/15'
                        : 'border-[var(--border-theme)] opacity-95 hover:border-[var(--color-primary-300)]'
                    }`}
                  >
                    <div className="shrink-0 flex items-center justify-between border-b border-[var(--border-theme)] pb-1.5 relative z-10 bg-[var(--bg-card)]">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-poppins font-bold bg-[var(--color-primary-50)] dark:bg-blue-950/60 text-[var(--color-primary-600)] border border-[var(--color-primary-200)] dark:border-blue-800">
                          {shortItem.category || 'JavaScript'}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-poppins font-extrabold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>

                      {!answerState.isAnswered ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isActive) {
                              setIsQuestionTimerPaused((p) => !p);
                            } else {
                              setActiveCardIndex(idx);
                            }
                          }}
                          className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full border font-mono font-bold text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xs ${
                            isActive && isQuestionTimerPaused
                              ? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-400 animate-pulse'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          }`}
                          title={isActive ? (isQuestionTimerPaused ? "Timer Paused — Click to Resume" : "Click to Pause Timer") : "Click to select card"}
                        >
                          <span>{isActive ? (isQuestionTimerPaused ? '⏸ Paused' : `⏱️ ${activeQuestionTimer}s`) : remainingTimes[shortItem._id] !== undefined ? `⏱️ ${remainingTimes[shortItem._id]}s` : `⏱️ ${shortItem.timerSeconds || 30}s`}</span>
                        </div>
                      ) : answerState.isCorrect ? (
                        <span className="text-[10px] font-poppins font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ✓ Correct (+10 XP)
                        </span>
                      ) : answerState.isTimedOut ? (
                        <span className="text-[10px] font-poppins font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          ⏳ Skipped (Timed Out)
                        </span>
                      ) : (
                        <span className="text-[10px] font-poppins font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                          ✗ Incorrect
                        </span>
                      )}
                    </div>

                    <div className="card-scroll-content flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col justify-start items-stretch space-y-2 relative z-10 my-1.5 pr-1 text-left">
                      <h2 className="text-sm font-bold font-poppins text-[var(--text-main)] leading-snug break-words">
                        {shortItem.questionText}
                      </h2>

                      {shortItem.codeSnippet && (
                        <div className="p-2 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner max-h-28 text-left">
                          <pre>{shortItem.codeSnippet}</pre>
                        </div>
                      )}

                      <div className="space-y-1.5 pt-0.5 text-left">
                        {shortItem.options.map((opt, optIdx) => {
                          const isSelected = answerState.selectedIndex === optIdx;
                          const isCorrectOption = optIdx === shortItem.correctAnswerIndex;
                          let optionStyle = 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)]';
                          let badgeStyle = 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-theme)]';

                          if (answerState.isAnswered) {
                            if (isCorrectOption) {
                              optionStyle = 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                              badgeStyle = 'bg-emerald-500 text-white';
                            } else if (isSelected) {
                              optionStyle = 'bg-rose-500/15 border-2 border-rose-500 text-rose-800 dark:text-rose-200 line-through';
                              badgeStyle = 'bg-rose-500 text-white';
                            } else {
                              optionStyle = 'opacity-50 border-[var(--border-theme)]';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCardIndex(idx);
                                handleSelectOption(shortItem, optIdx);
                              }}
                              disabled={answerState.isAnswered}
                              className={`w-full p-2 rounded-xl border text-left text-xs font-lato transition-all flex items-start justify-start gap-2 ${
                                !answerState.isAnswered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                              } ${optionStyle}`}
                            >
                              <span className={`w-5 h-5 rounded border flex items-center justify-center font-poppins font-bold text-[10px] shrink-0 mt-0.5 ${badgeStyle}`}>
                                {['A', 'B', 'C', 'D'][optIdx]}
                              </span>
                              <span className="font-semibold leading-snug break-words flex-1 text-left">
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="shrink-0 pt-1.5 border-t border-[var(--border-theme)] flex items-center justify-between relative z-10 gap-1.5 bg-[var(--bg-card)] mt-auto">
                      <div className="text-[10px] font-lato text-[var(--text-muted)] truncate">
                        By <strong className="text-[var(--text-secondary)]">{shortItem.author || 'Question admin'}</strong>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {/* Like Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(shortItem);
                          }}
                          className={`px-2 py-1 rounded-lg border flex items-center space-x-1 text-[10px] transition-all cursor-pointer ${
                            shortItem.isLiked ? 'bg-rose-500/15 border-rose-500 text-rose-600 font-bold' : 'bg-[var(--bg-main)] border-[var(--border-theme)] text-[var(--text-muted)] hover:text-rose-500'
                          }`}
                          title="Like question"
                        >
                          {shortItem.isLiked ? (
                            <svg className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" viewBox="0 0 24 24">
                              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          )}
                          <span className="font-mono">{shortItem.likesCount || 0}</span>
                        </button>

                        {/* Save Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSave(shortItem);
                          }}
                          className={`p-1 rounded-lg border text-[10px] flex items-center justify-center transition-all cursor-pointer ${
                            shortItem.isSaved ? 'bg-amber-500/15 border-amber-500 text-amber-600 font-bold' : 'bg-[var(--bg-main)] border-[var(--border-theme)] text-[var(--text-muted)] hover:text-amber-500'
                          }`}
                          title="Save question"
                        >
                          {shortItem.isSaved ? (
                            <svg className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.58A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                          )}
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareShort(shortItem);
                          }}
                          className="p-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-theme)] text-[var(--text-muted)] hover:text-blue-500 text-[10px] flex items-center justify-center transition-all cursor-pointer"
                          title="Share question"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}

            {isLoadingMore && (
              <div className="w-full h-full min-h-[420px] snap-start snap-always shrink-0 py-1">
                <ShortGyaanSkeleton />
              </div>
            )}
          </div>

          {/* COLUMN 3: CONCEPT DEEP-DIVE PANEL ON MEDIUM & LARGE DEVICES */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 xl:col-span-4 h-full overflow-hidden">
            {isLoading ? (
              <ShortGyaanDetailsSkeleton />
            ) : shorts.length > 0 ? (
              (() => {
                const activeShort = shorts[activeCardIndex] || shorts[0];
                const activeAns = activeShort ? answersState[activeShort._id] : null;

                return (
                  <div className="w-full h-full min-h-0 bg-[var(--bg-card)] border-2 border-[var(--border-theme)] rounded-3xl p-4 shadow-md overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col">
                  {/* <div className="w-full h-full bg-[var(--bg-card)] border-2 border-[var(--border-theme)] rounded-3xl p-4 shadow-md space-y-2.5 overflow-hidden overflow-y-auto custom-scrollbar flex flex-col justify-between"> */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            🧠
                          </div>
                          <div>
                            <h2 className="font-poppins font-bold text-xs text-[var(--text-main)]">Concept Deep-Dive</h2>
                            <div className="text-[9px] font-mono text-[var(--color-primary-600)] font-bold">
                              {activeShort.category || 'Topic'} • Deep Dive
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1.5">
                          {explanationBufferTimer !== null ? (
                            <div
                              onClick={() => setIsBufferPaused((p) => !p)}
                              className="relative flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/15 border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-mono font-black text-[11px] cursor-pointer shadow-xs"
                              title={isBufferPaused ? "Paused — Click to Resume" : "Click to Pause Auto-Next"}
                            >
                              <span>{isBufferPaused ? '⏸' : explanationBufferTimer}</span>
                            </div>
                          ) : !activeAns?.isAnswered ? (
                            <div
                              onClick={() => setIsQuestionTimerPaused((p) => !p)}
                              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full border font-mono font-bold text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xs ${
                                isQuestionTimerPaused
                                  ? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-400 animate-pulse'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              }`}
                              title={isQuestionTimerPaused ? "Timer Paused — Click to Resume" : "Click to Pause Timer"}
                            >
                              <span>{isQuestionTimerPaused ? '⏸ Paused' : `⏱️ ${activeQuestionTimer}s`}</span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Answered
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Live Session Accuracy Tracker Card */}
                      <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1 shadow-xs shrink-0">
                        <div className="flex items-center justify-between text-[11px] font-poppins font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                            <span>🎯</span>
                            <span>Session Accuracy: {accuracyPercentage}%</span>
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] font-normal">
                            ({sessionStats.correct}/{sessionStats.attempted} Attempted)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-medium pt-0.5 border-t border-[var(--border-theme)]">
                          <span>✅ {sessionStats.correct} Correct</span>
                          <span>❌ {sessionStats.incorrect} Wrong</span>
                          <span className="text-slate-500">⚪ {sessionStats.unattempted} Skipped</span>
                        </div>
                      </div>

                      {!activeAns?.isAnswered ? (
                        <div className="p-4 rounded-2xl bg-[var(--bg-main)] border-2 border-dashed border-amber-500/30 text-center space-y-2 animate-fadeIn">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base mx-auto animate-pulse">
                            ⏳
                          </div>
                          <h3 className="font-poppins font-bold text-[11px] text-[var(--text-main)]">
                            Solution & Concept Notes Hidden
                          </h3>
                          <p className="text-[10px] font-lato text-[var(--text-muted)] leading-relaxed">
                            Timer running: <strong className="text-amber-500 font-mono">{isQuestionTimerPaused ? 'Paused' : `${activeQuestionTimer}s remaining`}</strong>. Select an option or wait for countdown to complete to reveal answer & solution breakdown!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 animate-fadeIn">
                          <div className={`p-3 rounded-xl border space-y-1 ${
                            activeAns.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : activeAns.isTimedOut
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-poppins font-bold">
                                {activeAns.isCorrect
                                  ? '🎉 Correct (+10 XP)'
                                  : activeAns.isTimedOut
                                  ? '⏳ Skipped (Timed Out)'
                                  : '❌ Incorrect'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-poppins font-bold text-[9px]">
                                Correct: Option {['A', 'B', 'C', 'D'][activeShort.correctAnswerIndex]}
                              </span>
                            </div>
                            <div className="font-lato font-bold text-xs text-[var(--text-main)]">
                              {activeShort.options[activeShort.correctAnswerIndex]}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1.5">
                            <div className="text-[11px] font-poppins font-bold text-[var(--text-main)] flex items-center space-x-1">
                              <span>💡</span>
                              <span>Technical Explanation</span>
                            </div>
                            <p className="text-xs font-lato text-[var(--text-secondary)] leading-relaxed">
                              {activeShort.explanation}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                            <div className="text-[11px] font-poppins font-bold text-[var(--color-primary-600)] flex items-center space-x-1">
                              <span>⚡</span>
                              <span>Key Concept Insights</span>
                            </div>
                            <ul className="space-y-0.5 text-[10px] font-lato text-[var(--text-secondary)] list-disc list-inside">
                              <li>Core topic in modern {activeShort.category || 'tech'} engineering interviews.</li>
                              <li>Ensures high runtime predictability and clean architecture.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SMALL DEVICES ONLY (< md FULL-SCREEN REEL WIREFRAME LAYOUT)           */}
      {/* ========================================================================= */}
      <div
        ref={(el) => setFeedContainerRef(el, false)}
        className="md:hidden w-full h-[calc(100dvh-4.2rem)] max-w-md sm:max-w-lg mx-auto overflow-y-scroll scroll-smooth snap-y snap-mandatory overscroll-contain space-y-0 px-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-y"
      >
        {isLoading ? (
          <ShortGyaanSkeleton />
        ) : shorts.length === 0 ? (
          typeof navigator !== 'undefined' && !navigator.onLine ? (
            <NetworkErrorPage onNavigate={onNavigateHome} onRetry={() => window.location.reload()} />
          ) : (
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-theme)] text-center space-y-3 shadow-md my-8 max-w-md mx-auto">
              <span className="text-3xl block">📭</span>
              <h3 className="font-poppins font-bold text-sm sm:text-base text-[var(--text-main)]">
                No Questions Found
              </h3>
              <p className="text-[11px] sm:text-xs font-lato text-[var(--text-muted)]">
                {activeCategory === 'Saved'
                  ? 'You have not saved any questions yet. Tap 🔖 on any card to save it.'
                  : `No questions found under "${activeCategory}".`}
              </p>
              <button
                onClick={() => setActiveCategory('All')}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary-600)] text-white font-poppins font-bold text-xs sm:text-sm cursor-pointer"
              >
                Explore All Questions →
              </button>
            </div>
          )
        ) : (
          shorts.map((shortItem, idx) => {
            const sId = shortItem._id;
            const answerState = answersState[sId] || {
              isAnswered: false,
              selectedIndex: null,
              isCorrect: false,
              isTimedOut: false
            };
            const isActive = activeCardIndex === idx;

            return (
              <div
                key={sId}
                ref={(el) => setCardRef(el, idx, false)}
                data-index={idx}
                onClick={() => setActiveCardIndex(idx)}
                className={`w-full h-[calc(100dvh-4.2rem)] max-h-[calc(100dvh-4.2rem)] snap-start snap-always shrink-0 rounded-2xl bg-[var(--bg-card)] border-2 transition-all duration-300 shadow-xl p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  isActive
                    ? 'border-[var(--color-primary-500)] ring-2 ring-blue-500/20 shadow-blue-500/15'
                    : 'border-[var(--border-theme)] opacity-95 hover:border-[var(--color-primary-300)]'
                }`}
              >
                
                {/* 1. TOP HEADER BAR: logo | All Language ⬇ | 10 Timer | ⋮ Overflow Menu */}
                <div className="shrink-0 flex items-center justify-between border-b border-[var(--border-theme)] pb-2 relative z-10 bg-[var(--bg-card)] gap-1.5">
                  
                  {/* Left Logo */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateHome) onNavigateHome();
                      else handleResetAndRefresh();
                    }}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white font-poppins font-black text-xs shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
                    title="Go Home / Refresh"
                  >
                    <span>⚡</span>
                    <span className="font-extrabold tracking-tight">logo</span>
                  </div>

                  {/* Center All Language ⬇ Dropdown */}
                  <div className="relative flex items-center shrink min-w-0" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={activeCategory}
                      onChange={(e) => {
                        setActiveCategory(e.target.value);
                        setPage(1);
                      }}
                      className="appearance-none bg-[var(--bg-main)] border-2 border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs sm:text-sm rounded-xl py-1.5 pl-3 pr-7 cursor-pointer transition-all shadow-xs focus:outline-none truncate"
                      title="Filter Topic / Language"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.shortLabel || cat.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-2.5 text-[10px] text-[var(--text-muted)]">
                      ▼
                    </div>
                  </div>

                  {/* Right Controls: Timer Badge Circle & Overflow Menu ⋮ */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Timer Badge Circle */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!answerState.isAnswered) {
                          setIsQuestionTimerPaused((p) => !p);
                        }
                      }}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 font-mono font-black text-xs sm:text-sm flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                        !answerState.isAnswered && isActive && isQuestionTimerPaused
                          ? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-400 animate-pulse'
                          : 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                      }`}
                      title={!answerState.isAnswered ? (isActive && isQuestionTimerPaused ? "Timer Paused — Click to Resume" : "Click to Pause Timer") : "Answered"}
                    >
                      {!answerState.isAnswered ? (
                        <span>{isActive && isQuestionTimerPaused ? '⏸' : isActive ? activeQuestionTimer : remainingTimes[sId] !== undefined ? remainingTimes[sId] : (shortItem.timerSeconds || 30)}</span>
                      ) : (
                        <span>✓</span>
                      )}
                    </div>

                    {/* Overflow Menu ⋮ Button (Three-Dots Click to Stop Timer & Show Details & Settings) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsQuestionTimerPaused(true);
                        setIsBufferPaused(true);
                        setShowOverflowMenu(true);
                      }}
                      className="w-8 h-8 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-[var(--text-main)] font-bold text-base flex items-center justify-center cursor-pointer hover:border-[var(--color-primary-400)] transition-all shadow-xs"
                      title="Stop Timer & View Details & Settings"
                    >
                      ⋮
                    </button>
                  </div>
                </div>

                {/* 2. MIDDLE CONTENT AREA (Question, Code Snippet, Options OR Solution Layout) */}
                <div className="card-scroll-content flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col justify-start items-stretch space-y-3 relative z-10 my-1 pr-1 text-left">
                  
                  {/* Question Statement Box */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-main)] border-2 border-[var(--border-theme)] shadow-xs text-left">
                    <h2 className="text-base sm:text-lg font-poppins font-bold text-[var(--text-main)] leading-snug break-words">
                      {shortItem.questionText}
                    </h2>
                  </div>

                  {/* Code Snippet Box (Optional) */}
                  {shortItem.codeSnippet && (
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm border border-slate-800 shadow-inner max-h-36 overflow-x-auto text-left">
                      <pre>{shortItem.codeSnippet}</pre>
                    </div>
                  )}

                  {/* OPTIONS LIST (Always rendered, styled according to answer state) */}
                  <div className="space-y-2 sm:space-y-2.5 pt-1 text-left">
                    {shortItem.options.map((opt, optIdx) => {
                      const isSelected = answerState.selectedIndex === optIdx;
                      const isCorrectOption = optIdx === shortItem.correctAnswerIndex;
                      let optionStyle = 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)]';
                      let badgeStyle = 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-theme)]';

                      if (answerState.isAnswered) {
                        if (isCorrectOption) {
                          optionStyle = 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs';
                          badgeStyle = 'bg-emerald-500 text-white font-bold';
                        } else if (isSelected) {
                          optionStyle = 'bg-rose-500/15 border-2 border-rose-500 text-rose-800 dark:text-rose-200 line-through';
                          badgeStyle = 'bg-rose-500 text-white font-bold';
                        } else {
                          optionStyle = 'opacity-60 border-[var(--border-theme)]';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCardIndex(idx);
                            if (!answerState.isAnswered) {
                              handleSelectOption(shortItem, optIdx);
                            }
                          }}
                          disabled={answerState.isAnswered}
                          className={`w-full p-3 sm:p-3.5 rounded-xl border-2 text-left font-lato text-xs sm:text-sm flex items-center justify-start space-x-3 transition-all ${
                            !answerState.isAnswered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                          } ${optionStyle}`}
                        >
                          <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-poppins font-bold text-xs flex items-center justify-center shrink-0 ${badgeStyle}`}>
                            {['A', 'B', 'C', 'D'][optIdx]}
                          </span>
                          <span className="flex-1 break-words leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* RE-EXPAND SOLUTION BUTTON (When solution is dragged down / collapsed) */}
                  {answerState.isAnswered && collapsedSolutions[sId] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCollapsedSolutions((prev) => ({ ...prev, [sId]: false }));
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-poppins font-bold text-xs sm:text-sm shadow-md cursor-pointer hover:opacity-95 active:scale-98 flex items-center justify-center space-x-2 my-2 z-20"
                    >
                      <span>💡 View Solution & Explanation ⬆</span>
                    </button>
                  )}

                </div>

                {/* BOTTOM SOLUTION DRAWER (DRAG DOWN OR TAP ✕ TO DISMISS) */}
                {answerState.isAnswered && !collapsedSolutions[sId] && (
                  <div
                    onTouchStart={(e) => {
                      if (e.touches && e.touches.length > 0) {
                        setSolutionDragStartY(e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (solutionDragStartY !== null && e.touches && e.touches.length > 0) {
                        const deltaY = e.touches[0].clientY - solutionDragStartY;
                        if (deltaY > 35) {
                          setCollapsedSolutions((prev) => ({ ...prev, [sId]: true }));
                          setSolutionDragStartY(null);
                        }
                      }
                    }}
                    onTouchEnd={() => setSolutionDragStartY(null)}
                    className="absolute bottom-[52px] left-0 right-0 z-[9990] bg-[var(--bg-card)] border-t-2 border-x-2 border-[var(--border-theme)] rounded-t-3xl p-3 sm:p-4 shadow-2xl flex flex-col space-y-2.5 max-h-[80%] overflow-y-auto custom-scrollbar"
                  >
                    {/* Top Drag Handle Bar */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setCollapsedSolutions((prev) => ({ ...prev, [sId]: true }));
                      }}
                      className="w-full py-1 flex flex-col items-center justify-center cursor-pointer group shrink-0"
                      title="Drag down or click to hide solution and view options"
                    >
                      <div className="w-12 h-1.5 rounded-full bg-[var(--border-theme)] group-hover:bg-[var(--color-primary-400)] transition-all" />
                      <span className="text-[9px] font-poppins font-semibold text-[var(--text-muted)] mt-0.5">
                        ↓ Drag down to view options
                      </span>
                    </div>

                    {/* Top Row Badges matching shortsGyaanSolutionLayout.png: [ Solution ] | [ Correct ] | [ Answer X ] */}
                    <div className="flex items-center justify-between gap-1.5 pt-0.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-poppins font-bold text-[10px] sm:text-xs">
                        Solution
                      </span>
                      <span className={`px-2.5 py-1 rounded-xl border font-poppins font-bold text-[10px] sm:text-xs ${
                        answerState.isCorrect
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : answerState.isTimedOut
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                      }`}>
                        {answerState.isCorrect ? 'Correct' : answerState.isTimedOut ? 'Skipped (Timed Out)' : 'Incorrect'}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-poppins font-bold text-[10px] sm:text-xs truncate max-w-[120px]">
                        Answer {shortItem.correctAnswerIndex + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollapsedSolutions((prev) => ({ ...prev, [sId]: true }));
                        }}
                        className="w-6 h-6 rounded-full bg-[var(--bg-main)] text-[var(--text-muted)] font-bold text-xs flex items-center justify-center cursor-pointer hover:text-[var(--text-main)] shrink-0"
                        title="Hide solution to see options"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Upper Sub-Box: Correct Option Text */}
                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border-2 border-[var(--border-theme)] shadow-xs text-left">
                      <div className="text-[10px] font-poppins font-bold text-[var(--text-muted)] mb-1">
                        Correct Option Text:
                      </div>
                      <div className="font-lato font-bold text-xs sm:text-sm text-[var(--text-main)] leading-snug">
                        {shortItem.options[shortItem.correctAnswerIndex]}
                      </div>
                    </div>

                    {/* Lower Sub-Box: Explanation Container */}
                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border-2 border-[var(--border-theme)] space-y-1.5 shadow-xs text-left">
                      <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-1">
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-poppins font-bold text-[10px]">
                          Explanation
                        </span>
                        {explanationBufferTimer !== null && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsBufferPaused((p) => !p);
                            }}
                            className="text-[10px] font-mono font-bold text-blue-500 hover:underline cursor-pointer"
                          >
                            {isBufferPaused ? '▶ Resume Auto-Next' : `⏸ Pause (${explanationBufferTimer}s)`}
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-lato text-[var(--text-main)] leading-relaxed break-words pt-1">
                        {shortItem.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. BOTTOM STICKY NAVIGATION BAR: by Question admin | 🏠 | ❤️ 🔖 ↗️ */}
                <div className="shrink-0 py-1.5 px-2.5 rounded-xl bg-[var(--bg-main)] border-2 border-[var(--border-theme)] flex items-center justify-between relative z-[99999] shadow-lg mt-1">
                  {/* Left: by Question admin */}
                  <div className="text-[11px] sm:text-xs font-lato text-[var(--text-muted)] truncate max-w-[120px] sm:max-w-[150px]">
                    by <strong className="text-[var(--text-main)]">{shortItem.author || 'Question admin'}</strong>
                  </div>

                  {/* Center: Floating Home Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateHome) {
                        onNavigateHome();
                      } else {
                        setActiveCardIndex(0);
                      }
                    }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all border-2 border-white dark:border-slate-800 shrink-0"
                    title="Navigate Home"
                  >
                    <svg
                      className="w-8 h-8 sm:w-12 sm:h-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                      />
                    </svg>
                  </div>

                  {/* Right: Action Buttons (Like, Save, Share) */}
                  <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                    {/* Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(shortItem);
                      }}
                      className={`px-2 py-1.5 rounded-xl border flex items-center space-x-1 text-xs transition-all cursor-pointer ${
                        shortItem.isLiked
                          ? 'bg-rose-500/15 border-rose-500 text-rose-600 font-bold'
                          : 'bg-[var(--bg-card)] border-[var(--border-theme)] text-[var(--text-muted)] hover:text-rose-500'
                      }`}
                      title="Like question"
                    >
                      {shortItem.isLiked ? (
                        <svg className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" viewBox="0 0 24 24">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                      )}
                      <span className="font-mono text-[10px]">{shortItem.likesCount || 0}</span>
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSave(shortItem);
                      }}
                      className={`p-1.5 rounded-xl border flex items-center justify-center text-xs transition-all cursor-pointer ${
                        shortItem.isSaved
                          ? 'bg-amber-500/15 border-amber-500 text-amber-600 font-bold'
                          : 'bg-[var(--bg-card)] border-[var(--border-theme)] text-[var(--text-muted)] hover:text-amber-500'
                      }`}
                      title="Save question"
                    >
                      {shortItem.isSaved ? (
                        <svg className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.58A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                      )}
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareShort(shortItem);
                      }}
                      className="p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] text-[var(--text-muted)] hover:text-blue-500 text-xs transition-all cursor-pointer flex items-center justify-center"
                      title="Share question"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}

        {isLoadingMore && (
          <div className="w-full h-full min-h-[420px] snap-start snap-always shrink-0 py-1 max-w-lg mx-auto">
            <ShortGyaanSkeleton />
          </div>
        )}

      </div>

      {/* OVERFLOW MENU MODAL / POPOVER (toggled via ⋮ button - STOP TIMER & SHOW DETAILS & SETTINGS) */}
      {showOverflowMenu && (
        <div
          onClick={() => setShowOverflowMenu(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[var(--bg-card)] border-2 border-[var(--border-theme)] rounded-3xl p-5 shadow-2xl space-y-4 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2.5">
              <h3 className="font-poppins font-bold text-sm text-[var(--text-main)] flex items-center space-x-1.5">
                <span>⚙️</span>
                <span>Details & Settings</span>
              </h3>
              <button
                onClick={() => setShowOverflowMenu(false)}
                className="w-7 h-7 rounded-xl bg-[var(--bg-main)] text-[var(--text-muted)] font-bold text-xs flex items-center justify-center cursor-pointer hover:text-[var(--text-main)]"
              >
                ✕
              </button>
            </div>

            {/* Current Question Details Card */}
            {shorts[activeCardIndex] && (
              <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-poppins font-bold text-[var(--text-main)]">
                  <span className="flex items-center space-x-1">
                    <span>📌 Topic:</span>
                    <span className="text-[var(--color-primary-600)]">{shorts[activeCardIndex].category || 'JavaScript'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                    ⏸ Timer Stopped
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-lato text-[var(--text-muted)] pt-1 border-t border-[var(--border-theme)]">
                  <span>Author: {shorts[activeCardIndex].author || 'Question admin'}</span>
                  <span>Time left: {activeQuestionTimer}s</span>
                </div>
              </div>
            )}

            {/* Search Topics Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-poppins font-semibold text-[var(--text-muted)]">Search Topics</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (closures, hooks)..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-poppins text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary-500)]"
              />
            </div>

            {/* Session Stats Accuracy Details */}
            <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-poppins font-bold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <span>🎯</span>
                  <span>Session Accuracy</span>
                </span>
                <span className="font-mono text-sm font-extrabold">{accuracyPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium pt-1 border-t border-[var(--border-theme)]">
                <span>✅ {sessionStats.correct} Correct</span>
                <span>❌ {sessionStats.incorrect} Wrong</span>
                <span>⚪ {sessionStats.unattempted} Skipped</span>
              </div>
            </div>

            {/* Settings & Controls Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setIsQuestionTimerPaused((p) => !p);
                  setIsBufferPaused((p) => !p);
                }}
                className={`p-2.5 rounded-xl border text-xs font-poppins font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                  isQuestionTimerPaused
                    ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                    : 'bg-[var(--bg-main)] border-[var(--border-theme)] text-[var(--text-main)]'
                }`}
              >
                <span>{isQuestionTimerPaused ? '▶' : '⏸'}</span>
                <span>{isQuestionTimerPaused ? 'Resume Timer' : 'Pause Timer'}</span>
              </button>

              <button
                onClick={() => setSoundEnabled((p) => !p)}
                className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-poppins font-semibold text-[var(--text-main)] flex items-center justify-center space-x-1.5 cursor-pointer hover:border-[var(--color-primary-400)]"
              >
                <span>{soundEnabled ? '🔊' : '🔇'}</span>
                <span>{soundEnabled ? 'Sound On' : 'Sound Muted'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowOverflowMenu(false);
                setIsQuestionTimerPaused(false);
                handleResetAndRefresh();
              }}
              className="w-full py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-poppins font-semibold text-[var(--text-main)] hover:border-[var(--color-primary-400)] cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>🔄</span>
              <span>Reset Feed & Restart Session</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  setIsAdminModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-poppins font-bold text-xs shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>📤 Admin Bulk Excel Upload</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. ADMIN EXCEL BULK UPLOAD & QUESTION CREATOR MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn my-auto max-h-[94vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-theme)] flex items-center justify-between bg-[var(--bg-main)] shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📤</span>
                <div>
                  <h3 className="font-poppins font-bold text-base text-[var(--text-main)]">
                    Admin Short Gyaan Manager
                  </h3>
                  <p className="text-[11px] font-lato text-[var(--text-muted)]">
                    Upload bulk questions via Excel/CSV or add individual micro-questions
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-theme)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 pt-3 border-b border-[var(--border-theme)] flex space-x-3 bg-[var(--bg-card)]">
              <button
                onClick={() => setAdminModalTab('upload')}
                className={`pb-2.5 font-poppins font-bold text-xs transition-all cursor-pointer ${
                  adminModalTab === 'upload'
                    ? 'border-b-2 border-[var(--color-primary-600)] text-[var(--color-primary-600)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                📊 Bulk Excel / CSV Upload
              </button>
              <button
                onClick={() => setAdminModalTab('single')}
                className={`pb-2.5 font-poppins font-bold text-xs transition-all cursor-pointer ${
                  adminModalTab === 'single'
                    ? 'border-b-2 border-[var(--color-primary-600)] text-[var(--color-primary-600)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                ✏️ Create Single Question
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              
              {/* TAB 1: BULK EXCEL UPLOAD */}
              {adminModalTab === 'upload' && (
                <div className="space-y-4">
                  
                  {/* Template Downloader Banner */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-poppins font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center space-x-1.5">
                        <span>📑</span>
                        <span>Excel Template Format Guide</span>
                      </div>
                      <p className="text-[11px] font-lato text-[var(--text-muted)]">
                        Required Columns: <code>Question</code>, <code>Option A</code>, <code>Option B</code>, <code>Option C</code>, <code>Option D</code>, <code>Correct Answer</code>, <code>Explanation</code>, <code>Category</code>, <code>Timer</code>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadSampleTemplate('xlsx')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-poppins font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                      >
                        <span>📥 Excel (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSampleTemplate('csv')}
                        className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                      >
                        <span>📄 CSV (.csv)</span>
                      </button>
                    </div>
                  </div>

                  {/* File Upload Drop Zone */}
                  <div className="border-2 border-dashed border-[var(--border-theme)] hover:border-[var(--color-primary-400)] rounded-3xl p-6 text-center space-y-3 bg-[var(--bg-main)] transition-colors">
                    <span className="text-3xl block">📊</span>
                    <div className="space-y-1">
                      <label className="font-poppins font-bold text-xs text-[var(--color-primary-600)] hover:underline cursor-pointer">
                        <span>Click to choose Excel file</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] font-lato text-[var(--text-muted)]">
                        Supports .xlsx, .xls, and .csv files
                      </p>
                    </div>

                    {excelFile && (
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-primary-400)] text-xs font-mono font-bold text-[var(--text-main)]">
                        <span>📄</span>
                        <span>{excelFile.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">({(excelFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>

                  {/* Preview Table */}
                  {parsedPreviewRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-poppins font-bold text-xs text-[var(--text-main)] flex items-center justify-between">
                        <span>Preview ({parsedPreviewRows.length} Questions detected):</span>
                        <span className="text-emerald-500 text-[11px]">✓ Valid file structure</span>
                      </div>

                      <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border-theme)] text-xs font-lato divide-y divide-[var(--border-theme)]">
                        {parsedPreviewRows.slice(0, 5).map((row, rIdx) => (
                          <div key={rIdx} className="p-2.5 space-y-1 bg-[var(--bg-main)]">
                            <div className="font-bold text-[var(--text-main)]">
                              #{rIdx + 1}: {row.Question || row.question || Object.values(row)[0]}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap gap-2">
                              <span>A: {row['Option A'] || row.OptionA || row.A}</span>
                              <span>B: {row['Option B'] || row.OptionB || row.B}</span>
                              <span>Ans: <strong>{row['Correct Answer'] || row.Answer}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleUploadExcelSubmit}
                      disabled={!excelFile || isUploadingExcel}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-poppins font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isUploadingExcel ? '⏳ Uploading and Parsing Questions...' : `🚀 Publish ${parsedPreviewRows.length || ''} Questions to Short Gyaan`}
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 2: SINGLE QUESTION CREATOR */}
              {adminModalTab === 'single' && (
                <form onSubmit={handleCreateSingleShort} className="space-y-4 text-xs font-poppins">
                  
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--text-main)] block">Question Statement *</label>
                    <textarea
                      rows={2}
                      value={singleForm.questionText}
                      onChange={(e) => setSingleForm({ ...singleForm, questionText: e.target.value })}
                      placeholder="e.g. What will typeof NaN evaluate to in JavaScript?"
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--text-main)] block">Code Snippet (Optional)</label>
                    <textarea
                      rows={2}
                      value={singleForm.codeSnippet}
                      onChange={(e) => setSingleForm({ ...singleForm, codeSnippet: e.target.value })}
                      placeholder="console.log(typeof NaN);"
                      className="w-full p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--text-muted)] block">Option A *</label>
                      <input
                        type="text"
                        value={singleForm.optionA}
                        onChange={(e) => setSingleForm({ ...singleForm, optionA: e.target.value })}
                        placeholder="Option A..."
                        className="w-full p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--text-muted)] block">Option B *</label>
                      <input
                        type="text"
                        value={singleForm.optionB}
                        onChange={(e) => setSingleForm({ ...singleForm, optionB: e.target.value })}
                        placeholder="Option B..."
                        className="w-full p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--text-muted)] block">Option C</label>
                      <input
                        type="text"
                        value={singleForm.optionC}
                        onChange={(e) => setSingleForm({ ...singleForm, optionC: e.target.value })}
                        placeholder="Option C..."
                        className="w-full p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--text-muted)] block">Option D</label>
                      <input
                        type="text"
                        value={singleForm.optionD}
                        onChange={(e) => setSingleForm({ ...singleForm, optionD: e.target.value })}
                        placeholder="Option D..."
                        className="w-full p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">Correct Option *</label>
                      <select
                        value={singleForm.correctAnswerIndex}
                        onChange={(e) => setSingleForm({ ...singleForm, correctAnswerIndex: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">Category</label>
                      <select
                        value={singleForm.category}
                        onChange={(e) => setSingleForm({ ...singleForm, category: e.target.value })}
                        className="w-full p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs"
                      >
                        <option value="JavaScript">JavaScript</option>
                        <option value="React">React</option>
                        <option value="DSA / Algo">DSA / Algo</option>
                        <option value="System Design">System Design</option>
                        <option value="Python">Python</option>
                        <option value="CSS & UI">CSS & UI</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">Timer Limit</label>
                      <select
                        value={singleForm.timerSeconds}
                        onChange={(e) => setSingleForm({ ...singleForm, timerSeconds: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs"
                      >
                        <option value={30}>30 Seconds</option>
                        <option value={60}>60 Seconds</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--text-main)] block">Explanation (Solution Reasoning) *</label>
                    <textarea
                      rows={3}
                      value={singleForm.explanation}
                      onChange={(e) => setSingleForm({ ...singleForm, explanation: e.target.value })}
                      placeholder="Explain why the answer is correct so learners gain deep insight..."
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    + Add Question to Short Gyaan
                  </button>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 5. SESSION ACCURACY RESUME / RESET MODAL PROMPT */}
      {showSessionPromptModal && savedSessionStats && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--bg-card)] border-2 border-[var(--color-primary-400)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp p-6 space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/20">
              ⚡
            </div>

            <div className="space-y-2">
              <h2 className="font-poppins font-black text-xl text-[var(--text-main)]">
                Resume Previous Session?
              </h2>
              <p className="text-xs font-lato text-[var(--text-secondary)] leading-relaxed">
                You have active performance recorded from your last session. Would you like to keep your accuracy score or reset everything fresh?
              </p>
            </div>

            {/* Performance Stats Snapshot */}
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-2 text-left">
              <div className="flex items-center justify-between font-poppins font-bold text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <span>🎯</span>
                  <span>Previous Accuracy: {savedSessionStats.accuracy}%</span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">
                  {savedSessionStats.stats.correct}/{savedSessionStats.stats.attempted} Correct
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)] pt-1.5 border-t border-[var(--border-theme)]">
                <span>✅ {savedSessionStats.stats.correct} Correct</span>
                <span>❌ {savedSessionStats.stats.incorrect} Wrong</span>
                <span className="text-slate-500">⚪ {savedSessionStats.stats.unattempted} Skipped</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleKeepSessionAccuracy}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-poppins font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 cursor-pointer transition-all active:scale-98 flex items-center justify-center space-x-2"
              >
                <span>Keep Previous Accuracy ({savedSessionStats.accuracy}%)</span>
              </button>
              <button
                onClick={handleResetSessionAccuracy}
                className="w-full py-2.5 px-5 rounded-2xl bg-[var(--bg-main)] border-2 border-[var(--border-theme)] hover:border-rose-400 hover:text-rose-500 text-[var(--text-main)] font-poppins font-bold text-xs cursor-pointer transition-all active:scale-98 flex items-center justify-center space-x-1.5"
              >
                <span>Reset Accuracy & Start Fresh (0%)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ShortGyaanPage;
