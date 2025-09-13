'use client';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Customization = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Customization
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Custom designs coming soon...
            </p>
          </div>

          <div className="bg-gray-50 p-12 rounded-lg text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Customization Features
            </h2>
            <p className="text-gray-600 mb-6">
              We're working on exciting customization options for your drop shoulder clothing. 
              Stay tuned for updates!
            </p>
            <div className="bg-white p-6 rounded-lg inline-block">
              <p className="text-sm text-gray-500">
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