const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getShortsGyaan,
  toggleLikeShort,
  toggleSaveShort,
  adminUploadExcel,
  adminCreateShort,
  adminDeleteShort
} = require('../controllers/shortGyaanController');
const { optionalVerifyToken, verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Configure Multer for memory buffer storage (Fast Excel/CSV parsing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Attach authenticated user details when token is present
router.use(optionalVerifyToken);

// @route   GET /api/shorts
// @desc    Get all Short Gyaan questions (Reels/Shorts feed) with category & saved filters
router.get('/', getShortsGyaan);

// @route   POST /api/shorts/:id/like
// @desc    Like / Unlike a Short Gyaan question
router.post('/:id/like', toggleLikeShort);

// @route   POST /api/shorts/:id/save
// @desc    Bookmark / Unbookmark a Short Gyaan question
router.post('/:id/save', toggleSaveShort);

// @route   POST /api/shorts/admin/upload-excel
// @desc    Bulk upload questions from Excel (.xlsx, .xls) or CSV
router.post('/admin/upload-excel', upload.single('file'), adminUploadExcel);

// @route   POST /api/shorts/admin/create
// @desc    Admin create a single Short Gyaan question
router.post('/admin/create', verifyToken, requireAdmin, adminCreateShort);

// @route   DELETE /api/shorts/admin/:id
// @desc    Admin delete a Short Gyaan question
router.delete('/admin/:id', verifyToken, requireAdmin, adminDeleteShort);

module.exports = router;
