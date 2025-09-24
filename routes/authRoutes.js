const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

// -------------------- AUTH & OTP --------------------
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/set-password-profile", authController.setPasswordProfile);
router.post("/login", authController.login);

// -------------------- GENERAL PROFILE --------------------
router.get("/profile", protect, authController.getUserProfile);
router.put("/profile", protect, authController.updateUserProfile);

// -------------------- PREGNANCY PROFILE --------------------
router.get("/pregnancy-profile", protect, authController.getPregnancyProfile);
router.post("/pregnancy-profile", protect, authController.createOrUpdatePregnancyProfile);
router.put("/pregnancy-profile", protect, authController.createOrUpdatePregnancyProfile);

module.exports = router;
