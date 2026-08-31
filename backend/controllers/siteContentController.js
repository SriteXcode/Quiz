const SiteSettings = require('../models/SiteSettings');
const Partner = require('../models/Partner');

// Default initial settings data
const defaultSiteSettings = {
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
  },
  contact: {
    supportEmail: 'support@brainarena.com',
    phone: '+91 9876543210',
    supportHours: 'Mon - Fri: 9:00 AM - 6:00 PM EST',
    headquarters: 'Innovation Tech Park, Silicon Boulevard, CA, 94025',
    socialLinks: {
      twitter: 'https://twitter.com',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      discord: 'https://discord.gg/AnJNehCT2',
      whatsappCommunity: 'https://chat.whatsapp.com/BkBrToj3Hzv6ekv8BqSzO1',
      telegramCommunity: 'https://t.me/braiiinarena'
    }
  }
};

// Seed sample partners if none exist
const seedPartnersIfEmpty = async () => {
  const count = await Partner.countDocuments();
  if (count === 0) {
    await Partner.insertMany([
      {
        name: 'LexisGlobal Law & Verification Council',
        type: 'Official Legal & Verification Partner',
        logoUrl: '⚖️',
        websiteUrl: 'https://lexisglobal.org',
        description: 'Verifies proctored exam compliance, cash prize escrow distribution, and student anti-fraud integrity.',
        status: 'active',
        order: 1
      },
      {
        name: 'IEEE Educational Standards Group',
        type: 'Academic Institution',
        logoUrl: '🎓',
        websiteUrl: 'https://ieee.org',
        description: 'Official academic syllabus alignment and algorithm benchmark standardization partner.',
        status: 'active',
        order: 2
      },
      {
        name: 'Global Cloud Certification Alliance',
        type: 'Certification Authority',
        logoUrl: '🛡️',
        websiteUrl: 'https://cloudalliance.org',
        description: 'Provides cryptographic public-key validation for all 4K verified candidate certificates.',
        status: 'active',
        order: 3
      },
      {
        name: 'Silicon Valley Tech Sponsor Network',
        type: 'Corporate Sponsor',
        logoUrl: '💎',
        websiteUrl: 'https://techsponsors.io',
        description: 'Funds cash rewards, fast-track engineering job interviews, and scholar grants for leaderboard winners.',
        status: 'active',
        order: 4
      }
    ]);
  }
};

// =========================================================================
// 1. SITE SETTINGS (ABOUT US & CONTACT INFO)
// =========================================================================

