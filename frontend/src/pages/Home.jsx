import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="w-full">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 bg-gradient-to-br from-indigo-50 to-purple-50 text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          The AI-powered Productivity System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Smart task management, habit tracking, daily journal insights, and a
          personal AI assistant — all in one place.
        </p>

        <Link
          to="/signup"
          className="px-6 py-3 bg-indigo-600 text-white rounded-md text-lg hover:bg-indigo-700"
        >
          Get Started Free
        </Link>
      </section>

      {/* Features */}
      <section className="px-8 py-20 max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
        <div className="p-6 shadow-md bg-white rounded-xl">
          <h3 className="text-xl font-semibold mb-3">Smart Tasks</h3>
          <p className="text-gray-600">
            AI-suggested tasks that adapt to your workflow.
          </p>
        </div>

        <div className="p-6 shadow-md bg-white rounded-xl">
          <h3 className="text-xl font-semibold mb-3">Habit Tracking</h3>
          <p className="text-gray-600">
            Build habits with reminders, stats, and AI improvements.
          </p>
        </div>

        <div className="p-6 shadow-md bg-white rounded-xl">
          <h3 className="text-xl font-semibold mb-3">AI Assistant</h3>
          <p className="text-gray-600">
            Chat with your personal productivity coach anytime.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-8 py-20 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-10">Simple Pricing</h2>

        <div className="flex flex-col md:flex-row justify-center gap-10">
          <div className="p-8 bg-white shadow-lg rounded-xl max-w-sm">
            <h3 className="text-xl font-semibold mb-4">Free</h3>
            <p className="text-4xl font-bold mb-4">$0</p>
            <p className="text-gray-600 mb-6">Basic features + limited AI</p>
            <Link
              to="/signup"
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Start Free
            </Link>
          </div>

          <div className="p-8 bg-white shadow-lg rounded-xl max-w-sm border border-indigo-600">
            <h3 className="text-xl font-semibold mb-4">Pro</h3>
            <p className="text-4xl font-bold mb-4">$7/mo</p>
            <p className="text-gray-600 mb-6">Unlimited AI + advanced tools</p>
            <Link
              to="/signup"
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go Pro
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
