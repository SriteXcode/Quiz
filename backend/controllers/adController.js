const AdCampaign = require('../models/AdCampaign');
const SiteSettings = require('../models/SiteSettings');
const { getCache, setCache, deleteCacheByPattern } = require('../config/redis');

// Default Fallback Banners when 0 paid active campaigns exist in MongoDB
const DEFAULT_FALLBACK_ADS = {
  homepage_hero_bottom: {
    _id: 'default-fallback-hero',
    title: 'Daily Live Contest & Practice',
    sponsorName: 'brainArena Special',
    placement: 'homepage_hero_bottom',
    adType: 'custom_banner',
    imageUrl: 'https://res.cloudinary.com/dtjkpcuy9/image/upload/v1788088347/quiz_platform_assets/brainarena_banner.png',
    targetUrl: '/quiz',
    headlineText: 'Daily Live Quiz Competitions & Free Certificates',
    descriptionText: 'Practice HTML, JavaScript & Java questions daily. Join the 8 PM weekend reward contest!'
  },
  quiz_catalog_top: {
    _id: 'default-fallback-catalog',
    title: 'Shorts Gyaan Micro-Learning',
    sponsorName: 'brainArena Flashcards',
    placement: 'quiz_catalog_top',
    adType: 'custom_banner',
    imageUrl: '',
    targetUrl: '/short-gyaan',
    headlineText: '💡 Master Tech Concepts in 30 Seconds',
    descriptionText: 'Explore Shorts Gyaan for bite-sized HTML, JS & DSA flashcards.'
  },
  shorts_gyaan_feed: {
    _id: 'default-fallback-shorts',
    title: 'Official Contest Partner',
    sponsorName: 'brainArena Partner',
    placement: 'shorts_gyaan_feed',
    adType: 'custom_banner',
    imageUrl: '',
    targetUrl: '/about',
    headlineText: 'Partner With brainArena',
    descriptionText: 'Sponsor technical contests and connect with 50,000+ active developers.'
  },
  quiz_result_modal: {
    _id: 'default-fallback-result',
    title: 'Claim Your Certificate',
    sponsorName: 'brainArena Academy',
    placement: 'quiz_result_modal',
    adType: 'custom_banner',
    imageUrl: '',
    targetUrl: '/profile',
    headlineText: 'Official Verified Quiz Certificates',
    descriptionText: 'Complete live tests with zero proctoring violations to earn shareable certificates.'
  }
};

// 1. GET ACTIVE AD FOR PLACEMENT (Executes Smart Weighted Selection Algorithm)
exports.getAdsByPlacement = async (req, res) => {
  try {
    // Check if Admin has shut down ads platform-wide to make website 100% Ad-Free
    const siteSettings = await SiteSettings.findOne({});
    if (siteSettings && siteSettings.adsEnabled === false) {
      return res.json({ success: true, ad: null, isAdFree: true });
    }

    const { placement } = req.params;
    const cacheKey = `ad:placement:${placement}`;

    // 1. Check Redis cache first (<3ms response)
    const cachedAd = await getCache(cacheKey);
    if (cachedAd) {
      return res.json({ success: true, ad: cachedAd });
    }

    const now = new Date();

    // 2. Query all active eligible campaigns for this placement
    const activeAds = await AdCampaign.find({
      $or: [{ placement: placement }, { placements: placement }],
      status: 'active',
      $and: [
        { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] }
      ]
    });

    if (!activeAds || activeAds.length === 0) {
      const fallbackAd = DEFAULT_FALLBACK_ADS[placement] || DEFAULT_FALLBACK_ADS.homepage_hero_bottom;
      return res.json({ success: true, ad: fallbackAd, isFallback: true });
    }

    // 3. Compute Dynamic Selection Weight (W_i) for each campaign
    const weightedAds = activeAds.map((ad) => {
      const ctr = ad.impressionsCount > 0 ? (ad.clicksCount / ad.impressionsCount) * 100 : 0;
      const ctrMultiplier = 1 + (ctr / 100);
      const impressionDivider = Math.sqrt(1 + ad.impressionsCount);
      const weight = Math.max(0.1, (ad.priority || 1) * ctrMultiplier * (1 / impressionDivider));

      return { ad, weight };
    });

    // 4. Weighted Lottery Selection
    const totalWeight = weightedAds.reduce((sum, item) => sum + item.weight, 0);
    let randomThreshold = Math.random() * totalWeight;
    let selectedAd = weightedAds[0].ad;

    for (const item of weightedAds) {
      if (randomThreshold <= item.weight) {
        selectedAd = item.ad;
        break;
      }
      randomThreshold -= item.weight;
    }

    // Cache selected ad for 30 seconds
    await setCache(cacheKey, selectedAd, 30);

    res.json({ success: true, ad: selectedAd, isFallback: false });
  } catch (error) {
    console.error('[Get Ads Error]:', error);
    const fallback = DEFAULT_FALLBACK_ADS[req.params.placement] || DEFAULT_FALLBACK_ADS.homepage_hero_bottom;
    res.json({ success: true, ad: fallback, isFallback: true });
  }
};