// @desc    Get public Site Settings (About Us & Contact Info)
// @route   GET /api/site/settings
// @access  Public
exports.getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(defaultSiteSettings);
    } else {
      // Auto-migrate generic social links to new official community links
      let modified = false;
      if (!settings.contact) settings.contact = {};
      if (!settings.contact.socialLinks) settings.contact.socialLinks = {};
      
      const sl = settings.contact.socialLinks;
      if (!sl.whatsappCommunity || sl.whatsappCommunity === 'https://chat.whatsapp.com') {
        sl.whatsappCommunity = 'https://chat.whatsapp.com/BkBrToj3Hzv6ekv8BqSzO1';
        modified = true;
      }
      if (!sl.telegramCommunity || sl.telegramCommunity === 'https://t.me') {
        sl.telegramCommunity = 'https://t.me/braiiinarena';
        modified = true;
      }
      if (!sl.discord || sl.discord === 'https://discord.gg') {
        sl.discord = 'https://discord.gg/AnJNehCT2';
        modified = true;
      }
      if (modified) {
        settings.markModified('contact');
        await settings.save();
      }
    }
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Site Settings (About Us & Contact Info)
// @route   PUT /api/admin/settings
// @access  Private (Admin Only)
exports.updateSiteSettings = async (req, res) => {
  try {
    const { about, contact } = req.body;
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings(defaultSiteSettings);
    }

    if (about) {
      settings.about = { ...(settings.about?.toObject?.() || settings.about), ...about };
      settings.markModified('about');
    }
    if (contact) {
      settings.contact = { ...(settings.contact?.toObject?.() || settings.contact), ...contact };
      settings.markModified('contact');
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'About Us & Contact details updated successfully! 🎉',
      settings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 2. LEGAL PARTNERS & SPONSORS
// =========================================================================

// @desc    Get active Legal Partners
// @route   GET /api/site/partners
// @access  Public
exports.getPublicPartners = async (req, res) => {
  try {
    await seedPartnersIfEmpty();
    const partners = await Partner.find({ status: 'active' }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: partners.length,
      partners
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Legal Partners for Admin
// @route   GET /api/admin/partners
// @access  Private (Admin Only)
exports.getAdminPartners = async (req, res) => {
  try {
    await seedPartnersIfEmpty();
    const partners = await Partner.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: partners.length,
      partners
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Legal Partner
// @route   POST /api/admin/partners
// @access  Private (Admin Only)
exports.createPartner = async (req, res) => {
  try {
    const { name, type, logoUrl, websiteUrl, description, status, order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Partner name is required' });
    }

    const partner = await Partner.create({
      name: name.trim(),
      type: type || 'Official Legal & Verification Partner',
      logoUrl: logoUrl || '⚖️',
      websiteUrl: websiteUrl || '',
      description: description || '',
      status: status || 'active',
      order: Number(order) || 0
    });

    res.status(201).json({
      success: true,
      message: `Partner "${partner.name}" added successfully! 🤝`,
      partner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Legal Partner
// @route   PUT /api/admin/partners/:id
// @access  Private (Admin Only)
exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const { name, type, logoUrl, websiteUrl, description, status, order } = req.body;
    if (name) partner.name = name.trim();
    if (type) partner.type = type;
    if (logoUrl !== undefined) partner.logoUrl = logoUrl;
    if (websiteUrl !== undefined) partner.websiteUrl = websiteUrl;
    if (description !== undefined) partner.description = description;
    if (status) partner.status = status;
    if (order !== undefined) partner.order = Number(order);

    await partner.save();

    res.status(200).json({
      success: true,
      message: `Partner "${partner.name}" updated successfully! 🤝`,
      partner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Legal Partner
// @route   DELETE /api/admin/partners/:id
// @access  Private (Admin Only)
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findByIdAndDelete(id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    res.status(200).json({
      success: true,
      message: `Partner "${partner.name}" removed successfully!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 📬 CONTACT MESSAGES & INQUIRIES ENGINE
// =========================================================================

const ContactMessage = require('../models/ContactMessage');

// @desc    Submit Public Contact Message
// @route   POST /api/site/messages
// @access  Public
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, subject, message)'
      });
    }

    // Auto-calculate smart priority based on text keywords & category
    const content = `${category || ''} ${subject} ${message}`.toLowerCase();
    let priority = 'medium';
    if (content.includes('urgent') || content.includes('emergency') || content.includes('fraud') || content.includes('payout') || content.includes('payment') || content.includes('prize')) {
      priority = 'urgent';
    } else if (category === 'Partnership' || category === 'Bug Report' || content.includes('sponsor') || content.includes('security')) {
      priority = 'high';
    } else if (category === 'General') {
      priority = 'low';
    }

    const newMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      category: category ? category.trim() : 'Support',
      subject: subject.trim(),
      message: message.trim(),
      priority
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received! Our support team will respond shortly. ✉️',
      messageId: newMessage._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seed default contact messages into database if empty
const initialDefaultContactMessages = [
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@techcorp.com',
    category: 'Partnership',
    subject: 'Sponsoring upcoming National Code Challenge 2026',
    message: 'Hello team, we are interested in hosting a sponsored live quiz assessment for fullstack candidates. Please share partnership tiers.',
    priority: 'high',
    isRead: false
  },
  {
    name: 'Ananya Sharma',
    email: 'ananya.sharma@gmail.com',
    category: 'Support',
    subject: 'Inquiry regarding certificate verification link',
    message: 'Hi support team, I recently completed the React Masterclass quiz challenge and received a certificate. Where can I verify the unique badge URL?',
    priority: 'medium',
    isRead: true
  },
  {
    name: 'Karan Mehra',
    email: 'karan.mehra@devstudio.in',
    category: 'Bug Report',
    subject: 'Urgent: Quiz timer latency on mobile browser',
    message: 'Observed slight delay in option submission when running live proctored test on iOS Safari. Requesting technical check.',
    priority: 'urgent',
    isRead: false
  }
];

const seedContactMessagesIfEmpty = async () => {
  try {
    const count = await ContactMessage.countDocuments();
    if (count === 0) {
      await ContactMessage.insertMany(initialDefaultContactMessages);
      console.log('✅ [Contact Seeder]: Successfully seeded default contact messages & inquiries into MongoDB database.');
    }
  } catch (err) {
    console.warn('[Contact Message Seed Warning]:', err.message);
  }
};

// @desc    Get Admin Contact Messages with filters (date, readStatus, priority)
// @route   GET /api/admin/messages
// @access  Private (Admin Only)
exports.getAdminMessages = async (req, res) => {
  try {
    await seedContactMessagesIfEmpty();
    const { dateFilter = 'last_week', readFilter = 'all', priorityFilter = 'all', search } = req.query;

    const query = {};

    // 1. Date Range Filtering (all | last_month | last_week)
    const now = Date.now();
    if (dateFilter === 'last_week') {
      query.createdAt = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    } else if (dateFilter === 'last_month') {
      query.createdAt = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    }

    // 2. Read / Unread Status Filter
    if (readFilter === 'unread') {
      query.isRead = false;
    } else if (readFilter === 'read') {
      query.isRead = true;
    }

    // 3. Priority Filter (urgent | high | medium | low)
    if (priorityFilter !== 'all' && ['urgent', 'high', 'medium', 'low'].includes(priorityFilter)) {
      query.priority = priorityFilter;
    }

    // 4. Text Search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { message: regex },
        { category: regex }
      ];
    }

    const messages = await ContactMessage.find(query).sort({ createdAt: -1 });

    // Overall telemetry counts
    const totalAll = await ContactMessage.countDocuments();
    const unreadCount = await ContactMessage.countDocuments({ isRead: false });
    const urgentCount = await ContactMessage.countDocuments({ priority: { $in: ['urgent', 'high'] }, isRead: false });
    const lastWeekCount = await ContactMessage.countDocuments({
      createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      messages,
      stats: {
        totalAll,
        unreadCount,
        urgentCount,
        lastWeekCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Message Read / Unread Status
// @route   PUT /api/admin/messages/:id/read
// @access  Private (Admin Only)
exports.toggleMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ContactMessage.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const newReadState = req.body.isRead !== undefined ? Boolean(req.body.isRead) : !message.isRead;
    message.isRead = newReadState;
    message.readAt = newReadState ? new Date() : null;
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message marked as ${newReadState ? 'Read' : 'Unread'}`,
      isRead: message.isRead,
      messageItem: message
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Message Priority
// @route   PUT /api/admin/messages/:id/priority
// @access  Private (Admin Only)
exports.updateMessagePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    if (!['urgent', 'high', 'medium', 'low'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority value' });
    }

    const message = await ContactMessage.findByIdAndUpdate(id, { priority }, { new: true });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      message: `Priority updated to ${priority.toUpperCase()}`,
      messageItem: message
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Contact Message
// @route   DELETE /api/admin/messages/:id
// @access  Private (Admin Only)
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ContactMessage.findByIdAndDelete(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

