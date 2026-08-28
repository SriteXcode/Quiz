import { useState, useEffect } from 'react';
import { getQuizCountdownData } from '../utils/dateUtils';

export const QuizCountdownBadge = ({ quiz, size = 'sm', className = '' }) => {
  const [countdown, setCountdown] = useState(() => getQuizCountdownData(quiz));

  useEffect(() => {
    // Tick every second to update countdown live
    const interval = setInterval(() => {
      setCountdown(getQuizCountdownData(quiz));
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz]);

  if (!countdown) return null;

  const isUpcoming = countdown.status === 'upcoming';
  const isRunning = countdown.status === 'running';

  if (size === 'lg') {
    return (
      <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
        isUpcoming
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          : isRunning
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 animate-pulse'
          : 'bg-slate-500/10 border-slate-500/30 text-[var(--text-muted)]'
      } ${className}`}>
        <div className="flex items-center space-x-1.5 text-xs font-poppins font-bold uppercase tracking-wider mb-1">
          {isRunning && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />}
          <span>{countdown.label}</span>
        </div>

        {countdown.formattedText && (
          <div className="font-mono font-extrabold text-xl sm:text-2xl tracking-tight">
            {countdown.formattedText}
          </div>
        )}
      </div>
    );
  }

  // Default compact badge
  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold shadow-sm transition-all ${
        isUpcoming
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
          : isRunning
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
          : 'bg-slate-500/15 text-[var(--text-muted)] border border-slate-500/30'
      } ${className}`}
    >
      {isRunning ? (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        </span>
      ) : isUpcoming ? (
        <span>⏳</span>
      ) : (
        <span>🏁</span>
      )}

      <span>{countdown.label}</span>
      {countdown.formattedText && <span className="font-extrabold">{countdown.formattedText}</span>}
    </div>
  );
};

export default QuizCountdownBadge;
