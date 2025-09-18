'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AdminModal from './AdminModal';

const FloatingAdminButton = () => {
  const { user, isLoaded } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if current user is the admin (match server-side logic)
  const isAdminUser = () => {
    if (!isLoaded || !user) return false;
    
    // Get primary email address (same logic as server)
    const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
    
    // Only check email like server-side authentication
    return primaryEmail === 'dtfdrop25@gmail.com';
  };

  // Don't render if not admin user
  if (!isAdminUser()) {
    return null;
  }

  return (
    <>
      {/* Floating Admin Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
        title="Admin Settings"
      >
        {/* Admin Icon */}
        <svg 
          className="w-6 h-6 transition-transform group-hover:rotate-12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
        
        {/* Admin Badge */}
        <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full px-1.5 py-0.5 font-bold">
          A
        </span>
      </button>

      {/* Mobile-optimized positioning */}
      <style jsx>{`
        @media (max-width: 768px) {
          button {
            bottom: 1rem !important;
            right: 1rem !important;
            width: 56px !important;
            height: 56px !important;
          }
        }
      `}</style>

      {/* Admin Modal */}
      {isModalOpen && (
        <AdminModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};

export default FloatingAdminButton;