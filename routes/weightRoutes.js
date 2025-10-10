const express = require("express");
const router = express.Router();
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

// Routes

// Create a new weight entry
router.post("/", addWeight);

// Specific routes first
router.get("/:userId/recent", getRecentWeights);
router.get("/:userId/month", getWeightsByMonth);
router.get("/:userId/weekly", getWeeklyStats);
router.get("/:userId/populated", getPopulatedWeights);

// Generic route last
router.get("/:userId", getAllWeights);

// Update and delete by weightId
router.put("/:weightId", updateWeight);
router.delete("/:weightId", deleteWeight);

module.exports = router;
console.log({
  addWeight,
  getAllWeights,
  getRecentWeights,
  getWeightsByMonth,
  getWeeklyStats,
  updateWeight,
  deleteWeight,
  getPopulatedWeights,
});
