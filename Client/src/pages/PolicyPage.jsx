export const PolicyPage = ({ policyType = 'terms', onBack }) => {
  const policies = {
    terms: {
      title: 'Terms of Service',
      badge: 'Legal Agreement',
      updated: 'Last updated: August 13, 2026',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          content: 'By accessing or using brainArena, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access or use the platform.'
        },
        {
          heading: '2. User Accounts & Integrity',
          content: 'Users are responsible for maintaining the confidentiality of their account credentials. Any form of cheating, automated bot participation, script injection, or unauthorized exploitation of quiz timers will result in immediate account suspension and forfeiture of leaderboard rewards.'
        },
        {
          heading: '3. Competition & Reward Disclaimers',
          content: 'All live quizzes, cash prizes, certificates, and trophies are subject to verification. Winners are determined strictly based on computational accuracy and speed recorded on our server infrastructure.'
        },
        {
          heading: '4. Intellectual Property',
          content: 'All quiz content, questions, brand assets, UI designs, and codebase components are protected by copyright laws. Users retain ownership of original custom quizzes they create while granting the platform a non-exclusive license to display them.'
        },
        {
          heading: '5. Limitation of Liability',
          content: 'The platform is provided on an "as is" and "as available" basis without warranties of any kind. We are not liable for temporary service interruptions, network delays during live challenges, or data loss.'
        }
      ]
    },
    security: {
      title: 'Security Policy',
      badge: 'Trust & Protection',
      updated: 'Last updated: August 13, 2026',
      sections: [
        {
          heading: '1. Data Encryption & Storage',
          content: 'All network transmissions across the platform are encrypted using TLS 1.3 protocol. User passwords are stored using salted Argon2/Bcrypt cryptographic hashes.'
        },
        {
          heading: '2. Infrastructure Protection',
          content: 'Our cloud servers employ active DDoS mitigation, Web Application Firewalls (WAF), and automated intrusion detection to shield live competitions from unauthorized tampering.'
        },
        {
          heading: '3. Account Security & 2FA',
          content: 'We support Multi-Factor Authentication (MFA) and enforce session token revocation upon password changes or suspicious login attempts from unrecognized IP ranges.'
        },
        {
          heading: '4. Vulnerability Disclosure',
          content: 'We welcome responsible security disclosures. If you discover a security flaw or vulnerability, please contact our security response team at security@quizplatform.com before public disclosure.'
        }
      ]
    },
    cookies: {
      title: 'Cookie & Tracking Policy',
      badge: 'Privacy Controls',
      updated: 'Last updated: August 13, 2026',
      sections: [
        {
          heading: '1. What Are Cookies?',
          content: 'Cookies are small text files stored on your device that enable our platform to remember your session, theme preferences (Light/Dark mode), and active quiz states.'
        },
        {
          heading: '2. Essential Cookies',
          content: 'These cookies are strictly required for authentication, security validation, and preserving active quiz progress during live competitions.'
        },
        {
          heading: '3. Performance & Analytics Cookies',
          content: 'We use anonymized analytics cookies to monitor system latency, page load speed, and user interaction patterns to optimize platform performance.'
        },
        {
          heading: '4. Managing Cookie Preferences',
          content: 'You can control or disable non-essential cookies at any time through your browser settings. Disabling essential cookies may impair core functionality such as live quiz timing.'
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      badge: 'Data Protection',
      updated: 'Last updated: August 13, 2026',
      sections: [
        {
          heading: '1. Information We Collect',
          content: 'We collect information you provide directly (such as name, email, school, and profile photo) when registering or participating in live quizzes.'
        },
        {
          heading: '2. How We Use Your Data',
          content: 'Your data is utilized solely to provide live leaderboards, issue performance certificates, process reward distributions, and improve educational content.'
        },
        {
          heading: '3. Data Sharing & Third Parties',
          content: 'We do not sell, rent, or trade user personal data to third parties. Verified educational partners only receive aggregated, anonymized performance metrics.'
        },
        {
          heading: '4. Your Data Rights',
          content: 'You have the right to request access, correction, or permanent deletion of your personal data at any time by contacting privacy@quizplatform.com.'
        }
      ]
    }
  };

  const currentPolicy = policies[policyType] || policies.terms;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-fadeIn space-y-8">
      
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-4">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-main)] hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-400)] transition-all font-poppins font-semibold text-xs sm:text-sm cursor-pointer active:scale-95 flex items-center space-x-2"
        >
          <span>← Back to Home</span>
        </button>
        <span className="text-xs font-poppins font-bold px-3 py-1 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-slate-800 dark:text-blue-300">
          {currentPolicy.badge}
        </span>
      </div>

      {/* Main Policy Header Box */}
      <div className="bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-secondary-600)] text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-white/10">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-poppins mb-2">
          {currentPolicy.title}
        </h1>
        <p className="text-xs sm:text-sm font-lato text-blue-100 opacity-90">
          {currentPolicy.updated}
        </p>
      </div>

      {/* Policy Content Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        {currentPolicy.sections.map((section, idx) => (
          <div key={idx} className="space-y-3 pb-6 border-b border-[var(--border-theme)] last:border-b-0 last:pb-0">
            <h3 className="text-lg sm:text-xl font-bold font-poppins text-[var(--text-main)]">
              {section.heading}
            </h3>
            <p className="font-lato text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PolicyPage;
