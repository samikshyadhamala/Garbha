const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addWeight,
  getRecentWeights,
  getWeightsByMonth,
  getWeeklyStats,
  getAllWeights,
  updateWeight,
  deleteWeight,
  getPopulatedWeights,
} = require("../controllers/weightController");

// Use protect middleware for all routes
router.use(protect);

// Create a new weight entry
router.post("/", addWeight);

// Specific routes first
router.get("/recent", getRecentWeights);
router.get("/month", getWeightsByMonth);
router.get("/weekly", getWeeklyStats);
router.get("/populated", getPopulatedWeights);

// Generic route last
router.get("/", getAllWeights);

// Update and delete by weightId
router.put("/:weightId", updateWeight);
router.delete("/:weightId", deleteWeight);

module.exports = router;
