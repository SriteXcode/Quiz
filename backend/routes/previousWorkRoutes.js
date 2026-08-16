const express = require('express');
const router = express.Router();
const {
  getAllPreviousWorks,
  getPreviousWorkById
} = require('../controllers/previousWorkController');

// @route   GET /api/previous-works
// @desc    Get all completed / showcase previous works
// @access  Public
router.get('/', getAllPreviousWorks);

// @route   GET /api/previous-works/:id
// @desc    Get single previous work detail
// @access  Public
router.get('/:id', getPreviousWorkById);

module.exports = router;
