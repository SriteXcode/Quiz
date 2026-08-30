import { useState, useEffect } from 'react';
import { Zap, User, Eye, EyeOff } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GoogleAuthButton from '../components/GoogleAuthButton';

export const AuthSkeleton = () => {
  return (
    <div className="w-full max-w-[360px] h-[460px] bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-[28px] p-5 shadow-2xl overflow-hidden flex flex-col justify-between skeleton-shimmer space-y-4">
      <div className="flex justify-center">
        <Skeleton type="rect" className="h-8 w-32 rounded-full" />
      </div>
      <div className="flex justify-center">
        <Skeleton type="circle" className="w-14 h-14" />
      </div>
      <Skeleton type="rect" className="h-8 w-full rounded-xl" />
      <div className="space-y-2 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton type="text" className="h-3 w-14" />
            <Skeleton type="rect" className="h-7 flex-1 rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton type="rect" className="h-9 w-full rounded-xl" />
    </div>
  );
};

export const AuthPage = ({ isOpen = true, onClose, initialMode = 'signup', isLoading: parentLoading }) => {
  const [mode, setMode] = useState(initialMode); // 'signup' (Register) or 'login'

  // Toggle Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, register, isLoading: authLoading } = useAuth();
  const { addToast } = useToast();

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      setMode(initialMode);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialMode, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password Match & Field Validation for Registration
    if (mode === 'signup') {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
        addToast('Please provide Name, Email, Phone, and Password.', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        addToast('Passwords do not match! Please check and try again.', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password
        };

        const res = await register(payload);
        if (res?.success) {
          resetForm();
          if (onClose) onClose();
        }
      } else {
        const res = await login(formData.email, formData.password);
        if (res?.success) {
          resetForm();
          if (onClose) onClose();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = parentLoading || authLoading || isSubmitting;

  return (
    /* Modal Backdrop Popup Overlay - Perfectly Centered & Spaced */
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      
      {/* Click outside to close overlay background */}
      <div className="fixed inset-0" onClick={onClose} aria-label="Close modal background" />

      {/* COMPACT POPUP MODAL CARD - CENTERED & NEVER OVERFLOWING SCREEN */}
      <div className="w-full max-w-[360px] sm:max-w-[370px] max-h-[82vh] bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-[26px] p-4 sm:p-5 shadow-2xl overflow-hidden flex flex-col relative z-10 animate-scaleUp my-auto">
        
        {/* Close Button (✕) */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--color-primary-400)] flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-20 active:scale-95 shadow-sm"
          aria-label="Close Popup"
        >
          ✕
        </button>

        {parentLoading ? (
          <AuthSkeleton />
        ) : (
          <>
            {/* Top Compact Mode Toggle Pill */}
            <div className="flex justify-center mb-3 pt-0.5 shrink-0">
              <div className="inline-flex rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] p-0.5 shadow-sm">
                <button
                  onClick={() => setMode('signup')}
                  className={`px-4 py-1 rounded-lg font-poppins font-bold text-xs transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Register
                </button>
                <button
                  onClick={() => setMode('login')}
                  className={`px-4 py-1 rounded-lg font-poppins font-bold text-xs transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Login
                </button>
              </div>
            </div>

            {/* Circular Avatar / App Icon Badge */}
            <div className="flex flex-col items-center justify-center mb-2 shrink-0">
              <div className="w-12 h-12 rounded-2xl border border-[var(--border-theme)] bg-[var(--bg-main)] flex items-center justify-center p-1.5 shadow-sm">
                <img
                  src="https://res.cloudinary.com/dtjkpcuy9/image/upload/v1788088347/quiz_platform_assets/brainarena_logo_transparent.png"
                  alt="brainArena Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* GOOGLE SIGN-IN BUTTON & OR DIVIDER */}
            <div className="space-y-2 mb-2 shrink-0">
              <GoogleAuthButton
                onSuccess={() => onClose && onClose()}
                buttonText={mode === 'signup' ? 'Continue with Google' : 'Sign in with Google'}
              />

              <div className="flex items-center space-x-2 my-1">
                <div className="flex-1 h-px bg-[var(--border-theme)]" />
                <span className="text-[10px] font-poppins font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  OR
                </span>
                <div className="flex-1 h-px bg-[var(--border-theme)]" />
              </div>
            </div>

            {/* FORM CONTAINER WITH OVERFLOW-Y AUTO */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
              {mode === 'signup' ? (
                /* REGISTER FORM (Name, Email, Phone, Password, Confirm Password) */
                <form onSubmit={handleSubmit} className="space-y-2.5 pb-1">
                  
                  {/* Name Input */}
                  <div className="flex items-center space-x-2">
                    <label className="w-20 font-poppins font-bold text-[11px] text-[var(--text-main)] shrink-0">
                      Name:
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Full Name..."
                      value={formData.name}
                      onChange={handleInputChange}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="flex items-center space-x-2">
                    <label className="w-20 font-poppins font-bold text-[11px] text-[var(--text-main)] shrink-0">
                      Email:
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email address..."
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="flex items-center space-x-2">
                    <label className="w-20 font-poppins font-bold text-[11px] text-[var(--text-main)] shrink-0">
                      Phone:
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone number..."
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="flex items-center space-x-2">
                    <label className="w-20 font-poppins font-bold text-[11px] text-[var(--text-main)] shrink-0">
                      Password:
                    </label>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password..."
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 pr-7 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer select-none flex items-center justify-center"
                      >
                        {showPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="flex items-center space-x-2">
                    <label className="w-20 font-poppins font-bold text-[11px] text-[var(--text-main)] shrink-0">
                      Confirm:
                    </label>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm password..."
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 pr-7 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer select-none flex items-center justify-center"
                      >
                        {showConfirmPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1 space-y-1.5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {isLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Create Account</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* LOGIN FORM */
                <form onSubmit={handleSubmit} className="space-y-3 pb-1">
                  
                  {/* Email Field */}
                  <div className="flex items-center space-x-2">
                    <label className="w-18 font-poppins font-bold text-xs text-[var(--text-main)] shrink-0">
                      Email:
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Registered email..."
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="flex items-center space-x-2">
                    <label className="w-18 font-poppins font-bold text-xs text-[var(--text-main)] shrink-0">
                      Password:
                    </label>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter password..."
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 pr-8 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-lato text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer select-none flex items-center justify-center"
                      >
                        {showPassword ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-lato pt-0.5">
                    <label className="flex items-center space-x-1 cursor-pointer text-[var(--text-secondary)]">
                      <input type="checkbox" className="rounded text-[var(--color-primary-600)]" />
                      <span>Remember me</span>
                    </label>
                    <a href="#forgot" className="text-[var(--color-primary-600)] hover:underline font-semibold">
                      Forgot password?
                    </a>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {isLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Sign In</span>
                      )}
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <span className="text-[10px] font-lato text-[var(--text-muted)]">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="font-bold text-[var(--color-primary-600)] hover:underline cursor-pointer"
                      >
                        Register here
                      </button>
                    </span>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default AuthPage;
