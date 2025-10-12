const User = require("../models/User");
const UserProfile = require("../models/userProfile");
const UserPregnancyProfile = require("../models/userPregnancyProfile");

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all related documents
    await UserProfile.findOneAndDelete({ user: userId });
    await UserPregnancyProfile.findOneAndDelete({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully. You can start fresh now.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account.",
    });
  }
};
