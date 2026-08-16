const mongoose = require('mongoose');

const previousWorkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Previous work title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    category: {
      type: String,
      default: 'Web Dev'
    },
    participantsCount: {
      type: String,
      default: '1,500 Participants'
    },
    avgScore: {
      type: String,
      default: '82% Avg Score'
    },
    topWinner: {
      type: String,
      default: 'Alex K. (98%)'
    },
    badge: {
      type: String,
      default: 'Completed'
    },
    gradient: {
      type: String,
      default: 'from-blue-500 to-indigo-600'
    },
    techStack: {
      type: [String],
      default: []
    },
    completedDate: {
      type: String,
      default: ''
    },
    totalQuestions: {
      type: Number,
      default: 50
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

const PreviousWork = mongoose.model('PreviousWork', previousWorkSchema);

module.exports = PreviousWork;
