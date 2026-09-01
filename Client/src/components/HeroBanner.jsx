import { useState, useEffect } from 'react';
import Skeleton from './Skeleton';

export const HeroSkeleton = () => {
  return (
    <div className="w-full rounded-3xl p-8 sm:p-12 mb-10 skeleton-shimmer min-h-[300px] flex flex-col justify-between">
      <div className="space-y-4 max-w-2xl">
        <Skeleton type="heading" className="h-10 sm:h-12 w-4/5" />
        <Skeleton type="text" className="h-5 w-full" />
        <Skeleton type="text" className="h-5 w-3/4" />
      </div>
      <div className="flex gap-4 mt-8">
        <Skeleton className="h-12 w-36 rounded-xl" />
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>
    </div>
  );
};

export const NotesModal = ({ isOpen, onClose, notes, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop Overlay Click */}
      <div className="absolute inset-0" onClick={onClose} aria-label="Close notes modal" />

      {/* Modal Dialog Box */}
      <div className="w-full max-w-2xl bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden relative z-10 animate-scaleUp flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-4 mb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/30 flex items-center justify-center text-xl font-bold shrink-0">
              📢
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-amber-500/20 text-amber-950 dark:text-amber-200 mb-0.5">
                Official Live Schedule & Rules
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold font-poppins text-[var(--text-main)] leading-tight">
                Important Platform Notes
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--color-primary-400)] flex items-center justify-center text-sm font-bold transition-all cursor-pointer active:scale-95 shrink-0"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Notes List Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1 no-scrollbar">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[var(--color-primary-400)] transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xl">{note.icon}</span>
                  <h4 className="font-poppins font-bold text-base text-[var(--text-main)]">
                    {note.title}
                  </h4>
                </div>
                <span className={`text-[11px] font-poppins font-bold px-3 py-1 rounded-full ${note.badgeClass}`}>
                  {note.badge}
                </span>
              </div>

              <p className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed flex items-center flex-wrap gap-1.5">
                <span>{note.desc}</span>
                {note.highlight && (
                  <span
                    onClick={() => {
                      if (note.actionTab && onNavigate) {
                        onClose();
                        onNavigate(note.actionTab);
                      }
                    }}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 text-white font-poppins font-extrabold text-xs shadow-xs hover:scale-105 transition-transform cursor-pointer"
                  >
                    {note.highlight}
                  </span>
                )}
              </p>

              {note.details && (
                <div className="pt-2 mt-2 border-t border-[var(--border-theme)]/60 text-xs font-lato text-[var(--text-muted)] space-y-1">
                  {note.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-center space-x-2">
                      <span className="text-[var(--color-primary-500)] font-bold">•</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {note.actionTab && onNavigate && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate(note.actionTab);
                    }}
                    className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-poppins font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                  >
                    <span>Practice in Shorts Gyaan Now</span>
                    <span>⚡</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-4 border-t border-[var(--border-theme)] flex items-center justify-between shrink-0">
          <span className="text-xs font-lato text-[var(--text-muted)] hidden sm:inline">
            💡 Click anywhere outside or press ESC to close
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer text-center"
          >
            Understood 👍
          </button>
        </div>

      </div>
    </div>
  );
};

