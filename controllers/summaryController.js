// controllers/summaryController.js
const UserPregnancyProfile = require("../models/userPregnancyProfile");
const UserProfile = require("../models/userProfile");
const KickSession = require("../models/kickSession");
const Weight = require("../models/weightModel");
const PDFDocument = require("pdfkit");

// Utility: nice date string
const fmtDate = (d) => (d ? new Date(d).toDateString() : "N/A");

// Draw a line chart (with spaced X-axis)
function drawLineChart(doc, x, y, w, h, labels, values, opts = {}) {
  const padding = 40;
  const chartX = x + padding;
  const chartY = y + padding;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;

  doc.save();
  doc.rect(x, y, w, h).stroke();

  const maxVal = opts.maxY || Math.max(...values.filter(v => v !== null), 1);

  // Horizontal grid lines
  doc.fontSize(8);
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const yy = chartY + (chartH * i) / gridLines;
    const valueLabel = (maxVal - (i * maxVal) / gridLines).toFixed(0);
    doc.moveTo(chartX, yy).lineTo(chartX + chartW, yy)
      .dash(1, { space: 3 }).strokeColor('#cccccc').stroke().undash();
    doc.fillColor('#000000').text(valueLabel, x + 4, yy - 6, { width: padding - 6, align: 'left' });
  }

  // X-axis labels: format based on type
  const n = labels.length;
  const stepX = n > 1 ? chartW / (n - 1) : 0;
  let labelIndexes = [];
  
  if (opts.type === 'daily') {
    // Show all dates for 7-day view
    labelIndexes = labels.map((_, i) => i);
  } else { // monthly
    // Show ~4-5 labels for 30-day view
    const gap = Math.ceil(n / 5);
    for (let i = 0; i < n; i += gap) labelIndexes.push(i);
    if (!labelIndexes.includes(n - 1)) labelIndexes.push(n - 1);
  }

  // Format date labels as MM/DD
  labels.forEach((lab, i) => {
    if (labelIndexes.includes(i)) {
      const lx = chartX + stepX * i;
      const ly = chartY + chartH + 4;
      // Convert YYYY-MM-DD to MM/DD
      const dateParts = String(lab).split('-');
      const formattedLabel = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : lab;
      doc.fillColor('#000').fontSize(7).text(formattedLabel, lx - 20, ly, { width: 40, align: 'center' });
    }
  });

  // Plot line
  if (values.length > 0 && values.some(v => v !== null)) {
    let started = false;
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null) {
        const vx = chartX + stepX * i;
        const vy = chartY + chartH - (values[i] / maxVal) * chartH;
        if (!started) {
          doc.moveTo(vx, vy);
          started = true;
        } else {
          doc.lineTo(vx, vy);
        }
      }
    }
    doc.strokeColor('#0074D9').lineWidth(2).stroke();

    // Draw points
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null) {
        const vx = chartX + stepX * i;
        const vy = chartY + chartH - (values[i] / maxVal) * chartH;
        doc.circle(vx, vy, 3).fillColor('#0074D9').fill();
      }
    }
  } else {
    doc.fontSize(10).fillColor('#666').text('No data', chartX + chartW / 2 - 20, chartY + chartH / 2 - 6);
  }

  if (opts.title) {
    doc.fontSize(10).fillColor('#000').text(opts.title, x + 6, y + 6);
  }
  doc.restore();
}

// Draw progress bar
function drawProgressBar(doc, x, y, w, h, percentage, label) {
  doc.save();
  doc.rect(x, y, w, h).strokeColor('#000').lineWidth(0.5).stroke();
  const fillW = Math.max(0, Math.min(w, (percentage / 100) * w));
  doc.rect(x + 1, y + 1, fillW - 2, h - 2).fillColor('#28a745').fill();
  doc.fillColor('#000').fontSize(10).text(`${label} (${percentage}%)`, x, y - 14);
  doc.restore();
}

