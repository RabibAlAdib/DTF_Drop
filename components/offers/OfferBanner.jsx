'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const OfferBanner = ({ offer, className = "" }) => {
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
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-[1.02] ${className}`}
      style={{ 
        backgroundColor: offer.backgroundColor || '#FF6B6B',
        color: offer.textColor || '#FFFFFF'
      }}
      onClick={handleOfferClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-6 lg:p-8 min-h-[200px]">
        {/* Content Section */}
        <div className="flex-1 text-center lg:text-left mb-6 lg:mb-0">
          {/* Offer Category Badge */}
          <div className="inline-block px-3 py-1 bg-black bg-opacity-20 rounded-full text-xs font-medium uppercase tracking-wide mb-3">
            {offer.category?.replace('_', ' ') || 'Special Offer'}
          </div>

          {/* Main Title */}
          <h2 className="text-2xl lg:text-4xl font-bold mb-2 leading-tight">
            {offer.title}
          </h2>

          {/* Description */}
          <p className="text-sm lg:text-lg opacity-90 mb-4 max-w-lg">
            {offer.description}
          </p>

          {/* Discount Display */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-4">
            <div className="text-3xl lg:text-5xl font-black">
              {getDiscountDisplay()}
            </div>
            
            {offer.minimumOrderValue > 0 && (
              <div className="text-xs lg:text-sm opacity-75">
                Min order: ${offer.minimumOrderValue}
              </div>
            )}

            {offer.offerCode && (
              <div className="bg-black bg-opacity-20 px-3 py-1 rounded text-xs lg:text-sm font-mono">
                Code: {offer.offerCode}
              </div>
            )}
          </div>

          {/* Countdown Timer */}
          {offer.showCountdown && !isExpired && (
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              <span className="text-xs lg:text-sm opacity-75">Ends in:</span>
              <div className="flex gap-1">
                {timeLeft.days > 0 && (
                  <div className="bg-black bg-opacity-20 px-2 py-1 rounded text-xs font-bold">
                    {timeLeft.days}d
                  </div>
                )}
                <div className="bg-black bg-opacity-20 px-2 py-1 rounded text-xs font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </div>
                <div className="bg-black bg-opacity-20 px-2 py-1 rounded text-xs font-bold">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </div>
                <div className="bg-black bg-opacity-20 px-2 py-1 rounded text-xs font-bold">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button 
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg transform hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              handleOfferClick();
            }}
          >
            {isExpired ? 'Offer Expired' : 'Shop Now'}
          </button>
        </div>

        {/* Image Section */}
        {offer.offerImage && (
          <div className="flex-shrink-0 lg:ml-8">
            <div className="relative w-48 h-48 lg:w-64 lg:h-64">
              <Image
                src={offer.offerImage}
                alt={offer.title}
                fill
                className="object-cover rounded-lg shadow-xl"
                sizes="(max-width: 768px) 192px, 256px"
                priority
              />
              
              {/* Floating Discount Badge */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg transform rotate-12">
                {getDiscountDisplay()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-5 rounded-full transform -translate-x-12 translate-y-12"></div>
    </div>
  );
};

export default OfferBanner;