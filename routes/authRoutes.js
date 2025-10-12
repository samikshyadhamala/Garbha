const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware"); // Your auth middleware

// -------------------- PUBLIC ROUTES --------------------

// Step 1: Send OTP during signup
router.post("/signup/send-otp", authController.sendOtp);

// Step 2: Verify OTP (completes basic registration)
router.post("/signup/verify-otp", authController.verifyOtp);

// Login
router.post("/login", authController.login);

// -------------------- PROTECTED ROUTES --------------------

// Step 3: Complete profile after OTP verification (requires auth token)
router.post("/profile/complete", protect, authController.completeProfile);

// Get user profile
router.get("/profile", protect, authController.getUserProfile);

// Update user profile
router.put("/profile", protect, authController.updateUserProfile);

// Get pregnancy profile
router.get("/pregnancy-profile", protect, authController.getPregnancyProfile);

// Create or update pregnancy profile
router.post("/pregnancy-profile", protect, authController.createOrUpdatePregnancyProfile);
router.put("/pregnancy-profile", protect, authController.createOrUpdatePregnancyProfile);

module.exports = router;