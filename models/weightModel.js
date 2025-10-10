const mongoose = require("mongoose");

const weightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserProfile", 
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  weight: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Weight", weightSchema);
