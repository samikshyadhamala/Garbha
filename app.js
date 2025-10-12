const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const documentRoutes = require("./routes/documentRoutes");
const weightRoutes = require("./routes/weightRoutes");
const kickRoutes = require("./routes/kickRoutes"); 
const path = require("path");
const resetRoutes = require("./routes/resetRoutes");
const deleteRoutes = require("./routes/deleteRoutes");

dotenv.config();
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
