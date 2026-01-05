// backend/routes/aiRoutes.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const PYTHON_API_URL = "http://localhost:8001/suggest"; // FastAPI local model

/* -------------------------------------------------------------------------- */
/*                              CLEANUP HELPERS                               */
/* -------------------------------------------------------------------------- */

function cleanAIText(text = "") {
  if (!text || typeof text !== "string") return "";

  let cleaned = text;

  // Remove common leaked instruction fragments (loose matching)
  const badPatterns = [
    /use the smarttask ai[^.\n]*/gi,
    /use the following skills[^.\n]*/gi,
    /follow the on-?screen instructions[^.\n]*/gi,
    /write down one goal and one reason it matters\.?/gi,
    /write down three tasks[^.\n]*/gi,
    /create a short list of tasks and a list of goals\.?/gi,
    /create a task list and set a time frame\.?/gi,
    /\(empty\)/gi,
    /<pad>/gi,
    /<\/s>/gi
  ];

  badPatterns.forEach((re) => {
    cleaned = cleaned.replace(re, "");
  });

  // Remove repeated identical lines (more than 2 repeats)
  const lines = cleaned.split(/\r?\n/).map((l) => l.trim());
  const deduped = [];
  const counts = {};
  for (const l of lines) {
    if (!l) continue;
    counts[l] = (counts[l] || 0) + 1;
    // only keep a line up to twice (prevent spammy repetitions)
    if (counts[l] <= 2) deduped.push(l);
  }

  cleaned = deduped.join("\n");

  // If the response contains a lot of short list indices like "1. 1. 1." collapse them
  cleaned = cleaned.replace(/(\b\d+\.\s*){2,}/g, (m) => m.split(/\d\./).filter(Boolean)[0] || "");

  // collapse many newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  // final trim
  return cleaned.trim();
}

function looksLikeInstruction(text = "") {
  if (!text) return false;
  const t = text.toLowerCase();

  // phrases that indicate it is an instruction template or system text
  const instrIndicators = [
    "use the following skills",
    "follow the on-screen instructions",
    "write down one goal",
    "write down three tasks",
    "create a short list of tasks",
    "create a task list",
    "you are helping someone",
    "you are a",
    "system:",
    "assistant:",
    "as an ai assistant",
    "follow these rules",
    "gate rules",
  ];

  return instrIndicators.some((p) => t.includes(p));
}

function isBadLocalResponse(text = "") {
  const trimmed = (text || "").trim();
  if (!trimmed) return true;

  // Word-count check (very short responses are likely placeholders)
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 6) return true;

  // If it's mostly single-token or punctuation
  if (/^[\s\.\,]+$/.test(trimmed)) return true;

  // If it contains instruction-like content, treat as bad
  if (looksLikeInstruction(trimmed)) return true;

  // If many repeated short lines or duplicates (indicates training example/regurgitation)
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const freq = {};
    for (const l of lines) freq[l] = (freq[l] || 0) + 1;
    const maxRepeat = Math.max(...Object.values(freq));
    if (maxRepeat >= 3) return true; // repeated same line 3+ times
  }

  // If it's just enumerated items without content ("1. 1. 1.") treat as bad
  if (/^(\d+\.\s*){3,}$/.test(trimmed)) return true;

  // Looks okay
  return false;
}

/* -------------------------------------------------------------------------- */
/*                               AI HELPERS                                   */
/* -------------------------------------------------------------------------- */

async function callLocalModel(prompt) {
  try {
    const pythonRes = await axios.post(PYTHON_API_URL, { prompt });
    const data = pythonRes.data || {};

    // Prefer suggestions array but only ONE clean suggestion (don't join multiple)
    if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
      // choose the first non-empty suggestion
      const first = data.suggestions.find((s) => typeof s === "string" && s.trim().length > 0);
      const cleaned = cleanAIText(first || data.suggestions[0] || "");
      // If cleaned still looks like an instruction or placeholder, return empty to trigger fallback
      if (!cleaned || isBadLocalResponse(cleaned)) return "";
      return cleaned;
    }

    // Fallback keys (single suggestion fields)
    const fallback =
      (typeof data.suggestion === "string" && data.suggestion) ||
      (typeof data.reply === "string" && data.reply) ||
      (typeof data.message === "string" && data.message) ||
      "";

    const cleanedFallback = cleanAIText(fallback);
    if (!cleanedFallback || isBadLocalResponse(cleanedFallback)) return "";

    return cleanedFallback;
  } catch (err) {
    console.log("❌ callLocalModel error:", err.message || err.toString());
    return ""; // return empty to indicate failure — our caller will fallback to Gemini
  }
}

