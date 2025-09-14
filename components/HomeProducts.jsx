import React, { useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import { useInView } from "react-intersection-observer";

const HomeProducts = () => {
  const { products, router } = useAppContext();
  const [visibleCount, setVisibleCount] = useState(6);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const handleSeeMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, products.length));
  };

  const displayedProducts = products.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < products.length;

  return (
    <div className="flex flex-col items-center pt-14 relative">
      {/* Gentle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-gentle-bounce"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-soft-pulse"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-xl animate-gentle-bounce"></div>
      </div>

      <div 
        ref={ref}
        className={`transform transition-all duration-1000 ${
          inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <p className="text-2xl font-medium text-left w-full bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Popular products
        </p>
      </div>
      
      {/* Horizontal scrolling container */}
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent mt-6 pb-4">
        <div 
          className="flex gap-6 transition-all duration-500 ease-in-out"
          style={{ width: `${displayedProducts.length * 280 + (displayedProducts.length - 1) * 24}px` }}
        >
          {displayedProducts.map((product, index) => (
            <div 
              key={index}
              className={`flex-shrink-0 w-64 transform transition-all duration-700 hover:scale-102 ${
                inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                animationDelay: `${index * 100}ms` 
              }}
            >
              <div className="relative group">
                {/* Enhanced blurry border background effect */}
                <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute -inset-1 border-l-2 border-t-2 border-l-blue-500 border-t-blue-500 group-hover:border-l-purple-500 group-hover:border-t-purple-500 rounded-lg opacity-0 group-hover:opacity-90 transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-purple-500/30"></div>
                <div className="relative">
                  <ProductCard product={product} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* See More Button */}
      <div className="flex items-center justify-center gap-4 mt-6 pb-14">
        {hasMoreProducts && (
          <button 
            onClick={handleSeeMore}
            className={`px-8 py-2.5 border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 transform hover:scale-102 hover:shadow-lg flex items-center gap-2 ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            style={{ transitionDelay: '800ms' }}
          >
            <span>Load More ({Math.min(6, products.length - visibleCount)} items)</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        
        <button 
          onClick={() => { router.push('/all-products') }} 
          className={`px-8 py-2.5 border rounded-lg text-gray-500/70 hover:bg-slate-50/90 dark:hover:bg-gray-700/90 hover:border-gray-400 transition-all duration-300 transform hover:scale-102 hover:shadow-lg flex items-center gap-2 ${
            inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '900ms' }}
        >
          <span>View All Products</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HomeProducts;
