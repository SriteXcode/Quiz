const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_quiz_platform_2026',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user (Student or Admin)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      dob,
      school,
      studentClass,
      fatherName,
      phone
    } = req.body;

    // Basic Validation: Name, Email, Phone, Password
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone number, and password.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Process Avatar image upload from Cloudinary / Multer
    let avatarUrl = '';
    if (req.file && req.file.path) {
      avatarUrl = req.file.path;
    }

    // Create User Instance
    const newUser = new User({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'student',
      dob: dob || '',
      school: school || '',
      studentClass: studentClass || '',
      fatherName: fatherName || '',
      phone: phone || '',
      avatarUrl
    });

    await newUser.save();

    // Generate Access Token
    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      success: true,
      message: `${newUser.role === 'admin' ? 'Admin' : 'Student'} registration successful`,
      token,
      user: newUser
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. User does not exist.'
      });
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    // Generate Access Token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! (${user.role.toUpperCase()})`,
      token,
      user
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (Authenticated)
const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching users list',
      error: error.message
    });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private (Authenticated)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, dob, school, studentClass, fatherName, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (dob !== undefined) user.dob = dob.trim();
    if (school !== undefined) user.school = school.trim();
    if (studentClass !== undefined) user.studentClass = studentClass.trim();
    if (fatherName !== undefined) user.fatherName = fatherName.trim();
    if (phone !== undefined) user.phone = phone.trim();

    if (req.file && req.file.path) {
      user.avatarUrl = req.file.path;
    } else if (req.body.avatarUrl) {
      user.avatarUrl = req.body.avatarUrl;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers
};
