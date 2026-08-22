const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer storage using Cloudinary engine (Forces WebP format & optimization)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quiz_avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    format: 'webp', // Automatically converts and saves all uploads as WebP
    transformation: [
      { width: 500, height: 500, crop: 'limit', quality: 'auto', fetch_format: 'webp' }
    ]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = { cloudinary, upload };
