// backend/models/habitModel.js
import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  frequency: { type: [String], default: [] },
  streak: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // <-- added
}, { timestamps: true });

const Habit = mongoose.model("Habit", habitSchema);

export default Habit;
