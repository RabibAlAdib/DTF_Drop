'use client'
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from "next/image";

const EditProduct = () => {
  const { getToken, router } = useAppContext();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Drop Shoulder');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [gender, setGender] = useState('both');
  const [designType, setDesignType] = useState('customized');
  
  // Image management
  const [imageSlots, setImageSlots] = useState([
    { file: null, color: 'Black', url: null, uploading: false } // Start with one slot
  ]);
  const [existingImages, setExistingImages] = useState([]);

  // Size management
  const [selectedSizes, setSelectedSizes] = useState(['M', 'L', 'XL']);
  const [originalColors, setOriginalColors] = useState([]);

  // Available options
  const AVAILABLE_COLORS = ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'];
  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const DESIGN_TYPES = ['Anima', 'Typography', 'game', 'wwe', 'sports', 'motivational', 'jokes', 'Islamic', 'customized'];
  const GENDERS = ['male', 'female', 'both'];

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/product/${params.id}`);
        const data = await response.json();

        if (data.success) {
          const product = data.product;
          
          // Populate form fields
          setName(product.name || '');
          setDescription(product.description || '');
          setCategory(product.category || 'Drop Shoulder');
          setPrice(product.price?.toString() || '');
          setOfferPrice(product.offerPrice?.toString() || '');
          setGender(product.gender || 'both');
          setDesignType(product.designType || 'customized');
          
          // Handle existing images
          if (product.colorImages && product.colorImages.length > 0) {
            setExistingImages(product.colorImages);
          } else if (product.images && product.images.length > 0) {
            setExistingImages(product.images.map(img => ({ url: img, color: 'Black' })));
          }
          
          // Set existing sizes
          if (product.sizes && product.sizes.length > 0) {
            setSelectedSizes(product.sizes);
          }
          
          // Store original colors for preservation
          if (product.colors && product.colors.length > 0) {
            setOriginalColors(product.colors);
          }
        } else {
          toast.error("Product not found");
          router.push('/seller/product-list');
        }
      } catch (error) {
        toast.error("Failed to load product");
        router.push('/seller/product-list');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  // Function to get Cloudinary signature
  const getCloudinarySignature = async () => {
    try {
      const token = await getToken();
      const response = await axios.post('/api/cloudinary/signature', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get upload signature');
    }
  };

  // Function to upload image directly to Cloudinary
  const uploadToCloudinary = async (file, slotIndex) => {
    try {
      // Update slot to show uploading status
      updateImageSlot(slotIndex, 'uploading', true);

      // Get signature
      const signatureData = await getCloudinarySignature();
      
      if (!signatureData.success) {
        throw new Error('Failed to get upload signature');
      }

      // Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('api_key', signatureData.api_key);
      formData.append('folder', 'products');
      formData.append('transformation', 'c_limit,w_800,h_800,q_auto,f_auto');

      // Upload to Cloudinary
      const uploadResponse = await axios.post(signatureData.upload_url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress for slot ${slotIndex}: ${percentCompleted}%`);
        }
      });

      // Update slot with URL and stop uploading status
      updateImageSlot(slotIndex, 'url', uploadResponse.data.secure_url);
      updateImageSlot(slotIndex, 'uploading', false);
      
      toast.success(`Image ${slotIndex + 1} uploaded successfully!`);
      return uploadResponse.data.secure_url;

    } catch (error) {
      updateImageSlot(slotIndex, 'uploading', false);
      updateImageSlot(slotIndex, 'file', null);
      updateImageSlot(slotIndex, 'url', null);
      
      console.error('Cloudinary upload error:', error);
      toast.error(`Failed to upload image ${slotIndex + 1}: ${error.message}`);
      throw error;
    }
  };

  const addImageSlot = () => {
    if (imageSlots.length < 10) {
      setImageSlots([...imageSlots, { file: null, color: 'Black', url: null, uploading: false }]);
    }
  };

  const removeImageSlot = (index) => {
    if (imageSlots.length > 1) {
      const newSlots = imageSlots.filter((_, i) => i !== index);
      setImageSlots(newSlots);
    }
  };

  const updateImageSlot = (index, field, value) => {
    const newSlots = [...imageSlots];
    newSlots[index][field] = value;
    setImageSlots(newSlots);
  };


  // Handle file selection with immediate validation and upload
  const handleFileChange = async (index, file) => {
    if (!file) return;

    // Immediate validation for this file
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      toast.error(`Image "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
      return;
    }

    // Update slot with file and start upload process
    updateImageSlot(index, 'file', file);
    
    try {
      // Upload to Cloudinary immediately
      await uploadToCloudinary(file, index);
    } catch (error) {
      console.error('Upload failed:', error);
      // Error handling is already done in uploadToCloudinary
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out slots that have successfully uploaded images
    const validImageSlots = imageSlots.filter(slot => slot.url !== null);
    
    // Check if there are any images still uploading
    const uploadingSlots = imageSlots.filter(slot => slot.uploading);
    if (uploadingSlots.length > 0) {
      toast.warning(`Please wait for ${uploadingSlots.length} image(s) to finish uploading before submitting.`);
      return;
    }
    
    // Check if we have new images or existing images
    if (validImageSlots.length === 0 && existingImages.length === 0) {
      toast.error('Please keep existing images or upload new images');
      return;
    }
    
    // Add selected sizes validation
    if (selectedSizes.length === 0) {
      toast.error('Please select at least one size');
      return;
    }
    
    // Prepare JSON data instead of FormData
    const productData = {
      productId: params.id,
      name,
      description,
      category,
      price: parseFloat(price),
      offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
      gender,
      designType,
      sizes: selectedSizes
    };

    // Handle images: only send new image URLs if uploaded, otherwise keep existing images
    if (validImageSlots.length > 0) {
      // New images uploaded - send URLs and colors
      productData.imageUrls = validImageSlots.map(slot => slot.url);
      productData.imageColors = validImageSlots.map(slot => slot.color);
      // Extract unique colors from new images
      productData.colors = [...new Set(validImageSlots.map(slot => slot.color))];
    } else {
      // No new images - preserve original colors
      if (originalColors.length > 0) {
        productData.colors = originalColors;
      } else {
        // Fallback - use colors from existing images
        productData.colors = [...new Set(existingImages.map(img => img.color))];
      }
    }

    try {
      const token = await getToken();
      const response = await axios.put('/api/product/update', productData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        router.push('/seller/product-list');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/seller/product-list')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Products
        </button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Existing Images Display */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Images (will be replaced if new images are uploaded)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {existingImages.map((img, index) => (
                <div key={index} className="text-center">
                  <img 
                    src={img.url} 
                    alt={`Current ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{img.color}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload New Images (Optional - will replace current images)
          </label>
          <div className="space-y-4">
            {imageSlots.map((slot, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex-1">
                  <label 
                    htmlFor={`image${index}`}
                    className={`block w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
                      slot.uploading 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-wait' 
                        : slot.url 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 cursor-pointer hover:border-green-600'
                        : 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500'
                    }`}
                  >
                    {slot.uploading ? (
                      <div className="flex flex-col items-center justify-center h-full text-blue-600">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : slot.url ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={slot.url} 
                          alt={`Preview ${index}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ) : slot.file ? (
                      <img 
                        src={URL.createObjectURL(slot.file)} 
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span>New Image {index + 1}</span>
                      </div>
                    )}
                  </label>
                  <input
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    type="file"
                    id={`image${index}`}
                    hidden
                    accept="image/*"
                  />
                </div>
                
                <div className="w-full sm:w-48 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color for this image
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={slot.color}
                    onChange={(e) => updateImageSlot(index, 'color', e.target.value)}
                  >
                    {AVAILABLE_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  
                  {imageSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageSlot(index)}
                      className="w-full px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {imageSlots.length < 10 && (
              <button
                type="button"
                onClick={addImageSlot}
                className="w-full px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                + Add Image
              </button>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Description
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            required
          >
            <option value="Drop Shoulder">Drop Shoulder</option>
            <option value="Panjabi">Panjabi</option>
            <option value="Pant">Pant</option>
            <option value="shirt">Shirt</option>
            <option value="Half Sleeve T-shirt">Half Sleeve T-shirt</option>
            <option value="full Sleeve T-shirt">Full Sleeve T-shirt</option>
            <option value="Polo T-shirt">Polo T-shirt</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setGender(e.target.value)}
            value={gender}
            required
          >
            {GENDERS.map(gender => (
              <option key={gender} value={gender}>
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Design Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Design Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setDesignType(e.target.value)}
            value={designType}
            required
          >
            {DESIGN_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Available Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Sizes
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {AVAILABLE_SIZES.map(size => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <label key={size} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSizes([...selectedSizes, size]);
                        } else {
                          setSelectedSizes(selectedSizes.filter(s => s !== size));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                    />
                    <span className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isSelected 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                    }`}>
                      {size}
                    </span>
                  </label>
                );
              })}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Selected sizes:</strong> {selectedSizes.length > 0 ? selectedSizes.join(', ') : 'None'}
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select the sizes you want to offer for this product. At least one size must be selected.
            </p>
          </div>
        </div>

        {/* Product Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Price ($)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            required
          />
        </div>

        {/* Offer Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Offer Price ($) (Optional)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setOfferPrice(e.target.value)}
            value={offerPrice}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/seller/product-list')}
            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;