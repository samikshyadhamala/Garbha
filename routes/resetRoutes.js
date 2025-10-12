const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const resetController = require("../controllers/resetController");

router.use(protect);

router.post("/pregnancy", resetController.resetPregnancy);

module.exports = router;
