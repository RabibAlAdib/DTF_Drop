'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/offer/public');
      
      if (response.data.success) {
        setOffers(response.data.offers || []);
      } else {
        toast.error('Failed to fetch offers');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const getOfferTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'banner':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'popup':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'card':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'all') return true;
    return offer.type?.toLowerCase() === filter;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Special Offers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover amazing deals and exclusive offers on your favorite products. 
            Don't miss out on these limited-time opportunities!
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-2">
              {['all', 'banner', 'card', 'popup'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filter === type
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {type} {type === 'all' ? 'Offers' : 'Deals'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">Loading amazing offers...</span>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Offers Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {filter === 'all' ? 
                "We're working on bringing you exciting offers. Check back soon!" : 
                `No ${filter} offers are currently available.`
              }
            </p>
            <a 
              href="/all-products" 
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Browse Products
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOffers.map((offer) => (
              <div key={offer._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Offer Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                  {offer.image ? (
                    <Image
                      src={offer.image}
                      alt={offer.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Offer Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${getOfferTypeColor(offer.type)}`}>
                      {offer.type}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {offer.discount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{offer.discount}%
                    </div>
                  )}
                </div>

                {/* Offer Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {offer.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {offer.description}
                  </p>

                  {/* Offer Details */}
                  <div className="space-y-2 mb-6">
                    {offer.originalPrice && offer.discountedPrice && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 line-through">
                          ৳{offer.originalPrice}
                        </span>
                        <span className="text-lg font-bold text-purple-600">
                          ৳{offer.discountedPrice}
                        </span>
                      </div>
                    )}
                    
                    {offer.validUntil && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Valid until {new Date(offer.validUntil).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                      Claim Offer
                    </button>
                    
                    {offer.link && (
                      <a 
                        href={offer.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 py-2 font-medium"
                      >
                        Learn More →
                      </a>
                    )}
                  </div>
                </div>

                {/* Offer Footer */}
                {offer.terms && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Terms:</span> {offer.terms}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Call to Action Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Don't Miss Out on Future Deals!
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Subscribe to our newsletter and be the first to know about exclusive offers and new arrivals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersPage;