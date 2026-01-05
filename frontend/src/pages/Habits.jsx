import React, { useEffect, useState, useRef } from "react";
import { getHabits, createHabit } from "../utils/api";
import HabitCard from "../components/HabitCard";
import { AiOutlinePlus } from "react-icons/ai";
import { FaBrain, FaCalendarAlt, FaLightbulb } from "react-icons/fa";

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const bottomRef = useRef(null);

  /* ---------------------------------- FETCH ---------------------------------- */
  const fetchHabits = async () => {
    try {
      const h = await getHabits();

      // assuming getHabits returns an axios-like response { data: [...] }
      const raw = Array.isArray(h?.data) ? h.data : [];

      // 🔥 Normalize backend documents: support `name` or `title`
      const normalized = raw
        .filter((item) => item && (item.name || item.title))
        .map((item) => ({
          ...item,
          // ensure HabitCard can use `habit.title`
          title: item.title || item.name,
        }));

      setHabits(normalized);
    } catch (err) {
      console.error("Habits fetch error:", err);
      setHabits([]);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [habits]);

  /* --------------------------------- ADD HABIT -------------------------------- */
  const handleAdd = async () => {
    if (!title.trim()) return;

    try {
      await createHabit({
        // 🔥 backend expects `name`, not `title`
        name: title.trim(),
        streak: 0,
        frequency: ["Daily"],
      });

      setTitle("");
      await fetchHabits();
    } catch (err) {
      console.error("Habit Add Error:", err);
      alert("Failed to create habit.");
    }
  };

  /* ------------------------------- AI HANDLERS ------------------------------- */

  const API_BASE = "http://localhost:4000";

  // 1) AI Habit Coaching
  const handleAIHabits = async () => {
    if (!habits.length) return alert("Add some habits first.");

    try {
      setLoadingAI(true);
      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({
          mode: "habit_coach",
          tasks: habits,
        }),
      });
      const data = await res.json();
      if (!data?.message) return alert("AI returned nothing.");
      alert("AI Habit Coaching:\n\n" + data.message);
    } catch (err) {
      console.error(err);
      alert("AI failed.");
    } finally {
      setLoadingAI(false);
    }
  };

  // 2) AI Suggest Weekly Routine
  const handleAIWeekly = async () => {
    if (!habits.length) return alert("Add some habits first.");

    try {
      setLoadingAI(true);
      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({
          mode: "habit_routine",
          tasks: habits,
        }),
      });
      const data = await res.json();
      if (!data?.message) return alert("AI returned nothing.");
      alert("AI Weekly Routine:\n\n" + data.message);
    } catch (err) {
      console.error(err);
      alert("AI failed.");
    } finally {
      setLoadingAI(false);
    }
  };

  // 3) AI Discipline Tips
  const handleAIDiscipline = async () => {
    if (!habits.length) return alert("Add some habits first.");

    try {
      setLoadingAI(true);
      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({
          mode: "habit_discipline",
          tasks: habits,
        }),
      });
      const data = await res.json();
      if (!data?.message) return alert("AI returned nothing.");
      alert("AI Discipline Tips:\n\n" + data.message);
    } catch (err) {
      console.error(err);
      alert("AI failed.");
    } finally {
      setLoadingAI(false);
    }
  };

  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Habits
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
          Track your daily progress and streaks
        </p>
      </div>

      {/* ADD HABIT */}
      <div className="px-4 py-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow flex flex-col md:flex-row gap-3">
          <input
            className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="New Daily Habit..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl shadow-md font-medium transition-all duration-200"
          >
            <AiOutlinePlus /> Add Habit
          </button>
        </div>
      </div>

      {/* AI ACTION BAR */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3 flex-wrap">
        {[
          { onClick: handleAIHabits, icon: FaBrain, label: "AI Coaching" },
          { onClick: handleAIWeekly, icon: FaCalendarAlt, label: "Weekly Routine" },
          { onClick: handleAIDiscipline, icon: FaLightbulb, label: "Discipline Tips" },
        ].map(({ onClick, icon: Icon, label }) => (
          <button
            key={label}
            onClick={onClick}
            className="
              px-4 py-2 rounded-xl border border-black dark:border-white
              bg-transparent text-black dark:text-white
              hover:bg-blue-900 dark:hover:bg-white
              hover:text-white dark:hover:text-blue-900
              active:scale-95
              transition-all duration-200
              flex items-center gap-2 shadow-sm
            "
          >
            <Icon /> {label}
          </button>
        ))}

        {loadingAI && (
          <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
            Thinking…
          </span>
        )}
      </div>

      {/* HABIT LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {Array.isArray(habits) && habits.length > 0 ? (
          habits.map((h) => <HabitCard key={h._id} habit={h} />)
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-12">
            No habits yet. Add your first habit! ✅
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>
    </div>
  );
}
