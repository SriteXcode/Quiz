const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer storage using Cloudinary engine (Forces WebP format & optimization for avatars)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quiz_avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    format: 'webp',
    transformation: [
      { width: 500, height: 500, crop: 'limit', quality: 'auto', fetch_format: 'webp' }
    ]
  }
});

// Configure General Image storage for Quiz Posters, Language Logos, Partner Logos
const generalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quiz_platform_assets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadGeneralImage = multer({
  storage: generalStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = { cloudinary, upload, uploadGeneralImage };

