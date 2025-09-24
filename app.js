const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const documentRoutes = require("./routes/documentRoutes");
const path = require("path");

dotenv.config();
connectDB();

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

