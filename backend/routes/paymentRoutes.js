const express = require('express');
const router = express.Router();
const {
  getRazorpayKey,
  enrollInQuiz,
  createOrder,
  verifyPayment,
  checkQuizAccess
} = require('../controllers/paymentController');
const { verifyToken, optionalVerifyToken } = require('../middleware/authMiddleware');

// Public route to fetch public key
router.get('/key', getRazorpayKey);

// Access check route
router.get('/access/:quizId', optionalVerifyToken, checkQuizAccess);

// Protected enrollment and Razorpay payment routes
router.post('/enroll', verifyToken, enrollInQuiz);
router.post('/create-order', verifyToken, createOrder);
router.post('/verify', verifyToken, verifyPayment);

module.exports = router;
