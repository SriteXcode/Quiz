const express = require('express');
const router = express.Router();
const {
  getAdsByPlacement,
  recordImpression,
  recordClick,
  getAdminAdCampaigns,
  createAdCampaign,
  updateAdCampaign,
  deleteAdCampaign,
  getGlobalAdsStatus,
  toggleGlobalAdsStatus
} = require('../controllers/adController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Public Placement & Analytics Routes
router.get('/placement/:placement', getAdsByPlacement);
router.post('/:id/impression', recordImpression);
router.post('/:id/click', recordClick);

// Protected Admin Campaign Management Routes
router.get('/admin/campaigns', verifyToken, requireAdmin, getAdminAdCampaigns);
router.post('/admin/campaigns', verifyToken, requireAdmin, createAdCampaign);
router.put('/admin/campaigns/:id', verifyToken, requireAdmin, updateAdCampaign);
router.delete('/admin/campaigns/:id', verifyToken, requireAdmin, deleteAdCampaign);
router.get('/admin/global-status', verifyToken, requireAdmin, getGlobalAdsStatus);
router.post('/admin/toggle-global', verifyToken, requireAdmin, toggleGlobalAdsStatus);

module.exports = router;
