import { useState, useEffect } from 'react';
// Reusable Layout & Showcase Components
import Navbar from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { PartnersSection } from './components/PartnersSection';
import { LiveQuizzes } from './components/LiveQuizzes';
import { PreviousWorks } from './components/PreviousWorks';
import { ReviewSection } from './components/ReviewSection';
import Footer from './components/Footer';
import PwaInstallCard from './components/PwaInstallCard';

// Pages
import QuizDetailPage from './pages/QuizDetailPage';
import QuizExecutionPage from './pages/QuizExecutionPage';
import QuizPage from './pages/QuizPage';
import ProfilePage from './pages/ProfilePage';
import ShortGyaanPage from './pages/ShortGyaanPage';
import PolicyPage from './pages/PolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { AuthPage } from './pages/AuthPage';

// Admin Portal
import AdminDashboard from './admin/AdminDashboard';

// Services & Utils
import { apiGetQuizzes } from './services/api';
import { getQuizAutoStatus } from './utils/dateUtils';

// Contexts
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

export const App = () => {
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

  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

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

  const isAuthModalOpen = activeTab === 'signup' || activeTab === 'login';
  const isShortsTab = activeTab === 'short-gyaan' || activeTab === 'shorts-gyaan';

  return (
    <div className={`bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 flex flex-col font-lato ${isShortsTab ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
      
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
      <main className={`flex-grow w-full mx-auto ${isShortsTab ? 'max-w-full p-0 overflow-hidden h-[calc(100vh-4.2rem)] no-scrollbar' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}>
        {activePolicy !== null ? (
          <PolicyPage
            policyType={activePolicy}
            onBack={handleBackToHome}
          />
        ) : isExecutingQuiz ? (
          <QuizExecutionPage
            quiz={selectedQuiz}
            isPractice={isPracticeMode}
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
          />
        ) : activeTab === 'admin' ? (
          <AdminDashboard />
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
        ) : (
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
        )}
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
        <AuthPage
          isOpen={isAuthModalOpen}
          initialMode={activeTab === 'signup' ? 'signup' : 'login'}
          onClose={() => {
            setActiveTab('home');
          }}
        />
      )}

      {/* PWA Install & Notification Permission Floating Card */}
      <PwaInstallCard />

    </div>
  );
};

export default App;
