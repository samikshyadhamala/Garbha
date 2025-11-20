const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const summaryController = require("../controllers/summaryController");

router.use(protect);

router.get("/", summaryController.getSummary);

router.get("/pdf", summaryController.downloadSummaryPDF);

module.exports = router;