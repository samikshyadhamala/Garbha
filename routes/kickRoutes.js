const express = require("express");
const router = express.Router();
const kickController = require("../controllers/kickController");

// Get or create today’s session
router.post("/today", kickController.getOrCreateTodaySession);

// Add a kick
router.post("/add", kickController.addKick);

// Remove last kick
router.post("/remove", kickController.removeKick);

// Get summary / chart data
router.get("/summary", kickController.getSummary);

module.exports = router;
