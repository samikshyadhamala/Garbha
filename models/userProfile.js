const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: {
      type: String,
      select: false, // Don't return password by default in queries
    },
    firstLogin : { type: Boolean, required: false, default:true },
    isVerified: {
      type: Boolean,
      default: false,
    },
  createdAt: { type: Date, default: Date.now },

});

module.exports = mongoose.model("UserProfile", userProfileSchema);
