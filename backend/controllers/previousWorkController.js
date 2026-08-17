const PreviousWork = require('../models/PreviousWork');

// @route   GET /api/previous-works
// @desc    Get all previous works list (Public)
// @access  Public
const getAllPreviousWorks = async (req, res) => {
  try {
    const works = await PreviousWork.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: works.length,
      works: works
    });
  } catch (_error) {
    res.status(200).json({
      success: true,
      count: 0,
      works: []
    });
  }
};

// @route   GET /api/previous-works/:id
// @desc    Get single previous work item by ID
// @access  Public
const getPreviousWorkById = async (req, res) => {
  try {
    const work = await PreviousWork.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Previous work not found'
      });
    }

    res.status(200).json({
      success: true,
      work
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch previous work',
      error: error.message
    });
  }
};

// @route   POST /api/admin/previous-works
// @desc    Create new previous work (Admin Only)
// @access  Private (Admin)
const createPreviousWork = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      participantsCount,
      avgScore,
      topWinner,
      badge,
      gradient,
      techStack,
      completedDate,
      totalQuestions
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const formattedTechStack = Array.isArray(techStack)
      ? techStack
      : typeof techStack === 'string'
      ? techStack.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const newWork = await PreviousWork.create({
      title,
      description,
      category: category || 'Web Dev',
      participantsCount: participantsCount || '1,200 Participants',
      avgScore: avgScore || '80% Avg Score',
      topWinner: topWinner || 'Top Performer (100%)',
      badge: badge || 'Completed',
      gradient: gradient || 'from-blue-500 to-indigo-600',
      techStack: formattedTechStack,
      completedDate: completedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      totalQuestions: totalQuestions || 50,
      createdBy: req.user ? req.user._id : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Previous work created successfully!',
      work: newWork
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create previous work',
      error: error.message
    });
  }
};

// @route   PUT /api/admin/previous-works/:id
// @desc    Update existing previous work (Admin Only)
// @access  Private (Admin)
const updatePreviousWork = async (req, res) => {
  try {
    const work = await PreviousWork.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Previous work not found'
      });
    }

    let updateData = { ...req.body };
    if (typeof updateData.techStack === 'string') {
      updateData.techStack = updateData.techStack.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const updatedWork = await PreviousWork.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Previous work updated successfully!',
      work: updatedWork
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update previous work',
      error: error.message
    });
  }
};

// @route   DELETE /api/admin/previous-works/:id
// @desc    Delete previous work (Admin Only)
// @access  Private (Admin)
const deletePreviousWork = async (req, res) => {
  try {
    const work = await PreviousWork.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Previous work not found'
      });
    }

    await PreviousWork.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Previous work deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete previous work',
      error: error.message
    });
  }
};

module.exports = {
  getAllPreviousWorks,
  getPreviousWorkById,
  createPreviousWork,
  updatePreviousWork,
  deletePreviousWork
};
