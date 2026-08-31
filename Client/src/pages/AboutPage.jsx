import { useState, useEffect, useMemo } from 'react';
import { apiGetSiteSettings, apiGetPublicPartners } from '../services/api';
import { PartnerModal, PartnerSkeletonCard } from '../components/PartnersSection';

export const AboutPage = ({ onNavigate, onExploreQuizzes, onNavigateToQuiz, onExploreLiveQuizzes }) => {
  const [siteSettings, setSiteSettings] = useState({
    about: {
      heroBadge: 'About brainArena',
      heroTitle: 'Empowering the Next Generation of Tech Mastery',
      heroSubtitle: 'We build high-performance interactive tools to make technical skill evaluation engaging, competitive, and accessible for developers everywhere.',
      impactStats: [
        { number: '50K+', label: 'Active Learners' },
        { number: '1,200+', label: 'Live Quizzes' },
        { number: '99.4%', label: 'Satisfaction Rate' },
        { number: '85+', label: 'Global Partners' }
      ],
      coreValues: [
        {
          icon: '⚡',
          title: 'Real-Time Competitions',
          description: 'Experience live, synchronized quiz challenges with sub-second leaderboard ranking calculations.'
        },
        {
          icon: '🎯',
          title: 'Gamified Skill Growth',
          description: 'Turn learning into an engaging journey with trophies, cash prizes, badging, and verified certificates.'
        },
        {
          icon: '🔒',
          title: 'Anti-Cheat Integrity',
          description: 'Advanced anti-cheat telemetry and server-side verification ensure 100% fair competition for everyone.'
        },
        {
          icon: '🌐',
          title: 'Global Developer Hub',
          description: 'Connect with developers, educators, and technology enthusiasts from over 120 countries.'
        }
      ],
      ctaHeading: 'Ready to Test Your Knowledge?',
      ctaText: 'Join thousands of developers competing in live quizzes and climbing the global leaderboard today.'
    }
  });

  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const defaultPartners = [
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

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const [settingsRes, partnersRes] = await Promise.all([
          apiGetSiteSettings().catch(() => ({ success: false })),
          apiGetPublicPartners().catch(() => ({ success: false }))
        ]);

        if (settingsRes.success && settingsRes.settings) {
          setSiteSettings(settingsRes.settings);
        }
        if (partnersRes.success && partnersRes.partners) {
          setPartners(partnersRes.partners);
        }
      } catch (err) {
        console.warn('[AboutPage Data Warning]: Using default fallback info', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  const handleExploreClick = () => {
    if (onExploreLiveQuizzes) {
      onExploreLiveQuizzes();
    } else if (onExploreQuizzes) {
      onExploreQuizzes();
    } else if (onNavigateToQuiz) {
      onNavigateToQuiz();
    } else if (onNavigate) {
      onNavigate('quiz');
    }
  };

  const about = siteSettings.about || {};
  const rawPartnersList = partners.length > 0 ? partners : defaultPartners;

  // Quadruple items to create an infinite seamless loop along the X-axis
  const seamlessMarqueeList = useMemo(() => {
    if (!rawPartnersList || rawPartnersList.length === 0) return [];
    return [...rawPartnersList, ...rawPartnersList, ...rawPartnersList, ...rawPartnersList];
  }, [rawPartnersList]);

  return (
    <div className="max-w-full mx-auto animate-fadeIn space-y-10">
      
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-[var(--color-primary-600)] via-[var(--color-primary-700)] to-[var(--color-secondary-600)] text-white rounded-3xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden border border-white/10">
        <span className="inline-block px-3.5 py-1 mb-4 rounded-full bg-white/20 text-xs font-poppins font-bold uppercase tracking-wider">
          {about.heroBadge || 'About brainArena'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-poppins leading-tight mb-4">
          {about.heroTitle || 'Empowering the Next Generation of Tech Mastery'}
        </h1>
        <p className="font-lato text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
          {about.heroSubtitle || 'We build high-performance interactive tools to make technical skill evaluation engaging, competitive, and accessible for developers everywhere.'}
        </p>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
        {(about.impactStats || [
          { number: '50K+', label: 'Active Learners' },
          { number: '1,200+', label: 'Live Quizzes' },
          { number: '99.4%', label: 'Satisfaction Rate' },
          { number: '85+', label: 'Global Partners' }
        ]).map((stat, index) => (
          <div key={index} className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-6 shadow-sm hover:border-[var(--color-primary-400)] transition-colors">
            <div className="font-poppins font-extrabold text-2xl sm:text-3xl text-[var(--color-primary-600)] mb-1">
              {stat.number}
            </div>
            <div className="font-lato text-xs sm:text-sm text-[var(--text-muted)] font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Core Values Section */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[var(--text-main)] mb-2">
            Why Learners Choose Us
          </h2>
          <p className="font-lato text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            Engineered from the ground up for speed, reliability, and real-time interactive engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {(about.coreValues || []).map((value, idx) => (
            <div
              key={idx}
              className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-50)] dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                {value.icon || '⚡'}
              </div>
              <div>
                <h3 className="font-poppins font-bold text-lg text-[var(--text-main)] mb-1">
                  {value.title}
                </h3>
                <p className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Verification Partners & Institutional Sponsors: Seamless Infinite X-Axis Marquee */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full">
              Accreditation & Governance
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[var(--text-main)] mt-1">
              ⚖️ Official Legal & Academic Partners
            </h2>
          </div>
          <span className="text-xs font-lato text-[var(--text-muted)] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
            <span>Hover to pause • Click for accreditation details</span>
          </span>
        </div>

        {/* Seamless Infinite Horizontal X-Axis Marquee Container */}
        <div className="relative overflow-hidden w-full py-2 group">
          {/* Left Edge Gradient Fade Mask */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[var(--bg-main)] to-transparent z-10" />

          {/* Right Edge Gradient Fade Mask */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[var(--bg-main)] to-transparent z-10" />

          {/* Animated Marquee Track */}
          <div className="flex animate-marquee-x gap-4 py-1">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <PartnerSkeletonCard key={idx} />
              ))
            ) : (
              seamlessMarqueeList.map((partner, index) => (
                <div
                  key={`${partner._id || partner.id}-${index}`}
                  onClick={() => setSelectedPartner(partner)}
                  className="w-72 sm:w-80 shrink-0 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 select-none group/card active:scale-95"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center text-2xl shadow-sm mb-3 group-hover/card:scale-110 transition-transform overflow-hidden p-1">
                      {typeof (partner.logoUrl || partner.icon) === 'string' && ((partner.logoUrl || partner.icon).startsWith('http') || (partner.logoUrl || partner.icon).startsWith('data:') || (partner.logoUrl || partner.icon).startsWith('/') || (partner.logoUrl || partner.icon).includes('.')) ? (
                        <img
                          src={partner.logoUrl || partner.icon}
                          alt={partner.name}
                          className="w-9 h-9 object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.parentNode) e.target.parentNode.innerText = '⚖️';
                          }}
                        />
                      ) : (
                        partner.logoUrl || partner.icon || '⚖️'
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold inline-block">
                        {partner.type || 'Legal Partner'}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
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
      </div>

      {/* Partner Detail Modal Popup */}
      {selectedPartner && (
        <PartnerModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}

      {/* Contact & Support Redirect Section */}
      <div className="bg-gradient-to-r from-blue-900/40 via-[var(--bg-card)] to-indigo-900/40 border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-500)]/15 border border-[var(--color-primary-500)]/30 text-[var(--color-primary-600)] dark:text-blue-400 flex items-center justify-center text-2xl shrink-0">
            💬
          </div>
          <div>
            <h3 className="font-poppins font-bold text-base sm:text-lg text-[var(--text-main)]">
              Have Questions or Need Support?
            </h3>
            <p className="font-lato text-xs sm:text-sm text-[var(--text-muted)]">
              Get in touch with our engineering & support team for inquiries, partnerships, or platform assistance.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('contact')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-poppins font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95 shrink-0 flex items-center space-x-2"
        >
          <span>💬 Contact Support Page →</span>
        </button>
      </div>

      {/* Call to Action Box */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-8 sm:p-10 text-center shadow-sm space-y-4">
        <h2 className="text-2xl font-bold font-poppins text-[var(--text-main)]">
          {about.ctaHeading || 'Ready to Test Your Knowledge?'}
        </h2>
        <p className="font-lato text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          {about.ctaText || 'Join thousands of developers competing in live quizzes and climbing the global leaderboard today.'}
        </p>
        <button
          onClick={handleExploreClick}
          className="px-6 py-3 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
        >
          Explore Live Quizzes →
        </button>
      </div>

    </div>
  );
};

export default AboutPage;
