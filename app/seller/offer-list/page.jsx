'use client'
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from "next/image";

const OfferList = () => {
  const { router, getToken, user } = useAppContext();
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingOffer, setDeletingOffer] = useState(null);
  const [stats, setStats] = useState({});
  
  // Filter and pagination states
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchAllOffers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/offer?active=false');
      if (data.success) {
        setOffers(data.offers);
        setFilteredOffers(data.offers);
        // Ensure stats is always an object with default values
        setStats({
          total: data.stats?.total ?? data.offers.length,
          active: data.stats?.active ?? data.offers.filter(o => o.isCurrentlyValid).length,
          expired: data.stats?.expired ?? data.offers.filter(o => o.isExpired).length,
          inactive: data.stats?.inactive ?? data.offers.filter(o => !o.isActive).length,
        });
      } else {
        toast.error(data.message || "Failed to fetch offers");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId, offerTitle) => {
    if (!confirm(`Are you sure you want to delete "${offerTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingOffer(offerId);
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/offer/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        toast.success('Offer deleted successfully!');
        // Remove the deleted offer from state
        const updatedOffers = offers.filter(offer => offer._id !== offerId);
        setOffers(updatedOffers);
        setFilteredOffers(updatedOffers);
      } else {
        toast.error(data.message || "Failed to delete offer");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete offer");
    } finally {
      setDeletingOffer(null);
    }
  };

  const handleToggleStatus = async (offerId, currentStatus) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('isActive', !currentStatus);
      
      const { data } = await axios.put(`/api/offer/${offerId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        {data}
        toast.success(`Offer ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchAllOffers(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to update offer status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update offer status");
    }
  };

  // Filter offers based on current filters
  useEffect(() => {
    let filtered = [...offers];

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(offer => offer.isCurrentlyValid);
    } else if (statusFilter === 'expired') {
      filtered = filtered.filter(offer => offer.isExpired);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(offer => !offer.isActive);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(offer => offer.offerType === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(offer => offer.category === categoryFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.title.toLowerCase().includes(search) ||
        offer.description.toLowerCase().includes(search) ||
        (offer.offerCode && offer.offerCode.toLowerCase().includes(search))
      );
    }

    setFilteredOffers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [offers, statusFilter, typeFilter, categoryFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (offer) => {
    if (offer.isCurrentlyValid) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
    } else if (offer.isExpired) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>;
    } else if (!offer.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Scheduled</span>;
    }
  };

  const getDiscountDisplay = (offer) => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    } else {
      return `$${offer.discountValue} OFF`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchAllOffers();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offer Management</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage all promotional offers and discounts
              </p>
            </div>
            <button
              onClick={() => router.push('/seller/add-offer')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Offer
            </button>
          </div>


          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total || 0}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Offers</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active || 0}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Active Offers</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.expired || 0}</div>
              <div className="text-sm text-red-600 dark:text-red-400">Expired Offers</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.inactive || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Inactive Offers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search offers..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="banner">Banner</option>
                <option value="card">Card</option>
                <option value="popup">Popup</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="flash_sale">Flash Sale</option>
                <option value="seasonal">Seasonal</option>
                <option value="clearance">Clearance</option>
                <option value="new_customer">New Customer</option>
                <option value="bulk_discount">Bulk Discount</option>
                <option value="festival">Festival</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredOffers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-gray-400 mb-4">
              {offers.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No offers yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">Start creating attractive offers to boost your sales</p>
                  <button
                    onClick={() => router.push('/seller/add-offer')}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Offer
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No offers match your filters</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Offer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Validity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedOffers.map((offer) => (
                    <tr key={offer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {offer.offerImage && (
                            <div className="flex-shrink-0 h-12 w-12">
                              <Image
                                className="h-12 w-12 rounded-lg object-cover"
                                src={offer.offerImage}
                                alt={offer.title}
                                width={48}
                                height={48}
                              />
                            </div>
                          )}
                          <div className={offer.offerImage ? "ml-4" : ""}>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {offer.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {offer.offerType} • {offer.category.replace('_', ' ')}
                            </div>
                            {offer.offerCode && (
                              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                                {offer.offerCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getDiscountDisplay(offer)}
                        </div>
                        {offer.minimumOrderValue > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min order: ${offer.minimumOrderValue}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(offer.validFrom)} - {formatDate(offer.validTo)}
                        </div>
                        {offer.daysRemaining > 0 && offer.isCurrentlyValid && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {offer.daysRemaining} days left
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(offer)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {offer.usageLimit ? (
                          <div>
                            <div>{offer.usedCount}/{offer.usageLimit}</div>
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(offer.usedCount / offer.usageLimit) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div>{offer.usedCount}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Unlimited</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => router.push(`/seller/edit-offer/${offer._id}`)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(offer._id, offer.isActive)}
                          className={`${
                            offer.isActive 
                              ? 'text-red-600 hover:text-red-900 dark:text-red-400' 
                              : 'text-green-600 hover:text-green-900 dark:text-green-400'
                          }`}
                        >
                          {offer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer._id, offer.title)}
                          disabled={deletingOffer === offer._id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          {deletingOffer === offer._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {paginatedOffers.map((offer) => (
                <div key={offer._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {offer.offerImage && (
                        <Image
                          className="h-12 w-12 rounded-lg object-cover"
                          src={offer.offerImage}
                          alt={offer.title}
                          width={48}
                          height={48}
                        />
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{offer.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {offer.offerType} • {offer.category.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(offer)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{getDiscountDisplay(offer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Valid until:</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(offer.validTo)}</span>
                    </div>
                    {offer.offerCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Code:</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          {offer.offerCode}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                      <span className="text-gray-900 dark:text-white">
                        {offer.usageLimit ? `${offer.usedCount}/${offer.usageLimit}` : offer.usedCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => router.push(`/seller/edit-offer/${offer._id}`)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(offer._id, offer.isActive)}
                      className={`text-sm ${
                        offer.isActive 
                          ? 'text-red-600 hover:text-red-900 dark:text-red-400' 
                          : 'text-green-600 hover:text-green-900 dark:text-green-400'
                      }`}
                    >
                      {offer.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer._id, offer.title)}
                      disabled={deletingOffer === offer._id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 text-sm"
                    >
                      {deletingOffer === offer._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOffers.length)} of {filteredOffers.length} offers
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === i + 1
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferList;