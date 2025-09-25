"use client";
import React from 'react';
import Link from 'next/link';

const PromotionalSection = () => {
  return (
    <section className="my-12">
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-20 h-20 bg-blue-500 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 bg-indigo-500 rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-purple-500 rounded-full"></div>
        </div>

        <div className="relative px-8 py-16 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Elevate Your Style Game
            </h2>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              From premium drop shoulder designs to custom creations - 
              everything you need to express your unique style
            </p>

            {/* Buttons Container */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Shop Page Button */}
              <Link 
                href="/all-products"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl min-w-[160px]"
              >
                Shop Now →
              </Link>

              {/* Group Visit Link Button */}
              <a 
                href="https://www.facebook.com/groups/dtfdrop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl min-w-[160px]"
              >
                Join Community
              </a>
            </div>

            {/* Additional Info */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                Premium Quality
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                Custom Designs
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                Fast Delivery
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-6 right-6 opacity-20">
          <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
          </svg>
        </div>
        <div className="absolute bottom-6 left-6 opacity-20">
          <svg className="w-20 h-20 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default PromotionalSection;