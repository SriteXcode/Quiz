const mongoose = require('mongoose');
const xlsx = require('xlsx');
const ShortGyaan = require('../models/ShortGyaan');

// 1. GET SHORT GYAAN QUESTIONS (Infinite Feed Stream & Pagination)
exports.getShortsGyaan = async (req, res) => {
  try {
    const { category, search, savedOnly, page = 1, limit = 10 } = req.query;
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : null;
    const query = {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    if (category && category !== 'All' && category !== 'For You' && category !== 'Saved') {
      const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { category: { $regex: new RegExp(`^${escapedCategory}$`, 'i') } },
        { tags: { $regex: new RegExp(`^${escapedCategory}$`, 'i') } },
        { tags: { $regex: new RegExp(escapedCategory, 'i') } }
      ];
    }

    if (savedOnly === 'true' && userId) {
      query.savedBy = userId;
    }

    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { explanation: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await ShortGyaan.countDocuments(query);
    const skip = (pageNum - 1) * limitNum;

    // Fetch documents sorted by popularity and recency
    let shorts = await ShortGyaan.find(query)
      .sort({ likesCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // If page exceeds total collection count (Infinite Scroll looping for endless reels)
    if (shorts.length === 0 && totalCount > 0 && savedOnly !== 'true') {
      // Loop over and return shuffled recommendations so the stream is truly infinite
      const randomSkip = Math.floor(Math.random() * Math.max(1, totalCount - limitNum));
      shorts = await ShortGyaan.find(query)
        .sort({ likesCount: -1 })
        .skip(randomSkip)
        .limit(limitNum);
    }

    // Attach isLiked & isSaved indicators for current user
    const formattedShorts = shorts.map((item) => {
      const obj = item.toObject();
      obj.isLiked = userId ? Boolean(item.likedBy && item.likedBy.some(id => id.toString() === userId.toString())) : false;
      obj.isSaved = userId ? Boolean(item.savedBy && item.savedBy.some(id => id.toString() === userId.toString())) : false;
      return obj;
    });

    res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      hasMore: true, // Infinite feed always provides continuous recommendations
      count: formattedShorts.length,
      shorts: formattedShorts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. TOGGLE LIKE SHORT GYAAN
exports.toggleLikeShort = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : new mongoose.Types.ObjectId();

    const short = await ShortGyaan.findById(id);
    if (!short) {
      return res.status(404).json({ success: false, message: 'Short Gyaan question not found' });
    }

    const alreadyLikedIndex = short.likedBy.findIndex(uid => uid.toString() === userId.toString());
    let isLiked = false;

    if (alreadyLikedIndex > -1) {
      short.likedBy.splice(alreadyLikedIndex, 1);
      short.likesCount = Math.max(0, short.likesCount - 1);
      isLiked = false;
    } else {
      short.likedBy.push(userId);
      short.likesCount += 1;
      isLiked = true;
    }

    await short.save();

    res.json({
      success: true,
      isLiked,
      likesCount: short.likesCount,
      message: isLiked ? 'Liked Short Gyaan! ❤️' : 'Unliked Short Gyaan'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. TOGGLE SAVE / BOOKMARK SHORT GYAAN
exports.toggleSaveShort = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : new mongoose.Types.ObjectId();

    const short = await ShortGyaan.findById(id);
    if (!short) {
      return res.status(404).json({ success: false, message: 'Short Gyaan question not found' });
    }

    const alreadySavedIndex = short.savedBy.findIndex(uid => uid.toString() === userId.toString());
    let isSaved = false;

    if (alreadySavedIndex > -1) {
      short.savedBy.splice(alreadySavedIndex, 1);
      isSaved = false;
    } else {
      short.savedBy.push(userId);
      short.savedBy.push(userId);
      isSaved = true;
    }

    await short.save();

    res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Saved to your Bookmarked Gyaan! 🔖' : 'Removed from bookmarks'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. ADMIN BULK EXCEL / CSV UPLOAD
exports.adminUploadExcel = async (req, res) => {
  try {
    let rawRows = [];

    if (req.file) {
      const workbook = req.file.buffer
        ? xlsx.read(req.file.buffer, { type: 'buffer' })
        : xlsx.readFile(req.file.path);

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    } else if (req.body && req.body.questions && Array.isArray(req.body.questions)) {
      rawRows = req.body.questions;
    } else {
      return res.status(400).json({
        success: false,
        message: 'No file or question data received. Please upload an Excel (.xlsx / .csv) file.'
      });
    }

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file contains no rows or data.'
      });
    }

    const getVal = (row, ...keys) => {
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const found = rowKeys.find(rk => rk.trim().toLowerCase() === k.trim().toLowerCase());
        if (found !== undefined && row[found] !== undefined && row[found] !== '') {
          return String(row[found]).trim();
        }
      }
      return '';
    };

    const parsedQuestions = [];
    const errors = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;

      const questionText = getVal(row, 'Question', 'Question Text', 'question', 'question_text', 'Problem');
      const optA = getVal(row, 'Option A', 'Option 1', 'OptionA', 'optA', 'A');
      const optB = getVal(row, 'Option B', 'Option 2', 'OptionB', 'optB', 'B');
      const optC = getVal(row, 'Option C', 'Option 3', 'OptionC', 'optC', 'C');
      const optD = getVal(row, 'Option D', 'Option 4', 'OptionD', 'optD', 'D');
      const rawAnswer = getVal(row, 'Correct Answer', 'Answer', 'Correct Option', 'Correct', 'correctAnswer', 'correct_answer');
      const explanation = getVal(row, 'Explanation', 'Solution', 'Reason', 'Description', 'explanation') || 'No detailed explanation provided.';
      const category = getVal(row, 'Category', 'Topic', 'Subject', 'category') || 'General Tech';
      const timerStr = getVal(row, 'Timer', 'Time Limit', 'Duration', 'timerSeconds') || '30';
      const timerSeconds = parseInt(timerStr, 10) === 60 ? 60 : 30;

      if (!questionText) {
        errors.push(`Row ${rowNum}: Missing Question text.`);
        return;
      }
      if (!optA || !optB || !optC || !optD) {
        errors.push(`Row ${rowNum}: All 4 options (Option A, B, C, D) are required.`);
        return;
      }

      let correctAnswerIndex;
      const cleanAnswer = rawAnswer.toLowerCase().trim();

      if (cleanAnswer === '0' || cleanAnswer === 'a' || cleanAnswer === 'option a' || cleanAnswer === '1' || cleanAnswer === optA.toLowerCase()) {
        correctAnswerIndex = 0;
      } else if (cleanAnswer === 'b' || cleanAnswer === 'option b' || cleanAnswer === '2' || cleanAnswer === optB.toLowerCase()) {
        correctAnswerIndex = 1;
      } else if (cleanAnswer === 'c' || cleanAnswer === 'option c' || cleanAnswer === '3' || cleanAnswer === optC.toLowerCase()) {
        correctAnswerIndex = 2;
      } else if (cleanAnswer === 'd' || cleanAnswer === 'option d' || cleanAnswer === '4' || cleanAnswer === optD.toLowerCase()) {
        correctAnswerIndex = 3;
      } else {
        correctAnswerIndex = 0;
      }

      parsedQuestions.push({
        questionText,
        options: [optA, optB, optC, optD],
        correctAnswerIndex,
        explanation,
        category,
        tags: [category],
        difficulty: 'Medium',
        timerSeconds,
        author: req.user?.name || 'Admin Excel Upload',
        createdBy: req.user?._id
      });
    });

    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract valid questions from the Excel file.',
        errors
      });
    }

    const inserted = await ShortGyaan.insertMany(parsedQuestions);

    res.status(201).json({
      success: true,
      message: `🎉 Successfully uploaded and added ${inserted.length} Short Gyaan questions!`,
      count: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
      sample: inserted.slice(0, 3)
    });
  } catch (error) {
    console.error('[Excel Upload Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and upload Excel file: ' + error.message
    });
  }
};

// 5. ADMIN CREATE SINGLE SHORT GYAAN
exports.adminCreateShort = async (req, res) => {
  try {
    const {
      questionText,
      codeSnippet,
      options,
      correctAnswerIndex,
      explanation,
      category,
      difficulty,
      timerSeconds
    } = req.body;

    if (!questionText || !options || options.length !== 4 || explanation === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionText, exactly 4 options, and explanation.'
      });
    }

    const short = new ShortGyaan({
      questionText,
      codeSnippet: codeSnippet || '',
      options,
      correctAnswerIndex: Number(correctAnswerIndex) || 0,
      explanation,
      category: category || 'General Tech',
      tags: [category || 'General Tech'],
      difficulty: difficulty || 'Medium',
      timerSeconds: Number(timerSeconds) === 60 ? 60 : 30,
      author: req.user?.name || 'Admin',
      createdBy: req.user?._id
    });

    await short.save();

    res.status(201).json({
      success: true,
      message: 'Short Gyaan question created successfully!',
      short
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. ADMIN DELETE SHORT GYAAN
exports.adminDeleteShort = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ShortGyaan.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Short Gyaan question not found.' });
    }

    res.json({
      success: true,
      message: 'Short Gyaan question deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
