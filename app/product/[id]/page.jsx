'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { assets } from '@/assets/assets';
import Image from 'next/image';
import Loading from '@/components/Loading';
import { toast } from 'react-hot-toast';
import ProductRecommendations from '@/components/ProductRecommendations';
import Navbar from '@/components/Navbar';
import FeaturedProduct from '@/components/FeaturedProduct';

// Available colors and sizes
const AVAILABLE_COLORS = ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'];
const AVAILABLE_SIZES = ['M', 'L', 'XL', ]; //'XXL(Special Order)'
// Color mapping for display
const COLOR_MAP = {
  'Black': 'bg-black',
  'White': 'bg-white border border-gray-300',
  'Lite Pink': 'bg-pink-200',
  'Coffee': 'bg-amber-800',
  'Offwhite': 'bg-gray-100 border border-gray-300',
  'NevyBlue': 'bg-blue-900'
};

const Product = () => {
  const { products, addToCart, addToFavorites, removeFromFavorites, isFavorite } = useAppContext();
  const params = useParams();
  const [productData, setProductData] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for selected variants
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // Helper function to get images for selected color
  const getImagesForColor = (color) => {
    if (!productData) return [];
    
    // Use new colorImages if available
    if (productData.colorImages && productData.colorImages.length > 0) {
      return productData.colorImages
        .filter(img => img.color === color)
        .map(img => img.url);
    }
    
    // Fallback to legacy images
    return productData.images || [];
  };
  
  // Helper function to get all available images
  const getAllImages = () => {
    if (!productData) return [];
    
    // Use new colorImages if available
    if (productData.colorImages && productData.colorImages.length > 0) {
      return productData.colorImages.map(img => img.url);
    }
    
    // Fallback to legacy images
    return productData.images || [];
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // First try to find product in local products array for faster loading
        const localProduct = products.find(p => p._id === params.id);
        
        if (localProduct) {
          setProductData(localProduct);
          
          // Set initial color and size
          const initialColor = localProduct.colors?.[0] || '';
          const initialSize = localProduct.sizes?.[0] || '';
          setSelectedColor(initialColor);
          setSelectedSize(initialSize);
          
          // Set main image based on color or fallback to first image
          if (localProduct.colorImages && localProduct.colorImages.length > 0) {
            const colorImage = localProduct.colorImages.find(img => img.color === initialColor);
            setMainImage(colorImage?.url || localProduct.colorImages[0]?.url || '');
          } else {
            setMainImage(localProduct.images?.[0] || '');
          }
          
          setLoading(false);
        } else {
          // If not found locally, fetch from API
          const response = await fetch(`/api/product/${params.id}`);
          const data = await response.json();
          
          if (data.success) {
            setProductData(data.product);
            
            // Set initial color and size
            const initialColor = data.product.colors?.[0] || '';
            const initialSize = data.product.sizes?.[0] || '';
            setSelectedColor(initialColor);
            setSelectedSize(initialSize);
            
            // Set main image based on color or fallback to first image
            if (data.product.colorImages && data.product.colorImages.length > 0) {
              const colorImage = data.product.colorImages.find(img => img.color === initialColor);
              setMainImage(colorImage?.url || data.product.colorImages[0]?.url || '');
            } else {
              setMainImage(data.product.images?.[0] || '');
            }
          } else {
            toast.error(data.message || 'Product not found');
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
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
      v => v.color === selectedColor && v.size === selectedSize
    );
    
    return variant && variant.stock > 0;
  };
  
  // Handle add to cart with variants
  const handleAddToCart = () => {
    // If variants exist, require color and size selection
    if (productData.variants && productData.variants.length > 0) {
      if (!selectedColor || !selectedSize) {
        toast.error('Please select color and size');
        return;
      }
      
      if (!isVariantAvailable()) {
        toast.error('Selected variant is not available');
        return;
      }
      
      addToCart(productData._id, {
        color: selectedColor,
        size: selectedSize
      }, quantity);
    } else {
      // No variants, add to cart directly
      addToCart(productData._id, {}, quantity);
    }
  };
  
  // Handle size selection properly
  const handleSizeSelect = (size) => {
    console.log('Size selected:', size);
    setSelectedSize(size);
  };
  
  // Handle color selection properly
  const handleColorSelect = (color) => {
    console.log('Color selected:', color);
    setSelectedColor(color);
    
    // Update main image to show the selected color's image
    const colorImages = getImagesForColor(color);
    if (colorImages.length > 0) {
      setMainImage(colorImages[0]);
    }
  };

  return (
    <>
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
            <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4">
                <Image
                src={mainImage || '/placeholder-image.jpg'}
                alt={productData.name || 'Product image'}
                className="w-full h-auto object-cover mix-blend-multiply"
                width={1280}
                height={720}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                }}
                />
            </div>
            
            {/* Thumbnail Images - Show images for selected color */}
            <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const currentImages = selectedColor ? getImagesForColor(selectedColor) : getAllImages();
                  
                  return currentImages.length > 0 ? (
                    currentImages.map((image, index) => (
                      <div 
                        key={index}
                        className={`rounded-lg overflow-hidden bg-gray-500/10 cursor-pointer border-2 transition-colors ${
                          mainImage === image ? 'border-blue-500' : 'border-transparent hover:border-blue-500'
                        }`}
                        onClick={() => setMainImage(image)}
                      >
                        <Image
                          src={image || '/placeholder-image.jpg'}
                          alt={`${productData.name} ${selectedColor || ''} ${index + 1}`}
                          className="w-full h-20 object-cover"
                          width={100}
                          height={80}
                          sizes="80px"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-8 text-gray-500">
                      No images available
                    </div>
                  );
                })()} 
            </div>
            </div>
            
            {/* Product Details */}
            <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {productData.name || 'Product Name'}
                </h1>
                
                {/* Display Gender and Design Type */}
                <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {productData.gender ? 
                        String(productData.gender).charAt(0).toUpperCase() + String(productData.gender).slice(1) 
                        : 'Unspecified'}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    {productData.designType}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {productData.category}
                </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                    {'★'.repeat(Math.floor(productData.ratings || 0))}
                    {'☆'.repeat(5 - Math.floor(productData.ratings || 0))}
                </div>
                <span className="text-gray-600">
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
                    <span className="text-xl text-gray-500 line-through">
                        ${productData.price}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        Save ${productData.price - productData.offerPrice}
                    </span>
                    </>
                ) : (
                    <span className="text-3xl font-bold text-gray-900">
                    ${productData.price || '0.00'}
                    </span>
                )}
                </div>
            </div>
            
            {/* Color Selection */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold dark:text-gray-200">Color: {selectedColor}</h3>
                <div className="flex flex-wrap gap-2">
                {productData.colors?.map((color) => (
                    <button
                    key={color}
                    className={`w-8 h-8 rounded-full ${COLOR_MAP[color]} border-2 ${
                        selectedColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                    } transition-all cursor-pointer hover:scale-110`}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                    />
                ))}
                </div>
            </div>
            
            {/* Size Selection */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold dark:text-gray-200">Size: {selectedSize}</h3>
                <div className="flex flex-wrap gap-2">
                {(productData.sizes || []).map((size) => {
                    const isSelected = selectedSize === size;
                    
                    return (
                    <button
                        key={size}
                        className={`px-4 py-2 border rounded-lg transition-all ${
                        isSelected
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:border-blue-500'
                        }`}
                        onClick={() => handleSizeSelect(size)}
                    >
                        {size}
                    </button>
                    );
                })}
                </div>
            </div>
            
            {/* Quantity Selection */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold dark:text-gray-200">Quantity</h3>
                <div className="flex items-center gap-3">
                <button
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                >
                    -
                </button>
                <span className="text-lg font-semibold min-w-[2rem] text-center">{quantity}</span>
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
                {productData.description || 'No description available.'}
                </p>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                <span className="font-semibold">Category:</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {productData.category || 'Uncategorized'}
                </span>
                </div>
                
                <div className="flex items-center gap-2">
                <span className="font-semibold">Sold:</span>
                <span>{productData.numberofSales || 0} units</span>
                </div>
            </div>
            
            {/* Add to Cart and Favorite Buttons */}
            <div className="pt-6 space-y-4">
                <div className="flex gap-3">
                    <button
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                        isVariantAvailable()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                    onClick={handleAddToCart}
                    disabled={!isVariantAvailable()}
                    >
                    Add to Cart
                    </button>
                    <button
                    className={`p-3 rounded-lg border-2 transition-colors ${
                        isFavorite(productData._id)
                        ? 'bg-red-50 border-red-500 text-red-500 hover:bg-red-100'
                        : 'bg-white border-gray-300 text-gray-500 hover:border-red-500 hover:text-red-500 hover:bg-red-50'
                    }`}
                    onClick={() => {
                        if (isFavorite(productData._id)) {
                        removeFromFavorites(productData._id);
                        } else {
                        addToFavorites(productData._id);
                        }
                    }}
                    title={isFavorite(productData._id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                    <svg className="w-6 h-6" fill={isFavorite(productData._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    </button>
                </div>
            </div>
            </div>
        </div>
        
        {/* Featured Products */}
        <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <FeaturedProduct />
        </div>
        
        {/* Product Recommendations */}
        <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <ProductRecommendations 
            currentProductId={productData._id} 
            category={productData.category} 
        />
        </div>
      </div>
    </>
  );
};

export default Product;