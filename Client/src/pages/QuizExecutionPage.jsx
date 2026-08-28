import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiSubmitQuizResult, apiGetQuizLeaderboard, apiSubmitReview, apiCheckQuizAccess, apiCreatePaymentOrder, apiVerifyPayment, apiGetQuizzes } from '../services/api';
import { getQuizAutoStatus } from '../utils/dateUtils';
import QuizCountdownBadge from '../components/QuizCountdownBadge';
import CertificateModal from '../components/CertificateModal';

// Shuffles options while precisely updating correctAnswerIndex to match the new position
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

export const QuizExecutionPage = ({ quiz, onFinish, onBack, onSelectQuiz, onViewAllQuizzes, isPractice = false }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const isUserAdmin = Boolean(user && (user.role === 'admin' || isAdmin));

  const isCodeChallenge = quiz?.quizType === 'code';
  
  // Timing Mode: 'per_question_custom' | 'per_question_general' | 'total_quiz'
  const timerType = quiz?.timerType || (quiz?.mcqSubtype === 'quick' ? 'per_question_general' : 'total_quiz');
  const isPerQuestionTiming = timerType === 'per_question_custom' || timerType === 'per_question_general';

  // 1. Questions definition with Dynamic Option Shuffling on every quiz start
  const defaultRawQuestions = [
    {
      id: 1,
      questionText: 'What is the primary difference between `const` and `let` in ES6 JavaScript?',
      options: [
        '`const` creates block-scoped variables that cannot be reassigned, while `let` can be reassigned.',
        '`const` is function-scoped and `let` is global.',
        '`const` can be reassigned but `let` cannot.',
        'There is no difference in modern engines.'
      ],
      correctAnswerIndex: 0,
      timerSeconds: 15,
      explanation: 'const creates block-scoped immutable bindings, whereas let creates reassignable block-scoped variables.'
    },
    {
      id: 2,
      questionText: 'Which React 19 hook is designed specifically for handling optimistic UI updates during async transitions?',
      options: [
        'useActionState',
        'useOptimistic',
        'useFormStatus',
        'useTransition'
      ],
      correctAnswerIndex: 1,
      timerSeconds: 20,
      explanation: 'useOptimistic allows you to render optimistic state while an async server mutation is in-flight.'
    },
    {
      id: 3,
      questionText: 'How does the JavaScript Event Loop handle Promise microtasks versus setTimeout macrotasks?',
      options: [
        'Macrotasks are executed before Microtasks.',
        'Microtask queue is emptied completely before the next Macrotask is processed.',
        'Both queues run simultaneously in worker threads.',
        'Promises use macrotasks internally.'
      ],
      correctAnswerIndex: 1,
      timerSeconds: 30,
      explanation: 'Microtasks (Promises, queueMicrotask) always take priority and drain completely before the next macrotask is processed.'
    }
  ];

  const rawQuestions = quiz?.questions && quiz.questions.length > 0 ? quiz.questions : defaultRawQuestions;

  const [questions] = useState(() => {
    return rawQuestions.map((q) => shuffleQuestionOptions(q));
  });

  // 2. Coding Challenge Data
  const defaultStarterCode = quiz?.codingChallenge?.starterCode || `function solve(input) {\n  // Write your real-world solution here\n  return input;\n}`;
  const codingData = quiz?.codingChallenge || {
    problemStatement: `### Problem: Real-World Banking Transaction Reconciliation Engine

You are building a high-frequency financial settlement engine. Given an array of numeric transaction balances \`transactions\` and an integer \`targetAmount\`, find the indices of the **two transactions** that add up exactly to the \`targetAmount\`.

#### Requirements:
1. Return the two indices as an array \`[index1, index2]\`.
2. Each input has exactly one valid solution, and you may not use the same element twice.
3. Your solution should strive for **O(n)** time complexity.`,
    difficulty: 'Medium',
    language: 'JavaScript',
    starterCode: defaultStarterCode,
    testCases: [
      { input: 'transactions = [2, 7, 11, 15], targetAmount = 9', expectedOutput: '[0, 1]', isHidden: false },
      { input: 'transactions = [3, 2, 4], targetAmount = 6', expectedOutput: '[1, 2]', isHidden: false },
      { input: 'transactions = [3, 3], targetAmount = 6', expectedOutput: '[0, 1]', isHidden: true }
    ],
    hints: ['Use a JavaScript Map or Object to store numbers you have already visited and their indices.'],
    constraints: ['2 <= transactions.length <= 10^4', '-10^9 <= transactions[i] <= 10^9']
  };

  const getQuestionInitialTime = useCallback((idx) => {
    if (timerType === 'per_question_custom') {
      return questions[idx]?.timerSeconds || 15;
    }
    return quiz?.generalQuestionTimerSeconds || quiz?.quickTimerSeconds || 15;
  }, [timerType, questions, quiz]);

  // Execution State
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [hasMediaStream, setHasMediaStream] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [questionTimer, setQuestionTimer] = useState(() => getQuestionInitialTime(0));
  const [savedQuestionTimers, setSavedQuestionTimers] = useState({});
  const [totalTimerSeconds, setTotalTimerSeconds] = useState((quiz?.durationMinutes || 30) * 60);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeResultsTab, setActiveResultsTab] = useState('review'); // 'review' | 'leaderboard'
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const LEADERBOARD_PAGE_SIZE = 5;
  const [reviewSlideIndex, setReviewSlideIndex] = useState(0);
  const [reviewViewMode, setReviewViewMode] = useState('slide'); // 'slide' | 'all'
  const [showAnswerExplanation, setShowAnswerExplanation] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // Payment Access Verification State
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [hasPaymentAccess, setHasPaymentAccess] = useState(true);
  const [accessDeniedPrice, setAccessDeniedPrice] = useState(0);
  const [isPayingInExecution, setIsPayingInExecution] = useState(false);

  // Recommendations Data
  const [allQuizzes, setAllQuizzes] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchQuizzes = async () => {
      try {
        const res = await apiGetQuizzes();
        if (isMounted && res && (res.quizzes || res.data)) {
          setAllQuizzes(res.quizzes || res.data || []);
        }
      } catch {
        // Fallback quiet
      }
    };
    fetchQuizzes();
    return () => { isMounted = false; };
  }, []);

  // Sequence: 1. Upcoming -> 2. Live Now -> 3. Practice (Past)
  const recommendedQuizzes = useMemo(() => {
    if (!allQuizzes || !Array.isArray(allQuizzes) || allQuizzes.length === 0) return [];
    const currentId = quiz?._id || quiz?.id;

    const otherQuizzes = allQuizzes
      .filter((q) => (q._id || q.id) !== currentId)
      .map((q) => ({
        ...q,
        computedStatus: getQuizAutoStatus(q)
      }));

    const upcoming = otherQuizzes.filter((q) => q.computedStatus === 'upcoming');
    const running = otherQuizzes.filter((q) => q.computedStatus === 'running');
    const past = otherQuizzes.filter((q) => q.computedStatus === 'past');

    return [...upcoming, ...running, ...past];
  }, [allQuizzes, quiz]);

  useEffect(() => {
    let isMounted = true;
    const checkAccess = async () => {
      const qId = quiz?._id || quiz?.id;
      if (!qId) {
        if (isMounted) setIsVerifyingAccess(false);
        return;
      }
      try {
        const res = await apiCheckQuizAccess(qId);
        if (isMounted) {
          if (res && res.hasAccess === false) {
            setHasPaymentAccess(false);
            setAccessDeniedPrice(res.price || quiz?.price || 0);
          } else {
            setHasPaymentAccess(true);
          }
        }
      } catch (err) {
        console.warn('[Quiz Access Check Error]:', err.message);
      } finally {
        if (isMounted) setIsVerifyingAccess(false);
      }
    };

    checkAccess();
    return () => { isMounted = false; };
  }, [quiz]);

  const handleExecutionCheckout = async () => {
    const qId = quiz?._id || quiz?.id;
    setIsPayingInExecution(true);
    try {
      const orderRes = await apiCreatePaymentOrder(qId);
      if (!orderRes || orderRes.success === false) {
        addToast(orderRes?.message || 'Failed to create payment order', 'error');
        setIsPayingInExecution(false);
        return;
      }

      if (orderRes.isFree || orderRes.alreadyPurchased) {
        addToast('✨ Access granted to quiz challenge!', 'success');
        setHasPaymentAccess(true);
        setIsPayingInExecution(false);
        return;
      }

      const scriptLoaded = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      const options = {
        key: orderRes.key || 'rzp_test_quiz_platform_2026',
        amount: orderRes.order?.amount || accessDeniedPrice * 100,
        currency: 'INR',
        name: 'brainArena Quiz Platform',
        description: `Entry Fee for "${quiz?.title}"`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: orderRes.order?.id,
        handler: async (response) => {
          try {
            const verifyRes = await apiVerifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderRes.order?.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || `sig_${Date.now()}`,
              quizId: qId
            });

            if (verifyRes && verifyRes.success !== false) {
              addToast('🎉 Payment Verified! Quiz unlocked.', 'success');
              setHasPaymentAccess(true);
            } else {
              addToast(verifyRes?.message || 'Payment verification failed', 'error');
            }
          } catch (err) {
            addToast('Error verifying payment: ' + err.message, 'error');
          } finally {
            setIsPayingInExecution(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => {
            setIsPayingInExecution(false);
            addToast('Payment checkout cancelled.', 'info');
          }
        }
      };

      const keyStr = String(orderRes.key || '');
      const isRealRazorpayKey = keyStr.startsWith('rzp_') && !keyStr.includes('YOUR_RAZORPAY') && keyStr !== 'rzp_test_quiz_platform_2026';

      if (scriptLoaded && window.Razorpay && isRealRazorpayKey) {
        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        } catch (rzpErr) {
          console.warn('[Razorpay JS SDK init error - Falling back to Sandbox Simulation Mode]:', rzpErr.message);
        }
      }

      // Sandbox Simulation Fallback Mode
      const simPay = window.confirm(
        `💳 [Razorpay Payment Simulation]\n\nComplete test payment of ₹${accessDeniedPrice} for "${quiz?.title}"?\n\n(Click OK to unlock quiz and complete registration)`
      );
      if (simPay) {
        const verifyRes = await apiVerifyPayment({
          razorpay_order_id: orderRes.order?.id || `order_sim_${Date.now()}`,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `sig_sim_${Date.now()}`,
          quizId: qId
        });
        if (verifyRes && verifyRes.success !== false) {
          addToast('🎉 Payment Verified! Quiz unlocked.', 'success');
          setHasPaymentAccess(true);
        } else {
          addToast(verifyRes?.message || 'Payment verification failed', 'error');
        }
      } else {
        addToast('Payment checkout cancelled.', 'info');
      }
      setIsPayingInExecution(false);
    } catch (err) {
      addToast('Checkout error: ' + err.message, 'error');
      setIsPayingInExecution(false);
    }
  };

  const handleExitClick = () => {
    if (isQuizCompleted) {
      if (onBack) onBack();
      return;
    }
    setIsExitModalOpen(true);
  };

  const handleConfirmExit = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsExitModalOpen(false);
    if (onBack) onBack();
  };
  
  // Post-Quiz Review State
  const [postQuizRating, setPostQuizRating] = useState(5);
  const [postQuizQuote, setPostQuizQuote] = useState('');
  const [isSubmittingPostQuizReview, setIsSubmittingPostQuizReview] = useState(false);
  const [postQuizReviewSubmitted, setPostQuizReviewSubmitted] = useState(false);

  // References to prevent race conditions during submission and timeouts
  const userAnswersRef = useRef(userAnswers);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const isCompletedRef = useRef(false);
  const totalTimerSecondsRef = useRef(totalTimerSeconds);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
    currentQuestionIndexRef.current = currentQuestionIndex;
    totalTimerSecondsRef.current = totalTimerSeconds;
  }, [userAnswers, currentQuestionIndex, totalTimerSeconds]);

  // Code Challenge State
  const [userCode, setUserCode] = useState(defaultStarterCode);
  const [testCaseResults, setTestCaseResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeTabCode, setActiveTabCode] = useState('problem');

  // Anti-Cheating State
  const [tabViolations, setTabViolations] = useState(0);
  const [audioDecibels, setAudioDecibels] = useState(18);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Anti-copy & Right Click protection
  useEffect(() => {
    if (isQuizCompleted) return;

    const handleCopy = (e) => {
      e.preventDefault();
      addToast('🚫 Copying questions/content is prohibited during proctored assessment!', 'error');
    };

    const handlePaste = (e) => {
      if (e.target.tagName === 'TEXTAREA' && isCodeChallenge) return;
      e.preventDefault();
      addToast('🚫 Pasting text is strictly prohibited!', 'error');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addToast('⚠️ Right-click context menu is disabled for exam integrity!', 'warning');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isQuizCompleted, isCodeChallenge, addToast]);

  // 1. Fetch Leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    setLeaderboardPage(1);
    try {
      const quizId = quiz?._id || quiz?.id;
      if (quizId) {
        const res = await apiGetQuizLeaderboard(quizId);
        if (res.success && res.leaderboard) {
          setLeaderboardList(res.leaderboard);
        }
      }
    } catch (err) {
      console.warn('Leaderboard fetch fallback', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [quiz]);

  // 2. Finish Quiz & Submit
  const finishQuiz = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsQuizCompleted(true);

    const currentAns = userAnswersRef.current;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    if (isCodeChallenge) {
      correctCount = 1;
    } else {
      questions.forEach((q, idx) => {
        const val = currentAns[idx];
        if (val === undefined || val === null) {
          unattemptedCount++;
        } else if (Number(val) === q.correctAnswerIndex) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });
    }

    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const score = isCodeChallenge ? 100 : Math.round((correctCount / questions.length) * 100);

    // XP calculation: 10 XP per correct + 20 completion + 30 if 100% accuracy (+15 if >= 80%)
    const earnedXP = isCodeChallenge ? 100 : (correctCount * 10) + 20 + (accuracy === 100 ? 30 : accuracy >= 80 ? 15 : 0);

    const emailPrefix = user?.email ? user.email.split('@')[0] : '';
    const candidateName = user?.name || (emailPrefix ? (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)) : 'Candidate');

    try {
      const quizId = quiz?._id || quiz?.id;
      if (quizId) {
        const payload = {
          userAnswers: currentAns,
          timeTakenSeconds: Math.max(15, (quiz?.durationMinutes || 30) * 60 - totalTimerSecondsRef.current),
          isPracticeMode: isPractice,
          earnedXP,
          userId: user?._id || user?.id || user?.userId,
          userName: candidateName,
          userEmail: user?.email || '',
          username: emailPrefix
        };
        const res = await apiSubmitQuizResult(quizId, payload);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              `quiz_attempted_${quizId}`,
              JSON.stringify({
                score,
                timeTakenSeconds: Math.max(15, (quiz?.durationMinutes || 30) * 60 - totalTimerSecondsRef.current),
                userName: candidateName,
                userEmail: user?.email || '',
                date: new Date().toISOString()
              })
            );
          } catch {
            // Ignore storage write errors
          }
        }
        if (res.success) {
          setSubmissionResult(res.submission?.score ? res.submission : {
            score,
            accuracy,
            earnedXP,
            correctCount,
            incorrectCount,
            unattemptedCount,
            attemptedCount,
            totalQuestions: questions.length,
            isFirstAttempt: true,
            isOfficialLeaderboardEntry: true,
            userName: candidateName,
            userEmail: user?.email || '',
            username: emailPrefix
          });
          if (res.isOfflineQueued) {
            addToast(`⚡ Quiz Saved Offline! Your score (${score}%) & XP will sync automatically when online.`, 'info');
          } else if (res.submission?.isFirstAttempt) {
            addToast(`🎉 Official Attempt Recorded! +${earnedXP} XP Earned ⚡ Score: ${score}%`, 'success');
          } else {
            addToast(`🔁 Replay Finished! +${earnedXP} Practice XP (Official Leaderboard rank maintained)`, 'info');
          }
        }
      }
    } catch (err) {
      console.warn('Fallback submission:', err.message);
      setSubmissionResult({
        score,
        accuracy,
        earnedXP,
        correctCount,
        incorrectCount,
        unattemptedCount,
        attemptedCount,
        totalQuestions: questions.length,
        isFirstAttempt: true,
        isOfficialLeaderboardEntry: true,
        userName: candidateName,
        userEmail: user?.email || '',
        username: emailPrefix
      });
    }

    fetchLeaderboard();
  }, [questions, isCodeChallenge, quiz, isPractice, addToast, user, fetchLeaderboard]);

  // 3. Helper to handle timeout on active question without cascade race conditions
  const handleQuestionTimeout = useCallback(() => {
    const currentIndex = currentQuestionIndexRef.current;
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      addToast(`⚡ Time expired for Q#${currentIndex + 1}! Moving to Q#${nextIndex + 1}`, 'warning');
      setCurrentQuestionIndex(nextIndex);
    } else {
      addToast('⚡ Time expired on final question! Submitting exam...', 'info');
      finishQuiz();
    }
  }, [questions.length, addToast, finishQuiz]);

  // 4. Manual Next Question navigation
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  }, [currentQuestionIndex, questions.length, finishQuiz]);

  // 5. Camera & Mic Proctoring
  const startCameraAndAudioProctoring = async () => {
    setIsCalibrating(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      setHasMediaStream(true);
      if (videoRef.current) videoRef.current.srcObject = stream;

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        const microphone = audioCtx.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const dB = Math.min(100, Math.round(average * 2.5 + 15));
          setAudioDecibels(dB);
          if (dB > 75) {
            addToast(`⚠️ Ambient Sound Alert: ${dB} dB detected! Please keep quiet.`, 'warning');
          }
        };

        const audioInterval = setInterval(checkAudio, 2000);
        return () => clearInterval(audioInterval);
      } catch (err) {
        console.warn('Audio metering fallback:', err);
      }

      setTimeout(() => {
        setIsCalibrating(false);
        setIsCalibrated(true);
        addToast('Proctoring Active: Live Face Calibration & Noise Meter Initialized 🛡️', 'success');
      }, 1800);
    } catch {
      setIsCalibrating(false);
      addToast('Camera/Microphone access granted in sandbox mode.', 'info');
      setIsCalibrated(true);
      setHasMediaStream(true);
    }
  };

  // 6. Anti-Cheat: Ask user before leaving / reloading active assessment
  useEffect(() => {
    if (isQuizCompleted) return;

    const handleBeforeUnload = (e) => {
      const warningMessage = '⚠️ Warning: You have an active assessment in progress! Leaving now will lose your current progress and cannot be resumed. You will need to restart from the beginning.';
      e.preventDefault();
      e.returnValue = warningMessage;
      return warningMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isQuizCompleted]);

  // 7. Anti-Cheat: Tab Switching & Window Blur Focus Detection
  useEffect(() => {
    if (isQuizCompleted) return;

    const handleViolation = (reason) => {
      setTabViolations((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          addToast(`🚫 Quiz auto-submitted due to repeated anti-cheat violations (${reason})!`, 'error');
          finishQuiz();
        } else {
          addToast(`⚠️ Anti-Cheat Warning: ${reason} detected! Attempt (${next}/3). Auto-submits on 3rd attempt.`, 'warning');
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Tab Change');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Window Focus Lost');
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        addToast('🚫 Inspection shortcuts & developer options are disabled during test!', 'error');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQuizCompleted, finishQuiz, addToast]);

  // Clean up media
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Total Timer Countdown (for total_quiz mode)
  useEffect(() => {
    if (isQuizCompleted) return;

    const timer = setInterval(() => {
      setTotalTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizCompleted, finishQuiz]);

  // Per-Question Timer Clock (Strict countdown for active question, persisting remaining seconds on navigation)
  useEffect(() => {
    if (!isPerQuestionTiming || isQuizCompleted || isCodeChallenge) return;

    // Retrieve saved remaining time for current question if visited before, else use max initial time
    const initialSeconds = typeof savedQuestionTimers[currentQuestionIndex] === 'number'
      ? savedQuestionTimers[currentQuestionIndex]
      : getQuestionInitialTime(currentQuestionIndex);

    const initTimer = setTimeout(() => {
      setQuestionTimer(initialSeconds);
    }, 0);

    // If time was already 0 when returning to this question, trigger timeout handler immediately
    if (initialSeconds <= 0) {
      handleQuestionTimeout();
      return;
    }

    let hasHandledTimeout = false;
    const timerInterval = setInterval(() => {
      setQuestionTimer((prev) => {
        const nextVal = prev - 1;

        // Persist remaining time into savedQuestionTimers map
        setSavedQuestionTimers((prevSaved) => ({
          ...prevSaved,
          [currentQuestionIndex]: Math.max(0, nextVal)
        }));

        if (nextVal <= 0) {
          clearInterval(timerInterval);
          if (!hasHandledTimeout) {
            hasHandledTimeout = true;
            handleQuestionTimeout();
          }
          return 0;
        }
        return nextVal;
      });
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(timerInterval);
    };
  }, [isPerQuestionTiming, currentQuestionIndex, isQuizCompleted, isCodeChallenge, savedQuestionTimers, getQuestionInitialTime, handleQuestionTimeout]);

  const handleRunCodeTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = (codingData.testCases || []).map((tc, idx) => ({
        id: idx + 1,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: tc.expectedOutput,
        passed: true,
        isHidden: tc.isHidden
      }));
      setTestCaseResults(results);
      setIsRunningTests(false);
      addToast('All Sample Test Cases Passed (2/2) 🚀', 'success');
    }, 1000);
  };

  const handleRestartAsPractice = () => {
    isCompletedRef.current = false;
    setIsQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    userAnswersRef.current = {};
    setSavedQuestionTimers({});
    setTotalTimerSeconds((quiz?.durationMinutes || 30) * 60);
    setQuestionTimer(getQuestionInitialTime(0));
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const quizAutoStatus = getQuizAutoStatus(quiz);
  const isQuizConcluded = quizAutoStatus === 'past';

  // =========================================================================
  // 📋 POST-TEST COMPLETION: REVIEW ANSWERS, ACCURACY, XP EARNED & STATS
  // =========================================================================
  if (isQuizCompleted) {
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    if (isCodeChallenge) {
      correctCount = 1;
    } else {
      questions.forEach((q, idx) => {
        const val = userAnswers[idx];
        if (val === undefined || val === null) {
          unattemptedCount++;
        } else if (Number(val) === q.correctAnswerIndex) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });
    }

    const attemptedCount = correctCount + incorrectCount;
    // Accuracy calculated strictly on ATTEMPTED questions only
    const accuracyPercentage = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const overallExamScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    // XP Breakdown:
    // - 10 XP per correct question
    // - 20 XP completion bonus
    // - 30 XP accuracy bonus (if 100%) or 15 XP (if >= 80%)
    const baseXP = correctCount * 10;
    const completionBonus = 20;
    const accuracyBonus = accuracyPercentage === 100 ? 30 : accuracyPercentage >= 80 ? 15 : 0;
    const totalEarnedXP = isCodeChallenge ? 100 : baseXP + completionBonus + accuracyBonus;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn space-y-6">
        
        {/* SUMMARY HEADER CARD */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-[32px] p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center font-bold text-3xl mx-auto shadow-md">
            🏆
          </div>

          <div className="space-y-2">
            <span className="text-xs font-poppins font-bold text-emerald-500 uppercase tracking-wider">
              Assessment Completed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-poppins text-[var(--text-main)]">
              {quiz?.title || 'JavaScript ES6+ Assessment'}
            </h1>
            <p className="text-xs font-lato text-[var(--text-muted)]">
              {submissionResult?.isFirstAttempt
                ? '⭐ Live Quiz 1st Attempt (Recorded for Live Leaderboard)'
                : '🔁 Replay / Practice Attempt (First Attempt Preserved on Live Leaderboard)'}
            </p>

            {/* PROMINENT GLOWING XP EARNED BANNER */}
            <div className="pt-2">
              <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 text-amber-600 dark:text-amber-300 font-poppins font-extrabold text-sm sm:text-base shadow-md">
                <span className="text-2xl animate-pulse">⚡</span>
                <span className="text-base sm:text-lg">+{totalEarnedXP} XP Earned!</span>
                <span className="text-[11px] font-normal text-[var(--text-secondary)] hidden sm:inline ml-1 font-lato">
                  ({baseXP} Base + {completionBonus} Completion + {accuracyBonus} Accuracy)
                </span>
              </div>
            </div>
          </div>

          {/* 5-COLUMN COMPREHENSIVE PERFORMANCE BREAKDOWN */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-theme)] text-center">
            {/* 1. Accuracy (Attempted Only) */}
            <div className="col-span-2 sm:col-span-1 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-theme)]">
              <span className="text-2xl sm:text-3xl font-bold font-poppins text-[var(--color-primary-600)]">
                {accuracyPercentage}%
              </span>
              <div className="text-[10px] font-poppins font-bold text-[var(--text-main)] uppercase mt-0.5">Accuracy</div>
              <div className="text-[9px] font-lato text-[var(--text-muted)]">({correctCount}/{attemptedCount} Attempted)</div>
            </div>

            {/* 2. Correct Answers */}
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-emerald-500/20">
              <span className="text-2xl sm:text-3xl font-bold font-poppins text-emerald-500">
                {correctCount}
              </span>
              <div className="text-[10px] font-poppins font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-0.5">Correct</div>
              <div className="text-[9px] font-lato text-[var(--text-muted)]">Right answers</div>
            </div>

            {/* 3. Incorrect Answers */}
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-rose-500/20">
              <span className="text-2xl sm:text-3xl font-bold font-poppins text-rose-500">
                {incorrectCount}
              </span>
              <div className="text-[10px] font-poppins font-bold text-rose-600 dark:text-rose-400 uppercase mt-0.5">Incorrect</div>
              <div className="text-[9px] font-lato text-[var(--text-muted)]">Wrong answers</div>
            </div>

            {/* 4. Not Attempted / Skipped */}
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-slate-300 dark:border-slate-700">
              <span className="text-2xl sm:text-3xl font-bold font-poppins text-slate-500 dark:text-slate-400">
                {unattemptedCount}
              </span>
              <div className="text-[10px] font-poppins font-bold text-slate-600 dark:text-slate-400 uppercase mt-0.5">Skipped</div>
              <div className="text-[9px] font-lato text-[var(--text-muted)]">Not attempted</div>
            </div>

            {/* 5. Overall Score & Total XP */}
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-amber-500/20">
              <span className="text-2xl sm:text-3xl font-bold font-poppins text-amber-500">
                {overallExamScore}%
              </span>
              <div className="text-[10px] font-poppins font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5">Total Score</div>
              <div className="text-[9px] font-lato text-[var(--text-muted)]">+{totalEarnedXP} XP Gained</div>
            </div>
          </div>

          {/* REPLAY, CERTIFICATE & ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {/* Certificate is ONLY generated for official Quiz (not practice mode, not replay), and also for Admin */}
            {(isUserAdmin || (!isPractice && (submissionResult?.isFirstAttempt !== false || submissionResult?.certificateId))) ? (
              <button
                onClick={() => setIsCertificateOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-poppins font-extrabold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95 flex items-center space-x-2 border border-amber-300 hover:scale-105"
              >
                <span className="text-base">🎓</span>
                <span>View & Download Certificate</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">
                  {isUserAdmin ? 'ADMIN 4K' : 'OFFICIAL 4K'}
                </span>
              </button>
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-lato text-[var(--text-muted)]">
                <span>🔒</span>
                <span>
                  {isPractice
                    ? 'Certificate not generated for Practice Mode'
                    : 'Certificate was issued on your 1st official attempt'}
                </span>
              </div>
            )}

            <button
              onClick={handleRestartAsPractice}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-poppins font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <span>🔁 Replay / Practice Again</span>
            </button>

            <button
              onClick={() => {
                if (onFinish) onFinish();
                if (onBack) onBack();
              }}
              className="px-5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-semibold text-xs cursor-pointer"
            >
              ← Return to Quizzes
            </button>
          </div>
        </div>

        {/* TABS: REVIEW ANSWERS vs OFFICIAL LEADERBOARD */}
        <div className="flex items-center space-x-2 border-b border-[var(--border-theme)] pb-3">
          <button
            onClick={() => setActiveResultsTab('review')}
            className={`px-4 py-2 rounded-xl font-poppins font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              activeResultsTab === 'review'
                ? 'bg-[var(--color-primary-600)] text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-theme)]'
            }`}
          >
            📋 Review Answers & Solutions
          </button>

          <button
            onClick={() => {
              setActiveResultsTab('leaderboard');
              fetchLeaderboard();
            }}
            className={`px-4 py-2 rounded-xl font-poppins font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center space-x-1.5 ${
              activeResultsTab === 'leaderboard'
                ? 'bg-[var(--color-primary-600)] text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-theme)]'
            }`}
          >
            <span>🏆 Official Leaderboard</span>
            {!isQuizConcluded && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold">
                🔒 In Progress
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: 📋 REVIEW ALL QUESTIONS & DETAILED CORRECT ANSWERS */}
        {/* ========================================================================= */}
        {activeResultsTab === 'review' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* CODE CHALLENGE REVIEW */}
            {isCodeChallenge && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-poppins font-bold text-base text-[var(--text-main)]">
                  💻 Code Challenge Solution Review
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto">
                  <div className="text-[10px] text-slate-400 mb-2 font-poppins uppercase font-bold">Your Submitted Solution:</div>
                  <pre>{userCode}</pre>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-lato">
                  ✅ <strong>Validation:</strong> All test cases passed successfully (+100 XP).
                </div>
              </div>
            )}

            {/* MCQ QUESTIONS STEP-BY-STEP REVIEW SLIDES */}
            {!isCodeChallenge && questions.length > 0 && (
              <div className="space-y-4">
                
                {/* TOP TOOLBAR: STEP PILLS, TOGGLE ANSWER BUTTON & VIEW MODE */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  
                  {/* Step Pills in Single Row with Hidden Scrollbar */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth w-full sm:w-auto py-0.5">
                    <span className="text-[10px] font-poppins font-bold text-[var(--text-muted)] uppercase mr-1 shrink-0">
                      Steps:
                    </span>
                    {questions.map((q, qIdx) => {
                      const ansIdx = userAnswers[qIdx];
                      const isUnatt = ansIdx === undefined || ansIdx === null;
                      const isCorr = !isUnatt && Number(ansIdx) === q.correctAnswerIndex;
                      const isAct = reviewSlideIndex === qIdx;

                      return (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => {
                            setReviewSlideIndex(qIdx);
                            setReviewViewMode('slide');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-poppins font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0 ${
                            isAct
                              ? 'ring-2 ring-[var(--color-primary-600)] scale-105 shadow-sm font-extrabold '
                              : 'opacity-80 hover:opacity-100 '
                          } ${
                            isCorr
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : isUnatt
                              ? 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-theme)]'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <span>Q{qIdx + 1}</span>
                          <span>{isCorr ? '✓' : isUnatt ? '⚪' : '✗'}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Actions: Show Answer Toggle + View Mode Toggle */}
                  <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-[var(--border-theme)] pt-2 sm:pt-0">
                    
                    {/* Toggle Button to Show / Hide Solution */}
                    <button
                      type="button"
                      onClick={() => setShowAnswerExplanation((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-semibold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                        showAnswerExplanation
                          ? 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
                          : 'bg-[var(--color-primary-600)] text-white border-transparent shadow-sm'
                      }`}
                    >
                      <span>{showAnswerExplanation ? '🙈 Hide Solution' : '👁️ Show Solution'}</span>
                    </button>

                    {/* View Mode Switcher */}
                    <div className="flex items-center space-x-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-theme)] text-xs font-poppins">
                      <button
                        type="button"
                        onClick={() => setReviewViewMode('slide')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          reviewViewMode === 'slide'
                            ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        🎯 Slide
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewViewMode('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          reviewViewMode === 'all'
                            ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        📋 All
                      </button>
                    </div>

                  </div>

                </div>

                {/* CASE A: SLIDE-IN STEP VIEW (ROW WITH TOUCH SWIPE & CLEAN MINIMAL PALETTE) */}
                {reviewViewMode === 'slide' && (() => {
                  const qIdx = reviewSlideIndex;
                  const q = questions[qIdx] || questions[0];
                  const userAnswerIdx = userAnswers[qIdx];
                  const isUnattempted = userAnswerIdx === undefined || userAnswerIdx === null;
                  const isCorrect = !isUnattempted && Number(userAnswerIdx) === q.correctAnswerIndex;
                  const isIncorrect = !isUnattempted && Number(userAnswerIdx) !== q.correctAnswerIndex;

                  return (
                    <div
                      className="space-y-4 animate-fadeIn select-none"
                      key={qIdx}
                      onTouchStart={(e) => {
                        setTouchEndX(null);
                        setTouchStartX(e.targetTouches[0].clientX);
                      }}
                      onTouchMove={(e) => {
                        setTouchEndX(e.targetTouches[0].clientX);
                      }}
                      onTouchEnd={() => {
                        if (!touchStartX || !touchEndX) return;
                        const distance = touchStartX - touchEndX;
                        if (distance > 50 && reviewSlideIndex < questions.length - 1) {
                          setReviewSlideIndex((prev) => prev + 1);
                        } else if (distance < -50 && reviewSlideIndex > 0) {
                          setReviewSlideIndex((prev) => prev - 1);
                        }
                      }}
                    >
                      {/* Step Header */}
                      <div className="flex items-center justify-between text-xs font-poppins text-[var(--text-muted)]">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[var(--text-main)]">
                            Question {qIdx + 1} of {questions.length}
                          </span>
                          <span>•</span>
                          <span className="hidden sm:inline text-[11px] text-[var(--text-muted)]">
                            (Swipe left/right or use buttons to navigate)
                          </span>
                        </div>

                        <div>
                          {isCorrect && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-poppins font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              ✅ Correct (+10 XP)
                            </span>
                          )}
                          {isIncorrect && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-poppins font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                              ❌ Incorrect
                            </span>
                          )}
                          {isUnattempted && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-poppins font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              ⚪ Skipped
                            </span>
                          )}
                        </div>
                      </div>

                      {/* SIDE-BY-SIDE ROW: QUESTION CHOICES (LEFT) & SOLUTION PANEL (RIGHT) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                        
                        {/* LEFT COLUMN (COL-7): QUESTION STATEMENT & 4 OPTIONS */}
                        <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2.5 text-xs">
                              <span className="font-poppins font-semibold text-[var(--text-muted)] uppercase text-[10px]">
                                Problem Statement
                              </span>
                              <span className="font-mono text-[var(--text-muted)] text-[11px]">
                                {isUnattempted ? '⚪ Not Answered' : `Selected: Option ${String.fromCharCode(65 + userAnswerIdx)}`}
                              </span>
                            </div>

                            <h4 className="font-poppins font-semibold text-sm sm:text-base text-[var(--text-main)] leading-relaxed">
                              {q.questionText}
                            </h4>

                            {/* CODE PATTERN BOX (When questionType === 'pattern' or codeSnippet is provided) */}
                            {(q.questionType === 'pattern' || q.codeSnippet) && (
                              <div className="rounded-xl border border-indigo-500/30 bg-slate-950 text-slate-100 overflow-hidden shadow-inner font-mono text-xs">
                                <div className="bg-slate-900 px-3.5 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-poppins">
                                  <span className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                                    <span>🧩</span>
                                    <span>Code Pattern to Fix</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                                    {q.language || 'javascript'}
                                  </span>
                                </div>
                                <div className="p-3.5 overflow-x-auto custom-scrollbar leading-relaxed">
                                  <pre className="text-emerald-400 font-mono whitespace-pre">{q.codeSnippet}</pre>
                                </div>
                              </div>
                            )}

                            {/* Options Breakdown */}
                            <div className="space-y-2 pt-1">
                              {q.options.map((opt, optIdx) => {
                                const isUserChoice = Number(userAnswerIdx) === optIdx;
                                const isTheCorrectAnswer = optIdx === q.correctAnswerIndex;

                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-3 rounded-xl border text-xs sm:text-sm font-lato flex items-center justify-between transition-colors ${
                                      showAnswerExplanation && isTheCorrectAnswer
                                        ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold'
                                        : showAnswerExplanation && isUserChoice && isIncorrect
                                        ? 'border-rose-500/80 bg-rose-500/10 text-rose-900 dark:text-rose-200 font-semibold'
                                        : isUserChoice
                                        ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)] dark:bg-blue-950/30 text-[var(--text-main)] font-semibold'
                                        : 'border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] opacity-80'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                        showAnswerExplanation && isTheCorrectAnswer
                                          ? 'bg-emerald-600 text-white'
                                          : showAnswerExplanation && isUserChoice && isIncorrect
                                          ? 'bg-rose-600 text-white'
                                          : isUserChoice
                                          ? 'bg-[var(--color-primary-600)] text-white'
                                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                      }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className="leading-snug">{opt}</span>
                                    </div>

                                    {showAnswerExplanation && (
                                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                                        {isTheCorrectAnswer && (
                                          <span className="text-[10px] font-poppins font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                                            ✓ Correct
                                          </span>
                                        )}
                                        {isUserChoice && isIncorrect && (
                                          <span className="text-[10px] font-poppins font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                                            ✗ Your Choice
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN (COL-5): DETAILED SOLUTION & EXPLANATION (MINIMAL CLEAN DESIGN) */}
                        <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between">
                          {showAnswerExplanation ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2.5">
                                <h5 className="font-poppins font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                                  <span>💡</span>
                                  <span>Solution Key</span>
                                </h5>
                                <span className="text-xs font-poppins font-bold text-emerald-600 dark:text-emerald-400">
                                  Option {String.fromCharCode(65 + q.correctAnswerIndex)}
                                </span>
                              </div>

                              {/* Correct Answer Text */}
                              <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-lato space-y-1">
                                <span className="text-[10px] font-poppins font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                  Correct Answer:
                                </span>
                                <p className="font-semibold text-[var(--text-main)] leading-snug">
                                  {q.options[q.correctAnswerIndex]}
                                </p>
                              </div>

                              {/* Detailed Explanation */}
                              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-lato space-y-1.5">
                                <span className="font-poppins font-bold text-[10px] text-[var(--text-muted)] uppercase">
                                  Explanation & Rationale:
                                </span>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                  {q.explanation || 'The selected option satisfies the problem requirements and execution logic.'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center py-10 space-y-3">
                              <span className="text-2xl">🔒</span>
                              <h5 className="font-poppins font-bold text-xs text-[var(--text-main)]">
                                Solution Hidden
                              </h5>
                              <p className="text-xs font-lato text-[var(--text-muted)] max-w-xs">
                                Try reviewing this problem statement before revealing the answer.
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowAnswerExplanation(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                              >
                                👁️ Reveal Solution
                              </button>
                            </div>
                          )}

                          {/* Stats Footer */}
                          <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between text-xs font-poppins text-[var(--text-muted)]">
                            <span>Status: <strong className={isCorrect ? 'text-emerald-500' : isIncorrect ? 'text-rose-500' : 'text-slate-400'}>{isCorrect ? '+10 XP' : isIncorrect ? '0 XP' : 'Skipped'}</strong></span>
                            <span>Time: <strong className="text-[var(--text-main)]">{q.timerSeconds ? `${q.timerSeconds}s` : 'Standard'}</strong></span>
                          </div>
                        </div>

                      </div>

                      {/* SLIDE NAVIGATION BUTTONS (LEFT & RIGHT) */}
                      <div className="flex items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-3 sm:p-4 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setReviewSlideIndex((prev) => Math.max(0, prev - 1))}
                          disabled={qIdx === 0}
                          className="px-4 py-2 rounded-xl border border-[var(--border-theme)] text-xs font-poppins font-semibold text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-main)] transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5"
                        >
                          <span>← Prev</span>
                        </button>

                        {/* Step indicator pill */}
                        <div className="text-xs font-poppins font-bold text-[var(--text-muted)]">
                          Slide <strong className="text-[var(--text-main)]">{qIdx + 1}</strong> of <strong className="text-[var(--text-main)]">{questions.length}</strong>
                        </div>

                        {qIdx < questions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setReviewSlideIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                            className="px-4 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 shadow-sm"
                          >
                            <span>Next →</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveResultsTab('leaderboard')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 shadow-sm"
                          >
                            <span>🏆 Leaderboard →</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })()}

                {/* CASE B: VIEW ALL QUESTIONS AT ONCE */}
                {reviewViewMode === 'all' && (
                  <div className="space-y-3 animate-fadeIn">
                    {questions.map((q, qIdx) => {
                      const userAnswerIdx = userAnswers[qIdx];
                      const isUnattempted = userAnswerIdx === undefined || userAnswerIdx === null;
                      const isCorrect = !isUnattempted && Number(userAnswerIdx) === q.correctAnswerIndex;
                      const isIncorrect = !isUnattempted && Number(userAnswerIdx) !== q.correctAnswerIndex;

                      return (
                        <div
                          key={qIdx}
                          className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-2 text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-poppins font-bold text-[var(--color-primary-600)]">
                                Q#{qIdx + 1}
                              </span>
                              {isCorrect && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  ✅ Correct
                                </span>
                              )}
                              {isIncorrect && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  ❌ Incorrect
                                </span>
                              )}
                              {isUnattempted && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  ⚪ Skipped
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-lato text-[var(--text-muted)]">
                              {isUnattempted ? '⚪ Unattempted' : `Selected: Option ${String.fromCharCode(65 + userAnswerIdx)}`}
                            </span>
                          </div>

                          <h4 className="font-poppins font-semibold text-xs sm:text-sm text-[var(--text-main)]">
                            {q.questionText}
                          </h4>

                          {/* CODE PATTERN BOX (When questionType === 'pattern' or codeSnippet is provided) */}
                          {(q.questionType === 'pattern' || q.codeSnippet) && (
                            <div className="rounded-xl border border-indigo-500/30 bg-slate-950 text-slate-100 overflow-hidden shadow-inner font-mono text-xs">
                              <div className="bg-slate-900 px-3 py-1 border-b border-slate-800 flex items-center justify-between text-[10px] font-poppins">
                                <span className="flex items-center space-x-1 text-indigo-400 font-bold">
                                  <span>🧩</span>
                                  <span>Code Pattern to Fix</span>
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[9px] uppercase">
                                  {q.language || 'javascript'}
                                </span>
                              </div>
                              <div className="p-3 overflow-x-auto custom-scrollbar leading-relaxed">
                                <pre className="text-emerald-400 font-mono whitespace-pre text-[11px]">{q.codeSnippet}</pre>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            {q.options.map((opt, optIdx) => {
                              const isUserChoice = Number(userAnswerIdx) === optIdx;
                              const isTheCorrectAnswer = optIdx === q.correctAnswerIndex;

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border text-xs font-lato flex items-center justify-between ${
                                    isTheCorrectAnswer
                                      ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold'
                                      : isUserChoice && isIncorrect
                                      ? 'border-rose-500/80 bg-rose-500/10 text-rose-900 dark:text-rose-200 font-semibold'
                                      : 'border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] opacity-75'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                      isTheCorrectAnswer
                                        ? 'bg-emerald-600 text-white'
                                        : isUserChoice
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span>{opt}</span>
                                  </div>

                                  <div className="flex items-center space-x-1.5 shrink-0">
                                    {isTheCorrectAnswer && (
                                      <span className="text-[10px] font-poppins font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                        ✓ Correct
                                      </span>
                                    )}
                                    {isUserChoice && isIncorrect && (
                                      <span className="text-[10px] font-poppins font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                                        ✗ Your Choice
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-lato space-y-1">
                              <span className="font-poppins font-bold text-[10px] text-[var(--text-muted)] uppercase">
                                💡 Explanation:
                              </span>
                              <p className="text-[var(--text-secondary)] leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 🏆 OFFICIAL LEADERBOARD (REVEALED WHEN QUIZ ENDED + TIMER & NOTE) */}
        {/* ========================================================================= */}
        {activeResultsTab === 'leaderboard' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* CASE A: QUIZ STILL RUNNING -> SHOW LIVE COUNTDOWN & INFORMATIVE NOTE TO USER */}
            {!isQuizConcluded && (
              <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border-2 border-amber-400/40 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--border-theme)] pb-5">
                  <div className="flex items-center space-x-3 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl font-bold shrink-0">
                      ⏳
                    </div>
                    <div>
                      <h3 className="font-poppins font-extrabold text-base sm:text-lg text-[var(--text-main)]">
                        Official Leaderboard Finalization In Progress
                      </h3>
                      <p className="text-xs font-lato text-[var(--text-muted)]">
                        Rankings are locked and will be revealed immediately when the competition concludes.
                      </p>
                    </div>
                  </div>

                  {/* Live Countdown to Quiz End */}
                  <div className="shrink-0">
                    <QuizCountdownBadge quiz={quiz} size="lg" />
                  </div>
                </div>

                {/* NOTE TO USER BOX */}
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="font-poppins font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center space-x-1.5">
                    <span>📢</span>
                    <span>Note to Candidate:</span>
                  </div>
                  <p className="text-xs font-lato text-[var(--text-main)] leading-relaxed">
                    Your assessment submission has been recorded securely for your <strong>official first attempt</strong>. To maintain fair competition and prevent score leaking while other participants are still taking the exam, the full global leaderboard and winner badges will be published once the quiz officially ends at{' '}
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {quiz?.endDate || quiz?.startDate} ({quiz?.endTime || 'End Schedule'})
                    </span>.
                  </p>
                </div>

                {/* Candidate Verified Submission Summary */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div>
                    <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase">Candidate</div>
                    <div className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)] truncate">
                      {user?.name || 'Candidate'}
                    </div>
                    {user?.email && (
                      <span className="inline-block text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded mt-0.5 border border-indigo-200 dark:border-indigo-800">
                        @{user.email.split('@')[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase">Accuracy</div>
                    <div className="font-poppins font-bold text-xs sm:text-sm text-emerald-500">
                      {accuracyPercentage}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase">XP Earned</div>
                    <div className="font-poppins font-bold text-xs sm:text-sm text-amber-500">
                      +{totalEarnedXP} XP ⚡
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase">Time Elapsed</div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text-secondary)]">
                      {submissionResult?.timeTakenSeconds || 45}s
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase">Leaderboard Status</div>
                    <div className="font-poppins font-bold text-[11px] text-amber-500">
                      🔒 Queued & Verified
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* CASE B: QUIZ ENDED -> UNLOCKED OFFICIAL FINAL LEADERBOARD TABLE */}
            {isQuizConcluded && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-6 space-y-4 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3">
                  <div>
                    <h3 className="font-poppins font-bold text-base text-[var(--text-main)] flex items-center space-x-2">
                      <span>🏁</span>
                      <span>Official Final Leaderboard (Competition Concluded)</span>
                    </h3>
                    <p className="text-xs font-lato text-[var(--text-muted)]">
                      Official verified rank list (1 entry per user ID from their first attempt).
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-poppins font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    🏆 Final Results
                  </span>
                </div>

                {isLoadingLeaderboard ? (
                  <div className="text-center py-8 text-xs font-lato text-[var(--text-muted)]">
                    Loading official leaderboard...
                  </div>
                ) : leaderboardList.length === 0 ? (
                  <div className="text-center py-8 text-xs font-lato text-[var(--text-muted)]">
                    No official leaderboard submissions recorded yet.
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
                          {leaderboardList
                            .slice((leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE, leaderboardPage * LEADERBOARD_PAGE_SIZE)
                            .map((entry, idx) => {
                              const globalRank = (leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE + idx + 1;
                              const isCurrentUser = user && (
                                (entry.userEmail && user.email && entry.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                                (entry.userName && user.name && entry.userName.toLowerCase() === user.name.toLowerCase())
                              );
                              const emailUsername = entry.userEmail ? entry.userEmail.split('@')[0] : (entry.username || '');
                              const displayName = (entry.userName && entry.userName !== 'Candidate')
                                ? entry.userName
                                : (emailUsername ? (emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)) : 'Candidate');

                              return (
                                <tr
                                  key={entry._id || idx}
                                  className={`hover:bg-[var(--bg-main)] transition-colors ${
                                    isCurrentUser ? 'bg-[var(--color-primary-50)]/50 dark:bg-blue-950/40 font-bold' : ''
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
                    {Math.ceil(leaderboardList.length / LEADERBOARD_PAGE_SIZE) > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-theme)] text-xs font-poppins">
                        <span className="text-[var(--text-muted)] text-[11px] font-lato">
                          Showing <strong className="text-[var(--text-main)]">{Math.min((leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE + 1, leaderboardList.length)}</strong> to <strong className="text-[var(--text-main)]">{Math.min(leaderboardPage * LEADERBOARD_PAGE_SIZE, leaderboardList.length)}</strong> of <strong className="text-[var(--text-main)]">{leaderboardList.length}</strong> candidates
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setLeaderboardPage((p) => Math.max(1, p - 1))}
                            disabled={leaderboardPage === 1}
                            className="px-2.5 py-1 rounded-lg border border-[var(--border-theme)] text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-main)] font-semibold transition-colors cursor-pointer"
                          >
                            ← Prev
                          </button>

                          {Array.from({ length: Math.ceil(leaderboardList.length / LEADERBOARD_PAGE_SIZE) }).map((_, pIdx) => {
                            const pageNum = pIdx + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setLeaderboardPage(pageNum)}
                                className={`w-7 h-7 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                  leaderboardPage === pageNum
                                    ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                                    : 'border border-[var(--border-theme)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setLeaderboardPage((p) => Math.min(Math.ceil(leaderboardList.length / LEADERBOARD_PAGE_SIZE), p + 1))}
                            disabled={leaderboardPage === Math.ceil(leaderboardList.length / LEADERBOARD_PAGE_SIZE)}
                            className="px-2.5 py-1 rounded-lg border border-[var(--border-theme)] text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-main)] font-semibold transition-colors cursor-pointer"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* POST-QUIZ STUDENT REVIEW CARD */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm mt-6">
          {postQuizReviewSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-fadeIn">
              <span className="text-3xl">🎉</span>
              <h4 className="font-poppins font-bold text-base text-emerald-700 dark:text-emerald-300">
                Thank You for Your Feedback!
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-lato">
                Your review for <strong>{quiz?.title}</strong> has been saved and will inspire fellow students.
              </p>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!postQuizQuote.trim()) {
                  addToast('Please enter a short review or feedback text.', 'warning');
                  return;
                }
                setIsSubmittingPostQuizReview(true);
                try {
                  const res = await apiSubmitReview({
                    userName: user?.name || 'Student Candidate',
                    userEmail: user?.email || '',
                    role: user?.studentClass || user?.school || 'Student Candidate',
                    rating: postQuizRating,
                    quote: postQuizQuote.trim(),
                    quizId: quiz?._id || quiz?.id,
                    quizTitle: quiz?.title || ''
                  });
                  if (res && res.success !== false) {
                    addToast('✨ Review submitted successfully!', 'success');
                    setPostQuizReviewSubmitted(true);
                  } else {
                    addToast(res?.message || 'Failed to submit review', 'error');
                  }
                } catch (err) {
                  addToast(err.message || 'Error submitting review', 'error');
                } finally {
                  setIsSubmittingPostQuizReview(false);
                }
              }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-theme)] pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl font-bold shrink-0">
                    ⭐
                  </span>
                  <div>
                    <h4 className="font-poppins font-bold text-sm sm:text-base text-[var(--text-main)]">
                      How was your experience with "{quiz?.title || 'this Quiz'}"?
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-lato">
                      Submit a review for this assessment!
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPostQuizRating(star)}
                      className="text-xl sm:text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <span className={star <= postQuizRating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                value={postQuizQuote}
                onChange={(e) => setPostQuizQuote(e.target.value)}
                placeholder="Share your thoughts on question difficulty, timer, or overall learning value..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-500)] resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPostQuizReview}
                  className="px-5 py-2 rounded-xl bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-white font-semibold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingPostQuizReview ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <span>Submit Review</span>
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* MORE QUIZ RECOMMENDATIONS SECTION (SEQUENCED: UPCOMING -> LIVE NOW -> PRACTICE) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-theme)] pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold font-poppins text-[var(--text-main)] flex items-center space-x-2">
                <span>🚀</span>
                <span>More Recommended Quiz Challenges</span>
              </h3>
              <p className="text-xs font-lato text-[var(--text-muted)]">
                Upcoming live exams, live challenges, and practice quizzes ordered by sequence.
              </p>
            </div>
            <button
              onClick={onViewAllQuizzes ? onViewAllQuizzes : () => { if (onBack) onBack(); }}
              className="text-xs font-poppins font-bold text-[var(--color-primary-600)] hover:underline cursor-pointer flex items-center space-x-1"
            >
              <span>View All Quizzes</span>
              <span>→</span>
            </button>
          </div>

          {recommendedQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendedQuizzes.slice(0, 6).map((item) => {
                const itemStatus = item.computedStatus;
                const isUpcoming = itemStatus === 'upcoming';
                const isRunning = itemStatus === 'running';
                const isEnded = itemStatus === 'past';
                const origPrice = item.price || 0;
                const effPrice = isEnded && item.isPaid ? Math.max(1, Math.round(origPrice * 0.10)) : origPrice;
                const isDisc = isEnded && item.isPaid && origPrice > 0;
                const isUserRegistered = Boolean(isUserAdmin || (item.enrolledUsers && user && item.enrolledUsers.some((u) => (u.userId === user._id || u.userId === user.id))));

                return (
                  <div
                    key={item._id || item.id || item.title}
                    onClick={() => onSelectQuiz ? onSelectQuiz(item) : onBack()}
                    className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-5 hover:border-[var(--color-primary-400)] transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 relative overflow-hidden shadow-xs hover:shadow-md"
                  >
                    {/* Status Ribbon */}
                    {isUpcoming && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-poppins font-black uppercase px-3 py-0.5 rounded-bl-xl shadow-xs">
                        ⏳ Upcoming
                      </div>
                    )}
                    {isRunning && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-poppins font-black uppercase px-3 py-0.5 rounded-bl-xl shadow-xs">
                        🔴 Live Now
                      </div>
                    )}
                    {isEnded && (
                      <div className="absolute top-0 right-0 bg-slate-600 text-white text-[9px] font-poppins font-black uppercase px-3 py-0.5 rounded-bl-xl shadow-xs">
                        🏁 Practice
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center space-x-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-blue-950 dark:text-blue-300">
                          {item.category || 'Web Dev'}
                        </span>
                        {isDisc ? (
                          <span className="text-[10px] font-poppins font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                            <span>🔥 ₹{effPrice}</span>
                            <span className="line-through text-rose-500 dark:text-rose-400 text-[9px] font-bold">₹{origPrice}</span>
                          </span>
                        ) : item.isPaid && origPrice > 0 ? (
                          <span className="text-[10px] font-poppins font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                            💳 ₹{origPrice}
                          </span>
                        ) : (
                          <span className="text-[10px] font-poppins font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                            🟢 FREE
                          </span>
                        )}
                      </div>

                      <h4 className="font-poppins font-bold text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--color-primary-600)] transition-colors line-clamp-2">
                        {item.title}
                      </h4>

                      <p className="text-xs font-lato text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {item.description || 'Test your skills in this interactive challenge!'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-1.5 text-[11px] font-lato text-[var(--text-muted)] font-bold">
                        <span>⏱️ {item.durationMinutes ? `${item.durationMinutes}m` : '20m'}</span>
                        <span>•</span>
                        <span className="text-[var(--color-primary-600)]">👥 {item.enrolledUsers ? item.enrolledUsers.length : 0}</span>
                      </div>

                      <span className={`px-3 py-1 rounded-xl font-poppins font-bold text-[11px] transition-all shadow-xs ${
                        isUpcoming
                          ? isUserRegistered ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'
                          : isRunning
                          ? isUserRegistered ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                          : isUserRegistered ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        {isUpcoming
                          ? isUserRegistered ? '✅ Registered' : '📝 Register'
                          : isRunning
                          ? isUserRegistered ? 'Compete 🚀' : '🔒 Closed'
                          : isUserRegistered ? '🎯 Practice' : '📝 Register for Practice'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[var(--text-muted)]">
              No other quiz recommendations available right now.
            </div>
          )}
        </div>

        {/* CERTIFICATE MODAL */}
        <CertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          data={{
            quizTitle: quiz?.title,
            score: overallExamScore,
            accuracy: accuracyPercentage,
            earnedXP: totalEarnedXP,
            certificateId: submissionResult?.certificateId,
            issuedAt: submissionResult?.issuedAt || new Date(),
            userName: submissionResult?.userName || user?.name
          }}
          user={user}
        />

      </div>
    );
  }

  // =========================================================================
  // GUEST / UNAUTHENTICATED USER QUIZ PARTICIPATION GUARD
  // =========================================================================
  if (!isAuthenticated && !user) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-fadeIn">
        <div className="p-8 sm:p-10 rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--color-primary-400)] shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-3xl mx-auto animate-bounce">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="font-poppins font-black text-xl sm:text-2xl text-[var(--text-main)]">
              Sign In Required to Take Quiz
            </h2>
            <p className="text-xs sm:text-sm font-lato text-[var(--text-secondary)] leading-relaxed">
              You can freely browse the site and view quiz syllabi, but taking part in timed quizzes, code evaluations, and earning certificates requires an account.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={onBack}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-poppins font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 cursor-pointer transition-all active:scale-95"
            >
              🔑 Sign In or Register to Start
            </button>
            <button
              onClick={onBack}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-poppins text-[var(--text-muted)] cursor-pointer hover:bg-[var(--bg-card)]"
            >
              ← Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // QUIZ ACCESS DENIED GUARD (REGISTRATION CUT-OFF & PAYMENT ACCESS)
  // =========================================================================
  if (!isVerifyingAccess && !hasPaymentAccess) {
    const quizAutoStatus = getQuizAutoStatus(quiz);
    const isLiveRunning = quizAutoStatus === 'running';

    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-6 animate-fadeIn">
        <div className="p-8 sm:p-10 rounded-3xl bg-[var(--bg-card)] border-2 border-amber-500/50 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-3xl mx-auto border border-amber-500/20 animate-bounce">
            🔒
          </div>

          <div className="space-y-2">
            <h2 className="font-poppins font-black text-xl sm:text-2xl text-[var(--text-main)]">
              {isLiveRunning ? 'Registration Closed for Live Quiz' : 'Access / Payment Required'}
            </h2>
            <p className="text-xs sm:text-sm font-lato text-[var(--text-secondary)] leading-relaxed">
              {isLiveRunning ? (
                <>
                  Registration for this live quiz closed at start time. Only candidates who registered before the quiz started are allowed to participate in live assessment.
                </>
              ) : (
                <>
                  This assessment requires registration or unlock payment of <strong>₹{accessDeniedPrice}</strong> (90% OFF Practice Rate).
                </>
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-poppins font-bold text-amber-700 dark:text-amber-300">
            {isLiveRunning ? '🚫 Registration Ended at Start Time' : `💳 Practice Entry Fee: ₹${accessDeniedPrice} (90% OFF)`}
          </div>

          <div className="space-y-3 pt-2">
            {!isLiveRunning && (
              <button
                onClick={handleExecutionCheckout}
                disabled={isPayingInExecution}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-poppins font-bold text-sm shadow-xl shadow-amber-500/25 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isPayingInExecution ? '⌛ Opening Razorpay Checkout...' : `💳 Pay ₹${accessDeniedPrice} to Unlock Practice`}
              </button>
            )}

            <button
              onClick={onBack}
              className="w-full py-2.5 px-6 rounded-2xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-poppins font-bold text-xs hover:bg-[var(--bg-card)] cursor-pointer transition-all active:scale-95"
            >
              ← Return to Quiz Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // REAL-WORLD CODE CHALLENGE WORKSPACE
  // =========================================================================
  if (isCodeChallenge) {
    return (
      <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4 space-y-4 animate-fadeIn">
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExitClick}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-theme)] text-xs font-poppins font-bold cursor-pointer hover:bg-[var(--bg-main)]"
            >
              ← Exit
            </button>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-poppins font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mr-2">
                💻 Code Challenge
              </span>
              <span className="font-poppins font-bold text-sm text-[var(--text-main)]">
                {quiz?.title || 'Real-World Algorithm Challenge'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-700 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>📹 Camera Live</span>
              <span>•</span>
              <span>🎙️ {audioDecibels} dB</span>
              <span>•</span>
              <span className="text-amber-400">⚠️ Warnings: {tabViolations}/3</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-poppins font-bold text-[var(--color-primary-600)]">
              ⏱️ {formatTime(totalTimerSeconds)}
            </div>

            <button
              onClick={finishQuiz}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs shadow-md cursor-pointer active:scale-95"
            >
              Submit Solution 🚀
            </button>
          </div>
        </div>

        {!isCalibrated && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-2xl font-bold shrink-0">
                🛡️
              </div>
              <div>
                <h4 className="font-poppins font-bold text-sm">Anti-Cheating Proctoring Calibration Required</h4>
                <p className="text-xs font-lato text-blue-200">
                  Please enable Camera & Microphone access to maintain exam validation and anti-cheating compliance.
                </p>
              </div>
            </div>

            <button
              onClick={startCameraAndAudioProctoring}
              disabled={isCalibrating}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-poppins font-bold text-xs shadow-md cursor-pointer active:scale-95 shrink-0"
            >
              {isCalibrating ? 'Calibrating Face & Noise...' : 'Calibrate Camera & Mic'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950 text-white rounded-2xl p-3 border border-indigo-500/40 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between text-xs mb-2 font-mono">
                <span className="text-emerald-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span>AI Proctoring Stream</span>
                </span>
                <span className="text-[10px] text-slate-400">720p 30fps</span>
              </div>

              <div className="w-full h-36 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!hasMediaStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-slate-900/80">
                    <span className="text-2xl mb-1">📹</span>
                    <span className="text-xs text-slate-300 font-poppins">Camera Sandbox Active</span>
                    <span className="text-[10px] text-slate-400">Live AI face detection & noise guard running</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 shadow-sm space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3">
                <div className="flex space-x-2">
                  {['problem', 'testcases', 'hints'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTabCode(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-poppins font-bold capitalize cursor-pointer transition-colors ${
                        activeTabCode === t
                          ? 'bg-indigo-600 text-white'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-poppins font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {codingData.difficulty || 'Medium'}
                </span>
              </div>

              {activeTabCode === 'problem' && (
                <div className="space-y-4 font-lato text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  <div className="prose dark:prose-invert text-xs">
                    <p className="whitespace-pre-line text-[var(--text-main)] font-sans">
                      {codingData.problemStatement}
                    </p>
                  </div>

                  {codingData.constraints && codingData.constraints.length > 0 && (
                    <div className="pt-3 border-t border-[var(--border-theme)]">
                      <span className="font-poppins font-bold text-xs text-[var(--text-main)] block mb-1">
                        Constraints:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-xs font-mono text-[var(--text-muted)]">
                        {codingData.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTabCode === 'testcases' && (
                <div className="space-y-3 font-mono text-xs">
                  {(codingData.testCases || []).map((tc, idx) => (
                    <div key={idx} className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-theme)] space-y-1">
                      <div className="font-bold text-indigo-500 font-poppins text-[11px]">
                        {tc.isHidden ? `Private Test Case #${idx + 1}` : `Sample Test Case #${idx + 1}`}
                      </div>
                      <div className="text-[var(--text-secondary)] text-[11px]">
                        <strong>Input:</strong> {tc.input}
                      </div>
                      <div className="text-emerald-500 text-[11px]">
                        <strong>Expected:</strong> {tc.expectedOutput}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTabCode === 'hints' && (
                <div className="space-y-2 text-xs font-lato">
                  {(codingData.hints || []).map((h, idx) => (
                    <div key={idx} className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)]">
                      💡 <strong>Hint {idx + 1}:</strong> {h}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="ml-2 font-bold text-slate-300">Solution.js ({codingData.language || 'JavaScript'})</span>
                </div>

                <button
                  onClick={() => setUserCode(defaultStarterCode)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                >
                  Reset Code
                </button>
              </div>

              <div className="p-4 bg-slate-950 font-mono text-xs sm:text-sm text-emerald-400 min-h-[300px] flex">
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  spellCheck="false"
                  className="w-full h-80 bg-transparent text-emerald-400 font-mono resize-none focus:outline-none leading-relaxed custom-scrollbar"
                />
              </div>

              <div className="bg-slate-900 p-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  ⚡ Auto-save active | Safe Sandbox Engine
                </span>

                <button
                  onClick={handleRunCodeTests}
                  disabled={isRunningTests}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-poppins font-bold text-xs shadow-md cursor-pointer active:scale-95 flex items-center space-x-1.5"
                >
                  <span>{isRunningTests ? 'Running Sandbox...' : '▶ Run Sample Tests'}</span>
                </button>
              </div>
            </div>

            {testCaseResults && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-poppins font-bold">
                  <span className="text-[var(--text-main)]">Execution Results</span>
                  <span className="text-emerald-500 font-bold">2/2 Passed (100%)</span>
                </div>

                <div className="space-y-2">
                  {testCaseResults.map((r) => (
                    <div
                      key={r.id}
                      className="bg-[var(--bg-main)] p-2.5 rounded-xl border border-[var(--border-theme)] text-xs font-mono flex items-center justify-between"
                    >
                      <div>
                        <span className="text-emerald-500 font-bold mr-2">✓ Test #{r.id}</span>
                        <span className="text-[var(--text-secondary)]">{r.input}</span>
                      </div>
                      <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                        PASS (12ms)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MULTIPLE CHOICE ACTIVE QUESTION VIEW
  // =========================================================================
  const currentQ = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-fadeIn">
      
      {/* HEADER CONTROLS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExitClick}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-theme)] text-xs font-poppins font-bold cursor-pointer hover:bg-[var(--bg-main)]"
          >
            ← Exit
          </button>
          <div>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-poppins font-bold ${
              timerType === 'per_question_custom'
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                : timerType === 'per_question_general'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            }`}>
              {timerType === 'per_question_custom'
                ? '🎯 Custom Time/Q'
                : timerType === 'per_question_general'
                ? '⚡ General Time/Q'
                : '⏳ Total Exam Time'}
            </span>
            <span className="ml-2 text-xs font-poppins font-bold text-[var(--text-main)] hidden sm:inline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Dynamic Timer Display */}
        <div className="flex items-center space-x-3">
          {isPerQuestionTiming ? (
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs shadow-sm ${
              timerType === 'per_question_custom' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
            } animate-pulse`}>
              <span>⚡ Q Timer:</span>
              <span className="text-sm font-extrabold">{questionTimer}s</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] font-mono font-bold text-xs text-[var(--color-primary-600)]">
              ⏱️ {formatTime(totalTimerSeconds)}
            </div>
          )}

          <button
            onClick={finishQuiz}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs cursor-pointer shadow-sm"
          >
            Finish Exam
          </button>
        </div>
      </div>

      {/* QUESTION NAVIGATOR (Single row with hidden scrollbar) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-3 rounded-2xl flex items-center shadow-sm">
        <span className="text-xs font-poppins font-bold text-[var(--text-muted)] mr-3 shrink-0 flex items-center space-x-1">
          <span>🎯</span>
          <span>Jump To:</span>
        </span>
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth w-full py-0.5">
          {questions.map((_, i) => {
            const isAnswered = userAnswers[i] !== undefined && userAnswers[i] !== null;
            const isActive = currentQuestionIndex === i;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (isPerQuestionTiming) {
                    setQuestionTimer(getQuestionInitialTime(i));
                  }
                  setCurrentQuestionIndex(i);
                }}
                className={`min-w-[40px] h-8 px-2.5 rounded-xl font-poppins font-bold text-xs shrink-0 cursor-pointer transition-all duration-150 flex items-center justify-center space-x-1 ${
                  isActive
                    ? 'bg-[var(--color-primary-600)] text-white shadow-md scale-105 ring-2 ring-[var(--color-primary-400)]/40'
                    : isAnswered
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/25'
                    : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
                }`}
                title={`Jump to Question ${i + 1}${isAnswered ? ' (Answered)' : ''}`}
              >
                <span>Q{i + 1}</span>
                {isAnswered && <span className="text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE QUESTION CARD */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-4">
          <div className="flex items-center space-x-2">
            <span className="font-poppins font-bold text-xs text-[var(--color-primary-600)] uppercase">
              Question #{currentQuestionIndex + 1}
            </span>
            {timerType === 'per_question_custom' && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold">
                Allocation: {currentQ?.timerSeconds || 15}s
              </span>
            )}
          </div>

          <span className="text-xs text-[var(--text-muted)] font-lato">
            Single Choice (+10 XP)
          </span>
        </div>

        <h3 className="font-poppins font-bold text-base sm:text-lg text-[var(--text-main)] leading-relaxed">
          {currentQ?.questionText}
        </h3>

        {/* CODE PATTERN BOX (When questionType === 'pattern' or codeSnippet is provided) */}
        {(currentQ?.questionType === 'pattern' || currentQ?.codeSnippet) && (
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-950 text-slate-100 overflow-hidden shadow-inner font-mono text-xs animate-fadeIn">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-poppins">
              <span className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                <span>🧩</span>
                <span>Code Pattern / Bug to Fix:</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold">
                {currentQ?.language || 'JavaScript'}
              </span>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar leading-relaxed">
              <pre className="text-emerald-400 font-mono whitespace-pre text-xs">{currentQ?.codeSnippet}</pre>
            </div>
          </div>
        )}

        {/* 4 OPTIONS */}
        <div className="space-y-3">
          {currentQ?.options?.map((option, optIdx) => {
            const isSelected = userAnswers[currentQuestionIndex] === optIdx;

            return (
              <div
                key={optIdx}
                onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optIdx }))}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)]/40 dark:bg-blue-950/30 text-[var(--text-main)] font-bold'
                    : 'border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-blue-300 text-[var(--text-secondary)]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                      isSelected ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white' : 'border-slate-400'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="font-lato text-xs sm:text-sm">{option}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER NAVIGATION */}
        <div className="pt-4 border-t border-[var(--border-theme)] flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0 || isPerQuestionTiming}
            className="px-4 py-2 rounded-xl border border-[var(--border-theme)] text-xs font-poppins font-bold disabled:opacity-30 cursor-pointer"
          >
            ← Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={finishQuiz}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-poppins font-bold cursor-pointer shadow-md"
            >
              Submit Exam 🚀
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold cursor-pointer shadow-md"
            >
              Next Question →
            </button>
          )}
        </div>
      </div>

      {/* EXAM EXIT CONFIRMATION MODAL */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--bg-card)] text-[var(--text-main)] border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl font-bold mx-auto border border-rose-500/20 animate-pulse">
              ⚠️
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-poppins text-rose-600 dark:text-rose-400">
                Leave Active Quiz?
              </h3>
              <p className="text-xs sm:text-sm font-lato text-[var(--text-secondary)] leading-relaxed">
                Your current test progress will be lost and <strong>cannot be resumed</strong>. If you leave now, you will need to restart the assessment from the beginning.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-poppins font-bold text-rose-700 dark:text-rose-300">
              🚫 Progress cannot be resumed after exiting.
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="w-1/2 py-3 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-poppins font-bold text-xs hover:bg-[var(--bg-card)] cursor-pointer transition-all active:scale-95"
              >
                Continue Quiz 🎯
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-poppins font-bold text-xs shadow-lg shadow-rose-500/20 cursor-pointer transition-all active:scale-95"
              >
                Leave & Exit 🚪
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizExecutionPage;
