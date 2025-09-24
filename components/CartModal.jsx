"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';

const CartModal = ({ isOpen, onClose, product }) => {
  const { addToCart, currency } = useAppContext();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Default product options if not available
  const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const defaultColors = ['Black', 'White', 'Navy', 'Gray', 'Red'];

  // Use product-specific sizes/colors if available, otherwise use defaults
  const availableSizes = product?.sizes || defaultSizes;
  
  // Memoized product color detection to prevent infinite re-renders
  const availableColors = useMemo(() => {
    // First try to get colors from colorImages
    if (product?.colorImages && product.colorImages.length > 0) {
      return product.colorImages.map(img => img.color).filter(Boolean);
    }
    // Then try the colors array
    if (product?.colors && product.colors.length > 0) {
      return product.colors;
    }
    // Fall back to defaults only if no product-specific colors
    return defaultColors;
  }, [product?.colorImages, product?.colors]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset selections when modal opens with new product
  useEffect(() => {
    if (isOpen && product) {
      setSelectedSize(availableSizes[0] || 'M'); // Default to M if no sizes
      setSelectedColor(availableColors[0] || 'Black'); // Better fallback
      setQuantity(1);
    }
  }, [isOpen, product, availableSizes, availableColors]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }

    setIsLoading(true);
    try {
      const variant = {
        color: selectedColor,
        size: selectedSize
      };
      
      await addToCart(product._id, variant, quantity);
      toast.success(`${product.name} added to cart!`);
      onClose();
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error('Add to cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  if (!isOpen || !product || !isMounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add to Cart
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(95vh-8rem)] overflow-y-auto">
          {/* Product Info */}
          <div className="p-6">
            <div className="flex gap-4 mb-6">
            {/* Product Image */}
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={product.images?.[0] || '/placeholder-image.jpg'}
                alt={product.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Product Details */}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white text-lg">
                {product.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {product.description}
              </p>
              <p className="text-orange-600 font-semibold text-lg mt-2">
                {currency}{product.offerPrice || product.price}
              </p>
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Size
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 px-3 text-sm font-medium rounded-md border transition-colors ${
                    selectedSize === size
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`py-2 px-4 text-sm font-medium rounded-md border transition-colors ${
                    selectedColor === color
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="font-medium text-gray-900 dark:text-white min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 10}
                className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                {currency}{((product.offerPrice || product.price) * quantity).toFixed(2)}
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !selectedSize || !selectedColor}
            className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Confirm to Add'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CartModal;