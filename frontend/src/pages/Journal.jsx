// frontend/src/pages/Journal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

import {
  FaSave,
  FaRobot,
  FaListAlt,
  FaPenFancy,
  FaTrash,
  FaSmile,
} from "react-icons/fa";

import {
  getJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
  getAISuggestion,
} from "../utils/api";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [selectedEntryIdx, setSelectedEntryIdx] = useState(null);
  const [aiOutput, setAiOutput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const bottomRef = useRef(null);

  const editor = useCreateBlockNote({
    initialContent: [{ type: "paragraph", content: "Write your journal..." }],
  });

  /**
   * Safely convert the BlockNote document to a plain-text "HTML-ish" string.
   * - Does NOT rely on editor.blocksToHTML / blocksToHTMLLossy
   * - Works even if BlockNote helpers are missing
   */
  const getHTML = async () => {
    if (!editor) return "";

    try {
      const doc = editor.document || [];

      // doc is an array of blocks; each block has .content with inline nodes
      const paragraphs = doc.map((block) => {
        if (!block || !Array.isArray(block.content)) return "";
        return block.content
          .map((inline) => {
            if (!inline) return "";
            // Most inline nodes have a `.text` property
            if (typeof inline.text === "string") return inline.text;
            return "";
          })
          .join("");
      });

      const text = paragraphs.join("\n\n");
      return text.replace(/\s+/g, " ").trim();
    } catch (e) {
      console.error("getHTML fallback error:", e);
      return "";
    }
  };

  /* --------------------------- Load entries --------------------------- */
  const fetchEntries = async () => {
    try {
      setLoadingEntries(true);
      const res = await getJournalEntries();
      const data = res.data;
      if (Array.isArray(data)) setEntries(data);
      else setEntries([]);
    } catch (err) {
      console.error("Journal fetch error:", err);
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  /* ------------------------- Save Journal Entry ------------------------ */
  const handleSave = async () => {
    const html = await getHTML();
    if (!html) {
      alert("Write something first!");
      return;
    }

    try {
      const res = await createJournalEntry({
        title: title || new Date().toLocaleString(),
        content: html, // plain text stored in DB (good enough)
      });

      const saved = res.data;
      setEntries((prev) => [saved, ...prev]);
      setTitle("");

      editor.replaceBlocks(editor.document, [
        { type: "paragraph", content: "Write your journal..." },
      ]);
    } catch (err) {
      console.error("Journal save error:", err);
      const msg = err.response?.data?.error || "Failed to save journal entry.";
      alert(msg);
    }
  };

  /* ------------------------------ Delete ------------------------------ */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      await deleteJournalEntry(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));

      if (
        selectedEntryIdx !== null &&
        entries[selectedEntryIdx] &&
        entries[selectedEntryIdx]._id === id
      ) {
        setSelectedEntryIdx(null);
      }
    } catch (err) {
      console.error("Journal delete error:", err);
      const msg = err.response?.data?.error || "Failed to delete journal entry.";
      alert(msg);
    }
  };

  /* ---------------------------- AI Helpers ----------------------------- */

  const callJournalAI = async (mode) => {
    setLoadingAI(true);
    setAiOutput("");

    try {
      const html = await getHTML();
      if (!html) {
        setAiOutput("Write something in the journal first.");
        setLoadingAI(false);
        return;
      }

      const reply = await getAISuggestion({
        mode,
        journal: html,
      });

      setAiOutput(reply || "AI returned nothing.");
    } catch (err) {
      console.error("Journal AI error:", err);
      setAiOutput("AI failed to generate a response.");
    } finally {
      setLoadingAI(false);
    }
  };

  const summarize = () => callJournalAI("journal_summary");
  const extractTasks = () => callJournalAI("journal_extract");
  const analyzeMood = () => callJournalAI("journal_mood");

  const rewrite = async () => {
    setLoadingAI(true);
    setAiOutput("");

    try {
      const html = await getHTML();
      if (!html) {
        setAiOutput("Write something in the journal first.");
        setLoadingAI(false);
        return;
      }

      const reply = await getAISuggestion(
        `Rewrite this journal entry clearly and concisely:\n\n${html}`
      );

      setAiOutput(reply || "AI returned nothing.");
    } catch (err) {
      console.error("Journal rewrite AI error:", err);
      setAiOutput("AI failed to generate a response.");
    } finally {
      setLoadingAI(false);
    }
  };

  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 dark:bg-gray-900/40 border-b border-gray-700 px-5 py-3">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Journal
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
          Write, save, and use AI insights.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* EDITOR */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title..."
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          />

          <BlockNoteView editor={editor} theme="light" />

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md flex items-center gap-2"
            >
              <FaSave /> Save Entry
            </button>

            {[
              { fn: summarize, icon: FaRobot, label: "Summarize" },
              { fn: extractTasks, icon: FaListAlt, label: "Tasks" },
              { fn: rewrite, icon: FaPenFancy, label: "Rewrite" },
              { fn: analyzeMood, icon: FaSmile, label: "Mood" },
            ].map(({ fn, icon: Icon, label }) => (
              <button
                key={label}
                onClick={fn}
                disabled={loadingAI}
                className="
                  px-4 py-2 rounded-xl border border-black dark:border-white
                  bg-transparent text-black dark:text-white
                  hover:bg-blue-900 dark:hover:bg-white
                  hover:text-white dark:hover:text-blue-900
                  active:scale-95
                  transition-all duration-200
                  flex items-center gap-2
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

          {/* AI OUTPUT BOX */}
          {aiOutput && (
            <div className="mt-4 p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-sm whitespace-pre-line">
              {aiOutput}
            </div>
          )}
        </div>

        {/* ENTRIES LIST */}
        <div className="space-y-4">
          {loadingEntries ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl text-gray-500">
              Loading entries…
            </div>
          ) : entries.length === 0 ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl text-gray-500">
              No entries yet — start journaling!
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={entry._id}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{entry.title}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-2xl"
                      onClick={() => setSelectedEntryIdx(idx)}
                    >
                      Open
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-2xl"
                      onClick={() => handleDelete(entry._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  {entry.content && entry.content.length > 200
                    ? entry.content.slice(0, 200) + "..."
                    : entry.content}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* FULL ENTRY VIEW */}
        {selectedEntryIdx !== null && entries[selectedEntryIdx] && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md mt-4">
            <h3 className="text-lg font-semibold">
              {entries[selectedEntryIdx].title}
            </h3>
            <div className="prose dark:prose-invert mt-4 whitespace-pre-wrap">
              {entries[selectedEntryIdx].content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