async function callGemini(prompt) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    throw new Error("No GEMINI_API_KEY set in environment.");
  }

  // Wrap prompt in a clean system instruction for Gemini: concise, no system text
  const systemWrapper =
    "You are SmartTask AI — a concise, practical productivity assistant. " +
    "Do NOT output internal instructions, system text, or meta commentary. " +
    "Respond only with the requested content, in short practical sentences or bullet points.\n\n";

  // Give Gemini the clean wrapped prompt
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: systemWrapper + prompt }],
      },
    ],
    // request some diversity but keep it practical
    // (the API call options vary by API version; keep minimal here)
  };

  const resp = await axios.post(url, body);
  const text =
    resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "AI could not generate a response.";

  return cleanAIText(text);
}

async function getAIResponse(prompt) {
  // The prompt here is expected to already be the user-facing prompt.
  // We'll first try the local model. If it returns something that looks like a valid answer, use it.
  // Otherwise fall back to Gemini.

  // For safety, ensure the prompt itself is clean and short system is included before sending downstream.
  const systemPrefix =
    "You are SmartTask AI — a concise, practical productivity assistant. " +
    "Do NOT output internal instructions, system text, or meta commentary. " +
    "Respond only with the requested content.\n\n";

  const modelPrompt = systemPrefix + prompt;

  // 1) Try local model
  const local = await callLocalModel(modelPrompt);
  console.log("🧠 Local model raw:", (local || "<empty>").slice(0, 800));

  if (local && !isBadLocalResponse(local)) {
    return local;
  }

  console.log("⚠ Local model response looks bad or empty → falling back to Gemini...");
  const gemini = await callGemini(modelPrompt);
  return gemini;
}

/* -------------------------------------------------------------------------- */
/*                               MAIN ROUTE                                   */
/* -------------------------------------------------------------------------- */

