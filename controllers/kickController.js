// controllers/kickController.js
const KickSession = require("../models/kickSession");
const UserPregnancyProfile = require("../models/userPregnancyProfile");

// ➤ Helper: get gestational week
const getGestationalWeek = async (userId) => {
  const profile = await UserPregnancyProfile.findOne({ user: userId });
  if (!profile) throw new Error("Pregnancy profile not found");
  return profile.weeksPregnant;
};

// ➤ Get or create today’s session
exports.getOrCreateTodaySession = async (req, res) => {
  try {
    const userId = req.user.id;

    const gestWeek = await getGestationalWeek(userId);
    if (gestWeek < 18)
      return res.status(400).json({ message: "Kick tracking starts from week 18" });

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23,59,59,999);

    let session = await KickSession.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (!session) {
      session = new KickSession({ user: userId, gestationalWeek: gestWeek, kicks: [] });
      await session.save();
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ➤ Add a kick
exports.addKick = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await KickSession.findById(sessionId);

    if (!session || session.user.toString() !== req.user.id)
      return res.status(404).json({ message: "Session not found" });

    session.kicks.push(new Date());
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ➤ Remove last kick
exports.removeKick = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await KickSession.findById(sessionId);

    if (!session || session.user.toString() !== req.user.id)
      return res.status(404).json({ message: "Session not found" });

    session.kicks.pop(); // remove last kick
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ➤ Get summary for filters + chart
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query;
    const now = new Date();
    let startDate;

    if (filter === "daily") startDate = new Date(now.setHours(0,0,0,0));
    if (filter === "weekly") startDate = new Date(now.setDate(now.getDate() - 6));
    if (filter === "monthly") startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const sessions = await KickSession.find({
      user: userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const totalKicks = sessions.reduce((sum, s) => sum + s.kicks.length, 0);
    const averagePerDay = (sessions.length > 0 ? (totalKicks / sessions.length).toFixed(1) : 0);

    const chartData = sessions.map(s => ({
      date: s.date.toISOString().split("T")[0],
      kicks: s.kicks.length,
    }));

    res.json({ totalKicks, averagePerDay, chartData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
