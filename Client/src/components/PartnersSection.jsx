import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import Skeleton from './Skeleton';
import { apiGetPublicPartners } from '../services/api';

export const PartnerSkeletonCard = () => {
  return (
    <div className="w-72 sm:w-80 shrink-0 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 h-52 flex flex-col justify-between skeleton-shimmer space-y-3">
      <div>
        <Skeleton type="rect" className="w-12 h-12 rounded-xl mb-3" />
        <Skeleton type="line" className="h-3.5 w-24 rounded-full mb-2" />
        <Skeleton type="heading" className="h-4 w-44 mb-2" />
        <Skeleton type="text" className="h-3 w-full mb-1" />
        <Skeleton type="text" className="h-3 w-3/4" />
      </div>
      <div className="pt-2 border-t border-[var(--border-theme)] flex justify-between">
        <Skeleton type="line" className="h-3 w-20" />
        <Skeleton type="line" className="h-3 w-6" />
      </div>
    </div>
  );
};

export const PartnerModal = ({ partner, onClose }) => {

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!partner) return null;

  const partnerName = partner.name || 'Legal Partner';
  const partnerLogo = partner.logoUrl || partner.icon || '⚖️';
  const partnerType = partner.type || partner.tier || 'Official Legal & Verification Partner';
  const partnerDesc = partner.description || 'Official verified institutional partner and compliance council.';
  const partnerUrl = partner.websiteUrl || '#';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal backdrop" />

      {/* Modal Dialog Box */}
      <div className="w-full max-w-lg bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden relative z-10 animate-scaleUp space-y-6">
        
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--color-primary-400)] flex items-center justify-center text-sm font-bold transition-all cursor-pointer active:scale-95"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-4 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-50)] dark:bg-slate-800 border border-[var(--color-primary-300)] flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm">
            {partnerLogo}
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-poppins font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 mb-1">
              {partnerType}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold font-poppins text-[var(--text-main)] leading-tight">
              {partnerName}
            </h3>
            <span className="text-xs font-lato text-[var(--text-muted)]">
              Accredited Governance & Sponsor
            </span>
          </div>
        </div>

        {/* Partner Description */}
        <div className="space-y-3">
          <h4 className="font-poppins font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
            About the Legal Partnership & Verification Scope
          </h4>
          <p className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-theme)]">
            {partnerDesc}
          </p>
        </div>

        {/* Verification Badges */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-3 rounded-xl text-center">
            <div className="font-poppins font-bold text-sm text-emerald-800 dark:text-emerald-300">
              ✓ Verified Partner
            </div>
            <div className="text-[10px] font-lato text-[var(--text-muted)]">
              Accredited Council
            </div>
          </div>
          <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-3 rounded-xl text-center">
            <div className="font-poppins font-bold text-sm text-[var(--color-primary-600)]">
              100% Escrow & Compliance
            </div>
            <div className="text-[10px] font-lato text-[var(--text-muted)]">
              Prize Audited
            </div>
          </div>
        </div>

        {/* BOTTOM REDIRECT & CONNECTION BUTTONS */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {/* Primary Website Redirect Button */}
          {partnerUrl && partnerUrl !== '#' ? (
            <a
              href={partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs sm:text-sm text-center shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Visit Official Portal</span>
              <span>🌐</span>
            </a>
          ) : (
            <button
              className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-primary-600)] text-white font-poppins font-bold text-xs sm:text-sm text-center shadow-md"
            >
              Verified Partner ⚖️
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-6 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--border-theme)] text-[var(--text-main)] font-poppins font-bold text-xs sm:text-sm text-center border border-[var(--border-theme)] active:scale-95 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

const DEFAULT_PARTNERS = [
  {
    _id: 'default-1',
    name: 'LexisGlobal Law & Verification Council',
    type: 'Official Legal & Verification Partner',
    logoUrl: '⚖️',
    websiteUrl: 'https://lexisglobal.org',
    description: 'Verifies proctored exam compliance, cash prize escrow distribution, and student anti-fraud integrity.'
  },
  {
    _id: 'default-2',
    name: 'IEEE Educational Standards Group',
    type: 'Academic Institution',
    logoUrl: '🎓',
    websiteUrl: 'https://ieee.org',
    description: 'Official academic syllabus alignment and algorithm benchmark standardization partner.'
  },
  {
    _id: 'default-3',
    name: 'Global Cloud Certification Alliance',
    type: 'Certification Authority',
    logoUrl: '🛡️',
    websiteUrl: 'https://cloudalliance.org',
    description: 'Provides cryptographic public-key validation for all 4K verified candidate certificates.'
  },
  {
    _id: 'default-4',
    name: 'Silicon Valley Tech Sponsor Network',
    type: 'Corporate Sponsor',
    logoUrl: '💎',
    websiteUrl: 'https://techsponsors.io',
    description: 'Funds cash rewards, fast-track engineering job interviews, and scholar grants for leaderboard winners.'
  }
];

export const PartnersSection = () => {
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnersList, setPartnersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef(null);
  const isInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef(null);
  
  // Drag gesture states
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await apiGetPublicPartners();
        if (res.success && res.partners && res.partners.length > 0) {
          setPartnersList(res.partners);
        } else {
          setPartnersList(DEFAULT_PARTNERS);
        }
      } catch (err) {
        console.warn('[PartnersSection Load Warning]: Using fallback partner list', err.message);
        setPartnersList(DEFAULT_PARTNERS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Auto-animating continuous scroll loop when user is NOT interacting
  useEffect(() => {
    let animationFrameId;
    
    const autoScroll = () => {
      const scrollContainer = scrollRef.current;
      if (scrollContainer && !isInteractingRef.current) {
        scrollContainer.scrollLeft += 0.8;
        // Infinite loop reset halfway
        if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth - scrollContainer.clientWidth) / 2) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLoading]);

  // User Gesture Interaction Handlers
  const handleUserInteractionStart = (e) => {
    isInteractingRef.current = true;
    isDraggingRef.current = true;
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);

    const pageX = e.touches ? e.touches[0].pageX : e.pageX;
    startXRef.current = pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeftRef.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleUserInteractionMove = (e) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const pageX = e.touches ? e.touches[0].pageX : e.pageX;
    const x = pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleUserInteractionEnd = () => {
    isDraggingRef.current = false;
    // Resume auto-animation after 3.5 seconds of inactivity
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 3500);
  };

  const handleManualScroll = (direction) => {
    if (!scrollRef.current) return;
    isInteractingRef.current = true;
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);

    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });

    interactionTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  };

  const handlePartnerClick = useCallback((partner) => {
    setSelectedPartner(partner);
  }, []);

  const rawList = partnersList.length > 0 ? partnersList : DEFAULT_PARTNERS;

  // Duplicate items for seamless infinite marquee loop
  const seamlessMarqueeList = useMemo(() => {
    if (!rawList || rawList.length === 0) return [];
    return [...rawList, ...rawList, ...rawList, ...rawList];
  }, [rawList]);

  return (
    <section className="mb-8 animate-fadeIn">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 bg-amber-500/20 px-2.5 py-0.5 rounded-full">
            Accreditation & Compliance
          </span>
          <h2 className="text-2xl font-bold font-poppins text-[var(--text-main)] mt-1">
            ⚖️ Legal Partners & Sponsors
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-lato text-[var(--text-muted)] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline">Auto-animating • Swipe or Drag to slide</span>
          </span>

          {/* Left / Right Slide Controls */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleManualScroll('left')}
              className="w-8 h-8 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-bold text-sm cursor-pointer flex items-center justify-center active:scale-95 shadow-xs transition-all"
              aria-label="Slide Left"
            >
              ‹
            </button>

            <button
              onClick={() => handleManualScroll('right')}
              className="w-8 h-8 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] hover:border-[var(--color-primary-400)] text-[var(--text-main)] font-bold text-sm cursor-pointer flex items-center justify-center active:scale-95 shadow-xs transition-all"
              aria-label="Slide Right"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Drag & Auto-animating Carousel Container */}
      <div
        className="relative overflow-hidden w-full py-2 group cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => { isInteractingRef.current = true; }}
        onMouseLeave={() => {
          handleUserInteractionEnd();
        }}
        onTouchStart={handleUserInteractionStart}
        onTouchMove={handleUserInteractionMove}
        onTouchEnd={handleUserInteractionEnd}
        onMouseDown={handleUserInteractionStart}
        onMouseMove={handleUserInteractionMove}
        onMouseUp={handleUserInteractionEnd}
      >
        {/* Left Edge Gradient Fade Mask */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[var(--bg-main)] to-transparent z-10" />

        {/* Right Edge Gradient Fade Mask */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[var(--bg-main)] to-transparent z-10" />

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 py-1 overflow-x-auto no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <PartnerSkeletonCard key={idx} />
            ))
          ) : (
            seamlessMarqueeList.map((partner, index) => (
              <div
                key={`${partner._id || partner.id}-${index}`}
                onClick={() => handlePartnerClick(partner)}
                className="w-72 sm:w-80 shrink-0 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 select-none group/card active:scale-95"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center text-2xl shadow-sm mb-3 group-hover/card:scale-110 transition-transform overflow-hidden">
                    {typeof (partner.logoUrl || partner.icon) === 'string' && ((partner.logoUrl || partner.icon).startsWith('http') || (partner.logoUrl || partner.icon).startsWith('data:')) ? (
                      <img src={partner.logoUrl || partner.icon} alt={partner.name} className="w-9 h-9 object-contain" />
                    ) : (
                      partner.logoUrl || partner.icon || '⚖️'
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold inline-block">
                      {partner.type || 'Legal Partner'}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
                      ● Audited
                    </span>
                  </div>
                  <h3 className="font-poppins font-bold text-sm text-[var(--text-main)] group-hover/card:text-[var(--color-primary-600)] transition-colors mb-1.5 line-clamp-1">
                    {partner.name}
                  </h3>
                  <p className="font-lato text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                    {partner.description || 'Verified institutional partner and compliance council.'}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-theme)] flex items-center justify-between text-xs font-poppins font-bold text-[var(--color-primary-600)]">
                  <span>View Accreditation</span>
                  <span className="group-hover/card:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PARTNER DETAIL MODAL POPUP */}
      {selectedPartner && (
        <PartnerModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </section>
  );
};

export default PartnersSection;
