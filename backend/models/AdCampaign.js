const mongoose = require('mongoose');

const adCampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true
    },
    sponsorName: {
      type: String,
      default: 'Official Sponsor',
      trim: true
    },
    placement: {
      type: String,
      default: 'homepage_hero_bottom'
    },
    placements: {
      type: [String],
      enum: ['homepage_hero_bottom', 'quiz_catalog_top', 'shorts_gyaan_feed', 'quiz_result_modal'],
      default: ['homepage_hero_bottom']
    },
    adType: {
      type: String,
      enum: ['custom_banner', 'google_adsense'],
      default: 'custom_banner'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    targetUrl: {
      type: String,
      default: ''
    },
    adSenseClient: {
      type: String,
      default: ''
    },
    adSenseSlot: {
      type: String,
      default: ''
    },
    headlineText: {
      type: String,
      default: ''
    },
    descriptionText: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: ''
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'expired'],
      default: 'active'
    },
    impressionsCount: {
      type: Number,
      default: 0
    },
    clicksCount: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// High-Performance Index for Placement & Active Status Filtering
adCampaignSchema.index({ placement: 1, status: 1, priority: -1 });

module.exports = mongoose.model('AdCampaign', adCampaignSchema);
