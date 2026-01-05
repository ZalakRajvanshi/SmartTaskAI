// backend/routes/tasks.js
import express from "express";
import Task from "../models/taskModel.js";
import auth from "../middleware/auth.js";

const router = express.Router();

function getUserId(req) {
  return req.user?.id || req.user?._id || req.user?.sub;
}

// ➕ Create task
router.post("/", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated (no user id)." });
    }

    const newTask = await Task.create({
      ...req.body,
      user: userId,
    });

    res.status(201).json(newTask);
  } catch (err) {
    console.error("❌ Task creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📋 Get all tasks (user-specific)
router.get("/", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated (no user id)." });
    }

    const tasks = await Task.find({ user: userId });
    res.json(tasks);
  } catch (err) {
    console.error("❌ Task fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated (no user id)." });
    }

    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("❌ Task update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ❌ Delete
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated (no user id)." });
    }

    await Task.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("❌ Task delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
