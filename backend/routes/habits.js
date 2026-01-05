// backend/routes/habits.js
import express from "express";
import Habit from "../models/habitModel.js";
import auth from "../middleware/auth.js";

const router = express.Router();

function getUserId(req) {
  const user =
    req.user ||
    req.user?.user ||
    req.user?.data ||
    {};

  const userId =
    user.id ||
    user._id ||
    user.sub ||
    user.userId ||
    null;

  return userId;
}

// ➕ Create habit
router.post("/", auth, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      console.error("❌ Habit creation error: No user id on req.user:", req.user);
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id on token)." });
    }

    const {
      name,
      title,
      frequency = [],
      streak = 0,
    } = req.body;

    const habitName = (name || title || "").trim();

    if (!habitName) {
      console.error("❌ Habit creation error: No name/title in body:", req.body);
      return res.status(400).json({ error: "Habit name is required." });
    }

    console.log("📥 Creating habit for user:", userId, "name:", habitName);

    const newHabit = await Habit.create({
      name: habitName,
      frequency,
      streak,
      user: userId,
    });

    console.log("✅ Habit created:", newHabit._id);

    res.status(201).json(newHabit);
  } catch (err) {
    console.error("❌ Habit creation error:", err);
    res.status(500).json({ error: err.message || "Failed to create habit." });
  }
});

// 📋 Get all habits (user-specific)
router.get("/", auth, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      console.error("❌ Habit fetch error: No user id on req.user:", req.user);
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id on token)." });
    }

    const habits = await Habit.find({ user: userId }).sort({ createdAt: -1 });

    res.json(habits);
  } catch (err) {
    console.error("❌ Habit fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update habit
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id on token)." });
    }

    const updated = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("❌ Habit update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ❌ Delete habit
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id on token)." });
    }

    await Habit.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    res.json({ message: "Habit deleted" });
  } catch (err) {
    console.error("❌ Habit delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
