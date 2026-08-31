import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  apiGetAdminStats,
  apiGetAdminUsers,
  apiUpdateUserRole,
  apiDeleteUser,
  apiGetAdminQuizzes,
  apiCreateQuiz,
  apiUpdateQuiz,
  apiDeleteQuiz,
  apiGetAdminPreviousWorks,
  apiCreatePreviousWork,
  apiUpdatePreviousWork,
  apiDeletePreviousWork,
  apiGetSiteSettings,
  apiUpdateSiteSettings,
  apiGetAdminPartners,
  apiCreatePartner,
  apiUpdatePartner,
  apiDeletePartner,
  apiGetAdminMessages,
  apiToggleMessageRead,
  apiUpdateMessagePriority,
  apiDeleteMessage,
  apiGetAdminReviews,
  apiCreateAdminReview,
  apiUpdateReview,
  apiDeleteReview
} from '../services/api';
import {
  downloadQuizQuestionsTemplate,
  parseQuizQuestionsExcel
} from '../utils/excelTemplateUtils';
import {
  getQuizAutoStatus,
  getQuizCountdownData,
  getCurrentDateDDMonYYYY,
  formatDateToDDMonYYYY,
  getCurrentTimeObject,
  calculateDynamicQuizDuration,
  STANDARD_TIME_OPTIONS
} from '../utils/dateUtils';
import QuizCountdownBadge from '../components/QuizCountdownBadge';
import ImageUploadDropzone from '../components/ImageUploadDropzone';

const generateTempId = () => 'temp_' + String(Date.now());

