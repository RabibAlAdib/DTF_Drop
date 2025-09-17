"use client";
import { useState, useEffect } from 'react';

const ScrollIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Guard against zero-height pages to prevent NaN
      if (docHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Left Side Gradient Progress Bar */}
      <div className="fixed left-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-gray-700 z-40 opacity-30 pointer-events-none"></div>
      
      {/* Dynamic Progress Indicator */}
      <div 
        className="fixed left-0 top-0 w-1 bg-gradient-to-b from-blue-500 via-purple-600 to-pink-500 z-50 transition-all duration-300 ease-out shadow-lg pointer-events-none"
        style={{ 
          height: `${scrollProgress}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)',
        }}
      >
        {/* Glowing dot at the end - positioned within the bar */}
        <div 
          className="absolute right-0 bottom-0 w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse shadow-lg pointer-events-none"
          style={{
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.8), 0 0 16px rgba(168, 85, 247, 0.6)',
          }}
        ></div>
      </div>

      {/* Floating Progress Percentage (Mobile) - positioned to avoid FloatingCart */}
      <div className="md:hidden fixed bottom-20 left-4 z-40">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-full px-3 py-1 shadow-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </div>
    </>
  );
};

export default ScrollIndicator;