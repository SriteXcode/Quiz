import { useAuth } from '../context/AuthContext';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { isAuthenticated, user } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'quiz', label: 'Quiz', icon: '🎯' },
    { id: 'short-gyaan', label: 'Shorts', icon: '⚡' },
    { id: 'about', label: 'About Us', icon: 'ℹ️' },
    {
      id: isAuthenticated ? 'profile' : 'login',
      label: 'Profile',
      icon: '👤',
      avatarUrl: user?.avatarUrl
    }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)]/95 backdrop-blur-lg border-t border-[var(--border-theme)] shadow-2xl px-2 py-2 transition-colors duration-300 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isShortsActive =
            (item.id === 'short-gyaan' || item.id === 'shorts-gyaan') &&
            (activeTab === 'short-gyaan' || activeTab === 'shorts-gyaan');
          const isProfileActive =
            (item.id === 'profile' || item.id === 'login') &&
            (activeTab === 'profile' || activeTab === 'login');
          const isActive = activeTab === item.id || isShortsActive || isProfileActive;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[var(--color-primary-600)] font-bold scale-105'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] opacity-80'
              }`}
            >
              {item.avatarUrl ? (
                <div className={`w-5 h-5 rounded-full overflow-hidden border ${isActive ? 'border-[var(--color-primary-600)] ring-1 ring-blue-500/30' : 'border-[var(--border-theme)]'}`}>
                  <img src={item.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="text-lg leading-none mb-0.5">{item.icon}</span>
              )}
              <span className="text-[10px] font-poppins font-medium leading-none tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
