import { useState, useEffect, useRef, lazy, Suspense } from 'react';
// Reusable Layout & Showcase Components
import Navbar from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { PartnersSection } from './components/PartnersSection';
import { LiveQuizzes } from './components/LiveQuizzes';
import { PreviousWorks } from './components/PreviousWorks';
import { ReviewSection } from './components/ReviewSection';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import PwaInstallCard from './components/PwaInstallCard';
import InitialLogoLoader from './components/InitialLogoLoader';
import GlobalNetworkBanner from './components/GlobalNetworkBanner';
import UniversalReviewModal from './components/UniversalReviewModal';

// Dynamic Lazy-Loaded Pages & Heavy Subsystems
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

// Contexts
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

export const App = () => {
  const [isInitialAppLoading, setIsInitialAppLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('quiz_platform_active_tab') || 'home';
  });
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
  const [activePolicy, setActivePolicy] = useState(() => {
    return localStorage.getItem('quiz_platform_active_policy') || null;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGlobalReviewModalOpen, setIsGlobalReviewModalOpen] = useState(false);

  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const { addToast } = useToast();

  // Double Back Click Handler for Mobile / Browser Back Gesture
  const lastBackPressTimeRef = useRef(0);

  useEffect(() => {
    // Push a dummy history state to intercept browser back navigation
    window.history.pushState({ page: activeTab }, '', window.location.href);

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
        }
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastBackPressTimeRef.current;
      const isDoubleBack = timeDiff < 2000;

      if (isDoubleBack) {
        if (activeTab !== 'home') {
          // Double back press on inner tab -> Return to Home
          setActiveTab('home');
          setActivePolicy(null);
          setSelectedQuiz(null);
          setIsExecutingQuiz(false);
          setIsPracticeMode(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          addToast('Returned to Home page 🏠', 'info', 2000);
        } else {
          // Double back press on Home -> Exit App
          addToast('Exiting App... 🚪', 'info', 2000);
          window.history.go(-2);
        }
      } else {
        // Single back press -> Intercept and request double press
        lastBackPressTimeRef.current = now;
        window.history.pushState({ page: activeTab }, '', window.location.href);

        if (activeTab !== 'home') {
          addToast('Press back again to go to Home 🏠', 'warning', 2000);
        } else {
          addToast('Press back again to exit 🚪', 'warning', 2000);
        }
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
    <div className={`bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 flex flex-col font-lato ${isShortsTab ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
      
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
      <main className={`flex-grow w-full mx-auto ${isShortsTab ? 'max-w-full p-0 overflow-hidden h-[calc(100vh-4.2rem)] no-scrollbar' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-2 pb-4 md:pb-0'}`}>
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center font-poppins text-sm text-[var(--text-muted)] animate-pulse">Loading brainArena...</div>}>
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
