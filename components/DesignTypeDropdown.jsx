"use client";
import { useState, useRef, useEffect } from "react";

const DesignTypeDropdown = ({ designTypes, activeDesignType, onDesignTypeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (designType) => {
    onDesignTypeChange(designType);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-xs" ref={dropdownRef}>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Design Type
        </label>
      </div>
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span title={activeDesignType} className="truncate">
            {truncateText(activeDesignType === 'ALL' ? 'All Design Types' : activeDesignType, 20)}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {designTypes.map((designType) => (
            <button
              key={designType}
              onClick={() => handleSelect(designType)}
              title={designType}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20 focus:outline-none focus:bg-orange-50 dark:focus:bg-orange-900/20 ${
                activeDesignType === designType
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="truncate block">
                {truncateText(designType === 'ALL' ? 'All Design Types' : designType, 25)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignTypeDropdown;