'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserProfile } from '@clerk/nextjs';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { assets } from '@/assets/assets';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';

const ProfilePage = () => {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [orderFilter, setOrderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const token = await user.getToken();
      const response = await axios.get('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
        setFilteredOrders(response.data.orders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to orders
  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (orderFilter !== 'all') {
      filtered = filtered.filter(order => order.status === orderFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          filterDate = null;
      }

      if (filterDate) {
        filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
      }
    }

    setFilteredOrders(filtered);
  };

  // Calculate user stats
  const getUserStats = () => {
    const totalOrders = orders.length;
    const totalSpent = orders
      .filter(order => order.payment.status === 'paid' || order.payment.status === 'pending')
      .reduce((sum, order) => sum + order.pricing.totalAmount, 0);
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const pendingOrders = orders.filter(order => ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)).length;

    return { totalOrders, totalSpent, completedOrders, pendingOrders };
  };

  useEffect(() => {
    if (user && isLoaded) {
      fetchUserOrders();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    applyFilters();
  }, [orderFilter, dateFilter, orders]);

  if (!isLoaded) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to view your profile</h2>
          <Link href="/sign-in" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const stats = getUserStats();

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      ready_to_ship: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-teal-100 text-teal-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Image
                src={user.imageUrl || assets.profile_icon}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.fullName || `${user.firstName} ${user.lastName}` || 'User'}
              </h1>
              <p className="text-gray-600 mb-2">{user.primaryEmailAddress?.emailAddress}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <Link
                href="/edit-profile"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Image src={assets.orders_icon} alt="Orders" width={24} height={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-green-600 text-xl">৳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">৳{stats.totalSpent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-full">
                <span className="text-emerald-600 text-xl">✓</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <span className="text-orange-600 text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Account Settings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                {filteredOrders.slice(0, 5).map((order, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Image
                        src={order.items[0]?.productImage || assets.p_img1}
                        alt="Product"
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} item(s) • ৳{order.pricing.totalAmount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <Image src={assets.cart_icon} alt="No orders" width={64} height={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-gray-500">No orders yet</p>
                    <Link href="/collection" className="text-orange-600 hover:text-orange-700 mt-2 inline-block">
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="ml-2 border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Period:</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="ml-2 border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="3months">Last 3 Months</option>
                    </select>
                  </div>

                  <div className="ml-auto">
                    <span className="text-sm text-gray-600">
                      {filteredOrders.length} of {orders.length} orders
                    </span>
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                  {loading ? (
                    <Loading />
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">Order #{order.orderNumber}</h4>
                            <p className="text-sm text-gray-600">
                              Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 md:mt-0">
                            {getStatusBadge(order.status)}
                            <Link 
                              href={`/order-details/${order._id}`}
                              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {order.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center space-x-4">
                              <Image
                                src={item.productImage || assets.p_img1}
                                alt={item.productName}
                                width={50}
                                height={50}
                                className="rounded-md object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-gray-600">
                                  {item.color} • {item.size} • Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold">৳{item.totalPrice}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t mt-4 pt-4 flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            {order.items.length} item(s) • {order.payment.method.replace('_', ' ')}
                          </div>
                          <div className="text-lg font-semibold">
                            Total: ৳{order.pricing.totalAmount}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Image src={assets.search_icon} alt="No orders" width={64} height={64} className="mx-auto mb-4 opacity-50" />
                      <p className="text-gray-500">No orders found with current filters</p>
                      <button
                        onClick={() => {
                          setOrderFilter('all');
                          setDateFilter('all');
                        }}
                        className="text-orange-600 hover:text-orange-700 mt-2"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                <div className="max-w-2xl">
                  <UserProfile
                    appearance={{
                      elements: {
                        rootBox: 'w-full',
                        card: 'shadow-none border border-gray-200',
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;