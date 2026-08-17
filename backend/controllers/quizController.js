const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');

// 1. GET ALL QUIZZES
exports.getQuizzes = async (req, res) => {
  try {
    const { category, type, search, status } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (type && type !== 'all') {
      query.quizType = type;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { techStack: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET QUIZ BY ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz challenge not found' });
    }
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. SUBMIT QUIZ RESULT (Handles Accuracy from Attempted Questions + Leaderboard 1-entry rule)
exports.submitQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { userAnswers, timeTakenSeconds, isPracticeMode } = req.body;
    
    // Resolve user credentials from authenticated JWT or payload
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : (req.body.userId || new mongoose.Types.ObjectId());
    const userEmail = (req.user?.email || req.body.userEmail || '').trim();
    const emailPrefix = userEmail ? userEmail.split('@')[0] : '';
    
    let userName = req.user?.name || req.body.userName || '';
    if (!userName || userName === 'Candidate') {
      userName = emailPrefix ? (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)) : 'Candidate';
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Check if this is the user's first official attempt
    let isFirstAttempt = true;
    let isOfficialLeaderboardEntry = true;
    let attemptNumber = 1;

    const previousAttempts = await QuizSubmission.find({ quizId, userId });
    if (previousAttempts.length > 0) {
      isFirstAttempt = false;
      isOfficialLeaderboardEntry = false; // Official leaderboard only keeps 1st attempt!
      attemptNumber = previousAttempts.length + 1;
    }

    // Calculate score, correct, incorrect, unattempted, and accuracy (attempted only)
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const totalQuestions = quiz.questions ? quiz.questions.length : 1;

    if (quiz.quizType === 'code') {
      correctCount = 1;
    } else if (quiz.questions && quiz.questions.length > 0) {
      quiz.questions.forEach((q, idx) => {
        const answer = userAnswers ? userAnswers[idx] : undefined;
        if (answer === undefined || answer === null) {
          unattemptedCount++;
        } else if (Number(answer) === q.correctAnswerIndex) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });
    }

    const attemptedCount = correctCount + incorrectCount;
    // Accuracy is calculated based ONLY on attempted questions
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // XP calculation: 10 XP per correct question + 20 completion + 30 if 100% (or 15 if >= 80%)
    const baseXP = correctCount * 10;
    const completionBonus = 20;
    const accuracyBonus = accuracy === 100 ? 30 : accuracy >= 80 ? 15 : 0;
    const earnedXP = quiz.quizType === 'code' ? 100 : baseXP + completionBonus + accuracyBonus;

    // Certificate generation rules:
    // 1. Only generated for official Quiz (not for practice mode, not for replay)
    // 2. Also generated for Admin users
    const isAdminUser = req.user?.role === 'admin';
    const isPractice = Boolean(isPracticeMode);
    const isOfficialFirstQuizAttempt = !isPractice && isFirstAttempt;
    const shouldGenerateCertificate = isOfficialFirstQuizAttempt || (isAdminUser && !isPractice);

    let certificateId = null;
    let issuedAt = null;

    if (shouldGenerateCertificate) {
      const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
      const timestampPart = Date.now().toString(36).slice(-4).toUpperCase();
      certificateId = `CERT-QZ-${timestampPart}-${randomHex}`;
      issuedAt = new Date();
    }

    const submission = new QuizSubmission({
      quizId,
      userId,
      userName,
      userEmail,
      score,
      accuracy,
      earnedXP,
      certificateId,
      issuedAt,
      correctCount,
      totalQuestions,
      timeTakenSeconds: timeTakenSeconds || 45,
      userAnswers: userAnswers || {},
      isFirstAttempt,
      isOfficialLeaderboardEntry: isPractice ? false : isOfficialLeaderboardEntry,
      attemptNumber,
      isPracticeMode: isPractice
    });

    await submission.save();

    res.json({
      success: true,
      message: isOfficialLeaderboardEntry
        ? 'Official exam submitted and recorded on leaderboard!'
        : 'Replay / Practice attempt submitted successfully (Leaderboard preserved)!',
      submission: {
        score,
        accuracy,
        earnedXP,
        correctCount,
        incorrectCount,
        unattemptedCount,
        attemptedCount,
        totalQuestions,
        timeTakenSeconds: submission.timeTakenSeconds,
        isFirstAttempt,
        isOfficialLeaderboardEntry,
        attemptNumber,
        userName,
        userEmail,
        username: emailPrefix,
        certificateId,
        issuedAt,
        quizTitle: quiz.title,
        category: quiz.category,
        quizType: quiz.quizType,
        isPracticeMode: isPractice
      },
      review: {
        questions: quiz.questions,
        userAnswers: userAnswers || {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. GET QUIZ OFFICIAL LEADERBOARD (Single Entry Per User)
exports.getQuizLeaderboard = async (req, res) => {
  try {
    const quizId = req.params.id;

    // Fetch official 1st attempts only, sorted by score DESC, then timeTakenSeconds ASC
    const leaderboard = await QuizSubmission.find({
      quizId,
      isOfficialLeaderboardEntry: true
    })
      .sort({ score: -1, timeTakenSeconds: 1 })
      .limit(50);

    const formattedLeaderboard = leaderboard.map((entry) => {
      let email = (entry.userEmail || '').trim();
      let name = (entry.userName || '').trim();
      let username = email ? email.split('@')[0] : '';

      if ((!name || name === 'Candidate') && username) {
        name = username.charAt(0).toUpperCase() + username.slice(1);
      }
      if (!username && name && name !== 'Candidate') {
        username = name.toLowerCase().replace(/\s+/g, '_');
      }

      return {
        ...entry.toObject(),
        userName: name || email || 'Candidate',
        userEmail: email,
        username: username || (name ? name.toLowerCase().replace(/\s+/g, '_') : '')
      };
    });

    res.json({
      success: true,
      count: formattedLeaderboard.length,
      leaderboard: formattedLeaderboard
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET QUIZ QUESTIONS FOR REVIEW / PRACTICE
exports.getQuizReview = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        quizType: quiz.quizType,
        questions: quiz.questions,
        codingChallenge: quiz.codingChallenge
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. GET CERTIFICATE BY UNIQUE CERTIFICATE ID (Public Verification)
exports.getCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const submission = await QuizSubmission.findOne({ certificateId }).populate('quizId', 'title category quizType techStack');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Certificate not found with ID ' + certificateId });
    }

    res.json({
      success: true,
      certificate: {
        certificateId: submission.certificateId,
        userName: submission.userName,
        userEmail: submission.userEmail,
        score: submission.score,
        accuracy: submission.accuracy || (submission.totalQuestions ? Math.round((submission.correctCount / submission.totalQuestions) * 100) : 100),
        earnedXP: submission.earnedXP || (submission.score * 2),
        correctCount: submission.correctCount,
        totalQuestions: submission.totalQuestions,
        timeTakenSeconds: submission.timeTakenSeconds,
        issuedAt: submission.issuedAt || submission.createdAt,
        quizTitle: submission.quizId?.title || 'Quiz Assessment',
        category: submission.quizId?.category || 'General',
        quizType: submission.quizId?.quizType || 'multiple_choice',
        techStack: submission.quizId?.techStack || [],
        isPracticeMode: submission.isPracticeMode
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. GET ALL USER CERTIFICATES
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : (req.query.userId || req.body.userId);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User authentication required' });
    }

    // Find official submissions that have an issued certificate ID
    const submissions = await QuizSubmission.find({
      userId,
      certificateId: { $ne: null, $exists: true },
      isPracticeMode: { $ne: true }
    })
      .populate('quizId', 'title category quizType techStack')
      .sort({ createdAt: -1 });

    const certificates = submissions.map((sub) => ({
      _id: sub._id,
      certificateId: sub.certificateId,
      userName: sub.userName,
      userEmail: sub.userEmail,
      score: sub.score,
      accuracy: sub.accuracy || (sub.totalQuestions ? Math.round((sub.correctCount / sub.totalQuestions) * 100) : 100),
      earnedXP: sub.earnedXP || (sub.score * 2),
      correctCount: sub.correctCount,
      totalQuestions: sub.totalQuestions,
      timeTakenSeconds: sub.timeTakenSeconds,
      issuedAt: sub.issuedAt || sub.createdAt,
      quizId: sub.quizId?._id,
      quizTitle: sub.quizId?.title || 'Quiz Assessment',
      category: sub.quizId?.category || 'Web Dev',
      techStack: sub.quizId?.techStack || [],
      isPracticeMode: false
    }));

    res.json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Format time ago string
const formatTimeAgo = (date) => {
  if (!date) return 'Recently';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// 8. GET COMPREHENSIVE DYNAMIC USER PROFILE STATS & REAL-TIME GLOBAL RANK
exports.getUserProfileStats = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : (req.query.userId || req.body.userId);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User authentication required' });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId.toString());

    // 1. Fetch all submissions by this user
    const userSubmissions = await QuizSubmission.find({ userId: objectUserId })
      .populate('quizId', 'title category quizType techStack')
      .sort({ createdAt: -1 });

    const totalSubmissions = userSubmissions.length;
    const distinctQuizzes = new Set(
      userSubmissions.map(s => (s.quizId?._id ? s.quizId._id.toString() : s.quizId?.toString()))
    ).size;

    // Sum Total Earned XP
    const totalXP = userSubmissions.reduce(
      (sum, s) => sum + (s.earnedXP || (s.score ? s.score * 2 : 0) || 0),
      0
    );

    // Calculate dynamic weighted Accuracy Rate
    let sumAccuracy = 0;
    userSubmissions.forEach((s) => {
      const correct = s.correctCount || 0;
      const total = s.totalQuestions || 0;
      const acc = s.accuracy !== undefined ? s.accuracy : (total > 0 ? Math.round((correct / total) * 100) : s.score || 0);
      sumAccuracy += acc;
    });

    const averageAccuracy = totalSubmissions > 0
      ? Math.round(sumAccuracy / totalSubmissions)
      : 0;

    // 2. Global Leaderboard Ranking Calculation
    // Aggregate total earnedXP across all users in the entire database
    const globalRankings = await QuizSubmission.aggregate([
      {
        $group: {
          _id: '$userId',
          totalXP: { $sum: '$earnedXP' },
          totalScore: { $sum: '$score' },
          avgAccuracy: { $avg: '$accuracy' },
          submissionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalXP: -1, totalScore: -1, avgAccuracy: -1 }
      }
    ]);

    const userRankIndex = globalRankings.findIndex(
      r => r._id && r._id.toString() === userId.toString()
    );

    let globalRankStr = '#1';
    let globalRankNumber = 1;
    if (userRankIndex !== -1) {
      globalRankNumber = userRankIndex + 1;
      globalRankStr = `#${globalRankNumber}`;
    } else if (totalSubmissions === 0) {
      globalRankStr = 'Unranked';
      globalRankNumber = null;
    } else {
      globalRankNumber = globalRankings.length + 1;
      globalRankStr = `#${globalRankNumber}`;
    }

    // Calculate highest score & category distribution
    let highestScore = 0;
    let officialCount = 0;
    let practiceCount = 0;
    const categoryStats = {};

    userSubmissions.forEach((s) => {
      if (s.score > highestScore) highestScore = s.score;
      if (s.isPracticeMode || !s.isFirstAttempt) practiceCount++;
      else officialCount++;

      const cat = s.quizId?.category || 'General';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    // 3. Dynamic Badges Calculation based on real achievements
    const badges = [
      {
        id: 'speed_demon',
        icon: '⚡',
        name: 'Speed Demon',
        desc: 'Finished test in under 60 seconds with passing score',
        unlocked: userSubmissions.some(s => s.timeTakenSeconds && s.timeTakenSeconds < 60 && s.score >= 70)
      },
      {
        id: 'flawless',
        icon: '🎯',
        name: 'Flawless Accuracy',
        desc: 'Achieved 100% accuracy score in assessment',
        unlocked: userSubmissions.some(s => s.accuracy === 100 || s.score === 100)
      },
      {
        id: 'proctor',
        icon: '🛡️',
        name: 'Proctor Verified',
        desc: 'Completed live quiz assessment with zero violations',
        unlocked: userSubmissions.some(s => s.isOfficialLeaderboardEntry && !s.isPracticeMode)
      },
      {
        id: 'scholar',
        icon: '🔥',
        name: 'Dedicated Scholar',
        desc: 'Completed 3+ technical assessments',
        unlocked: distinctQuizzes >= 3 || totalSubmissions >= 3
      },
      {
        id: 'xp_titan',
        icon: '🏆',
        name: 'XP Titan',
        desc: 'Accumulated over 150+ total platform XP points',
        unlocked: totalXP >= 150
      },
      {
        id: 'leaderboard_pro',
        icon: '👑',
        name: 'Top Contender',
        desc: 'Ranked in the top 10 on the Global Leaderboard',
        unlocked: userRankIndex !== -1 && userRankIndex < 10
      }
    ];

    // 4. Formatted Recent Activity History
    const recentHistory = userSubmissions.slice(0, 15).map((s) => ({
      _id: s._id,
      quizId: s.quizId?._id,
      title: s.quizId?.title || 'Technical Assessment',
      category: s.quizId?.category || 'General',
      score: `${s.score}%`,
      scoreNumber: s.score,
      accuracy: `${s.accuracy !== undefined ? s.accuracy : s.score}%`,
      accuracyNumber: s.accuracy !== undefined ? s.accuracy : s.score,
      earnedXP: `+${s.earnedXP || 0} XP`,
      earnedXPNumber: s.earnedXP || 0,
      timeTakenSeconds: s.timeTakenSeconds || 45,
      badge: s.isPracticeMode ? 'Practice' : (s.isFirstAttempt ? 'Live Quiz' : 'Replay'),
      time: formatTimeAgo(s.createdAt),
      date: s.createdAt
    }));

    // 5. Total Official Certificates Count
    const totalCertificates = userSubmissions.filter(s => s.certificateId && !s.isPracticeMode).length;

    res.json({
      success: true,
      stats: {
        totalQuizzes: distinctQuizzes || totalSubmissions,
        totalSubmissions,
        officialCount,
        practiceCount,
        highestScore: `${highestScore}%`,
        highestScoreRaw: highestScore,
        categoryStats,
        totalPoints: totalXP.toLocaleString('en-US'),
        totalPointsRaw: totalXP,
        globalRank: globalRankStr,
        globalRankNumber,
        totalRankedUsers: Math.max(1, globalRankings.length),
        winRate: `${averageAccuracy}%`,
        averageAccuracy,
        totalCertificates,
        badges,
        recentHistory
      }
    });
  } catch (error) {
    console.error('[Get Profile Stats Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

