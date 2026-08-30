const express = require('express');
const router = express.Router();
const { register, login, googleLogin, getProfile, updateProfile, verifyUpiId, getAllUsers } = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// @route   POST /api/auth/register
// @desc    Register new student or admin with optional avatar upload
// @access  Public
router.post('/register', upload.single('avatar'), register);

// @route   POST /api/auth/login
// @desc    Authenticate user (student/admin) & return token
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/google
// @desc    Authenticate user with Google OAuth (GIS ID Token)
// @access  Public
router.post('/google', googleLogin);

// @route   GET /api/auth/me
// @desc    Get currently logged in user profile
// @access  Private
router.get('/me', verifyToken, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update current user profile with optional avatar
// @access  Private
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

// @route   POST /api/auth/verify-upi
// @desc    Verify UPI ID format & VPA status
// @access  Private
router.post('/verify-upi', verifyToken, verifyUpiId);

// @route   GET /api/auth/users
// @desc    Get all users list
// @access  Private (Admin Only)
router.get('/users', verifyToken, requireAdmin, getAllUsers);

module.exports = router;
