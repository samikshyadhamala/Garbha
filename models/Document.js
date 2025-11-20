const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", documentSchema);
