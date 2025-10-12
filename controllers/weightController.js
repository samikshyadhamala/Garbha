const mongoose = require("mongoose");
const Weight = require("../models/weightModel");

// ➕ Add or update today's weight
exports.addWeight = async (req, res) => {
  try {
    const { user, weight } = req.body;

    if (!user || weight === undefined || weight <= 0) {
      return res.status(400).json({ message: "Invalid user or weight value" });
    }

    // Today's date range UTC
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Check if entry exists for today
    let entry = await Weight.findOne({
      user,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (entry) {
      entry.weight = weight;
      await entry.save();
      return res.status(200).json({ message: "Weight updated for today", entry });
    }

    entry = await Weight.create({ user, weight });
    res.status(201).json({ message: "Weight added", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🔟 Get last 10 entries
exports.getRecentWeights = async (req, res) => {
  try {
    const { userId } = req.params;
    const weights = await Weight.find({ user: userId })
      .sort({ date: -1 })
      .limit(10);
    res.json(weights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📊 Weekly stats (last 7 days, aggregated by day)
exports.getWeeklyStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 7);
    start.setUTCHours(0, 0, 0, 0);

    const weights = await Weight.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId), date: { $gte: start } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          weight: { $last: "$weight" },
          date: { $last: "$date" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json(weights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🗓 Get weights by month (aggregated by day)
exports.getWeightsByMonth = async (req, res) => {
  try {
    const { userId } = req.params;
    const month = parseInt(req.query.month);
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid month" });
    }

    const year = new Date().getFullYear();
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const weights = await Weight.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          weight: { $last: "$weight" },
          date: { $last: "$date" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json(weights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📋 Get all weights
exports.getAllWeights = async (req, res) => {
  try {
    const { userId } = req.params;
    const weights = await Weight.find({ user: userId }).sort({ date: 1 });
    res.json(weights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✏️ Update weight by _id
exports.updateWeight = async (req, res) => {
  try {
    const { weightId } = req.params;
    const { weight } = req.body;

    if (weight === undefined || weight <= 0) {
      return res.status(400).json({ message: "Invalid weight value" });
    }

    const updated = await Weight.findByIdAndUpdate(weightId, { weight }, { new: true });
    if (!updated) return res.status(404).json({ message: "Weight not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🗑 Delete weight by _id
exports.deleteWeight = async (req, res) => {
  try {
    const { weightId } = req.params;
    const deleted = await Weight.findByIdAndDelete(weightId);
    if (!deleted) return res.status(404).json({ message: "Weight not found" });

    res.json({ message: "Weight entry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👥 Get populated weights (with user profile info)
exports.getPopulatedWeights = async (req, res) => {
  try {
    const { userId } = req.params;
    const weights = await Weight.find({ user: userId }).populate("user");
    res.json(weights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
