import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { downloadShortsGyaanTemplate } from '../utils/excelTemplateUtils';
import {
  apiGetShortsGyaan,
  apiToggleLikeShort,
  apiToggleSaveShort,
  apiAdminUploadExcelShorts,
  apiAdminCreateShort,
  apiAdminDeleteShort
} from '../services/api';

const CATEGORIES = [
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
  { id: 'Saved', label: '🔖 Saved Gyaan', shortLabel: 'Saved', icon: '🔖', tag: 'Bookmarks' }
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

export const ShortGyaanPage = ({ onRequireAuth }) => {
  const { user, isAdmin, isAuthenticated, login } = useAuth();
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

  // 15-second post-answer buffer countdown
  const [explanationBufferTimer, setExplanationBufferTimer] = useState(null);
  const [isBufferPaused, setIsBufferPaused] = useState(false);

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
            setSavedSessionStats({
              answers: parsed,
              stats,
              accuracy: stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0
            });
            setShowSessionPromptModal(true);
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
    addToast('🎯 Previous session accuracy preserved!', 'success');
  };

  const handleResetSessionAccuracy = () => {
    setAnswersState({});
    setRemainingTimes({});
    sessionStorage.removeItem('shorts_gyaan_answers_state');
    sessionStorage.removeItem('shorts_gyaan_active_step');
    setActiveCardIndex(0);
    setShowSessionPromptModal(false);
    addToast('🔄 Session accuracy reset! Starting fresh at 0%.', 'info');
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

  // DOM Container & Card Refs for Discrete Step-Scrolling
  const feedContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const observerRef = useRef(null);
  const isStepScrollingRef = useRef(false);
  const touchStartY = useRef(null);

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
    } catch (e) {
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
      addToast('Loaded offline Short Gyaan cards', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, addToast]);

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
    await fetchInitialShorts();
    addToast('🔄 Short Gyaan reset! Fresh questions & randomized options ready.', 'success');
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

  // -------------------------------------------------------------
  // 3. STEP NAVIGATION FUNCTIONS (Scroll Exactly 1 Card at a Time)
  // -------------------------------------------------------------
  const scrollCooldownTimerRef = useRef(null);

  const scrollToStepIndex = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= shorts.length) return;
    const targetCard = cardRefs.current[targetIndex];
    const container = feedContainerRef.current;
    if (targetCard && container) {
      isStepScrollingRef.current = true;
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveCardIndex(targetIndex);
      playSoundEffect('step');
      setExplanationBufferTimer(null);
      setIsBufferPaused(false);

      if (targetIndex >= shorts.length - 3) {
        loadMoreShorts();
      }

      if (scrollCooldownTimerRef.current) clearTimeout(scrollCooldownTimerRef.current);
      scrollCooldownTimerRef.current = setTimeout(() => {
        isStepScrollingRef.current = false;
      }, 550);
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
    }
  }, [activeCardIndex, scrollToStepIndex]);

  // -------------------------------------------------------------
  // 4. WHEEL & TOUCH STEP-BY-STEP SCROLL INTERCEPTION
  // -------------------------------------------------------------
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    let wheelAccumulator = 0;
    let wheelTimeout = null;

    // Intercept mouse wheel & trackpad to step strictly 1 question card at a time,
    // WHILE allowing natural scrolling inside a card's inner content if overflowed!
    const handleWheelStep = (e) => {
      if (isAdminModalOpen) return;

      // Check if mouse is hovering over an inner scrollable card content box
      const scrollableInner = e.target.closest('.card-scroll-content');
      if (scrollableInner) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableInner;
        const hasOverflow = scrollHeight > clientHeight + 2;

        if (hasOverflow) {
          const delta = e.deltaY;
          // Scrolling down and not yet at bottom of inner card content -> allow inner scroll
          if (delta > 0 && scrollTop + clientHeight < scrollHeight - 3) {
            return;
          }
          // Scrolling up and not yet at top of inner card content -> allow inner scroll
          if (delta < 0 && scrollTop > 3) {
            return;
          }
        }
      }

      e.preventDefault();

      if (isStepScrollingRef.current) return;

      wheelAccumulator += e.deltaY;

      if (wheelTimeout) clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        wheelAccumulator = 0;
      }, 150);

      if (Math.abs(wheelAccumulator) >= 20) {
        const moveDown = wheelAccumulator > 0;
        wheelAccumulator = 0;

        if (moveDown) {
          scrollToNextCard();
        } else {
          scrollToPrevCard();
        }
      }
    };

    container.addEventListener('wheel', handleWheelStep, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelStep);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [scrollToNextCard, scrollToPrevCard, isAdminModalOpen]);

  // Touch Swipe Steps (Strictly 1 question at a time, allowing inner card scrolling if overflowed)
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const scrollableInner = e.target.closest('.card-scroll-content');
    if (scrollableInner) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableInner;
      if (scrollHeight > clientHeight + 2) {
        // Inner card is scrollable, allow natural finger drag
        return;
      }
    }
    if (isStepScrollingRef.current && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartY.current || isStepScrollingRef.current) {
      touchStartY.current = null;
      return;
    }
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    // If swiping inside an inner scrollable card content box that is not at its limit, don't flip card
    const scrollableInner = e.target.closest('.card-scroll-content');
    if (scrollableInner) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableInner;
      if (scrollHeight > clientHeight + 2) {
        if (diff > 0 && scrollTop + clientHeight < scrollHeight - 8) {
          touchStartY.current = null;
          return;
        }
        if (diff < 0 && scrollTop > 8) {
          touchStartY.current = null;
          return;
        }
      }
    }

    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        scrollToNextCard(); // Swipe Up -> Next Question
      } else {
        scrollToPrevCard(); // Swipe Down -> Prev Question
      }
    }
    touchStartY.current = null;
  };

  // Keyboard navigation (Arrow Up, Arrow Down, J, K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAdminModalOpen || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToNextCard();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToPrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToNextCard, scrollToPrevCard, isAdminModalOpen]);

  // -------------------------------------------------------------
  // 5. INTERSECTION OBSERVER (Keeps Active Index Synced on Free Drag)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!feedContainerRef.current || shorts.length === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: feedContainerRef.current,
      rootMargin: '0px',
      threshold: 0.6
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index) && index !== activeCardIndex) {
            setActiveCardIndex(index);

            if (index >= shorts.length - 3) {
              loadMoreShorts();
            }
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
  }, [shorts, activeCardIndex, loadMoreShorts]);

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
  // - When user scrolls away (to previous or next question) or switches browser tabs:
  //   Timer for that question immediately stops/pauses and preserves remaining seconds.
  // - When user returns / tab becomes visible, timer resumes where left off.
  // - Moving to next question without answering does NOT count as an attempt.
  useEffect(() => {
    if (!activeShort || currentAnswerState.isAnswered || !isTabActive) return;

    const sId = currentShortId;
    const initialTime = remainingTimes[sId] !== undefined ? remainingTimes[sId] : (activeShort.timerSeconds || 30);
    setActiveQuestionTimer(initialTime);
    setExplanationBufferTimer(null);
    setIsBufferPaused(false);

    if (initialTime <= 0) {
      handleQuestionTimeout(sId);
      return;
    }

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

    return () => clearInterval(timer);
  }, [activeCardIndex, activeShort?._id, currentAnswerState.isAnswered, isTabActive]);

  const handleQuestionTimeout = (shortId) => {
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
    addToast('⏰ Time’s up! Marked as Not Attempted (Accuracy preserved).', 'info');
    setExplanationBufferTimer(10);
  };

  // -------------------------------------------------------------
  // 7. 10-SECOND EXPLANATION AUTO-STEP BUFFER
  // -------------------------------------------------------------
  // Freezes when browser tab is inactive / blurred so it does NOT move ahead in background.
  useEffect(() => {
    if (explanationBufferTimer === null || isBufferPaused || !isTabActive) return;

    if (explanationBufferTimer <= 0) {
      scrollToNextCard();
      setExplanationBufferTimer(null);
      return;
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
      addToast('🎉 Spot On! Correct Answer (+10 XP) ⚡', 'success');
    } else {
      playSoundEffect('wrong');
      addToast('❌ Incorrect! Correct solution revealed.', 'error');
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
    const shareText = `🧠 Short Gyaan: ${shortItem.questionText}\n\nCan you solve it? Check it out on Quiz Platform! ⚡`;
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
      <div className="w-full max-w-4xl mx-auto py-8 sm:py-14 px-4 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2.5 max-w-xl mx-auto">
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
        <div className="p-6 sm:p-10 rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--color-primary-400)] shadow-2xl space-y-6 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/20 animate-bounce">
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

            <button
              onClick={async () => {
                if (login) {
                  await login('user@quizplatform.com', 'user123');
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-poppins font-bold text-xs cursor-pointer transition-all flex items-center justify-center space-x-1.5"
            >
              <span>⚡</span>
              <span>1-Click Demo Student Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center h-full max-h-full overflow-hidden select-none w-full max-w-full no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* 1. TOP STICKY BAR: CATEGORY PILLS & STEP PROGRESS (FULL WIDTH & LEFT ALIGNED) */}
      <div className="w-full max-w-full px-3 sm:px-4 py-2 space-y-2 shrink-0 bg-[var(--bg-main)]/95 backdrop-blur-md z-20 border-b border-[var(--border-theme)] shadow-xs">
        
        <div className="flex items-center justify-between gap-2">
          {/* Header Title with Live Accuracy Badge */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 shrink-0">
              ⚡
            </div>
            <div className="hidden xs:block sm:block shrink-0">
              <h1 className="font-poppins font-black text-xs sm:text-base text-[var(--text-main)] leading-none flex items-center space-x-1.5">
                <span>Shorts</span>
              </h1>
            </div>

            {/* Live Accuracy & Stats Pill (Visible across Phones, MD Tablets, and Desktop) */}
            {(sessionStats.attempted > 0 || sessionStats.unattempted > 0) && (
              <div className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-theme)] text-[10px] sm:text-[11px] font-poppins shadow-xs shrink-0">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5">
                  <span>🎯</span>
                  <span>{accuracyPercentage}%</span>
                  <span className="hidden sm:inline ml-0.5 font-semibold">Acc</span>
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-[var(--text-secondary)] font-medium">
                  {sessionStats.correct}/{sessionStats.attempted}
                  <span className="hidden md:inline ml-0.5 text-[10px]">Correct</span>
                </span>
                {sessionStats.unattempted > 0 && (
                  <>
                    <span className="hidden md:inline text-[var(--text-muted)]">•</span>
                    <span className="hidden md:inline text-slate-500 dark:text-slate-400 font-medium">
                      {sessionStats.unattempted} Skipped
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Controls: Search, Speaker, Languages Dropdown, Admin */}
          <div className="flex items-center space-x-2">
            {/* Search Toggle */}
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

            {/* Speaker / Sound Toggle */}
            <button
              onClick={() => setSoundEnabled((p) => !p)}
              className="p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs cursor-pointer hover:border-[var(--color-primary-400)] transition-all shadow-sm text-[var(--text-main)]"
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
            </button>

            {/* Languages Dropdown (Right to Search and Speaker) */}
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

        {/* Search Input Bar */}
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

      {/* MOBILE & TABLET HORIZONTAL TOPIC TAGS BAR */}
      <div className="lg:hidden w-full px-2 sm:px-3 pt-1 shrink-0">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-poppins font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center space-x-1 border ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[var(--color-primary-600)] to-blue-600 text-white border-[var(--color-primary-600)] shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-theme)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.shortLabel || cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE & MD SCREEN SESSION ACCURACY CARD (Exact Replica of Concept Deep-Dive Accuracy Card) */}
      <div className="lg:hidden w-full px-2 sm:px-3 pt-1 shrink-0">
        <div className="p-2.5 sm:p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] space-y-1.5 shadow-xs text-left">
          <div className="flex items-center justify-between text-xs sm:text-sm md:text-base font-poppins font-bold">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
              <span>🎯</span>
              <span>Session Accuracy: {accuracyPercentage}%</span>
            </span>
            <span className="text-[11px] sm:text-xs md:text-sm text-[var(--text-muted)] font-normal">
              ({sessionStats.correct}/{sessionStats.attempted} Attempted)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm md:text-base text-[var(--text-secondary)] font-medium pt-1 border-t border-[var(--border-theme)]">
            <span>✅ {sessionStats.correct} Correct</span>
            <span>❌ {sessionStats.incorrect} Wrong</span>
            <span className="text-slate-500">⚪ {sessionStats.unattempted} Skipped</span>
          </div>
        </div>
      </div>

      {/* 2. SPLIT 3-COLUMN MAIN WRAPPER (TAGS SIDEBAR ON LEFT, FEED IN MIDDLE, DETAILS ON RIGHT FOR LG) */}
      <div className="w-full max-w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 px-2 sm:px-3 overflow-hidden min-h-0 py-1 sm:py-1.5">
        
        {/* COLUMN 1: TOPIC & TAGS FILTER SIDEBAR (lg:col-span-3 xl:col-span-2.5) */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-2.5 h-full overflow-hidden flex-col bg-[var(--bg-card)] border-2 border-[var(--border-theme)] rounded-2xl p-2.5 space-y-2 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2 px-1 shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm">🏷️</span>
              <span className="font-poppins font-bold text-xs text-[var(--text-main)]">
                Topic Tags
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[var(--color-primary-600)] bg-[var(--color-primary-50)] dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-[var(--color-primary-200)] dark:border-blue-900">
              {CATEGORIES.length} Tags
            </span>
          </div>

          {/* Tags List */}
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
                    isSelected
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-theme)]'
                  }`}>
                    {cat.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Active Filter Reset */}
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

        {/* COLUMN 2: QUESTIONS FEED (lg:col-span-5 xl:col-span-5.5) */}
        <div
          ref={feedContainerRef}
          className="lg:col-span-5 xl:col-span-5.5 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory space-y-0 px-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading ? (
            <div className="h-full min-h-[400px] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-theme)] flex flex-col items-center justify-center space-y-3 shadow-md animate-pulse">
              <span className="text-3xl animate-bounce">⚡</span>
              <div className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-muted)]">
                Loading Short Gyaan Questions...
              </div>
            </div>
          ) : shorts.length === 0 ? (
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-theme)] text-center space-y-3 shadow-md my-8 max-w-md mx-auto">
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
                  ref={(el) => (cardRefs.current[idx] = el)}
                  data-index={idx}
                  onClick={() => setActiveCardIndex(idx)}
                  className={`w-full h-full min-h-full max-h-full snap-start snap-always rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border-2 transition-all duration-300 shadow-md p-3 sm:p-4 md:p-3.5 lg:p-2.5 xl:p-3.5 flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                    isActive
                      ? 'border-[var(--color-primary-500)] ring-2 ring-blue-500/20 shadow-blue-500/15'
                      : 'border-[var(--border-theme)] opacity-95 hover:border-[var(--color-primary-300)]'
                  }`}
                >
                  
                  {/* TOP HEADER: CATEGORY & TIMER (STATIC TOP) */}
                  <div className="shrink-0 flex items-center justify-between border-b border-[var(--border-theme)] pb-1.5 sm:pb-2 md:pb-1.5 lg:pb-1 relative z-10 bg-[var(--bg-card)]">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 md:px-2.5 md:py-0.5 lg:px-2 lg:py-0.5 rounded-lg text-xs sm:text-sm md:text-xs lg:text-[11px] font-poppins font-bold bg-[var(--color-primary-50)] dark:bg-blue-950/60 text-[var(--color-primary-600)] border border-[var(--color-primary-200)] dark:border-blue-800">
                        {shortItem.category || 'JavaScript'}
                      </span>
                      {isActive && (
                        <span className="hidden sm:inline-block text-[9px] sm:text-[10px] md:text-[9px] lg:text-[8px] font-poppins font-extrabold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Question Status / Timer Badge */}
                    {!answerState.isAnswered ? (
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 sm:px-3 sm:py-1 md:px-2.5 md:py-0.5 lg:px-2 lg:py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs sm:text-sm md:text-xs lg:text-[11px]">
                        <span className={isActive && isTabActive ? 'animate-pulse' : 'opacity-70'}>⏱️</span>
                        <span>
                          {isActive
                            ? `${activeQuestionTimer}s${!isTabActive ? ' (Paused)' : ''}`
                            : remainingTimes[shortItem._id] !== undefined
                            ? `${remainingTimes[shortItem._id]}s (Paused)`
                            : `${shortItem.timerSeconds || 30}s`}
                        </span>
                      </div>
                    ) : answerState.selectedIndex === null || answerState.selectedIndex === undefined ? (
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 sm:px-3 sm:py-1 md:px-2 md:py-0.5 lg:px-2 lg:py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-600 dark:text-slate-400 font-poppins font-bold text-[10px] sm:text-xs md:text-[10px] lg:text-[9px]">
                        <span>⚪ Not Attempted</span>
                      </div>
                    ) : answerState.isCorrect ? (
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 sm:px-3 sm:py-1 md:px-2 md:py-0.5 lg:px-2 lg:py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-poppins font-bold text-[10px] sm:text-xs md:text-[10px] lg:text-[9px]">
                        <span>✓ Correct (+10 XP)</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 sm:px-3 sm:py-1 md:px-2 md:py-0.5 lg:px-2 lg:py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-poppins font-bold text-[10px] sm:text-xs md:text-[10px] lg:text-[9px]">
                        <span>✗ Incorrect</span>
                      </div>
                    )}
                  </div>

                  {/* MIDDLE CONTENT: FLEX FROM START, SCROLLS INDEPENDENTLY ON OVERFLOW */}
                  <div className="card-scroll-content flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col justify-start items-stretch space-y-2 sm:space-y-2.5 md:space-y-2 lg:space-y-1.5 relative z-10 my-1 sm:my-1.5 lg:my-1 pr-1 text-left">
                    
                    {/* Question Statement */}
                    <h2 className="text-base sm:text-lg md:text-base lg:text-xs xl:text-sm font-bold font-poppins text-[var(--text-main)] leading-snug sm:leading-normal lg:leading-snug break-words text-left">
                      {shortItem.questionText}
                    </h2>

                    {/* Code Snippet (Optional) */}
                    {shortItem.codeSnippet && (
                      <div className="p-2.5 sm:p-3.5 md:p-2 lg:p-1.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm md:text-xs lg:text-[10px] xl:text-[11px] overflow-x-auto border border-slate-800 shadow-inner max-h-32 sm:max-h-40 md:max-h-24 lg:max-h-20 text-left">
                        <pre>{shortItem.codeSnippet}</pre>
                      </div>
                    )}

                    {/* 4 MULTIPLE CHOICE OPTIONS (TEXT WRAPS NATURALLY WITH MULTI-LINE SUPPORT, FLEX FROM START) */}
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-1.5 lg:space-y-1 pt-0.5 lg:pt-0 text-left">
                      {shortItem.options.map((opt, optIdx) => {
                        const isSelected = answerState.selectedIndex === optIdx;
                        const isCorrectOption = optIdx === shortItem.correctAnswerIndex;
                        const optionLetter = ['A', 'B', 'C', 'D'][optIdx];

                        let optionStyle = 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)]';
                        let badgeStyle = 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-theme)]';
                        let icon = null;

                        // Only show correct/wrong feedback AFTER the question has been answered or timer has run out
                        if (answerState.isAnswered) {
                          if (isCorrectOption) {
                            optionStyle = 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm shadow-emerald-500/10';
                            badgeStyle = 'bg-emerald-500 text-white border-emerald-600';
                            icon = '✓';
                          } else if (isSelected && !isCorrectOption) {
                            optionStyle = 'bg-rose-500/15 border-2 border-rose-500 text-rose-800 dark:text-rose-200 line-through';
                            badgeStyle = 'bg-rose-500 text-white border-rose-600';
                            icon = '✗';
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
                            className={`w-full p-2.5 sm:p-3 md:p-2 lg:p-1.5 xl:p-2 rounded-xl lg:rounded-lg border text-left text-sm sm:text-base md:text-xs lg:text-[11px] xl:text-xs font-lato transition-all duration-200 flex items-start justify-start gap-2 sm:gap-2.5 lg:gap-1.5 ${
                              !answerState.isAnswered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                            } ${optionStyle}`}
                          >
                            <div className="flex items-start space-x-2 sm:space-x-2.5 md:space-x-2 flex-1 min-w-0 text-left">
                              <span className={`w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-4 lg:h-4 rounded-lg lg:rounded border flex items-center justify-center font-poppins font-bold text-xs md:text-[10px] lg:text-[9px] shrink-0 mt-0.5 ${badgeStyle}`}>
                                {optionLetter}
                              </span>
                              <span className="font-semibold leading-snug text-sm sm:text-base md:text-xs lg:text-[11px] xl:text-xs break-words whitespace-normal flex-1 text-left">
                                {opt}
                              </span>
                            </div>

                            {icon && (
                              <span className={`font-poppins font-black text-xs md:text-[10px] lg:text-[9px] px-1.5 sm:px-2 lg:px-1 py-0.5 rounded-md shrink-0 mt-0.5 ${
                                icon === '✓' ? 'text-emerald-500 bg-emerald-500/20' : 'text-rose-500 bg-rose-500/20'
                              }`}>
                                {icon}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* MOBILE-ONLY INLINE EXPLANATION (Appears ONLY AFTER answer is chosen or timer is done) */}
                    {answerState.isAnswered && (
                      <div className="lg:hidden p-2.5 sm:p-3 md:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-[var(--bg-main)] to-indigo-500/10 border border-emerald-500/40 space-y-1.5 animate-fadeIn shadow-xs text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-poppins font-bold text-xs sm:text-sm md:text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                            <span>💡</span>
                            <span>Solution Explanation</span>
                          </span>
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            {/* Live Mobile Accuracy Badge */}
                            {(sessionStats.attempted > 0 || sessionStats.unattempted > 0) && (
                              <span className="text-[10px] sm:text-xs md:text-[10px] font-poppins font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                🎯 {accuracyPercentage}% Acc
                              </span>
                            )}
                            {isActive && explanationBufferTimer !== null && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsBufferPaused((p) => !p);
                                }}
                                className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 rounded-full bg-blue-500/15 border border-blue-500 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs sm:text-sm md:text-xs cursor-pointer active:scale-95 shadow-xs"
                                title={isBufferPaused ? "Paused — Click to Resume" : "Click to Pause Auto-Next"}
                              >
                                <span>{isBufferPaused ? '⏸' : explanationBufferTimer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm md:text-xs font-lato text-[var(--text-main)] leading-relaxed break-words text-left">
                          {shortItem.explanation}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* BOTTOM FOOTER: STATIC PINNED FOOTER (ALWAYS VISIBLE & NEVER HIDDEN) */}
                  <div className="shrink-0 pt-2 md:pt-1.5 lg:pt-1 border-t border-[var(--border-theme)] flex items-center justify-between relative z-10 gap-1.5 bg-[var(--bg-card)] mt-auto">
                    <div className="text-[10px] sm:text-xs md:text-[11px] lg:text-[9px] font-lato text-[var(--text-muted)] truncate">
                      By <strong className="text-[var(--text-secondary)]">{shortItem.author || 'Quiz Platform'}</strong>
                    </div>

                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      {/* Like Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(shortItem);
                        }}
                        className={`px-2.5 py-0.5 sm:py-1 md:px-2 md:py-0.5 lg:px-1.5 lg:py-0.5 rounded-lg md:rounded-md border flex items-center space-x-1 text-xs sm:text-sm md:text-xs lg:text-[9px] transition-all cursor-pointer ${
                          shortItem.isLiked
                            ? 'bg-rose-500/15 border-rose-500 text-rose-600 font-bold'
                            : 'bg-[var(--bg-main)] border-[var(--border-theme)] text-[var(--text-muted)] hover:text-rose-500'
                        }`}
                        title="Like question"
                      >
                        <span>❤️</span>
                        <span className="font-mono text-[10px] sm:text-xs md:text-[10px] lg:text-[9px]">{shortItem.likesCount || 0}</span>
                      </button>

                      {/* Save Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSave(shortItem);
                        }}
                        className={`p-1.5 md:p-1 lg:p-1 rounded-lg md:rounded-md border flex items-center justify-center text-xs sm:text-sm md:text-xs lg:text-[9px] transition-all cursor-pointer ${
                          shortItem.isSaved
                            ? 'bg-amber-500/15 border-amber-500 text-amber-600 font-bold'
                            : 'bg-[var(--bg-main)] border-[var(--border-theme)] text-[var(--text-muted)] hover:text-amber-500'
                        }`}
                        title="Bookmark question"
                      >
                        <span>🔖</span>
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareShort(shortItem);
                        }}
                        className="p-1.5 md:p-1 lg:p-1 rounded-lg md:rounded-md bg-[var(--bg-main)] border border-[var(--border-theme)] text-[var(--text-muted)] hover:text-blue-500 text-xs sm:text-sm md:text-xs lg:text-[9px] transition-all cursor-pointer"
                        title="Share question"
                      >
                        <span>↗️</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}

          {isLoadingMore && (
            <div className="py-4 flex items-center justify-center space-x-2 text-xs font-poppins text-[var(--text-muted)]">
              <span className="animate-spin text-base">⚡</span>
              <span>Loading more questions...</span>
            </div>
          )}

        </div>

        {/* COLUMN 3: DETAILS & DEEP-DIVE KNOWLEDGE PANEL (lg:col-span-4 xl:col-span-4) */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-4 h-full overflow-hidden">
          {shorts.length > 0 && (
            (() => {
              const activeShort = shorts[activeCardIndex] || shorts[0];
              const activeAns = activeShort ? answersState[activeShort._id] : null;

              return (
                <div className="w-full h-full bg-[var(--bg-card)] border-2 border-[var(--border-theme)] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-md space-y-2.5 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                  
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          🧠
                        </div>
                        <div>
                          <h2 className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)]">
                            Concept Deep-Dive
                          </h2>
                          <div className="text-[9px] font-mono text-[var(--color-primary-600)] font-bold">
                            {activeShort.category || 'Topic'} • Deep Dive
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1.5">
                        {/* Circular Countdown to Next Question (Only Circle, No Card/Texts) */}
                        {explanationBufferTimer !== null ? (
                          <div
                            onClick={() => setIsBufferPaused((p) => !p)}
                            className="relative flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/15 border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-mono font-black text-[11px] cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
                            title={isBufferPaused ? "Paused — Click to Resume" : `Moving to next in ${explanationBufferTimer}s — Click to Pause`}
                          >
                            <span>{isBufferPaused ? '⏸' : explanationBufferTimer}</span>
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeDasharray="94.2"
                                strokeDashoffset={`${94.2 * (1 - explanationBufferTimer / 10)}`}
                                className="text-blue-500 transition-all duration-1000 ease-linear opacity-80"
                              />
                            </svg>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-main)] border border-[var(--border-theme)] text-[10px] font-mono font-bold text-[var(--text-muted)]">
                            ⏱️ {activeShort.timerSeconds || 30}s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ALWAYS VISIBLE LIVE SESSION ACCURACY TRACKER */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1 shadow-xs shrink-0">
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

                    {/* SOLUTION & EXPLANATION: INITIALLY HIDDEN UNTIL TIMER RUNS OUT OR ANSWER SELECTED */}
                    {!activeAns?.isAnswered ? (
                      <div className="p-4 rounded-2xl bg-[var(--bg-main)] border-2 border-dashed border-amber-500/30 text-center space-y-2 animate-fadeIn">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base mx-auto animate-pulse">
                          ⏳
                        </div>
                        <h3 className="font-poppins font-bold text-[11px] text-[var(--text-main)]">
                          Solution & Concept Notes Hidden
                        </h3>
                        <p className="text-[10px] font-lato text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                          Timer running: <strong className="text-amber-500 font-mono text-[11px]">{activeQuestionTimer}s remaining</strong>. Select an option or wait for the countdown to complete to reveal the verified answer, solution breakdown, and key takeaways!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 animate-fadeIn">

                        {/* Answer Status & Correct Option */}
                        <div className={`p-3 rounded-xl border space-y-1 transition-all ${
                          activeAns.selectedIndex === null || activeAns.selectedIndex === undefined
                            ? 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300'
                            : activeAns.isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-poppins font-bold flex items-center space-x-1">
                              <span>
                                {activeAns.selectedIndex === null || activeAns.selectedIndex === undefined
                                  ? '⚪ Not Attempted (Time Expired)'
                                  : activeAns.isCorrect
                                  ? '🎉 Correct (+10 XP)'
                                  : '❌ Incorrect'}
                              </span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-poppins font-bold text-[9px]">
                              Option {['A', 'B', 'C', 'D'][activeShort.correctAnswerIndex]}
                            </span>
                          </div>
                          <div className="font-lato font-bold text-xs text-[var(--text-main)]">
                            {activeShort.options[activeShort.correctAnswerIndex]}
                          </div>
                          {(activeAns.selectedIndex === null || activeAns.selectedIndex === undefined) && (
                            <p className="text-[9px] font-lato text-[var(--text-muted)] pt-0.5">
                              💡 No option was selected before timer expired. Counted as unattempted so your session accuracy percentage is preserved.
                            </p>
                          )}
                        </div>

                        {/* In-Depth Explanation */}
                        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-1.5">
                          <div className="text-[11px] font-poppins font-bold text-[var(--text-main)] flex items-center space-x-1">
                            <span>💡</span>
                            <span>Technical Explanation</span>
                          </div>
                          <p className="text-xs font-lato text-[var(--text-secondary)] leading-relaxed">
                            {activeShort.explanation}
                          </p>
                        </div>

                        {/* Key Engineering Takeaway */}
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
          )}
        </div>

      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--bg-card)] border-2 border-[var(--color-primary-400)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp p-6 space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/20 animate-bounce">
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
                <span>✨ Keep Previous Accuracy ({savedSessionStats.accuracy}%)</span>
              </button>
              <button
                onClick={handleResetSessionAccuracy}
                className="w-full py-2.5 px-5 rounded-2xl bg-[var(--bg-main)] border-2 border-[var(--border-theme)] hover:border-rose-400 hover:text-rose-500 text-[var(--text-main)] font-poppins font-bold text-xs cursor-pointer transition-all active:scale-98 flex items-center justify-center space-x-1.5"
              >
                <span>🔄 Reset Accuracy & Start Fresh (0%)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ShortGyaanPage;
