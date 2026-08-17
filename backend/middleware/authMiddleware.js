const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authorization token missing.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_quiz_platform_2026');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed',
      error: error.message
    });
  }
};

// Middleware to optionally attach JWT user if present without blocking requests
const optionalVerifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_quiz_platform_2026');
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (_err) {
    // Non-blocking fallback for optional tokens
  }
  next();
};

// Middleware to authorize specific roles (e.g. 'admin', 'student')
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user ? req.user.role : 'guest'}' does not have permission to perform this action.`
      });
    }
    next();
  };
};

// Middleware specifically for Admin role access
const requireAdmin = authorizeRoles('admin');

module.exports = {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
  requireAdmin
};
