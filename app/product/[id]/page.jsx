'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { assets } from '@/assets/assets';
import Image from 'next/image';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

// Available colors and sizes
const AVAILABLE_COLORS = ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'];
const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
  const { products, addToCart } = useAppContext();
  const params = useParams();
  const [productData, setProductData] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for selected variants
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // First try to find in local products array
        const product = products.find(p => p._id === params.id);
        
        if (product) {
          setProductData(product);
          setMainImage(product.images?.[0] || '');
          // Set default selected color and size
          setSelectedColor(product.colors?.[0] || '');
          setSelectedSize(product.sizes?.[0] || '');
        } else {
          // If not found in local array, fetch from API
          const response = await fetch(`/api/product/${params.id}`);
          const data = await response.json();
          
          if (data.success) {
            setProductData(data.product);
            setMainImage(data.product.images?.[0] || '');
            // Set default selected color and size
            setSelectedColor(data.product.colors?.[0] || '');
            setSelectedSize(data.product.sizes?.[0] || '');
          } else {
            toast.error('Product not found');
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
    if (!selectedColor || !selectedSize) return false;
    
    const variant = productData.variants?.find(
      v => v.color === selectedColor && v.size === selectedSize
    );
    
    return variant && variant.stock > 0;
  };

  // Handle add to cart with variants
  const handleAddToCart = () => {
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
      size: selectedSize,
      quantity: quantity
    });
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
  };

  return (
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
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>
          
          {/* Thumbnail Images */}
          <div className="grid grid-cols-4 gap-2">
            {productData.images && productData.images.length > 0 ? (
              productData.images.map((image, index) => (
                <div 
                  key={index}
                  className="rounded-lg overflow-hidden bg-gray-500/10 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
                  onClick={() => setMainImage(image)}
                >
                  <Image
                    src={image || '/placeholder-image.jpg'}
                    alt={`${productData.name} ${index + 1}`}
                    className="w-full h-20 object-cover"
                    width={100}
                    height={80}
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
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {productData.name || 'Product Name'}
            </h1>
            
            {/* NEW: Display Gender and Design Type */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {productData.gender?.charAt(0).toUpperCase() + productData.gender?.slice(1)}
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
            <h3 className="text-lg font-semibold">Color: {selectedColor}</h3>
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
            <h3 className="text-lg font-semibold">Size: {selectedSize}</h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((size) => {
                const isSizeAvailable = productData.sizes?.includes(size);
                const isSelected = selectedSize === size;
                
                return (
                  <button
                    key={size}
                    className={`px-4 py-2 border rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500'
                        : isSizeAvailable
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                    onClick={() => isSizeAvailable && handleSizeSelect(size)}
                    disabled={!isSizeAvailable}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Quantity</h3>
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

          {/* Add to Cart Button */}
          <div className="pt-6">
            <button
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                isVariantAvailable()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              onClick={handleAddToCart}
              disabled={!isVariantAvailable()}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;