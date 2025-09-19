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
            {/* Glowing border shadow effect - transparent fill */}
            <div className="absolute -inset-0.5 border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg opacity-0 group-hover:opacity-60 transition duration-1000 group-hover:animate-pulse" style={{backgroundClip: 'padding-box, border-box', background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899) border-box'}}></div>
            <div className="relative">
            <Image
              src={product.images?.[0] || assets.box_icon}
              alt={product.name}
              className="group-hover:brightness-75 transition duration-300 w-full h-auto object-cover rounded-lg"
              width={400}
              height={300}
            />
            <div className="group-hover:-translate-y-4 transition duration-300 absolute bottom-8 left-8 text-white space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-xl lg:text-2xl drop-shadow-lg">{product.name}</p>
                {product.totalQuantitySold && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {product.totalQuantitySold} sold
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm lg:text-base">
                {product.offerPrice ? (
                  <>
                    <span className="font-semibold">{currency}{product.offerPrice}</span>
                    <span className="line-through text-gray-300">{currency}{product.price}</span>
                  </>
                ) : (
                  <span className="font-semibold">{currency}{product.price}</span>
                )}
              </div>
              <button 
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                Shop now <Image className="h-3 w-3" src={assets.redirect_icon} alt="Redirect Icon" />
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