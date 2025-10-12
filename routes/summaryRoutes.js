// routes/summaryRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const summaryController = require("../controllers/summaryController");

// Protect all summary routes
router.use(protect);

// GET JSON summary: /api/summary?type=weekly or type=monthly
router.get("/", summaryController.getSummary);

// GET PDF summary: /api/summary/pdf
router.get("/pdf", summaryController.downloadSummaryPDF);

module.exports = router;
