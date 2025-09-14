'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const OfferPopup = ({ offer, isOpen, onClose, className = "" }) => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Countdown timer logic
  useEffect(() => {
    if (!offer?.validTo || !offer?.showCountdown) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(offer.validTo).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [offer?.validTo, offer?.showCountdown]);

  // Close popup on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!offer || !isOpen) return null;

  const getDiscountDisplay = () => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    } else {
      return `$${offer.discountValue} OFF`;
    }
  };

  const handleOfferClick = () => {
    // Navigate to products page or apply offer logic
    if (offer.offerCode) {
      // Store offer code in localStorage for checkout
      localStorage.setItem('appliedOfferCode', offer.offerCode);
    }
    router.push('/all-products');
    onClose();
  };

  const copyOfferCode = () => {
    if (offer.offerCode) {
      navigator.clipboard.writeText(offer.offerCode);
      // You could add a toast notification here
    }
  };

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-black bg-opacity-20 hover:bg-opacity-40 rounded-full flex items-center justify-center text-white transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Section */}
        <div 
          className="relative h-48 flex items-center justify-center text-white"
          style={{ backgroundColor: offer.backgroundColor || '#FF6B6B' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent"></div>
          </div>

          {offer.offerImage ? (
            <Image
              src={offer.offerImage}
              alt={offer.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          ) : (
            <div className="text-center z-10">
              <div className="text-5xl font-black mb-2">{getDiscountDisplay()}</div>
              <div className="text-lg opacity-90">Special Offer</div>
            </div>
          )}

          {/* Floating Discount Badge */}
          <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
            {getDiscountDisplay()}
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm capitalize">
            {offer.category?.replace('_', ' ') || 'Special Offer'}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-192px)]">
          {/* Title and Description */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {offer.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              {offer.description}
            </p>
          </div>

          {/* Offer Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Discount Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Discount Amount</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {getDiscountDisplay()}
              </div>
            </div>

            {/* Valid Until */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valid Until</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {new Date(offer.validTo).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Minimum Order */}
            {offer.minimumOrderValue > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum Order</div>
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  ${offer.minimumOrderValue}
                </div>
              </div>
            )}

            {/* Usage Limit */}
            {offer.usageLimit && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining Uses</div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {offer.usageLimit - (offer.usedCount || 0)} left
                </div>
              </div>
            )}
          </div>

          {/* Promo Code Section */}
          {offer.offerCode && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Use Promo Code</div>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-white dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-600 px-4 py-2 rounded-lg text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                    {offer.offerCode}
                  </code>
                  <button
                    onClick={copyOfferCode}
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {offer.showCountdown && !isExpired && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
              <div className="text-center">
                <div className="text-sm text-red-600 dark:text-red-400 mb-3 font-medium">⏰ Offer Expires In:</div>
                <div className="flex justify-center gap-2">
                  {timeLeft.days > 0 && (
                    <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-center min-w-[60px]">
                      <div className="text-xl font-bold">{timeLeft.days}</div>
                      <div className="text-xs uppercase">Days</div>
                    </div>
                  )}
                  <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-center min-w-[60px]">
                    <div className="text-xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <div className="text-xs uppercase">Hours</div>
                  </div>
                  <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-center min-w-[60px]">
                    <div className="text-xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <div className="text-xs uppercase">Minutes</div>
                  </div>
                  <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-center min-w-[60px]">
                    <div className="text-xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                    <div className="text-xs uppercase">Seconds</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleOfferClick}
              disabled={isExpired}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                isExpired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isExpired ? 'Offer Expired' : 'Shop Now & Save'}
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none py-3 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Fine Print */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 leading-relaxed">
            * Offer valid for limited time only. Terms and conditions apply. 
            {offer.minimumOrderValue > 0 && ` Minimum order of $${offer.minimumOrderValue} required.`}
            {offer.usageLimit && ` Limited to ${offer.usageLimit} total uses.`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPopup;