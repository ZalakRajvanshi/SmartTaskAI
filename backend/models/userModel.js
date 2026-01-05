// backend/models/userModel.js
import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  profilePhoto: String,
  resetToken: String,
  resetTokenExpiresAt: Date,
  role: { type: String, enum: ["user", "admin"], default: "user" }, // ✅ FIXED
}, { timestamps: true });

// helper to generate reset token
userSchema.methods.createResetToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.resetToken = token;
  this.resetTokenExpiresAt = Date.now() + 1000 * 60 * 60;
  return token;
};

const User = mongoose.model("User", userSchema);
export default User;
