const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId && (!this.authProvider || this.authProvider === 'local');
      },
      minlength: [6, 'Password must be at least 6 characters']
    },
    googleId: {
      type: String,
      default: '',
      sparse: true
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    dob: {
      type: String,
      default: ''
    },
    school: {
      type: String,
      default: ''
    },
    studentClass: {
      type: String,
      default: ''
    },
    fatherName: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    upiId: {
      type: String,
      default: '',
      trim: true
    },
    isUpiVerified: {
      type: Boolean,
      default: false
    },
    upiHolderName: {
      type: String,
      default: ''
    },
    vpaBankName: {
      type: String,
      default: ''
    },
    vpaStatus: {
      type: String,
      enum: ['UNVERIFIED', 'ACTIVE_AND_PAYABLE', 'INVALID_VPA'],
      default: 'UNVERIFIED'
    },
    brainCoins: {
      type: Number,
      default: 100
    },
    unlockedBadges: [
      {
        quizId: String,
        quizTitle: String,
        category: String,
        badgeTitle: String,
        unlockedAt: { type: Date, default: Date.now }
      }
    ],
    unlockedVouchers: [
      {
        quizId: String,
        sponsorName: String,
        code: String,
        details: String,
        unlockedAt: { type: Date, default: Date.now }
      }
    ],
    avatarUrl: {
      type: String,
      default: ''
    },
    purchasedQuizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// High-Performance Index for User Admin Filtering (Email & GoogleId are already indexed via unique/sparse)
userSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;

