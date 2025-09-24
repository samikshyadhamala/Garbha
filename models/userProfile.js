const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  age: { type: Number, required: true },
  profileImage: { type: String }, // optional
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
