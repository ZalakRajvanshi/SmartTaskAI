// frontend/src/pages/Settings.jsx
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineUpload } from "react-icons/ai";
import { getTasks, getHabits } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const STORAGE_JOURNAL = "smarttask_journal_v1";
const API_BASE = "http://localhost:4000/api";

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();

  const [localName, setLocalName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);

  /* ---------------------- LOAD USER DATA ---------------------- */
  useEffect(() => {
    if (user) {
      setLocalName(user.name || "");
      setEmail(user.email || "");
      setProfilePhoto(user.profilePhoto || null);
    }
  }, [user]);

  /* ---------------------- SAVE PROFILE ---------------------- */
  const saveProfile = async () => {
    try {
      const payload = { name: localName, profilePhoto };
      const updated = await updateProfile(payload);

      setLocalName(updated?.name || "");
      setProfilePhoto(updated?.profilePhoto || null);

      alert("Profile saved!");
    } catch (err) {
      console.error(err);
      alert("Could not update profile.");
    }
  };

  /* ---------------------- CHANGE PHOTO ---------------------- */
  const saveProfilePhoto = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => setProfilePhoto(e.target.result);
    reader.readAsDataURL(file);
  };

  /* ---------------------- EXPORT DATA ---------------------- */
  const exportAll = async () => {
    setExporting(true);
    try {
      const tasks = await getTasks();
      const habits = await getHabits();
      const journal = JSON.parse(localStorage.getItem(STORAGE_JOURNAL) || "[]");

      const payload = {
        exportedAt: new Date().toISOString(),
        tasks: tasks.data,
        habits: habits.data,
        journal,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smarttask-export-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  /* ---------------------- IMPORT JOURNAL ---------------------- */
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.journal) {
          localStorage.setItem(STORAGE_JOURNAL, JSON.stringify(data.journal));
        }
        alert("Journal imported.");
      } catch {
        alert("Invalid file.");
      }
    };
    reader.readAsText(file);
  };

  /* ---------------------- CLEAR LOCAL DATA ---------------------- */
  const clearAllLocal = () => {
    if (!confirm("Clear ALL local data? This cannot be undone.")) return;

    localStorage.clear();
    setProfilePhoto(null);
    setLocalName("");
    setEmail("");

    alert("All local data cleared.");
  };

  /* ---------------------- DELETE ACCOUNT ---------------------- */
  const deleteAccount = async () => {
    const yes = confirm(
      "Are you absolutely sure you want to DELETE your account? This cannot be undone."
    );
    if (!yes) return;

    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/auth/me`);
      logout();
      alert("Your account has been permanently deleted.");
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
    setDeleting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 font-sans text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* ======================== PROFILE ======================== */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2 border-gray-300 dark:border-gray-700">
          Profile
        </h2>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
            {profilePhoto ? (
              <img src={profilePhoto} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-200 dark:bg-gray-700">
                No Photo
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
          >
            <AiOutlineUpload /> Change Photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && saveProfilePhoto(e.target.files[0])}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Display Name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            disabled
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 outline-none"
          />
        </div>

        <div className="flex gap-3 items-center">
          <button onClick={saveProfile} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl">
            Save Profile
          </button>

          <button onClick={logout} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl">
            Logout
          </button>

          <a
            href="/forgot-password"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
          >
            Forgot Password
          </a>
        </div>
      </section>

      {/* ======================== APPEARANCE ======================== */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2 border-gray-300 dark:border-gray-700">
          Appearance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FONT SIZE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Font Size</label>
            <select
              value={localStorage.getItem("smarttask_fontSize") || "base"}
              onChange={(e) => {
                localStorage.setItem("smarttask_fontSize", e.target.value);
                document.documentElement.style.fontSize =
                  e.target.value === "large"
                    ? "18px"
                    : e.target.value === "small"
                    ? "14px"
                    : "16px";
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 outline-none"
            >
              <option value="small">Small</option>
              <option value="base">Normal</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* THEME */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Theme</label>
            <select
              value={localStorage.getItem("smarttask_theme") || "light"}
              onChange={(e) => {
                localStorage.setItem("smarttask_theme", e.target.value);
                document.documentElement.className =
                  e.target.value === "dark" ? "dark" : "";
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 outline-none"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </section>

      {/* ======================== DATA ======================== */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2 border-gray-300 dark:border-gray-700">
          Data & Backup
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={exportAll} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
            {exporting ? "Exporting..." : "Export Data"}
          </button>

          <input type="file" accept=".json" onChange={importData} />

          <button onClick={clearAllLocal} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl">
            Clear Local Data
          </button>
        </div>
      </section>

      {/* ======================== DELETE ACCOUNT ======================== */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Permanently delete your SmartTask AI account. This action cannot be undone.
        </p>

        <button
          onClick={deleteAccount}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </section>

      {/* ======================== ABOUT ======================== */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold">About</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          SmartTask AI — Powered by local FLAN-T5 + Gemini fallback.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Version: 1.0.0</p>
      </section>
    </div>
  );
}
