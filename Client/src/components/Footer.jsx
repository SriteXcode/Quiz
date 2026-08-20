export const Footer = ({ onNavigatePolicy, onNavigateAdmin }) => {
  const socialLinks = [
    {
      name: 'Twitter',
      url: 'https://twitter.com',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'GitHub',
      url: 'https://github.com',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0-1.4-1.4z"/>
        </svg>
      )
    },
    {
      name: 'Discord',
      url: 'https://discord.com',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-[var(--accent-yellow-footer)] border-t border-[var(--border-theme)] pt-10 pb-6 text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* 💻 DESKTOP & TABLET / MEDIUM LAYOUT (hidden on mobile, block on md:) */}
        {/* ========================================================================= */}
        <div className="hidden md:block space-y-8 pb-8">
          
          {/* Top Row: Left side = Logo + Social Media below it; Right side = Parallel Text */}
          <div className="flex items-center justify-between">
            {/* Logo & Social Media below it */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-600)] flex items-center justify-center text-white font-bold text-xl shadow-md">
                  Q
                </div>
                <span className="font-poppins font-bold text-2xl tracking-wide text-[var(--text-main)]">
                  brand
                </span>
              </div>

              {/* Social Media Icons below logo */}
              <div className="flex items-center space-x-2 pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="w-9 h-9 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-theme)] flex items-center justify-center hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-500)] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Parallel Text on the right */}
            <div className="max-w-md text-left">
              <p className="font-lato text-lg text-[var(--text-secondary)] leading-relaxed">
                Empowering learners worldwide with real-time interactive quizzes, live code fixing challenges, and verifiable skill certificates.
              </p>
            </div>
          </div>

          {/* Bottom Row: All 3 Columns Parallel (Platform, Categories, Company) */}
          <div className="grid grid-cols-3 gap-8 border-amber-200/60 dark:border-slate-800/60">
            {/* Column 1: Platform */}
            <div className="space-y-3">
              <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2.5 font-lato text-sm text-[var(--text-secondary)]">
                <li><a href="#live" className="hover:text-[var(--color-primary-600)] transition-colors">Live Quizzes</a></li>
                <li><a href="#challenges" className="hover:text-[var(--color-primary-600)] transition-colors">Leaderboards</a></li>
                <li><a href="#works" className="hover:text-[var(--color-primary-600)] transition-colors">Previous Works</a></li>
                <li><a href="#reviews" className="hover:text-[var(--color-primary-600)] transition-colors">Testimonials</a></li>
              </ul>
            </div>

            {/* Column 2: Categories */}
            <div className="space-y-3">
              <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] uppercase tracking-wider">
                Categories
              </h4>
              <ul className="space-y-2.5 font-lato text-sm text-[var(--text-secondary)]">
                <li><a href="#web" className="hover:text-[var(--color-primary-600)] transition-colors">Web Dev</a></li>
                <li><a href="#ai" className="hover:text-[var(--color-primary-600)] transition-colors">Data & AI</a></li>
                <li><a href="#ui" className="hover:text-[var(--color-primary-600)] transition-colors">UI/UX Design</a></li>
                <li><a href="#security" className="hover:text-[var(--color-primary-600)] transition-colors">Cybersecurity</a></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="space-y-3">
              <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-2.5 font-lato text-sm text-[var(--text-secondary)]">
                <li><a href="#about" className="hover:text-[var(--color-primary-600)] transition-colors">About Us</a></li>
                <li><a href="#careers" className="hover:text-[var(--color-primary-600)] transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-[var(--color-primary-600)] transition-colors">Contact Us</a></li>
                <li>
                  <button
                    onClick={() => onNavigatePolicy && onNavigatePolicy('privacy')}
                    className="hover:text-[var(--color-primary-600)] transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 📱 PHONE / MOBILE LAYOUT (block on mobile, hidden on md:) */}
        {/* ========================================================================= */}
        <div className="block md:hidden space-y-6 pb-6">
          
          {/* Logo & Description */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                Q
              </div>
              <span className="font-poppins font-bold text-xl tracking-wide text-[var(--text-main)]">
                brand
              </span>
            </div>
            <p className="font-lato text-xs text-[var(--text-secondary)] leading-relaxed">
              Empowering learners with real-time interactive quizzes.
            </p>
          </div>

          {/* Row 1: Social Media Y-Axis (Vertical List with Names) Parallel to Platform */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Social Media Y-Axis with Social Media Name */}
            <div>
              <h4 className="font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider mb-3">
                Follow Us
              </h4>
              <div className="flex flex-col space-y-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-xs font-poppins font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary-600)] transition-colors cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-theme)] flex items-center justify-center shrink-0 shadow-xs">
                      {social.icon}
                    </span>
                    <span>{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Parallel to Social Media: Platform */}
            <div>
              <h4 className="font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2 font-lato text-xs text-[var(--text-secondary)]">
                <li><a href="#live" className="hover:text-[var(--color-primary-600)] transition-colors">Live Quizzes</a></li>
                <li><a href="#challenges" className="hover:text-[var(--color-primary-600)] transition-colors">Leaderboards</a></li>
                <li><a href="#works" className="hover:text-[var(--color-primary-600)] transition-colors">Previous Works</a></li>
                <li><a href="#reviews" className="hover:text-[var(--color-primary-600)] transition-colors">Testimonials</a></li>
              </ul>
            </div>

          </div>

          {/* Row 2: Below this, the others (Categories parallel to Company) */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Categories */}
            <div>
              <h4 className="font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider mb-3">
                Categories
              </h4>
              <ul className="space-y-2 font-lato text-xs text-[var(--text-secondary)]">
                <li><a href="#web" className="hover:text-[var(--color-primary-600)] transition-colors">Web Dev</a></li>
                <li><a href="#ai" className="hover:text-[var(--color-primary-600)] transition-colors">Data & AI</a></li>
                <li><a href="#ui" className="hover:text-[var(--color-primary-600)] transition-colors">UI/UX Design</a></li>
                <li><a href="#security" className="hover:text-[var(--color-primary-600)] transition-colors">Cybersecurity</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider mb-3">
                Company
              </h4>
              <ul className="space-y-2 font-lato text-xs text-[var(--text-secondary)]">
                <li><a href="#about" className="hover:text-[var(--color-primary-600)] transition-colors">About Us</a></li>
                <li><a href="#careers" className="hover:text-[var(--color-primary-600)] transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-[var(--color-primary-600)] transition-colors">Contact Us</a></li>
                <li>
                  <button
                    onClick={() => onNavigatePolicy && onNavigatePolicy('privacy')}
                    className="hover:text-[var(--color-primary-600)] transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Bar Spaced Around */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-around text-xs font-lato text-[var(--text-muted)] gap-4">
          <p>© {new Date().getFullYear()} Brand Inc. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() => onNavigatePolicy && onNavigatePolicy('terms')}
              className="hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigatePolicy && onNavigatePolicy('cookies')}
              className="hover:underline cursor-pointer"
            >
              Cookie Policy
            </button>
            <button
              onClick={() => onNavigatePolicy && onNavigatePolicy('security')}
              className="hover:underline cursor-pointer"
            >
              Security
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
