import { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';

export const CertificateModal = ({
  isOpen,
  onClose,
  data = {},
  user = null
}) => {
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Strictly use authenticated/registered user name - no custom editing
  const recipientName = data.userName || user?.name || (user?.email ? user.email.split('@')[0] : 'Distinguished Scholar');

  const quizTitle = data.quizTitle || data.title || 'Full-Stack JavaScript Assessment';
  const score = data.score !== undefined ? data.score : 100;
  const accuracy = data.accuracy !== undefined ? data.accuracy : 100;
  const earnedXP = data.earnedXP || 150;
  
  const certificateId = useMemo(() => {
    if (data.certificateId) return data.certificateId;
    if (data._id || data.id) return `CERT-${data._id || data.id}`;
    const cleanName = (data.userName || 'CANDIDATE').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    return `CERT-QZ-${cleanName || 'GOLD'}-OFFICIAL`;
  }, [data.certificateId, data._id, data.id, data.userName]);
  
  const issueDate = useMemo(() => {
    if (data.issuedAt) {
      return new Date(data.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (data.createdAt) {
      return new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return 'August 16, 2026';
  }, [data.issuedAt, data.createdAt]);

  if (!isOpen) return null;

  // Determine achievement grade
  const getGrade = () => {
    if (score >= 90) return { title: 'High Distinction', color: 'text-amber-500' };
    if (score >= 75) return { title: 'Excellence', color: 'text-emerald-500' };
    return { title: 'Completion', color: 'text-blue-500' };
  };
  const gradeInfo = getGrade();

  // Official Standard Gold Theme Configuration
  const theme = {
    bgClass: 'bg-[#fcfbf7] text-[#1c1917]',
    borderOuter: '#d97706',
    borderInner: '#b45309',
    accentColor: '#b45309',
    sealFill: '#f59e0b',
    sealRibbon: '#b45309',
    badgeBg: 'bg-amber-100/80 border-amber-300 text-amber-950',
    canvasBg: '#fcfbf7',
    canvasBorder: '#d97706',
    canvasAccent: '#b45309',
    canvasText: '#1c1917'
  };

  // -------------------------------------------------------------
  // HIGH-RESOLUTION CANVAS 2D EXPORTER (3000 x 2000 Ultra-HD PNG)
  // -------------------------------------------------------------
  const handleDownloadPNG = async () => {
    try {
      setIsExporting(true);
      addToast('🎨 Generating High-Resolution 4K Certificate...', 'info');

      const width = 3000;
      const height = 2000;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context could not be initialized');
      }

      // 1. Fill Background
      ctx.fillStyle = theme.canvasBg;
      ctx.fillRect(0, 0, width, height);

      // Concentric rings watermark in center
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.03)';
      ctx.lineWidth = 2;
      for (let r = 200; r <= 800; r += 100) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Draw Luxury Ornate Border Frames
      ctx.save();
      ctx.strokeStyle = theme.canvasBorder;
      ctx.lineWidth = 14;
      ctx.strokeRect(60, 60, width - 120, height - 120);

      ctx.strokeStyle = theme.canvasAccent;
      ctx.lineWidth = 4;
      ctx.strokeRect(85, 85, width - 170, height - 170);

      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(105, 105, width - 210, height - 210);
      ctx.setLineDash([]);

      const corners = [
        { x: 85, y: 85, dx: 1, dy: 1 },
        { x: width - 85, y: 85, dx: -1, dy: 1 },
        { x: 85, y: height - 85, dx: 1, dy: -1 },
        { x: width - 85, y: height - 85, dx: -1, dy: -1 }
      ];

      ctx.fillStyle = theme.canvasBorder;
      corners.forEach((c) => {
        ctx.fillRect(c.x - (c.dx > 0 ? 0 : 40), c.y - (c.dy > 0 ? 0 : 40), 40, 40);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y + c.dy * 60);
        ctx.lineTo(c.x + c.dx * 60, c.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = theme.canvasAccent;
        ctx.stroke();
      });
      ctx.restore();

      // 3. Header Crest & Platform Name
      ctx.save();
      ctx.textAlign = 'center';
      
      ctx.fillStyle = theme.canvasAccent;
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('★ ★ ★  QUIZ PLATFORM GLOBAL CERTIFICATION  ★ ★ ★', width / 2, 230);

      ctx.fillStyle = theme.canvasText;
      ctx.font = 'bold 92px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('CERTIFICATE OF MASTERY', width / 2, 360);

      ctx.fillStyle = '#57534e';
      ctx.font = 'italic 34px "Playfair Display", Georgia, serif';
      ctx.fillText('This official credential is proudly awarded to', width / 2, 450);

      // 4. Recipient Name
      ctx.fillStyle = theme.canvasAccent;
      ctx.font = 'bold 110px "Playfair Display", Georgia, serif';
      ctx.fillText(recipientName || 'Candidate', width / 2, 600);

      ctx.strokeStyle = theme.canvasBorder;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 400, 640);
      ctx.lineTo(width / 2 + 400, 640);
      ctx.stroke();

      ctx.fillStyle = theme.canvasBorder;
      ctx.beginPath();
      ctx.arc(width / 2, 640, 10, 0, Math.PI * 2);
      ctx.fill();

      // 5. Achievement Description Statement
      ctx.fillStyle = '#475569';
      ctx.font = '36px "Lato", "Poppins", sans-serif';
      ctx.fillText(
        'for demonstrating technical mastery and successfully completing the proctored assessment in:',
        width / 2,
        730
      );

      // 6. Quiz Title in Bold Frame
      ctx.fillStyle = theme.canvasText;
      ctx.font = 'bold 58px "Poppins", "Cinzel", sans-serif';
      ctx.fillText(quizTitle, width / 2, 830);

      // 7. Metrics Badges Row
      const metricsY = 960;
      const metrics = [
        { label: 'EXAM SCORE', value: `${score}%` },
        { label: 'ACCURACY RATE', value: `${accuracy}%` },
        { label: 'XP REWARD', value: `+${earnedXP} XP` },
        { label: 'HONORS GRADE', value: gradeInfo.title }
      ];

      const startX = width / 2 - 900;
      const boxWidth = 400;
      const boxGap = 70;

      metrics.forEach((m, idx) => {
        const bx = startX + idx * (boxWidth + boxGap);
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, metricsY, boxWidth, 140, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 22px "Poppins", sans-serif';
        ctx.fillText(m.label, bx + boxWidth / 2, metricsY + 45);

        ctx.fillStyle = theme.canvasAccent;
        ctx.font = 'bold 36px "Poppins", sans-serif';
        ctx.fillText(m.value, bx + boxWidth / 2, metricsY + 105);
      });

      // 8. Bottom Footer
      const footerY = 1380;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 26px "Poppins", sans-serif';
      ctx.fillText('DATE OF ISSUANCE:', 320, footerY);
      
      ctx.fillStyle = theme.canvasText;
      ctx.font = 'bold 34px "Playfair Display", Georgia, serif';
      ctx.fillText(issueDate, 320, footerY + 50);

      ctx.fillStyle = '#64748b';
      ctx.font = '22px monospace';
      ctx.fillText(`ID: ${certificateId}`, 320, footerY + 100);

      // Seal
      ctx.save();
      const sealX = width / 2;
      const sealY = footerY + 30;
      const sealRadius = 110;

      ctx.fillStyle = theme.sealFill;
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 12;
        const rOuter = sealRadius + 14;
        const sx = sealX + Math.cos(angle) * rOuter;
        const sy = sealY + Math.sin(angle) * rOuter;
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
      ctx.fillStyle = theme.sealFill;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = theme.sealRibbon;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sealX, sealY, sealRadius - 18, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Poppins", sans-serif';
      ctx.fillText('OFFICIAL', sealX, sealY - 30);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('★ 🏅 ★', sealX, sealY + 5);
      ctx.font = 'bold 18px "Poppins", sans-serif';
      ctx.fillText('VERIFIED', sealX, sealY + 38);
      ctx.font = '12px "Poppins", sans-serif';
      ctx.fillText('EXCELLENCE', sealX, sealY + 55);
      ctx.restore();

      // Right: Signature
      ctx.textAlign = 'right';
      ctx.fillStyle = theme.canvasAccent;
      ctx.font = 'italic 62px "Alex Brush", cursive, "Playfair Display"';
      ctx.fillText('Ritesh K. Yadav', width - 320, footerY + 20);

      ctx.strokeStyle = theme.canvasBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width - 620, footerY + 45);
      ctx.lineTo(width - 320, footerY + 45);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 24px "Poppins", sans-serif';
      ctx.fillText('Director of Examinations', width - 320, footerY + 80);

      ctx.fillStyle = '#64748b';
      ctx.font = '20px "Lato", sans-serif';
      ctx.fillText('Quiz Platform Certification Board', width - 320, footerY + 115);

      // Verification Tag
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.font = '18px monospace';
      ctx.fillText(
        `🔒 Authenticated Credential: https://quizplatform.dev/verify/${certificateId} • SHA-256 Verified`,
        width / 2,
        height - 120
      );

      ctx.restore();

      // Convert to Blob and Trigger Direct Browser Download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to generate image blob');
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const sanitizedName = (recipientName || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
        const sanitizedTitle = (quizTitle || 'Quiz').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.href = url;
        a.download = `Certificate_${sanitizedName}_${sanitizedTitle}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        addToast('🎉 High-Resolution Certificate downloaded successfully!', 'success');
      }, 'image/png');

    } catch (err) {
      console.error('[Certificate PNG Download Error]:', err);
      setIsExporting(false);
      addToast('Failed to export certificate: ' + err.message, 'error');
    }
  };

  const handlePrintPDF = () => {
    addToast('🖨️ Opening print preview (Select "Save as PDF" for document export)...', 'info');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleCopyLink = () => {
    const textToCopy = `🎓 Quiz Certificate of Mastery\nRecipient: ${recipientName}\nAssessment: ${quizTitle}\nScore: ${score}%\nVerification ID: ${certificateId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      addToast('📋 Verified Certificate details copied to clipboard!', 'success');
    } else {
      addToast('Credential ID: ' + certificateId, 'info');
    }
  };

  const handleShareLinkedIn = () => {
    const summary = encodeURIComponent(`I am thrilled to announce that I scored ${score}% on the proctored ${quizTitle} assessment on Quiz Platform! 🏆 Certificate ID: ${certificateId}`);
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${summary}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/80 backdrop-blur-md overflow-y-auto">
      
      {/* Modal Container: Scaled down to max-w-2xl */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        
        {/* TOP TOOLBAR */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[var(--border-theme)] flex items-center justify-between gap-2 bg-[var(--bg-main)] shrink-0">
          
          {/* Title & Locked Recipient Info */}
          <div className="flex items-center space-x-2">
            <span className="text-lg sm:text-xl">🎓</span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-poppins text-[var(--text-main)] leading-tight">
                Certificate of Achievement
              </h2>
              <p className="text-[9.5px] sm:text-[10.5px] font-lato text-[var(--text-muted)]">
                Awarded to <strong className="text-[var(--text-main)] font-semibold">{recipientName}</strong> • ID: <span className="font-mono font-bold text-[var(--color-primary-600)]">{certificateId}</span>
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-theme)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center font-bold text-xs cursor-pointer hover:scale-105 transition-all shrink-0"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ============================================================= */}
        {/* SCALED-DOWN LIVE VISUAL CERTIFICATE PREVIEW */}
        {/* ============================================================= */}
        <div className="p-2 sm:p-3 md:p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-900/10 dark:bg-black/30">
          
          <div
            id="printable-certificate"
            className="w-full max-w-md sm:max-w-lg md:max-w-xl aspect-[1.414/1] rounded-xl shadow-md p-2.5 sm:p-4 md:p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 border-4 sm:border-[5px] bg-[#fcfbf7] text-[#1c1917]"
            style={{
              borderColor: theme.borderOuter,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
            }}
          >
            
            {/* INNER GILDED BORDER */}
            <div
              className="absolute inset-1 sm:inset-1.5 border pointer-events-none rounded-md"
              style={{ borderColor: theme.borderInner }}
            />
            
            {/* INSET FINE DASHED FRAME */}
            <div className="absolute inset-1.5 sm:inset-2 border border-dashed border-black/15 pointer-events-none rounded" />

            {/* CORNER ACCENTS */}
            <div className="absolute top-1.5 left-1.5 text-[7px] sm:text-[8px] select-none pointer-events-none" style={{ color: theme.borderOuter }}>✦ ✦</div>
            <div className="absolute top-1.5 right-1.5 text-[7px] sm:text-[8px] select-none pointer-events-none" style={{ color: theme.borderOuter }}>✦ ✦</div>
            <div className="absolute bottom-1.5 left-1.5 text-[7px] sm:text-[8px] select-none pointer-events-none" style={{ color: theme.borderOuter }}>✦ ✦</div>
            <div className="absolute bottom-1.5 right-1.5 text-[7px] sm:text-[8px] select-none pointer-events-none" style={{ color: theme.borderOuter }}>✦ ✦</div>

            {/* WATERMARK BACKGROUND EMBLEM */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-[100px] sm:text-[130px]">
              🏛️
            </div>

            {/* 1. HEADER SECTION */}
            <div className="text-center space-y-0.5 relative z-10 pt-0.5">
              <div className="flex items-center justify-center space-x-1 text-[7px] sm:text-[8px] font-poppins font-bold tracking-widest uppercase opacity-80" style={{ color: theme.accentColor }}>
                <span>★ ★ ★</span>
                <span>QUIZ PLATFORM GLOBAL CERTIFICATION</span>
                <span>★ ★ ★</span>
              </div>

              <h1 className="text-xs sm:text-base md:text-lg font-extrabold font-cinzel tracking-wider uppercase text-[#1c1917]">
                Certificate of Mastery
              </h1>

              <p className="text-[7.5px] sm:text-[9px] font-playfair italic opacity-85">
                This official credential is proudly awarded to
              </p>
            </div>

            {/* 2. RECIPIENT NAME & STATEMENT */}
            <div className="text-center space-y-0.5 sm:space-y-1 relative z-10 my-0.5 sm:my-1">
              <div className="inline-block relative">
                <h2 className="text-sm sm:text-lg md:text-xl font-extrabold font-playfair tracking-wide" style={{ color: theme.accentColor }}>
                  {recipientName}
                </h2>
                <div className="h-0.5 w-3/4 mx-auto mt-0.5 rounded-full opacity-60" style={{ backgroundColor: theme.borderOuter }} />
              </div>

              <p className="text-[7px] sm:text-[8px] font-lato max-w-xs sm:max-w-sm mx-auto opacity-80 leading-tight">
                for demonstrating technical competence and mastery in successfully completing the assessment:
              </p>

              <div className="inline-block px-2 py-0.5 rounded-md font-poppins font-bold text-[8.5px] sm:text-[10px] border shadow-2xs" style={{ borderColor: theme.borderInner, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                {quizTitle}
              </div>
            </div>

            {/* 3. PERFORMANCE METRICS ROW */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 max-w-xs sm:max-w-sm mx-auto w-full relative z-10 text-center py-0.5">
              <div className="p-0.5 sm:p-1 rounded-md border bg-amber-100/70 border-amber-300 text-amber-950 shadow-2xs">
                <div className="text-[6px] sm:text-[7px] font-poppins font-bold uppercase opacity-75">Score</div>
                <div className="text-[10px] sm:text-xs font-extrabold font-poppins">{score}%</div>
              </div>

              <div className="p-0.5 sm:p-1 rounded-md border bg-amber-100/70 border-amber-300 text-amber-950 shadow-2xs">
                <div className="text-[6px] sm:text-[7px] font-poppins font-bold uppercase opacity-75">Accuracy</div>
                <div className="text-[10px] sm:text-xs font-extrabold font-poppins">{accuracy}%</div>
              </div>

              <div className="p-0.5 sm:p-1 rounded-md border bg-amber-100/70 border-amber-300 text-amber-950 shadow-2xs">
                <div className="text-[6px] sm:text-[7px] font-poppins font-bold uppercase opacity-75">XP Gained</div>
                <div className="text-[10px] sm:text-xs font-extrabold font-poppins">+{earnedXP}</div>
              </div>

              <div className="p-0.5 sm:p-1 rounded-md border bg-amber-100/70 border-amber-300 text-amber-950 shadow-2xs">
                <div className="text-[6px] sm:text-[7px] font-poppins font-bold uppercase opacity-75">Honors</div>
                <div className="text-[8.5px] sm:text-[10px] font-extrabold font-poppins truncate">{gradeInfo.title}</div>
              </div>
            </div>

            {/* 4. FOOTER: DATE, GOLD SEAL, SIGNATURE */}
            <div className="grid grid-cols-3 items-end pt-0.5 sm:pt-1 relative z-10 border-t border-black/10">
              
              {/* Left: Issue Date & Cert ID */}
              <div className="text-left space-y-0.5">
                <div className="text-[6px] sm:text-[7px] font-poppins font-bold uppercase opacity-75">Date of Issue</div>
                <div className="text-[7.5px] sm:text-[9px] font-bold font-playfair">{issueDate}</div>
                <div className="text-[6px] sm:text-[7px] font-mono opacity-60">ID: {certificateId}</div>
              </div>

              {/* Center: Official Verified Medal Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-xs flex flex-col items-center justify-center text-white border border-white/40" style={{ backgroundColor: theme.sealFill }}>
                  <span className="text-[7px] sm:text-[9px]">🎖️</span>
                  <span className="text-[4.5px] sm:text-[5.5px] font-poppins font-extrabold tracking-tighter uppercase leading-none">VERIFIED</span>
                </div>
              </div>

              {/* Right: Signature & Title */}
              <div className="text-right space-y-0.5">
                <div className="text-[10px] sm:text-xs font-signature" style={{ color: theme.accentColor }}>
                  Ritesh K. Yadav
                </div>
                <div className="h-0.5 w-14 ml-auto bg-black/20" />
                <div className="text-[6px] sm:text-[7px] font-poppins font-bold uppercase opacity-80">Director of Certification</div>
                <div className="text-[5.5px] sm:text-[6.5px] font-lato opacity-60">Quiz Platform Global Board</div>
              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-t border-[var(--border-theme)] flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-main)] shrink-0">
          
          {/* Share & Copy Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-semibold text-xs transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
            >
              <span>🔗 Copy ID</span>
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="px-2.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-poppins font-semibold text-xs transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
            >
              <span>💼 LinkedIn</span>
            </button>
          </div>

          {/* Download & Print Primary Actions */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrintPDF}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-poppins font-bold text-xs transition-all cursor-pointer flex items-center space-x-1 active:scale-95 shadow-xs"
            >
              <span>🖨️ Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-poppins font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center space-x-1 active:scale-95 disabled:opacity-50"
            >
              <span>{isExporting ? '⏳ Rendering...' : '📥 Download 4K PNG'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CertificateModal;
