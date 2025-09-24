const mongoose = require("mongoose");

const userPregnancyProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Pregnancy Details
  lmp: { type: Date },
  dueDate: { type: Date },
  firstPregnancy: { type: Boolean, default: true },
  weeksPregnant: { type: Number, min: 0 },
  previousPregnancies: { type: Number, min: 0 },
  previousComplications: { type: Boolean, default: false },

  // Health
  bloodType: { type: String, required: true, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  preExistingConditions: [{ type: String, trim: true }],
  allergies: [{ type: String, trim: true }],
  medications: [{ type: String, trim: true }],
  lifestyle: {
    smoke: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    familyHistoryPregnancyComplications: { type: Boolean, default: false },
  },

  // Optional info
  preferredName: { type: String, trim: true },
  height: { type: Number, min: 30, max: 250 },
  weightBeforePregnancy: { type: Number, min: 20, max: 300 },
}, { timestamps: true });

// Pre-save hook for dueDate & weeksPregnant
userPregnancyProfileSchema.pre("save", function(next) {
  if (!this.dueDate && this.lmp) {
    const lmpDate = new Date(this.lmp);
    this.dueDate = new Date(lmpDate.setDate(lmpDate.getDate() + 280));
  }

  if (!this.weeksPregnant) {
    const startDate = this.lmp || new Date(this.dueDate - 280 * 24 * 60 * 60 * 1000);
    const diffInMs = Date.now() - new Date(startDate).getTime();
    this.weeksPregnant = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
  }

  next();
});

module.exports = mongoose.model("UserPregnancyProfile", userPregnancyProfileSchema);
