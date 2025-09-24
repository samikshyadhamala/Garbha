const express = require("express");
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument,
  viewDocument
} = require("../controllers/documentController");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Always resolve to correct absolute path
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter with proper error handling
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX files are allowed"), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Routes
router.post("/upload", protect, upload.single("document"), uploadDocument);
router.get("/", protect, getDocuments);
router.get("/download/:id", protect, downloadDocument);
router.delete("/:id", protect, deleteDocument);
router.get("/view/:id", protect, viewDocument);

module.exports = router;
