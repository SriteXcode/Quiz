import { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isPwaInstalled } from '../services/pwaService';

export const Navbar = ({
  theme,
  toggleTheme,
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);

  // PWA Install State & Event Listeners
  useEffect(() => {
    setIsInstalled(isPwaInstalled());

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          localStorage.setItem('pwa_installed', 'true');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('PWA install error:', err);
      }
    } else {
      alert('To install the app, tap your browser menu (⋮ or Share) and select "Install app" or "Add to Home Screen".');
    }
  };

  // Close profile dropdown & mobile menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen, setIsMobileMenuOpen]);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'short-gyaan', label: '⚡ Short Gyaan' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact Us' }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <header ref={navRef} className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-nav)] border-b border-[var(--border-theme)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2 md:space-x-2.5 lg:space-x-3 cursor-pointer shrink-0" onClick={() => handleNavClick('home', 'Home')}>
            <div className="w-9 h-9 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-xl bg-[var(--color-primary-600)] flex items-center justify-center text-white font-bold text-lg md:text-base lg:text-xl shadow-md shrink-0">
              Q
            </div>
            <span className="font-poppins font-bold text-lg md:text-base lg:text-xl tracking-wide text-[var(--text-main)] shrink-0">
              brand
            </span>
          </div>

          {/* Desktop / Tablet Navigation Links & User Profile Control */}
          <div className="hidden md:flex items-center space-x-1.5 md:space-x-2 lg:space-x-4 shrink-0">
            <nav className="flex items-center space-x-0.5 md:space-x-0.5 lg:space-x-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id, link.label)}
                  className={`px-2.5 py-1.5 md:px-2 md:py-1.5 lg:px-3.5 lg:py-2 rounded-lg font-poppins font-medium text-xs md:text-xs lg:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === link.id
                      ? 'text-[var(--color-primary-600)] bg-[var(--color-primary-50)] dark:bg-slate-800 font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:border-2 dark:hover:border-slate-800/80'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="h-5 md:h-5 lg:h-6 w-px bg-[var(--border-theme)] shrink-0" />

            {/* Authenticated User Profile Dropdown OR Login Button */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1.5 md:space-x-2 lg:space-x-2.5 px-2 md:px-2 lg:px-3 py-1 md:py-1 lg:py-1.5 rounded-2xl border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-500)] transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                >
                  <div className="w-7 h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full bg-[var(--color-primary-100)] dark:bg-slate-800 text-[var(--color-primary-600)] flex items-center justify-center font-bold text-xs md:text-xs lg:text-sm overflow-hidden shrink-0 border border-[var(--color-primary-300)]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.name ? user.name.charAt(0).toUpperCase() : '👤'}</span>
                    )}
                  </div>

                  <div className="text-left font-poppins text-xs leading-tight">
                    <div className="font-bold text-[var(--text-main)] max-w-[65px] md:max-w-[75px] lg:max-w-[100px] truncate text-[11px] md:text-xs">
                      {user.name}
                    </div>
                    <span className="text-[9px] md:text-[10px] text-[var(--color-primary-600)] font-semibold uppercase block">
                      {user.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}
                    </span>
                  </div>

                  <span className="text-[10px] md:text-xs text-[var(--text-muted)] pl-0.5">▼</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl shadow-xl py-2 z-50 animate-scaleUp">
                    <button
                      onClick={() => handleNavClick('profile', 'My Profile')}
                      className="w-full text-left px-4 py-2 text-xs sm:text-sm font-poppins font-semibold text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleNavClick('admin', 'Admin Dashboard')}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm font-poppins font-semibold text-[var(--color-primary-600)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-2 cursor-pointer"
                      >
                        <span>🛡️</span>
                        <span>Admin Portal</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-[var(--border-theme)]" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs sm:text-sm font-poppins font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login', 'Login')}
                className="px-3.5 py-1.5 md:px-3 md:py-1.5 lg:px-5 lg:py-2 rounded-xl font-poppins font-semibold text-xs md:text-xs lg:text-sm text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                Login
              </button>
            )}

            {/* PWA App Download Button (Shown until app is installed) */}
            {!isInstalled && (
              <button
                onClick={handleInstallPwa}
                className="p-1.5 md:p-1.5 lg:p-2 w-8 h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer flex items-center justify-center shadow-sm shrink-0 active:scale-95 animate-pulse"
                aria-label="Download & Install App"
                title="Install App for Offline Access & Instant Performance 📲"
              >
                <span className="text-base md:text-base lg:text-xl select-none">📲</span>
              </button>
            )}

            {/* Theme Toggle Button (Bulb for Light Mode, Animated Diya Flame for Dark Mode) */}
            <button
              onClick={handleThemeToggle}
              className="p-1.5 md:p-1.5 lg:p-2 w-8 h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shadow-sm shrink-0"
              aria-label="Toggle Theme"
              title={theme === 'dark' ? 'Dark Mode Active (Flickering Diya Flame 🪔)' : 'Light Mode Active (Glowing Bulb 💡)'}
            >
              {theme === 'dark' ? (
                <span className="text-base md:text-base lg:text-xl animate-flame flex items-center justify-center select-none" aria-label="Diya Flame">
                  🪔
                </span>
              ) : (
                <span className="text-base md:text-base lg:text-xl flex items-center justify-center hover:scale-110 transition-transform select-none" aria-label="Light Bulb">
                  💡
                </span>
              )}
            </button>
          </div>

          {/* Mobile Actions: Login (if guest) + PWA Download + Theme Toggle */}
          <div className="flex md:hidden items-center space-x-2 shrink-0">
            {!isAuthenticated && (
              <button
                onClick={() => handleNavClick('login', 'Login')}
                className="px-3 py-1.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all flex items-center space-x-1.5 shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
            {!isInstalled && (
              <button
                onClick={handleInstallPwa}
                className="p-2 w-10 h-10 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer flex items-center justify-center shadow-sm shrink-0 active:scale-95 animate-pulse"
                aria-label="Download App Mobile"
                title="Install App 📲"
              >
                <span className="text-xl select-none">📲</span>
              </button>
            )}
            <button
              onClick={handleThemeToggle}
              className="p-2 w-10 h-10 rounded-xl border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shadow-sm shrink-0"
              aria-label="Toggle Theme Mobile"
              title={theme === 'dark' ? 'Dark Mode Active (Flickering Diya Flame 🪔)' : 'Light Mode Active (Glowing Bulb 💡)'}
            >
              {theme === 'dark' ? (
                <span className="text-xl animate-flame select-none">🪔</span>
              ) : (
                <span className="text-xl select-none">💡</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
