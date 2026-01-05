import React, { useEffect, useState } from "react";
import { FaTasks, FaFireAlt, FaCheckCircle, FaPenFancy, FaUserCircle } from "react-icons/fa";
import { getTasks, getHabits, getAISuggestion } from "../utils/api";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [focus, setFocus] = useState("Loading...");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const t = await getTasks();
      const h = await getHabits();
      setTasks(t.data);
      setHabits(h.data);
    };
    fetchData();
  }, []);

  const fetchFocus = async () => {
    try {
      setLoadingAI(true);
      const suggestion = await getAISuggestion("Give me a productivity focus for today.");
      setFocus(suggestion);
    } catch (err) {
      setFocus("Unable to load daily focus.");
    }
    setLoadingAI(false);
  };

  useEffect(() => {
    fetchFocus();
  }, []);

  return (
    <div className="p-8 space-y-10 font-sans bg-gray-50 dark:bg-gray-900 transition-colors duration-300 min-h-screen">

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg bg-white dark:bg-gray-800 flex justify-center items-center">
          <FaUserCircle className="w-14 h-14 text-gray-400 dark:text-gray-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hello, John Doe</h2>
          <p className="text-gray-600 dark:text-gray-400">Here’s your productivity overview</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Tasks */}
        <div className="flex items-center p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-2 bg-blue-100 dark:bg-gray-800">
          <div className="p-4 bg-blue-300 text-white rounded-xl">
            <FaTasks size={28} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Tasks</h3>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{tasks.length}</p>
          </div>
        </div>

        {/* Habit Streaks */}
        <div className="flex items-center p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-2 bg-green-100 dark:bg-gray-800">
          <div className="p-4 bg-green-300 text-white rounded-xl">
            <FaFireAlt size={28} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Habit Streaks</h3>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {habits.reduce((sum, h) => sum + (h.streak || 0), 0)}
            </p>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="flex items-center p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-2 bg-yellow-100 dark:bg-gray-800">
          <div className="p-4 bg-yellow-300 text-white rounded-xl">
            <FaCheckCircle size={28} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Completed Tasks</h3>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {tasks.filter(t => t.completed).length}
            </p>
          </div>
        </div>
      </div>

      {/* AI Focus Card */}
      <div className="p-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-2 bg-purple-100 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FaPenFancy /> Today's AI Focus
          </h3>
          <button
            onClick={fetchFocus}
            className="px-4 py-2 bg-purple-300 dark:bg-purple-600 rounded-lg hover:bg-purple-400 dark:hover:bg-purple-700 text-white transition"
          >
            Refresh
          </button>
        </div>
        <p className={`text-gray-900 dark:text-gray-100 text-lg leading-relaxed ${loadingAI ? "animate-pulse" : ""}`}>
          {loadingAI ? "AI is thinking..." : focus}
        </p>
      </div>

    </div>
  );
}
