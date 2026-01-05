// frontend/src/utils/api.js
import axios from "axios";

const API_BASE = "http://localhost:4000/api";

/* -------------------------------------------------------------------------- */
/*                    ✅ Automatically Attach JWT Token                       */
/* -------------------------------------------------------------------------- */

// Configure axios defaults for security
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

axios.interceptors.request.use((config) => {
  // CSRF protection - add token to headers
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

/* -------------------------------------------------------------------------- */
/*                              🔐 AUTH API                                   */
/* -------------------------------------------------------------------------- */

export const signup = (data) =>
  axios.post(`${API_BASE}/auth/signup`, data);

export const login = async (data) => {
  const res = await axios.post(`${API_BASE}/auth/login`, data);
  // Token now handled via httpOnly cookies on backend
  return res;
};

export const logout = async () => {
  try {
    await axios.post(`${API_BASE}/auth/logout`);
  } catch (err) {
    console.error('Logout error:', err);
  }
};

/* -------------------------------------------------------------------------- */
/*                               📌 TASKS API                                 */
/* -------------------------------------------------------------------------- */

export const getTasks = () => axios.get(`${API_BASE}/tasks`);
export const createTask = (task) => axios.post(`${API_BASE}/tasks`, task);
export const updateTask = (id, data) =>
  axios.put(`${API_BASE}/tasks/${id}`, data);
export const deleteTask = (id) =>
  axios.delete(`${API_BASE}/tasks/${id}`);

/* -------------------------------------------------------------------------- */
/*                               📌 HABITS API                                */
/* -------------------------------------------------------------------------- */

export const getHabits = () => axios.get(`${API_BASE}/habits`);
export const createHabit = (habit) =>
  axios.post(`${API_BASE}/habits`, habit);
export const updateHabit = (id, data) =>
  axios.put(`${API_BASE}/habits/${id}`, data);
export const deleteHabit = (id) =>
  axios.delete(`${API_BASE}/habits/${id}`);

/* -------------------------------------------------------------------------- */
/*                               📓 JOURNAL API                               */
/* -------------------------------------------------------------------------- */

export const getJournalEntries = () => axios.get(`${API_BASE}/journal`);
export const createJournalEntry = (entry) =>
  axios.post(`${API_BASE}/journal`, entry);
export const deleteJournalEntry = (id) =>
  axios.delete(`${API_BASE}/journal/${id}`);

/* -------------------------------------------------------------------------- */
/*                           🤖 AI ASSISTANT + GENERAL AI                     */
/* -------------------------------------------------------------------------- */

function cleanPromptInput(prompt) {
  if (typeof prompt !== "string") return prompt;
  
  return prompt
    .replace(/[<>"'&]/g, '') // Remove potential XSS chars
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Universal AI helper:
 * - If called with a STRING  → mode: "general", prompt: string
 * - If called with an OBJECT → sent as-is (can include mode, journal, tasks, etc.)
 *
 * Works for:
 * - Assistant page (string prompts)
 * - Journal AI (object with mode + journal)
 * - Any other custom AI call
 */
export const getAISuggestion = async (input) => {
  try {
    let body;

    if (typeof input === "string") {
      const cleanedPrompt = cleanPromptInput(input);
      body = {
        mode: "general",
        prompt: cleanedPrompt,
      };
    } else if (input && typeof input === "object") {
      body = { ...input };

      if (typeof body.prompt === "string") {
        body.prompt = cleanPromptInput(body.prompt);
      }
    } else {
      return "Invalid AI request.";
    }

    const res = await axios.post(`${API_BASE}/ai/suggest`, body);

    const data = res.data || {};
    return (
      data.reply ||
      data.message ||
      data.suggestion ||
      data.error ||
      "No AI reply returned."
    );
  } catch (err) {
    console.error("AI error:", err.message);
    return "AI service unavailable.";
  }
};
