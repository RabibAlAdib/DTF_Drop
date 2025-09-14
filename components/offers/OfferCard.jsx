'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const OfferCard = ({ offer, className = "" }) => {
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

  if (!offer) return null;

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
  };

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group ${className}`}
      onClick={handleOfferClick}
    >
      {/* Image Section */}
      <div className="relative h-40 overflow-hidden">
        {offer.offerImage ? (
          <Image
            src={offer.offerImage}
            alt={offer.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white"
            style={{ backgroundColor: offer.backgroundColor || '#FF6B6B' }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{getDiscountDisplay()}</div>
              <div className="text-sm opacity-90">Special Offer</div>
            </div>
          </div>
        )}

        {/* Discount Badge */}
        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
          {getDiscountDisplay()}
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs capitalize">
          {offer.category?.replace('_', ' ') || 'Offer'}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {offer.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {offer.description}
        </p>

        {/* Offer Details */}
        <div className="space-y-2 mb-4">
          {offer.offerCode && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Promo Code:</span>
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-blue-600 dark:text-blue-400">
                {offer.offerCode}
              </code>
            </div>
          )}

          {offer.minimumOrderValue > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Min Order:</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                ${offer.minimumOrderValue}
              </span>
            </div>
          )}

          {offer.usageLimit && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Limited:</span>
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                {offer.usageLimit - (offer.usedCount || 0)} left
              </span>
            </div>
          )}
        </div>

        {/* Countdown Timer */}
        {offer.showCountdown && !isExpired && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">Ends in:</div>
            <div className="flex justify-center gap-1">
              {timeLeft.days > 0 && (
                <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-bold text-center min-w-[32px]">
                  <div>{timeLeft.days}</div>
                  <div className="text-[10px]">days</div>
                </div>
              )}
              <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-bold text-center min-w-[32px]">
                <div>{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-[10px]">hrs</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-bold text-center min-w-[32px]">
                <div>{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-[10px]">min</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-bold text-center min-w-[32px]">
                <div>{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-[10px]">sec</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button 
          className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 transform group-hover:scale-105 ${
            isExpired 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isExpired) {
              handleOfferClick();
            }
          }}
          disabled={isExpired}
        >
          {isExpired ? 'Offer Expired' : 'Claim Offer'}
        </button>

        {/* Valid Until */}
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
          Valid until {new Date(offer.validTo).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
};

export default OfferCard;