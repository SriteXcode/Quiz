const User = require('../models/User');
const Quiz = require('../models/Quiz');
const PreviousWork = require('../models/PreviousWork');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');

// Auto seed default data if collections are empty
const seedAdminDataIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount < 2) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const studentPassword = await bcrypt.hash('student123', 10);

      const defaultUsers = [
        {
          name: 'Super Admin',
          email: 'admin@quizplatform.com',
          password: hashedPassword,
          role: 'admin',
          school: 'Platform Governance Hub',
          studentClass: 'Administrator',
          phone: '+91 9876543210'
        },
        {
          name: 'Sarah Jenkins',
          email: 'sarah.j@mit.edu',
          password: studentPassword,
          role: 'student',
          school: 'MIT Computer Science',
          studentClass: 'Year 4 - AI & Algo',
          phone: '+1 617-253-1000'
        },
        {
          name: 'Alex Rivers',
          email: 'alex.rivers@gmail.com',
          password: studentPassword,
          role: 'student',
          school: 'Stanford Engineering',
          studentClass: 'Senior Frontend Lab',
          phone: '+1 650-723-2300'
        },
        {
          name: 'Priya Sharma',
          email: 'priya.sharma@edutech.org',
          password: studentPassword,
          role: 'student',
          school: 'IIT Delhi',
          studentClass: 'B.Tech CS - Sem 6',
          phone: '+91 9811223344'
        },
        {
          name: 'Devon Vance',
          email: 'devon.vance@techcorp.io',
          password: studentPassword,
          role: 'student',
          school: 'UC Berkeley',
          studentClass: 'Data Structures Group',
          phone: '+1 510-642-6000'
        },
        {
          name: 'Marcus Brody',
          email: 'm.brody@cloudsolutions.net',
          password: studentPassword,
          role: 'student',
          school: 'Georgia Tech',
          studentClass: 'Cloud Architecture Cohort',
          phone: '+1 404-894-2000'
        }
      ];

      for (const u of defaultUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          await User.create(u);
        }
      }
    }
  } catch (err) {
    console.warn('[Admin Auto Seed Warning]:', err.message);
  }
};

// @route   GET /api/admin/stats
// @desc    Get platform overview stats for Admin Dashboard
// @access  Private (Admin Only)
const getAdminOverviewStats = async (req, res) => {
  try {
    await seedAdminDataIfEmpty();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalQuizzes = await Quiz.countDocuments();
    
    // Live has only currently running quizzes
    const liveNowQuizzes = await Quiz.countDocuments({ status: 'running' });
    const upcomingQuizzes = await Quiz.countDocuments({ status: 'upcoming' });
    // Active has count of Live (running) AND Upcoming quizzes
    const activeQuizzes = liveNowQuizzes + upcomingQuizzes;
    const pastQuizzes = await Quiz.countDocuments({ status: 'past' });
    const totalPreviousWorks = await PreviousWork.countDocuments();
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const approvedReviews = await Review.countDocuments({ status: 'approved' });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalQuizzes,
        activeQuizzes,
        activeLiveQuizzes: liveNowQuizzes,
        liveNowQuizzes,
        upcomingQuizzes,
        pastQuizzes,
        totalPreviousWorks: totalPreviousWorks || 4,
        totalReviews,
        pendingReviews,
        approvedReviews,
        totalRewardsDistributed: 125,
        totalXPPointsAwarded: '48,500'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users list with search & role filters
// @access  Private (Admin Only)
const getAllUsersAdmin = async (req, res) => {
  try {
    await seedAdminDataIfEmpty();
    const { search, role } = req.query;

    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { school: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users list',
      error: error.message
    });
  }
};

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (student <-> admin)
// @access  Private (Admin Only)
const updateUserRole = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    // Security Policy: Prevent self-demotion
    if (currentUserId && currentUserId.toString() === targetUserId.toString() && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Security Policy: You cannot demote your own admin account.'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete user account
// @access  Private (Admin Only)
const deleteUserAdmin = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Security Policy 1: Prevent self-deletion
    if (currentUserId && currentUserId.toString() === targetUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Security Policy: You cannot delete your own admin account.'
      });
    }

    // Security Policy 2: Prevent deleting any Admin user
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Security Policy: Admin accounts cannot be deleted.'
      });
    }

    await User.findByIdAndDelete(targetUserId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// @route   GET /api/admin/quizzes
// @desc    Get all quizzes list for admin management
// @access  Private (Admin Only)
const getAllQuizzesAdmin = async (req, res) => {
  try {
    await seedAdminDataIfEmpty();
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin quizzes',
      error: error.message
    });
  }
};

// @route   POST /api/admin/quizzes
// @desc    Create new quiz
// @access  Private (Admin Only)
const createQuiz = async (req, res) => {
  try {
    const quizData = {
      ...req.body,
      createdBy: req.user ? (req.user._id || req.user.id) : undefined
    };

    // Clean frontend-only fields
    delete quizData.startPeriod;
    delete quizData.endPeriod;
    delete quizData.id;
    delete quizData._id;

    // Filter type specifics
    if (quizData.quizType === 'code') {
      delete quizData.questions;
    } else {
      delete quizData.codingChallenge;
    }

    const quiz = await Quiz.create(quizData);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully!',
      quiz
    });
  } catch (error) {
    console.error('[Create Quiz Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create quiz',
      error: error.message
    });
  }
};

// @route   PUT /api/admin/quizzes/:id
// @desc    Update existing quiz
// @access  Private (Admin Only)
const updateQuiz = async (req, res) => {
  try {
    const quizData = { ...req.body };
    delete quizData.startPeriod;
    delete quizData.endPeriod;

    let quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, quizData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully!',
      quiz
    });
  } catch (error) {
    console.error('[Update Quiz Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update quiz',
      error: error.message
    });
  }
};

// @route   DELETE /api/admin/quizzes/:id
// @desc    Delete quiz by ID
// @access  Private (Admin Only)
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Quiz challenge deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
      error: error.message
    });
  }
};

module.exports = {
  getAdminOverviewStats,
  getAllUsersAdmin,
  updateUserRole,
  deleteUserAdmin,
  getAllQuizzesAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz
};
