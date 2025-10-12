const mongoose = require("mongoose");

const userPregnancyProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Pregnancy Details
  lmp: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  firstPregnancy: { type: Boolean, default: true },
  weeksPregnant: { type: Number, required: true, min: 0 }, // required at signup
  previousPregnancies: { type: Number, min: 0, default: null },
  previousComplications: { type: Boolean, default: false },

  // Health
  bloodType: { 
    type: String, 
    required: true, 
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  },
  preExistingConditions: [{ type: String, trim: true, default: "none" }], 
  allergies: [{ type: String, trim: true, default: "none" }],
  medications: [{ type: String, trim: true, default: "none" }],
  lifestyle: {
    smoke: { type: Boolean, default: null }, // dropdown true/false
    alcohol: { type: Boolean, default: null }, // dropdown true/false
    familyHistoryPregnancyComplications: { type: Boolean, default: false },
  },

  // Optional info
  preferredName: { type: String, trim: true, default: "none" },
  height: { type: Number, min: 30, max: 250, default: null },
  weightBeforePregnancy: { type: Number, min: 20, max: 300, default: null },
}, { timestamps: true });

// Pre-save hook to calculate dueDate & weeksPregnant
userPregnancyProfileSchema.pre("save", function(next) {
  const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

  if (this.isNew && (this.weeksPregnant == null)) {
    return next(new Error("Weeks pregnant is required at signup"));
  }

  if (this.lmp) {
    // LMP provided → calculate weeks and dueDate
    const diffInMs = Date.now() - new Date(this.lmp).getTime();
    const calculatedWeeks = Math.floor(diffInMs / MS_PER_WEEK);
    this.weeksPregnant = calculatedWeeks; // overwrite weeksPregnant if LMP is available
    this.dueDate = new Date(new Date(this.lmp).getTime() + 280 * 24 * 60 * 60 * 1000);
  } else if (this.weeksPregnant != null) {
    // No LMP → calculate dueDate using manually entered weeks
    this.dueDate = new Date(Date.now() + (40 - this.weeksPregnant) * MS_PER_WEEK);
  }

  // Ensure arrays are at least ["none"] if empty
  if (!this.preExistingConditions || this.preExistingConditions.length === 0) this.preExistingConditions = ["none"];
  if (!this.allergies || this.allergies.length === 0) this.allergies = ["none"];
  if (!this.medications || this.medications.length === 0) this.medications = ["none"];

  next();
});

module.exports = mongoose.model("UserPregnancyProfile", userPregnancyProfileSchema);
