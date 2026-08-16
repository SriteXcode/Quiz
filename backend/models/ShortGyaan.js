const mongoose = require('mongoose');

const shortGyaanSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    codeSnippet: {
      type: String,
      default: ''
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length === 4;
        },
        message: 'A Short Gyaan question must have exactly 4 options'
      }
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      default: 0
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required for Short Gyaan'],
      trim: true
    },
    category: {
      type: String,
      default: 'JavaScript',
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    timerSeconds: {
      type: Number,
      enum: [15, 30, 45, 60],
      default: 30
    },
    likesCount: {
      type: Number,
      default: 0
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    savedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    author: {
      type: String,
      default: 'Quiz Platform Master'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast feed queries and category filters
shortGyaanSchema.index({ category: 1, createdAt: -1 });
shortGyaanSchema.index({ likesCount: -1 });

const ShortGyaan = mongoose.model('ShortGyaan', shortGyaanSchema);

module.exports = ShortGyaan;
