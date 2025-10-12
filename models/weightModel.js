const mongoose = require("mongoose");

const weightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true },
    weight: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now }, // stores timestamp
  },
  { timestamps: true }
);

module.exports = mongoose.model("Weight", weightSchema);
