
const express = require("express");
const router = express.Router();
const { getProgress } = require("../controllers/daysCalculated");

// Use :userId as route parameter
router.get("/:userId/progress", getProgress);

module.exports = router;
