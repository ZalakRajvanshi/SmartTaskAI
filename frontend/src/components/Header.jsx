import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="w-full px-8 py-4 shadow-sm bg-white flex justify-between items-center fixed top-0 left-0 z-50">
      <Link to="/" className="text-2xl font-bold text-indigo-600">
        Smarttask AI
      </Link>

      <nav className="flex gap-6 items-center">
        <Link to="/login" className="text-gray-700 hover:text-indigo-600">
          Login
        </Link>
        <Link
          to="/signup"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Get Started
        </Link>
      </nav>
    </header>
  );
};

export default Header;
