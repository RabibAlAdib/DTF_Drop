'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

// Lazy load tabs for better performance
const UsersTab = dynamic(() => import('./tabs/UsersTab'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
});
const StatsTab = dynamic(() => import('./tabs/StatsTab'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
});
const SettingsTab = dynamic(() => import('./tabs/SettingsTab'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
});

const AdminModal = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobile, setIsMobile] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState(new Set(['stats'])); // Track loaded tabs

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`
        absolute inset-0 flex items-center justify-center p-4
        ${isMobile ? 'p-2' : ''}
      `}>
        <div className={`
          bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] 
          ${isMobile ? 'h-[95vh] max-w-full rounded-lg' : 'h-[85vh]'}
          transform transition-all duration-300 scale-100 flex flex-col
        `}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user?.username || 'Admin'}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setLoadedTabs(prev => new Set([...prev, tab.id]));
                }}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className={`${isMobile ? 'hidden sm:inline' : ''}`}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'stats' && loadedTabs.has('stats') && <StatsTab />}
              {activeTab === 'users' && loadedTabs.has('users') && <UsersTab />}
              {activeTab === 'settings' && loadedTabs.has('settings') && <SettingsTab />}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile swipe gestures */}
      {isMobile && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg">
            <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModal;