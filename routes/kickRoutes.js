const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const kickController = require("../controllers/kickController");


const router = express.Router();

// Protect all routes
router.use(protect);

// Get or create today’s session
router.post("/today", kickController.getOrCreateTodaySession);

// Add a kick (sessionId optional)
router.post("/add", kickController.addKick);

// Remove last kick (sessionId optional)
router.post("/remove", kickController.removeKick);

// Get summary / chart data
router.get("/summary", kickController.getSummary);

module.exports = router;
