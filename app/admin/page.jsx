'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminControlPanel = () => {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // API Keys Management State
    const [apiKeys, setApiKeys] = useState({
        CLERK_SECRET_KEY: '',
        MONGODB_URI: '',
        CLOUDINARY_CLOUD_NAME: '',
        CLOUDINARY_API_KEY: '',
        CLOUDINARY_API_SECRET: '',
        INNGEST_SIGNING_KEY: '',
        INNGEST_EVENT_KEY: '',
        EMAIL_HOST: '',
        EMAIL_PORT: '',
        EMAIL_USER: '',
        EMAIL_PASS: '',
        BKASH_API_KEY: '',
        BKASH_API_SECRET: '',
        NAGAD_MERCHANT_ID: '',
        NAGAD_PUBLIC_KEY: ''
    });

    // System Stats State
    const [systemStats, setSystemStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalSellers: 0
    });

    // Users Management State
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (isLoaded && user) {
            checkAdminAccess();
        } else if (isLoaded && !user) {
            router.push('/');
        }
    }, [isLoaded, user]);

    const checkAdminAccess = async () => {
        try {
            if (user?.username !== 'dtfdrop_admin') {
                toast.error('Access denied. Admin privileges required.');
                router.push('/');
                return;
            }
            
            setIsAdmin(true);
            await fetchSystemStats();
            await fetchAllUsers();
            setLoading(false);
        } catch (error) {
            console.error('Admin access check failed:', error);
            toast.error('Admin verification failed');
            router.push('/');
        }
    };

    const fetchSystemStats = async () => {
        try {
            const response = await axios.get('/api/admin/system-stats');
            if (response.data.success) {
                setSystemStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch system stats:', error);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users');
            if (response.data.success) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleApiKeyUpdate = async (keyName, value) => {
        try {
            const response = await axios.post('/api/admin/update-secret', {
                key: keyName,
                value: value
            });
            
            if (response.data.demo) {
                toast.error(`${response.data.message}`, {
                    duration: 4000
                });
            } else if (response.data.success) {
                toast.success(`${keyName} updated successfully`);
                setApiKeys(prev => ({
                    ...prev,
                    [keyName]: value
                }));
            } else {
                toast.error(response.data.message || 'Failed to update API key');
            }
        } catch (error) {
            toast.error('Failed to update API key');
            console.error('API key update error:', error);
        }
    };

    const handleUserRoleUpdate = async (userId, newRole) => {
        try {
            const response = await axios.post('/api/admin/update-user-role', {
                userId,
                role: newRole
            });
            
            if (response.data.success) {
                toast.success('User role updated successfully');
                await fetchAllUsers();
            } else {
                toast.error(response.data.message || 'Failed to update user role');
            }
        } catch (error) {
            toast.error('Failed to update user role');
            console.error('User role update error:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await axios.delete(`/api/admin/users/${userId}`);
            
            if (response.data.success) {
                toast.success('User deleted successfully');
                await fetchAllUsers();
                await fetchSystemStats();
            } else {
                toast.error(response.data.message || 'Failed to delete user');
            }
        } catch (error) {
            toast.error('Failed to delete user');
            console.error('User deletion error:', error);
        }
    };

    const handleSystemReset = async () => {
        if (!confirm('Are you sure you want to reset the system? This will clear all data except admin user.')) {
            return;
        }

        try {
            const response = await axios.post('/api/admin/system-reset');
            
            if (response.data.success) {
                toast.success('System reset successfully');
                await fetchSystemStats();
                await fetchAllUsers();
            } else {
                toast.error(response.data.message || 'Failed to reset system');
            }
        } catch (error) {
            toast.error('Failed to reset system');
            console.error('System reset error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
                            <p className="text-gray-600">System Administration Dashboard</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Logged in as</p>
                            <p className="font-semibold text-blue-600">{user?.username}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                        <p className="text-3xl font-bold text-blue-600">{systemStats.totalUsers}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Total Products</h3>
                        <p className="text-3xl font-bold text-green-600">{systemStats.totalProducts}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
                        <p className="text-3xl font-bold text-purple-600">{systemStats.totalOrders}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Total Sellers</h3>
                        <p className="text-3xl font-bold text-orange-600">{systemStats.totalSellers}</p>
                    </div>
                </div>

                {/* API Keys Management */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">API Keys & Secrets Management</h2>
                        <p className="text-gray-600">Manage environment variables and API keys</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(apiKeys).map(([keyName, currentValue]) => (
                                <div key={keyName} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {keyName.replace(/_/g, ' ')}
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="password"
                                            value={apiKeys[keyName]}
                                            onChange={(e) => setApiKeys(prev => ({
                                                ...prev,
                                                [keyName]: e.target.value
                                            }))}
                                            placeholder={`Enter ${keyName}`}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <button
                                            onClick={() => handleApiKeyUpdate(keyName, apiKeys[keyName])}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* User Management */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                        <p className="text-gray-600">Manage user accounts and roles</p>
                    </div>
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img 
                                                        src={user.imageUrl || '/default-avatar.png'} 
                                                        alt={user.name}
                                                        className="w-8 h-8 rounded-full mr-3"
                                                    />
                                                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={(e) => handleUserRoleUpdate(user._id, e.target.value)}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="seller">Seller</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.joinDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className={`${user.username === 'dtfdrop_admin' 
                                                        ? 'text-gray-400 cursor-not-allowed' 
                                                        : 'text-red-600 hover:text-red-800'
                                                    }`}
                                                    disabled={user.username === 'dtfdrop_admin'}
                                                >
                                                    {user.username === 'dtfdrop_admin' ? 'Protected' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* System Controls */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">System Controls</h2>
                        <p className="text-gray-600">Dangerous operations - use with caution</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <button
                                onClick={handleSystemReset}
                                className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Reset System (Clear All Data)
                            </button>
                            <p className="text-sm text-gray-500">
                                ⚠️ This will permanently delete all users, products, and orders except admin user.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminControlPanel;