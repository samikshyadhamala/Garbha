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

// Apply auth middleware to all routes
router.use(protect);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, DOC, DOCX files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Routes
router.post("/upload", upload.single("document"), uploadDocument);
router.get("/", getDocuments);
router.get("/download/:id", downloadDocument);
router.delete("/:id", deleteDocument);
router.get("/view/:id", viewDocument);

module.exports = router;
