const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and text files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Middleware to process uploaded files
const processUploadedFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    req.attachmentData = [];
    return next();
  }
  
  req.attachmentData = req.files.map(file => ({
    type: file.mimetype.startsWith('image/') ? 'image' : 
          file.mimetype === 'application/pdf' ? 'pdf' : 'document',
    url: `/uploads/chat/${file.filename}`,
    path: file.path,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype
  }));
  
  next();
};

module.exports = {
  upload,
  processUploadedFiles
};