const Review = require('../models/Review');

const initialMockReviews = [
  {
    userName: 'Rahul Srivastav',
    userEmail: 'rahul.srivastav@dev.io',
    role: 'Web Developer',
    rating: 5,
    quote: 'This quiz platform transformed how our engineering team prepares for certifications. Instant feedback and real-time leaderboards are unmatched!',
    bgColor: 'bg-emerald-500 dark:bg-emerald-700 text-white',
    avatarBg: 'bg-white text-emerald-700',
    status: 'approved',
    isFeatured: true
  },
  {
    userName: 'Harsh Pandey',
    userEmail: 'harsh.p@bca.edu',
    role: 'BCA Student',
    rating: 5,
    quote: 'Creating live quizzes and seeing real-time student engagement has made learning interactive, fast, and exciting for our computer science class.',
    bgColor: 'bg-[var(--color-secondary-600)] text-white',
    avatarBg: 'bg-white text-[var(--color-secondary-700)]',
    status: 'approved',
    isFeatured: true
  },
  {
    userName: 'Aman Yadav',
    userEmail: 'aman.yadav@btech.org',
    role: 'B.Tech CS',
    rating: 5,
    quote: 'The UI is super clean, responsive on phone and tablet, and dark mode is sleek. Competing with peers daily keeps my skills sharp!',
    bgColor: 'bg-teal-600 dark:bg-teal-800 text-white',
    avatarBg: 'bg-white text-teal-800',
    status: 'approved',
    isFeatured: true
  }
];

// Helper to seed default reviews if database collection is empty
const seedInitialReviewsIfEmpty = async () => {
  try {
    const count = await Review.countDocuments();
    if (count === 0) {
      await Review.insertMany(initialMockReviews);
    }
  } catch (err) {
    console.warn('[Review Seed Warning]:', err.message);
  }
};

// @route   GET /api/reviews
// @desc    Get all public approved reviews
// @access  Public
const getPublicReviews = async (req, res) => {
  try {
    await seedInitialReviewsIfEmpty();
    const rawReviews = await Review.find({ status: 'approved' })
      .populate('userId', 'avatarUrl avatar profileImage picture name')
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    const reviews = rawReviews.map((r) => {
      const nameForSeed = r.userName || (r.userId ? r.userId.name : 'Candidate');
      const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameForSeed)}`;
      const userPhoto = r.avatarUrl || (r.userId ? (r.userId.avatarUrl || r.userId.avatar || r.userId.profileImage || r.userId.picture) : '');
      return {
        ...r,
        avatarUrl: userPhoto || fallbackUrl
      };
    });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @route   POST /api/reviews
// @desc    Submit a review (Post-Quiz or Universal)
// @access  Public (Optional User Auth attached if available)
const submitReview = async (req, res) => {
  try {
    const { userName, userEmail, role, rating, quote, quizId, quizTitle, avatarUrl } = req.body;

    if (!quote || !quote.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Review text (quote) is required.'
      });
    }

    const numericRating = Number(rating) || 5;
    const finalRating = Math.min(5, Math.max(1, numericRating));

    // Determine color theme palette dynamically
    const bgStyles = [
      { bgColor: 'bg-[var(--color-secondary-600)] text-white', avatarBg: 'bg-white text-[var(--color-secondary-700)]' },
      { bgColor: 'bg-emerald-500 dark:bg-emerald-700 text-white', avatarBg: 'bg-white text-emerald-700' },
      { bgColor: 'bg-teal-600 dark:bg-teal-800 text-white', avatarBg: 'bg-white text-teal-800' },
      { bgColor: 'bg-indigo-600 dark:bg-indigo-800 text-white', avatarBg: 'bg-white text-indigo-800' },
      { bgColor: 'bg-purple-600 dark:bg-purple-800 text-white', avatarBg: 'bg-white text-purple-800' }
    ];
    const randomStyle = bgStyles[Math.floor(Math.random() * bgStyles.length)];

    const nameForSeed = userName || (req.user ? req.user.name : 'Candidate');
    const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameForSeed)}`;
    const userAvatar = avatarUrl || (req.user ? (req.user.avatarUrl || req.user.avatar || req.user.profileImage || req.user.picture) : '') || fallbackAvatar;

    const newReview = await Review.create({
      userId: req.user ? req.user._id : null,
      userName: userName || (req.user ? req.user.name : 'Anonymous Student'),
      userEmail: userEmail || (req.user ? req.user.email : ''),
      role: role || (req.user ? (req.user.studentClass || req.user.school || 'Student Candidate') : 'Student Candidate'),
      rating: finalRating,
      quote: quote.trim(),
      quizId: quizId || null,
      quizTitle: quizTitle || '',
      avatarUrl: userAvatar,
      bgColor: randomStyle.bgColor,
      avatarBg: randomStyle.avatarBg,
      status: 'approved', // Auto-approved by default per user choice
      isFeatured: true
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted successfully.',
      review: newReview
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review.',
      error: error.message
    });
  }
};

