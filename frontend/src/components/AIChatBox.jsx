import React, { useState } from "react";
import { getAISuggestion } from "../utils/api";

export default function AIChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input) return;
    setMessages([...messages, { text: input, type: "user" }]);
    setInput("");
    setLoading(true);
    try {
      const suggestion = await getAISuggestion(input);
      setMessages(prev => [...prev, { text: suggestion, type: "ai" }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "AI Error", type: "ai" }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 p-4 rounded shadow space-y-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded max-w-[70%] ${
              m.type === "user"
                ? "bg-blue-500 text-white ml-auto animate-fade-in"
                : "bg-gray-200 dark:bg-gray-800 text-black animate-fade-in"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask AI..."
          className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600"
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
