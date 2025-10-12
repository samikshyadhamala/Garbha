// models/kickSession.js
const mongoose = require("mongoose");

const kickSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  gestationalWeek: { type: Number, required: true },
  kicks: [{ type: Date }], // timestamps of each kick
}, { timestamps: true });

module.exports = mongoose.model("KickSession", kickSessionSchema);
