const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    userEmail: {
      type: String,
      default: '',
      trim: true
    },
    role: {
      type: String,
      default: 'Student Candidate',
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5
    },
    quote: {
      type: String,
      required: true,
      trim: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: null
    },
    quizTitle: {
      type: String,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true
    },
    bgColor: {
      type: String,
      default: 'bg-[var(--color-secondary-600)] text-white'
    },
    avatarBg: {
      type: String,
      default: 'bg-white text-[var(--color-secondary-700)]'
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved'
    },
    isFeatured: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying of approved & featured reviews
reviewSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
