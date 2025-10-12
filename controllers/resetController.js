const mongoose = require("mongoose");
const UserPregnancyProfile = require("../models/userPregnancyProfile");
const UserProfile = require("../models/userProfile");
const KickSession = require("../models/kickSession");
const Weight = require("../models/weightModel");

exports.resetPregnancy = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const session = await mongoose.startSession().catch(() => null);
  const useTransaction = !!session && typeof session.startTransaction === "function";

  try {
    if (useTransaction) session.startTransaction();

    // 1️⃣ Reset Pregnancy Profile
    const pregnancyProfileUpdate = await UserPregnancyProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          weeksPregnant: null,
          dueDate: null,
          kicks: [],
          illnesses: [],
          medications: [],
          notes: [],
          diseases: [],
          allergies: [],
          complications: [],
          firstPregnancy: null,
          lmp: null,
          previousPregnancies: null,
          previousComplications: null,
          bloodType: null,
          preExistingConditions: [],
          height: null,
          weightBeforePregnancy: null,
          lifestyle: {},
          preferredName: null,
        },
      },
      { new: true, upsert: false, session: useTransaction ? session : undefined }
    );

    // 2️⃣ Remove all kick sessions
    const kickDeleteResult = await KickSession.deleteMany(
      { user: userId },
      { session: useTransaction ? session : undefined }
    );

    // 3️⃣ Remove all weight entries
    const weightDeleteResult = await Weight.deleteMany(
      { user: userId },
      { session: useTransaction ? session : undefined }
    );

    // 4️⃣ Reset UserProfile pregnancy-related fields
    const userProfileUpdate = await UserProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          weeksPregnant: null,
          dueDate: null,
          currentTrimester: null,
          pregnancyNotes: null,
          lastKicksCount: null,
          estimatedDueDate: null,
          pregnancyHistory: null,
          diseaseDetails: null,
          complications: [],
          allergies: [],
          kicks: [],
        },
      },
      { new: true, session: useTransaction ? session : undefined }
    );

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    // 🧠 Convert nulls to "N/A" in the response (not in DB)
    const formatValue = (val) => {
      if (val === null || val === undefined) return "N/A";
      if (Array.isArray(val) && val.length === 0) return "N/A";
      if (typeof val === "object" && Object.keys(val).length === 0) return "N/A";
      return val;
    };

    const formattedProfile = {};
    if (pregnancyProfileUpdate) {
      for (const [key, value] of Object.entries(pregnancyProfileUpdate.toObject ? pregnancyProfileUpdate.toObject() : pregnancyProfileUpdate)) {
        formattedProfile[key] = formatValue(value);
      }
    }

    return res.status(200).json({
      success: true,
      message: "All pregnancy-related data has been reset (name/email/password preserved).",
      summary: {
        pregnancyProfile: formattedProfile,
        kicksDeleted: kickDeleteResult.deletedCount,
        weightsDeleted: weightDeleteResult.deletedCount,
        userProfileUpdated: !!userProfileUpdate,
      },
    });
  } catch (err) {
    if (useTransaction) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    console.error("resetPregnancy error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reset pregnancy data.",
      error: err.message,
    });
  }
};
