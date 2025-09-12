import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import { useInView } from "react-intersection-observer";

const HomeProducts = () => {
  const { products, router } = useAppContext();
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <div className="flex flex-col items-center pt-14 relative">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-float-delay-1"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-xl animate-float-delay-2"></div>
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
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full relative">
        {products.map((product, index) => (
          <div 
            key={index}
            className={`transform transition-all duration-700 hover:scale-105 ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            style={{ 
              transitionDelay: `${index * 100}ms`,
              animationDelay: `${index * 100}ms` 
            }}
          >
            <div className="relative group">
              {/* Moving shadow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-1000 group-hover:animate-pulse-glow"></div>
              <div className="relative">
                <ProductCard product={product} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => { router.push('/all-products') }} 
        className={`px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 dark:hover:bg-gray-700/90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
          inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
        style={{ transitionDelay: '800ms' }}
      >
        See more
      </button>
    </div>
  );
};

export default HomeProducts;
