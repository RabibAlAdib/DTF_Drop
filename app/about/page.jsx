'use client';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              About DTF Drop
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Your premier destination for premium drop shoulder clothing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Our Story
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                DTF Drop was founded with a simple mission: to provide high-quality, 
                comfortable drop shoulder clothing that combines style with functionality. 
                We believe that everyone deserves to feel confident and comfortable in their clothing.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our carefully curated collection features the latest trends in drop shoulder 
                fashion, made from premium materials and designed for the modern lifestyle.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Why Choose Us?
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Premium quality materials
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Latest drop shoulder trends
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Comfortable and stylish designs
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Excellent customer service
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                Get In Touch
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span>Phone: +8801344823831</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span>Email: dtfdrop25@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                Follow Us
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Stay connected for latest updates and style inspiration
              </p>
              <div className="space-y-3">
                <a 
                  href="https://www.instagram.com/dtfdrop/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-pink-600 hover:text-pink-700 transition-colors"
                >
                  📷 Instagram
                </a>
                <a 
                  href="https://www.tiktok.com/@dtf.drop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-800 dark:text-white hover:text-gray-600 transition-colors"
                >
                  🎵 TikTok
                </a>
                <a 
                  href="https://facebook.com/dtfdrop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  📘 Facebook Page
                </a>
              </div>
            </div>
          </div>

          {/* Facebook Group Section */}
          <div className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">
              Join Our Community
            </h2>
            <p className="mb-6 opacity-90">
              Connect with other DTF Drop fans, get exclusive updates, and share your style
            </p>
            <div className="flex justify-center">
              <a 
                href="https://www.facebook.com/groups/dtfdrop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold transform hover:scale-105"
              >
                🏠 Visit Our Facebook Group
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default About;