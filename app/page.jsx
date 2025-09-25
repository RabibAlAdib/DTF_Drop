"use client";
import React, { useState, useEffect } from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import FeaturedProduct from "@/components/FeaturedProduct";
import OfferBanner from "@/components/offers/OfferBanner";
import OfferCard from "@/components/offers/OfferCard";
import OfferPopup from "@/components/offers/OfferPopup";
import PromotionalSection from "@/components/PromotionalSection";
import axios from "axios";

const Home = () => {
  const [offers, setOffers] = useState({
    banners: [],
    cards: [],
    popups: [],
  });
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPopupOffer, setSelectedPopupOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch active offers
  const fetchOffers = async () => {
    try {
      setLoading(true);

      // Fetch offers by type
      const [bannerRes, cardRes, popupRes] = await Promise.all([
        axios.get("/api/offer?type=banner&active=true"),
        axios.get("/api/offer?type=card&active=true"),
        axios.get("/api/offer?type=popup&active=true"),
      ]);

      setOffers({
        banners: bannerRes.data.offers || [],
        cards: cardRes.data.offers || [],
        popups: popupRes.data.offers || [],
      });

      // Auto-show popup after page load (with delay)
      if (popupRes.data.offers && popupRes.data.offers.length > 0) {
        setTimeout(() => {
          setSelectedPopupOffer(popupRes.data.offers[0]); // Show first popup offer
          setShowPopup(true);
        }, 3000); // Show after 3 seconds
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div className="px-6 md:px-16 lg:px-32">
      <HeaderSlider />

      <HomeProducts />
      {/* Offer Banner Section - Style 1 */}
      {!loading && offers.banners.length > 0 && (
        <section className="my-8">
          <OfferBanner offer={offers.banners[0]} className="mb-4" />
        </section>
      )}

      {/* Special Offers Section - Style 2 (Cards) */}
      {!loading && offers.cards.length > 0 && (
        <section className="my-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🔥 Special Offers
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Don't miss out on these amazing deals! Limited time offers with
              incredible savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {offers.cards.slice(0, 4).map((offer) => (
              <OfferCard key={offer._id} offer={offer} className="h-full" />
            ))}
          </div>

          {/* Show More Offers Button */}
          {offers.cards.length > 4 && (
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  // Show popup with more offers or navigate to offers page
                  if (offers.popups.length > 0) {
                    setSelectedPopupOffer(offers.popups[0]);
                    setShowPopup(true);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                View More Offers
              </button>
            </div>
          )}
        </section>
      )}

      <FeaturedProduct />

      {/* Additional Offer Banner (if available) */}
      {!loading && offers.banners.length > 1 && (
        <section className="my-8">
          <OfferBanner offer={offers.banners[1]} className="mb-4" />
        </section>
      )}

      <PromotionalSection />

      {/* Offer Popup - Style 3 */}
      <OfferPopup
        offer={selectedPopupOffer}
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />

      {/* Floating Offer Button (if popups available) */}
      {!loading && offers.popups.length > 0 && !showPopup && (
        <button
          onClick={() => {
            setSelectedPopupOffer(offers.popups[0]);
            setShowPopup(true);
          }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40 animate-pulse"
          aria-label="View Special Offers"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            !
          </div>
        </button>
      )}
    </div>
  );
};

export default Home;
