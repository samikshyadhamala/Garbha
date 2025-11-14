const User = require("../models/User");
const UserProfile = require("../models/userProfile");
const UserPregnancyProfile = require("../models/userPregnancyProfile");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MINUTES = 2;
const MAX_DAILY_OTP_REQUESTS = 10;


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const checkDailyOTPLimit = (user) => {
  if (!user.otpRequestCount || !user.otpRequestCountResetDate) {
    return false;
  }

  const now = new Date();
  const resetDate = new Date(user.otpRequestCountResetDate);

  // Reset counter if it's a new day
  if (now.toDateString() !== resetDate.toDateString()) {
    return false;
  }

  return user.otpRequestCount >= MAX_DAILY_OTP_REQUESTS;
};

/**
 * Check if user needs to wait before requesting another OTP
 */
const checkOTPCooldown = (user) => {
  if (!user.lastOtpSentAt) return false;

  const cooldownMs = OTP_RESEND_COOLDOWN_MINUTES * 60 * 1000;
  const timeSinceLastOTP = Date.now() - new Date(user.lastOtpSentAt).getTime();

  return timeSinceLastOTP < cooldownMs;
};

/**
 * Update OTP request tracking
 */
const updateOTPTracking = (user) => {
  const now = new Date();

  // Reset daily counter if it's a new day
  if (!user.otpRequestCountResetDate ||
    now.toDateString() !== new Date(user.otpRequestCountResetDate).toDateString()) {
    user.otpRequestCount = 0;
    user.otpRequestCountResetDate = now;
  }

  user.otpRequestCount = (user.otpRequestCount || 0) + 1;
  user.lastOtpSentAt = now;
};

function calculatePregnancyInfo(daysPregnant) {
  if (typeof daysPregnant !== "number" || daysPregnant < 0) {
    throw new Error("Invalid input: daysPregnant must be a non-negative number");
  }

  const weeks = Math.floor(daysPregnant / 7);
  const days = daysPregnant % 7;

  // Calculate start date
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - daysPregnant);

  return {
    weeks,
    days,
    formattedWeeks: `${weeks} week(s) and ${days} day(s)`,
    currentDate: currentDate.toISOString().split("T")[0], // YYYY-MM-DD
    pregnancyStartDate: startDate.toISOString().split("T")[0] // YYYY-MM-DD
  };
}

/**
 * Process list fields for pregnancy profile
 */
const processListField = (field) => {
  if (!field) return ["none"];
  if (Array.isArray(field)) return field.length ? field : ["none"];
  return field.split(",").map(f => f.trim()).filter(f => f) || ["none"];
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// -------------------- SIGNUP: SEND OTP --------------------
exports.sendOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    // Check if user already exists and is verified
    if (user && user.isVerified) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please login instead.",
      });
    }

    // Check daily OTP limit
    if (user && checkDailyOTPLimit(user)) {
      return res.status(429).json({
        success: false,
        message: "Maximum OTP requests exceeded for today. Please try again tomorrow.",
      });
    }
 
    // Check OTP cooldown
    // if (user && checkOTPCooldown(user)) {
    //   const waitTime = OTP_RESEND_COOLDOWN_MINUTES;
    //   return res.status(429).json({
    //     success: false,
    //     message: `Please wait ${waitTime} minutes before requesting another OTP.`,
    //   });
    // }

    // Generate new OTP
    const otpCode = generateOTP();

    // Create new user or update existing unverified user
    if (!user) {
      user = new User({
        email: normalizedEmail,
        tempFirstName: firstName.trim(),
        tempLastName: lastName.trim(),
        tempPassword: password.trim(),
      });
    } else {
      // Update temp data for unverified user
      user.tempFirstName = firstName.trim();
      user.tempLastName = lastName.trim();
      user.tempPassword = password.trim();
    }

    // Set OTP and tracking data
    user.otp = otpCode;
    user.otpExpires = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
    user.otpAttempts = 0; // Reset attempts when new OTP is sent
    updateOTPTracking(user);

    await user.save();

    // Send OTP email
    try {
      await sendEmail(
        normalizedEmail,
        "Your OTP Verification Code",
        `Your OTP code is ${otpCode}. This code will expire in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this code, please ignore this email.`
      );
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again."
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      expiresIn: OTP_EXPIRY_MINUTES
    });

  } catch (error) {
    console.error("Error in sendOtp:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// -------------------- VERIFY OTP (Basic Verification Only) --------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    console.log("this is email : ", email)
    console.log("this is otp : ", otp)
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    console.log("this is normalized : ", normalizedEmail)
    const user = await User.findOne({ email: normalizedEmail });
    console.log("this is user : ", user)

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "User is already verified. Please login." 
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpires){
      return res.status(400).json({ 
        success: false, 
        message: "No OTP found. Please request a new OTP." 
      });
    }

    // Check OTP expiration
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP has expired. Please request a new OTP." 
      });
    }

    // Check max attempts
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      // Clear OTP to force user to request new one
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save();
      
      return res.status(429).json({ 
        success: false, 
        message: "Maximum OTP verification attempts exceeded. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (user.otp !== otp.toString()) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      
      const remainingAttempts = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      });
    }

    // OTP is valid - Finalize user verification and create profile
    const firstName = user.tempFirstName;
    const lastName = user.tempLastName;
    const password = user.tempPassword;

    if (!firstName || !lastName || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "User data incomplete. Please sign up again." 
      });
    }

    // Create the UserProfile
    const userProfile = new UserProfile({
      user: user._id,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      password: password, // The password from tempPassword will be hashed by the pre-save hook in User model
    });
    await userProfile.save();

    // Update the main User document
    user.isVerified = true;
    user.password = password; // Move password to permanent field
    user.tempFirstName = undefined;
    user.tempLastName = undefined;
    user.tempPassword = undefined;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. Profile created.",
      token,
      userId: user._id,
      profile: userProfile,
      requiresProfileCompletion: false // Profile is now complete
    });

  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while verifying OTP",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};  


