// Load environment variables FIRST - before any other imports
require('dotenv').config();

console.log('🔍 Environment loaded:');
console.log('  - GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set (' + process.env.GROQ_API_KEY.substring(0, 10) + '...)' : '❌ Missing');
console.log('  - PORT:', process.env.PORT);

const express = require("express");
const connectDB = require("./config/db");
const documentRoutes = require("./routes/documentRoutes");
const weightRoutes = require("./routes/weightRoutes");
const kickRoutes = require("./routes/kickRoutes"); 
const path = require("path");
const resetRoutes = require("./routes/resetRoutes");
const deleteRoutes = require("./routes/deleteRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const chatbotRoutes = require('./routes/chatbotRoutes');

connectDB();

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Existing routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/documents", documentRoutes);
app.use("/api/weights", weightRoutes);
app.use("/api/kicks", kickRoutes); 
app.use("/api/reset", resetRoutes);
app.use("/api/delete", deleteRoutes);
app.use("/api/summary", summaryRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Add chat routes
app.use('/api/chat', chatbotRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));