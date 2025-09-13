'use client';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center w-12 h-6 transition-colors duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-black
        ${theme === 'dark' 
          ? 'bg-gray-800 border border-green-500 md:bg-blue-600 md:border-none' 
          : 'bg-gray-300 md:bg-gray-400'
        }`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span
        className={`inline-block w-5 h-5 transition-all duration-300 transform bg-white rounded-full shadow-md md:shadow-sm
          ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`}
        style={{
          boxShadow: theme === 'dark' 
            ? '0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      />
      
      {/* Mobile icons only - keep the fancy glow effect for mobile */}
      <span
        className={`md:hidden absolute left-1 top-1 w-4 h-4 flex items-center justify-center transition-opacity duration-300
          ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}
      >
        ☀️
      </span>
      <span
        className={`md:hidden absolute right-1 top-1 w-4 h-4 flex items-center justify-center transition-opacity duration-300
          ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}
      >
        🌙
      </span>
    </button>
  );
};

export default ThemeToggle;