// 2. RECORD AD IMPRESSION (Triggered by client IntersectionObserver)
exports.recordImpression = async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('default-fallback')) {
      return res.json({ success: true, message: 'Fallback ad view ignored' });
    }

    await AdCampaign.findByIdAndUpdate(id, { $inc: { impressionsCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. RECORD AD CLICK
exports.recordClick = async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('default-fallback')) {
      return res.json({ success: true, message: 'Fallback ad click ignored' });
    }

    await AdCampaign.findByIdAndUpdate(id, { $inc: { clicksCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. ADMIN: GET ALL AD CAMPAIGN ANALYTICS & LIST
exports.getAdminAdCampaigns = async (req, res) => {
  try {
    const campaigns = await AdCampaign.find({}).sort({ createdAt: -1 });

    const formattedCampaigns = campaigns.map((campaign) => {
      const obj = campaign.toObject();
      const impressions = obj.impressionsCount || 0;
      const clicks = obj.clicksCount || 0;
      obj.ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0.00%';
      return obj;
    });

    res.json({ success: true, count: formattedCampaigns.length, campaigns: formattedCampaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. ADMIN: CREATE AD CAMPAIGN
exports.createAdCampaign = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (Array.isArray(payload.placements) && payload.placements.length > 0) {
      payload.placement = payload.placements[0];
    } else if (payload.placement) {
      payload.placements = [payload.placement];
    }
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    if (payload.endDate) payload.endDate = new Date(payload.endDate);
    else payload.endDate = null;

    const newCampaign = new AdCampaign(payload);
    await newCampaign.save();

    await deleteCacheByPattern('ad:placement:*');

    res.status(201).json({ success: true, message: 'Ad campaign created successfully', campaign: newCampaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 6. ADMIN: UPDATE AD CAMPAIGN
exports.updateAdCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (Array.isArray(payload.placements) && payload.placements.length > 0) {
      payload.placement = payload.placements[0];
    } else if (payload.placement) {
      payload.placements = [payload.placement];
    }
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    if (payload.endDate) payload.endDate = new Date(payload.endDate);
    else payload.endDate = null;

    const campaign = await AdCampaign.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Ad campaign not found' });
    }

    await deleteCacheByPattern('ad:placement:*');

    res.json({ success: true, message: 'Ad campaign updated successfully', campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 7. ADMIN: DELETE AD CAMPAIGN
exports.deleteAdCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await AdCampaign.findByIdAndDelete(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Ad campaign not found' });
    }

    await deleteCacheByPattern('ad:placement:*');

    res.json({ success: true, message: 'Ad campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. ADMIN: GET GLOBAL ADS STATUS
exports.getGlobalAdsStatus = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      settings = new SiteSettings({});
      await settings.save();
    }

    res.json({ success: true, adsEnabled: settings.adsEnabled !== false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. ADMIN: TOGGLE GLOBAL ADS MASTER SWITCH (MAKE WEBSITE AD-FREE OR ENABLE ADS)
exports.toggleGlobalAdsStatus = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      settings = new SiteSettings({});
    }

    const nextStatus = req.body.adsEnabled !== undefined ? Boolean(req.body.adsEnabled) : !settings.adsEnabled;
    settings.adsEnabled = nextStatus;
    await settings.save();

    await deleteCacheByPattern('ad:placement:*');

    res.json({
      success: true,
      adsEnabled: settings.adsEnabled,
      message: settings.adsEnabled
        ? 'Ads enabled platform-wide! Banners will display.'
        : 'Ads disabled platform-wide! Website is now 100% Ad-Free 🚫📢'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
