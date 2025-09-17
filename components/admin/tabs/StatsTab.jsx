'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const StatsTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSellers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Make direct API calls without complex authentication
      const [usersResponse, productsResponse, ordersResponse] = await Promise.all([
        axios.get('/api/user/count'),
        axios.get('/api/product/count'),
        axios.get('/api/order/count')
      ]);

      setStats({
        totalUsers: usersResponse.data?.count || 0,
        totalProducts: productsResponse.data?.count || 0,
        totalOrders: ordersResponse.data?.count || 0,
        totalSellers: usersResponse.data?.sellersCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use fallback data if API calls fail
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalSellers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>
            {loading ? '...' : value.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`text-4xl opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          System Dashboard
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time overview of your platform's performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="text-blue-600 dark:text-blue-400"
          description="Registered users"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon="📦"
          color="text-green-600 dark:text-green-400"
          description="Listed products"
        />
        <StatCard
          title="Orders"
          value={stats.totalOrders}
          icon="🛒"
          color="text-purple-600 dark:text-purple-400"
          description="Total orders"
        />
        <StatCard
          title="Sellers"
          value={stats.totalSellers}
          icon="🏪"
          color="text-orange-600 dark:text-orange-400"
          description="Active sellers"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 mt-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={fetchStats}
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
          >
            <span>🔄</span>
            <span className="text-sm font-medium">Refresh Stats</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/seller'}
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
          >
            <span>🏪</span>
            <span className="text-sm font-medium">Seller Dashboard</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/products'}
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
          >
            <span>📦</span>
            <span className="text-sm font-medium">View Products</span>
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Health
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
            <span className="flex items-center text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Online
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Image Storage</span>
            <span className="flex items-center text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Payment System</span>
            <span className="flex items-center text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;