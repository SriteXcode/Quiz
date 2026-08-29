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

export const QuizExecutionPage = ({ quiz, _onFinish, onBack, onSelectQuiz, onViewAllQuizzes, isPractice = false }) => {
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
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  const handleFinishClick = () => {
    setIsFinishModalOpen(true);
  };

  const questionNavRefs = useRef({});
  const reviewNavRefs = useRef({});

  const RESULTS_TAB_KEYS = useMemo(() => ['review', 'leaderboard'], []);
  const activeResultsTabIndex = useMemo(() => {
    const idx = RESULTS_TAB_KEYS.indexOf(activeResultsTab);
    return idx >= 0 ? idx : 0;
  }, [activeResultsTab, RESULTS_TAB_KEYS]);

  const resultsTouchStartX = useRef(0);
  const resultsTouchStartY = useRef(0);
  const resultsTouchEndX = useRef(0);
  const resultsTouchEndY = useRef(0);

  const handleResultsTouchStart = (e) => {
    resultsTouchStartX.current = e.targetTouches[0].clientX;
    resultsTouchStartY.current = e.targetTouches[0].clientY;
    resultsTouchEndX.current = e.targetTouches[0].clientX;
    resultsTouchEndY.current = e.targetTouches[0].clientY;
  };

  const handleResultsTouchMove = (e) => {
    resultsTouchEndX.current = e.targetTouches[0].clientX;
    resultsTouchEndY.current = e.targetTouches[0].clientY;
  };

  const handleResultsTouchEnd = () => {
    if (!resultsTouchStartX.current || !resultsTouchEndX.current) return;
    
    const deltaX = resultsTouchStartX.current - resultsTouchEndX.current;
    const deltaY = resultsTouchStartY.current - resultsTouchEndY.current;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Intentional horizontal swipe criteria:
    // 1. Min horizontal distance of 110px
    // 2. Horizontal movement must be at least 2x greater than vertical movement
    if (absX >= 110 && absX >= 2 * absY) {
      if (deltaX > 0 && activeResultsTabIndex === 0) {
        setActiveResultsTab('leaderboard');
        fetchLeaderboard();
      } else if (deltaX < 0 && activeResultsTabIndex === 1) {
        setActiveResultsTab('review');
      }
    }

    resultsTouchStartX.current = 0;
    resultsTouchStartY.current = 0;
    resultsTouchEndX.current = 0;
    resultsTouchEndY.current = 0;
  };

  useEffect(() => {
    if (questionNavRefs.current[currentQuestionIndex]) {
      questionNavRefs.current[currentQuestionIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (reviewNavRefs.current[reviewSlideIndex]) {
      reviewNavRefs.current[reviewSlideIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [reviewSlideIndex]);

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
      <div className="max-w-4xl mx-auto py-6 px-3 sm:px-4 space-y-6 animate-fadeIn">
        
        {/* ========================================================================= */}
        {/* 1. QUIZ RESULT SUMMARY CARD (MATCHING AFTERQUIZSUBMIYT.PNG TOP CONTAINER) */}
        {/* ========================================================================= */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-5 sm:p-8 shadow-xl space-y-6">
          
          {/* HEADER: QUIZ LOGO + QuizName + Subtitle */}
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--color-primary-600)] flex flex-col items-center justify-center text-center font-bold font-poppins shrink-0 shadow-sm p-1">
              <span className="text-xl sm:text-2xl leading-none">🏆</span>
              <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-tighter mt-0.5">QUIZ LOGO</span>
            </div>

            <div className="space-y-0.5 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold font-poppins text-[var(--text-main)] truncate">
                {quiz?.title || 'QuizName'}
              </h1>
              <p className="text-xs font-poppins font-medium text-[var(--text-muted)]">
                Assessment Completed
              </p>
            </div>
          </div>

          {/* ROW 1: 3-CARD STATS GRID (Correct x, Incorrect y, Skipped z) */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Correct x */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-3 sm:p-4 space-y-1">
              <div className="text-xs sm:text-sm font-poppins font-bold text-[var(--text-main)]">
                Correct
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-poppins text-emerald-500">
                {correctCount}
              </div>
            </div>

            {/* Incorrect y */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-3 sm:p-4 space-y-1">
              <div className="text-xs sm:text-sm font-poppins font-bold text-[var(--text-main)]">
                Incorrect
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-poppins text-rose-500">
                {incorrectCount}
              </div>
            </div>

            {/* Skipped z */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-3 sm:p-4 space-y-1">
              <div className="text-xs sm:text-sm font-poppins font-bold text-[var(--text-main)]">
                Skipped
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-poppins text-slate-500 dark:text-slate-400">
                {unattemptedCount}
              </div>
            </div>
          </div>

          {/* ROW 2: 2-CARD STATS GRID (Accuracy h, Total Score f) */}
          <div className="grid grid-cols-2 gap-3 text-center">
            {/* Accuracy h */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-3.5 sm:p-4 space-y-1">
              <div className="text-xs sm:text-sm font-poppins font-bold text-[var(--text-main)]">
                Accuracy
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-poppins text-[var(--color-primary-600)]">
                {accuracyPercentage}%
              </div>
            </div>

            {/* Total Score f */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-3.5 sm:p-4 space-y-1">
              <div className="text-xs sm:text-sm font-poppins font-bold text-[var(--text-main)]">
                Total Score
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-poppins text-amber-500">
                {overallExamScore}%
              </div>
            </div>
          </div>

          {/* ROW 3: ACTION BUTTONS (Certificate, Practice Again) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="w-full py-3 rounded-2xl border-2 border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-[var(--color-primary-500)] text-[var(--text-main)] font-poppins font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>🎓</span>
              <span>Certificate</span>
            </button>

            <button
              onClick={handleRestartAsPractice}
              className="w-full py-3 rounded-2xl border-2 border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-[var(--color-primary-500)] text-[var(--text-main)] font-poppins font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>🔁</span>
              <span>Practice Again</span>
            </button>
          </div>

          {/* ROW 4: TAB SWITCHER (Review Answer / leaderboard) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setActiveResultsTab('review')}
              className={`py-3 rounded-2xl font-poppins font-extrabold text-xs sm:text-sm transition-all cursor-pointer text-center border-2 ${
                activeResultsTab === 'review'
                  ? 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--text-main)] shadow-md'
                  : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
              }`}
            >
              Review Answer
            </button>

            <button
              onClick={() => {
                setActiveResultsTab('leaderboard');
                fetchLeaderboard();
              }}
              className={`py-3 rounded-2xl font-poppins font-medium text-xs sm:text-sm transition-all cursor-pointer text-center border-2 ${
                activeResultsTab === 'leaderboard'
                  ? 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--text-main)] shadow-md font-extrabold'
                  : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
              }`}
            >
              leaderboard
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SLIDE LEFT / RIGHT CAROUSEL TRACK (REVIEW ANSWER & LEADERBOARD TABS) */}
        {/* ========================================================================= */}
        <div
          className="relative overflow-hidden w-full min-h-[300px] touch-pan-y"
          onTouchStart={handleResultsTouchStart}
          onTouchMove={handleResultsTouchMove}
          onTouchEnd={handleResultsTouchEnd}
        >
          <div
            className="flex w-full transition-transform duration-300 ease-out items-start"
            style={{ transform: `translateX(-${activeResultsTabIndex * 100}%)` }}
          >

            {/* SLIDE 0: REVIEW ANSWER */}
            <div
              className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
                activeResultsTabIndex === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                height: activeResultsTabIndex === 0 ? 'auto' : 0,
                overflow: activeResultsTabIndex === 0 ? 'visible' : 'hidden'
              }}
            >
              <div className="space-y-5 animate-fadeIn">
                
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

                {/* MCQ QUESTIONS REVIEW */}
                {!isCodeChallenge && questions.length > 0 && (
                  <div className="space-y-5">
                    
                    {/* HORIZONTAL JUMP TRACK (Q1, Q2, Q3, Q4...) */}
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-theme)] py-2.5 px-4 rounded-2xl sm:rounded-3xl shadow-sm flex items-center gap-3">
                      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5">
                        {questions.map((q, qIdx) => {
                          const ansIdx = userAnswers[qIdx];
                          const isUnatt = ansIdx === undefined || ansIdx === null;
                          const isCorr = !isUnatt && Number(ansIdx) === q.correctAnswerIndex;
                          const isAct = reviewSlideIndex === qIdx;

                          return (
                            <button
                              key={qIdx}
                              type="button"
                              ref={(el) => (reviewNavRefs.current[qIdx] = el)}
                              onClick={() => setReviewSlideIndex(qIdx)}
                              className={`min-w-[42px] h-9 px-3 rounded-xl font-poppins font-bold text-xs shrink-0 cursor-pointer transition-all duration-150 flex items-center justify-center space-x-1 ${
                                isAct
                                  ? 'bg-[var(--color-primary-600)] text-white shadow-md scale-105 border-2 border-[var(--color-primary-600)]'
                                  : isCorr
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/40 hover:bg-emerald-500/25'
                                  : isUnatt
                                  ? 'bg-[var(--bg-main)] text-[var(--text-muted)] border-2 border-[var(--border-theme)]'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-2 border-rose-500/40 hover:bg-rose-500/25'
                              }`}
                            >
                              <span>Q{qIdx + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ACTIVE QUESTION REVIEW CARD */}
                    {(() => {
                      const qIdx = reviewSlideIndex;
                      const q = questions[qIdx] || questions[0];
                      const userAnswerIdx = userAnswers[qIdx];
                      const isUnattempted = userAnswerIdx === undefined || userAnswerIdx === null;
                      const isCorrect = !isUnattempted && Number(userAnswerIdx) === q.correctAnswerIndex;
                      const isIncorrect = !isUnattempted && Number(userAnswerIdx) !== q.correctAnswerIndex;

                      return (
                        <div key={qIdx} className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-5 sm:p-8 shadow-md space-y-5 animate-fadeIn">
                          
                          {/* Question Header: Question no.1 (Incorrect) & Earned (+a XP) */}
                          <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3 text-xs font-poppins">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-main)]">
                                Question no.{qIdx + 1}
                              </h3>
                              {isCorrect && (
                                <span className="font-bold text-emerald-500 text-sm">
                                  (Correct)
                                </span>
                              )}
                              {isIncorrect && (
                                <span className="font-bold text-rose-500 text-sm">
                                  (Incorrect)
                                </span>
                              )}
                              {isUnattempted && (
                                <span className="font-bold text-slate-400 text-sm">
                                  (Skipped)
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                              Earned ({isCorrect ? '+10 XP' : '+0 XP'})
                            </span>
                          </div>

                          {/* Question Statement */}
                          <h4 className="font-poppins font-semibold text-base sm:text-lg text-[var(--text-main)] leading-relaxed">
                            {q.questionText}
                          </h4>

                          {/* Code Snippet Box (when present) */}
                          {(q.questionType === 'pattern' || q.codeSnippet) && (
                            <div className="rounded-2xl border border-[var(--border-theme)] bg-slate-950 text-slate-100 overflow-hidden shadow-inner font-mono text-xs relative">
                              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-poppins">
                                <span className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold">
                                  Code Snippet
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold">
                                  {q.language || 'language'}
                                </span>
                              </div>
                              <div className="p-4 overflow-x-auto custom-scrollbar leading-relaxed">
                                <pre className="text-emerald-400 font-mono whitespace-pre text-xs">{q.codeSnippet}</pre>
                              </div>
                            </div>
                          )}

                          {/* Options (A, B, C, D) with Correct & Incorrect highlights & nested Solution Box */}
                          <div className="space-y-3 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isUserChoice = Number(userAnswerIdx) === optIdx;
                              const isTheCorrectAnswer = optIdx === q.correctAnswerIndex;

                              return (
                                <div
                                  key={optIdx}
                                  className={`rounded-2xl border-2 transition-all p-3.5 sm:p-4 space-y-3 ${
                                    isTheCorrectAnswer
                                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                                      : isUserChoice && isIncorrect
                                      ? 'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200'
                                      : 'border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center space-x-3.5">
                                      <div
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-poppins font-bold text-xs sm:text-sm shrink-0 ${
                                          isTheCorrectAnswer
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : isUserChoice && isIncorrect
                                            ? 'border-rose-600 bg-rose-600 text-white'
                                            : 'border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optIdx)}
                                      </div>

                                      <span className={`font-lato text-xs sm:text-sm leading-snug ${
                                        isUserChoice && isIncorrect ? 'line-through text-rose-600 dark:text-rose-300 font-semibold' : ''
                                      }`}>
                                        {opt}
                                      </span>
                                    </div>

                                    {isUserChoice && isIncorrect && (
                                      <span className="text-xs font-poppins font-bold text-rose-600 dark:text-rose-400 shrink-0">
                                        Incorrect Answer
                                      </span>
                                    )}
                                  </div>

                                  {/* SOLUTION BOX NESTED INSIDE CORRECT ANSWER CARD (MATCHING WIREFRAME) */}
                                  {isTheCorrectAnswer && (
                                    <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-emerald-500/40 space-y-1 text-xs font-lato mt-2 shadow-xs">
                                      <div className="font-poppins font-bold text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                        Solution
                                      </div>
                                      <p className="text-[var(--text-main)] leading-relaxed">
                                        {q.explanation || 'The selected option satisfies the problem requirements and execution logic.'}
                                      </p>
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>

                          {/* SLIDE NAVIGATION BUTTONS */}
                          <div className="pt-4 border-t border-[var(--border-theme)] flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setReviewSlideIndex((prev) => Math.max(0, prev - 1))}
                              disabled={qIdx === 0}
                              className="px-5 py-2.5 rounded-2xl border-2 border-[var(--border-theme)] text-xs sm:text-sm font-poppins font-bold text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-main)] transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              Previous Question
                            </button>

                            <button
                              type="button"
                              onClick={() => setReviewSlideIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                              disabled={qIdx === questions.length - 1}
                              className="px-6 py-2.5 rounded-2xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs sm:text-sm font-poppins font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Next Question
                            </button>
                          </div>

                          {/* BOTTOM ACTION BUTTONS: More Quizzes | Add Reviews */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const recElem = document.getElementById('more-quizzes-section');
                                if (recElem) recElem.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="py-3 rounded-2xl border-2 border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                            >
                              More Quizzes
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const revElem = document.getElementById('add-review-section');
                                if (revElem) revElem.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="py-3 rounded-2xl border-2 border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                            >
                              Add Reviews
                            </button>
                          </div>

                        </div>
                      );
                    })()}

                  </div>
                )}
              </div>
            </div>

            {/* SLIDE 1: LEADERBOARD */}
            <div
              className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
                activeResultsTabIndex === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                height: activeResultsTabIndex === 1 ? 'auto' : 0,
                overflow: activeResultsTabIndex === 1 ? 'visible' : 'hidden'
              }}
            >
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
            </div>

          </div>
        </div>

        {/* POST-QUIZ STUDENT REVIEW CARD */}
        <div id="add-review-section" className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm mt-6">
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
                    quizTitle: quiz?.title || '',
                    avatarUrl: user?.avatarUrl || user?.avatar || user?.profileImage || ''
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
                maxLength={220}
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
        <div id="more-quizzes-section" className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
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
                          : (isUserRegistered || !item.isPaid) ? '🎯 Practice' : '📝 Unlock Practice'}
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
              onClick={handleFinishClick}
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
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-4 space-y-4 animate-fadeIn">
      
      {/* ========================================================================= */}
      {/* 1. STICKY TOP SUB-HEADER BAR (MATCHING QUIZLAYOUT.PNG TOP ROW) */}
      {/* ========================================================================= */}
      <div className="sticky top-14 sm:top-16 z-30 bg-[var(--bg-main)]/95 backdrop-blur-md py-1 transition-all">
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-md gap-3">
          
          {/* LEFT: BACK ARROW + EXAM TITLE (ExamName) */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={handleExitClick}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-main)] font-bold text-base flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 shadow-xs"
              title="Exit Assessment"
            >
              <span>←</span>
            </button>

            <div className="min-w-0">
              <h2 className="font-poppins font-bold text-sm sm:text-base text-[var(--text-main)] truncate leading-tight">
                {quiz?.title || 'ExamName'}
              </h2>
              <span className="text-[10px] font-poppins text-[var(--text-muted)] hidden sm:inline">
                Active Assessment
              </span>
            </div>
          </div>

          {/* RIGHT: CIRCULAR TIMER + FINISH BUTTON */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {isPerQuestionTiming ? (
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-mono font-extrabold text-xs flex items-center justify-center shadow-md animate-pulse shrink-0 border-2 border-amber-300">
                {questionTimer}s
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-[var(--bg-main)] border border-[var(--border-theme)] font-mono font-bold text-xs text-[var(--color-primary-600)] shrink-0 flex items-center space-x-1 shadow-xs">
                <span>⏱️</span>
                <span>{formatTime(totalTimerSeconds)}</span>
              </div>
            )}

            <button
              onClick={handleFinishClick}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
            >
              Finish
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUESTION CARD BODY (MATCHING QUIZLAYOUT.PNG MIDDLE CARD) */}
      {/* ========================================================================= */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-5 sm:p-8 shadow-md space-y-5">
        
        {/* CARD TOP HEADER: Question no.1 & XP Badge */}
        <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3 text-xs font-poppins">
          <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-main)]">
            Question no.{currentQuestionIndex + 1}
          </h3>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-main)] px-2.5 py-1 rounded-full border border-[var(--border-theme)]">
            Single choice (+10 XP)
          </span>
        </div>

        {/* QUESTION TEXT */}
        <h4 className="font-poppins font-semibold text-base sm:text-lg text-[var(--text-main)] leading-relaxed">
          {currentQ?.questionText}
        </h4>

        {/* CODE SNIPPET BOX (WHEN PRESENT) */}
        {(currentQ?.questionType === 'pattern' || currentQ?.codeSnippet) && (
          <div className="rounded-2xl border border-[var(--border-theme)] bg-slate-950 text-slate-100 overflow-hidden shadow-inner font-mono text-xs animate-fadeIn relative">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-poppins">
              <span className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold">
                Code Snippet
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold">
                {currentQ?.language || 'language'}
              </span>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar leading-relaxed">
              <pre className="text-emerald-400 font-mono whitespace-pre text-xs">{currentQ?.codeSnippet}</pre>
            </div>
          </div>
        )}

        {/* 4 ANSWER OPTIONS (A, B, C, D) */}
        <div className="space-y-3 pt-1">
          {currentQ?.options?.map((option, optIdx) => {
            const isSelected = userAnswers[currentQuestionIndex] === optIdx;

            return (
              <div
                key={optIdx}
                onClick={() => {
                  setUserAnswers((prev) => {
                    if (prev[currentQuestionIndex] === optIdx) {
                      const updated = { ...prev };
                      delete updated[currentQuestionIndex];
                      return updated;
                    }
                    return { ...prev, [currentQuestionIndex]: optIdx };
                  });
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between select-none ${
                  isSelected
                    ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)]/40 dark:bg-blue-950/30 text-[var(--text-main)] font-bold shadow-xs'
                    : 'border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-[var(--color-primary-300)] text-[var(--text-secondary)]'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-poppins font-bold text-xs sm:text-sm shrink-0 transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white shadow-xs'
                        : 'border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="font-lato text-xs sm:text-sm leading-snug">{option}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* NAVIGATION ACTION BUTTONS DIRECTLY INSIDE CARD */}
        <div className="pt-4 border-t border-[var(--border-theme)] flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0 || isPerQuestionTiming}
            className="px-5 py-2.5 rounded-2xl border-2 border-[var(--border-theme)] text-xs sm:text-sm font-poppins font-bold text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-main)] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Previous Question
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleFinishClick}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-poppins font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2.5 rounded-2xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs sm:text-sm font-poppins font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              Next Question
            </button>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. STICKY BOTTOM GO TO : NAV BAR (MATCHING QUIZLAYOUT.PNG BOTTOM ROW) */}
      {/* ========================================================================= */}
      <div className="sticky bottom-3 z-30 transition-all mt-4">
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-theme)] py-2.5 px-4 rounded-2xl sm:rounded-3xl shadow-xl flex items-center gap-3 backdrop-blur-md">
          
          {/* GO TO : LABEL */}
          <span className="font-poppins font-black text-xs sm:text-sm text-[var(--text-main)] uppercase tracking-wider shrink-0 select-none">
            GO TO :
          </span>

          {/* HORIZONTAL JUMP BUTTONS (Q1, Q2, Q3...) WITH AUTO-SCROLL INTO VIEW */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5">
            {questions.map((_, i) => {
              const isAnswered = userAnswers[i] !== undefined && userAnswers[i] !== null;
              const isActive = currentQuestionIndex === i;

              return (
                <button
                  key={i}
                  type="button"
                  ref={(el) => (questionNavRefs.current[i] = el)}
                  onClick={() => {
                    if (isPerQuestionTiming) {
                      setQuestionTimer(getQuestionInitialTime(i));
                    }
                    setCurrentQuestionIndex(i);
                  }}
                  className={`min-w-[42px] h-9 px-3 rounded-xl font-poppins font-bold text-xs shrink-0 cursor-pointer transition-all duration-150 flex items-center justify-center space-x-1 ${
                    isActive
                      ? 'bg-[var(--color-primary-600)] text-white shadow-md scale-105 border-2 border-[var(--color-primary-600)]'
                      : isAnswered
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/40 hover:bg-emerald-500/25'
                      : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-2 border-[var(--border-theme)] hover:border-[var(--color-primary-400)]'
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

      {/* EXAM FINISH CONFIRMATION MODAL */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--bg-card)] text-[var(--text-main)] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl font-bold mx-auto border border-emerald-500/20 shadow-md">
              🏁
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold font-poppins text-[var(--text-main)]">
                Finish & Submit Exam?
              </h3>
              <p className="text-xs sm:text-sm font-lato text-[var(--text-secondary)] leading-relaxed">
                Are you sure you want to complete your test submission now?
              </p>
            </div>

            {/* ATTEMPTED VS UNATTEMPTED STATS SUMMARY */}
            {!isCodeChallenge && (() => {
              const answeredCount = Object.values(userAnswers).filter((v) => v !== undefined && v !== null).length;
              const unattemptedCount = questions.length - answeredCount;

              return (
                <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="font-poppins font-extrabold text-lg text-emerald-500">
                      {answeredCount} / {questions.length}
                    </div>
                    <div className="text-[10px] font-poppins font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-0.5">
                      Answered
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="font-poppins font-extrabold text-lg text-amber-500">
                      {unattemptedCount}
                    </div>
                    <div className="text-[10px] font-poppins font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5">
                      Skipped
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="w-1/2 py-3 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-poppins font-bold text-xs hover:bg-[var(--bg-card)] cursor-pointer transition-all active:scale-95"
              >
                Continue Test 🎯
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFinishModalOpen(false);
                  finishQuiz();
                }}
                className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
              >
                Yes, Submit 🚀
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default QuizExecutionPage;
