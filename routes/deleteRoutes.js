const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const deleteController = require("../controllers/deleteController");

router.use(protect);
router.delete("/account", deleteController.deleteAccount);

module.exports = router;
