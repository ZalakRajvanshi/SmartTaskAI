import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaTasks,
  FaCalendarCheck,
  FaRobot,
  FaMoon,
  FaSun,
  FaBars,
  FaBookOpen,
  FaCog,
} from "react-icons/fa";

export default function Sidebar({ dark, setDark }) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { title: "Dashboard", icon: <FaHome />, path: "/" },
    { title: "Tasks", icon: <FaTasks />, path: "/tasks" },
    { title: "Habits", icon: <FaCalendarCheck />, path: "/habits" },
    { title: "AI Assistant", icon: <FaRobot />, path: "/assistant" },
    { title: "Journal", icon: <FaBookOpen />, path: "/journal" },     // ✅ NEW
    { title: "Settings", icon: <FaCog />, path: "/settings" },        // ✅ NEW
  ];

  return (
    <div
      className={`h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg 
      transition-all duration-300 flex flex-col
      ${collapsed ? "w-20" : "w-64"}`}
    >
      
      {/* Top section: Logo + Collapse button */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-wide">
            SmartTask<span className="text-blue-600">AI</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-700 dark:text-gray-300 text-xl hover:scale-110 transition"
        >
          <FaBars />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 mt-2">
        {menuItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition relative group
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>

            {/* Text only if expanded */}
            {!collapsed && (
              <span className="font-medium whitespace-nowrap">{item.title}</span>
            )}

            {/* Tooltip when collapsed */}
            {collapsed && (
              <span
                className="absolute left-16 opacity-0 group-hover:opacity-100 
                  bg-gray-900 text-white px-3 py-1 rounded shadow-lg text-sm
                  transition whitespace-nowrap z-50"
              >
                {item.title}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4">
        <button
          onClick={() => setDark(!dark)}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg transition
            ${collapsed ? "px-0" : "px-4"}
            bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
            hover:bg-gray-300 dark:hover:bg-gray-600`}
        >
          {dark ? <FaSun /> : <FaMoon />}
          {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
      </div>
    </div>
  );
}
