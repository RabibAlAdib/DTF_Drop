'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { CartIcon } from '@/assets/assets';

const FloatingCart = () => {
  const { cartItems, getCartCount, router } = useAppContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const cartCount = getCartCount();

  // Handle visibility based on cart count
  useEffect(() => {
    if (cartCount > 0 && !isVisible) {
      setIsVisible(true);
      // Trigger bounce animation when items are first added
      if (!hasAnimated) {
        setIsAnimating(true);
        setHasAnimated(true);
        setTimeout(() => setIsAnimating(false), 600);
      }
    } else if (cartCount === 0 && isVisible) {
      // Delay hiding to allow for smooth fade out
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [cartCount, isVisible, hasAnimated]);

  // Reset animation state when cart becomes empty
  useEffect(() => {
    if (cartCount === 0) {
      setHasAnimated(false);
    }
  }, [cartCount]);

  // Handle cart click
  const handleCartClick = () => {
    router.push('/cart');
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${
        cartCount > 0 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'
      }`}
    >
      <button
        onClick={handleCartClick}
        className={`relative bg-orange-600 hover:bg-orange-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
          isAnimating ? 'animate-bounce' : ''
        }`}
        aria-label={`View cart with ${cartCount} items`}
      >
        {/* Cart Icon */}
        <div className="w-6 h-6 text-white">
          <CartIcon />
        </div>
        
        {/* Count Badge */}
        {cartCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white shadow-sm">
            {cartCount > 99 ? '99+' : cartCount}
          </div>
        )}
        
        {/* Ripple Effect on Click */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150"></div>
      </button>

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
      `}</style>
    </div>
  );
};

export default FloatingCart;