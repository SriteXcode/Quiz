import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CertificateStoryPoster from './CertificateStoryPoster';

// Official Social Platform SVG Brand Logos
const WhatsAppIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.78 0-3.522-.479-5.042-1.385l-.362-.214-3.747.983.999-3.654-.236-.375a10.024 10.024 0 0 1-1.536-5.367c0-5.541 4.51-10.05 10.051-10.05 2.686 0 5.21 1.046 7.109 2.946a10.005 10.005 0 0 1 2.943 7.107c0 5.543-4.511 10.053-10.048 10.053m0-18.358c-4.577 0-8.303 3.726-8.303 8.305 0 1.579.444 3.12 1.286 4.455l.206.326-.757 2.766 2.831-.743.318.189a8.272 8.272 0 0 0 4.417 1.261c4.578 0 8.303-3.726 8.303-8.305 0-2.217-.863-4.301-2.435-5.871A8.254 8.254 0 0 0 12.051 3.484"/>
  </svg>
);

const LinkedInIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const XTwitterIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const FacebookIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const QuizShareModal = ({
  isOpen,
  onClose,
  quiz = null,
  certificate = null,
  score = null,
  timeTakenSeconds: _timeTakenSeconds = null
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [hideScore, setHideScore] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [_copiedCaption, setCopiedCaption] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isStoryPosterOpen, setIsStoryPosterOpen] = useState(false);

  const handleOpenTargetWebsite = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    addToast('🚀 Opening active website link...', 'info');
  };

  // Derive target quiz & certificate identifiers
  const isCertificateMode = Boolean(certificate);
  const quizId = quiz?._id || quiz?.id || certificate?.quizId || '';
  const certId = certificate?.certificateId || certificate?._id || certificate?.id || '';
  const quizTitle = quiz?.title || certificate?.quizTitle || 'Tech Assessment Challenge';
  const recipientName = certificate?.recipientName || user?.name || 'Candidate';
  const displayScore = score ?? certificate?.score ?? null;

  // Construct absolute URL with deep-link & referral attribution
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const params = new URLSearchParams();

    if (quizId) params.set('quizId', quizId);
    if (certId) params.set('certId', certId);
    if (user?._id || user?.id) params.set('ref', user._id || user.id);

    const queryString = params.toString();
    return queryString ? `${origin}/?${queryString}` : origin;
  }, [quizId, certId, user]);

  // Construct dynamic pre-filled post caption with @brainArena mention
  const shareCaption = useMemo(() => {
    const brandMention = '@brainArena';
    
    if (isCertificateMode) {
      const scoreStr = !hideScore && displayScore !== null ? ` with a score of ${displayScore}%` : '';
      return `🎓 I earned an Official Certificate of Participation on ${brandMention} for completing the "${quizTitle}" assessment${scoreStr}! 🏆 Verification ID: ${certId}\n\nCheck out my credential and challenge yourself:`;
    }

    if (displayScore !== null && !hideScore) {
      return `⚡ I scored ${displayScore}% on the "${quizTitle}" assessment on ${brandMention}! Can you beat my score? 🚀\n\nTake the challenge here:`;
    }

    return `🧠 Challenge yourself on the "${quizTitle}" assessment on ${brandMention}! ⚡ Test your technical proficiency and climb the global leaderboard:`;
  }, [isCertificateMode, hideScore, displayScore, quizTitle, certId]);

  if (!isOpen) return null;

  // 1. Native Mobile Device Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: quizTitle,
          text: `${shareCaption}\n${shareUrl}`,
          url: shareUrl
        });
        addToast('Shared successfully!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          addToast('Could not launch native share', 'info');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // 2. Direct Social Intent Buttons
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareCaption}\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const summary = encodeURIComponent(`${shareCaption}\n${shareUrl}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&text=${summary}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${shareCaption}`);
    const hashtags = 'brainArena,TechQuiz,CodingChallenge';
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(shareCaption);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  // 3. Instagram Helper (Copy Caption & Story Link)
  const handleInstagramShareHelper = () => {
    const fullText = `${shareCaption}\n\nLink: ${shareUrl}\n#brainArena #TechQuiz #VerifiedCertificate #Coding`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
      addToast('📋 Instagram caption & link copied! Paste in your Story or Bio.', 'success');
    }
  };

  // 4. One-Click Copy Direct URL
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      addToast('🔗 Quiz Share Link copied to clipboard!', 'success');
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl w-full max-w-lg shadow-2xl p-5 sm:p-7 space-y-5 relative text-[var(--text-main)] overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-theme)]">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-[var(--color-primary-50)] dark:bg-blue-950/60 text-[var(--color-primary-600)] flex items-center justify-center text-xl shrink-0 shadow-sm">
              {isCertificateMode ? '🎓' : '🔗'}
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold font-poppins text-[var(--text-main)] truncate">
                {isCertificateMode ? 'Share Verified Certificate' : 'Share Quiz Challenge'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-lato truncate">
                Tagging <span className="font-bold text-[var(--color-primary-600)]">@brainArena</span> • Direct link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--border-theme)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* QUIZ / CERTIFICATE CARD PREVIEW */}
        <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-start space-x-3.5">
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] shrink-0 overflow-hidden flex items-center justify-center p-1 shadow-sm">
            {quiz?.posterUrl || quiz?.languageLogoUrl ? (
              <img src={quiz.posterUrl || quiz.languageLogoUrl} alt={quizTitle} className="w-full h-full object-contain" />
            ) : isCertificateMode ? (
              <span className="text-2xl">📜</span>
            ) : (
              <span className="text-2xl">⚡</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-[10px] font-poppins font-extrabold px-2 py-0.5 rounded bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-blue-950 dark:text-blue-300">
                {quiz?.category || 'Web Dev'}
              </span>
              {displayScore !== null && (
                <span className={`text-[10px] font-poppins font-bold px-2 py-0.5 rounded ${
                  hideScore
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                }`}>
                  {hideScore ? '🔒 Score Hidden' : `Score: ${displayScore}%`}
                </span>
              )}
            </div>
            <h4 className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)] truncate">
              {quizTitle}
            </h4>
            {isCertificateMode && (
              <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                Recipient: {recipientName} • ID: {certId}
              </p>
            )}
          </div>
        </div>

        {/* 🔒 SCORE PRIVACY TOGGLE SWITCH */}
        {displayScore !== null && (
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-between gap-2">
            <div>
              <label htmlFor="hide-score-toggle" className="text-xs font-poppins font-bold text-[var(--text-main)] block cursor-pointer">
                🔒 Hide my score percentage in shared post
              </label>
              <p className="text-[10px] font-lato text-[var(--text-muted)] mt-0.5">
                {hideScore
                  ? 'Sharing completion status & verified certificate without revealing exact score.'
                  : 'Score percentage (e.g. 95%) will be included in shared post text.'}
              </p>
            </div>
            <input
              id="hide-score-toggle"
              type="checkbox"
              checked={hideScore}
              onChange={(e) => setHideScore(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-theme)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)] cursor-pointer shrink-0"
            />
          </div>
        )}

        {/* POST CAPTION PREVIEW */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-poppins font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Post Preview & Tagging (@brainArena)
          </label>
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-lato text-[var(--text-main)] leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar">
            {shareCaption}
          </div>
        </div>

        {/* NATIVE MOBILE DEVICE SHARE (IF SUPPORTED) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>📱 Share via Installed Mobile Apps</span>
          </button>
        )}

        {/* OFFICIAL SOCIAL MEDIA BRAND LOGO INTENT BUTTONS GRID */}
        <div>
          <label className="block text-[11px] font-poppins font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Share Directly to Social Networks
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            
            {/* Official WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer group active:scale-95 shadow-2xs"
              title="Share to WhatsApp"
            >
              <WhatsAppIcon className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-poppins font-bold mt-1.5">WhatsApp</span>
            </button>

            {/* Official LinkedIn */}
            <button
              onClick={handleShareLinkedIn}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-all cursor-pointer group active:scale-95 shadow-2xs"
              title="Share to LinkedIn"
            >
              <LinkedInIcon className="w-6 h-6 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-poppins font-bold mt-1.5">LinkedIn</span>
            </button>

            {/* Official X / Twitter */}
            <button
              onClick={handleShareTwitter}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-800 dark:text-slate-200 border border-slate-500/20 transition-all cursor-pointer group active:scale-95 shadow-2xs"
              title="Share to X (Twitter)"
            >
              <XTwitterIcon className="w-6 h-6 text-slate-800 dark:text-slate-200 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-poppins font-bold mt-1.5">X / Twitter</span>
            </button>

            {/* Official Telegram */}
            <button
              onClick={handleShareTelegram}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all cursor-pointer group active:scale-95 shadow-2xs"
              title="Share to Telegram"
            >
              <TelegramIcon className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-poppins font-bold mt-1.5">Telegram</span>
            </button>

            {/* Official Facebook */}
            <button
              onClick={handleShareFacebook}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer group active:scale-95 shadow-2xs"
              title="Share to Facebook"
            >
              <FacebookIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-poppins font-bold mt-1.5">Facebook</span>
            </button>

            {/* Official Instagram */}
            <button
              onClick={handleInstagramShareHelper}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/20 transition-all cursor-pointer group active:scale-95 shadow-2xs"
              title="Copy Caption for Instagram"
            >
              <InstagramIcon className="w-6 h-6 text-pink-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-poppins font-bold mt-1.5">Instagram</span>
            </button>
          </div>
        </div>

        {/* ONE-CLICK COPY DIRECT QUIZ LINK & QR TOGGLE */}
        <div className="flex flex-col space-y-2 pt-2 border-t border-[var(--border-theme)]">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="absolute right-1 top-1 bottom-1 px-3 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold rounded-lg transition-all cursor-pointer"
              >
                {copiedLink ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="p-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-xs font-poppins font-bold text-[var(--text-main)] cursor-pointer shrink-0"
              title="Toggle QR Code"
            >
              {showQrCode ? '✕ QR' : '📷 QR Code'}
            </button>
          </div>

          {/* 📱 9:16 SOCIAL MEDIA STORY POSTER BUTTON */}
          <button
            type="button"
            onClick={() => setIsStoryPosterOpen(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-poppins font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>📱 Generate & Customize 9:16 Story Poster (PNG)</span>
          </button>
        </div>

        {/* DYNAMIC QR CODE DISPLAY */}
        {showQrCode && (
          <div className="p-4 rounded-2xl bg-white text-slate-900 flex flex-col items-center justify-center space-y-2 border border-slate-200 animate-fadeIn">
            <img src={qrCodeUrl} alt="Quiz QR Code" className="w-36 h-36 border border-slate-200 rounded-lg p-1" />
            <p className="text-[10px] font-poppins font-bold text-slate-600">
              Scan with mobile camera to open quiz directly
            </p>
          </div>
        )}

        {/* JOIN WHATSAPP COMMUNITY FOOTER BANNER */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center space-x-2">
            <WhatsAppIcon className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-[11px] font-poppins font-bold">
              Join brainArena WhatsApp Community
            </div>
          </div>
          <a
            href="https://chat.whatsapp.com/BkBrToj3Hzv6ekv8BqSzO1"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-[11px] transition-all cursor-pointer shrink-0 shadow-xs"
          >
            Join Group →
          </a>
        </div>

      </div>

      {/* 9:16 STORY POSTER MODAL */}
      <CertificateStoryPoster
        isOpen={isStoryPosterOpen}
        onClose={() => setIsStoryPosterOpen(false)}
        certificateData={{
          certificateId: certId,
          quizTitle,
          recipientName,
          score: displayScore !== null ? displayScore : 100,
          id: quizId
        }}
        user={user}
      />
    </div>
  );
};

export default QuizShareModal;
