const Weight = require("../models/weightModel");

// ➕ Add new weight
exports.addWeight = async (req, res) => {
  try {
    const { user, weight } = req.body; // user = UserProfile _id
    const newEntry = await Weight.create({ user, weight });
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    res.status(400).json({ message: err.message });
  }
};

// 🗓 Filter weights by month
exports.getWeightsByMonth = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month } = req.query;

    const year = new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const weights = await Weight.find({
      user: userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(weights);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 📊 Weekly data
exports.getWeeklyStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    const weights = await Weight.find({
      user: userId,
      date: { $gte: lastMonth },
    }).sort({ date: 1 });

    res.json(weights);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 📋 Get all weights for a user
exports.getAllWeights = async (req, res) => {
  try {
    const { userId } = req.params;
    const weights = await Weight.find({ user: userId }).sort({ date: 1 });
    res.json(weights);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✏️ Update a weight by _id
exports.updateWeight = async (req, res) => {
  try {
    const { weightId } = req.params;
    const { weight } = req.body;

    const updated = await Weight.findByIdAndUpdate(
      weightId,
      { weight },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 🗑 Delete a weight by _id
exports.deleteWeight = async (req, res) => {
  try {
    const { weightId } = req.params;
    await Weight.findByIdAndDelete(weightId);
    res.json({ message: "Weight entry deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 👥 Get populated weights (joins with user info)
exports.getPopulatedWeights = async (req, res) => {
  try {
    const { userId } = req.params;
    const weights = await Weight.find({ user: userId }).populate("user");
    res.json(weights);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