// -------------------- JSON summary --------------------
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || "daily"; // daily or monthly
    const now = new Date();
    now.setHours(23, 59, 59, 999); // end of today
    let startDate;
    let daysCount;

    if (type === "daily") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6); // last 7 days
      startDate.setHours(0, 0, 0, 0);
      daysCount = 7;
    } else if (type === "monthly") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 29); // last 30 days
      startDate.setHours(0, 0, 0, 0);
      daysCount = 30;
    } else {
      return res.status(400).json({ success: false, message: "Invalid type. Use 'daily' or 'monthly'" });
    }

    const [kicks, weights, pregnancyProfile, userProfile] = await Promise.all([
      KickSession.find({ user: userId, date: { $gte: startDate, $lte: now } }),
      Weight.find({ user: userId, date: { $gte: startDate, $lte: now } }),
      UserPregnancyProfile.findOne({ user: userId }),
      UserProfile.findOne({ user: userId }),
    ]);

    // Kicks per day
    const kicksByDay = {};
    kicks.forEach((s) => {
      const day = new Date(s.date).toISOString().split("T")[0];
      kicksByDay[day] = (kicksByDay[day] || 0) + (s.kicks?.length || 0);
    });

    const dayLabels = [];
    const kickValues = [];
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);
    while (cur <= now) {
      const key = cur.toISOString().split("T")[0];
      dayLabels.push(key);
      kickValues.push(kicksByDay[key] || 0);
      cur.setDate(cur.getDate() + 1);
    }

    const weightLabels = weights.map((w) => new Date(w.date).toISOString().split("T")[0]);
    const weightValues = weights.map((w) => w.weight);

    const totalKicks = kickValues.reduce((a, b) => a + b, 0);
    const avgKicks = dayLabels.length ? (totalKicks / dayLabels.length).toFixed(1) : 0;

    const firstWeight = weightValues.length ? weightValues[0] : null;
    const lastWeight = weightValues.length ? weightValues[weightValues.length - 1] : null;
    const weightChange = firstWeight !== null && lastWeight !== null ? (lastWeight - firstWeight).toFixed(1) : null;

    const weeksPregnant = pregnancyProfile?.weeksPregnant || 0;
    const gestTotal = 40;
    const gestPercent = Math.min(100, Math.max(0, ((weeksPregnant / gestTotal) * 100).toFixed(1)));

    const userName = userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : 'N/A';

    res.status(200).json({
      success: true,
      data: {
        summaryType: type,
        periodDescription: type === 'daily' ? 'Last 7 days' : 'Last 30 days',
        user: { name: userName, email: userProfile?.email || null },
        pregnancy: { weeksPregnant, dueDate: pregnancyProfile?.dueDate || null, gestationalProgress: { current: weeksPregnant, total: gestTotal, percentage: gestPercent } },
        kicks: { totalKicks, avgKicks, kickGraph: dayLabels.map((d, i) => ({ date: d, kicks: kickValues[i] })) },
        weights: { firstWeight, lastWeight, weightChange, weightGraph: weightLabels.map((d, i) => ({ date: d, weight: weightValues[i] })) }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch summary" });
  }
};

// -------------------- PDF summary --------------------
exports.downloadSummaryPDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || "daily";
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let startDate;
    let periodDescription;

    if (type === "daily") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6); // last 7 days
      startDate.setHours(0, 0, 0, 0);
      periodDescription = "Last 7 Days";
    } else if (type === "monthly") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 29); // last 30 days
      startDate.setHours(0, 0, 0, 0);
      periodDescription = "Last 30 Days";
    } else {
      return res.status(400).json({ success: false, message: "Invalid type. Use 'daily' or 'monthly'" });
    }

    const kicks = await KickSession.find({ user: userId, date: { $gte: startDate, $lte: now } });
    const weights = await Weight.find({ user: userId, date: { $gte: startDate, $lte: now } });
    const pregnancyProfile = await UserPregnancyProfile.findOne({ user: userId });
    const userProfile = await UserProfile.findOne({ user: userId });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pregnancy-summary-${type}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('Pregnancy Summary', { align: 'center' });
    doc.fontSize(12).fillColor('#666').text(`(${periodDescription})`, { align: 'center' });
    doc.moveDown();

    const userName = userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : 'N/A';
    doc.fontSize(12).fillColor('#000').text(`Name: ${userName}`);
    doc.text(`Email: ${userProfile?.email || 'N/A'}`);
    if (userProfile?.age) doc.text(`Age: ${userProfile.age}`);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    let yPos = doc.y;

    // -------------------- User Pregnancy Information Section --------------------
    if (pregnancyProfile) {
      doc.fontSize(14).fillColor('#000').text('Pregnancy Information', 40, yPos, { underline: true });
      yPos += 20;

      // Row 1: Basic Pregnancy Info
      doc.fontSize(10);
      doc.text(`Weeks Pregnant: ${pregnancyProfile.weeksPregnant || 'N/A'}`, 40, yPos);
      doc.text(`Due Date: ${pregnancyProfile.dueDate ? new Date(pregnancyProfile.dueDate).toLocaleDateString() : 'N/A'}`, 220, yPos);
      doc.text(`Blood Type: ${pregnancyProfile.bloodType || 'N/A'}`, 400, yPos);
      yPos += 14;

      doc.text(`First Pregnancy: ${pregnancyProfile.firstPregnancy ? 'Yes' : 'No'}`, 40, yPos);
      if (pregnancyProfile.lmp) {
        doc.text(`LMP: ${new Date(pregnancyProfile.lmp).toLocaleDateString()}`, 220, yPos);
      }
      if (pregnancyProfile.previousPregnancies != null) {
        doc.text(`Previous Pregnancies: ${pregnancyProfile.previousPregnancies}`, 400, yPos);
      }
      yPos += 14;

      if (pregnancyProfile.previousComplications) {
        doc.text('Previous Complications: Yes', 40, yPos);
        yPos += 14;
      }
      yPos += 6;

      // Physical Info
      if (pregnancyProfile.height || pregnancyProfile.weightBeforePregnancy) {
        doc.fontSize(11).fillColor('#333').text('Physical Information:', 40, yPos);
        yPos += 14;
        doc.fontSize(10).fillColor('#000');
        if (pregnancyProfile.height) {
          doc.text(`Height: ${pregnancyProfile.height} cm`, 50, yPos);
          yPos += 12;
        }
        if (pregnancyProfile.weightBeforePregnancy) {
          doc.text(`Weight Before Pregnancy: ${pregnancyProfile.weightBeforePregnancy} kg`, 50, yPos);
          yPos += 12;
        }
        yPos += 4;
      }

      // Medical Info
      doc.fontSize(11).fillColor('#333').text('Medical Information:', 40, yPos);
      yPos += 14;
      doc.fontSize(10).fillColor('#000');

      const conditions = pregnancyProfile.preExistingConditions?.filter(c => c !== 'none').join(', ') || 'None';
      doc.text(`Pre-existing Conditions: ${conditions}`, 50, yPos, { width: 500 });
      yPos += Math.ceil(doc.heightOfString(`Pre-existing Conditions: ${conditions}`, { width: 500 })) + 4;

      const allergies = pregnancyProfile.allergies?.filter(a => a !== 'none').join(', ') || 'None';
      doc.text(`Allergies: ${allergies}`, 50, yPos, { width: 500 });
      yPos += Math.ceil(doc.heightOfString(`Allergies: ${allergies}`, { width: 500 })) + 4;

      const medications = pregnancyProfile.medications?.filter(m => m !== 'none').join(', ') || 'None';
      doc.text(`Current Medications: ${medications}`, 50, yPos, { width: 500 });
      yPos += Math.ceil(doc.heightOfString(`Current Medications: ${medications}`, { width: 500 })) + 4;
      yPos += 6;

      // Lifestyle Info
      doc.fontSize(11).fillColor('#333').text('Lifestyle Information:', 40, yPos);
      yPos += 14;
      doc.fontSize(10).fillColor('#000');
      
      doc.text(`Smoking: ${pregnancyProfile.lifestyle?.smoke ? 'Yes' : 'No'}`, 50, yPos);
      doc.text(`Alcohol: ${pregnancyProfile.lifestyle?.alcohol ? 'Yes' : 'No'}`, 220, yPos);
      yPos += 12;
      doc.text(`Family History of Pregnancy Complications: ${pregnancyProfile.lifestyle?.familyHistoryPregnancyComplications ? 'Yes' : 'No'}`, 50, yPos);
      yPos += 12;

      if (pregnancyProfile.preferredName && pregnancyProfile.preferredName !== 'none') {
        doc.text(`Preferred Name: ${pregnancyProfile.preferredName}`, 50, yPos);
        yPos += 12;
      }
      
      yPos += 10;
      doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor('#ccc').lineWidth(0.5).stroke();
      yPos += 15;
    }

    // ---------------- Gestational Progress ----------------
    const weeksPregnant = pregnancyProfile?.weeksPregnant || 0;
    const gestTotal = 40;
    const gestPercent = Math.min(100, Math.max(0, ((weeksPregnant / gestTotal) * 100).toFixed(1)));
    drawProgressBar(doc, 40, yPos, 500, 20, gestPercent, `Gestational Progress (Week ${weeksPregnant} of ${gestTotal})`);
    yPos += 50;

    // ---------------- Kicks Section ----------------
    doc.fontSize(14).fillColor('#000').text('Baby Kick Tracking', 40, yPos, { underline: true });
    yPos += 20;

    // Group kicks by date
    const kicksByDate = {};
    kicks.forEach(k => {
      const dateStr = new Date(k.date).toISOString().split('T')[0];
      kicksByDate[dateStr] = (kicksByDate[dateStr] || 0) + k.kicks.length;
    });

    doc.fontSize(10).text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(now).toLocaleDateString()}`, 40, yPos);
    yPos += 16;

    // Only show entries with kicks
    const kickEntries = Object.entries(kicksByDate).sort();
    if (kickEntries.length > 0) {
      kickEntries.forEach(([dateStr, count]) => {
        const date = new Date(dateStr);
        doc.text(`${date.toLocaleDateString()}: ${count} kicks`, 50, yPos);
        yPos += 12;
      });
    } else {
      doc.fillColor('#666').text('No kicks recorded in this period', 50, yPos);
      yPos += 12;
    }
    yPos += 10;

    // Kicks graph - fill in all days
    const dayLabels = [];
    const kickValues = [];
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);
    while (cur <= now) {
      const key = cur.toISOString().split("T")[0];
      dayLabels.push(key);
      kickValues.push(kicksByDate[key] || 0);
      cur.setDate(cur.getDate() + 1);
    }
    
    if (yPos > 550) { doc.addPage(); yPos = 40; }
    drawLineChart(doc, 40, yPos, 500, 180, dayLabels, kickValues, { 
      title: `Kicks Over Time (${periodDescription})`, 
      type 
    });
    yPos += 200;

    // ---------------- Weight Section ----------------
    if (yPos > 550) { doc.addPage(); yPos = 40; }
    
    doc.fontSize(14).fillColor('#000').text('Weight Tracking', 40, yPos, { underline: true });
    yPos += 20;

    doc.fontSize(10).text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(now).toLocaleDateString()}`, 40, yPos);
    yPos += 16;

    if (weights.length > 0) {
      weights.forEach(w => {
        const dateStr = new Date(w.date).toLocaleDateString();
        doc.text(`${dateStr}: ${w.weight} kg`, 50, yPos);
        yPos += 12;
      });
    } else {
      doc.fillColor('#666').text('No weight entries recorded in this period', 50, yPos);
      yPos += 12;
    }
    yPos += 10;

    // Weight graph - fill in all days, null for missing
    const weightByDate = {};
    weights.forEach(w => {
      const dateStr = new Date(w.date).toISOString().split("T")[0];
      weightByDate[dateStr] = w.weight;
    });

    const weightLabels = [];
    const weightValues = [];
    const curW = new Date(startDate);
    curW.setHours(0, 0, 0, 0);
    while (curW <= now) {
      const key = curW.toISOString().split("T")[0];
      weightLabels.push(key);
      weightValues.push(weightByDate[key] || null);
      curW.setDate(curW.getDate() + 1);
    }
    
    if (yPos > 550) { doc.addPage(); yPos = 40; }
    drawLineChart(doc, 40, yPos, 500, 180, weightLabels, weightValues, { 
      title: `Weight Over Time (${periodDescription})`, 
      type 
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};