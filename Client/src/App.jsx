import { useState, useEffect, useRef, lazy, Suspense } from 'react';
// Reusable Layout & Showcase Components
import Navbar from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { LiveQuizzes } from './components/LiveQuizzes';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import PwaInstallCard from './components/PwaInstallCard';
import InitialLogoLoader from './components/InitialLogoLoader';
import GlobalNetworkBanner from './components/GlobalNetworkBanner';
import { CodeSyntaxBackgroundTexture } from './components/CodeSyntaxBackgroundTexture';
import { PageSkeletonLoader } from './components/Skeleton';

// Dynamic Lazy-Loaded Pages, Subsystems & Below-the-Fold Components
const PartnersSection = lazy(() => import('./components/PartnersSection').then(m => ({ default: m.PartnersSection })));
const PreviousWorks = lazy(() => import('./components/PreviousWorks').then(m => ({ default: m.PreviousWorks })));
const ReviewSection = lazy(() => import('./components/ReviewSection').then(m => ({ default: m.ReviewSection })));
const UniversalReviewModal = lazy(() => import('./components/UniversalReviewModal'));
const QuizDetailPage = lazy(() => import('./pages/QuizDetailPage'));
const QuizExecutionPage = lazy(() => import('./pages/QuizExecutionPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ShortGyaanPage = lazy(() => import('./pages/ShortGyaanPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const NetworkErrorPage = lazy(() => import('./pages/NetworkErrorPage'));
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));

// Services & Utils
import { apiGetQuizzes, request } from './services/api';
import { getQuizAutoStatus } from './utils/dateUtils';
import { syncPendingOfflineActions } from './utils/offlineSync';
import { updatePageSEO } from './utils/seoHelper';

// Contexts
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

// URL Route Parser & Path Resolver
const resolveRouteFromPathname = () => {
  if (typeof window === 'undefined') return { tab: 'home', policy: null };
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  
  if (path === '/' || path === '/home') return { tab: 'home', policy: null };
  if (path === '/quiz' || path === '/quizzes') return { tab: 'quiz', policy: null };
  if (path === '/about') return { tab: 'about', policy: null };
  if (path === '/profile') return { tab: 'profile', policy: null };
  if (path === '/contact') return { tab: 'contact', policy: null };
  if (path === '/admin') return { tab: 'admin', policy: null };
  if (path === '/short-gyaan' || path === '/shorts' || path === '/shorts-gyaan') return { tab: 'short-gyaan', policy: null };
  if (path === '/login') return { tab: 'login', policy: null };
  if (path === '/signup') return { tab: 'signup', policy: null };
  if (path === '/privacy') return { tab: 'home', policy: 'privacy' };
  if (path === '/terms') return { tab: 'home', policy: 'terms' };
  if (path === '/cancellation') return { tab: 'home', policy: 'cancellation' };
  if (path === '/refund') return { tab: 'home', policy: 'refund' };

  // Fallback to localStorage or home
  const savedTab = localStorage.getItem('quiz_platform_active_tab') || 'home';
  const savedPolicy = localStorage.getItem('quiz_platform_active_policy') || null;
  return { tab: savedTab, policy: savedPolicy };
};

