const express = require('express');
const router = express.Router();
const {
  getSiteSettings,
  getPublicPartners,
  submitContactMessage
} = require('../controllers/siteContentController');

// @route   GET /api/site/settings
// @desc    Get dynamic About Us & Contact info
router.get('/settings', getSiteSettings);

// @route   GET /api/site/partners
// @desc    Get active Legal Partners & Sponsors
router.get('/partners', getPublicPartners);

// @route   POST /api/site/messages
// @desc    Submit public contact/inquiry message
router.post('/messages', submitContactMessage);

module.exports = router;