// Initial Fallback Mock Datasets so All Tabs Always Render Rich Interactive Data
const initialMockUsers = [
  {
    _id: 'user-001',
    name: 'Super Admin',
    email: 'admin@quizplatform.com',
    role: 'admin',
    school: 'Platform Governance Hub',
    studentClass: 'Administrator',
    phone: '+91 9876543210',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'user-002',
    name: 'Sarah Jenkins',
    email: 'sarah.j@mit.edu',
    role: 'student',
    school: 'MIT Computer Science',
    studentClass: 'Year 4 - AI & Algo',
    phone: '+1 617-253-1000',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'user-003',
    name: 'Alex Rivers',
    email: 'alex.rivers@gmail.com',
    role: 'student',
    school: 'Stanford Engineering',
    studentClass: 'Senior Frontend Lab',
    phone: '+1 650-723-2300',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'user-004',
    name: 'Priya Sharma',
    email: 'priya.sharma@edutech.org',
    role: 'student',
    school: 'IIT Delhi',
    studentClass: 'B.Tech CS - Sem 6',
    phone: '+91 9811223344',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'user-005',
    name: 'Devon Vance',
    email: 'devon.vance@techcorp.io',
    role: 'student',
    school: 'UC Berkeley',
    studentClass: 'Data Structures Group',
    phone: '+1 510-642-6000',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'user-006',
    name: 'Marcus Brody',
    email: 'm.brody@cloudsolutions.net',
    role: 'student',
    school: 'Georgia Tech',
    studentClass: 'Cloud Architecture Cohort',
    phone: '+1 404-894-2000',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const initialMockPartners = [
  {
    _id: 'partner-001',
    name: 'LexisGlobal Law & Verification Council',
    type: 'Official Legal & Verification Partner',
    logoUrl: '⚖️',
    websiteUrl: 'https://lexisglobal.org',
    description: 'Verifies proctored exam compliance, cash prize escrow distribution, and student anti-fraud integrity.',
    status: 'active',
    order: 1
  },
  {
    _id: 'partner-002',
    name: 'IEEE Educational Standards Group',
    type: 'Academic Institution',
    logoUrl: '🎓',
    websiteUrl: 'https://ieee.org',
    description: 'Official academic syllabus alignment and algorithm benchmark standardization partner.',
    status: 'active',
    order: 2
  },
  {
    _id: 'partner-003',
    name: 'Global Cloud Certification Alliance',
    type: 'Certification Authority',
    logoUrl: '🛡️',
    websiteUrl: 'https://cloudalliance.org',
    description: 'Provides cryptographic public-key validation for all 4K verified candidate certificates.',
    status: 'active',
    order: 3
  },
  {
    _id: 'partner-004',
    name: 'Silicon Valley Tech Sponsor Network',
    type: 'Corporate Sponsor',
    logoUrl: '💎',
    websiteUrl: 'https://techsponsors.io',
    description: 'Funds cash rewards, fast-track engineering job interviews, and scholar grants for leaderboard winners.',
    status: 'active',
    order: 4
  }
];

export const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalQuizzes: 0,
    activeLiveQuizzes: 0,
    totalPreviousWorks: 0,
    totalRewardsDistributed: 0,
    totalXPPointsAwarded: '0'
  });

  const [usersList, setUsersList] = useState(initialMockUsers);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const USERS_PER_PAGE = 8;
  const [quizzesList, setQuizzesList] = useState([]);
  const [previousWorksList, setPreviousWorksList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [workCategoryFilter, setWorkCategoryFilter] = useState('all');
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [quizFilterType, setQuizFilterType] = useState('all');
  const [quizStatusFilter, setQuizStatusFilter] = useState('all'); // 'all' | 'active' | 'live' | 'upcoming' | 'past'

  const ADMIN_TAB_KEYS = useMemo(() => [
    'overview',
    'users',
    'quizzes',
    'previous-works',
    'site-info',
    'partners',
    'messages',
    'reviews',
    'rewards'
  ], []);

  const activeTabIndex = useMemo(() => {
    const idx = ADMIN_TAB_KEYS.indexOf(activeTab);
    return idx >= 0 ? idx : 0;
  }, [activeTab, ADMIN_TAB_KEYS]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartTarget = useRef(null);
  const tabButtonRefs = useRef({});

  useEffect(() => {
    if (tabButtonRefs.current[activeTab]) {
      tabButtonRefs.current[activeTab].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab]);

  const findScrollableParent = (el) => {
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.scrollWidth > current.clientWidth + 5) {
        const style = window.getComputedStyle(current);
        const overflowX = style.getPropertyValue('overflow-x');
        if (overflowX === 'auto' || overflowX === 'scroll' || current.classList.contains('overflow-x-auto')) {
          return current;
        }
      }
      current = current.parentElement;
    }
    return null;
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    touchStartTarget.current = e.target;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Table Horizontal Scroll Disambiguation:
    // If the touch originated inside a scrollable table or container, only permit tab switch
    // if user has reached the edge of the scroll container!
    if (touchStartTarget.current) {
      const scrollParent = findScrollableParent(touchStartTarget.current);
      if (scrollParent) {
        const { scrollLeft, clientWidth, scrollWidth } = scrollParent;
        const isAtRightEnd = scrollLeft + clientWidth >= scrollWidth - 10;
        const isAtLeftStart = scrollLeft <= 10;

        if (isLeftSwipe && !isAtRightEnd) {
          touchStartX.current = 0;
          touchEndX.current = 0;
          touchStartTarget.current = null;
          return; // Let user scroll table columns to the right, do not switch tab!
        }

        if (isRightSwipe && !isAtLeftStart) {
          touchStartX.current = 0;
          touchEndX.current = 0;
          touchStartTarget.current = null;
          return; // Let user scroll table columns to the left, do not switch tab!
        }
      }
    }

    if (isLeftSwipe && activeTabIndex < ADMIN_TAB_KEYS.length - 1) {
      setActiveTab(ADMIN_TAB_KEYS[activeTabIndex + 1]);
    } else if (isRightSwipe && activeTabIndex > 0) {
      setActiveTab(ADMIN_TAB_KEYS[activeTabIndex - 1]);
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
    touchStartTarget.current = null;
  };

  // Contact Messages & Inquiries State
  const [messagesList, setMessagesList] = useState([]);
  const [messageStats, setMessageStats] = useState({ totalAll: 0, unreadCount: 0, urgentCount: 0, lastWeekCount: 0 });
  const [msgDateFilter, setMsgDateFilter] = useState('last_week'); // 'last_week' (default) | 'last_month' | 'all'
  const [msgReadFilter, setMsgReadFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [msgPriorityFilter, setMsgPriorityFilter] = useState('all'); // 'all' | 'urgent' | 'high' | 'medium' | 'low'
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [selectedMessageModal, setSelectedMessageModal] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Site Settings (About Us & Contact Information) State
  const [siteSettings, setSiteSettings] = useState({
    about: {
      heroBadge: 'About Brand Platform',
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
      supportEmail: 'support@quizplatform.com',
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
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Legal Partners & Sponsors State
  const [partnersList, setPartnersList] = useState(initialMockPartners);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [partnerFormData, setPartnerFormData] = useState({
    name: '',
    type: 'Official Legal & Verification Partner',
    logoUrl: '⚖️',
    websiteUrl: '',
    description: '',
    status: 'active',
    order: 1
  });

  // Reviews & Testimonials Moderation State
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, featured: 0, avgRating: 5.0 });
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [isReviewAdminModalOpen, setIsReviewAdminModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewAdminFormData, setReviewAdminFormData] = useState({
    userName: '',
    userEmail: '',
    role: 'Verified Student',
    rating: 5,
    quote: '',
    quizTitle: '',
    status: 'approved',
    isFeatured: true
  });

  // Eager parallel data loader: fetches all tabs concurrently so every tab has live data
  useEffect(() => {
    if (!isAdmin) return;

    const fetchAllAdminData = async () => {
      setIsLoadingMessages(true);
      try {
        const [statsRes, usersRes, quizzesRes, worksRes, siteRes, partnersRes, msgsRes, reviewsRes] =
          await Promise.allSettled([
            apiGetAdminStats(),
            apiGetAdminUsers(searchQuery, roleFilter),
            apiGetAdminQuizzes(),
            apiGetAdminPreviousWorks(),
            apiGetSiteSettings(),
            apiGetAdminPartners(),
            apiGetAdminMessages({
              dateFilter: msgDateFilter,
              readFilter: msgReadFilter,
              priorityFilter: msgPriorityFilter,
              search: msgSearchQuery
            }),
            apiGetAdminReviews(reviewStatusFilter, reviewSearchQuery)
          ]);

        if (statsRes.status === 'fulfilled' && statsRes.value?.success && statsRes.value.stats) {
          setStats(statsRes.value.stats);
        }
        if (usersRes.status === 'fulfilled' && usersRes.value?.success && usersRes.value.users?.length) {
          setUsersList(usersRes.value.users);
        }
        if (quizzesRes.status === 'fulfilled' && quizzesRes.value?.success && quizzesRes.value.quizzes?.length) {
          setQuizzesList(quizzesRes.value.quizzes);
        }
        if (worksRes.status === 'fulfilled' && worksRes.value?.success && worksRes.value.works?.length) {
          setPreviousWorksList(worksRes.value.works);
        }
        if (siteRes.status === 'fulfilled' && siteRes.value?.success && siteRes.value.settings) {
          setSiteSettings(siteRes.value.settings);
        }
        if (partnersRes.status === 'fulfilled' && partnersRes.value?.success && partnersRes.value.partners?.length) {
          setPartnersList(partnersRes.value.partners);
        }
        if (msgsRes.status === 'fulfilled' && msgsRes.value?.success) {
          if (msgsRes.value.messages?.length) setMessagesList(msgsRes.value.messages);
          if (msgsRes.value.stats) setMessageStats(msgsRes.value.stats);
        }
        if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.success) {
          if (Array.isArray(reviewsRes.value.reviews)) setReviewsList(reviewsRes.value.reviews);
          if (reviewsRes.value.stats) setReviewStats(reviewsRes.value.stats);
        }
      } catch {
        console.warn('[Admin Parallel Load]: Fallback active');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchAllAdminData();
  }, [isAdmin, activeTab, searchQuery, roleFilter, msgDateFilter, msgReadFilter, msgPriorityFilter, msgSearchQuery, reviewStatusFilter, reviewSearchQuery]);

  const handleToggleMessageRead = async (id, currentIsRead) => {
    try {
      const res = await apiToggleMessageRead(id, !currentIsRead);
      if (res.success) {
        setMessagesList((prev) =>
          prev.map((msg) => (msg._id === id || msg.id === id ? { ...msg, isRead: res.isRead, readAt: res.isRead ? new Date() : null } : msg))
        );
        setMessageStats((prev) => ({
          ...prev,
          unreadCount: res.isRead ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount + 1
        }));
        if (selectedMessageModal && (selectedMessageModal._id === id || selectedMessageModal.id === id)) {
          setSelectedMessageModal((prev) => ({ ...prev, isRead: res.isRead }));
        }
        addToast(res.message || `Message marked as ${res.isRead ? 'Read' : 'Unread'}`, 'success');
      }
    } catch {
      // Local fallback toggle
      setMessagesList((prev) =>
        prev.map((msg) => (msg._id === id || msg.id === id ? { ...msg, isRead: !currentIsRead } : msg))
      );
      addToast(`Message marked as ${!currentIsRead ? 'Read' : 'Unread'}`, 'success');
    }
  };

  const handleUpdateMessagePriority = async (id, newPriority) => {
    try {
      const res = await apiUpdateMessagePriority(id, newPriority);
      if (res.success) {
        setMessagesList((prev) =>
          prev.map((msg) => (msg._id === id || msg.id === id ? { ...msg, priority: newPriority } : msg))
        );
        if (selectedMessageModal && (selectedMessageModal._id === id || selectedMessageModal.id === id)) {
          setSelectedMessageModal((prev) => ({ ...prev, priority: newPriority }));
        }
        addToast(`Priority updated to ${newPriority.toUpperCase()}`, 'success');
      }
    } catch {
      setMessagesList((prev) =>
        prev.map((msg) => (msg._id === id || msg.id === id ? { ...msg, priority: newPriority } : msg))
      );
      addToast(`Priority updated to ${newPriority.toUpperCase()}`, 'success');
    }
  };

  const handleDeleteMessage = async (id, senderName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the inquiry from "${senderName}"?`)) {
      return;
    }
    try {
      const res = await apiDeleteMessage(id);
      if (res.success) {
        setMessagesList((prev) => prev.filter((msg) => (msg._id !== id && msg.id !== id)));
        setMessageStats((prev) => ({
          ...prev,
          totalAll: Math.max(0, prev.totalAll - 1)
        }));
        if (selectedMessageModal && (selectedMessageModal._id === id || selectedMessageModal.id === id)) {
          setSelectedMessageModal(null);
        }
        addToast(`Inquiry from "${senderName}" deleted.`, 'success');
      }
    } catch {
      setMessagesList((prev) => prev.filter((msg) => (msg._id !== id && msg.id !== id)));
      if (selectedMessageModal && (selectedMessageModal._id === id || selectedMessageModal.id === id)) {
        setSelectedMessageModal(null);
      }
      addToast(`Inquiry from "${senderName}" deleted.`, 'success');
    }
  };

  const handleOpenMessageModal = (msg) => {
    setSelectedMessageModal(msg);
    if (!msg.isRead) {
      handleToggleMessageRead(msg._id || msg.id, false);
    }
  };

  // Defaults based on current real-time clock
  const defaultCurrentDate = getCurrentDateDDMonYYYY();
  const defaultStartTimeObj = getCurrentTimeObject(0);
  const defaultEndTimeObj = getCurrentTimeObject(1);

  // Quiz Creator & Editor Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [timerUnit, setTimerUnit] = useState('sec'); // 'sec' | 'min'
  // Accordion Toggle Section: 'category_tags' | 'timings_schedule' | 'rewards_tiers' | 'questions_suite'
  const [openQuizSection, setOpenQuizSection] = useState('category_tags');
  const [quizFormData, setQuizFormData] = useState({
    title: '',
    quizType: 'multiple_choice',
    mcqSubtype: 'quick',
    timerType: 'per_question_general',
    generalQuestionTimerSeconds: 15,
    posterUrl: '',
    languageLogoUrl: '',
    category: 'Web Dev',
    techStack: 'JavaScript, React, Node.js',
    durationMinutes: 60,
    quickTimerSeconds: 15,
    quickDetails: '',
    description: '',
    startDate: defaultCurrentDate,
    startTime: defaultStartTimeObj.time,
    startPeriod: defaultStartTimeObj.period, // 'AM' | 'PM' toggle switch
    endDate: defaultCurrentDate,
    endTime: defaultEndTimeObj.time,
    endPeriod: defaultEndTimeObj.period, // 'AM' | 'PM' toggle switch
    proctoring: {
      enabled: true,
      webcam: true,
      mic: true,
      tabSwitchLimit: 3
    },
    rewards: [
      { place: '1st', badge: '🥇 Winner', prize: '$500 Cash + Gold Trophy', description: 'Top Rank Award + Exclusive Swag Kit' },
      { place: '2nd', badge: '🥈 Runner Up', prize: '$250 Cash + Silver Medal', description: '2nd Rank Certificate + Pro Subscription' },
      { place: '3rd', badge: '🥉 3rd Place', prize: '$100 Cash + Bronze Medal', description: '3rd Rank Certificate + Pro Subscription' },
      { place: '4-10th', badge: '🏅 Top 10 (Group)', prize: 'Pro Membership & Swag', description: 'Top 10 Certificate of Excellence' },
      { place: '11-50th', badge: '🎖️ Top 50 (Group)', prize: '500 XP Points & Badge', description: 'Certificate of Merit' }
    ],
    questions: [
      {
        questionText: 'What is the primary purpose of useEffect hook in React?',
        options: ['Direct DOM rendering', 'Managing asynchronous side effects & subscriptions', 'Defining CSS stylesheets', 'Managing backend databases'],
        correctAnswerIndex: 1,
        timerSeconds: 15,
        explanation: 'useEffect serves to synchronize components with external systems and manage side-effects.'
      }
    ],
    codingChallenge: {
      problemStatement: `### Problem: Real-World Banking Transaction Reconciliation

You are building a high-frequency financial settlement engine. Given an array of numeric transaction balances \`transactions\` and an integer \`targetAmount\`, find the indices of the **two transactions** that add up exactly to the \`targetAmount\`.

#### Requirements:
1. Return the two indices as an array \`[index1, index2]\`.
2. Each input has exactly one valid solution, and you may not use the same element twice.`,
      difficulty: 'Medium',
      language: 'JavaScript',
      starterCode: `function reconcileTransactions(transactions, targetAmount) {\n  // Write your solution here\n  return [0, 1];\n}`,
      testCases: [
        { input: 'transactions = [2, 7, 11, 15], targetAmount = 9', expectedOutput: '[0, 1]', isHidden: false },
        { input: 'transactions = [3, 2, 4], targetAmount = 6', expectedOutput: '[1, 2]', isHidden: false }
      ],
      hints: ['Use a Map to look up complements in O(1) time.'],
      constraints: ['2 <= transactions.length <= 10^4'],
      proctoringRequired: true
    }
  });

  // Previous Work Modal State
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState(null);
  const [workFormData, setWorkFormData] = useState({
    title: '',
    description: '',
    category: 'Web Dev',
    participantsCount: '3,200 Participants',
    avgScore: '82% Avg Score',
    topWinner: 'Sarah J. (100%)',
    badge: 'Completed',
    gradient: 'from-blue-500 to-indigo-600',
    techStack: 'HTML, CSS, React, Node.js',
    completedDate: 'May 2026',
    totalQuestions: 50
  });

  // ==========================================
  // 🏆 GLOBAL REWARDS & TIERS MANAGEMENT STATE
  // ==========================================
  const DEFAULT_GLOBAL_REWARDS = [
    { id: 'rev_tier_1', place: '1st', badge: '🥇 Winner', prize: '$500 Cash + Gold Trophy', description: 'Top Rank Award + Exclusive Swag Kit' },
    { id: 'rev_tier_2', place: '2nd', badge: '🥈 Runner Up', prize: '$250 Cash + Silver Medal', description: '2nd Rank Certificate + Pro Subscription' },
    { id: 'rev_tier_3', place: '3rd', badge: '🥉 3rd Place', prize: '$100 Cash + Bronze Medal', description: '3rd Rank Certificate + Pro Subscription' },
    { id: 'rev_tier_4', place: '4-10th', badge: '🏅 Top 10 (Group)', prize: 'Pro Membership & Swag', description: 'Top 10 Certificate of Excellence' },
    { id: 'rev_tier_5', place: '11-50th', badge: '🎖️ Top 50 (Group)', prize: '500 XP Points & Badge', description: 'Certificate of Merit' }
  ];

  const [globalRewards, setGlobalRewards] = useState(() => {
    try {
      const saved = localStorage.getItem('global_rewards_tiers');
      return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_REWARDS;
    } catch {
      return DEFAULT_GLOBAL_REWARDS;
    }
  });

  const [isRewardTierModalOpen, setIsRewardTierModalOpen] = useState(false);
  const [editingRewardTierId, setEditingRewardTierId] = useState(null);
  const [rewardTierFormData, setRewardTierFormData] = useState({
    place: '1st',
    badge: '🥇 Winner',
    prize: '$500 Cash + Gold Trophy',
    description: 'Top Rank Award + Exclusive Swag Kit'
  });

  const saveGlobalRewardsToStorage = (newList) => {
    setGlobalRewards(newList);
    try {
      localStorage.setItem('global_rewards_tiers', JSON.stringify(newList));
    } catch {
      // Ignore storage errors
    }
  };

  const handleOpenCreateRewardTierModal = () => {
    setEditingRewardTierId(null);
    setRewardTierFormData({
      place: '',
      badge: '🏆 Winner Tier',
      prize: '',
      description: ''
    });
    setIsRewardTierModalOpen(true);
  };

  const handleOpenEditRewardTierModal = (reward) => {
    setEditingRewardTierId(reward.id || reward._id);
    setRewardTierFormData({
      place: reward.place || '',
      badge: reward.badge || '',
      prize: reward.prize || '',
      description: reward.description || ''
    });
    setIsRewardTierModalOpen(true);
  };

  const handleDeleteRewardTier = (id, badgeName) => {
    if (!window.confirm(`Are you sure you want to remove reward tier "${badgeName || 'this tier'}"?`)) return;
    const newList = globalRewards.filter((r) => r.id !== id && r._id !== id);
    saveGlobalRewardsToStorage(newList);
    addToast(`🗑️ Removed reward tier "${badgeName || 'Tier'}"`, 'info');
  };

  const handleSaveRewardTierSubmit = (e) => {
    e.preventDefault();
    if (!rewardTierFormData.place || !rewardTierFormData.prize) {
      addToast('Please fill in rank place and prize title.', 'warning');
      return;
    }

    if (editingRewardTierId) {
      const newList = globalRewards.map((r) => {
        if (r.id === editingRewardTierId || r._id === editingRewardTierId) {
          return { ...r, ...rewardTierFormData };
        }
        return r;
      });
      saveGlobalRewardsToStorage(newList);
      addToast(`✨ Updated reward tier "${rewardTierFormData.badge}"`, 'success');
    } else {
      const newReward = {
        id: `rev_tier_${Date.now()}`,
        ...rewardTierFormData
      };
      const newList = [...globalRewards, newReward];
      saveGlobalRewardsToStorage(newList);
      addToast(`🎉 Created new global reward tier "${rewardTierFormData.badge}"`, 'success');
    }

    setIsRewardTierModalOpen(false);
  };

  // Dynamically calculate total duration whenever start/end date or time or AM/PM changes
  const dynamicDuration = calculateDynamicQuizDuration(
    quizFormData.startDate,
    quizFormData.startTime,
    quizFormData.startPeriod,
    quizFormData.endDate,
    quizFormData.endTime,
    quizFormData.endPeriod
  );

  // ==========================================
  // REVIEW & TESTIMONIAL MODERATION ACTIONS
  // ==========================================
  const handleUpdateReviewStatusAdmin = async (id, status) => {
    try {
      const res = await apiUpdateReview(id, { status });
      if (res && res.success !== false) {
        setReviewsList((prev) =>
          prev.map((r) => ((r._id === id || r.id === id) ? { ...r, status } : r))
        );
        addToast(`Review status updated to ${status.toUpperCase()}`, 'success');
      }
    } catch {
      setReviewsList((prev) =>
        prev.map((r) => ((r._id === id || r.id === id) ? { ...r, status } : r))
      );
      addToast(`Updated review status to ${status.toUpperCase()}`, 'info');
    }
  };

  const handleToggleReviewFeaturedAdmin = async (id, currentIsFeatured) => {
    const nextFeatured = !currentIsFeatured;
    try {
      const res = await apiUpdateReview(id, { isFeatured: nextFeatured });
      if (res && res.success !== false) {
        setReviewsList((prev) =>
          prev.map((r) => ((r._id === id || r.id === id) ? { ...r, isFeatured: nextFeatured } : r))
        );
        addToast(`Review ${nextFeatured ? 'featured on homepage' : 'unfeatured'}`, 'info');
      }
    } catch {
      setReviewsList((prev) =>
        prev.map((r) => ((r._id === id || r.id === id) ? { ...r, isFeatured: nextFeatured } : r))
      );
      addToast(`Review ${nextFeatured ? 'featured on homepage' : 'unfeatured'}`, 'info');
    }
  };

  const handleDeleteReviewAdmin = async (id, authorName) => {
    if (!window.confirm(`Delete review from "${authorName || 'Student'}"?`)) return;
    try {
      await apiDeleteReview(id);
      setReviewsList((prev) => prev.filter((r) => (r._id !== id && r.id !== id)));
      addToast(`Deleted review from "${authorName}"`, 'info');
    } catch {
      setReviewsList((prev) => prev.filter((r) => (r._id !== id && r.id !== id)));
      addToast(`Deleted review from "${authorName}"`, 'info');
    }
  };

  const handleOpenCreateReviewModalAdmin = () => {
    setEditingReviewId(null);
    setReviewAdminFormData({
      userName: '',
      userEmail: '',
      role: 'Verified Student',
      rating: 5,
      quote: '',
      quizTitle: '',
      status: 'approved',
      isFeatured: true
    });
    setIsReviewAdminModalOpen(true);
  };

  const handleOpenEditReviewModalAdmin = (review) => {
    setEditingReviewId(review._id || review.id);
    setReviewAdminFormData({
      userName: review.userName || review.author || '',
      userEmail: review.userEmail || '',
      role: review.role || 'Verified Student',
      rating: review.rating || 5,
      quote: review.quote || '',
      quizTitle: review.quizTitle || '',
      status: review.status || 'approved',
      isFeatured: review.isFeatured !== undefined ? review.isFeatured : true
    });
    setIsReviewAdminModalOpen(true);
  };

  const handleSaveReviewSubmitAdmin = async (e) => {
    e.preventDefault();
    if (!reviewAdminFormData.userName || !reviewAdminFormData.quote) {
      addToast('Name and review quote text are required.', 'warning');
      return;
    }

    try {
      if (editingReviewId) {
        const res = await apiUpdateReview(editingReviewId, reviewAdminFormData);
        if (res && res.success !== false) {
          setReviewsList((prev) =>
            prev.map((r) => ((r._id === editingReviewId || r.id === editingReviewId) ? (res.review || { ...r, ...reviewAdminFormData }) : r))
          );
          addToast('Review updated successfully!', 'success');
        } else {
          setReviewsList((prev) =>
            prev.map((r) => ((r._id === editingReviewId || r.id === editingReviewId) ? { ...r, ...reviewAdminFormData } : r))
          );
          addToast('Review updated successfully!', 'success');
        }
      } else {
        const res = await apiCreateAdminReview(reviewAdminFormData);
        if (res && res.success !== false && res.review) {
          setReviewsList((prev) => [res.review, ...prev]);
          addToast('New testimonial created and published! 🎉', 'success');
        } else {
          const mockR = {
            _id: generateTempId(),
            ...reviewAdminFormData,
            createdAt: new Date().toISOString()
          };
          setReviewsList((prev) => [mockR, ...prev]);
          addToast('New testimonial created and published! 🎉', 'success');
        }
      }
      setIsReviewAdminModalOpen(false);
    } catch (err) {
      addToast(`Error saving review: ${err.message}`, 'error');
    }
  };

  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    try {
      await apiUpdateUserRole(targetUser._id, nextRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: nextRole } : u))
      );
      addToast(`Updated ${targetUser.name}'s role to ${nextRole.toUpperCase()}`, 'success');
    } catch (err) {
      addToast(`Failed to update role: ${err.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId, targetUser) => {
    const currentUserId = user?._id || user?.id;
    const userName = typeof targetUser === 'string' ? targetUser : (targetUser?.name || 'User');
    const userRole = typeof targetUser === 'object' ? targetUser?.role : null;

    if (currentUserId && currentUserId.toString() === userId.toString()) {
      addToast('Security Policy: You cannot delete your own admin account.', 'warning');
      return;
    }

    if (userRole === 'admin') {
      addToast('Security Policy: Admin accounts cannot be deleted.', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user account "${userName}"?`)) return;
    try {
      await apiDeleteUser(userId);
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      addToast(`Deleted user ${userName}`, 'info');
    } catch (err) {
      addToast(`Failed to delete user: ${err.message}`, 'error');
    }
  };

  // ==========================================
  // QUIZ BUILDER ACTIONS
  // ==========================================
  const handleOpenCreateQuizModal = () => {
    setEditingQuizId(null);
    const curDate = getCurrentDateDDMonYYYY();
    const curStart = getCurrentTimeObject(0);
    const curEnd = getCurrentTimeObject(1);

    setQuizFormData({
      title: '',
      quizType: 'multiple_choice',
      mcqSubtype: 'quick',
      timerType: 'per_question_general',
      generalQuestionTimerSeconds: 15,
      posterUrl: '',
      languageLogoUrl: '',
      category: 'Web Dev',
      isPaid: false,
      price: 0,
      techStack: 'JavaScript, React, Node.js',
      durationMinutes: 60,
      quickTimerSeconds: 15,
      quickDetails: '',
      description: '',
      startDate: curDate,
      startTime: curStart.time,
      startPeriod: curStart.period,
      endDate: curDate,
      endTime: curEnd.time,
      endPeriod: curEnd.period,
      proctoring: {
        enabled: true,
        webcam: true,
        mic: true,
        tabSwitchLimit: 3
      },
      rewards: [
        { place: '1st', badge: '🥇 Winner', prize: '$500 Cash + Gold Trophy', description: 'Top Rank Award + Exclusive Swag Kit' },
        { place: '2nd', badge: '🥈 Runner Up', prize: '$250 Cash + Silver Medal', description: '2nd Rank Certificate + Pro Subscription' },
        { place: '3rd', badge: '🥉 3rd Place', prize: '$100 Cash + Bronze Medal', description: '3rd Rank Certificate + Pro Subscription' },
        { place: '4-10th', badge: '🏅 Top 10 (Group)', prize: 'Pro Membership & Swag', description: 'Top 10 Certificate of Excellence' },
        { place: '11-50th', badge: '🎖️ Top 50 (Group)', prize: '500 XP Points & Badge', description: 'Certificate of Merit' }
      ],
      questions: [
        {
          questionText: 'What is the primary purpose of useEffect hook in React?',
          questionType: 'mcq',
          codeSnippet: '',
          language: 'javascript',
          options: ['Direct DOM rendering', 'Managing asynchronous side effects & subscriptions', 'Defining CSS stylesheets', 'Managing backend databases'],
          correctAnswerIndex: 1,
          timerSeconds: 15,
          explanation: 'useEffect handles side-effects in functional React components.'
        }
      ],
      codingChallenge: {
        problemStatement: `### Problem: Real-World Banking Transaction Reconciliation

You are building a high-frequency financial settlement engine. Given an array of numeric transaction balances \`transactions\` and an integer \`targetAmount\`, find the indices of the **two transactions** that add up exactly to the \`targetAmount\`.

#### Requirements:
1. Return the two indices as an array \`[index1, index2]\`.
2. Each input has exactly one valid solution, and you may not use the same element twice.`,
        difficulty: 'Medium',
        language: 'JavaScript',
        starterCode: `function reconcileTransactions(transactions, targetAmount) {\n  // Write your solution here\n  return [0, 1];\n}`,
        testCases: [
          { input: 'transactions = [2, 7, 11, 15], targetAmount = 9', expectedOutput: '[0, 1]', isHidden: false },
          { input: 'transactions = [3, 2, 4], targetAmount = 6', expectedOutput: '[1, 2]', isHidden: false }
        ],
        hints: ['Use a hash map to look up complements in O(1) time.'],
        constraints: ['2 <= transactions.length <= 10^4'],
        proctoringRequired: true
      }
    });
    setOpenQuizSection('category_tags');
    setIsQuizModalOpen(true);
  };

  const handleOpenEditQuizModal = (quiz) => {
    setEditingQuizId(quiz._id || quiz.id);
    
    let sTime = quiz.startTime || '10:00';
    let sPeriod = 'AM';
    if (/pm/i.test(sTime)) sPeriod = 'PM';
    sTime = sTime.replace(/\s*(am|pm)/i, '').trim();

    let eTime = quiz.endTime || '11:00';
    let ePeriod = 'AM';
    if (/pm/i.test(eTime)) ePeriod = 'PM';
    eTime = eTime.replace(/\s*(am|pm)/i, '').trim();

    setQuizFormData({
      title: quiz.title || '',
      quizType: quiz.quizType || 'multiple_choice',
      mcqSubtype: quiz.mcqSubtype || 'quick',
      timerType: quiz.timerType || 'per_question_general',
      generalQuestionTimerSeconds: quiz.generalQuestionTimerSeconds || 15,
      posterUrl: quiz.posterUrl || '',
      languageLogoUrl: quiz.languageLogoUrl || '',
      category: quiz.category || 'Web Dev',
      isPaid: Boolean(quiz.isPaid),
      price: quiz.price || 0,
      techStack: Array.isArray(quiz.techStack) ? quiz.techStack.join(', ') : (quiz.techStack || ''),
      durationMinutes: quiz.durationMinutes || 60,
      quickTimerSeconds: quiz.quickTimerSeconds || 15,
      quickDetails: quiz.quickDetails || '',
      description: quiz.description || '',
      startDate: formatDateToDDMonYYYY(quiz.startDate || new Date()),
      startTime: sTime,
      startPeriod: sPeriod,
      endDate: formatDateToDDMonYYYY(quiz.endDate || quiz.startDate || new Date()),
      endTime: eTime,
      endPeriod: ePeriod,
      proctoring: quiz.proctoring || { enabled: true, webcam: true, mic: true, tabSwitchLimit: 3 },
      rewards: quiz.rewards && quiz.rewards.length > 0 ? quiz.rewards : [
        { place: '1st', badge: '🥇 Winner', prize: '$500 Cash + Gold Trophy', description: 'Top Rank Award + Exclusive Swag Kit' },
        { place: '2nd', badge: '🥈 Runner Up', prize: '$250 Cash + Silver Medal', description: '2nd Rank Certificate + Pro Subscription' },
        { place: '3rd', badge: '🥉 3rd Place', prize: '$100 Cash + Bronze Medal', description: '3rd Rank Certificate + Pro Subscription' },
        { place: '4-10th', badge: '🏅 Top 10 (Group)', prize: 'Pro Membership & Swag', description: 'Top 10 Certificate of Excellence' },
        { place: '11-50th', badge: '🎖️ Top 50 (Group)', prize: '500 XP Points & Badge', description: 'Certificate of Merit' }
      ],
      questions: quiz.questions && quiz.questions.length > 0 ? quiz.questions.map(q => ({
        ...q,
        timerSeconds: q.timerSeconds || 15
      })) : [
        {
          questionText: 'Sample Question',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: 0,
          timerSeconds: 15,
          explanation: ''
        }
      ],
      codingChallenge: quiz.codingChallenge || {
        problemStatement: 'Problem description here...',
        difficulty: 'Medium',
        language: 'JavaScript',
        starterCode: 'function solve() {}',
        testCases: [{ input: 'test', expectedOutput: 'result', isHidden: false }],
        hints: [],
        constraints: [],
        proctoringRequired: true
      }
    });
    setOpenQuizSection('category_tags');
    setIsQuizModalOpen(true);
  };

  const handleAddQuestion = (type = 'mcq') => {
    setQuizFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          questionType: type, // 'mcq' | 'pattern'
          codeSnippet: type === 'pattern' ? '// Fix the bug in the code pattern\nfunction solve(arr) {\n  let res = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    res += arr[i];\n  }\n  return res;\n}' : '',
          language: 'javascript',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: 0,
          timerSeconds: prev.generalQuestionTimerSeconds || 15,
          explanation: ''
        }
      ]
    }));
  };

  const handleRemoveQuestion = (idx) => {
    if (quizFormData.questions.length <= 1) {
      addToast('A multiple choice quiz must contain at least 1 question.', 'warning');
      return;
    }
    setQuizFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const handleExcelQuizQuestionsUpload = async (event, mode = 'append') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      addToast('📊 Parsing Quiz Questions from Excel...', 'info');
      const parsedQuestions = await parseQuizQuestionsExcel(file);
      
      if (!parsedQuestions || parsedQuestions.length === 0) {
        addToast('No valid questions found in the Excel file.', 'warning');
        return;
      }

      setQuizFormData((prev) => {
        const newQuestions = mode === 'replace' ? parsedQuestions : [...prev.questions, ...parsedQuestions];
        return {
          ...prev,
          questions: newQuestions
        };
      });

      addToast(`🎉 Successfully imported ${parsedQuestions.length} questions from ${file.name}!`, 'success');
      event.target.value = '';
    } catch (err) {
      console.error('Quiz Excel parse error:', err);
      addToast(err.message || 'Failed to parse Excel file', 'error');
    }
  };

  const handleUploadQuizExcelFromToolbar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      addToast('📊 Parsing Quiz Questions from Excel...', 'info');
      const parsedQuestions = await parseQuizQuestionsExcel(file);
      
      if (!parsedQuestions || parsedQuestions.length === 0) {
        addToast('No valid questions found in the Excel file.', 'warning');
        return;
      }

      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      handleOpenCreateQuizModal();
      setQuizFormData((prev) => ({
        ...prev,
        title: cleanTitle,
        quizType: 'multiple_choice',
        questions: parsedQuestions,
        quickDetails: `Assessment created via Excel upload with ${parsedQuestions.length} questions.`
      }));

      addToast(`🎉 Loaded ${parsedQuestions.length} questions into new Quiz builder!`, 'success');
      event.target.value = '';
    } catch (err) {
      console.error('Quiz Excel upload error:', err);
      addToast(err.message || 'Failed to parse Excel file', 'error');
    }
  };

  const handleAddRewardTier = () => {
    setQuizFormData((prev) => ({
      ...prev,
      rewards: [
        ...(prev.rewards || []),
        {
          place: '51-100th',
          badge: '🏅 Top 100',
          prize: '250 XP Points',
          description: 'Participation Certificate'
        }
      ]
    }));
  };

  const handleRemoveRewardTier = (idx) => {
    if (quizFormData.rewards.length <= 1) {
      addToast('Keep at least 1 reward tier for the competition.', 'warning');
      return;
    }
    setQuizFormData((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== idx)
    }));
  };

  const handleAddTestCase = () => {
    setQuizFormData((prev) => ({
      ...prev,
      codingChallenge: {
        ...prev.codingChallenge,
        testCases: [
          ...(prev.codingChallenge?.testCases || []),
          { input: '', expectedOutput: '', isHidden: false }
        ]
      }
    }));
  };

  const handleRemoveTestCase = (idx) => {
    setQuizFormData((prev) => ({
      ...prev,
      codingChallenge: {
        ...prev.codingChallenge,
        testCases: prev.codingChallenge.testCases.filter((_, i) => i !== idx)
      }
    }));
  };

  const handleSaveQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizFormData.posterUrl?.trim() && !quizFormData.languageLogoUrl?.trim()) {
      addToast('🖼️ Quiz Poster Image or Language Logo is required for quiz creation!', 'error');
      setOpenQuizSection('category_tags');
      return;
    }
    try {
      const fullStartTime = `${quizFormData.startTime} ${quizFormData.startPeriod}`;
      const fullEndTime = `${quizFormData.endTime} ${quizFormData.endPeriod}`;
      const dynamicDurationMinutes = dynamicDuration.durationMinutes;

      const quizPayload = {
        ...quizFormData,
        startTime: fullStartTime,
        endTime: fullEndTime,
        durationMinutes: dynamicDurationMinutes,
        status: getQuizAutoStatus({
          ...quizFormData,
          startTime: fullStartTime,
          endTime: fullEndTime,
          durationMinutes: dynamicDurationMinutes
        }),
        techStack: typeof quizFormData.techStack === 'string'
          ? quizFormData.techStack.split(',').map((s) => s.trim()).filter(Boolean)
          : quizFormData.techStack
      };

      if (editingQuizId) {
        const res = await apiUpdateQuiz(editingQuizId, quizPayload);
        if (res.success && res.quiz) {
          setQuizzesList((prev) =>
            prev.map((q) => ((q._id || q.id) === editingQuizId ? res.quiz : q))
          );
          addToast(`Updated quiz: "${quizPayload.title}" 🎉`, 'success');
        } else {
          setQuizzesList((prev) =>
            prev.map((q) => ((q._id || q.id) === editingQuizId ? { ...q, ...quizPayload } : q))
          );
          addToast(`Updated quiz: "${quizPayload.title}" 🎉`, 'success');
        }
      } else {
        const res = await apiCreateQuiz(quizPayload);
        if (res.success && res.quiz) {
          setQuizzesList((prev) => [res.quiz, ...prev]);
          addToast(`Created new quiz challenge: "${quizPayload.title}" 🚀`, 'success');
        } else {
          const mockQ = {
            id: generateTempId(),
            ...quizPayload
          };
          setQuizzesList((prev) => [mockQ, ...prev]);
          addToast(`Created new quiz challenge: "${quizPayload.title}" 🚀`, 'success');
        }
      }
      setIsQuizModalOpen(false);
    } catch (err) {
      addToast(`Failed to save quiz: ${err.message}`, 'error');
    }
  };

  const handleDeleteQuiz = async (quizId, title) => {
    if (!window.confirm(`Delete quiz challenge "${title}"?`)) return;
    try {
      await apiDeleteQuiz(quizId);
      setQuizzesList((prev) => prev.filter((q) => (q._id || q.id) !== quizId));
      addToast(`Deleted quiz "${title}"`, 'info');
    } catch {
      setQuizzesList((prev) => prev.filter((q) => (q._id || q.id) !== quizId));
      addToast(`Deleted quiz "${title}"`, 'info');
    }
  };

  // ==========================================
  // PREVIOUS WORKS ACTIONS
  // ==========================================
  const handleOpenCreateWorkModal = () => {
    setEditingWorkId(null);
    setWorkFormData({
      title: '',
      description: '',
      category: 'Web Dev',
      participantsCount: '2,400 Participants',
      avgScore: '85% Avg Score',
      topWinner: 'Sarah J. (100%)',
      badge: 'Completed',
      gradient: 'from-blue-500 to-indigo-600',
      techStack: 'HTML, CSS, React, Express',
      completedDate: 'May 2026',
      totalQuestions: 50
    });
    setIsWorkModalOpen(true);
  };

  const handleOpenEditWorkModal = (work) => {
    setEditingWorkId(work._id || work.id);
    setWorkFormData({
      title: work.title || '',
      description: work.description || '',
      category: work.category || 'Web Dev',
      participantsCount: work.participantsCount || '1,500 Participants',
      avgScore: work.avgScore || '80% Avg Score',
      topWinner: work.topWinner || 'Top Performer (100%)',
      badge: work.badge || 'Completed',
      gradient: work.gradient || 'from-blue-500 to-indigo-600',
      techStack: Array.isArray(work.techStack) ? work.techStack.join(', ') : (work.techStack || ''),
      completedDate: work.completedDate || '',
      totalQuestions: work.totalQuestions || 50
    });
    setIsWorkModalOpen(true);
  };

  const handleSaveWorkSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...workFormData,
        techStack: workFormData.techStack
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      };

      if (editingWorkId) {
        const res = await apiUpdatePreviousWork(editingWorkId, payload);
        if (res.success && res.work) {
          setPreviousWorksList((prev) =>
            prev.map((w) => ((w._id || w.id) === editingWorkId ? res.work : w))
          );
          addToast(`Updated previous work "${payload.title}"! 🎉`, 'success');
        } else {
          setPreviousWorksList((prev) =>
            prev.map((w) => ((w._id || w.id) === editingWorkId ? { ...w, ...payload } : w))
          );
          addToast(`Updated previous work "${payload.title}"! 🎉`, 'success');
        }
      } else {
        const res = await apiCreatePreviousWork(payload);
        if (res.success && res.work) {
          setPreviousWorksList((prev) => [res.work, ...prev]);
          addToast(`Created previous work "${payload.title}"! 🚀`, 'success');
        } else {
          const mockNew = {
            id: generateTempId(),
            ...payload
          };
          setPreviousWorksList((prev) => [mockNew, ...prev]);
          addToast(`Created previous work "${payload.title}"! 🚀`, 'success');
        }
      }
      setIsWorkModalOpen(false);
    } catch (err) {
      addToast(`Failed to save previous work: ${err.message}`, 'error');
    }
  };

  const handleDeleteWork = async (workId, title) => {
    if (!window.confirm(`Are you sure you want to delete previous work "${title}"?`)) return;
    try {
      await apiDeletePreviousWork(workId);
      setPreviousWorksList((prev) => prev.filter((w) => (w._id || w.id) !== workId));
      addToast(`Deleted previous work "${title}"`, 'info');
    } catch {
      setPreviousWorksList((prev) => prev.filter((w) => (w._id || w.id) !== workId));
      addToast(`Removed previous work "${title}"`, 'info');
    }
  };

  // ==========================================
  // SITE SETTINGS (ABOUT US & CONTACT) ACTIONS
  // ==========================================
  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await apiUpdateSiteSettings(siteSettings);
      if (res.success && res.settings) {
        setSiteSettings(res.settings);
        addToast('Site Settings (About & Contact) saved successfully! 🎉', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update site settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddImpactStat = () => {
    setSiteSettings((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        impactStats: [...(prev.about?.impactStats || []), { number: '10K+', label: 'New Metric' }]
      }
    }));
  };

  const handleRemoveImpactStat = (idx) => {
    setSiteSettings((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        impactStats: prev.about.impactStats.filter((_, i) => i !== idx)
      }
    }));
  };

  const handleAddCoreValue = () => {
    setSiteSettings((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        coreValues: [
          ...(prev.about?.coreValues || []),
          { icon: '🌟', title: 'New Core Value', description: 'Describe why learners choose your platform.' }
        ]
      }
    }));
  };

  const handleRemoveCoreValue = (idx) => {
    setSiteSettings((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        coreValues: prev.about.coreValues.filter((_, i) => i !== idx)
      }
    }));
  };

  // ==========================================
  // LEGAL PARTNERS & SPONSORS ACTIONS
  // ==========================================
  const handleOpenCreatePartnerModal = () => {
    setEditingPartnerId(null);
    setPartnerFormData({
      name: '',
      type: 'Official Legal & Verification Partner',
      logoUrl: '⚖️',
      websiteUrl: '',
      description: '',
      status: 'active',
      order: (partnersList.length || 0) + 1
    });
    setIsPartnerModalOpen(true);
  };

  const handleOpenEditPartnerModal = (partner) => {
    setEditingPartnerId(partner._id || partner.id);
    setPartnerFormData({
      name: partner.name || '',
      type: partner.type || 'Official Legal & Verification Partner',
      logoUrl: partner.logoUrl || '⚖️',
      websiteUrl: partner.websiteUrl || '',
      description: partner.description || '',
      status: partner.status || 'active',
      order: partner.order !== undefined ? partner.order : 1
    });
    setIsPartnerModalOpen(true);
  };

  const handleSavePartnerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPartnerId) {
        const res = await apiUpdatePartner(editingPartnerId, partnerFormData);
        if (res.success && res.partner) {
          setPartnersList((prev) =>
            prev.map((p) => ((p._id || p.id) === editingPartnerId ? res.partner : p))
          );
          addToast(`Partner "${partnerFormData.name}" updated successfully! 🤝`, 'success');
        }
      } else {
        const res = await apiCreatePartner(partnerFormData);
        if (res.success && res.partner) {
          setPartnersList((prev) => [...prev, res.partner]);
          addToast(`Partner "${partnerFormData.name}" created successfully! 🤝`, 'success');
        }
      }
      setIsPartnerModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to save partner', 'error');
    }
  };

  const handleDeletePartner = async (partnerId, name) => {
    if (!window.confirm(`Are you sure you want to remove partner "${name}"?`)) return;
    try {
      await apiDeletePartner(partnerId);
      setPartnersList((prev) => prev.filter((p) => (p._id || p.id) !== partnerId));
      addToast(`Partner "${name}" removed successfully`, 'info');
    } catch (err) {
      addToast(err.message || 'Failed to remove partner', 'error');
    }
  };

  // ==========================================
  // DYNAMIC QUIZ STATUS CLASSIFICATIONS
  // ==========================================
  // 1. Live Running: ONLY currently running quizzes
  const liveRunningQuizzes = useMemo(() => {
    return quizzesList.filter((q) => getQuizAutoStatus(q) === 'running');
  }, [quizzesList]);

  // 2. Upcoming: Future scheduled quizzes
  const upcomingQuizzesList = useMemo(() => {
    return quizzesList.filter((q) => getQuizAutoStatus(q) === 'upcoming');
  }, [quizzesList]);

  // 3. Past: Ended / Concluded quizzes
  const pastQuizzesList = useMemo(() => {
    return quizzesList.filter((q) => getQuizAutoStatus(q) === 'past');
  }, [quizzesList]);

  // 4. Active: Live (running) AND Upcoming quizzes combined!
  const activeQuizzesList = useMemo(() => {
    return quizzesList.filter((q) => {
      const s = getQuizAutoStatus(q);
      return s === 'running' || s === 'upcoming';
    });
  }, [quizzesList]);

  // Filtered Quizzes combining quizStatusFilter & quizFilterType
  const filteredQuizzes = useMemo(() => {
    return quizzesList.filter((q) => {
      // Type filter ('all' | 'multiple_choice' | 'code')
      if (quizFilterType !== 'all' && q.quizType !== quizFilterType) {
        return false;
      }
      // Status filter ('all' | 'active' | 'live' | 'upcoming' | 'past')
      const autoStatus = getQuizAutoStatus(q);
      if (quizStatusFilter === 'active') {
        return autoStatus === 'running' || autoStatus === 'upcoming';
      }
      if (quizStatusFilter === 'live') {
        return autoStatus === 'running';
      }
      if (quizStatusFilter === 'upcoming') {
        return autoStatus === 'upcoming';
      }
      if (quizStatusFilter === 'past') {
        return autoStatus === 'past';
      }
      return true;
    });
  }, [quizzesList, quizFilterType, quizStatusFilter]);

  const filteredPreviousWorks = previousWorksList.filter((work) => {
    const matchesCat = workCategoryFilter === 'all' || (work.category && work.category.toLowerCase() === workCategoryFilter.toLowerCase());
    const matchesSearch =
      !workSearchQuery ||
      (work.title && work.title.toLowerCase().includes(workSearchQuery.toLowerCase())) ||
      (work.description && work.description.toLowerCase().includes(workSearchQuery.toLowerCase())) ||
      (work.topWinner && work.topWinner.toLowerCase().includes(workSearchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const modalLiveCountdown = getQuizCountdownData({
    ...quizFormData,
    startTime: `${quizFormData.startTime} ${quizFormData.startPeriod}`,
    endTime: `${quizFormData.endTime} ${quizFormData.endPeriod}`,
    durationMinutes: dynamicDuration.durationMinutes
  });

  const adminNavTabs = [
    {
      id: 'overview',
      icon: '📊',
      label: 'System Overview',
      badge: 'Live',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'users',
      icon: '👥',
      label: 'User Directory',
      badge: `${stats.totalUsers || usersList.length || 0}`,
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'quizzes',
      icon: '📝',
      label: 'Quiz Hub',
      badge: `${activeQuizzesList.length} Active`,
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'previous-works',
      icon: '💼',
      label: 'Previous Works',
      badge: `${previousWorksList.length || stats.totalPreviousWorks || 0}`,
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
    },
    {
      id: 'site-info',
      icon: '🏛️',
      label: 'About & Contact',
      badge: 'Config',
      badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
    },
    {
      id: 'partners',
      icon: '⚖️',
      label: 'Legal Partners',
      badge: `${partnersList.length}`,
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'messages',
      icon: '📬',
      label: 'Contact Inquiries',
      badge: messageStats.unreadCount > 0 ? `${messageStats.unreadCount} New` : `${messagesList.length || messageStats.totalAll || 0}`,
      badgeColor: messageStats.unreadCount > 0 ? 'bg-rose-500 text-white font-bold animate-pulse' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'reviews',
      icon: '⭐',
      label: 'Student Reviews',
      badge: reviewStats.pending > 0 ? `${reviewStats.pending} Pending` : `${reviewsList.length || stats.totalReviews || 0}`,
      badgeColor: reviewStats.pending > 0 ? 'bg-amber-500 text-slate-950 font-bold animate-pulse' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    },
    {
      id: 'rewards',
      icon: '🏆',
      label: 'Rewards & Tiers',
      badge: 'Tiers',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
    }
  ];

  // Access check for Admin Portal
  if (!isAdmin) {
    return (
      <div className="text-center py-16 px-6 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-theme)] my-8 max-w-lg mx-auto shadow-2xl space-y-5 animate-fadeIn">
        <span className="text-6xl block mb-2">🔒</span>
        <div>
          <h2 className="text-2xl font-bold font-poppins text-[var(--text-main)]">
            Admin Access Restricted
          </h2>
          <p className="text-xs font-lato text-[var(--text-muted)] mt-1.5 leading-relaxed">
            Please sign in with authorized Administrator credentials to access the Admin Control Center.
          </p>
        </div>
      </div>
    );
  }

  const currentActiveTabMeta = adminNavTabs.find((t) => t.id === activeTab) || adminNavTabs[0];

  return (
    <div className="max-w-[1600px] mx-auto py-5 px-3 sm:px-6 animate-fadeIn space-y-5">
      
      {/* ========================================================================= */}
      {/* 1. STICKY ADMIN PORTAL HEADER & HORIZONTAL TAB SLIDER CONTAINER */}
      {/* ========================================================================= */}
      <div className="sticky top-14 sm:top-16 z-30 space-y-3 bg-[var(--bg-main)]/95 backdrop-blur-md py-2 transition-all">

        {/* ADMIN PORTAL HEADER CARD (MATCHING ADMINDASHBOARD.PNG) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)] text-white flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0">
              🛡️
            </div>
            <div>
              <h1 className="font-poppins font-extrabold text-base sm:text-lg text-[var(--text-main)] leading-tight">
                Admin Portal
              </h1>
              <p className="text-xs font-poppins font-medium text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mt-0.5">
                Active tab - {currentActiveTabMeta.label}
              </p>
            </div>
          </div>

          {/* Right Action: Plus Button to Create New Quiz */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenCreateQuizModal}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold text-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center border border-white/20"
              title="Create New Quiz"
            >
              <span>+</span>
            </button>
          </div>
        </div>

        {/* HORIZONTAL TAB NAVIGATION SLIDER BAR (FOR BOTH SMALL AND LARGE DEVICES) */}
        <div className="bg-[var(--bg-main)] py-2 px-3 rounded-2xl border border-[var(--border-theme)] shadow-md flex items-center justify-center">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 justify-start py-0.5">
            {adminNavTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabButtonRefs.current[tab.id] = el)}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl font-poppins font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[var(--color-primary-600)] text-white shadow-md scale-[1.02]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : tab.badgeColor
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. SLIDE LEFT / RIGHT TAB CONTENT CAROUSEL (WITH TOUCH SWIPE GESTURES) */}
      {/* ========================================================================= */}
      <div
        className="relative overflow-hidden w-full min-h-[400px] touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex w-full transition-transform duration-300 ease-out items-start"
          style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}
        >

        {/* SLIDE 0: OVERVIEW */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 0 ? 'auto' : 0, overflow: activeTabIndex === 0 ? 'visible' : 'hidden' }}
        >
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* 1. Students */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">🎓</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-[var(--color-primary-600)]">
                  {stats.totalStudents || 0}
                </div>
                <div className="text-[11px] font-lato text-[var(--text-muted)] uppercase font-semibold">Students</div>
              </div>

              {/* 2. Admins */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">🛡️</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-amber-500">
                  {stats.totalAdmins || 0}
                </div>
                <div className="text-[11px] font-lato text-[var(--text-muted)] uppercase font-semibold">Admins</div>
              </div>

              {/* 3. Active Quizzes (Live + Upcoming) */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">⚡</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-emerald-500">
                  {activeQuizzesList.length}
                </div>
                <div className="text-[11px] font-lato text-[var(--text-muted)] uppercase font-bold">Active Quizzes</div>
                <div className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">
                  Live ({liveRunningQuizzes.length}) + Up ({upcomingQuizzesList.length})
                </div>
              </div>

              {/* 4. Live Running (ONLY Currently Running Quizzes) */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">🔴</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-rose-500">
                  {liveRunningQuizzes.length}
                </div>
                <div className="text-[11px] font-lato text-[var(--text-muted)] uppercase font-bold">Live (Running Now)</div>
                <div className="text-[9px] font-mono text-rose-500 mt-0.5 font-bold">
                  Running Only
                </div>
              </div>

              {/* 5. Upcoming Quizzes */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">⏳</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-indigo-500">
                  {upcomingQuizzesList.length}
                </div>
                <div className="text-[11px] font-lato text-[var(--text-muted)] uppercase font-semibold">Upcoming Quizzes</div>
              </div>

              {/* 6. Previous Works */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-5 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">💼</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-cyan-500">
                  {previousWorksList.length || stats.totalPreviousWorks || 0}
                </div>
                <div className="text-[11px] font-lato text-[var(--text-muted)] uppercase font-semibold">Previous Works</div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 1: USERS */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 1 ? 'auto' : 0, overflow: activeTabIndex === 1 ? 'visible' : 'hidden' }}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-theme)] pb-4">
              <div>
                <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">
                  Registered Users Management
                </h3>
                <span className="text-xs font-lato text-[var(--text-muted)]">
                  Search, filter, promote roles, and manage user access
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search name, email, school..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setUserCurrentPage(1);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-lato focus:outline-none focus:border-[var(--color-primary-600)]"
                />

                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setUserCurrentPage(1);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-lato focus:outline-none focus:border-[var(--color-primary-600)] cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>

            {/* PAGINATED USERS TABLE */}
            {(() => {
              const totalUserPages = Math.ceil(usersList.length / USERS_PER_PAGE) || 1;
              const validUserPage = Math.min(Math.max(1, userCurrentPage), totalUserPages);
              const startUserIdx = (validUserPage - 1) * USERS_PER_PAGE;
              const paginatedUsers = usersList.slice(startUserIdx, startUserIdx + USERS_PER_PAGE);

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-lato text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-theme)] text-[var(--text-muted)] uppercase text-[10px] font-poppins font-bold">
                          <th className="py-3 px-2">User</th>
                          <th className="py-3 px-2">Email</th>
                          <th className="py-3 px-2">Role</th>
                          <th className="py-3 px-2">School / College</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-theme)]">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-[var(--text-muted)]">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((u) => (
                            <tr key={u._id || u.email} className="hover:bg-[var(--bg-main)] transition-colors">
                              <td className="py-3 px-2 font-bold text-[var(--text-main)] flex items-center space-x-2">
                                <span>{u.role === 'admin' ? '🛡️' : '🎓'}</span>
                                <span>{u.name}</span>
                              </td>
                              <td className="py-3 px-2 text-[var(--text-secondary)]">{u.email}</td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-poppins font-bold uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-[var(--text-muted)]">{u.school || 'N/A'}</td>
                              <td className="py-3 px-2 text-right space-x-2 whitespace-nowrap">
                                {u._id === (user?._id || user?.id) ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-poppins font-bold border border-amber-500/30">
                                    🛡️ Logged-in Admin (Protected)
                                  </span>
                                ) : u.role === 'admin' ? (
                                  <>
                                    <button
                                      onClick={() => handleToggleRole(u)}
                                      className="px-2.5 py-1 rounded-lg border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-xs font-poppins font-semibold text-[var(--color-primary-600)] cursor-pointer"
                                    >
                                      Demote to Student
                                    </button>
                                    <span
                                      className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs font-poppins font-semibold border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-75 inline-block"
                                      title="Admin accounts cannot be deleted"
                                    >
                                      Protected Admin
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleToggleRole(u)}
                                      className="px-2.5 py-1 rounded-lg border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-xs font-poppins font-semibold text-[var(--color-primary-600)] cursor-pointer"
                                    >
                                      Promote to Admin
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u._id, u.name)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-poppins font-semibold cursor-pointer transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* USER DIRECTORY PAGINATION CONTROLS */}
                  {usersList.length > USERS_PER_PAGE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-theme)] mt-2">
                      <span className="text-xs font-lato text-[var(--text-muted)]">
                        Showing <span className="font-bold text-[var(--text-main)]">{startUserIdx + 1}</span> to{' '}
                        <span className="font-bold text-[var(--text-main)]">{Math.min(startUserIdx + USERS_PER_PAGE, usersList.length)}</span> of{' '}
                        <span className="font-bold text-[var(--text-main)]">{usersList.length}</span> registered users
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setUserCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={validUserPage <= 1}
                          className="px-3 py-1 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-xs font-poppins font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                        >
                          ← Prev
                        </button>

                        {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((pg) => (
                          <button
                            key={pg}
                            onClick={() => setUserCurrentPage(pg)}
                            className={`w-7 h-7 rounded-lg text-xs font-poppins font-bold transition-all cursor-pointer ${
                              validUserPage === pg
                                ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                                : 'border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {pg}
                          </button>
                        ))}

                        <button
                          onClick={() => setUserCurrentPage((p) => Math.min(totalUserPages, p + 1))}
                          disabled={validUserPage >= totalUserPages}
                          className="px-3 py-1 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-xs font-poppins font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* SLIDE 2: QUIZZES */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 2 ? 'auto' : 0, overflow: activeTabIndex === 2 ? 'visible' : 'hidden' }}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-theme)] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">
                    Quiz & Code Challenge Manager
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {quizzesList.length} Quizzes
                  </span>
                </div>
                <span className="text-xs font-lato text-[var(--text-muted)]">
                  Total duration automatically syncs from Start & End Times with AM/PM toggle switch.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter Bar */}
                <div className="inline-flex rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] p-1 flex-wrap gap-1">
                  <button
                    onClick={() => setQuizStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizStatusFilter === 'all' ? 'bg-[var(--color-primary-600)] text-white shadow-sm' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    All ({quizzesList.length})
                  </button>
                  <button
                    onClick={() => setQuizStatusFilter('active')}
                    className={`px-3 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    ⚡ Active ({activeQuizzesList.length})
                  </button>
                  <button
                    onClick={() => setQuizStatusFilter('live')}
                    className={`px-3 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizStatusFilter === 'live' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    🔴 Live Now ({liveRunningQuizzes.length})
                  </button>
                  <button
                    onClick={() => setQuizStatusFilter('upcoming')}
                    className={`px-3 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizStatusFilter === 'upcoming' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    ⏳ Upcoming ({upcomingQuizzesList.length})
                  </button>
                  <button
                    onClick={() => setQuizStatusFilter('past')}
                    className={`px-3 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizStatusFilter === 'past' ? 'bg-slate-600 text-white shadow-sm' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    📁 Past ({pastQuizzesList.length})
                  </button>
                </div>

                {/* Type Filter Bar */}
                <div className="inline-flex rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] p-1">
                  <button
                    onClick={() => setQuizFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizFilterType === 'all' ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setQuizFilterType('multiple_choice')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizFilterType === 'multiple_choice' ? 'bg-[var(--bg-card)] text-[var(--color-primary-600)] font-bold shadow-sm' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    🔘 MCQ ({quizzesList.filter(q => q.quizType === 'multiple_choice' || !q.quizType).length})
                  </button>
                  <button
                    onClick={() => setQuizFilterType('code')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-poppins font-semibold cursor-pointer transition-all ${
                      quizFilterType === 'code' ? 'bg-[var(--bg-card)] text-indigo-500 font-bold shadow-sm' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    💻 Code ({quizzesList.filter(q => q.quizType === 'code').length})
                  </button>
                </div>

                {/* Excel Template & Bulk Upload Quick Actions */}
                <button
                  type="button"
                  onClick={downloadQuizQuestionsTemplate}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 font-poppins font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                  title="Download structured Excel template for Quiz Questions"
                >
                  <span>📥</span>
                  <span>Download Excel Template</span>
                </button>

                <label
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                  title="Upload an Excel file to create a Quiz with all questions automatically parsed"
                >
                  <span>📤</span>
                  <span>Upload Quiz via Excel</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleUploadQuizExcelFromToolbar}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleOpenCreateQuizModal}
                  className="px-4 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <span>➕ Create Quiz / Code Challenge</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuizzes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-[var(--text-muted)] font-lato bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-6">
                  <span className="text-4xl block mb-2">📝</span>
                  <p className="font-poppins font-bold text-sm text-[var(--text-main)]">No quizzes found.</p>
                  <button
                    onClick={handleOpenCreateQuizModal}
                    className="mt-4 px-4 py-2 rounded-xl bg-[var(--color-primary-600)] text-white text-xs font-poppins font-bold cursor-pointer"
                  >
                    Create Quiz
                  </button>
                </div>
              ) : (
                filteredQuizzes.map((quiz) => {
                  const isCode = quiz.quizType === 'code';
                  const isQuick = quiz.mcqSubtype === 'quick';
                  const timerLabel = quiz.timerType === 'per_question_custom'
                    ? '🎯 Custom Time/Q'
                    : quiz.timerType === 'total_quiz'
                    ? `⏳ ${quiz.durationMinutes || 60}m Total`
                    : `⏱️ ${quiz.generalQuestionTimerSeconds || 15}s / Q`;

                  return (
                    <div
                      key={quiz._id || quiz.id || quiz.title}
                      className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-5 rounded-2xl space-y-3 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-poppins font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {quiz.category || 'Web Dev'}
                          </span>
                          
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-poppins font-semibold bg-slate-200 dark:bg-slate-800 text-[var(--text-secondary)]">
                              {timerLabel}
                            </span>

                            {isCode ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-poppins font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                                💻 Code
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-poppins font-bold ${
                                isQuick
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {isQuick ? '⚡ Quick' : '📝 Standard'}
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] group-hover:text-[var(--color-primary-600)] transition-colors">
                          {quiz.title}
                        </h4>
                        <p className="font-lato text-xs text-[var(--text-muted)] line-clamp-2 mt-1">
                          {quiz.quickDetails || quiz.description}
                        </p>

                        <div className="mt-3 pt-2 border-t border-[var(--border-theme)] flex items-center justify-between">
                          <QuizCountdownBadge quiz={quiz} />
                          <span className="text-[11px] font-lato text-[var(--text-muted)] font-bold">
                            ⏱️ {quiz.durationMinutes || 60}m
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-theme)] flex justify-between items-center text-xs">
                        <span className="text-[10px] text-[var(--text-muted)] font-lato">
                          {quiz.startDate} {quiz.startTime}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEditQuizModal(quiz)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors cursor-pointer font-bold"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz._id || quiz.id, quiz.title)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer font-bold"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* SLIDE 3: PREVIOUS WORKS */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 3 ? 'auto' : 0, overflow: activeTabIndex === 3 ? 'visible' : 'hidden' }}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-theme)] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">
                    Previous Works Showcase
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {previousWorksList.length} Items
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search works..."
                  value={workSearchQuery}
                  onChange={(e) => setWorkSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                />
                <select
                  value={workCategoryFilter}
                  onChange={(e) => setWorkCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none font-bold"
                >
                  <option value="all">All Categories</option>
                  <option value="Web Dev">Web Dev</option>
                  <option value="DSA">DSA</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="System Design">System Design</option>
                </select>
                <button
                  onClick={handleOpenCreateWorkModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-poppins font-bold text-xs cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <span>➕ Add Previous Work</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPreviousWorks.map((work) => (
                <div
                  key={work._id || work.id}
                  className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className={`h-28 rounded-xl bg-gradient-to-r ${work.gradient || 'from-blue-500 to-indigo-600'} p-3 text-white flex flex-col justify-between mb-3 shadow-sm relative overflow-hidden`}>
                      <div className="flex justify-between items-start z-10">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-poppins bg-black/25 backdrop-blur-md">
                          {work.badge || 'Completed'}
                        </span>
                        <span className="text-[10px] font-medium font-lato bg-white/25 px-2 py-0.5 rounded-md backdrop-blur-md">
                          🏆 {work.topWinner || 'Top Winner'}
                        </span>
                      </div>
                      <div className="z-10">
                        <div className="text-[10px] font-lato opacity-80">{work.category || 'Challenge'}</div>
                        <div className="font-poppins font-bold text-sm line-clamp-1">{work.title}</div>
                      </div>
                    </div>

                    <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] mb-1 line-clamp-1">
                      {work.title}
                    </h4>
                    <p className="font-lato text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">
                      {work.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold">
                      👥 {work.participantsCount || '1.2k Scholars'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditWorkModal(work)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-poppins font-semibold cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWork(work._id || work.id, work.title)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-poppins font-semibold cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLIDE 4: SITE INFO */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 4 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 4 ? 'auto' : 0, overflow: activeTabIndex === 4 ? 'visible' : 'hidden' }}
        >
          <form onSubmit={handleSaveSiteSettings} className="space-y-8 animate-fadeIn">
            {/* 1. ABOUT US SECTION */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-theme)] pb-4">
                <div>
                  <h3 className="text-lg font-bold font-poppins text-[var(--text-main)] flex items-center space-x-2">
                    <span>🏛️</span>
                    <span>About Us Page Content Configuration</span>
                  </h3>
                  <p className="text-xs font-lato text-[var(--text-muted)]">
                    Edit hero banners, brand headlines, impact statistics, and core values displayed on the public About page
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingSettings ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-poppins">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Hero Badge Label</label>
                  <input
                    type="text"
                    value={siteSettings.about?.heroBadge || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      about: { ...prev.about, heroBadge: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Hero Title Heading</label>
                  <input
                    type="text"
                    value={siteSettings.about?.heroTitle || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      about: { ...prev.about, heroTitle: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="col-span-full space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Hero Subtitle / Mission Statement</label>
                  <textarea
                    rows="2"
                    value={siteSettings.about?.heroSubtitle || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      about: { ...prev.about, heroSubtitle: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Impact Stats Editor */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-theme)]">
                <div className="flex items-center justify-between">
                  <h4 className="font-poppins font-bold text-sm text-[var(--text-main)]">
                    📊 Impact Stats Counters ({siteSettings.about?.impactStats?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddImpactStat}
                    className="px-3 py-1 rounded-lg bg-[var(--color-primary-50)] dark:bg-slate-800 text-[var(--color-primary-600)] font-bold text-xs cursor-pointer"
                  >
                    + Add Stat
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(siteSettings.about?.impactStats || []).map((stat, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveImpactStat(idx)}
                        className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block">Stat Number</label>
                        <input
                          type="text"
                          value={stat.number}
                          onChange={(e) => {
                            const newStats = [...siteSettings.about.impactStats];
                            newStats[idx].number = e.target.value;
                            setSiteSettings(prev => ({ ...prev, about: { ...prev.about, impactStats: newStats } }));
                          }}
                          className="w-full p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs font-bold text-[var(--color-primary-600)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block">Label</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...siteSettings.about.impactStats];
                            newStats[idx].label = e.target.value;
                            setSiteSettings(prev => ({ ...prev, about: { ...prev.about, impactStats: newStats } }));
                          }}
                          className="w-full p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Values Editor */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-theme)]">
                <div className="flex items-center justify-between">
                  <h4 className="font-poppins font-bold text-sm text-[var(--text-main)]">
                    💎 Core Values & Platform Pillars ({siteSettings.about?.coreValues?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCoreValue}
                    className="px-3 py-1 rounded-lg bg-[var(--color-primary-50)] dark:bg-slate-800 text-[var(--color-primary-600)] font-bold text-xs cursor-pointer"
                  >
                    + Add Value
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(siteSettings.about?.coreValues || []).map((val, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveCoreValue(idx)}
                        className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={val.icon}
                          onChange={(e) => {
                            const newVals = [...siteSettings.about.coreValues];
                            newVals[idx].icon = e.target.value;
                            setSiteSettings(prev => ({ ...prev, about: { ...prev.about, coreValues: newVals } }));
                          }}
                          className="w-10 p-1.5 text-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-theme)] text-sm focus:outline-none"
                        />
                        <input
                          type="text"
                          value={val.title}
                          onChange={(e) => {
                            const newVals = [...siteSettings.about.coreValues];
                            newVals[idx].title = e.target.value;
                            setSiteSettings(prev => ({ ...prev, about: { ...prev.about, coreValues: newVals } }));
                          }}
                          placeholder="Value Title"
                          className="flex-1 p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs font-bold text-[var(--text-main)] focus:outline-none"
                        />
                      </div>
                      <textarea
                        rows="2"
                        value={val.description}
                        onChange={(e) => {
                          const newVals = [...siteSettings.about.coreValues];
                          newVals[idx].description = e.target.value;
                          setSiteSettings(prev => ({ ...prev, about: { ...prev.about, coreValues: newVals } }));
                        }}
                        placeholder="Description"
                        className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs text-[var(--text-secondary)] resize-none focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. CONTACT US SECTION */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-[var(--border-theme)] pb-4">
                <h3 className="text-lg font-bold font-poppins text-[var(--text-main)] flex items-center space-x-2">
                  <span>📞</span>
                  <span>Contact Us Page & Support Channels</span>
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  Configure primary email, phone line, office location, support hours, and social media channels
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-poppins">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Official Support Email *</label>
                  <input
                    type="email"
                    value={siteSettings.contact?.supportEmail || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, supportEmail: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Contact Phone Number</label>
                  <input
                    type="text"
                    value={siteSettings.contact?.phone || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Support Working Hours</label>
                  <input
                    type="text"
                    value={siteSettings.contact?.supportHours || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, supportHours: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Headquarters / Office Address</label>
                  <input
                    type="text"
                    value={siteSettings.contact?.headquarters || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, headquarters: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Twitter / X URL</label>
                  <input
                    type="text"
                    value={siteSettings.contact?.socialLinks?.twitter || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, socialLinks: { ...prev.contact?.socialLinks, twitter: e.target.value } }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">GitHub URL</label>
                  <input
                    type="text"
                    value={siteSettings.contact?.socialLinks?.github || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, socialLinks: { ...prev.contact?.socialLinks, github: e.target.value } }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">LinkedIn URL</label>
                  <input
                    type="text"
                    value={siteSettings.contact?.socialLinks?.linkedin || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, socialLinks: { ...prev.contact?.socialLinks, linkedin: e.target.value } }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Discord Server URL</label>
                  <input
                    type="text"
                    value={siteSettings.contact?.socialLinks?.discord || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, socialLinks: { ...prev.contact?.socialLinks, discord: e.target.value } }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block flex items-center justify-between">
                    <span>WhatsApp Community Invite Link</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Community</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://chat.whatsapp.com/BkBrToj3Hzv6ekv8BqSzO1"
                    value={siteSettings.contact?.socialLinks?.whatsappCommunity || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, socialLinks: { ...prev.contact?.socialLinks, whatsappCommunity: e.target.value } }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block flex items-center justify-between">
                    <span>Telegram Community Channel Link</span>
                    <span className="text-[10px] text-blue-600 font-extrabold uppercase">Telegram</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://t.me/braiiinarena"
                    value={siteSettings.contact?.socialLinks?.telegramCommunity || ''}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contact: { ...prev.contact, socialLinks: { ...prev.contact?.socialLinks, telegramCommunity: e.target.value } }
                    }))}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border-theme)]">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-poppins font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingSettings ? '⏳ Saving Site Info...' : '💾 Save All Site Info & Contact Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* SLIDE 5: PARTNERS */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 5 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 5 ? 'auto' : 0, overflow: activeTabIndex === 5 ? 'visible' : 'hidden' }}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-theme)] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">
                    ⚖️ Legal Partners & Sponsors Manager
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {partnersList.length} Partners
                  </span>
                </div>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  Manage legal verification councils, academic institutions, and sponsor partners shown across the platform
                </p>
              </div>

              <button
                onClick={handleOpenCreatePartnerModal}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <span>➕ Add Legal Partner / Sponsor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {partnersList.length === 0 ? (
                <div className="col-span-full text-center py-12 text-[var(--text-muted)] font-lato bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-6">
                  <span className="text-4xl block mb-2">⚖️</span>
                  <p className="font-poppins font-bold text-sm text-[var(--text-main)]">No partners configured yet.</p>
                  <button
                    onClick={handleOpenCreatePartnerModal}
                    className="mt-4 px-4 py-2 rounded-xl bg-[var(--color-primary-600)] text-white text-xs font-poppins font-bold cursor-pointer"
                  >
                    Add First Partner
                  </button>
                </div>
              ) : (
                partnersList.map((partner) => (
                  <div
                    key={partner._id || partner.id}
                    className="bg-[var(--bg-main)] border border-[var(--border-theme)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-theme)] flex items-center justify-center text-2xl shadow-sm">
                            {typeof partner.logoUrl === 'string' && (partner.logoUrl.startsWith('http') || partner.logoUrl.startsWith('data:') || partner.logoUrl.startsWith('/') || partner.logoUrl.includes('.')) ? (
                              <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                className="w-9 h-9 object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  if (e.target.parentNode) e.target.parentNode.innerText = '⚖️';
                                }}
                              />
                            ) : (
                              partner.logoUrl || '⚖️'
                            )}
                          </div>
                          <div>
                            <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] line-clamp-1">
                              {partner.name}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold inline-block mt-0.5">
                              {partner.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="font-lato text-xs text-[var(--text-secondary)] line-clamp-3">
                        {partner.description || 'No description provided.'}
                      </p>

                      {partner.websiteUrl && (
                        <a
                          href={partner.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-[var(--color-primary-600)] hover:underline inline-block truncate max-w-full"
                        >
                          🔗 {partner.websiteUrl}
                        </a>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
                      <span className={`text-[10px] font-poppins font-bold px-2 py-0.5 rounded-full ${
                        partner.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {partner.status === 'active' ? '● Active' : '○ Inactive'}
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditPartnerModal(partner)}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner._id || partner.id, partner.name)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SLIDE 6: MESSAGES */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 6 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 6 ? 'auto' : 0, overflow: activeTabIndex === 6 ? 'visible' : 'hidden' }}
        >
          <div className="space-y-6 animate-fadeIn">
            {/* TOP KPI COUNTERS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-4 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">📬</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-[var(--color-primary-600)]">
                  {messageStats.totalAll || messagesList.length}
                </div>
                <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase font-semibold">Total Inquiries</div>
              </div>

              <div className="bg-[var(--bg-card)] border border-rose-500/30 p-4 rounded-2xl text-center shadow-sm bg-rose-500/5">
                <span className="text-2xl block mb-1">🔴</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-rose-600 dark:text-rose-400">
                  {messageStats.unreadCount}
                </div>
                <div className="text-[10px] font-lato text-rose-600 dark:text-rose-400 uppercase font-semibold">Unread Inquiries</div>
              </div>

              <div className="bg-[var(--bg-card)] border border-amber-500/30 p-4 rounded-2xl text-center shadow-sm bg-amber-500/5">
                <span className="text-2xl block mb-1">🚨</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-amber-600 dark:text-amber-400">
                  {messageStats.urgentCount}
                </div>
                <div className="text-[10px] font-lato text-amber-600 dark:text-amber-400 uppercase font-semibold">High / Urgent</div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-4 rounded-2xl text-center shadow-sm">
                <span className="text-2xl block mb-1">⏳</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-[var(--color-secondary-600)]">
                  {messageStats.lastWeekCount}
                </div>
                <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase font-semibold">Received This Week</div>
              </div>
            </div>

            {/* FILTER TOOLBAR: DATE RANGE (last_week default / last_month / all) + READ/UNREAD + PRIORITY + SEARCH */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                
                {/* DATE RANGE FILTER BUTTONS (DEFAULT: LAST WEEK) */}
                <div className="flex items-center space-x-1.5 p-1 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-theme)] self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                  <span className="text-[10px] font-poppins font-bold text-[var(--text-muted)] px-2 uppercase">Date:</span>
                  {[
                    { id: 'last_week', label: '📅 Last Week (Default)' },
                    { id: 'last_month', label: '📅 Last Month' },
                    { id: 'all', label: '📅 All Time' }
                  ].map((dTab) => (
                    <button
                      key={dTab.id}
                      onClick={() => setMsgDateFilter(dTab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-bold transition-all cursor-pointer whitespace-nowrap ${
                        msgDateFilter === dTab.id
                          ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {dTab.label}
                    </button>
                  ))}
                </div>

                {/* READ / UNREAD STATUS TABS */}
                <div className="flex items-center space-x-1.5 p-1 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-theme)] self-start sm:self-auto">
                  <span className="text-[10px] font-poppins font-bold text-[var(--text-muted)] px-2 uppercase">Status:</span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'unread', label: '🔴 Unread' },
                    { id: 'read', label: '🟢 Read' }
                  ].map((rTab) => (
                    <button
                      key={rTab.id}
                      onClick={() => setMsgReadFilter(rTab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-bold transition-all cursor-pointer ${
                        msgReadFilter === rTab.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {rTab.label}
                    </button>
                  ))}
                </div>

                {/* PRIORITY FILTER DROPDOWN */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-poppins font-bold text-[var(--text-muted)] whitespace-nowrap">
                    Priority:
                  </label>
                  <select
                    value={msgPriorityFilter}
                    onChange={(e) => setMsgPriorityFilter(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-poppins font-bold text-[var(--text-main)] cursor-pointer focus:outline-none focus:border-[var(--color-primary-600)]"
                  >
                    <option value="all">⚡ All Priorities</option>
                    <option value="urgent">🚨 Urgent Priority</option>
                    <option value="high">🔥 High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">🌱 Low Priority</option>
                  </select>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative flex-1 lg:max-w-xs">
                  <input
                    type="text"
                    placeholder="Search sender, email, subject..."
                    value={msgSearchQuery}
                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                    className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] text-xs font-poppins text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary-600)]"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-[var(--text-muted)]">🔍</span>
                  {msgSearchQuery && (
                    <button
                      onClick={() => setMsgSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      ✕
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* MESSAGES LIST / CARDS */}
            {isLoadingMessages ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-theme)] animate-pulse h-28"></div>
                ))}
              </div>
            ) : messagesList.length === 0 ? (
              <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-theme)] p-8">
                <span className="text-4xl block mb-2">📭</span>
                <h3 className="text-lg font-bold font-poppins text-[var(--text-main)]">No Inquiries Found</h3>
                <p className="text-xs font-lato text-[var(--text-muted)] mt-1">
                  Try switching date filter to "All Time" or reset read/priority filters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messagesList.map((msg) => {
                  const isUrgent = msg.priority === 'urgent';
                  const isHigh = msg.priority === 'high';
                  const isMedium = msg.priority === 'medium';
                  const isUnread = !msg.isRead;

                  return (
                    <div
                      key={msg._id || msg.id}
                      className={`p-5 rounded-2xl border transition-all relative ${
                        isUnread
                          ? 'bg-[var(--bg-card)] border-blue-500/40 shadow-md shadow-blue-500/5'
                          : 'bg-[var(--bg-card)] border-[var(--border-theme)] opacity-90'
                      }`}
                    >
                      {/* Top Row: Sender Info, Category, Priority, Date, Quick Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-600)] to-indigo-600 text-white font-poppins font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                            {msg.name ? msg.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-poppins font-bold text-sm text-[var(--text-main)] flex items-center space-x-1.5">
                                <span>{msg.name}</span>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                )}
                              </h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-main)] border border-[var(--border-theme)] text-[var(--text-muted)] font-semibold">
                                {msg.category || 'Support'}
                              </span>
                            </div>
                            <a
                              href={`mailto:${msg.email}`}
                              className="text-xs font-mono text-[var(--color-primary-600)] hover:underline block"
                            >
                              {msg.email}
                            </a>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Priority Badge */}
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                            isUrgent
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 animate-pulse'
                              : isHigh
                              ? 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                              : isMedium
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              : 'bg-slate-500/10 text-slate-600 border-slate-500/30'
                          }`}>
                            {msg.priority === 'urgent' && '🚨 Urgent'}
                            {msg.priority === 'high' && '🔥 High'}
                            {msg.priority === 'medium' && '⚡ Medium'}
                            {msg.priority === 'low' && '🌱 Low'}
                          </span>

                          {/* Date Tag */}
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Subject & Message Body */}
                      <div className="bg-[var(--bg-main)] p-3.5 rounded-xl border border-[var(--border-theme)] mb-3">
                        <div className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)] mb-1">
                          📌 {msg.subject}
                        </div>
                        <p className="font-lato text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenMessageModal(msg)}
                            className="px-3 py-1.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span>👁️ View Details</span>
                          </button>

                          <a
                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-poppins font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span>✉️ Reply</span>
                          </a>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleMessageRead(msg._id || msg.id, msg.isRead)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-poppins font-bold border transition-colors cursor-pointer ${
                              msg.isRead
                                ? 'bg-[var(--bg-main)] border-[var(--border-theme)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                : 'bg-blue-500/10 border-blue-500/30 text-[var(--color-primary-600)] hover:bg-blue-500/20'
                            }`}
                          >
                            {msg.isRead ? 'Mark as Unread' : '✓ Mark Read'}
                          </button>

                          <button
                            onClick={() => handleDeleteMessage(msg._id || msg.id, msg.name)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
                            title="Delete message"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SLIDE 7: ⭐ STUDENT REVIEWS & TESTIMONIAL MODERATION */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 7 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 7 ? 'auto' : 0, overflow: activeTabIndex === 7 ? 'visible' : 'hidden' }}
        >
          <div className="space-y-6 animate-fadeIn">
            {/* STATS OVERVIEW HEADER */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-4 rounded-2xl text-center shadow-sm">
                <span className="text-xl block mb-1">⭐</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-amber-500">
                  {reviewStats.avgRating || 5.0} / 5
                </div>
                <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase font-semibold">Average Rating</div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-4 rounded-2xl text-center shadow-sm">
                <span className="text-xl block mb-1">💬</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-[var(--color-primary-600)]">
                  {reviewStats.total || reviewsList.length}
                </div>
                <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase font-semibold">Total Reviews</div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-4 rounded-2xl text-center shadow-sm">
                <span className="text-xl block mb-1">✅</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-emerald-500">
                  {reviewStats.approved || 0}
                </div>
                <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase font-semibold">Approved</div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-4 rounded-2xl text-center shadow-sm">
                <span className="text-xl block mb-1">⏳</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-amber-500">
                  {reviewStats.pending || 0}
                </div>
                <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase font-semibold">Pending</div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-4 rounded-2xl text-center shadow-sm col-span-2 sm:col-span-1">
                <span className="text-xl block mb-1">🏆</span>
                <div className="font-poppins font-bold text-xl sm:text-2xl text-purple-500">
                  {reviewStats.featured || 0}
                </div>
                <div className="text-[10px] font-lato text-[var(--text-muted)] uppercase font-semibold">Featured</div>
              </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <span className="text-[10px] font-poppins font-bold text-[var(--text-muted)] uppercase mr-1 shrink-0">
                  Filter:
                </span>
                {['all', 'approved', 'pending', 'rejected'].map((statusKey) => (
                  <button
                    key={statusKey}
                    onClick={() => setReviewStatusFilter(statusKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-bold capitalize transition-all cursor-pointer shrink-0 ${
                      reviewStatusFilter === statusKey
                        ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                        : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-theme)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {statusKey}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search reviews by name or text..."
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] focus:outline-none"
                />
                <button
                  onClick={handleOpenCreateReviewModalAdmin}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-poppins font-bold cursor-pointer shrink-0 shadow-sm transition-all"
                >
                  + Add Review
                </button>
              </div>
            </div>

            {/* REVIEWS TABLE / LIST */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
              {reviewsList.length === 0 ? (
                <div className="text-center py-12 text-xs font-lato text-[var(--text-muted)]">
                  No reviews found matching filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-lato text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-theme)] text-[var(--text-muted)] uppercase text-[10px] font-poppins font-bold">
                        <th className="py-2.5 px-3">Reviewer</th>
                        <th className="py-2.5 px-3 text-center">Rating</th>
                        <th className="py-2.5 px-3">Review Content</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Featured</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-theme)]">
                      {reviewsList.map((rev) => {
                        const id = rev._id || rev.id;
                        const name = rev.userName || rev.author || 'Anonymous';
                        return (
                          <tr key={id} className="hover:bg-[var(--bg-main)] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-poppins font-bold text-xs text-[var(--text-main)]">
                                {name}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                {rev.role || 'Student Candidate'}
                              </div>
                              {rev.userEmail && (
                                <div className="text-[10px] font-mono text-[var(--color-primary-600)]">
                                  {rev.userEmail}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center text-amber-400 text-xs">
                                {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                  <span key={i}>★</span>
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-amber-600">
                                {rev.rating || 5}/5
                              </span>
                            </td>

                            <td className="py-3 px-3 max-w-xs sm:max-w-md">
                              <p className="text-xs text-[var(--text-main)] italic line-clamp-2 leading-relaxed">
                                "{rev.quote}"
                              </p>
                              {rev.quizTitle && (
                                <span className="inline-block mt-1 text-[9px] font-poppins font-bold bg-blue-500/10 text-[var(--color-primary-600)] px-2 py-0.5 rounded-full">
                                  🎯 Quiz: {rev.quizTitle}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <select
                                value={rev.status || 'approved'}
                                onChange={(e) => handleUpdateReviewStatusAdmin(id, e.target.value)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-poppins font-bold cursor-pointer focus:outline-none border ${
                                  rev.status === 'approved'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                    : rev.status === 'pending'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                }`}
                              >
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleToggleReviewFeaturedAdmin(id, rev.isFeatured)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-poppins font-bold cursor-pointer transition-all ${
                                  rev.isFeatured
                                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-theme)] hover:text-[var(--text-main)]'
                                }`}
                                title={rev.isFeatured ? 'Featured on homepage carousel' : 'Click to feature on homepage'}
                              >
                                {rev.isFeatured ? '⭐ Featured' : '☆ Standard'}
                              </button>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleOpenEditReviewModalAdmin(rev)}
                                  className="p-1.5 rounded-lg border border-[var(--border-theme)] text-[var(--text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-slate-800 text-xs cursor-pointer"
                                  title="Edit Review Details"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteReviewAdmin(id, name)}
                                  className="p-1.5 rounded-lg border border-transparent text-rose-500 hover:bg-rose-500/10 text-xs cursor-pointer"
                                  title="Delete Review"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SLIDE 8: GLOBAL REWARDS & TIERS MANAGEMENT */}
        <div
          className={`w-full shrink-0 min-w-full transition-opacity duration-300 ${
            activeTabIndex === 8 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: activeTabIndex === 8 ? 'auto' : 0, overflow: activeTabIndex === 8 ? 'visible' : 'hidden' }}
        >
          <div className="space-y-6 animate-fadeIn">
            
            {/* TOP HEADER CARD WITH + ADD REWARD TIER BUTTON */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-poppins text-[var(--text-main)] flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Global Platform Reward Tiers & Leaderboard Badges</span>
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)] mt-1">
                  Configure platform-wide reward tiers, cash prizes, medals, and trophy badges for quiz rankers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateRewardTierModal}
                className="px-5 py-2.5 rounded-2xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-2 shrink-0"
              >
                <span>+</span>
                <span>Add Reward Tier</span>
              </button>
            </div>

            {/* REWARD TIERS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalRewards.map((reward, rIdx) => {
                const id = reward.id || reward._id || rIdx;
                return (
                  <div
                    key={id}
                    className="bg-[var(--bg-card)] border-2 border-[var(--border-theme)] hover:border-[var(--color-primary-400)] rounded-3xl p-5 shadow-sm transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--border-theme)] pb-3">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-10 h-10 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex items-center justify-center text-xl shrink-0 shadow-xs">
                            {reward.badge?.split(' ')?.[0] || '🏆'}
                          </span>
                          <div>
                            <h4 className="font-poppins font-extrabold text-sm text-[var(--text-main)]">
                              {reward.badge || 'Reward Badge'}
                            </h4>
                            <span className="text-[10px] font-poppins font-bold text-[var(--color-primary-600)] bg-blue-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                              Rank: {reward.place}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 font-lato text-xs">
                        <div className="font-poppins font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                          <span>🎁</span>
                          <span>{reward.prize}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed text-[11px]">
                          {reward.description || 'No description specified.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRewardTierModal(reward)}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white font-poppins font-bold text-xs cursor-pointer transition-colors"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRewardTier(id, reward.badge)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-600 hover:text-white font-poppins font-bold text-xs cursor-pointer transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>

      {/* ========================================================================= */}
      {/* 🚀 QUIZ CREATOR / BUILDER MODAL WITH REWARDS & RANK GROUPS BUILDER */}
      {/* ========================================================================= */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-3xl bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar relative">
            <button
              onClick={() => setIsQuizModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl">
                {quizFormData.quizType === 'code' ? '💻' : '📝'}
              </span>
              <div>
                <h3 className="text-xl font-bold font-poppins">
                  {editingQuizId ? 'Edit Quiz / Challenge' : 'Create New Assessment Challenge'}
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  Configure quiz details, dynamic timings, individual ranks & rank group reward tiers.
                </p>
              </div>
            </div>

            {/* REAL-TIME AUTO STATUS & COUNTDOWN PREVIEW BANNER */}
            <div className="mb-6 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase font-poppins font-bold text-[var(--text-muted)]">
                  Automatic Dynamic Status:
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-poppins font-bold uppercase ${
                    modalLiveCountdown.status === 'running'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                      : modalLiveCountdown.status === 'upcoming'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                  }`}>
                    {modalLiveCountdown.status === 'running' ? '🔴 Live Now' : modalLiveCountdown.status === 'upcoming' ? '⏳ Upcoming' : '🏁 Past / Archived'}
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                    {modalLiveCountdown.label} {modalLiveCountdown.formattedText}
                  </span>
                </div>
              </div>

              {/* DYNAMIC CALCULATED DURATION BADGE */}
              <div className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary-50)] dark:bg-blue-950/50 border border-[var(--color-primary-300)] text-[var(--color-primary-700)] dark:text-blue-300 text-xs font-poppins font-bold flex items-center space-x-1.5">
                <span>⏱️ Exam Duration:</span>
                <span className="underline">{dynamicDuration.formattedDuration}</span>
              </div>
            </div>

            <form onSubmit={handleSaveQuizSubmit} className="space-y-4 font-lato text-xs sm:text-sm">
              
              {/* ========================================================================= */}
              {/* 🏷️ SECTION 1: CHALLENGES, CATEGORY & TAGS (UNWRAPPED INITIALLY) */}
              {/* ========================================================================= */}
              <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                openQuizSection === 'category_tags'
                  ? 'border-[var(--color-primary-500)] shadow-md ring-1 ring-blue-500/20 bg-[var(--bg-card)]'
                  : 'border-[var(--border-theme)] hover:border-[var(--color-primary-300)] bg-[var(--bg-main)]/60'
              }`}>
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setOpenQuizSection(openQuizSection === 'category_tags' ? null : 'category_tags')}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors hover:bg-[var(--color-primary-50)]/30 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[var(--color-primary-600)] to-blue-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      1
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-poppins font-bold text-sm text-[var(--text-main)]">
                          🏷️ Challenges, Category & Tags
                        </span>
                        <span className="text-[10px] font-poppins font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-50)] dark:bg-blue-950/60 text-[var(--color-primary-600)] border border-[var(--color-primary-200)] dark:border-blue-800">
                          {quizFormData.quizType === 'code' ? '💻 Coding Challenge' : '🔘 MCQ Assessment'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        Category: <strong className="text-[var(--text-main)]">{quizFormData.category || 'Web Dev'}</strong> • {quizFormData.title ? quizFormData.title : 'Assessment Title & Overview'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] font-poppins font-medium text-[var(--text-muted)]">
                      {openQuizSection === 'category_tags' ? 'Open' : 'Configure'}
                    </span>
                    <span className={`text-xs font-bold transition-transform duration-200 inline-block ${openQuizSection === 'category_tags' ? 'rotate-180 text-[var(--color-primary-600)]' : 'text-[var(--text-muted)]'}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Accordion Body */}
                {openQuizSection === 'category_tags' && (
                  <div className="px-4 sm:px-5 pb-5 pt-3 space-y-4 border-t border-[var(--border-theme)] animate-fadeIn">
                    
                    {/* Category Type Selection (MCQ vs Code) */}
                    <div>
                      <label className="block font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider mb-2">
                        Quiz Category Type *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setQuizFormData({ ...quizFormData, quizType: 'multiple_choice' })}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                            quizFormData.quizType === 'multiple_choice'
                              ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)]/50 dark:bg-blue-950/40 shadow-xs'
                              : 'border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-blue-400'
                          }`}
                        >
                          <span className="text-2xl mt-0.5">🔘</span>
                          <div>
                            <div className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)]">
                              Multiple Choice (MCQ)
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              Standard MCQs, Code Patterns & Bug Fixes with flexible timers.
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() => setQuizFormData({ ...quizFormData, quizType: 'code' })}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                            quizFormData.quizType === 'code'
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                              : 'border-[var(--border-theme)] bg-[var(--bg-main)] hover:border-indigo-400'
                          }`}
                        >
                          <span className="text-2xl mt-0.5">💻</span>
                          <div>
                            <div className="font-poppins font-bold text-xs sm:text-sm text-[var(--text-main)]">
                              Code Challenge (Problem Solving)
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              Real-world coding scenario with interactive IDE & test cases.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Basic Challenge Info */}
                    <div className="space-y-3">
                      <div>
                        <label className="block font-poppins font-bold text-xs mb-1">
                          Quiz / Challenge Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Next.js Architecture Challenge"
                          value={quizFormData.title}
                          onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary-600)]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-poppins font-bold text-xs mb-1">Category *</label>
                          <select
                            value={quizFormData.category}
                            onChange={(e) => setQuizFormData({ ...quizFormData, category: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary-600)] cursor-pointer"
                          >
                            <option value="Web Dev">Web Dev</option>
                            <option value="Frontend">Frontend</option>
                            <option value="Backend">Backend</option>
                            <option value="CS Algo">CS Algo / Data Structures</option>
                            <option value="Data & AI">Data & AI</option>
                            <option value="UI / UX">UI / UX</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Cybersecurity">Cybersecurity</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-poppins font-bold text-xs mb-1">Tech Stack Tags (comma separated)</label>
                          <input
                            type="text"
                            placeholder="JavaScript, React, Algorithms, Node.js"
                            value={quizFormData.techStack}
                            onChange={(e) => setQuizFormData({ ...quizFormData, techStack: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary-600)]"
                          />
                        </div>
                      </div>

                      {/* QUIZ POSTER & LANGUAGE LOGO UPLOAD (REQUIRED AT LEAST 1) */}
                      <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider">
                            🖼️ Quiz Media Assets (Poster or Language Logo Required) <span className="text-rose-500 font-extrabold">*</span>
                          </label>
                          <span className="text-[10px] font-poppins font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            At least 1 required
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ImageUploadDropzone
                            label="Quiz Poster / Banner Image"
                            value={quizFormData.posterUrl}
                            onChange={(url) => setQuizFormData({ ...quizFormData, posterUrl: url })}
                            placeholder="Drag & drop poster file or paste image URL..."
                            helpText="Banner image displayed on Quiz Detail page"
                            aspectRatio="banner"
                          />
                          <ImageUploadDropzone
                            label="Language / Tech Logo"
                            value={quizFormData.languageLogoUrl}
                            onChange={(url) => setQuizFormData({ ...quizFormData, languageLogoUrl: url })}
                            placeholder="Drag & drop logo file or paste logo URL..."
                            helpText="Logo image displayed alongside quiz badges"
                            aspectRatio="square"
                          />
                        </div>
                      </div>

                      {/* QUIZ PRICING & ENTRY FEE (FREE vs PAID RAZORPAY) */}
                      <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-3">
                        <label className="block font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider">
                          💳 Quiz Pricing & Registration Access *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div
                            onClick={() => setQuizFormData({ ...quizFormData, isPaid: false, price: 0 })}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-3 ${
                              !quizFormData.isPaid
                                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs'
                                : 'border-[var(--border-theme)] bg-[var(--bg-card)]'
                            }`}
                          >
                            <span className="text-xl">🟢</span>
                            <div>
                              <div className="font-poppins font-bold text-xs text-emerald-700 dark:text-emerald-300">
                                Free Quiz (₹0)
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                Open to all candidate practice without fee.
                              </div>
                            </div>
                          </div>

                          <div
                            onClick={() => setQuizFormData({ ...quizFormData, isPaid: true, price: quizFormData.price || 99 })}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-3 ${
                              quizFormData.isPaid
                                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 shadow-xs'
                                : 'border-[var(--border-theme)] bg-[var(--bg-card)]'
                            }`}
                          >
                            <span className="text-xl">💳</span>
                            <div>
                              <div className="font-poppins font-bold text-xs text-amber-700 dark:text-amber-300">
                                Paid Quiz (Razorpay)
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                Requires Razorpay payment & user registration to unlock.
                              </div>
                            </div>
                          </div>
                        </div>

                        {quizFormData.isPaid && (
                          <div className="pt-2 animate-fadeIn">
                            <label className="block font-poppins font-bold text-xs mb-1">
                              Entry Fee Amount (INR ₹) *
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 font-bold text-amber-500 text-sm">₹</span>
                              <input
                                type="number"
                                min="1"
                                required={quizFormData.isPaid}
                                placeholder="99"
                                value={quizFormData.price || ''}
                                onChange={(e) => setQuizFormData({ ...quizFormData, price: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-amber-400 bg-[var(--bg-card)] text-sm font-poppins font-bold text-[var(--text-main)] focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-poppins font-bold text-xs mb-1">Quick Overview Summary</label>
                        <textarea
                          rows="2"
                          placeholder="Short description of the challenge and learning outcomes..."
                          value={quizFormData.quickDetails}
                          onChange={(e) => setQuizFormData({ ...quizFormData, quickDetails: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary-600)] resize-none"
                        />
                      </div>
                    </div>

                    {/* Step Advance Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setOpenQuizSection('timings_schedule')}
                        className="px-4 py-2 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        <span>Next: Timings & Schedule</span>
                        <span>→</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* ⏱️ SECTION 2: TIMING MODE & SCHEDULE */}
              {/* ========================================================================= */}
              <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                openQuizSection === 'timings_schedule'
                  ? 'border-amber-500 shadow-md ring-1 ring-amber-500/20 bg-[var(--bg-card)]'
                  : 'border-[var(--border-theme)] hover:border-amber-400 bg-[var(--bg-main)]/60'
              }`}>
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setOpenQuizSection(openQuizSection === 'timings_schedule' ? null : 'timings_schedule')}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors hover:bg-amber-500/10"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      2
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-poppins font-bold text-sm text-[var(--text-main)]">
                          ⏱️ Timing Mode & Exam Schedule
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          {quizFormData.timerType === 'per_question_general'
                            ? `General ${quizFormData.generalQuestionTimerSeconds}s/q`
                            : quizFormData.timerType === 'per_question_custom'
                            ? 'Custom Timer per Question'
                            : 'Total Exam Time'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        Schedule: <strong className="text-[var(--text-main)]">{quizFormData.startDate} {quizFormData.startTime} {quizFormData.startPeriod}</strong> • Duration: <strong className="text-[var(--color-primary-600)]">{dynamicDuration.formattedDuration}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] font-poppins font-medium text-[var(--text-muted)]">
                      {openQuizSection === 'timings_schedule' ? 'Open' : 'Configure'}
                    </span>
                    <span className={`text-xs font-bold transition-transform duration-200 inline-block ${openQuizSection === 'timings_schedule' ? 'rotate-180 text-amber-500' : 'text-[var(--text-muted)]'}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Accordion Body */}
                {openQuizSection === 'timings_schedule' && (
                  <div className="px-4 sm:px-5 pb-5 pt-3 space-y-4 border-t border-[var(--border-theme)] animate-fadeIn">
                    
                    {/* Timing Mode Cards */}
                    <div>
                      <label className="block font-poppins font-bold text-xs text-[var(--text-main)] uppercase tracking-wider mb-2">
                        Question Timing Configuration Mode *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div
                          onClick={() => setQuizFormData({ ...quizFormData, timerType: 'per_question_general' })}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            quizFormData.timerType === 'per_question_general'
                              ? 'border-amber-500 bg-amber-500/10 text-[var(--text-main)] shadow-xs'
                              : 'border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-amber-400'
                          }`}
                        >
                          <div>
                            <div className="text-lg mb-1">⏱️</div>
                            <div className="font-poppins font-bold text-xs text-[var(--text-main)]">
                              General Time Each Question
                            </div>
                            <p className="text-[11px] font-lato text-[var(--text-muted)] mt-1">
                              Uniform countdown for every question (e.g. 15s each).
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={() => setQuizFormData({ ...quizFormData, timerType: 'per_question_custom' })}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            quizFormData.timerType === 'per_question_custom'
                              ? 'border-indigo-500 bg-indigo-500/10 text-[var(--text-main)] shadow-xs'
                              : 'border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-indigo-400'
                          }`}
                        >
                          <div>
                            <div className="text-lg mb-1">🎯</div>
                            <div className="font-poppins font-bold text-xs text-[var(--text-main)]">
                              Custom Time Each Question
                            </div>
                            <p className="text-[11px] font-lato text-[var(--text-muted)] mt-1">
                              Specify individual timer per question (e.g. Q1: 15s, Q2: 45s).
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={() => setQuizFormData({ ...quizFormData, timerType: 'total_quiz' })}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            quizFormData.timerType === 'total_quiz'
                              ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)]/40 text-[var(--text-main)] shadow-xs'
                              : 'border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-blue-400'
                          }`}
                        >
                          <div>
                            <div className="text-lg mb-1">⏳</div>
                            <div className="font-poppins font-bold text-xs text-[var(--text-main)]">
                              Total Time for Quiz
                            </div>
                            <p className="text-[11px] font-lato text-[var(--text-muted)] mt-1">
                              Uses dynamically calculated total duration from start/end times.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* General Timer Input if per_question_general */}
                    {quizFormData.timerType === 'per_question_general' && (
                      <div className="p-3.5 bg-[var(--bg-main)] rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                        <div>
                          <label className="font-poppins font-bold text-xs text-amber-600 dark:text-amber-400 block">
                            ⚡ General Time Per Question:
                          </label>
                          <span className="text-[11px] font-lato text-[var(--text-muted)]">
                            Configure countdown unit in seconds or minutes per question.
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="inline-flex rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] p-0.5">
                            <button
                              type="button"
                              onClick={() => setTimerUnit('sec')}
                              className={`px-2.5 py-1 rounded-md text-xs font-poppins font-bold transition-all cursor-pointer ${
                                timerUnit === 'sec'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              sec / q
                            </button>
                            <button
                              type="button"
                              onClick={() => setTimerUnit('min')}
                              className={`px-2.5 py-1 rounded-md text-xs font-poppins font-bold transition-all cursor-pointer ${
                                timerUnit === 'min'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              min / q
                            </button>
                          </div>

                          {timerUnit === 'sec' ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="5"
                                max="600"
                                step="5"
                                value={quizFormData.generalQuestionTimerSeconds}
                                onChange={(e) =>
                                  setQuizFormData({
                                    ...quizFormData,
                                    generalQuestionTimerSeconds: Math.max(5, Number(e.target.value)),
                                    quickTimerSeconds: Math.max(5, Number(e.target.value))
                                  })
                                }
                                className="w-20 px-2 py-1 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] text-xs font-mono font-bold text-center"
                              />
                              <span className="text-xs font-poppins text-[var(--text-muted)]">sec</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={Number((quizFormData.generalQuestionTimerSeconds / 60).toFixed(1))}
                                onChange={(e) => {
                                  const mins = Number(e.target.value);
                                  const secs = Math.max(5, Math.round(mins * 60));
                                  setQuizFormData({
                                    ...quizFormData,
                                    generalQuestionTimerSeconds: secs,
                                    quickTimerSeconds: secs
                                  });
                                }}
                                className="w-20 px-2 py-1 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] text-xs font-mono font-bold text-center"
                              />
                              <span className="text-xs font-poppins text-[var(--text-muted)]">
                                min ({quizFormData.generalQuestionTimerSeconds}s)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Schedule Timings Builder */}
                    <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-poppins font-bold text-xs uppercase text-[var(--text-main)] block">
                          Schedule Timings & Auto-Calculated Duration:
                        </span>
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-[var(--color-primary-600)] text-white font-bold">
                          Calculated Duration: {dynamicDuration.formattedDuration}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Start Schedule */}
                        <div className="bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border-theme)] space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-poppins font-bold text-[var(--text-main)]">
                              Start Schedule (Default: Current)
                            </label>
                            <span className="text-[10px] text-emerald-500 font-mono font-bold">● Starts</span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-[var(--text-muted)] uppercase">
                                Start Date (DD-Mon-YYYY)
                              </label>
                              <span className="text-[10px] font-mono text-[var(--color-primary-600)] font-semibold">
                                e.g. 14-Aug-2026
                              </span>
                            </div>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                required
                                placeholder="DD-Mon-YYYY (e.g. 14-Aug-2026)"
                                value={quizFormData.startDate}
                                onChange={(e) => setQuizFormData({ ...quizFormData, startDate: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-mono font-bold focus:outline-none focus:border-[var(--color-primary-600)]"
                              />
                              <input
                                type="date"
                                tabIndex={-1}
                                aria-label="Pick start date"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setQuizFormData({
                                      ...quizFormData,
                                      startDate: formatDateToDDMonYYYY(e.target.value)
                                    });
                                  }
                                }}
                                className="absolute right-2.5 w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">
                              Start Time & Period
                            </label>
                            <div className="flex items-center space-x-2">
                              <select
                                value={quizFormData.startTime}
                                onChange={(e) => setQuizFormData({ ...quizFormData, startTime: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-mono font-bold focus:outline-none focus:border-[var(--color-primary-600)] cursor-pointer"
                              >
                                {!STANDARD_TIME_OPTIONS.includes(quizFormData.startTime) && (
                                  <option value={quizFormData.startTime}>{quizFormData.startTime}</option>
                                )}
                                {STANDARD_TIME_OPTIONS.map((tOpt) => (
                                  <option key={tOpt} value={tOpt}>{tOpt}</option>
                                ))}
                              </select>

                              <div className="inline-flex rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] p-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setQuizFormData({ ...quizFormData, startPeriod: 'AM' })}
                                  className={`px-3 py-1.5 rounded-md text-xs font-poppins font-bold transition-all cursor-pointer ${
                                    quizFormData.startPeriod === 'AM'
                                      ? 'bg-[var(--color-primary-600)] text-white shadow-xs'
                                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                  }`}
                                >
                                  AM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuizFormData({ ...quizFormData, startPeriod: 'PM' })}
                                  className={`px-3 py-1.5 rounded-md text-xs font-poppins font-bold transition-all cursor-pointer ${
                                    quizFormData.startPeriod === 'PM'
                                      ? 'bg-[var(--color-primary-600)] text-white shadow-xs'
                                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                  }`}
                                >
                                  PM
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* End Schedule */}
                        <div className="bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border-theme)] space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-poppins font-bold text-[var(--text-main)]">
                              End Schedule (Closes Quiz)
                            </label>
                            <span className="text-[10px] text-rose-500 font-mono font-bold">■ Ends</span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-[var(--text-muted)] uppercase">
                                End Date (DD-Mon-YYYY)
                              </label>
                              <span className="text-[10px] font-mono text-rose-500 font-semibold">
                                e.g. 14-Aug-2026
                              </span>
                            </div>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                required
                                placeholder="DD-Mon-YYYY (e.g. 14-Aug-2026)"
                                value={quizFormData.endDate}
                                onChange={(e) => setQuizFormData({ ...quizFormData, endDate: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-mono font-bold focus:outline-none focus:border-[var(--color-primary-600)]"
                              />
                              <input
                                type="date"
                                tabIndex={-1}
                                aria-label="Pick end date"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setQuizFormData({
                                      ...quizFormData,
                                      endDate: formatDateToDDMonYYYY(e.target.value)
                                    });
                                  }
                                }}
                                className="absolute right-2.5 w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">
                              End Time & Period
                            </label>
                            <div className="flex items-center space-x-2">
                              <select
                                value={quizFormData.endTime}
                                onChange={(e) => setQuizFormData({ ...quizFormData, endTime: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-mono font-bold focus:outline-none focus:border-[var(--color-primary-600)] cursor-pointer"
                              >
                                {!STANDARD_TIME_OPTIONS.includes(quizFormData.endTime) && (
                                  <option value={quizFormData.endTime}>{quizFormData.endTime}</option>
                                )}
                                {STANDARD_TIME_OPTIONS.map((tOpt) => (
                                  <option key={tOpt} value={tOpt}>{tOpt}</option>
                                ))}
                              </select>

                              <div className="inline-flex rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] p-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setQuizFormData({ ...quizFormData, endPeriod: 'AM' })}
                                  className={`px-3 py-1.5 rounded-md text-xs font-poppins font-bold transition-all cursor-pointer ${
                                    quizFormData.endPeriod === 'AM'
                                      ? 'bg-[var(--color-primary-600)] text-white shadow-xs'
                                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                  }`}
                                >
                                  AM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuizFormData({ ...quizFormData, endPeriod: 'PM' })}
                                  className={`px-3 py-1.5 rounded-md text-xs font-poppins font-bold transition-all cursor-pointer ${
                                    quizFormData.endPeriod === 'PM'
                                      ? 'bg-[var(--color-primary-600)] text-white shadow-xs'
                                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                  }`}
                                >
                                  PM
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step Advance Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setOpenQuizSection('rewards_tiers')}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-poppins font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        <span>Next: Competition Rewards & Tiers</span>
                        <span>→</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* 🏆 SECTION 3: REWARDS & RANK TIERS */}
              {/* ========================================================================= */}
              <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                openQuizSection === 'rewards_tiers'
                  ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20 bg-[var(--bg-card)]'
                  : 'border-[var(--border-theme)] hover:border-emerald-400 bg-[var(--bg-main)]/60'
              }`}>
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setOpenQuizSection(openQuizSection === 'rewards_tiers' ? null : 'rewards_tiers')}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors hover:bg-emerald-500/10"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      3
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-poppins font-bold text-sm text-[var(--text-main)]">
                          🏆 Competition Rewards & Rank Tiers
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {(quizFormData.rewards || []).length} Tiers Configured
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        Top Prizes: <strong className="text-emerald-600 dark:text-emerald-400">{quizFormData.rewards?.[0]?.prize || 'Prizes'}</strong> • 1st, 2nd, 3rd & Group Ranks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] font-poppins font-medium text-[var(--text-muted)]">
                      {openQuizSection === 'rewards_tiers' ? 'Open' : 'Configure'}
                    </span>
                    <span className={`text-xs font-bold transition-transform duration-200 inline-block ${openQuizSection === 'rewards_tiers' ? 'rotate-180 text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Accordion Body */}
                {openQuizSection === 'rewards_tiers' && (
                  <div className="px-4 sm:px-5 pb-5 pt-3 space-y-4 border-t border-[var(--border-theme)] animate-fadeIn">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-poppins font-bold text-xs uppercase text-[var(--text-main)] block">
                          Rank Tiers & Group Ranges:
                        </span>
                        <span className="text-xs font-lato text-[var(--text-muted)]">
                          Define prizes for individual top ranks and group tiers.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddRewardTier}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-poppins font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        ➕ Add Rank / Group Tier
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(quizFormData.rewards || []).map((reward, rIdx) => (
                        <div
                          key={rIdx}
                          className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-3.5 rounded-xl space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-poppins font-bold text-xs text-amber-600 dark:text-amber-400">
                              Tier #{rIdx + 1}: {reward.place} ({reward.badge})
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveRewardTier(rIdx)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                            >
                              ✕ Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-0.5">
                                Rank or Group Range
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 1st or 4-10th"
                                value={reward.place}
                                onChange={(e) => {
                                  const updated = [...quizFormData.rewards];
                                  updated[rIdx].place = e.target.value;
                                  setQuizFormData({ ...quizFormData, rewards: updated });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] text-xs font-poppins font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-0.5">
                                Badge Title
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 🥇 Winner or 🏅 Top 10"
                                value={reward.badge}
                                onChange={(e) => {
                                  const updated = [...quizFormData.rewards];
                                  updated[rIdx].badge = e.target.value;
                                  setQuizFormData({ ...quizFormData, rewards: updated });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-0.5">
                                Prize Package
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. $500 Cash + Trophy"
                                value={reward.prize}
                                onChange={(e) => {
                                  const updated = [...quizFormData.rewards];
                                  updated[rIdx].prize = e.target.value;
                                  setQuizFormData({ ...quizFormData, rewards: updated });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] text-xs font-bold text-emerald-600 dark:text-emerald-400"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-0.5">
                              Description / Perks
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Top Rank Certificate + Exclusive Swag Kit"
                              value={reward.description}
                              onChange={(e) => {
                                  const updated = [...quizFormData.rewards];
                                  updated[rIdx].description = e.target.value;
                                  setQuizFormData({ ...quizFormData, rewards: updated });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Step Advance Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setOpenQuizSection('questions_suite')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-poppins font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        <span>Next: Questions & Challenge Suite</span>
                        <span>→</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* 📝 SECTION 4: QUESTIONS & CHALLENGE SUITE */}
              {/* ========================================================================= */}
              <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                openQuizSection === 'questions_suite'
                  ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20 bg-[var(--bg-card)]'
                  : 'border-[var(--border-theme)] hover:border-indigo-400 bg-[var(--bg-main)]/60'
              }`}>
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setOpenQuizSection(openQuizSection === 'questions_suite' ? null : 'questions_suite')}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors hover:bg-indigo-500/10"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      4
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-poppins font-bold text-sm text-[var(--text-main)]">
                          {quizFormData.quizType === 'multiple_choice' ? '📝 Multiple Choice Questions Suite' : '💻 Code Problem Statement & IDE Test Cases'}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          {quizFormData.quizType === 'multiple_choice'
                            ? `${(quizFormData.questions || []).length} Questions`
                            : `${quizFormData.codingChallenge?.language || 'JavaScript'} (${quizFormData.codingChallenge?.difficulty || 'Medium'})`}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {quizFormData.quizType === 'multiple_choice'
                          ? 'Standard MCQs, Code Snippets, Explanations & Excel Import'
                          : 'Starter Code, Markdown Problem Statement & Test Cases Suite'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] font-poppins font-medium text-[var(--text-muted)]">
                      {openQuizSection === 'questions_suite' ? 'Open' : 'Configure'}
                    </span>
                    <span className={`text-xs font-bold transition-transform duration-200 inline-block ${openQuizSection === 'questions_suite' ? 'rotate-180 text-indigo-500' : 'text-[var(--text-muted)]'}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Accordion Body */}
                {openQuizSection === 'questions_suite' && (
                  <div className="px-4 sm:px-5 pb-5 pt-3 space-y-4 border-t border-[var(--border-theme)] animate-fadeIn">
                    
                    {/* Multiple Choice MCQ Mode */}
                    {quizFormData.quizType === 'multiple_choice' && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-poppins font-bold text-sm text-[var(--text-main)]">
                              Questions List ({quizFormData.questions.length})
                            </h4>
                            <span className="text-xs font-lato text-[var(--text-muted)]">
                              Add Standard MCQs or Code Pattern / Bug Fix questions with code snippets.
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={downloadQuizQuestionsTemplate}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 font-poppins font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                              title="Download structured Excel (.xlsx) template for Quiz questions"
                            >
                              <span>📥</span>
                              <span>Excel Template</span>
                            </button>

                            <label
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-sm flex items-center space-x-1"
                              title="Import questions from an Excel (.xlsx/.csv) file into this quiz"
                            >
                              <span>📤</span>
                              <span>Import Excel</span>
                              <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => handleExcelQuizQuestionsUpload(e, 'append')}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleAddQuestion('mcq')}
                              className="px-3 py-1.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-xs font-poppins font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                            >
                              ➕ Add MCQ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddQuestion('pattern')}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-poppins font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                            >
                              🧩 Add Code Pattern / Bug Fix
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {quizFormData.questions.map((q, qIndex) => (
                            <div
                              key={qIndex}
                              className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-4 sm:p-5 rounded-2xl space-y-3.5 relative"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-theme)] pb-2.5">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-poppins font-bold text-[var(--color-primary-600)]">
                                    Question #{qIndex + 1}
                                  </span>
                                  
                                  {/* Question Type Switcher */}
                                  <div className="inline-flex rounded-lg border border-[var(--border-theme)] bg-[var(--bg-card)] p-0.5 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...quizFormData.questions];
                                        updated[qIndex].questionType = 'mcq';
                                        setQuizFormData({ ...quizFormData, questions: updated });
                                      }}
                                      className={`px-2 py-0.5 rounded font-poppins font-semibold cursor-pointer transition-all ${
                                        (q.questionType || 'mcq') === 'mcq'
                                          ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                                          : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                      }`}
                                    >
                                      🔘 Standard MCQ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...quizFormData.questions];
                                        updated[qIndex].questionType = 'pattern';
                                        if (!updated[qIndex].codeSnippet) {
                                          updated[qIndex].codeSnippet = '// Code snippet that needs fixing\nfunction calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i <= items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}';
                                        }
                                        setQuizFormData({ ...quizFormData, questions: updated });
                                      }}
                                      className={`px-2 py-0.5 rounded font-poppins font-semibold cursor-pointer transition-all ${
                                        q.questionType === 'pattern'
                                          ? 'bg-indigo-600 text-white shadow-sm'
                                          : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                      }`}
                                    >
                                      🧩 Code Pattern / Bug Fix
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  {quizFormData.timerType === 'per_question_custom' && (
                                    <div className="flex items-center space-x-1.5 bg-[var(--bg-card)] px-2.5 py-1 rounded-lg border border-indigo-400/40">
                                      <span className="text-[11px] font-poppins font-bold text-indigo-600 dark:text-indigo-400">⏱️ Time:</span>
                                      <input
                                        type="number"
                                        min="5"
                                        max="600"
                                        step="5"
                                        value={q.timerSeconds || 15}
                                        onChange={(e) => {
                                          const updated = [...quizFormData.questions];
                                          updated[qIndex].timerSeconds = Number(e.target.value);
                                          setQuizFormData({ ...quizFormData, questions: updated });
                                        }}
                                        className="w-14 bg-transparent font-mono text-xs text-center border-b border-indigo-400 focus:outline-none"
                                      />
                                      <span className="text-[10px] text-[var(--text-muted)]">sec</span>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQuestion(qIndex)}
                                    className="text-rose-500 hover:text-rose-700 text-xs font-poppins font-semibold cursor-pointer"
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              </div>

                              {/* Question Statement */}
                              <div>
                                <label className="block text-[10px] font-poppins font-bold text-[var(--text-muted)] uppercase mb-1">
                                  {q.questionType === 'pattern' ? 'Problem Prompt / Bug Description *' : 'Question Statement *'}
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder={q.questionType === 'pattern' ? "e.g. Find and fix the off-by-one index error in this function:" : "Enter the question text here..."}
                                  value={q.questionText}
                                  onChange={(e) => {
                                    const updated = [...quizFormData.questions];
                                    updated[qIndex].questionText = e.target.value;
                                    setQuizFormData({ ...quizFormData, questions: updated });
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--color-primary-600)]"
                                />
                              </div>

                              {/* Code Snippet Editor for Pattern */}
                              {q.questionType === 'pattern' && (
                                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-white animate-fadeIn">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-poppins">
                                    <span className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                                      <span>🧩</span>
                                      <span>Code Snippet / Pattern to Fix:</span>
                                    </span>
                                    
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[10px] text-slate-400">Language:</span>
                                      <select
                                        value={q.language || 'javascript'}
                                        onChange={(e) => {
                                          const updated = [...quizFormData.questions];
                                          updated[qIndex].language = e.target.value;
                                          setQuizFormData({ ...quizFormData, questions: updated });
                                        }}
                                        className="bg-slate-900 text-slate-200 border border-slate-700 px-2 py-0.5 rounded text-[11px] focus:outline-none cursor-pointer"
                                      >
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="typescript">TypeScript</option>
                                        <option value="java">Java</option>
                                        <option value="cpp">C++</option>
                                        <option value="csharp">C#</option>
                                        <option value="php">PHP</option>
                                        <option value="go">Go</option>
                                        <option value="html">HTML / CSS</option>
                                        <option value="sql">SQL</option>
                                      </select>
                                    </div>
                                  </div>

                                  <textarea
                                    rows="4"
                                    required
                                    placeholder="// Enter code snippet with the pattern/bug that needs fixing..."
                                    value={q.codeSnippet || ''}
                                    onChange={(e) => {
                                      const updated = [...quizFormData.questions];
                                      updated[qIndex].codeSnippet = e.target.value;
                                      setQuizFormData({ ...quizFormData, questions: updated });
                                    }}
                                    className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-y"
                                  />
                                </div>
                              )}

                              {/* Options with Radio for Correct Answer */}
                              <div>
                                <label className="block text-[10px] font-poppins font-bold text-[var(--text-muted)] uppercase mb-1">
                                  {q.questionType === 'pattern' ? 'Options / Bug Fix Choices (Select radio for correct fix):' : 'Options (Select radio for correct answer):'}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-colors ${
                                        q.correctAnswerIndex === optIndex
                                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                                            : 'border-[var(--border-theme)] bg-[var(--bg-card)]'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`correct-ans-${qIndex}`}
                                        checked={q.correctAnswerIndex === optIndex}
                                        onChange={() => {
                                          const updated = [...quizFormData.questions];
                                          updated[qIndex].correctAnswerIndex = optIndex;
                                          setQuizFormData({ ...quizFormData, questions: updated });
                                        }}
                                        className="cursor-pointer text-emerald-500 shrink-0"
                                      />
                                      <input
                                        type="text"
                                        required
                                        placeholder={q.questionType === 'pattern' ? `Fix Option ${String.fromCharCode(65 + optIndex)}` : `Option ${String.fromCharCode(65 + optIndex)}`}
                                        value={opt}
                                        onChange={(e) => {
                                          const updated = [...quizFormData.questions];
                                          updated[qIndex].options[optIndex] = e.target.value;
                                          setQuizFormData({ ...quizFormData, questions: updated });
                                        }}
                                        className="w-full bg-transparent text-xs focus:outline-none font-lato"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Question Explanation */}
                              <div className="pt-1">
                                <label className="block text-[10px] font-poppins font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center space-x-1">
                                  <span>💡</span>
                                  <span>Answer Explanation (Optional - Shown in Post-Exam Review)</span>
                                </label>
                                <textarea
                                  rows="2"
                                  placeholder="Explain why the correct answer is right..."
                                  value={q.explanation || ''}
                                  onChange={(e) => {
                                    const updated = [...quizFormData.questions];
                                    updated[qIndex].explanation = e.target.value;
                                    setQuizFormData({ ...quizFormData, questions: updated });
                                  }}
                                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--color-primary-600)] resize-none font-lato"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coding Challenge Mode */}
                    {quizFormData.quizType === 'code' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-poppins font-bold text-xs mb-1">Target Language</label>
                            <select
                              value={quizFormData.codingChallenge?.language || 'JavaScript'}
                              onChange={(e) =>
                                setQuizFormData({
                                  ...quizFormData,
                                  codingChallenge: { ...quizFormData.codingChallenge, language: e.target.value }
                                })
                              }
                              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] cursor-pointer"
                            >
                              <option value="JavaScript">JavaScript (Node.js)</option>
                              <option value="Python">Python 3</option>
                              <option value="TypeScript">TypeScript</option>
                              <option value="Java">Java</option>
                              <option value="C++">C++</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-poppins font-bold text-xs mb-1">Difficulty Level</label>
                            <select
                              value={quizFormData.codingChallenge?.difficulty || 'Medium'}
                              onChange={(e) =>
                                setQuizFormData({
                                  ...quizFormData,
                                  codingChallenge: { ...quizFormData.codingChallenge, difficulty: e.target.value }
                                })
                              }
                              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] cursor-pointer"
                            >
                              <option value="Easy">Easy (Fundamentals)</option>
                              <option value="Medium">Medium (Real-World Architecture)</option>
                              <option value="Hard">Hard (High-Performance Engine)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-poppins font-bold text-xs mb-1">Problem Statement (Markdown) *</label>
                          <textarea
                            rows="4"
                            required
                            placeholder="Describe the real-world scenario, requirements, and constraints..."
                            value={quizFormData.codingChallenge?.problemStatement || ''}
                            onChange={(e) =>
                              setQuizFormData({
                                ...quizFormData,
                                codingChallenge: { ...quizFormData.codingChallenge, problemStatement: e.target.value }
                              })
                            }
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-mono text-xs focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-poppins font-bold text-xs mb-1">Starter Code Template *</label>
                          <textarea
                            rows="5"
                            required
                            placeholder="// Write starter function signature here..."
                            value={quizFormData.codingChallenge?.starterCode || ''}
                            onChange={(e) =>
                              setQuizFormData({
                                ...quizFormData,
                                codingChallenge: { ...quizFormData.codingChallenge, starterCode: e.target.value }
                              })
                            }
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none"
                          />
                        </div>

                        {/* Test Cases Builder */}
                        <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-4 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="font-poppins font-bold text-xs text-[var(--text-main)] uppercase">
                              Test Cases Suite ({quizFormData.codingChallenge?.testCases?.length || 0})
                            </label>

                            <button
                              type="button"
                              onClick={handleAddTestCase}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-poppins font-bold cursor-pointer"
                            >
                              ➕ Add Test Case
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(quizFormData.codingChallenge?.testCases || []).map((tc, tcIdx) => (
                              <div
                                key={tcIdx}
                                className="bg-[var(--bg-card)] border border-[var(--border-theme)] p-3 rounded-xl space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-indigo-500 font-poppins">Test Case #{tcIdx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTestCase(tcIdx)}
                                    className="text-rose-500 hover:text-rose-700 font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-[10px] text-[var(--text-muted)]">Input:</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. transactions = [2, 7, 11], target = 9"
                                      value={tc.input}
                                      onChange={(e) => {
                                        const updated = [...quizFormData.codingChallenge.testCases];
                                        updated[tcIdx].input = e.target.value;
                                        setQuizFormData({
                                          ...quizFormData,
                                          codingChallenge: { ...quizFormData.codingChallenge, testCases: updated }
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] font-mono text-[11px]"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-[10px] text-[var(--text-muted)]">Expected Output:</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. [0, 1]"
                                      value={tc.expectedOutput}
                                      onChange={(e) => {
                                        const updated = [...quizFormData.codingChallenge.testCases];
                                        updated[tcIdx].expectedOutput = e.target.value;
                                        setQuizFormData({
                                          ...quizFormData,
                                          codingChallenge: { ...quizFormData.codingChallenge, testCases: updated }
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-theme)] bg-[var(--bg-main)] font-mono text-[11px]"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON BAR */}
              <div className="pt-4 flex items-center justify-between border-t border-[var(--border-theme)]">
                <div className="flex items-center space-x-1.5 text-xs text-[var(--text-muted)]">
                  <span>💡</span>
                  <span className="hidden sm:inline">Tap any section header to review details before saving.</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsQuizModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)] font-poppins font-semibold text-xs cursor-pointer hover:bg-[var(--bg-main)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    {editingQuizId ? 'Save Changes' : 'Publish Quiz Challenge'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIOUS WORK CREATOR / EDITOR MODAL */}
      {isWorkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-3xl bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar relative">
            <button
              onClick={() => setIsWorkModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <span className="text-2xl">💼</span>
              <div>
                <h3 className="text-xl font-bold font-poppins">
                  {editingWorkId ? 'Edit Previous Work' : 'Create New Previous Work Showcase'}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSaveWorkSubmit} className="space-y-4 font-lato text-xs sm:text-sm">
              <div>
                <label className="block font-poppins font-bold text-xs mb-1">Work / Quiz Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js Fullstack Master Challenge 2025"
                  value={workFormData.title}
                  onChange={(e) => setWorkFormData({ ...workFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs mb-1">Description *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Description..."
                  value={workFormData.description}
                  onChange={(e) => setWorkFormData({ ...workFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-poppins font-bold text-xs mb-1">Category</label>
                  <select
                    value={workFormData.category}
                    onChange={(e) => setWorkFormData({ ...workFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] cursor-pointer"
                  >
                    <option value="Web Dev">Web Dev</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="UI / UX">UI / UX</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                </div>

                <div>
                  <label className="block font-poppins font-bold text-xs mb-1">Status Badge</label>
                  <input
                    type="text"
                    value={workFormData.badge}
                    onChange={(e) => setWorkFormData({ ...workFormData, badge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block font-poppins font-bold text-xs mb-1">Top Winner</label>
                  <input
                    type="text"
                    value={workFormData.topWinner}
                    onChange={(e) => setWorkFormData({ ...workFormData, topWinner: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsWorkModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)] font-poppins font-semibold text-xs cursor-pointer hover:bg-[var(--bg-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-poppins font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingWorkId ? 'Save Changes' : 'Publish Previous Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚖️ LEGAL PARTNER CREATOR & EDITOR MODAL */}
      {/* ========================================================================= */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] relative">
            <button
              onClick={() => setIsPartnerModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl">⚖️</span>
              <div>
                <h3 className="text-xl font-bold font-poppins text-[var(--text-main)]">
                  {editingPartnerId ? 'Edit Legal Partner / Sponsor' : 'Add New Legal Partner / Sponsor'}
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  Configure partner details, accreditation type, and website links
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePartnerSubmit} className="space-y-4 text-xs font-poppins">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-main)] block">Partner / Sponsor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LexisGlobal Legal Verification Council"
                  value={partnerFormData.name}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Partnership Type</label>
                  <select
                    value={partnerFormData.type}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] cursor-pointer"
                  >
                    <option value="Official Legal & Verification Partner">Official Legal & Verification Partner</option>
                    <option value="Academic Institution">Academic Institution</option>
                    <option value="Corporate Sponsor">Corporate Sponsor</option>
                    <option value="Certification Authority">Certification Authority</option>
                    <option value="Technology Partner">Technology Partner</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <ImageUploadDropzone
                    label="Partner Logo / Badge Image"
                    value={partnerFormData.logoUrl}
                    onChange={(url) => setPartnerFormData({ ...partnerFormData, logoUrl: url })}
                    placeholder="Drag & drop partner logo or paste URL / emoji..."
                    helpText="Upload logo file to Cloudinary or paste direct URL"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-main)] block">Official Website URL</label>
                <input
                  type="url"
                  placeholder="https://partner-website.org"
                  value={partnerFormData.websiteUrl}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, websiteUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-main)] block">Description & Scope</label>
                <textarea
                  rows="3"
                  placeholder="Describe the partner's role, verification authority, or sponsorship grants..."
                  value={partnerFormData.description}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Display Status</label>
                  <select
                    value={partnerFormData.status}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] cursor-pointer"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Order / Priority</label>
                  <input
                    type="number"
                    value={partnerFormData.order}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, order: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)] font-poppins font-semibold text-xs cursor-pointer hover:bg-[var(--bg-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {editingPartnerId ? 'Save Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📬 FULL INQUIRY & CONTACT MESSAGE VIEWER MODAL */}
      {/* ========================================================================= */}
      {selectedMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar relative space-y-6">
            <button
              onClick={() => setSelectedMessageModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-start space-x-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary-600)] to-indigo-600 text-white font-poppins font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                {selectedMessageModal.name ? selectedMessageModal.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold font-poppins">
                    {selectedMessageModal.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-main)] border border-[var(--border-theme)] text-[var(--text-muted)] font-semibold">
                    {selectedMessageModal.category || 'Support'}
                  </span>
                </div>
                <a
                  href={`mailto:${selectedMessageModal.email}`}
                  className="text-xs font-mono text-[var(--color-primary-600)] hover:underline"
                >
                  {selectedMessageModal.email}
                </a>
              </div>
            </div>

            {/* Priority and Time Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)]">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-poppins font-bold text-[var(--text-muted)]">Priority:</span>
                <select
                  value={selectedMessageModal.priority || 'medium'}
                  onChange={(e) => handleUpdateMessagePriority(selectedMessageModal._id || selectedMessageModal.id, e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-theme)] text-xs font-poppins font-bold text-[var(--text-main)] cursor-pointer"
                >
                  <option value="urgent">🚨 Urgent</option>
                  <option value="high">🔥 High</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="low">🌱 Low</option>
                </select>
              </div>

              <div className="text-xs font-mono text-[var(--text-muted)]">
                Received: {new Date(selectedMessageModal.createdAt).toLocaleString('en-GB')}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-xs font-poppins font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Subject
              </label>
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] font-poppins font-bold text-sm text-[var(--text-main)]">
                {selectedMessageModal.subject}
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-xs font-poppins font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Full Inquiry Message
              </label>
              <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-theme)] font-lato text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {selectedMessageModal.message}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-theme)]">
              <div className="flex items-center space-x-2">
                <a
                  href={`mailto:${selectedMessageModal.email}?subject=Re: ${encodeURIComponent(selectedMessageModal.subject)}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <span>✉️ Reply via Email</span>
                </a>

                <button
                  onClick={() => handleToggleMessageRead(selectedMessageModal._id || selectedMessageModal.id, selectedMessageModal.isRead)}
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-theme)] hover:border-[var(--color-primary-400)] text-xs font-poppins font-bold transition-all cursor-pointer"
                >
                  {selectedMessageModal.isRead ? 'Mark as Unread' : '✓ Mark Read'}
                </button>
              </div>

              <button
                onClick={() => handleDeleteMessage(selectedMessageModal._id || selectedMessageModal.id, selectedMessageModal.name)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-poppins font-bold transition-all cursor-pointer flex items-center space-x-1 border border-rose-500/20"
              >
                <span>🗑️ Delete Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⭐ ADMIN REVIEW CREATOR & EDITOR MODAL */}
      {/* ========================================================================= */}
      {isReviewAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] relative">
            <button
              onClick={() => setIsReviewAdminModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl">⭐</span>
              <div>
                <h3 className="text-xl font-bold font-poppins text-[var(--text-main)]">
                  {editingReviewId ? 'Edit Student Review' : 'Add Custom Testimonial'}
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  Manage reviewer details, ratings, moderation status, and homepage feature toggle.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveReviewSubmitAdmin} className="space-y-4 text-xs font-poppins">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Reviewer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Srivastav"
                    value={reviewAdminFormData.userName}
                    onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, userName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Role / School / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. BCA Student / Web Dev"
                    value={reviewAdminFormData.role}
                    onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="reviewer@example.com"
                    value={reviewAdminFormData.userEmail}
                    onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, userEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Quiz Title Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. React 19 Mastery Exam"
                    value={reviewAdminFormData.quizTitle}
                    onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, quizTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Rating (1 to 5 Stars)</label>
                  <select
                    value={reviewAdminFormData.rating}
                    onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, rating: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-bold cursor-pointer"
                  >
                    <option value={5}>5 Stars (★★★★★)</option>
                    <option value={4}>4 Stars (★★★★☆)</option>
                    <option value={3}>3 Stars (★★★☆☆)</option>
                    <option value={2}>2 Stars (★★☆☆☆)</option>
                    <option value={1}>1 Star (★☆☆☆☆)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-main)] block">Moderation Status</label>
                  <select
                    value={reviewAdminFormData.status}
                    onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] font-bold cursor-pointer"
                  >
                    <option value="approved">Approved (Public)</option>
                    <option value="pending">Pending Review</option>
                    <option value="rejected">Rejected (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-main)] block">Review Text / Quote *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed feedback comment..."
                  value={reviewAdminFormData.quote}
                  onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, quote: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="adminReviewFeatured"
                  checked={reviewAdminFormData.isFeatured}
                  onChange={(e) => setReviewAdminFormData({ ...reviewAdminFormData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <label htmlFor="adminReviewFeatured" className="font-bold text-[var(--text-main)] cursor-pointer">
                  ⭐ Feature this review prominently on Homepage Carousel
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsReviewAdminModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)] font-poppins font-semibold text-xs cursor-pointer hover:bg-[var(--bg-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-poppins font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingReviewId ? 'Save Changes' : 'Publish Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏆 GLOBAL REWARD TIER CREATOR & EDITOR MODAL */}
      {/* ========================================================================= */}
      {isRewardTierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] relative">
            <button
              onClick={() => setIsRewardTierModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="text-xl font-bold font-poppins text-[var(--text-main)]">
                  {editingRewardTierId ? 'Edit Reward Tier' : 'Add New Reward Tier'}
                </h3>
                <p className="text-xs font-lato text-[var(--text-muted)]">
                  Configure leaderboard rank criteria, title badge emoji, and prizes.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRewardTierSubmit} className="space-y-4 font-lato text-xs sm:text-sm">
              <div>
                <label className="block font-poppins font-bold text-xs mb-1 text-[var(--text-main)]">Rank / Place *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st, 2nd, 3rd, 4-10th, Top 50"
                  value={rewardTierFormData.place}
                  onChange={(e) => setRewardTierFormData({ ...rewardTierFormData, place: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs mb-1 text-[var(--text-main)]">Badge Title & Emoji *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🥇 Gold Champion"
                  value={rewardTierFormData.badge}
                  onChange={(e) => setRewardTierFormData({ ...rewardTierFormData, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs mb-1 text-[var(--text-main)]">Prize Details *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $500 Cash + Gold Trophy"
                  value={rewardTierFormData.prize}
                  onChange={(e) => setRewardTierFormData({ ...rewardTierFormData, prize: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-poppins font-bold text-xs mb-1 text-[var(--text-main)]">Description / Benefit</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Top Rank Award + Exclusive Swag Kit & Pro Access"
                  value={rewardTierFormData.description}
                  onChange={(e) => setRewardTierFormData({ ...rewardTierFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-main)] focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRewardTierModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)] font-poppins font-semibold text-xs cursor-pointer hover:bg-[var(--bg-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {editingRewardTierId ? 'Save Changes' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
