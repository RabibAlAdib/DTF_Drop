"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Loading from "@/components/Loading";
import { toast } from "react-hot-toast";
import ProductRecommendations from "@/components/ProductRecommendations";
// Navbar is provided by layout - removed to prevent duplication
import FeaturedProduct from "@/components/FeaturedProduct";

// Available colors and sizes
const AVAILABLE_COLORS = [
  "Black",
  "White",
  "Lite Pink",
  "Coffee",
  "Offwhite",
  "NevyBlue",
];
const AVAILABLE_SIZES = ["M", "L", "XL"]; //'XXL(Special Order)'
// Color mapping for display
const COLOR_MAP = {
  Black: "bg-black",
  White: "bg-white border border-gray-300",
  "Lite Pink": "bg-pink-200",
  Coffee: "bg-amber-800",
  Offwhite: "bg-gray-100 border border-gray-300",
  NevyBlue: "bg-blue-900",
};

const Product = () => {
  const {
    products,
    addToCart,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  } = useAppContext();
  const params = useParams();
  const [productData, setProductData] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);

  // State for selected variants
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  // State for image zoom functionality
  const [isZoomed, setIsZoomed] = useState(false);

  // Helper function to get images for selected color
  const getImagesForColor = (color) => {
    if (!productData) return [];

    // Use new colorImages if available
    if (productData.colorImages && productData.colorImages.length > 0) {
      return productData.colorImages
        .filter((img) => img.color === color)
        .map((img) => img.url);
    }

    // Fallback to legacy images
    return productData.images || [];
  };

  // Helper function to get all available images with color mapping
  const getAllImages = () => {
    if (!productData) return [];

    // Use new colorImages if available
    if (productData.colorImages && productData.colorImages.length > 0) {
      return productData.colorImages.map((img) => ({
        url: img.url,
        color: img.color
      }));
    }

    // Fallback to legacy images (no color association)
    return (productData.images || []).map((url) => ({ url, color: null }));
  };

  // Helper function to get color from image URL
  const getColorFromImage = (imageUrl) => {
    if (!productData) return null;
    
    if (productData.colorImages && productData.colorImages.length > 0) {
      const colorImage = productData.colorImages.find(img => img.url === imageUrl);
      return colorImage ? colorImage.color : null;
    }
    
    return null;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // First try to find product in local products array for faster loading
        const localProduct = products.find((p) => p._id === params.id);

        if (localProduct) {
          setProductData(localProduct);

          // Set initial color and size
          const initialColor = localProduct.colors?.[0] || "";
          const initialSize = localProduct.sizes?.[0] || "";
          setSelectedColor(initialColor);
          setSelectedSize(initialSize);

          // Set main image based on color or fallback to first image
          if (localProduct.colorImages && localProduct.colorImages.length > 0) {
            const colorImage = localProduct.colorImages.find(
              (img) => img.color === initialColor,
            );
            setMainImage(
              colorImage?.url || localProduct.colorImages[0]?.url || "",
            );
          } else {
            setMainImage(localProduct.images?.[0] || "");
          }

          setLoading(false);
        } else {
          // If not found locally, fetch from API
          const response = await fetch(`/api/product/${params.id}`);
          const data = await response.json();

          if (data.success) {
            setProductData(data.product);

            // Set initial color and size
            const initialColor = data.product.colors?.[0] || "";
            const initialSize = data.product.sizes?.[0] || "";
            setSelectedColor(initialColor);
            setSelectedSize(initialSize);

            // Set main image based on color or fallback to first image
            if (
              data.product.colorImages &&
              data.product.colorImages.length > 0
            ) {
              const colorImage = data.product.colorImages.find(
                (img) => img.color === initialColor,
              );
              setMainImage(
                colorImage?.url || data.product.colorImages[0]?.url || "",
              );
            } else {
              setMainImage(data.product.images?.[0] || "");
            }
          } else {
            toast.error(data.message || "Product not found");
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, products]);

  // Loading state
  if (loading) {
    return <Loading />;
  }

  // Product not found state
  if (!productData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Product Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The product you're looking for doesn't exist.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Check if selected variant is available
  const isVariantAvailable = () => {
    // If no variants exist, allow purchase
    if (!productData.variants || productData.variants.length === 0) {
      return true;
    }

    // If variants exist but no color or size is selected, return false
    if (!selectedColor || !selectedSize) return false;

    // Check if the selected variant is in stock
    const variant = productData.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize,
    );

    return variant && variant.stock > 0;
  };

  // Handle add to cart with variants
  const handleAddToCart = () => {
    // If variants exist, require color and size selection
    if (productData.variants && productData.variants.length > 0) {
      if (!selectedColor || !selectedSize) {
        toast.error("Please select color and size");
        return;
      }

      if (!isVariantAvailable()) {
        toast.error("Selected variant is not available");
        return;
      }

      addToCart(
        productData._id,
        {
          color: selectedColor,
          size: selectedSize,
        },
        quantity,
      );
    } else {
      // No variants, add to cart directly
      addToCart(productData._id, {}, quantity);
    }
  };

  // Handle size selection properly
  const handleSizeSelect = (size) => {
    console.log("Size selected:", size);
    setSelectedSize(size);
  };

  // Handle color selection properly with bidirectional sync
  const handleColorSelect = (color) => {
    console.log("Color selected:", color);
    setSelectedColor(color);

    // Update main image to show the selected color's image
    const colorImages = getImagesForColor(color);
    if (colorImages.length > 0) {
      setMainImage(colorImages[0]);
    }
  };

  // Handle image selection with bidirectional sync
  const handleImageSelect = (imageUrl) => {
    setMainImage(imageUrl);
    
    // Auto-select color if this image has a color association
    const imageColor = getColorFromImage(imageUrl);
    if (imageColor && productData.colors && productData.colors.includes(imageColor)) {
      setSelectedColor(imageColor);
    }
  };

  // WhatsApp contact functionality
  const generateProductMessage = () => {
    const productName = productData?.name || "Product";
    const price = productData?.offerPrice || productData?.price || "N/A";
    const productUrl = window.location.href;

    let message = `Hi! I'm interested in this product from DTF Drop:\n\n`;
    message += `• Product: ${productName}\n`;
    message += `• Price: $${price}\n`;

    if (selectedColor) message += `• Preferred Color: ${selectedColor}\n`;
    if (selectedSize) message += `• Preferred Size: ${selectedSize}\n`;

    message += `\nProduct Link: ${productUrl}\n\n`;
    message += `Can you provide more details or help me with the order?`;

    return message;
  };

  const handleContactSupport = () => {
    const message = generateProductMessage();
    const phoneNumber = "+8801344823831";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Handle image zoom functionality
  const handleImageHover = () => {
    setIsZoomed(true);
  };

  const handleImageLeave = () => {
    setIsZoomed(false);
  };

  return (
    <div className="px-4 md:px-8 lg:px-16 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-white shadow-md mb-4 cursor-zoom-in">
            <Image
              src={mainImage || "/placeholder-image.jpg"}
              alt={productData.name || "Product image"}
              className={`w-full h-auto object-cover mix-blend-multiply transition-transform duration-300 ease-in-out ${
                isZoomed ? "scale-125 cursor-zoom-out" : "cursor-zoom-in"
              }`}
              width={1280}
              height={720}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              onMouseEnter={handleImageHover}
              onMouseLeave={handleImageLeave}
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg";
              }}
            />
          </div>

          {/* Complete Image Gallery - Show ALL available images */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              Product Images {selectedColor && `(${selectedColor})`}
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
              {(() => {
                const allImages = getAllImages();
                
                // Always show ALL images regardless of selected color
                const displayImages = allImages;

                return displayImages.length > 0 ? (
                  displayImages.map((imageObj, index) => {
                    const isSelected = mainImage === imageObj.url;
                    const hasColorInfo = imageObj.color;
                    
                    return (
                      <div
                        key={`${imageObj.url}-${index}`}
                        className={`relative flex-shrink-0 w-16 h-16 md:w-auto md:h-20 rounded-lg overflow-hidden bg-white cursor-pointer border-2 transition-all duration-300 hover:scale-105 ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-200 shadow-lg"
                            : "border-gray-200 hover:border-blue-400 hover:shadow-md"
                        }`}
                        onClick={() => handleImageSelect(imageObj.url)}
                        title={hasColorInfo ? `${productData.name} - ${imageObj.color}` : `${productData.name} - Image ${index + 1}`}
                      >
                        <Image
                          src={imageObj.url || "/placeholder-image.jpg"}
                          alt={`${productData.name} ${imageObj.color || ''} ${index + 1}`}
                          className="w-full h-full object-cover mix-blend-multiply"
                          width={100}
                          height={80}
                          sizes="(max-width: 768px) 64px, 80px"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.jpg";
                          }}
                        />
                        {/* Color indicator dot if image has color association */}
                        {hasColorInfo && (
                          <div 
                            className={`absolute top-1 right-1 w-3 h-3 rounded-full border border-white ${COLOR_MAP[imageObj.color]} shadow-sm`}
                            title={imageObj.color}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-shrink-0 w-full text-center py-8 text-gray-500 dark:text-gray-400 md:col-span-5">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    No images available
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {productData.name || "Product Name"}
            </h1>

            {/* Display Gender and Design Type */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                {productData.gender && productData.gender !== ""
                  ? String(productData.gender).charAt(0).toUpperCase() +
                    String(productData.gender).slice(1)
                  : "Unspecified"}
              </span>
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full text-sm">
                {productData.designType}
              </span>
              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                {productData.category}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex text-yellow-400">
                {"★".repeat(Math.floor(productData.ratings || 0))}
                {"☆".repeat(5 - Math.floor(productData.ratings || 0))}
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                ({productData.numOfReviews || 0} reviews)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {productData.offerPrice ? (
                <>
                  <span className="text-3xl font-bold text-green-600">
                    ${productData.offerPrice}
                  </span>
                  <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                    ${productData.price}
                  </span>
                  <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded text-sm">
                    Save ${productData.price - productData.offerPrice}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${productData.price || "0.00"}
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Color Selection */}
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              Available Colors: {selectedColor && (
                <span className="text-blue-600 dark:text-blue-400">{selectedColor}</span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(productData.colors && productData.colors.length > 0) ? (
                productData.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  const hasImages = getImagesForColor(color).length > 0;
                  
                  return (
                    <button
                      key={color}
                      className={`relative flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 min-w-[80px] ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleColorSelect(color)}
                      title={`Select ${color} color${hasImages ? ' (has images)' : ''}`}
                    >
                      {/* Color Swatch */}
                      <div 
                        className={`w-6 h-6 rounded-full ${COLOR_MAP[color] || 'bg-gray-300'} border-2 border-gray-300 shadow-sm mb-1`}
                      />
                      {/* Color Name */}
                      <span className={`text-xs font-medium text-center leading-tight ${
                        isSelected 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-600 dark:text-gray-400"
                      }`}>
                        {color}
                      </span>
                      {/* Image availability indicator */}
                      {hasImages && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" 
                             title="Has color-specific images" />
                      )}
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
                  No color options available
                </div>
              )}
            </div>
            {/* Color selection help text */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedColor 
                ? `Selected: ${selectedColor}. Click image thumbnails or colors to switch.`
                : "Select a color to see specific images and variants."
              }
            </p>
          </div>

          {/* Size Selection */}
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              Size: {selectedSize}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(productData.sizes && productData.sizes.length > 0) ? (
                productData.sizes.map((size) => {
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      className={`px-3 py-2 border rounded-lg transition-all duration-200 hover:scale-105 min-h-[40px] min-w-[40px] font-medium ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:border-blue-500 hover:shadow-md"
                      }`}
                      onClick={() => handleSizeSelect(size)}
                    >
                      {size}
                    </button>
                  );
                })
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
                  No size options available
                </div>
              )}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              Quantity
            </h3>
            <div className="flex items-center gap-3">
              <button
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Variant Availability */}
          {selectedColor && selectedSize && (
            <div className="text-sm">
              {isVariantAvailable() ? (
                <span className="text-green-600">✓ In Stock</span>
              ) : (
                <span className="text-red-600">✗ Out of Stock</span>
              )}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {productData.description || "No description available."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Category:</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {productData.category || "Uncategorized"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Sold:</span>
              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                {productData.numberofSales || 0} units sold
              </span>
            </div>
            
            {productData.date && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Published:</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {new Date(productData.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart and Favorite Buttons */}
          <div className="pt-4 space-y-3">
            <div className="flex gap-3">
              <button
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  isVariantAvailable()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
                onClick={handleAddToCart}
                disabled={!isVariantAvailable()}
              >
                Add to Cart
              </button>
              <button
                className={`p-3 rounded-lg border-2 transition-colors ${
                  isFavorite(productData._id)
                    ? "bg-red-50 border-red-500 text-red-500 hover:bg-red-100"
                    : "bg-white border-gray-300 text-gray-500 hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                }`}
                onClick={() => {
                  if (isFavorite(productData._id)) {
                    removeFromFavorites(productData._id);
                  } else {
                    addToFavorites(productData._id);
                  }
                }}
                title={
                  isFavorite(productData._id)
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                <svg
                  className="w-6 h-6"
                  fill={isFavorite(productData._id) ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Contact Support via WhatsApp */}
            <button
              onClick={handleContactSupport}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center gap-2 mt-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              Ask About This Product
            </button>
            <p className="text-xs text-gray-500 text-center mt-1">
              Get instant help about this product via WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
        <FeaturedProduct />
      </div>

      {/* Product Recommendations */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">You May Also Like</h2>
        <ProductRecommendations
          currentProductId={productData._id}
          category={productData.category}
        />
      </div>
    </div>
  );
};

export default Product;
