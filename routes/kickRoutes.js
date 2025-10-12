const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const kickController = require("../controllers/kickController");
router.use(protect);
// Get or create today’s session
router.post("/today", kickController.getOrCreateTodaySession);

// Add a kick
router.post("/add", kickController.addKick);

// Remove last kick
router.post("/remove", kickController.removeKick);

// Get summary / chart data
router.get("/summary", kickController.getSummary);

module.exports = router;
