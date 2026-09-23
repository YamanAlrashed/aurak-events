const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { badRequest } = require('../utils/errors');

// Photos are saved to backend/uploads and served at /uploads/<file>.
// For production, swap diskStorage for S3 / Cloudflare R2 / Supabase Storage.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`)
});

const uploadPhoto = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) return cb(badRequest('Only JPG, PNG or WEBP images are allowed'));
    cb(null, true);
  }
}).single('photo');

module.exports = { uploadPhoto, UPLOAD_DIR };
