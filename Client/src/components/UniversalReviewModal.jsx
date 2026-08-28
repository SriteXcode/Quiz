import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiSubmitReview } from '../services/api';

export const UniversalReviewModal = ({ isOpen, onClose, onSuccess, initialQuiz = null }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setRole(user.studentClass || user.school || 'Student Candidate');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quote.trim()) {
      addToast('Please enter your review text', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userName: userName.trim() || 'Anonymous Candidate',
        userEmail: user?.email || '',
        role: role.trim() || 'Student Candidate',
        rating,
        quote: quote.trim(),
        quizId: initialQuiz?._id || initialQuiz?.id || null,
        quizTitle: initialQuiz?.title || initialQuiz?.quizTitle || '',
        avatarUrl: user?.avatarUrl || user?.avatar || user?.profileImage || ''
      };

      const res = await apiSubmitReview(payload);
      if (res && res.success !== false) {
        addToast('✨ Thank you! Your review has been submitted.', 'success');
        setQuote('');
        if (onSuccess) onSuccess(res.review);
        onClose();
      } else {
        addToast(res?.message || 'Failed to submit review', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error submitting review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 relative text-[var(--text-main)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-theme)]">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
              ⭐
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-poppins text-[var(--text-main)]">
                {initialQuiz ? `Review Quiz: ${initialQuiz.title}` : 'Share Your Review'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-lato">
                Your feedback helps thousands of students on brainArena!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--border-theme)] flex items-center justify-center text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Rating Stars Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Overall Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl sm:text-3xl transition-transform transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <span className={isFilled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}>
                      ★
                    </span>
                  </button>
                );
              })}
              <span className="ml-3 text-sm font-bold font-poppins text-amber-500">
                {rating} / 5
              </span>
            </div>
          </div>

          {/* Name & Role Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Rahul Srivastav"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-500)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Role / College / Class
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. BCA Student / Web Dev"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-500)]"
              />
            </div>
          </div>

          {/* Review Quote Text */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[var(--text-muted)]">
                Your Feedback / Review *
              </label>
              <span className={`text-[10px] font-mono font-bold ${quote.length >= 200 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                {quote.length}/220 chars max
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={220}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="What did you like about the quiz platform or practice experience? (Keep it crisp)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-500)] resize-none"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--border-theme)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-white font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Review</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default UniversalReviewModal;
