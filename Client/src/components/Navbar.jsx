import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
  const dropdownRef = useRef(null);
  const navRef = useRef(null);

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

  const handleMobileLogout = () => {
    setIsMobileMenuOpen(false);
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
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800/60'
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

          {/* Mobile Hamburger Menu & Theme Toggle */}
          <div className="flex md:hidden items-center space-x-2 shrink-0">
            <button
              onClick={handleThemeToggle}
              className="p-2 w-10 h-10 rounded-lg text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              aria-label="Toggle Theme Mobile"
            >
              {theme === 'dark' ? (
                <span className="text-xl animate-flame select-none">🪔</span>
              ) : (
                <span className="text-xl select-none">💡</span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-[var(--text-main)] focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-40 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden relative z-50 border-b border-[var(--border-theme)] bg-[var(--bg-card)] px-4 pt-2 pb-6 space-y-3 animate-fadeIn shadow-2xl">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  handleNavClick(link.id, link.label);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-3 rounded-lg font-poppins font-medium text-base ${
                  activeTab === link.id
                    ? 'bg-[var(--color-primary-600)] text-white font-semibold'
                    : 'text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}

            {isAuthenticated && user ? (
              <>
                <button
                  onClick={() => {
                    handleNavClick('profile', 'My Profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 rounded-lg font-poppins font-semibold text-base bg-[var(--color-primary-50)] dark:bg-slate-800 text-[var(--color-primary-600)] cursor-pointer"
                >
                  👤 My Profile ({user.name})
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      handleNavClick('admin', 'Admin Dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-left px-4 py-3 rounded-lg font-poppins font-bold text-base flex items-center justify-between cursor-pointer transition-all ${
                      activeTab === 'admin'
                        ? 'bg-[var(--color-primary-600)] text-white shadow-md'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🛡️</span>
                      <span>Admin Portal</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-white/15">
                      Control
                    </span>
                  </button>
                )}

                <button
                  onClick={handleMobileLogout}
                  className="text-left px-4 py-3 rounded-lg font-poppins font-semibold text-base text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  handleNavClick('login', 'Login');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-4 py-3 rounded-lg font-poppins font-semibold text-base bg-[var(--color-primary-600)] text-white cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
