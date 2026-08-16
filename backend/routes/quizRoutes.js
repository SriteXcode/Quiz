const express = require('express');
const router = express.Router();
const {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizLeaderboard,
  getQuizReview,
  getCertificateById,
  getUserCertificates,
  getUserProfileStats
} = require('../controllers/quizController');
const { optionalVerifyToken } = require('../middleware/authMiddleware');

// Attach authenticated user details when token is provided
router.use(optionalVerifyToken);

// @route   GET /api/quizzes
// @desc    Get all quizzes (Multiple choice & Code challenges)
router.get('/', getQuizzes);

// @route   GET /api/quizzes/user/profile-stats
// @desc    Get comprehensive dynamic user stats, rank, and accuracy
router.get('/user/profile-stats', getUserProfileStats);

// @route   GET /api/quizzes/user/certificates
// @desc    Get all certificates earned by the authenticated user
router.get('/user/certificates', getUserCertificates);

// @route   GET /api/quizzes/certificate/:certificateId
// @desc    Get certificate verification details by Certificate ID
router.get('/certificate/:certificateId', getCertificateById);

// @route   GET /api/quizzes/:id
// @desc    Get single quiz details by ID
router.get('/:id', getQuizById);

// @route   POST /api/quizzes/:id/submit
// @desc    Submit answers (Single leaderboard entry for 1st attempt, replays recorded as practice)
router.post('/:id/submit', submitQuiz);

// @route   GET /api/quizzes/:id/leaderboard
// @desc    Get official ranked leaderboard (1st attempt single entry per user)
router.get('/:id/leaderboard', getQuizLeaderboard);

// @route   GET /api/quizzes/:id/review
// @desc    Get quiz review questions & explanations for post-exam review and practice
router.get('/:id/review', getQuizReview);

module.exports = router;

