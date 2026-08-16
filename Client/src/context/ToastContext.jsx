import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Defer state update safely to avoid calling setState during another component's render phase
    setTimeout(() => {
      setToasts((prevToasts) => [
        ...prevToasts,
        { id, message, type, duration }
      ]);
    }, 0);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-slideUp text-xs sm:text-sm font-poppins font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-amber-900/20'
                : 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-500)] shadow-blue-900/20'
            }`}
          >
            <div className="flex items-center space-x-3 pr-2">
              <span className="text-base shrink-0">
                {toast.type === 'success'
                  ? '✅'
                  : toast.type === 'error'
                  ? '⚠️'
                  : toast.type === 'warning'
                  ? '🔔'
                  : 'ℹ️'}
              </span>
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-white/20 transition-colors cursor-pointer shrink-0"
              aria-label="Close Toast"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
