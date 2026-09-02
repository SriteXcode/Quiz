const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      default: 'Anonymous Candidate'
    },
    userEmail: {
      type: String,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    correctCount: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    timeTakenSeconds: {
      type: Number,
      default: 0
    },
    userAnswers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isFirstAttempt: {
      type: Boolean,
      default: true
    },
    isOfficialLeaderboardEntry: {
      type: Boolean,
      default: true // Only 1st attempt gets listed on official leaderboard
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    isPracticeMode: {
      type: Boolean,
      default: false
    },
    certificateId: {
      type: String,
      unique: true,
      sparse: true
    },
    accuracy: {
      type: Number,
      default: 0
    },
    earnedXP: {
      type: Number,
      default: 0
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// High-Performance Compound Indexes for Leaderboards, User History, and Profile Stats
quizSubmissionSchema.index({ quizId: 1, isOfficialLeaderboardEntry: 1, score: -1, timeTakenSeconds: 1 });
quizSubmissionSchema.index({ quizId: 1, userId: 1 });
quizSubmissionSchema.index({ userId: 1, isFirstAttempt: 1, createdAt: -1 });
quizSubmissionSchema.index({ userEmail: 1, isFirstAttempt: 1 });

const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);

module.exports = QuizSubmission;