// -------------------- COMPLETE PROFILE (Separate Step) --------------------
exports.completeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { age, profileImage, pregnancyData } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    // Get temp names
    const firstName = user.tempFirstName;
    const lastName = user.tempLastName;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "User information incomplete"
      });
    }

    // Create general profile
    let profile = await UserProfile.findOne({ user: userId });

    if (!profile) {
      profile = new UserProfile({
        user: userId,
        email: user.email,
        firstName,
        lastName,
        age: age || null,
        profileImage: profileImage || null,
      });
      await profile.save();

      // Clear temp names after profile creation
      user.tempFirstName = undefined;
      user.tempLastName = undefined;
      await user.save();
    } else {
      // Update existing profile
      if (age) profile.age = age;
      if (profileImage) profile.profileImage = profileImage;
      await profile.save();
    }

    // Create pregnancy profile if data provided
    let pregnancyProfile = null;

    if (pregnancyData) {
      pregnancyProfile = await UserPregnancyProfile.findOne({ user: userId });

      if (!pregnancyProfile) {
        if (pregnancyData.weeksPregnant == null) {
          return res.status(400).json({
            success: false,
            message: "Weeks pregnant is required for pregnancy profile"
          });
        }

        const pregnancyDataProcessed = {
          ...pregnancyData,
          preExistingConditions: processListField(pregnancyData.preExistingConditions),
          allergies: processListField(pregnancyData.allergies),
          medications: processListField(pregnancyData.medications),
          lifestyle: {
            smoke: pregnancyData.lifestyle?.smoke ?? false,
            alcohol: pregnancyData.lifestyle?.alcohol ?? false,
            familyHistoryPregnancyComplications:
              pregnancyData.lifestyle?.familyHistoryPregnancyComplications ?? false,
          },
          preferredName: pregnancyData.preferredName || "none",
          height: pregnancyData.height ?? null,
          weightBeforePregnancy: pregnancyData.weightBeforePregnancy ?? null,
        };

        pregnancyProfile = new UserPregnancyProfile({
          user: userId,
          ...pregnancyDataProcessed
        });
        await pregnancyProfile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      profile,
      pregnancyProfile,
    });

  } catch (error) {
    console.error("Error in completeProfile:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while completing profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(email)
    console.log(password)

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    console.log("STEP 1 clear")

    const normalizedEmail = email.trim().toLowerCase();
    console.log("Normalized : ", normalizedEmail)
    const user = await UserProfile.findOne({ email: normalizedEmail });
    console.log("STEP 2 clear")
    console.log("User : ", user)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    console.log("STEP 3 clear")

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first. Check your inbox for the OTP."
      });
    }
    console.log("STEP 4 clear")

    console.log("USER password : ", user.password)

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    console.log("STEP 5 clear")

    // Verify password
    const match = await user.matchPassword(password.trim(), user.password);
    console.log("mathch", match)

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    console.log("STEP 6 clear")

    // Fetch user profiles
    const profile = await UserProfile.findOne({ user: user._id });
    console.log("Profile", profile)
    const pregnancyProfile = await UserPregnancyProfile.findOne({ user: user._id });

    // Generate token
    const token = generateToken(user._id);
    console.log("token", token)

    res.status(200).json({
      success: true,
      message: "Login successful",
      profile,
      pregnancyProfile,
      token
    });

  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -------------------- GET GENERAL PROFILE --------------------
exports.getUserProfile = async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ user: req.user.id });
    console.log("Profile : ", profile)

    // If profile doesn't exist for a valid user, create one
    if (!profile) {
      // The req.user object from the 'protect' middleware might not have all fields.
      // It's better to fetch the full user document.
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      profile = new UserProfile({
        user: user._id,
        email: user.email,
        firstName: user.firstName || "Firstname", // Fallback value
        lastName: user.lastName || "Lastname",   // Fallback value
        password: user.password,
      });
      await profile.save();
    }

    res.status(200).json({ success: true, profile });

  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while fetching profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -------------------- UPDATE GENERAL PROFILE --------------------
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    const profile = await UserProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Prevent updating protected fields
    delete data.user;
    delete data._id;
    delete data.email;

    Object.assign(profile, data);
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile
    });

  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// -------------------- CREATE/UPDATE PREGNANCY PROFILE --------------------
exports.createOrUpdatePregnancyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    console.log("this si suserid : ", userId)
    console.log("this si data : ", data)
    
    // Validation
    if (!data.bloodType) {
      return res.status(400).json({
        success: false,
        message: "Blood type is required"
      });
    }
    console.log("I have passed blood type")
    
    const numberdays = Number(data.pregnantDays)
    console.log("Numberdays: ", numberdays)
    const Weeks = calculatePregnancyInfo(numberdays)
    console.log("weeks: ", Weeks)
    


    // if (data.weeksPregnant == null) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: "Weeks pregnant is required" 
    //   });
    // }

    // Parse dates
    if (data.lmp) data.lmp = new Date(data.lmp);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    const pregnancyDataProcessed = {
      ...data,
      preExistingConditions: processListField(data.preExistingConditions),
      allergies: processListField(data.allergies),
      medications: processListField(data.medications),
      weeksPregnant: Weeks.weeks,
      lifestyle: {
        smoke: data.lifestyle?.smoke ?? false,
        alcohol: data.lifestyle?.alcohol ?? false,
        familyHistoryPregnancyComplications:
          data.lifestyle?.familyHistoryPregnancyComplications ?? false,
      },
      preferredName: data.preferredName || "none",
      height: data.height ?? null,
      weightBeforePregnancy: data.weightBeforePregnancy ?? null,
    };

    let profile = await UserPregnancyProfile.findOne({ user: userId });

    if (profile) {
      // Update existing profile
      Object.assign(profile, pregnancyDataProcessed);
      await profile.save();

      return res.status(200).json({
        success: true,
        message: "Pregnancy profile updated successfully",
        profile
      });
    } else {
      // Create new profile
      profile = new UserPregnancyProfile({
        user: userId,
        ...pregnancyDataProcessed
      });
      await profile.save();

      return res.status(201).json({
        success: true,
        message: "Pregnancy profile created successfully",
        profile
      });
    }

  } catch (error) {
    console.error("Error in createOrUpdatePregnancyProfile:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing pregnancy profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -------------------- GET PREGNANCY PROFILE --------------------
exports.getPregnancyProfile = async (req, res) => {
  try {
    const profile = await UserPregnancyProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Pregnancy profile not found"
      });
    }

    res.status(200).json({ success: true, profile });

  } catch (error) {
    console.error("Error in getPregnancyProfile:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pregnancy profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
