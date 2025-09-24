const User = require("../models/User");
const UserProfile = require("../models/userProfile");
const UserPregnancyProfile = require("../models/userPregnancyProfile");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");

// -------------------- SEND OTP --------------------
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    let user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user && user.isVerified) {
      return res.status(200).json({
        success: true,
        isExistingUser: true,
        message: "User already registered",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000);
    if (!user) user = new User({ email: email.trim().toLowerCase() });

    user.otp = otpCode.toString();
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    await sendEmail(email, "Your OTP Code", `Your OTP is ${otpCode}. Expires in 10 minutes.`);

    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------- VERIFY OTP --------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email & OTP required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    if (!user.otp || !user.otpExpires || user.otp !== otp.toString() || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const profile = await UserProfile.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      isNewUser: !profile,
      message: "OTP verified, please set password & profile if new",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------- SET PASSWORD & CREATE PROFILE --------------------
exports.setPasswordProfile = async (req, res) => {
  try {
    const { email, password, firstName, lastName, age, profileImage } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.isVerified) return res.status(400).json({ success: false, message: "Email not verified" });
    if (user.password) return res.status(400).json({ success: false, message: "Password already set" });

    // Assign plain password; pre-save hook will hash it
    user.password = password.trim();
    await user.save();

    const profile = new UserProfile({
      user: user._id,
      email: user.email,
      firstName,
      lastName,
      age,
      profileImage,
    });
    await profile.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ success: true, profile, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.password) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const match = await user.matchPassword(password.trim());
    if (!match) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const profile = await UserProfile.findOne({ user: user._id });
    const pregnancyProfile = await UserPregnancyProfile.findOne({ user: user._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ success: true, profile, pregnancyProfile, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------- GET GENERAL PROFILE --------------------
exports.getUserProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------- UPDATE GENERAL PROFILE --------------------
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    Object.assign(profile, data);
    await profile.save();

    res.status(200).json({ success: true, message: "Profile updated", profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------- CREATE/UPDATE PREGNANCY PROFILE --------------------
exports.createOrUpdatePregnancyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    if (!data.bloodType) return res.status(400).json({ success: false, message: "Blood type is required" });
    if (data.lmp) data.lmp = new Date(data.lmp);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    let profile = await UserPregnancyProfile.findOne({ user: userId });
    if (profile) {
      Object.assign(profile, data);
      await profile.save();
      return res.status(200).json({ success: true, message: "Pregnancy profile updated", profile });
    } else {
      profile = new UserPregnancyProfile({ user: userId, ...data });
      await profile.save();
      return res.status(201).json({ success: true, message: "Pregnancy profile created", profile });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// -------------------- GET PREGNANCY PROFILE --------------------
exports.getPregnancyProfile = async (req, res) => {
  try {
    const profile = await UserPregnancyProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: "Pregnancy profile not found" });
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
