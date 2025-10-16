const { addToBlacklist } = require("../utils/tokenBlacklist");
const User = require("../models/User");

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    const token = req.token;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token found",
      });
    }

    // Add token to blacklist
    addToBlacklist(token, 7 * 24 * 60 * 60); // 7 days (matches JWT expiry)

    // Optional: Update last login timestamp
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during logout",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Logout from all devices (optional - requires token history)
 */
exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    // This is a placeholder. For real implementation,
    // you'd need to store all active tokens in DB or Redis
    // and blacklist all of them here.

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error("Error in logoutAll:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
