const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Load env variables if not already loaded

// ==========================================
// CLOUDINARY CONFIGURATION
// Analogy: We are giving the "off-site storage facility" (Cloudinary)
// our ID card so they know whose files these are.
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==========================================
// MULTER STORAGE SETUP
// Analogy: Giving instructions to the "bellhop" (Multer).
// We tell them: "Take the guest's suitcase, put it in the 'opsgenie-logs' warehouse,
// and make sure you write down the original file name on the label."
// ==========================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'opsgenie-logs', // Cloudinary folder name where files will be saved
    resource_type: 'auto', // Automatically detect if it's an image, raw file (.log), etc.
    public_id: (req, file) => file.originalname.split('.')[0] + '-' + Date.now() // Unique name
  }
});

// Create the actual middleware function
// This 'upload' object has methods like upload.single('file') or upload.array('files')
const upload = multer({ storage: storage });

module.exports = upload;
