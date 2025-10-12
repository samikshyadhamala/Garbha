const User = require("../models/User");
const UserProfile = require("../models/userProfile");
const UserPregnancyProfile = require("../models/userPregnancyProfile");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");

// -------------------- SEND OTP --------------------
exports.sendOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "First name, last name, email, and password are required" });
    }

    let user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user && user.isVerified) {
      return res.status(200).json({
        success: true,
        isExistingUser: true,
        message: "User already registered",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    if (!user) {
      user = new User({
        email: email.trim().toLowerCase(),
        tempFirstName: firstName.trim(),
        tempLastName: lastName.trim(),
        tempPassword: password.trim(),
      });
    } else {
      user.tempFirstName = firstName.trim();
      user.tempLastName = lastName.trim();
      user.tempPassword = password.trim();
    }

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
    const { email, otp, age, profileImage, pregnancyData } = req.body; 
    // pregnancyData will contain all fields from pregnancy profile

    if (!email || !otp) 
      return res.status(400).json({ success: false, message: "Email & OTP required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) 
      return res.status(400).json({ success: false, message: "User not found" });

    if (!user.otp || !user.otpExpires || user.otp !== otp.toString() || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // finalize verification
    user.isVerified = true;

    if (user.tempPassword) {
      user.password = user.tempPassword;
      user.tempPassword = undefined;
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // create general profile if not exists
    let profile = await UserProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new UserProfile({
        user: user._id,
        email: user.email,
        firstName: user.tempFirstName || "",
        lastName: user.tempLastName || "",
        age,
        profileImage,
      });
      await profile.save();

      user.tempFirstName = undefined;
      user.tempLastName = undefined;
      await user.save();
    }

    // Helper to process comma-separated string or empty array
    const processListField = (field) => {
      if (!field) return ["none"];
      if (Array.isArray(field)) return field.length ? field : ["none"];
      return field.split(",").map(f => f.trim()).filter(f => f) || ["none"];
    };

    // -------------------- CREATE PREGNANCY PROFILE AT SIGN-UP --------------------
    let pregnancyProfile = await UserPregnancyProfile.findOne({ user: user._id });
    if (!pregnancyProfile && pregnancyData) {
      // ensure weeksPregnant is provided
      if (pregnancyData.weeksPregnant == null) {
        return res.status(400).json({ success: false, message: "Weeks pregnant is required" });
      }

      const pregnancyDataProcessed = {
        ...pregnancyData,
        preExistingConditions: processListField(pregnancyData.preExistingConditions),
        allergies: processListField(pregnancyData.allergies),
        medications: processListField(pregnancyData.medications),
        lifestyle: {
          smoke: pregnancyData.lifestyle?.smoke ?? false,
          alcohol: pregnancyData.lifestyle?.alcohol ?? false,
          familyHistoryPregnancyComplications: pregnancyData.lifestyle?.familyHistoryPregnancyComplications ?? false,
        },
        preferredName: pregnancyData.preferredName || "none",
        height: pregnancyData.height ?? null,
        weightBeforePregnancy: pregnancyData.weightBeforePregnancy ?? null,
      };

      pregnancyProfile = new UserPregnancyProfile({ user: user._id, ...pregnancyDataProcessed });
      await pregnancyProfile.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      profile,
      pregnancyProfile,
      token,
      message: "OTP verified and user registered successfully",
    });
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
// -------------------- CREATE/UPDATE PREGNANCY PROFILE --------------------
exports.createOrUpdatePregnancyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    // Validate required fields
    if (!data.bloodType) {
      return res.status(400).json({ success: false, message: "Blood type is required" });
    }
    if (data.weeksPregnant == null) {
      return res.status(400).json({ success: false, message: "Weeks pregnant is required" });
    }

    // Convert LMP and dueDate to Date objects
    if (data.lmp) data.lmp = new Date(data.lmp);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    // Helper to process comma-separated string or empty array
    const processListField = (field) => {
      if (!field) return ["none"];
      if (Array.isArray(field)) return field.length ? field : ["none"];
      return field.split(",").map(f => f.trim()).filter(f => f) || ["none"];
    };

    const pregnancyDataProcessed = {
      ...data,
      preExistingConditions: processListField(data.preExistingConditions),
      allergies: processListField(data.allergies),
      medications: processListField(data.medications),
      lifestyle: {
        smoke: data.lifestyle?.smoke ?? false, // required dropdown
        alcohol: data.lifestyle?.alcohol ?? false, // required dropdown
        familyHistoryPregnancyComplications: data.lifestyle?.familyHistoryPregnancyComplications ?? false,
      },
      preferredName: data.preferredName || "none",
      height: data.height ?? null,
      weightBeforePregnancy: data.weightBeforePregnancy ?? null,
    };

    // Find existing profile
    let profile = await UserPregnancyProfile.findOne({ user: userId });

    if (profile) {
      // Update existing profile
      Object.assign(profile, pregnancyDataProcessed);
      await profile.save();
      return res.status(200).json({ success: true, message: "Pregnancy profile updated", profile });
    } else {
      // Create new profile
      profile = new UserPregnancyProfile({ user: userId, ...pregnancyDataProcessed });
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
