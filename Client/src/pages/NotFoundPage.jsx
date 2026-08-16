import React from 'react';
import { useToast } from '../context/ToastContext';

export const NotFoundPage = ({ onNavigate }) => {
  const { addToast } = useToast();

  const handleGoHome = () => {
    addToast('Returned to Home Page', 'info');
    if (onNavigate) onNavigate('home');
  };

  const handleGoQuiz = () => {
    addToast('Redirected to Quiz Learning Hub', 'info');
    if (onNavigate) onNavigate('quiz');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 animate-fadeIn">
      
      {/* 404 CENTERED CARD CONTAINER */}
      <div className="max-w-2xl w-full bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-[36px] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden space-y-8">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[var(--color-primary-500)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Animated 404 Graphic */}
        <div className="relative inline-block">
          <div className="text-7xl sm:text-9xl font-extrabold font-poppins text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-600)] via-[var(--color-secondary-500)] to-[var(--color-primary-600)] animate-pulse tracking-tight select-none">
            404
          </div>
          <span className="absolute -top-3 -right-4 text-4xl sm:text-5xl animate-bounce">
            🧩
          </span>
        </div>

        {/* Text Heading & Subtitle */}
        <div className="space-y-3 relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-primary-50)] dark:bg-slate-800 text-[var(--color-primary-600)] font-poppins font-bold text-xs uppercase tracking-wider">
            Page Not Found
          </span>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold font-poppins text-[var(--text-main)]">
            Oops! You've Discovered a Blank Space
          </h1>

          <p className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            The page or quiz challenge you are looking for might have been moved, deleted, or does not exist on this platform.
          </p>
        </div>

        {/* CTA ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
          {/* Primary Home Button */}
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>🏠 Return to Home</span>
          </button>

          {/* Secondary Quiz Hub Button */}
          <button
            onClick={handleGoQuiz}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] font-poppins font-bold text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>🚀 Explore Quizzes</span>
          </button>
        </div>

        {/* QUICK HELPFUL LINKS */}
        <div className="pt-6 border-t border-[var(--border-theme)] relative z-10">
          <span className="text-xs font-lato text-[var(--text-muted)] block mb-3">
            Looking for something specific?
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-poppins font-semibold text-[var(--color-primary-600)]">
            <button
              onClick={() => onNavigate && onNavigate('about')}
              className="hover:underline cursor-pointer"
            >
              About Us
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate && onNavigate('contact')}
              className="hover:underline cursor-pointer"
            >
              Contact Support
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate && onNavigate('quiz')}
              className="hover:underline cursor-pointer"
            >
              Live Competitions
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default NotFoundPage;
