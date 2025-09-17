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
    const [secretsFormData, setSecretsFormData] = useState({});
    const [isUpdatingSecrets, setIsUpdatingSecrets] = useState(false);

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
                
                // Initialize form data with current values
                const initialFormData = {};
                Object.values(response.data.secrets).flat().forEach(secret => {
                    initialFormData[secret.name] = secret.isSet ? '••••••••' : '';
                });
                setSecretsFormData(initialFormData);
            }
        } catch (error) {
            console.error('Failed to fetch secrets:', error);
            toast.error('Failed to load secrets configuration');
        }
    };

    const handleSecretInputChange = (secretName, value) => {
        setSecretsFormData(prev => ({
            ...prev,
            [secretName]: value
        }));
    };

    const handleSecretsUpdate = async () => {
        // Get only secrets that have been changed and have actual values
        const secretsToUpdate = Object.entries(secretsFormData)
            .filter(([key, value]) => value && value.trim() !== '' && value !== '••••••••')
            .map(([key, value]) => key); // SECURITY: Only send keys, never values

        if (secretsToUpdate.length === 0) {
            toast.error('No secrets to update. Please enter values for the secrets you want to change.');
            return;
        }

        setIsUpdatingSecrets(true);

        try {
            const response = await axios.post('/api/admin/secrets', {
                secretKeys: secretsToUpdate
            });

            if (response.data.success) {
                // Create the secure manual update guide
                showSecretUpdateGuide(secretsToUpdate, secretsFormData);
                toast.success('Secret update guide prepared!');
            } else {
                toast.error(response.data.message || 'Failed to prepare secret updates');
            }
        } catch (error) {
            console.error('Secrets update error:', error);
            toast.error('Failed to prepare secret updates');
        } finally {
            setIsUpdatingSecrets(false);
        }
    };

    const showSecretUpdateGuide = (secretKeys, formData) => {
        // Create secure update instructions
        const secretValues = secretKeys.map(key => ({
            key,
            value: formData[key] || ''
        }));

        const instructionsText = `🔐 DTF Drop Secrets Update Guide

To securely update your secrets in Replit:

1. Open the "Secrets" panel in your workspace (Tools → Secrets)
2. Add/update these ${secretKeys.length} secrets:

${secretValues.map(({ key, value }) => `   ${key}="${value}"`).join('\n')}

3. Restart your application after adding secrets
4. Come back here and click "Refresh Configuration" to verify

⚠️ Keep this information secure and delete after use.`;

        // Show the guide in a popup for user to copy
        const popup = window.open('', '_blank', 'width=600,height=400');
        popup.document.write(`
            <html>
                <head><title>Secure Secrets Update Guide</title></head>
                <body style="font-family: monospace; padding: 20px; background: #f5f5f5;">
                    <h2>🔐 Secret Update Guide</h2>
                    <textarea readonly style="width: 100%; height: 300px; font-family: monospace; padding: 10px;">${instructionsText}</textarea>
                    <br><br>
                    <button onclick="navigator.clipboard.writeText(document.querySelector('textarea').value); alert('Copied to clipboard!')">Copy Instructions</button>
                    <button onclick="window.close()" style="margin-left: 10px;">Close</button>
                    <p><small>⚠️ Close this window after copying the instructions for security</small></p>
                </body>
            </html>
        `);
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
                        {/* Replit Secure Storage Banner */}
                        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 1L5 6v6l5 5 5-5V6l-5-5zM8.5 6L10 4.5 11.5 6 10 7.5 8.5 6zM6 8.5L7.5 10 6 11.5 4.5 10 6 8.5zM11.5 14L10 15.5 8.5 14 10 12.5 11.5 14zM14 11.5L12.5 10 14 8.5 15.5 10 14 11.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                                        Replit Secure Storage Active
                                    </h3>
                                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                        <p>Your secrets are managed via Replit's encrypted storage system (AES-256). For security, values must be added manually through Replit's Secrets panel and require server restart.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {secretsLoaded ? (
                            <div className="space-y-6">
                                {/* Secrets Summary */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Configuration Status</h4>
                                            <p className="text-sm text-blue-600 dark:text-blue-300">
                                                {Object.values(secretsByCategory).flat().filter(s => s.isSet).length} of {Object.values(secretsByCategory).flat().length} secrets are configured
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {Math.round((Object.values(secretsByCategory).flat().filter(s => s.isSet).length / Object.values(secretsByCategory).flat().length) * 100)}%
                                            </div>
                                            <div className="text-xs text-blue-500 dark:text-blue-400">Complete</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Secrets Form */}
                                <form onSubmit={(e) => { e.preventDefault(); handleSecretsUpdate(); }} className="space-y-8">
                                    {Object.entries(secretsByCategory).map(([category, secrets]) => (
                                        <div key={category} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                        {category}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {secrets.filter(s => s.isSet).length} of {secrets.length} configured
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        secrets.every(s => s.isSet) ? 'bg-green-500' :
                                                        secrets.some(s => s.isSet) ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}></div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {secrets.every(s => s.isSet) ? 'Complete' :
                                                         secrets.some(s => s.isSet) ? 'Partial' : 'Missing'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {secrets.map((secret) => (
                                                    <div key={secret.name} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {secret.name.replace(/_/g, ' ')}
                                                                {secret.required && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                secret.isSet 
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                            }`}>
                                                                {secret.isSet ? 'SET' : 'EMPTY'}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                            {secret.description}
                                                        </p>
                                                        <div className="relative">
                                                            <input
                                                                type={secret.name.toLowerCase().includes('password') || 
                                                                     secret.name.toLowerCase().includes('secret') || 
                                                                     secret.name.toLowerCase().includes('key') ? 'password' : 'text'}
                                                                value={secretsFormData[secret.name] || ''}
                                                                onChange={(e) => handleSecretInputChange(secret.name, e.target.value)}
                                                                placeholder={secret.example ? `e.g., ${secret.example}` : `Enter ${secret.name.toLowerCase().replace(/_/g, ' ')}`}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                                                            />
                                                            {secret.isSet && secretsFormData[secret.name] === '••••••••' && (
                                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                                                                        Current
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {secret.required && !secret.isSet && (
                                                            <p className="text-xs text-red-500 dark:text-red-400">
                                                                This field is required for the application to work properly
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Update Button */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Generate Update Guide</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Create secure instructions for updating secrets manually in Replit
                                                </p>
                                            </div>
                                            <div className="flex space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => fetchSecrets()}
                                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                >
                                                    Refresh Configuration
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isUpdatingSecrets}
                                                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                                        isUpdatingSecrets
                                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                                            : 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                                    }`}
                                                >
                                                    {isUpdatingSecrets ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>Preparing...</span>
                                                        </div>
                                                    ) : (
                                                        'Generate Update Guide'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Security Notice */}
                                        <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                                        <strong>Security Notice:</strong> For maximum security, secret values are never transmitted to the server. 
                                                        You must manually add secrets via Replit's Secrets panel and restart the application.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <span className="mt-4 block text-gray-600 dark:text-gray-400">Loading secrets configuration...</span>
                                </div>
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
                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img 
                                                        src={user.imageUrl || '/default-avatar.png'} 
                                                        alt={user.name}
                                                        className="w-8 h-8 rounded-full mr-3"
                                                    />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={(e) => handleUserRoleUpdate(user._id, e.target.value)}
                                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="seller">Seller</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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

                {/* System Controls - COMMENTED OUT FOR SECURITY */}
                {/* 
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Controls</h2>
                        <p className="text-gray-600 dark:text-gray-400">Dangerous operations - use with caution</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <button
                                onClick={handleSystemReset}
                                className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Reset System (Clear All Data)
                            </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                ⚠️ This will permanently delete all users, products, and orders except admin user.
                            </p>
                        </div>
                    </div>
                </div>
                */}
            </div>
        </div>
    );
};

export default AdminControlPanel;