// =========================================================================
// 🛡️ ADMIN CONTROL & MODERATION CONTROLLERS
// =========================================================================

// @route   GET /api/admin/reviews
// @desc    Get all reviews with filters for Admin Dashboard
// @access  Private (Admin)
const getAdminReviews = async (req, res) => {
  try {
    await seedInitialReviewsIfEmpty();
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { userName: searchRegex },
        { userEmail: searchRegex },
        { quote: searchRegex },
        { role: searchRegex },
        { quizTitle: searchRegex }
      ];
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const totalCount = await Review.countDocuments();
    const approvedCount = await Review.countDocuments({ status: 'approved' });
    const pendingCount = await Review.countDocuments({ status: 'pending' });
    const rejectedCount = await Review.countDocuments({ status: 'rejected' });
    const featuredCount = await Review.countDocuments({ isFeatured: true });

    // Calculate Average Rating
    const ratingAggregation = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = ratingAggregation.length > 0 ? parseFloat(ratingAggregation[0].avgRating.toFixed(1)) : 5.0;

    return res.status(200).json({
      success: true,
      count: reviews.length,
      stats: {
        total: totalCount,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        featured: featuredCount,
        avgRating
      },
      reviews
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin reviews',
      error: error.message
    });
  }
};

// @route   POST /api/admin/reviews
// @desc    Admin manually creates a review/testimonial
// @access  Private (Admin)
const createAdminReview = async (req, res) => {
  try {
    const { userName, userEmail, role, rating, quote, status, isFeatured, quizTitle, avatarUrl } = req.body;

    if (!userName || !quote) {
      return res.status(400).json({
        success: false,
        message: 'Name and review quote are required.'
      });
    }

    const review = await Review.create({
      userId: req.user ? req.user._id : null,
      userName: userName.trim(),
      userEmail: (userEmail || '').trim(),
      role: (role || 'Verified Student').trim(),
      rating: Number(rating) || 5,
      quote: quote.trim(),
      quizTitle: (quizTitle || '').trim(),
      avatarUrl: (avatarUrl || req.body.avatar || '').trim(),
      status: status || 'approved',
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : true
    });

    return res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      review
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create admin review',
      error: error.message
    });
  }
};

// @route   PUT /api/admin/reviews/:id
// @desc    Update review status, content, or featured flag
// @access  Private (Admin)
const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isFeatured, quote, rating, role, userName } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (status) review.status = status;
    if (isFeatured !== undefined) review.isFeatured = Boolean(isFeatured);
    if (quote !== undefined) review.quote = quote.trim();
    if (rating !== undefined) review.rating = Number(rating);
    if (role !== undefined) review.role = role.trim();
    if (userName !== undefined) review.userName = userName.trim();

    await review.save();

    return res.status(200).json({
      success: true,
      message: `Review updated successfully.`,
      review
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete a review
// @access  Private (Admin)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

module.exports = {
  seedInitialReviewsIfEmpty,
  getPublicReviews,
  submitReview,
  getAdminReviews,
  createAdminReview,
  updateReviewStatus,
  deleteReview
};
