"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const SearchDropdown = ({ onMobileSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);
  const router = useRouter();
  
  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchProducts(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const searchProducts = async (searchQuery) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`, {
        signal: abortControllerRef.current.signal
      });
      const data = await response.json();
      setResults(data.products || []);
      setIsOpen(true); // Always open when search is performed, regardless of results
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
      setResults([]);
      setIsOpen(false);
    }
    setLoading(false);
  };
  
  const handleProductClick = (productId) => {
    setQuery('');
    setIsOpen(false);
    // Call mobile callback if provided (to close mobile menu)
    if (onMobileSelect) {
      onMobileSelect();
    }
    router.push(`/product/${productId}`);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      searchRef.current?.blur();
    }
  };
  
  const formatPrice = (price, offerPrice) => {
    if (offerPrice && offerPrice < price) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            ৳{offerPrice}
          </span>
          <span className="text-xs text-gray-500 line-through">
            ৳{price}
          </span>
        </div>
      );
    }
    return <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">৳{price}</span>;
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={searchRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
              Search Results ({results.length})
            </div>
            {results.map((product) => (
              <button
                key={product._id}
                onClick={() => handleProductClick(product._id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-100 dark:bg-gray-600"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                      {product.category}
                    </span>
                    {product.designType && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {product.designType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {formatPrice(product.price, product.offerPrice)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-8 h-8 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm">No products found for "{query}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;