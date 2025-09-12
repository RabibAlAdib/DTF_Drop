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

          <div className="text-center bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Connect With Us
            </h2>
            <p className="text-gray-600 mb-6">
              Follow us on social media for the latest updates and style inspiration
            </p>
            <div className="flex justify-center">
              <a 
                href="https://facebook.com/dtfdrop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Visit Our Facebook Page
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