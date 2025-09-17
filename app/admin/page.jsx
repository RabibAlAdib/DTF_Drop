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
    
    // Secrets Management State
    const [secretsByCategory, setSecretsByCategory] = useState({});
    const [secretsLoaded, setSecretsLoaded] = useState(false);

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
            await fetchSecrets();
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

    const fetchSecrets = async () => {
        try {
            const response = await axios.get('/api/admin/secrets');
            if (response.data.success) {
                setSecretsByCategory(response.data.secrets);
                setSecretsLoaded(true);
            }
        } catch (error) {
            console.error('Failed to fetch secrets:', error);
            toast.error('Failed to load secrets configuration');
        }
    };

    const handleSecretUpdate = async (keyName, value) => {
        if (!value.trim()) {
            toast.error('Please enter a value for the secret');
            return;
        }

        try {
            const response = await axios.post('/api/admin/secrets', {
                key: keyName,
                value: value
            });
            
            if (response.data.demo) {
                toast.error(`${response.data.message}`, {
                    duration: 4000
                });
            } else if (response.data.success) {
                toast.success(`${keyName} updated successfully`);
                await fetchSecrets();
            } else {
                toast.error(response.data.message || 'Failed to update secret');
            }
        } catch (error) {
            toast.error('Failed to update secret');
            console.error('Secret update error:', error);
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

                {/* Secrets Management */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Secrets & API Keys Management</h2>
                        <p className="text-gray-600 dark:text-gray-400">Manage environment variables and API keys by category</p>
                    </div>
                    <div className="p-6">
                        {secretsLoaded ? (
                            <div className="space-y-8">
                                {Object.entries(secretsByCategory).map(([category, secrets]) => (
                                    <div key={category} className="border-l-4 border-blue-500 pl-4">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                            {category}
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {secrets.map((secret) => (
                                                <div key={secret.key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {secret.name.replace(/_/g, ' ')}
                                                                {secret.required && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {secret.description}
                                                            </p>
                                                        </div>
                                                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                                                            secret.isSet 
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                        }`}>
                                                            {secret.isSet ? 'Set' : 'Missing'}
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="password"
                                                            defaultValue={secret.currentValue}
                                                            placeholder={secret.example ? `e.g., ${secret.example}` : `Enter ${secret.key}`}
                                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                            onChange={(e) => {
                                                                // Store the value for update
                                                                e.target.setAttribute('data-secret-value', e.target.value);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                const input = e.target.previousElementSibling;
                                                                const value = input.getAttribute('data-secret-value') || input.value;
                                                                handleSecretUpdate(secret.key, value);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                                        >
                                                            Update
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading secrets configuration...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Management */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
                        <p className="text-gray-600 dark:text-gray-400">Manage user accounts and roles</p>
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