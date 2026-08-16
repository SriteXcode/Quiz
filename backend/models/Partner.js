const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      default: 'Official Legal & Verification Partner',
      enum: [
        'Official Legal & Verification Partner',
        'Academic Institution',
        'Corporate Sponsor',
        'Certification Authority',
        'Technology Partner'
      ]
    },
    logoUrl: {
      type: String,
      default: ''
    },
    websiteUrl: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;
