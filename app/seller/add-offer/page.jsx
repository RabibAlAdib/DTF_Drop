'use client'
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AddOffer = () => {
  const { getToken, router } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [minimumOrderValue, setMinimumOrderValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [offerType, setOfferType] = useState('card');
  const [priority, setPriority] = useState('0');
  const [category, setCategory] = useState('general');
  const [showCountdown, setShowCountdown] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#FF6B6B');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [isActive, setIsActive] = useState(true);
  const [offerImage, setOfferImage] = useState(null);
  const [applicableProducts, setApplicableProducts] = useState([]);
  
  // Additional state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Constants
  const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' }
  ];
  
  const OFFER_TYPES = [
    { value: 'banner', label: 'Banner (Full-width)' },
    { value: 'card', label: 'Card (Compact)' },
    { value: 'popup', label: 'Popup (Modal)' }
  ];
  
  const CATEGORIES = [
    { value: 'flash_sale', label: 'Flash Sale' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'clearance', label: 'Clearance' },
    { value: 'new_customer', label: 'New Customer' },
    { value: 'bulk_discount', label: 'Bulk Discount' },
    { value: 'festival', label: 'Festival' },
    { value: 'general', label: 'General' }
  ];

  // Fetch seller products for targeting
  const fetchSellerProducts = async () => {
    try {
      setLoadingProducts(true);
      const token = await getToken();
      const response = await axios.get('/api/product/seller-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchSellerProducts();
    
    // Set default dates (today to 30 days from today)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    
    setValidFrom(today.toISOString().split('T')[0]);
    setValidTo(futureDate.toISOString().split('T')[0]);
  }, []);

  // Handle file selection with validation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        toast.error(`Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
        return;
      }
      setOfferImage(file);
    }
  };

  // Generate offer code
  const generateOfferCode = () => {
    const prefix = title.substring(0, 3).toUpperCase() || 'OFF';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setOfferCode(`${prefix}${random}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!title || !description || !discountValue || !validFrom || !validTo) {
      toast.error('Please fill all required fields');
      return;
    }

    const discount = Number(discountValue);
    if (discount <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (discountType === 'percentage' && discount > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    const startDate = new Date(validFrom);
    const endDate = new Date(validTo);
    if (endDate <= startDate) {
      toast.error('End date must be after start date');
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('discountType', discountType);
    formData.append('discountValue', discountValue);
    formData.append('validFrom', validFrom);
    formData.append('validTo', validTo);
    formData.append('offerType', offerType);
    formData.append('priority', priority);
    formData.append('category', category);
    formData.append('showCountdown', showCountdown);
    formData.append('backgroundColor', backgroundColor);
    formData.append('textColor', textColor);
    formData.append('isActive', isActive);
    
    if (offerCode) formData.append('offerCode', offerCode);
    if (minimumOrderValue) formData.append('minimumOrderValue', minimumOrderValue);
    if (usageLimit) formData.append('usageLimit', usageLimit);
    if (offerImage) formData.append('offerImage', offerImage);
    
    // Add applicable products
    applicableProducts.forEach(productId => {
      formData.append('applicableProducts', productId);
    });

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const token = await getToken();
      const response = await axios.post('/api/offer', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Reset form
        setTitle('');
        setDescription('');
        setDiscountValue('');
        setOfferCode('');
        setMinimumOrderValue('');
        setUsageLimit('');
        setOfferImage(null);
        setApplicableProducts([]);
        
        // Navigate to offer list
        setTimeout(() => {
          router.push('/seller/offer-list');
        }, 1500);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Offer</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create attractive offers to boost your sales and engage customers
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Offer Title *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Sale 2024"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your offer in detail..."
              required
            />
          </div>
        </div>

        {/* Discount Configuration */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Discount Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Type *
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                {DISCOUNT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Value * {discountType === 'percentage' ? '(%)' : '(Amount)'}
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '25' : '100'}
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
                required
              />
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Validity Period</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valid From *
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valid To *
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                min={validFrom}
                required
              />
            </div>
          </div>
        </div>

        {/* Offer Code & Restrictions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Promo Code & Restrictions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Offer Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER25"
                />
                <button
                  type="button"
                  onClick={generateOfferCode}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Order Value
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={minimumOrderValue}
                onChange={(e) => setMinimumOrderValue(e.target.value)}
                placeholder="100"
                min="0"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usage Limit
            </label>
            <input
              type="number"
              className="w-full md:w-1/2 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Leave empty for unlimited usage"
              min="1"
            />
          </div>
        </div>

        {/* Display Configuration */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Display Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Style
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value)}
              >
                {OFFER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority (0-10)
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                min="0"
                max="10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <input
                type="color"
                className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCountdown"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                checked={showCountdown}
                onChange={(e) => setShowCountdown(e.target.checked)}
              />
              <label htmlFor="showCountdown" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Show countdown timer
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Activate offer immediately
              </label>
            </div>
          </div>
        </div>

        {/* Offer Image */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Offer Image</h2>
          
          <div className="space-y-4">
            <label 
              htmlFor="offerImage"
              className="block w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              {offerImage ? (
                <img 
                  src={URL.createObjectURL(offerImage)} 
                  alt="Offer preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Image 
                    src={assets.upload_area} 
                    alt="Upload" 
                    width={80} 
                    height={80}
                    className="mb-2"
                  />
                  <span>Click to upload offer image</span>
                  <span className="text-sm">(Max 10MB)</span>
                </div>
              )}
            </label>
            <input
              onChange={handleImageChange}
              type="file"
              id="offerImage"
              hidden
              accept="image/*"
            />
          </div>
        </div>

        {/* Applicable Products */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Applicable Products (Optional)
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Leave empty to apply to all products, or select specific products
          </p>
          
          {loadingProducts ? (
            <div className="text-center py-4">Loading products...</div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {products.map(product => (
                <div key={product._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`product-${product._id}`}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    checked={applicableProducts.includes(product._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setApplicableProducts([...applicableProducts, product._id]);
                      } else {
                        setApplicableProducts(applicableProducts.filter(id => id !== product._id));
                      }
                    }}
                  />
                  <label 
                    htmlFor={`product-${product._id}`}
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    {product.images && product.images[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-8 h-8 object-cover rounded mr-2"
                      />
                    )}
                    {product.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Creating offer...
              </span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/seller/offer-list')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isUploading ? 'Creating...' : 'Create Offer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddOffer;