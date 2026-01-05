// backend/routes/journal.js
import express from "express";
import JournalEntry from "../models/journalModel.js";
import auth from "../middleware/auth.js";

const router = express.Router();

function getUserId(req) {
  return req.user?.id || req.user?._id || req.user?.sub;
}

// 📌 Create journal entry
router.post("/", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id)." });
    }

    const { title, content, mood } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required." });
    }

    const entry = await JournalEntry.create({
      title: title || new Date().toISOString(),
      content,
      mood: mood || "",
      user: userId,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("❌ Journal create error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get all journal entries for user
router.get("/", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id)." });
    }

    const entries = await JournalEntry.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json(entries);
  } catch (err) {
    console.error("❌ Journal fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get single entry by id
router.get("/:id", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id)." });
    }

    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!entry) return res.status(404).json({ error: "Entry not found." });

    res.json(entry);
  } catch (err) {
    console.error("❌ Journal fetch single error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Delete entry
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "User not authenticated (no user id)." });
    }

    await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("❌ Journal delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
