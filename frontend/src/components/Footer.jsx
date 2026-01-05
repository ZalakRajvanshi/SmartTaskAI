import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-100 text-center py-6 mt-16">
      <p className="text-gray-500 text-sm">
        © {new Date().getFullYear()} Smarttask AI — All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
