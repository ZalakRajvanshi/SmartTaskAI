// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";

import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import habitRoutes from "./routes/habits.js";
import journalRoutes from "./routes/journal.js";  // 🔥 NEW
import aiRoutes from "./routes/aiRoutes.js";

import bcrypt from "bcryptjs";
import User from "./models/userModel.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

/* ------------------------- AUTO-CREATE DEFAULT ADMIN ------------------------- */
async function createDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;


  const exists = await User.findOne({ email: adminEmail });
  if (exists) {
    console.log("✔ Admin already exists");
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  await User.create({
    name: "Admin",
    email: adminEmail,
    passwordHash,
    role: "admin",
  });

  console.log("🛑 Default ADMIN created:");
  console.log("Email:", adminEmail);
  console.log("Password:", adminPassword);
}
/* --------------------------------------------------------------------------- */

/* ----------------------------- API ROUTES ------------------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/journal", journalRoutes);   // 🔥 NEW
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("🚀 SmartTaskAI Backend Running");
});

/* ----------------------------- START SERVER ------------------------------- */

connectDB().then(() => createDefaultAdmin());

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🤖 Python AI expected at http://localhost:8001/suggest`);
});
