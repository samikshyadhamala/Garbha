const mongoose = require("mongoose");
const UserPregnancyProfile = require("../models/userPregnancyProfile");
const pregnancyTips = require("../utils/pregnancyTips");

exports.getProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert userId to ObjectId correctly
    const profile = await UserPregnancyProfile.findOne({
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const today = new Date();
    const lmpDate = new Date(profile.lmp);
    const dueDate = new Date(profile.dueDate);

    const totalDays = Math.round((dueDate - lmpDate) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.round((today - lmpDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(totalDays - daysPassed, 0);
    const currentWeek = Math.floor(daysPassed / 7);
    const currentDay = daysPassed % 7;
    const percentDone = ((daysPassed / totalDays) * 100).toFixed(1);

    let trimester = "";
    if (currentWeek <= 13) trimester = "First Trimester";
    else if (currentWeek <= 27) trimester = "Second Trimester";
    else trimester = "Third Trimester";

    const tip = pregnancyTips[currentWeek] || "You're doing great! Keep taking care of yourself and your baby.";

    res.json({
      preferredName: profile.preferredName,
      week: currentWeek,
      day: currentDay,
      percentDone: `${percentDone}%`,
      daysRemaining,
      totalDays,
      trimester,
      tip,
    });
  } catch (error) {
    console.error("Error calculating pregnancy progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};
