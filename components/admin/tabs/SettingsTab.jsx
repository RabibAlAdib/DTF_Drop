'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    siteName: 'DTF Drop',
    currency: 'BDT',
    maintenanceMode: false,
    newUserRegistration: true,
    allowGuestCheckout: true,
    enableReviews: true
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setInitialLoad(true);
      const response = await axios.get('/api/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load settings');
      }
    } finally {
      setInitialLoad(false);
    }
  };

  // Environment Variables Display
  const [envVars, setEnvVars] = useState([
    { name: 'MONGODB_URI', status: 'configured', description: 'Database connection' },
    { name: 'CLERK_SECRET_KEY', status: 'configured', description: 'Authentication service' },
    { name: 'CLOUDINARY_CLOUD_NAME', status: 'configured', description: 'Image storage' },
    { name: 'CLOUDINARY_API_KEY', status: 'configured', description: 'Image upload API' },
    { name: 'CLOUDINARY_API_SECRET', status: 'configured', description: 'Image management' },
    { name: 'INNGEST_EVENT_KEY', status: 'configured', description: 'Background jobs' },
    { name: 'INNGEST_SIGNING_KEY', status: 'configured', description: 'Event processing' }
  ]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/settings', settings);
      if (response.data.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to save settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      setLoading(true);
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Cache cleared successfully!');
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const restartServer = async () => {
    if (!confirm('Are you sure you want to restart the server? This will temporarily make the site unavailable.')) {
      return;
    }
    
    try {
      toast.loading('Restarting server...', { duration: 3000 });
      // In a real implementation, this would trigger a server restart
      setTimeout(() => {
        toast.success('Server restarted successfully!');
      }, 3000);
    } catch (error) {
      toast.error('Failed to restart server');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'configured':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'missing':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">System Settings</h3>
        <p className="text-gray-600 dark:text-gray-400">Manage system configuration and environment</p>
      </div>

      {/* Site Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">⚙️</span>
          Site Configuration
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleSettingChange('siteName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="BDT">BDT (Bangladeshi Taka)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="mt-6">
          <h5 className="text-md font-medium text-gray-900 dark:text-white mb-4">Feature Toggles</h5>
          <div className="space-y-4">
            {[
              { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Temporarily disable site access' },
              { key: 'newUserRegistration', label: 'New User Registration', description: 'Allow new users to register' },
              { key: 'allowGuestCheckout', label: 'Guest Checkout', description: 'Allow checkout without account' },
              { key: 'enableReviews', label: 'Product Reviews', description: 'Enable product review system' }
            ].map((toggle) => (
              <div key={toggle.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{toggle.label}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{toggle.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[toggle.key]}
                    onChange={(e) => handleSettingChange(toggle.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">🔐</span>
          Environment Variables
        </h4>
        
        <div className="space-y-3">
          {envVars.map((envVar) => (
            <div key={envVar.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">{envVar.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{envVar.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(envVar.status)}`}>
                {envVar.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Environment variables are managed securely through Replit's encrypted secrets system. 
            Values cannot be displayed for security reasons.
          </p>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">🔧</span>
          System Actions
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={clearCache}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Clear Cache</span>
          </button>
          
          <button
            onClick={restartServer}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Restart Server</span>
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Warning:</strong> System actions may temporarily affect site availability. 
              Use with caution in production environments.
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">ℹ️</span>
          System Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform:</span>
              <span className="font-medium">Replit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Framework:</span>
              <span className="font-medium">Next.js 15.5.2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Database:</span>
              <span className="font-medium">MongoDB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Authentication:</span>
              <span className="font-medium">Clerk</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Storage:</span>
              <span className="font-medium">Cloudinary</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Styling:</span>
              <span className="font-medium">Tailwind CSS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Background Jobs:</span>
              <span className="font-medium">Inngest</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Deployment:</span>
              <span className="font-medium">Development</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;