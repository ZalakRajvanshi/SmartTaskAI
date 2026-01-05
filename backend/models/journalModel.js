// backend/models/journalModel.js
import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true }, // HTML from editor
    mood: { type: String },                    // optional
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const JournalEntry = mongoose.model("JournalEntry", journalSchema);
export default JournalEntry;
