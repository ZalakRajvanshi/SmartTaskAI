import React, { useState, useEffect, useRef } from "react";
import { getTasks, createTask } from "../utils/api";
import TaskCard from "../components/TaskCard";
import { AiOutlinePlus } from "react-icons/ai";
import { FaMagic, FaListOl, FaLightbulb } from "react-icons/fa";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const bottomRef = useRef(null);

  const API_BASE = "http://localhost:4000";

  /* ---------------------------------- FETCH ---------------------------------- */
  const fetchTasks = async () => {
    try {
      const t = await getTasks();
      console.log("Fetched tasks:", t.data);
      if (Array.isArray(t.data)) setTasks(t.data);
      else setTasks([]);
    } catch (err) {
      console.error("Tasks fetch error:", err);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tasks]);

  /* --------------------------------- ADD TASK -------------------------------- */
  const handleAdd = async () => {
    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        description: desc,
        completed: false,
      });
      setTitle("");
      setDesc("");
      fetchTasks();
    } catch (err) {
      console.error("Task Add Error:", err);
    }
  };

  /* ------------------------------- AI HANDLERS ------------------------------- */

  // 1) AI Suggest Task Improvements
  const handleAISuggestions = async () => {
    if (!tasks.length) return alert("Add some tasks first.");

    try {
      setLoadingAI(true);

      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "task_improvement",
          tasks,
        }),
      });

      const data = await res.json();
      const text = data.message || data.reply || data.suggestion;

      if (!text) return alert("AI returned nothing.");

      alert("AI Suggestions:\n\n" + text);
    } catch (err) {
      console.error(err);
      alert("AI failed.");
    } finally {
      setLoadingAI(false);
    }
  };

  // 2) AI Reorder Tasks by Priority
  const handleAIReorder = async () => {
    if (!tasks.length) return alert("Add some tasks first.");

    try {
      setLoadingAI(true);

      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "task_reorder",
          tasks,
        }),
      });

      const data = await res.json();
      if (!data?.order || !Array.isArray(data.order)) {
        return alert("AI did not return a reorder suggestion.");
      }

      const reordered = data.order
        .map((id) => tasks.find((t) => t._id === id))
        .filter(Boolean);

      if (!reordered.length) {
        return alert(
          "AI could not map the tasks correctly. Keeping original order."
        );
      }

      setTasks(reordered);

      alert("Tasks reordered by AI priority.");
    } catch (err) {
      console.error(err);
      alert("AI failed.");
    } finally {
      setLoadingAI(false);
    }
  };

  // 3) AI Create Subtasks
  const handleAISubtasks = async () => {
    if (!tasks.length) return alert("Select a task first.");

    const titleList = tasks.map((t) => `${t._id} — ${t.title}`).join("\n");
    const selected = prompt(
      "Enter the ID of the task you want subtasks for:\n\n" + titleList
    );

    if (!selected) return;

    const task = tasks.find((t) => t._id === selected);
    if (!task) return alert("Invalid task ID.");

    try {
      setLoadingAI(true);

      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "task_breakdown",
          task,
        }),
      });

      const data = await res.json();
      const text = data.message || data.reply || data.suggestion;

      if (!text) return alert("AI returned nothing.");

      alert("AI Subtasks:\n\n" + text);
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
          Tasks
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
          Manage your daily tasks efficiently
        </p>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 backdrop-blur-xl bg-white/70 dark:bg-gray-900/40 flex flex-col md:flex-row gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Task Title"
          className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Description"
          className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl shadow-md font-medium transition-all duration-200 flex items-center gap-2"
        >
          <AiOutlinePlus /> Add Task
        </button>
      </div>

      {/* AI ACTION BAR */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3 flex-wrap">
        {[
          { onClick: handleAISuggestions, icon: FaLightbulb, label: "AI Suggestions" },
          { onClick: handleAIReorder, icon: FaListOl, label: "AI Reorder" },
          { onClick: handleAISubtasks, icon: FaMagic, label: "AI Subtasks" },
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

      {/* TASK LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {tasks.length > 0 ? (
          tasks.map((t) => <TaskCard key={t._id} task={t} />)
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-12">
            No tasks yet. Add your first task! ✅
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>
    </div>
  );
}