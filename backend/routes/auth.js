// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import auth from "../middleware/auth.js";

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/* ----------------------------- Helper ------------------------------ */
function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  const { _id, name, email, role, profilePhoto, createdAt, updatedAt } = userDoc;
  return { id: _id, name, email, role, profilePhoto, createdAt, updatedAt };
}

/* ----------------------------- Signup ------------------------------ */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered." });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name || "",
      email,
      passwordHash,
      role: "user",
    });

    const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed." });
  }
});

/* ----------------------------- Login ------------------------------ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Set httpOnly cookie instead of sending token in response
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

/* ----------------------------- Me (Profile) ------------------------------ */
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const user = await User.findById(userId).select("-passwordHash -resetToken -resetTokenExpiresAt");
    if (!user) return res.status(404).json({ error: "User not found." });

    res.json(sanitizeUser(user));
  } catch (err) {
    console.error("ME route error:", err);
    res.status(500).json({ error: "Could not fetch profile." });
  }
});

/* ------------------------- Update Profile -------------------------- */
router.put("/me", auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, profilePhoto } = req.body;

    const updated = await User.findByIdAndUpdate(
      userId,
      { name, profilePhoto },
      { new: true }
    ).select("-passwordHash -resetToken -resetTokenExpiresAt");

    res.json(sanitizeUser(updated));
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Could not update profile." });
  }
});

/* ------------------------- Forgot Password ------------------------ */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found." });

    const token = user.createResetToken();
    await user.save();

    res.json({ message: "Reset token (dev mode)", resetToken: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate reset token." });
  }
});

/* ----------------------------- Logout ------------------------------ */
router.post("/logout", (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: "Logged out successfully" });
});

/* ------------------------- Reset Password ------------------------ */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token." });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;

    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reset password." });
  }
});

export default router;