export const App = () => {
  const [isInitialAppLoading, setIsInitialAppLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const initialRoute = resolveRouteFromPathname();

  const [activeTab, setActiveTab] = useState(() => initialRoute.tab);
  const [activePolicy, setActivePolicy] = useState(() => initialRoute.policy);

  const [selectedQuiz, setSelectedQuiz] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz_platform_selected_quiz');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isExecutingQuiz, setIsExecutingQuiz] = useState(() => {
    return localStorage.getItem('quiz_platform_is_executing') === 'true';
  });
  const [isPracticeMode, setIsPracticeMode] = useState(() => {
    return localStorage.getItem('quiz_platform_is_practice') === 'true';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGlobalReviewModalOpen, setIsGlobalReviewModalOpen] = useState(false);

  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const { addToast } = useToast();

  // Synchronize Browser Address Bar URL Path with App State
  useEffect(() => {
    let targetPath;
    if (activePolicy) {
      targetPath = `/${activePolicy}`;
    } else if (isExecutingQuiz && selectedQuiz) {
      targetPath = '/quiz/execution';
    } else if (selectedQuiz) {
      targetPath = '/quiz/detail';
    } else if (activeTab === 'home') {
      targetPath = '/';
    } else {
      targetPath = `/${activeTab}`;
    }

    if (window.location.pathname.toLowerCase() !== targetPath.toLowerCase()) {
      window.history.pushState({ tab: activeTab, policy: activePolicy }, '', targetPath);
    }
  }, [activeTab, activePolicy, selectedQuiz, isExecutingQuiz]);

  useEffect(() => {
    const handlePopState = () => {
      if (isExecutingQuiz) {
        const confirmLeave = window.confirm(
          '⚠️ Are you sure you want to leave this quiz?\n\nYour current progress will be lost and cannot be resumed. If you leave now, you will need to restart the assessment from the beginning.'
        );
        if (confirmLeave) {
          setIsExecutingQuiz(false);
          setSelectedQuiz(null);
          setIsPracticeMode(false);
          addToast('Quiz exited. Progress reset.', 'info');
        } else {
          window.history.pushState({ page: activeTab }, '', window.location.href);
          return;
        }
      }

      const route = resolveRouteFromPathname();
      setActiveTab(route.tab);
      setActivePolicy(route.policy);
      if (route.tab !== 'quiz' && route.tab !== 'login' && route.tab !== 'signup') {
        setSelectedQuiz(null);
        setIsExecutingQuiz(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, isExecutingQuiz, addToast]);

  useEffect(() => {
    if (!isAuthLoading) {
      const timer = setTimeout(() => {
        setIsInitialAppLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('quiz_platform_active_tab', activeTab);
  }, [activeTab]);

  // Handle shared link deep-link query parameters (?quizId=... or ?quiz=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const targetQuizId = urlParams.get('quizId') || urlParams.get('quiz');
    const targetRef = urlParams.get('ref');

    if (targetRef) {
      try {
        localStorage.setItem('quiz_platform_referrer_id', targetRef);
      } catch {
        // ignore storage write error
      }
    }

    if (targetQuizId) {
      apiGetQuizzes()
        .then((res) => {
          if (res && res.success !== false && Array.isArray(res.quizzes)) {
            const found = res.quizzes.find((q) => String(q._id || q.id) === String(targetQuizId));
            if (found) {
              setSelectedQuiz(found);
              setActiveTab('quiz');
              addToast(`🚀 Loaded shared quiz: "${found.title}"`, 'success');
            }
          }
        })
        .catch(() => {});
    }
  }, [addToast]);

  useEffect(() => {
    if (selectedQuiz) {
      localStorage.setItem('quiz_platform_selected_quiz', JSON.stringify(selectedQuiz));
    } else {
      localStorage.removeItem('quiz_platform_selected_quiz');
    }
  }, [selectedQuiz]);

  useEffect(() => {
    localStorage.setItem('quiz_platform_is_executing', String(isExecutingQuiz));
  }, [isExecutingQuiz]);

  useEffect(() => {
    localStorage.setItem('quiz_platform_is_practice', String(isPracticeMode));
  }, [isPracticeMode]);

  useEffect(() => {
    if (activePolicy) {
      localStorage.setItem('quiz_platform_active_policy', activePolicy);
    } else {
      localStorage.removeItem('quiz_platform_active_policy');
    }
  }, [activePolicy]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Dynamic Page Title & SEO Meta Tag Updater
  useEffect(() => {
    if (isExecutingQuiz && selectedQuiz) {
      updatePageSEO({
        title: `Live Exam: ${selectedQuiz.title}`,
        description: `Taking live assessment: ${selectedQuiz.title} on brainArena. Test your HTML, JS & coding knowledge!`,
        canonical: `/quiz`
      });
    } else if (selectedQuiz) {
      updatePageSEO({
        title: selectedQuiz.title,
        description: selectedQuiz.description || selectedQuiz.quickDetails || `Practice ${selectedQuiz.category} questions online on brainArena.`,
        canonical: `/quiz`
      });
    } else if (activePolicy) {
      updatePageSEO({
        title: activePolicy === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
        description: `Official ${activePolicy} for brainArena platform.`,
        canonical: `/${activePolicy}`
      });
    } else {
      switch (activeTab) {
        case 'quiz':
          updatePageSEO({
            title: 'HTML, JS & Programming Quiz Catalog',
            description: 'Explore live quiz contests, free HTML question practice, JavaScript MCQs, and coding challenges with certificates.',
            keywords: 'html quiz, question practice, javascript quiz, live contest, arena quiz, coding practice',
            canonical: '/quiz'
          });
          break;
        case 'short-gyaan':
        case 'shorts-gyaan':
          updatePageSEO({
            title: 'Shorts Gyaan - Micro-Learning & Tech Flashcards',
            description: 'Bite-sized technical MCQs, HTML & JS flashcards, and daily tech gyaan practice on brainArena.',
            keywords: 'shorts gyaan, tech gyaan, question practice, html mcq, bite sized learning',
            canonical: '/short-gyaan'
          });
          break;
        case 'about':
          updatePageSEO({
            title: 'About brainArena - Next-Gen Learning & Contest Platform',
            description: 'Learn about brainArena platform, live quiz practice competitions, certificates, and partner ecosystem.',
            canonical: '/about'
          });
          break;
        case 'contact':
          updatePageSEO({
            title: 'Contact Support & Inquiries',
            description: 'Get in touch with brainArena team for contest queries, partnerships, and technical support.',
            canonical: '/contact'
          });
          break;
        case 'profile':
          updatePageSEO({
            title: 'User Profile & Official Certificates',
            description: 'View your real-time global rank, quiz score history, earned XP, and official certificates on brainArena.',
            canonical: '/profile'
          });
          break;
        case 'home':
        default:
          updatePageSEO({
            title: 'brainArena - Live Quiz Contests, HTML & Coding Question Practice with Certificates',
            description: 'Master coding with free online question practice, HTML & JavaScript quizzes, Shorts Gyaan micro-learning, and win rewards in weekend live contests on brainArena.',
            keywords: 'brainarena, quiz, question practice, html quiz, javascript quiz, java mcq, arena quiz, coding contest, free certificate quiz, shorts gyaan, daily live practice',
            canonical: '/'
          });
          break;
      }
    }
  }, [activeTab, selectedQuiz, isExecutingQuiz, activePolicy]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setIsExecutingQuiz(false);
    setIsPracticeMode(false);
    setActivePolicy(null);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartQuiz = (isPractice = false) => {
    if (!isAuthenticated && !user) {
      addToast('🔒 Please sign in to start taking quizzes and compete on leaderboards!', 'warning');
      setActiveTab('login');
      return;
    }
    setIsPracticeMode(Boolean(isPractice));
    setIsExecutingQuiz(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToQuizPage = () => {
    setSelectedQuiz(null);
    setIsExecutingQuiz(false);
    setIsPracticeMode(false);
    setActivePolicy(null);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreLiveQuizzes = async () => {
    try {
      const res = await apiGetQuizzes();
      const allQuizzes = (res && res.success && Array.isArray(res.quizzes)) ? res.quizzes : [];
      const liveQuizzes = allQuizzes.filter((q) => getQuizAutoStatus(q) === 'running');

      if (liveQuizzes.length === 0) {
        addToast('No quizzes are currently live right now.', 'info');
      }
    } catch {
      addToast('No quizzes are currently live right now.', 'info');
    }

    handleNavigateToQuizPage();
  };

  const handleBackToHome = () => {
    setSelectedQuiz(null);
    setIsExecutingQuiz(false);
    setIsPracticeMode(false);
    setActivePolicy(null);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePolicy = (policyType) => {
    setActivePolicy(policyType);
    setSelectedQuiz(null);
    setIsExecutingQuiz(false);
    setIsPracticeMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Network Connectivity State (Online / Offline)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);
  const reconnectedTimerRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      window.dispatchEvent(new CustomEvent('app:online-reconnected'));

      // Automatically flush and sync any pending offline actions (quiz results, likes, bookmarks)
      syncPendingOfflineActions(request).then(({ syncedCount }) => {
        if (syncedCount > 0) {
          addToast(`⚡ Auto-Synced ${syncedCount} offline action${syncedCount > 1 ? 's' : ''} to server!`, 'success');
        }
      }).catch((err) => {
        console.warn('Offline sync error:', err);
      });

      if (reconnectedTimerRef.current) {
        clearTimeout(reconnectedTimerRef.current);
      }

      reconnectedTimerRef.current = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedBanner(false);
      if (reconnectedTimerRef.current) {
        clearTimeout(reconnectedTimerRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectedTimerRef.current) {
        clearTimeout(reconnectedTimerRef.current);
      }
    };
  }, [addToast]);

  const isAuthModalOpen = activeTab === 'signup' || activeTab === 'login';
  const isShortsTab = activeTab === 'short-gyaan' || activeTab === 'shorts-gyaan';

  if (isInitialAppLoading) {
    return <InitialLogoLoader onComplete={() => setIsInitialAppLoading(false)} />;
  }

  return (
    <div className={`relative bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 flex flex-col font-lato ${isShortsTab ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* Programmer Code Syntax & Logic Background Texture */}
      <CodeSyntaxBackgroundTexture />

      {/* Sticky Global Network Offline / Reconnected Banner */}
      <GlobalNetworkBanner
        isOnline={isOnline}
        showReconnectedBanner={showReconnectedBanner}
        onDismissReconnected={() => setShowReconnectedBanner(false)}
      />

      {/* Top Sticky Navbar */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActivePolicy(null);
          if (tab !== 'quiz' && tab !== 'signup' && tab !== 'login') {
            setSelectedQuiz(null);
            setIsExecutingQuiz(false);
            setIsPracticeMode(false);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Page Layout Container */}
      <main className={`flex-grow w-full mx-auto ${isShortsTab ? 'max-w-full p-0 overflow-hidden h-[calc(100vh-4.2rem)] no-scrollbar' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-2 pb-20 md:pb-4'}`}>
        <Suspense fallback={<PageSkeletonLoader />}>
          {activePolicy !== null ? (
            <PolicyPage
              policyType={activePolicy}
              onBack={handleBackToHome}
            />
          ) : isExecutingQuiz ? (
            <QuizExecutionPage
              quiz={selectedQuiz}
              isPractice={isPracticeMode}
              onSelectQuiz={(q) => {
                setIsExecutingQuiz(false);
                setSelectedQuiz(q);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewAllQuizzes={() => {
                setIsExecutingQuiz(false);
                setSelectedQuiz(null);
                setActiveTab('quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBack={() => {
                setIsExecutingQuiz(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : selectedQuiz !== null ? (
            <QuizDetailPage
              quiz={selectedQuiz}
              isLoading={false}
              onStartQuiz={handleStartQuiz}
              onRequireLogin={() => setActiveTab('login')}
              onBack={() => {
                setSelectedQuiz(null);
                setActiveTab('quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : activeTab === 'profile' ? (
            <ProfilePage
              onNavigateToQuiz={handleNavigateToQuizPage}
              onNavigateHome={handleBackToHome}
              onNavigateAdmin={() => {
                setSelectedQuiz(null);
                setIsExecutingQuiz(false);
                setIsPracticeMode(false);
                setActivePolicy(null);
                setActiveTab('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : activeTab === 'admin' ? (
            !isOnline ? (
              <NetworkErrorPage
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRetry={() => window.location.reload()}
              />
            ) : (
              <AdminDashboard />
            )
          ) : (activeTab === 'short-gyaan' || activeTab === 'shorts-gyaan') ? (
            <ShortGyaanPage
              onRequireAuth={(mode) => setActiveTab(mode || 'login')}
              onNavigateHome={handleBackToHome}
            />
          ) : activeTab === 'about' ? (
            <AboutPage
              onNavigateToQuiz={handleNavigateToQuizPage}
              onExploreQuizzes={handleExploreLiveQuizzes}
              onExploreLiveQuizzes={handleExploreLiveQuizzes}
              onNavigate={(tab) => {
                if (tab === 'quiz') handleNavigateToQuizPage();
                else setActiveTab(tab);
              }}
            />
          ) : activeTab === 'contact' ? (
            <ContactPage />
          ) : activeTab === 'quiz' ? (
            <QuizPage
              onSelectQuiz={handleSelectQuiz}
            />
          ) : (activeTab === 'home' || activeTab === 'login' || activeTab === 'signup') ? (
            <div className="space-y-12">
              {/* Hero Banner */}
              <HeroBanner onExploreLiveQuizzes={handleExploreLiveQuizzes} />

              {/* Live Quizzes Section */}
              <LiveQuizzes
                onSelectQuiz={handleSelectQuiz}
                onViewAll={handleNavigateToQuizPage}
              />

              {/* Previous Work Showcase */}
              <PreviousWorks
                onSelectQuiz={handleSelectQuiz}
                onViewAll={handleNavigateToQuizPage}
              />

              {/* Partners */}
              <PartnersSection />

              {/* Reviews */}
              <ReviewSection />
            </div>
          ) : (
            <NotFoundPage
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </Suspense>
      </main>

      {/* Footer (Hidden on Shorts Gyaan and Quiz Execution workspace) */}
      {!isExecutingQuiz && activeTab !== 'short-gyaan' && activeTab !== 'shorts-gyaan' && (
        <Footer
          onNavigatePolicy={handleNavigatePolicy}
          onNavigateHome={handleBackToHome}
          onNavigateQuiz={handleNavigateToQuizPage}
          onNavigateAdmin={() => {
            setSelectedQuiz(null);
            setIsExecutingQuiz(false);
            setIsPracticeMode(false);
            setActivePolicy(null);
            setActiveTab('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Auth Modal (Login / Register) */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthPage
            isOpen={isAuthModalOpen}
            initialMode={activeTab === 'signup' ? 'signup' : 'login'}
            onClose={() => {
              setActiveTab('home');
            }}
          />
        </Suspense>
      )}

      {/* Small Devices Fixed Bottom Navigation Bar (Hidden on Shorts Gyaan and Quiz Execution workspace) */}
      {!isExecutingQuiz && activeTab !== 'short-gyaan' && activeTab !== 'shorts-gyaan' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setActivePolicy(null);
            if (tab !== 'quiz' && tab !== 'signup' && tab !== 'login') {
              setSelectedQuiz(null);
              setIsExecutingQuiz(false);
              setIsPracticeMode(false);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* PWA Install & Notification Permission Floating Card */}
      <PwaInstallCard />

      {/* Universal Review Modal */}
      <UniversalReviewModal
        isOpen={isGlobalReviewModalOpen}
        onClose={() => setIsGlobalReviewModalOpen(false)}
      />

    </div>
  );
};

export default App;
