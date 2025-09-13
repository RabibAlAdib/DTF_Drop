"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef();
  const abortControllerRef = useRef();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle search suggestions with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setAllResults([]);
      setShowAllResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`, {
          signal: abortControllerRef.current.signal
        });
        
        if (response.data.success) {
          setSuggestions(response.data.products);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Search suggestions error:', error);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle full search results
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (response.data.success) {
        setAllResults(response.data.products);
        setShowAllResults(true);
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Full search error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (productId) => {
    onClose();
    router.push(`/product/${productId}`);
  };

  // Handle modal close
  const handleClose = () => {
    setSearchQuery('');
    setSuggestions([]);
    setAllResults([]);
    setShowAllResults(false);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center md:items-start justify-center md:pt-20 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-hidden">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleClose}
              className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {showAllResults ? (
            // All Results View
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Search Results ({allResults.length})
                </h3>
                <button
                  onClick={() => setShowAllResults(false)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Back to suggestions
                </button>
              </div>

              {allResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No products found for "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-3">
                  {allResults.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductSelect(product._id)}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 dark:text-white">{product.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-semibold text-blue-600">${product.price}</span>
                          {product.offerPrice && (
                            <span className="text-sm text-gray-500 line-through">${product.offerPrice}</span>
                          )}
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Suggestions View
            searchQuery && (
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Suggestions
                </h3>
                
                {suggestions.length === 0 && !loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No suggestions found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductSelect(product._id)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-blue-600">${product.price}</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {suggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSearch}
                      className="w-full py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      See all results for "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;