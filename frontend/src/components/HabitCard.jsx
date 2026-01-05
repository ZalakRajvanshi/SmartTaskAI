import React from "react";
import { updateHabit, deleteHabit } from "../utils/api";
import { FaFire, FaTrash, FaRedo } from "react-icons/fa";

export default function HabitCard({ habit }) {

  if (!habit || !habit.title) {
    console.warn("Invalid habit object:", habit);
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg">
        ⚠️ Invalid habit entry
      </div>
    );
  }

  const handleIncrement = async () => {
    try {
      await updateHabit(habit._id, { streak: habit.streak + 1 });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      await updateHabit(habit._id, { streak: 0 });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHabit(habit._id);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
      
      {/* Title & Streak */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {habit.title}
        </h2>
        <div className="flex items-center gap-2">
          <FaFire className="text-orange-500" size={20} />
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {habit.streak}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm dark:text-gray-400">
        Frequency: {habit.frequency}
      </p>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={handleIncrement}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2"
        >
          +1
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition flex items-center gap-2"
        >
          <FaRedo /> Reset
        </button>

        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2"
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
}
