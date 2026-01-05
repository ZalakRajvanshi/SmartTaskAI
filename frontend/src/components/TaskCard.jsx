import React from "react";
import { updateTask, deleteTask } from "../utils/api";
import { FaCheck, FaTrash, FaClipboardList } from "react-icons/fa";

export default function TaskCard({ task }) {
  const handleToggle = async () => {
    try {
      await updateTask(task._id, { completed: !task.completed });
      window.location.reload(); // Quick refresh — upgrade later with state lifting
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task._id);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700 relative overflow-hidden">

      {/* Completed Badge */}
      {task.completed && (
        <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow">
          Completed
        </span>
      )}

      {/* Title */}
      <div className="flex items-start gap-3">
        <div className="p-3 bg-blue-500 text-white rounded-xl">
          <FaClipboardList size={18} />
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {task.title}
          </h2>

          {task.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition 
            ${task.completed ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"}`}
        >
          <FaCheck />
          {task.completed ? "Undo" : "Complete"}
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