router.post("/suggest", async (req, res) => {
  try {
    const { mode, tasks = [], task, prompt, journal } = req.body;
    let fullPrompt = "";

    /* ------------------------------ TASK MODES ------------------------------ */

    if (mode === "task_improvement") {
      const lines = tasks
        .map((t, idx) => {
          const desc = t.description ? ` — ${t.description}` : "";
          const title = (t.title || t.name || `Task ${idx + 1}`).trim();
          return `${idx + 1}. ${title}${desc}`;
        })
        .join("\n");

      fullPrompt =
        "Improve each task below. For each task provide:\n" +
        "- One clearer, concise rewritten task (one line).\n" +
        "- Two concrete next actions that can be done today (two short bullet lines).\n\n" +
        "Format example:\n" +
        "Task: <original task>\n" +
        "Improved: <one-line improved task>\n" +
        "Next actions:\n" +
        "- <action 1>\n" +
        "- <action 2>\n\n" +
        "Tasks:\n" +
        lines;
    }

    if (mode === "task_reorder") {
      const titles = tasks.map((t) => (t.title || t.name || "").trim()).filter(Boolean).join("\n");
      fullPrompt =
        "Reorder the following task titles from highest to lowest priority. " +
        "Return ONLY the task titles, one per line, with no extra text or numbering. " +
        "If a title is ambiguous, keep the original text exactly as shown.\n\n" +
        titles;
    }

    if (mode === "task_breakdown") {
      const taskTitle = (task?.title || task?.name || "").trim();
      fullPrompt =
        "Break this task into 4-8 short, actionable steps (numbered). Each step should be a single short sentence.\n\n" +
        taskTitle;
    }

    /* ------------------------------ HABIT MODES ----------------------------- */

    if (mode === "habit_coach") {
      const lines = tasks.map((h, idx) => `${idx + 1}. ${h.title || h.name || "Habit"}`).join("\n");
      fullPrompt =
        "For each habit below, give 1–2 short, practical improvement tips (each tip one line):\n\n" +
        lines;
    }

    if (mode === "habit_routine") {
      const lines = tasks.map((h, idx) => `${idx + 1}. ${h.title || h.name || "Habit"}`).join("\n");
      fullPrompt =
        "Create a simple weekly routine using these habits. Provide a few bullet points describing what to do on different days (keep concise):\n\n" +
        lines;
    }

    if (mode === "habit_discipline") {
      const lines = tasks.map((h, idx) => `${idx + 1}. ${h.title || h.name || "Habit"}`).join("\n");
      fullPrompt =
        "Give realistic discipline and motivation tips to help someone stay consistent. Keep suggestions short and encouraging:\n\n" +
        lines;
    }

    /* ----------------------------- JOURNAL MODES ---------------------------- */

    if (mode === "journal_summary") {
      fullPrompt =
        "Summarize this journal entry in 3–6 concise bullet points focusing on key events and feelings:\n\n" +
        (journal || "");
    }

    if (mode === "journal_extract") {
      fullPrompt =
        "From the journal entry below, extract any tasks or action items as a bullet list (one action per line):\n\n" +
        (journal || "");
    }

    if (mode === "journal_mood") {
      fullPrompt =
        "Analyze the emotional tone of this journal entry in 2–3 short sentences and give 2 simple, practical coping or reflection suggestions:\n\n" +
        (journal || "");
    }

    /* ------------------------------ GENERAL MODE ---------------------------- */

    if (mode === "general") {
      if (Array.isArray(tasks) && tasks.length > 0) {
        const lines = tasks
          .map((t, idx) => {
            const desc = t.description ? ` — ${t.description}` : "";
            const title = t.title || t.name || `Task ${idx + 1}`;
            return `${idx + 1}. ${title}${desc}`;
          })
          .join("\n");

        fullPrompt =
          "A user has the following tasks:\n" +
          lines +
          "\n\nUser request:\n" +
          (prompt || "") +
          "\n\nPrioritize what they should focus on today and give a short reason for each top priority (1-3 items). Then provide 2 concrete next steps.";
      } else {
        fullPrompt =
          "Answer the following request in a concise, practical way. Use short paragraphs or bullet points.\n\n" +
          "Request:\n" +
          (prompt || "");
      }
    }

    /* ------------------------------ FALLBACK -------------------------------- */

    if (!fullPrompt) {
      fullPrompt =
        "Answer the following request in a concise, practical way:\n\n" + (prompt || "Give a helpful response.");
    }

    /* ------------------------------ CALL AI --------------------------------- */

    const aiResponse = await getAIResponse(fullPrompt);

    /* ------------------------ SPECIAL: TASK REORDER ------------------------- */

    if (mode === "task_reorder") {
      const currentIds = tasks.map((t) => t._id);

      if (!aiResponse || typeof aiResponse !== "string") {
        return res.json({ order: currentIds, fallback: true });
      }

      // Accept either newline separated or comma separated titles
      const orderedTitles = aiResponse
        .split(/[\n,]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const matchedTasks = [];
      const usedIds = new Set();

      orderedTitles.forEach((titleFromAI) => {
        const aiTitle = titleFromAI.toLowerCase();
        const found = tasks.find((t) => {
          const taskTitle = (t.title || t.name || "").trim().toLowerCase();
          if (!taskTitle) return false;
          return (
            taskTitle === aiTitle ||
            aiTitle.includes(taskTitle) ||
            taskTitle.includes(aiTitle)
          );
        });

        if (found && !usedIds.has(found._id.toString())) {
          matchedTasks.push(found);
          usedIds.add(found._id.toString());
        }
      });

      // Append any tasks not matched (preserve original order)
      const missingTasks = tasks.filter((t) => !usedIds.has(t._id.toString()));
      const finalTasks = [...matchedTasks, ...missingTasks];
      const order = finalTasks.map((t) => t._id);

      if (!order.length) {
        return res.json({ order: currentIds, fallback: true });
      }

      return res.json({ order, fallback: false });
    }

    /* --------------------------- DEFAULT RESPONSE --------------------------- */

    return res.json({
      reply: aiResponse,
      message: aiResponse,
      suggestion: aiResponse,
    });
  } catch (err) {
    console.error("❌ AI Route Failed:", err && err.message ? err.message : err);
    res.status(500).json({ error: "AI processing failed." });
  }
});

export default router;
