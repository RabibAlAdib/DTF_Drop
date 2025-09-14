import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { useAppContext } from "@/context/AppContext";
import { toast } from "react-hot-toast";
import axios from "axios";

const HeaderSlider = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const { addToCart } = useAppContext();
  const [sliderData, setSliderData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch header slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await axios.get('/api/header-slider?visibleOnly=true');
        if (response.data.success && response.data.slides.length > 0) {
          setSliderData(response.data.slides);
        } else {
          // Fallback to static data if no slides found
          setSliderData([
            {
              _id: '1',
              title: "Experience Pure Sound - Your Perfect Headphones Awaits!",
              shortText: "Limited Time Offer 30% Off",
              buyButtonText: "Buy now",
              learnMoreButtonText: "Find more",
              productImage: assets.header_headphone_image,
              buyButtonAction: "addToCart",
              buyButtonLink: "674b2bc25bd87ad8e5cc49aa", // Example product ID
              learnMoreLink: "#",
            },
            {
              _id: '2',
              title: "Next-Level Gaming Starts Here - Discover PlayStation 5 Today!",
              shortText: "Hurry up only few lefts!",
              buyButtonText: "Shop Now",
              learnMoreButtonText: "Explore Deals",
              productImage: assets.header_playstation_image,
              buyButtonAction: "addToCart",
              buyButtonLink: "674b2bc25bd87ad8e5cc49aa", // Example product ID
              learnMoreLink: "#",
            },
            {
              _id: '3',
              title: "Power Meets Elegance - Apple MacBook Pro is Here for you!",
              shortText: "Exclusive Deal 40% Off",
              buyButtonText: "Order Now",
              learnMoreButtonText: "Learn More",
              productImage: assets.header_macbook_image,
              buyButtonAction: "addToCart",
              buyButtonLink: "674b2bc25bd87ad8e5cc49aa", // Example product ID
              learnMoreLink: "#",
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch header slides:', error);
        // Fallback to static data on error
        setSliderData([
          {
            _id: '1',
            title: "Experience Pure Sound - Your Perfect Headphones Awaits!",
            shortText: "Limited Time Offer 30% Off",
            buyButtonText: "Buy now",
            learnMoreButtonText: "Find more",
            productImage: assets.header_headphone_image,
            buyButtonAction: "addToCart",
            buyButtonLink: "674b2bc25bd87ad8e5cc49aa", // Example product ID
            learnMoreLink: "#",
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (sliderData.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderData.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  // Handle buy button click
  const handleBuyButtonClick = async (slide) => {
    if (slide.buyButtonAction === 'addToCart' && slide.buyButtonLink) {
      try {
        const success = await addToCart(slide.buyButtonLink);
        if (success) {
          toast.success(`${slide.buyButtonText} - Added to cart!`);
        } else {
          toast.error('Failed to add to cart');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        toast.error('Failed to add to cart');
      }
    } else if (slide.buyButtonAction === 'redirect' && slide.buyButtonLink) {
      window.open(slide.buyButtonLink, '_blank');
    }
  };

  // Handle learn more button click
  const handleLearnMoreClick = (slide) => {
    if (slide.learnMoreLink && slide.learnMoreLink !== '#') {
      window.open(slide.learnMoreLink, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#E6E9F2] dark:bg-gray-800 mt-6 rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (sliderData.length === 0) {
    return null;
  }

  return (
    <div 
      ref={ref}
      className={`overflow-hidden relative w-full transition-all duration-1000 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide._id}
            className="flex flex-col-reverse md:flex-row items-center justify-between bg-[#E6E9F2] dark:bg-gray-800 py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full relative overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient opacity-30"></div>
            <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between w-full">
            <div className="md:pl-8 mt-10 md:mt-0">
              <p className="md:text-base text-orange-600 dark:text-orange-400 pb-1 animate-pulse">{slide.shortText}</p>
              <h1 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {slide.title}
              </h1>
              <div className="flex items-center mt-4 md:mt-6 ">
                <button 
                  onClick={() => handleBuyButtonClick(slide)}
                  className="md:px-10 px-7 md:py-2.5 py-2 bg-orange-600 hover:bg-orange-700 rounded-full text-white font-medium transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
                >
                  {slide.buyButtonText}
                </button>
                <button 
                  onClick={() => handleLearnMoreClick(slide)}
                  className="group flex items-center gap-2 px-6 py-2.5 font-medium hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  {slide.learnMoreButtonText}
                  <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon} alt="arrow_icon" />
                </button>
              </div>
            </div>
            <div className="flex items-center flex-1 justify-center">
              <Image
                className="md:w-72 w-48 transform hover:scale-105 transition-transform duration-500"
                src={slide.productImage}
                alt={`Slide ${index + 1}`}
                width={288}
                height={288}
                priority={index === 0}
              />
            </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        {sliderData.map((_, index) => (
          <div
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`h-2 w-2 rounded-full cursor-pointer ${
              currentSlide === index ? "bg-orange-600" : "bg-gray-500/30"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
