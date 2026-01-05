import React, { useState, useRef, useEffect, useCallback } from "react";
import { getAISuggestion, getTasks, getHabits } from "../utils/api";

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [journal, setJournal] = useState([]);
  const bottomRef = useRef(null);

  /* --------------------------- FETCH USER DATA --------------------------- */
  const fetchData = async () => {
    try {
      const [tasksRes, habitsRes] = await Promise.all([getTasks(), getHabits()]);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setHabits(Array.isArray(habitsRes.data) ? habitsRes.data : []);

      // Load journal from local storage
      const journalRaw = localStorage.getItem("smarttask_journal_v3");
      setJournal(journalRaw ? JSON.parse(journalRaw) : []);
    } catch (err) {
      console.error("Failed to fetch assistant data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* --------------------------- SEND MESSAGE --------------------------- */
  const send = useCallback(async (customPrompt) => {
    const userText = customPrompt || input.trim();
    if (!userText) return;
    if (!customPrompt) setInput("");

    setMessages((prev) => [...prev, { type: "user", text: userText }]);
    setLoading(true);

    try {
      // Build full context for AI
      const context = `
Tasks: ${tasks.map((t) => `- ${t.title}${t.completed ? " ✅" : ""}`).join("\n")}
Habits: ${habits.map((h) => `- ${h.title} (Streak: ${h.streak})`).join("\n")}
Journal: ${journal.slice(0, 5).map((j) => `- ${j.title}: ${j.content.substring(0, 50)}...`).join("\n")}

User Query: ${userText}
Provide guidance, suggestions, prioritization, and insights.
      `;

      const aiReply = await getAISuggestion(context);
      setMessages((prev) => [...prev, { type: "ai", text: aiReply }]);
    } catch {
      setMessages((prev) => [...prev, { type: "ai", text: "Error getting response." }]);
    }

    setLoading(false);
  }, [input, tasks, habits, journal]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") send();
  }, [send]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const handleSendClick = useCallback(() => {
    send();
  }, [send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const actionButtons = [
    { label: "Daily Guidance", prompt: "Provide complete daily guidance based on my tasks, habits, and journal." },
    { label: "Task Prioritization", prompt: "Prioritize my tasks and suggest what to focus on today." },
    { label: "Habit Tips", prompt: "Suggest tips to improve my habit consistency." },
    { label: "Journal Insights", prompt: "Provide insights based on my recent journal entries." },
  ];

  return (
    <div className="flex flex-col h-full w-full">

      {/* HEADER */}
      <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 px-5 py-3 sticky top-0 z-20">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          SmartTask AI
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
          Your daily AI assistant. Reads tasks, habits, journal, and provides guidance.
        </p>
      </div>

      {/* AI ACTION BUTTONS */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-3">
        {actionButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => send(btn.prompt)}
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
            {btn.label}
          </button>
        ))}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex w-full ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] px-4 py-3 rounded-3xl text-[15px] shadow-sm transition-all duration-300
              ${msg.type === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl w-fit shadow-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT BAR */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 backdrop-blur-xl bg-white/70 dark:bg-gray-900/40">
        <div className="flex gap-3 items-center">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleSendClick}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl shadow-md font-medium transition-all duration-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
