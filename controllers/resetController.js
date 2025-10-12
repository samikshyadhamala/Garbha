const UserPregnancyProfile = require("../models/userPregnancyProfile");
const UserProfile = require("../models/userProfile");

exports.resetPregnancy = async (req, res) => {
  try {
    const userId = req.user.id;

    await UserPregnancyProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          weeksPregnant: null,
          dueDate: null,
          kicks: [],
        },
      },
      { new: true, upsert: true }
    );

    await UserProfile.findOneAndUpdate(
      { user: userId },
      { $unset: { weeksPregnant: "", dueDate: "" } }
    );

    res.status(200).json({
      success: true,
      message: "Pregnancy data has been reset successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to reset pregnancy data.",
    });
  }
};
