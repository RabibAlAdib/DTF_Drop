import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { useAppContext } from "@/context/AppContext";
import axios from 'axios';

const FeaturedProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency, router } = useAppContext();
  
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const fetchFeaturedProducts = async () => {
    try {
      const { data } = await axios.get('/api/product/featured');
      if (data.success) {
        setProducts(data.products.slice(0, 3)); // Show only top 3
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const handleProductClick = (product) => {
    router.push(`/product/${product._id}`);
  };

  if (loading) {
    return (
      <div className="mt-14">
        <div className="flex flex-col items-center">
          <p className="text-3xl font-medium bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Most Sold Products 🔥</p>
          <div className="w-28 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 mt-2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 mt-12 md:px-14 px-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-14" ref={ref}>
      <div className={`flex flex-col items-center transition-all duration-1000 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        <p className="text-3xl font-medium bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Most Sold Products 🔥
        </p>
        <div className="w-28 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 mt-2"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 mt-12 md:px-14 px-4">
        {products.map((product, index) => (
          <div 
            key={product._id} 
            className={`relative group transform transition-all duration-700 hover:scale-105 cursor-pointer ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            style={{ transitionDelay: `${index * 200}ms` }}
            onClick={() => handleProductClick(product)}
          >
            {/* Professional glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-75 transition-all duration-500 blur-sm group-hover:animate-pulse"></div>
            
            <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-200/50 dark:border-gray-700/50 group-hover:shadow-2xl transition-all duration-500">
              {/* Image Section with Professional Padding */}
              <div className="relative p-6 pt-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <Image
                  src={product.images?.[0] || assets.box_icon}
                  alt={product.name}
                  className="group-hover:scale-110 transition-all duration-500 w-full h-48 object-contain rounded-lg bg-white/50 dark:bg-gray-800/50 p-4 shadow-sm group-hover:shadow-lg backdrop-blur-sm"
                  width={400}
                  height={300}
                />
                
                {/* Sold Badge */}
                {product.totalQuantitySold && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                    {product.totalQuantitySold} sold
                  </div>
                )}
              </div>
              
              {/* Content Section */}
              <div className="p-6 pt-4 space-y-3">
                <h3 className="font-bold text-xl lg:text-2xl text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-3">
                  {product.offerPrice ? (
                    <>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{currency}{product.offerPrice}</span>
                      <span className="text-lg text-gray-500 line-through">{currency}{product.price}</span>
                      <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-full">
                        SALE
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{currency}{product.price}</span>
                  )}
                </div>
                
                <button 
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:shadow-orange-500/25"
                >
                  <span>Shop now</span>
                  <Image className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" src={assets.redirect_icon} alt="Redirect Icon" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProduct;