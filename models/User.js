const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false, // Don't return password by default in queries
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    // Temporary fields (used during registration before verification)
    tempFirstName: String,
    tempLastName: String,
    tempPassword: String,
    
    // OTP fields
    otp: String,
    otpExpires: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },
    
    // OTP rate limiting fields
    otpRequestCount: {
      type: Number,
      default: 0,
    },
    otpRequestCountResetDate: Date,
    lastOtpSentAt: Date,
    
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }
  
  // Don't hash if password is undefined
  if (!this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash temp password before saving
userSchema.pre("save", async function (next) {
  // Only hash the temp password if it has been modified (or is new)
  if (!this.isModified("tempPassword")) {
    return next();
  }
  
  // Don't hash if tempPassword is undefined
  if (!this.tempPassword) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.tempPassword = await bcrypt.hash(this.tempPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if account is locked (can be extended)
userSchema.methods.isAccountLocked = function () {
  return !this.isActive;
};

// Index for faster queries
userSchema.index({ email: 1, isVerified: 1 });
userSchema.index({ otpExpires: 1 }); // For cleanup queries

const User = mongoose.model("User", userSchema);

module.exports = User;