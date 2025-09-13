'use client';
import React from 'react';
import Footer from '@/components/Footer';

const Customization = () => {
  return (
    <>
      <div className="px-6 md:px-16 lg:px-32 py-16 bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6 animate-pulse-glow">
              Customization
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Custom designs coming soon...
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-12 rounded-2xl text-center shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-float shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Customization Features
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're working on exciting customization options for your drop shoulder clothing. 
              Stay tuned for updates!
            </p>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg inline-block shadow-md border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Content will be added by the team soon.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Customization;