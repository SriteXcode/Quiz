const express = require('express');
const router = express.Router();
const {
  getAdminOverviewStats,
  getAllUsersAdmin,
  updateUserRole,
  deleteUserAdmin,
  getAllQuizzesAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  uploadAdminImage
} = require('../controllers/adminController');
const { uploadGeneralImage } = require('../config/cloudinary');
const {
  getAllPreviousWorks,
  createPreviousWork,
  updatePreviousWork,
  deletePreviousWork
} = require('../controllers/previousWorkController');
const {
  updateSiteSettings,
  getAdminPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getAdminMessages,
  toggleMessageRead,
  updateMessagePriority,
  deleteContactMessage
} = require('../controllers/siteContentController');
const {
  getAdminReviews,
  createAdminReview,
  updateReviewStatus,
  deleteReview
} = require('../controllers/reviewController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// All routes here are protected and require valid Admin JWT Token
router.use(verifyToken);
router.use(requireAdmin);

// @route   GET /api/admin/stats
router.get('/stats', getAdminOverviewStats);

// @route   GET /api/admin/users
// @route   PUT /api/admin/users/:id/role
// @route   DELETE /api/admin/users/:id
router.get('/users', getAllUsersAdmin);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUserAdmin);

// @route   POST /api/admin/upload-image
// @desc    Upload image asset (quiz poster, language logo, partner logo)
router.post('/upload-image', uploadGeneralImage.single('image'), uploadAdminImage);

// @route   GET /api/admin/quizzes
// @route   POST /api/admin/quizzes
// @route   PUT /api/admin/quizzes/:id
// @route   DELETE /api/admin/quizzes/:id
router.get('/quizzes', getAllQuizzesAdmin);
router.post('/quizzes', createQuiz);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);

// @route   GET /api/admin/previous-works
// @route   POST /api/admin/previous-works
// @route   PUT /api/admin/previous-works/:id
// @route   DELETE /api/admin/previous-works/:id
router.get('/previous-works', getAllPreviousWorks);
router.post('/previous-works', createPreviousWork);
router.put('/previous-works/:id', updatePreviousWork);
router.delete('/previous-works/:id', deletePreviousWork);

// @route   PUT /api/admin/settings (About Us & Contact Info)
router.put('/settings', updateSiteSettings);

// @route   GET /api/admin/partners
// @route   POST /api/admin/partners
// @route   PUT /api/admin/partners/:id
// @route   DELETE /api/admin/partners/:id
router.get('/partners', getAdminPartners);
router.post('/partners', createPartner);
router.put('/partners/:id', updatePartner);
router.delete('/partners/:id', deletePartner);

// =========================================================================
// 📬 ADMIN CONTACT MESSAGES & INQUIRIES
// =========================================================================
// @route   GET /api/admin/messages
// @route   PUT /api/admin/messages/:id/read
// @route   PUT /api/admin/messages/:id/priority
// @route   DELETE /api/admin/messages/:id
router.get('/messages', getAdminMessages);
router.put('/messages/:id/read', toggleMessageRead);
router.put('/messages/:id/priority', updateMessagePriority);
router.delete('/messages/:id', deleteContactMessage);

// =========================================================================
// ⭐ ADMIN REVIEW & TESTIMONIAL MODERATION
// =========================================================================
// @route   GET /api/admin/reviews
// @route   POST /api/admin/reviews
// @route   PUT /api/admin/reviews/:id
// @route   DELETE /api/admin/reviews/:id
router.get('/reviews', getAdminReviews);
router.post('/reviews', createAdminReview);
router.put('/reviews/:id', updateReviewStatus);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
