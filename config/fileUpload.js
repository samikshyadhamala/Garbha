const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure where files are saved
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/chat-attachments';
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-randomnumber-originalname.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
  }
});

// Define which file types are allowed
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and Word docs allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max per file
  },
  fileFilter: fileFilter
});

// Middleware for chat attachments
const uploadChatAttachment = (req, res, next) => {
  // Allow up to 5 files at once
  upload.array('attachments', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max size is 10MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Max 5 files allowed.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    // Format file data for the database
    if (req.files && req.files.length > 0) {
      req.attachmentData = req.files.map(file => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
        url: `/uploads/chat-attachments/${file.filename}`, // URL to access the file
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      }));
    } else {
      req.attachmentData = [];
    }
    
    next();
  });
};

module.exports = {
  upload,
  uploadChatAttachment
};