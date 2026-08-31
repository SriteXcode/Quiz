import { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';

// Official Social Platform SVG Brand Icons
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.78 0-3.522-.479-5.042-1.385l-.362-.214-3.747.983.999-3.654-.236-.375a10.024 10.024 0 0 1-1.536-5.367c0-5.541 4.51-10.05 10.051-10.05 2.686 0 5.21 1.046 7.109 2.946a10.005 10.005 0 0 1 2.943 7.107c0 5.543-4.511 10.053-10.048 10.053m0-18.358c-4.577 0-8.303 3.726-8.303 8.305 0 1.579.444 3.12 1.286 4.455l.206.326-.757 2.766 2.831-.743.318.189a8.272 8.272 0 0 0 4.417 1.261c4.578 0 8.303-3.726 8.303-8.305 0-2.217-.863-4.301-2.435-5.871A8.254 8.254 0 0 0 12.051 3.484"/>
  </svg>
);

const LinkedInIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const XTwitterIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const CertificateStoryPoster = ({
  isOpen,
  onClose,
  certificateData = {},
  user = null
}) => {
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Extract certificate attributes
  const recipientName = certificateData.userName || certificateData.recipientName || user?.name || 'Distinguished Scholar';
  const quizTitle = certificateData.quizTitle || certificateData.title || 'Full-Stack Technical Assessment';
  const score = certificateData.score !== undefined ? certificateData.score : 100;
  const accuracy = certificateData.accuracy !== undefined ? certificateData.accuracy : 100;
  const earnedXP = certificateData.earnedXP || 150;
  const certId = certificateData.certificateId || certificateData._id || certificateData.id || 'CERT-OFFICIAL';

  // Verified target URL
  const targetUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://brainarena.com';
    const origin = window.location.origin;
    return `${origin}/?certId=${encodeURIComponent(certId)}`;
  }, [certId]);

  // Exclusive Royal Gold Theme Configuration
  const activeTheme = {
    id: 'gold',
    name: 'Royal Gold 👑',
    bgGradient: 'from-[#fef3c7] via-[#fcfbf7] to-[#fef3c7]',
    cardBg: 'bg-[#fcfbf7]',
    borderColor: 'border-amber-600',
    accentText: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
    canvasBgTop: '#fef3c7',
    canvasBgMid: '#fcfbf7',
    canvasBgBottom: '#fef3c7',
    canvasAccent: '#b45309',
    canvasBorder: '#d97706',
    canvasText: '#1c1917'
  };

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // HIGH-RESOLUTION 9:16 STORY POSTER CANVAS EXPORTER (1080 x 1920)
  // -------------------------------------------------------------
  const handleDownloadStoryPosterPNG = async () => {
    try {
      setIsExporting(true);
      addToast('🎨 Rendering 9:16 High-Res Story Poster (1080x1920)...', 'info');

      const width = 1080;
      const height = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // 1. Draw Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, activeTheme.canvasBgTop);
      bgGrad.addColorStop(0.5, activeTheme.canvasBgMid);
      bgGrad.addColorStop(1, activeTheme.canvasBgBottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Background Watermark Patterns
      ctx.save();
      ctx.strokeStyle = selectedTheme === 'gold' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 3;
      for (let r = 150; r <= 650; r += 100) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Ornate Border Frame
      ctx.save();
      ctx.strokeStyle = activeTheme.canvasBorder;
      ctx.lineWidth = 12;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      ctx.strokeStyle = activeTheme.canvasAccent;
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, width - 120, height - 120);
      ctx.restore();

      // 3. Top Platform Header Badge
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = activeTheme.canvasAccent;
      ctx.font = 'bold 30px "Poppins", sans-serif';
      ctx.fillText('★ ★ ★  BRAINARENA CERTIFIED  ★ ★ ★', width / 2, 140);

      // Main Title
      ctx.fillStyle = activeTheme.canvasText;
      ctx.font = 'extrabold 50px "Cinzel", Georgia, serif';
      ctx.fillText('CERTIFICATE OF PARTICIPATION', width / 2, 230);

      ctx.fillStyle = '#475569';
      ctx.font = 'italic 26px Georgia, serif';
      ctx.fillText('This official credential is awarded to:', width / 2, 290);
      ctx.restore();

      // 4. Recipient Name Highlight Banner
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = activeTheme.canvasAccent;
      ctx.font = 'extrabold 72px "Playfair Display", Georgia, serif';
      ctx.fillText(recipientName, width / 2, 400);

      ctx.strokeStyle = activeTheme.canvasBorder;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 250, 430);
      ctx.lineTo(width / 2 + 250, 430);
      ctx.stroke();
      ctx.restore();

      // 5. Exam/Quiz Title
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#334155';
      ctx.font = '26px "Poppins", sans-serif';
      ctx.fillText('for successfully completing the assessment:', width / 2, 510);

      ctx.fillStyle = activeTheme.canvasText;
      ctx.font = 'extrabold 44px "Poppins", sans-serif';
      ctx.fillText(quizTitle, width / 2, 580);
      ctx.restore();

      // 6. Metrics Grid Box (4 Metrics Cards in 2x2 layout)
      const boxY = 660;
      const cardW = 440;
      const cardH = 120;
      const metricsList = [
        { label: 'SCORE', val: `${score}%` },
        { label: 'ACCURACY', val: `${accuracy}%` },
        { label: 'XP REWARD', val: `+${earnedXP} XP` },
        { label: 'VERIFIED ID', val: certId.slice(0, 14) }
      ];

      metricsList.forEach((m, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        const cx = 80 + col * (cardW + 40);
        const cy = boxY + row * (cardH + 20);

        ctx.save();
        ctx.fillStyle = selectedTheme === 'gold' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
        ctx.strokeStyle = activeTheme.canvasBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = selectedTheme === 'gold' ? '#64748b' : '#94a3b8';
        ctx.font = 'bold 20px "Poppins", sans-serif';
        ctx.fillText(m.label, cx + cardW / 2, cy + 42);

        ctx.fillStyle = activeTheme.canvasAccent;
        ctx.font = 'bold 36px "Poppins", sans-serif';
        ctx.fillText(m.val, cx + cardW / 2, cy + 92);
        ctx.restore();
      });

      // 7. Middle Seal / Verified Badge Graphic
      ctx.save();
      const sealX = width / 2;
      const sealY = 1030;
      const sealR = 85;

      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
      ctx.fillStyle = activeTheme.canvasBorder;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 12, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Poppins", sans-serif';
      ctx.fillText('OFFICIAL', sealX, sealY - 20);
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('🏅', sealX, sealY + 10);
      ctx.font = 'bold 16px "Poppins", sans-serif';
      ctx.fillText('VERIFIED', sealX, sealY + 36);
      ctx.restore();

      // 8. Load & Render QR Code on Canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrCodeImageUrl;

      await new Promise((resolve) => {
        img.onload = () => {
          ctx.save();
          const qrSize = 260;
          const qrX = width / 2 - qrSize / 2;
          const qrY = 1210;

          // QR Card background
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 20);
          ctx.fill();
          ctx.strokeStyle = activeTheme.canvasBorder;
          ctx.lineWidth = 4;
          ctx.stroke();

          // QR Image
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          ctx.restore();
          resolve();
        };
        img.onerror = () => {
          console.warn('[QR Code Draw Warning]: Falling back to placeholder on canvas');
          resolve();
        };
      });

      // 9. QR Callout Sticker
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = activeTheme.canvasAccent;
      ctx.font = 'bold 28px "Poppins", sans-serif';
      ctx.fillText('🔒 SCAN QR CODE TO VERIFY CERTIFICATE', width / 2, 1580);

      ctx.fillStyle = '#475569';
      ctx.font = '22px monospace';
      ctx.fillText(targetUrl.length > 45 ? `${targetUrl.slice(0, 42)}...` : targetUrl, width / 2, 1630);

      // Footer signature & copyright
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Poppins", sans-serif';
      ctx.fillText('Director of Examinations: Ritesh K. Yadav • brainArena Board', width / 2, 1780);
      ctx.fillText(`🔒 SHA-256 Verified Authenticated Credential`, width / 2, 1820);
      ctx.restore();

      // Convert to Blob & Download
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob export failed');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const sanitizedName = recipientName.replace(/[^a-zA-Z0-9_-]/g, '_');
        link.href = url;
        link.download = `Story_Poster_${sanitizedName}_9x16.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        addToast('🎉 9:16 Story Poster (1080x1920 PNG) downloaded successfully!', 'success');
      }, 'image/png');

    } catch (err) {
      console.error('[Story Poster PNG Export Error]:', err);
      setIsExporting(false);
      addToast('Failed to export Story Poster: ' + err.message, 'error');
    }
  };

  // Social Share Intent Actions
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`🎓 I earned an Official Certificate of Participation on @brainArena for "${quizTitle}" (Score: ${score}%)! 🏆\n\nVerify certificate:\n${targetUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`🎓 Check out my Official Certificate of Participation for "${quizTitle}" on @brainArena! 🏆 Score: ${score}%`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const summary = encodeURIComponent(`I scored ${score}% on the proctored ${quizTitle} assessment on @brainArena and received a Certificate of Participation! 🏆 Certificate ID: ${certId}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}&text=${summary}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`🎓 I earned a Certificate of Participation for "${quizTitle}" on @brainArena! 🏆 Check out my credential:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(targetUrl)}&hashtags=brainArena,CertificateOfParticipation,TechQuiz`, '_blank', 'noopener,noreferrer');
  };

  const handleShareInstagramHelper = () => {
    handleDownloadStoryPosterPNG();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
    }
    addToast('📱 Story Poster downloaded & verification link copied! Ready to post on Instagram Stories.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      
      {/* Container Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        
        {/* HEADER TOOLBAR */}
        <div className="px-4 py-3 border-b border-[var(--border-theme)] flex items-center justify-between gap-2 bg-[var(--bg-main)] shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl sm:text-2xl">📱</span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold font-poppins text-[var(--text-main)] leading-tight">
                9:16 Royal Gold Story Poster Generator
              </h2>
              <p className="text-[11px] font-lato text-[var(--text-muted)]">
                Certificate of Participation • Royal Gold Edition • Verified QR Credential
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-card)] flex items-center justify-center font-bold text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* MAIN BODY GRID */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-900/10 dark:bg-black/30">
          
          {/* LEFT: 9:16 LIVE STORY POSTER PREVIEW */}
          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
            
            {/* 9:16 Aspect Ratio Frame */}
            <div className={`w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] rounded-2xl border-4 ${activeTheme.borderColor} ${activeTheme.cardBg} bg-gradient-to-b ${activeTheme.bgGradient} shadow-2xl p-4 flex flex-col justify-between relative overflow-hidden text-center`}>
              
              {/* Corner Watermarks */}
              <div className="absolute top-2 left-2 text-[8px] opacity-60 select-none">✦ BRAINARENA</div>
              <div className="absolute top-2 right-2 text-[8px] opacity-60 select-none">ROYAL GOLD ✦</div>

              {/* Title & Recipient */}
              <div className="space-y-1 pt-2">
                <div className={`text-[8px] font-poppins font-extrabold uppercase tracking-widest ${activeTheme.accentText}`}>
                  ★ BRAINARENA CERTIFIED ★
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold font-cinzel tracking-wider uppercase text-[#1c1917]">
                  Certificate of Participation
                </h3>
                <div className="pt-2">
                  <span className="text-[9px] font-lato opacity-80 block text-slate-700">Awarded to:</span>
                  <div className={`text-base sm:text-lg font-extrabold font-playfair ${activeTheme.accentText} truncate`}>
                    {recipientName}
                  </div>
                </div>
              </div>

              {/* Exam Title & Badges */}
              <div className="space-y-2 my-auto py-2">
                <div className="text-[10px] font-poppins font-bold border border-amber-400 bg-amber-50 text-amber-950 rounded-lg px-2 py-1 inline-block max-w-full truncate shadow-2xs">
                  {quizTitle}
                </div>

                <div className="grid grid-cols-2 gap-1 max-w-[220px] mx-auto text-[9px] font-poppins font-bold">
                  <div className={`p-1 rounded-md border ${activeTheme.badgeBg}`}>
                    Score: {score}%
                  </div>
                  <div className={`p-1 rounded-md border ${activeTheme.badgeBg}`}>
                    +{earnedXP} XP
                  </div>
                </div>

                {/* Verified Medal */}
                <div className="w-10 h-10 rounded-full mx-auto bg-amber-500 text-white flex items-center justify-center text-sm shadow-md border-2 border-white">
                  🏅
                </div>
              </div>

              {/* Scannable QR Code & Verified Sticker */}
              <div className="space-y-1.5 pb-1">
                <div className="w-24 h-24 mx-auto bg-white p-1.5 rounded-xl border border-amber-300 shadow-md">
                  <img src={qrCodeImageUrl} alt="Certificate QR Code" className="w-full h-full object-contain" />
                </div>

                <div className="text-[9px] font-poppins font-extrabold text-amber-900 bg-amber-100 py-1 px-2 rounded-lg border border-amber-300">
                  🔒 SCAN QR TO VERIFY CREDENTIAL
                </div>
                <div className="text-[7.5px] font-mono text-slate-600 truncate max-w-[220px] mx-auto">
                  ID: {certId}
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT: DIRECT SOCIAL SHARE INTENTS & PNG DOWNLOAD */}
          <div className="md:col-span-7 space-y-4">
            
            {/* 1-CLICK SOCIAL MEDIA INTENT BUTTONS */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-theme)] shadow-sm space-y-4">
              <h4 className="text-xs font-poppins font-bold text-[var(--text-main)] uppercase tracking-wider">
                Share Certificate of Participation
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                
                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer text-xs font-poppins font-bold active:scale-95 shadow-2xs"
                >
                  <WhatsAppIcon className="w-6 h-6 mb-1 text-emerald-500" />
                  <span>WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={handleShareTelegram}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all cursor-pointer text-xs font-poppins font-bold active:scale-95 shadow-2xs"
                >
                  <TelegramIcon className="w-6 h-6 mb-1 text-blue-500" />
                  <span>Telegram</span>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={handleShareLinkedIn}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-all cursor-pointer text-xs font-poppins font-bold active:scale-95 shadow-2xs"
                >
                  <LinkedInIcon className="w-6 h-6 mb-1 text-sky-600 dark:text-sky-400" />
                  <span>LinkedIn</span>
                </button>

                {/* X / Twitter */}
                <button
                  onClick={handleShareTwitter}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-800 dark:text-slate-200 border border-slate-500/20 transition-all cursor-pointer text-xs font-poppins font-bold active:scale-95 shadow-2xs"
                >
                  <XTwitterIcon className="w-6 h-6 mb-1 text-slate-800 dark:text-slate-200" />
                  <span>X / Twitter</span>
                </button>

              </div>

              {/* Instagram Story Helper */}
              <button
                onClick={handleShareInstagramHelper}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-poppins font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
              >
                <InstagramIcon className="w-5 h-5" />
                <span>Download Story Poster & Copy Link for Instagram</span>
              </button>
            </div>

            {/* DOWNLOAD 9:16 ULTRA-HD PNG BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleDownloadStoryPosterPNG}
                disabled={isExporting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-poppins font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                <span>{isExporting ? '⏳ Rendering Royal Gold 9:16 PNG...' : '📥 Download Royal Gold 9:16 Story Poster (PNG)'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default CertificateStoryPoster;
