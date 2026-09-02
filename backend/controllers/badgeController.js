const User = require('../models/User');

/**
 * Dynamic GitHub README Badge Endpoint (.svg)
 * Generates responsive SVG badge markup embeddable in GitHub READMEs & portfolios.
 * URL: GET /api/badges/user/:userId/:category.svg
 */
exports.generateGithubBadgeSvg = async (req, res) => {
  try {
    const { userId, category = 'Developer' } = req.params;
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9 &]/g, '').trim() || 'Tech';

    let userName = 'Developer';
    let coins = 150;

    if (userId && userId !== 'demo') {
      const user = await User.findById(userId).select('name brainCoins');
      if (user) {
        userName = user.name || 'Developer';
        coins = user.brainCoins || 100;
      }
    }

    const categoryTitle = `${sanitizedCategory} Master`;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="120" viewBox="0 0 380 120" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Main Dark Card Frame -->
  <rect width="380" height="120" rx="20" fill="url(#bgGrad)" stroke="#312e81" stroke-width="2"/>
  <rect x="2" y="2" width="376" height="116" rx="18" fill="none" stroke="#6366f1" stroke-width="1" stroke-opacity="0.3"/>

  <!-- Left Shield Emblem -->
  <g transform="translate(18, 20)">
    <circle cx="40" cy="40" r="34" fill="url(#badgeGrad)" filter="url(#glow)"/>
    <circle cx="40" cy="40" r="30" fill="#0f172a" stroke="#818cf8" stroke-width="2"/>
    <text x="40" y="48" font-family="'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" fill="url(#goldGrad)" text-anchor="middle">⚡</text>
  </g>

  <!-- Content Section -->
  <g transform="translate(105, 30)">
    <!-- Top Tagline -->
    <text x="0" y="12" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#818cf8" letter-spacing="1.5">VERIFIED SKILL BADGE</text>
    
    <!-- Title -->
    <text x="0" y="36" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#ffffff">${categoryTitle}</text>
    
    <!-- Subtitle / User Name -->
    <text x="0" y="56" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#94a3b8">Issued to <tspan fill="#f3f4f6" font-weight="700">${userName}</tspan></text>
  </g>

  <!-- Right Footer Tag -->
  <g transform="translate(260, 85)">
    <rect width="105" height="22" rx="11" fill="#1e293b" stroke="#334155"/>
    <text x="52.5" y="15" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#38bdf8" text-anchor="middle">brainarena.in ↗</text>
  </g>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svgContent);
  } catch (error) {
    console.error('[Badge SVG Error]:', error);
    res.status(500).send('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text y="25" fill="red">Badge Error</text></svg>');
  }
};