export const NotesMarquee = ({ onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const notes = [
    {
      id: 1,
      badge: 'Free (11 AM) & Paid (8 PM)',
      badgeClass: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/30',
      icon: '📜',
      title: 'Daily Live Quiz Practice',
      desc: 'Daily live quiz practice with certificate: FREE session at 11:00 AM & PAID session at 8:00 PM.',
      details: [
        'Free Session (11:00 AM): Open for all registered users with verified certificates.',
        'Paid Session (8:00 PM): High-level competitive practice with cash rewards & leaderboards.'
      ]
    },
    {
      id: 2,
      badge: 'Sat / Sun (8 PM)',
      badgeClass: 'bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/30',
      icon: '🏆',
      title: 'Weekend Reward Competition',
      desc: 'Saturday & Sunday reward winning competition at 8:00 PM – Compete & win prizes!',
      details: [
        'Timings: Every Saturday and Sunday sharp at 8:00 PM IST.',
        'Prizes: Direct cash reward transfers, profile badges, and fast-track certificates.'
      ]
    },
    {
      id: 3,
      badge: 'Unlimited Free',
      badgeClass: 'bg-purple-500/20 text-purple-950 dark:text-purple-200 border border-purple-500/30',
      icon: '⚡',
      title: 'Unlimited Practice',
      desc: 'Click to practice unlimited questions in',
      highlight: 'Shorts Gyaan 💡',
      actionTab: 'short-gyaan',
      details: [
        'Over 1,000+ bite-sized coding & conceptual MCQs with instant explanations.',
        'Zero timer pressure – study at your own pace anytime!'
      ]
    },
    {
      id: 4,
      badge: 'Instant Verified',
      badgeClass: 'bg-blue-500/20 text-blue-950 dark:text-blue-200 border border-blue-500/30',
      icon: '🎖️',
      title: 'Certificates & Leaderboards',
      desc: 'Earn accredited certificates and rank on real-time global leaderboards.',
      details: [
        'Instant Certificate Generation: 100% cryptographic public key verifiable.',
        'Leaderboard Audit: First attempt scores are officially ranked for accuracy & speed.'
      ]
    }
  ];

  // Tripled list for seamless continuous infinite marquee loop
  const marqueeItems = [...notes, ...notes, ...notes];

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-[var(--bg-card)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] rounded-2xl p-2.5 sm:p-3 shadow-md hover:shadow-lg overflow-hidden relative group/notes transition-all mt-4 cursor-pointer active:scale-[0.99]"
        title="Click to view all schedule notes & rules"
      >
        <div className="flex items-center gap-3">
          {/* Left Sticky Label / Badge */}
          <div className="shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 text-amber-950 dark:text-amber-200 z-10 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[11px] sm:text-xs font-poppins font-extrabold uppercase tracking-wider flex items-center space-x-1">
              <span>📢</span>
              <span>NOTES:</span>
            </span>
          </div>

          {/* Marquee Overflow Track */}
          <div className="relative overflow-hidden w-full py-0.5">
            {/* Edge Gradient Shadows */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg-card)] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg-card)] to-transparent z-10" />

            {/* Marquee Track Container */}
            <div className="animate-notes-marquee flex items-center space-x-8">
              {marqueeItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex items-center space-x-2 shrink-0 font-lato text-xs sm:text-sm text-[var(--text-main)]"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-poppins font-bold text-[var(--text-main)]">
                    {item.title}:
                  </span>
                  <span className="text-[var(--text-secondary)] font-medium">
                    {item.desc}
                  </span>
                  {item.highlight && (
                    <span
                      onClick={(e) => {
                        if (item.actionTab && onNavigate) {
                          e.stopPropagation();
                          onNavigate(item.actionTab);
                        }
                      }}
                      className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 text-white font-poppins font-extrabold text-[11px] shadow-xs hover:scale-105 transition-transform cursor-pointer"
                    >
                      {item.highlight}
                    </span>
                  )}
                  <span className={`text-[10px] font-poppins font-bold px-2 py-0.5 rounded-full ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                  <span className="text-[var(--text-muted)] font-bold px-2">
                    •
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Click Indicator Pill */}
          <div className="shrink-0 hidden md:flex items-center space-x-1 text-[11px] font-poppins font-bold text-[var(--color-primary-600)] bg-[var(--bg-main)] px-2.5 py-1 rounded-lg border border-[var(--border-theme)]">
            <span>View All</span>
            <span>🔍</span>
          </div>
        </div>
      </div>

      {/* Interactive Notes Detail Modal */}
      <NotesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notes={notes}
        onNavigate={onNavigate}
      />
    </>
  );
};

export const HeroBanner = ({ isLoading, onExploreLiveQuizzes, onNavigate }) => {
  if (isLoading) return <HeroSkeleton />;

  return (
    <div className="mb-10 space-y-4">
      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--color-primary-600)] text-white p-8 sm:p-12 shadow-xl border-2 border-white/10">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-poppins leading-tight mb-2 text-white">
            Master Any Skill Through Interactive Live Quizzes
          </h1>

          <p className="text-base sm:text-lg font-lato text-blue-50 mb-4 max-w-2xl leading-relaxed drop-shadow-xs">
            Test your knowledge, compete in real-time leaderboards, and elevate your learning experience with thousands of community-crafted quizzes.
          </p>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={onExploreLiveQuizzes}
              className="px-6 py-3.5 rounded-xl font-poppins font-bold text-sm bg-white text-[var(--color-primary-700)] hover:bg-blue-50 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Explore Live Quizzes
            </button>
          </div>

          {/* Feature stats */}
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center sm:text-left">
            <div>
              <div className="font-poppins font-bold text-2xl">5K+</div>
              <div className="text-xs font-lato text-blue-100 font-medium">Active Learners</div>
            </div>
            <div>
              <div className="font-poppins font-bold text-2xl">100+</div>
              <div className="text-xs font-lato text-blue-100 font-medium">Live Quizzes</div>
            </div>
            <div>
              <div className="font-poppins font-bold text-2xl">96.4%</div>
              <div className="text-xs font-lato text-blue-100 font-medium">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Marquee Ticker */}
      <NotesMarquee onNavigate={onNavigate} />
    </div>
  );
};

export default HeroBanner;



