const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    about: {
      heroBadge: {
        type: String,
        default: 'About brainArena'
      },
      heroTitle: {
        type: String,
        default: 'Empowering the Next Generation of Tech Mastery'
      },
      heroSubtitle: {
        type: String,
        default: 'We build high-performance interactive tools to make technical skill evaluation engaging, competitive, and accessible for developers everywhere.'
      },
      impactStats: [
        {
          number: { type: String, default: '50K+' },
          label: { type: String, default: 'Active Learners' }
        }
      ],
      coreValues: [
        {
          icon: { type: String, default: '⚡' },
          title: { type: String, default: 'Real-Time Competitions' },
          description: { type: String, default: 'Experience live, synchronized quiz challenges with sub-second leaderboard ranking calculations.' }
        }
      ],
      ctaHeading: {
        type: String,
        default: 'Ready to Test Your Knowledge?'
      },
      ctaText: {
        type: String,
        default: 'Join thousands of developers competing in live quizzes and climbing the global leaderboard today.'
      }
    },
    contact: {
      supportEmail: {
        type: String,
        default: 'support@brainarena.com'
      },
      phone: {
        type: String,
        default: '+91 9876543210'
      },
      supportHours: {
        type: String,
        default: 'Mon - Fri: 9:00 AM - 6:00 PM EST'
      },
      headquarters: {
        type: String,
        default: 'Innovation Tech Park, Silicon Boulevard, CA, 94025'
      },
      socialLinks: {
        twitter: { type: String, default: 'https://twitter.com' },
        github: { type: String, default: 'https://github.com' },
        linkedin: { type: String, default: 'https://linkedin.com' },
        discord: { type: String, default: 'https://discord.gg/AnJNehCT2' },
        whatsappCommunity: { type: String, default: 'https://chat.whatsapp.com/BkBrToj3Hzv6ekv8BqSzO1' },
        telegramCommunity: { type: String, default: 'https://t.me/braiiinarena' }
      }
    },
    adsEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

module.exports = SiteSettings;
