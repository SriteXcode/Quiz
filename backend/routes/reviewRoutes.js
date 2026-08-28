const express = require('express');
const router = express.Router();
const {
  getPublicReviews,
  submitReview
} = require('../controllers/reviewController');
const { optionalVerifyToken } = require('../middleware/authMiddleware');

// @route   GET /api/reviews
// @desc    Get public approved reviews
router.get('/', getPublicReviews);

// @route   POST /api/reviews
// @desc    Submit a review (attaches optional logged-in user if token supplied)
router.post('/', optionalVerifyToken, submitReview);

module.exports = router;
