// documentroutes.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument,
  viewDocument
} = require("../controllers/documentController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Allow PDFs, DOC/DOCX, and images
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/octet-stream" // add as fallback while testing
];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, DOC, DOCX, JPG, PNG, GIF files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Routes
router.post("/upload",upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/download/:id", downloadDocument);
router.delete("/:id", deleteDocument);
router.get("/view/:id", viewDocument);

module.exports = router;
