"use client";
import { useTheme } from "@/context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          theme === "dark"
            ? "bg-gray-800 border border-green-500 focus:ring-green-500 focus:ring-offset-black text-white"
            : "bg-gray-300 border border-gray-400 focus:ring-blue-500 focus:ring-offset-white text-black"
        }
      `}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span
        className={`
          inline-block w-5 h-5 rounded-full transition-all duration-300 transform
          bg-white shadow-md
          ${theme === "dark" ? "translate-x-6" : "translate-x-0.5"}
        `}
        style={{
          boxShadow:
            theme === "dark"
              ? "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)"
              : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      />

      {/* Mobile icons */}
      <span
        className={`md:hidden absolute left-1 top-1 w-4 h-4 flex items-center justify-center transition-opacity duration-300 ${theme === "light" ? "opacity-100" : "opacity-0"}`}
      >
        ☀️
      </span>
      <span
        className={`md:hidden absolute right-1 top-1 w-4 h-4 flex items-center justify-center transition-opacity duration-300 ${theme === "dark" ? "opacity-100" : "opacity-0"}`}
      >
        🌙
      </span>
    </button>
  );
};

export default ThemeToggle;
