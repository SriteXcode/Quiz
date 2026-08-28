const mongoose = require('mongoose');

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

function parseDateHelper(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    let year = 2026;
    let month = 7;
    let day = 14;

    const trimmedDate = String(dateStr).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      const parts = trimmedDate.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (/^\d{1,2}-[a-zA-Z]{3,}-\d{4}$/.test(trimmedDate)) {
      const parts = trimmedDate.split('-');
      day = parseInt(parts[0], 10);
      const mStr = parts[1].toLowerCase();
      month = MONTH_MAP[mStr] !== undefined ? MONTH_MAP[mStr] : 7;
      year = parseInt(parts[2], 10);
    } else {
      const d = new Date(trimmedDate);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
    }

    let hours = 0;
    let minutes = 0;

    if (timeStr) {
      const trimmedTime = String(timeStr).trim();
      const isPM = /pm/i.test(trimmedTime);
      const isAM = /am/i.test(trimmedTime);
      const match = trimmedTime.match(/(\d{1,2}):(\d{2})/);

      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        hours = h;
        minutes = m;
      }
    }

    return new Date(year, month, day, hours, minutes, 0, 0);
  } catch (_err) {
    return null;
  }
}

function calculateDynamicStatus(quiz) {
  const start = parseDateHelper(quiz.startDate, quiz.startTime);
  const end = parseDateHelper(
    quiz.endDate || quiz.startDate,
    quiz.endTime
  ) || (start && quiz.durationMinutes ? new Date(start.getTime() + quiz.durationMinutes * 60 * 1000) : null);

  const now = new Date();

  if (start && now < start) {
    return 'upcoming';
  }

  if (end && now > end) {
    return 'past';
  }

  if (start && quiz.durationMinutes) {
    const calcEnd = new Date(start.getTime() + quiz.durationMinutes * 60 * 1000);
    if (now > calcEnd && (!end || now > end)) {
      return 'past';
    }
  }

  return 'running';
}

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    trim: true,
    default: 'Question text'
  },
  questionType: {
    type: String,
    enum: ['mcq', 'pattern'],
    default: 'mcq'
  },
  codeSnippet: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  options: {
    type: [String],
    default: ['Option A', 'Option B', 'Option C', 'Option D']
  },
  correctAnswerIndex: {
    type: Number,
    default: 0
  },
  timerSeconds: {
    type: Number,
    default: 15
  },
  explanation: {
    type: String,
    default: ''
  }
});

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  isHidden: { type: Boolean, default: false }
});

const codingChallengeSchema = new mongoose.Schema({
  problemStatement: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  language: {
    type: String,
    default: 'JavaScript'
  },
  starterCode: {
    type: String,
    default: '// Write your solution here\nfunction solve(input) {\n  return input;\n}'
  },
  solutionCode: {
    type: String,
    default: ''
  },
  testCases: [testCaseSchema],
  hints: {
    type: [String],
    default: []
  },
  constraints: {
    type: [String],
    default: []
  },
  proctoringRequired: {
    type: Boolean,
    default: true
  }
});

const rewardSchema = new mongoose.Schema({
  place: { type: String, default: '1st' },
  badge: { type: String, default: '🥇 Winner' },
  prize: { type: String, default: '$100 Cash' },
  description: { type: String, default: '' }
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true
    },
    quizType: {
      type: String,
      enum: ['multiple_choice', 'code'],
      default: 'multiple_choice'
    },
    mcqSubtype: {
      type: String,
      enum: ['quick', 'standard'],
      default: 'quick'
    },
    // Timing configuration modes
    timerType: {
      type: String,
      enum: ['per_question_custom', 'per_question_general', 'total_quiz'],
      default: 'per_question_general'
    },
    generalQuestionTimerSeconds: {
      type: Number,
      default: 15
    },
    category: {
      type: String,
      default: 'Web Dev'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    enrolledUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        registeredAt: { type: Date, default: Date.now },
        isPaid: { type: Boolean, default: false },
        amountPaid: { type: Number, default: 0 }
      }
    ],
    techStack: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['running', 'upcoming', 'past'],
      default: 'upcoming'
    },
    quickDetails: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    startDate: {
      type: String,
      default: ''
    },
    startTime: {
      type: String,
      default: ''
    },
    endDate: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    durationMinutes: {
      type: Number,
      default: 30
    },
    quickTimerSeconds: {
      type: Number,
      default: 10
    },
    proctoring: {
      enabled: { type: Boolean, default: true },
      webcam: { type: Boolean, default: true },
      mic: { type: Boolean, default: true },
      tabSwitchLimit: { type: Number, default: 3 }
    },
    questions: [questionSchema],
    codingChallenge: codingChallengeSchema,
    rewards: [rewardSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Automatically recalculate status according to startDate/startTime before saving
quizSchema.pre('save', function () {
  if (this.startDate) {
    this.status = calculateDynamicStatus(this);
  }
});

quizSchema.statics.calculateStatus = calculateDynamicStatus;

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
