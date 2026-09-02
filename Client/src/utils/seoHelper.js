/**
 * Dynamic SEO & Head Meta Manager for brainArena
 * Updates document.title, meta description, keywords, canonical URLs, and OpenGraph meta tags dynamically.
 */
export const updatePageSEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage
}) => {
  if (typeof document === 'undefined') return;

  // 1. Update Document Title
  if (title) {
    document.title = title.includes('brainArena') ? title : `${title} | brainArena`;
  }

  // 2. Update Meta Description
  if (description) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Also update OG description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
  }

  // 3. Update Meta Keywords
  if (keywords) {
    let metaKw = document.querySelector('meta[name="keywords"]');
    if (!metaKw) {
      metaKw = document.createElement('meta');
      metaKw.setAttribute('name', 'keywords');
      document.head.appendChild(metaKw);
    }
    metaKw.setAttribute('content', keywords);
  }

  // 4. Update Canonical URL
  if (canonical) {
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    const fullCanonical = canonical.startsWith('http') ? canonical : `https://brainarena.in${canonical}`;
    linkCanonical.setAttribute('href', fullCanonical);
  }

  // 5. Update OpenGraph Image
  if (ogImage) {
    let metaOgImage = document.querySelector('meta[property="og:image"]');
    if (metaOgImage) metaOgImage.setAttribute('content', ogImage);
  }
};
