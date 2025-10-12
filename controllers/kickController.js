const KickSession = require("../models/kickSession");
const UserPregnancyProfile = require("../models/userPregnancyProfile");

// ➤ Helper: get gestational week
const getGestationalWeek = async (userId) => {
  const profile = await UserPregnancyProfile.findOne({ user: userId });
  if (!profile) throw new Error("Pregnancy profile not found");
  return profile.weeksPregnant;
};
// Normalize session date at midnight when saving
const findTodaySession = async (userId) => {
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23,59,59,999);

  let session = await KickSession.findOne({ user: userId, date: { $gte: todayStart, $lte: todayEnd } });

  if (!session) {
    const gestWeek = await getGestationalWeek(userId);
    if (gestWeek < 18) throw new Error("Kick tracking starts from week 18");
    session = new KickSession({ 
      user: userId, 
      gestationalWeek: gestWeek, 
      date: todayStart, // normalize date
      kicks: [] 
    });
    await session.save();
  }
  return session;
};


exports.getOrCreateTodaySession = async (req, res) => {
  try {
    const session = await findTodaySession(req.user.id);
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addKick = async (req, res) => {
  try {
    let session;
    if (req.body.sessionId) {
      session = await KickSession.findById(req.body.sessionId);
      if (!session || session.user.toString() !== req.user.id)
        return res.status(404).json({ message: "Session not found" });
    } else {
      session = await findTodaySession(req.user.id);
    }
    session.kicks.push(new Date());
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeKick = async (req, res) => {
  try {
    let session;
    if (req.body.sessionId) {
      session = await KickSession.findById(req.body.sessionId);
      if (!session || session.user.toString() !== req.user.id)
        return res.status(404).json({ message: "Session not found" });
    } else {
      session = await findTodaySession(req.user.id);
    }
    session.kicks.pop();
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query;
    const now = new Date();
    let startDate;

    if (filter === "daily") startDate = new Date(now.setHours(0, 0, 0, 0));
    else if (filter === "weekly") startDate = new Date(now.setDate(now.getDate() - 6));
    else if (filter === "monthly") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else startDate = new Date(0);

    const sessions = await KickSession.find({
      user: userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    const totalKicks = sessions.reduce((sum, s) => sum + s.kicks.length, 0);
    const averagePerDay = sessions.length > 0 ? (totalKicks / sessions.length).toFixed(1) : 0;

    const chartData = sessions.map((s) => ({
      date: s.date.toISOString().split("T")[0],
      kicks: s.kicks.length,
    }));

    res.json({ totalKicks, averagePerDay, chartData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
