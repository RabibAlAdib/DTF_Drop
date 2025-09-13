'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AddProduct = () => {
  const { getToken } = useAppContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Drop Shoulder');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  
  // NEW: State for additional fields
  const [gender, setGender] = useState('both');
  const [designType, setDesignType] = useState('customized');
  
  // Progress bar state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // NEW: Dynamic image-color pairs (max 10)
  const [imageSlots, setImageSlots] = useState([
    { file: null, color: 'Black' } // Start with one slot
  ]);
  
  // NEW: Size management with default and optional XXL
  const [includeXXL, setIncludeXXL] = useState(false);
  const getDefaultSizes = () => {
    const baseSizes = ['M', 'L', 'XL'];
    return includeXXL ? [...baseSizes, 'XXL'] : baseSizes;
  };

  // Available options
  const AVAILABLE_COLORS = ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'];
  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const DESIGN_TYPES = ['Anima', 'Typography', 'game', 'wwe', 'sports', 'motivational', 'jokes', 'Islamic', 'customized'];
  const GENDERS = ['male', 'female', 'both'];

  const addImageSlot = () => {
    if (imageSlots.length < 10) {
      setImageSlots([...imageSlots, { file: null, color: 'Black' }]);
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

  // Remove parseSizes function as it's no longer needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty image slots
    const validImageSlots = imageSlots.filter(slot => slot.file !== null);
    
    if (validImageSlots.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('offerPrice', offerPrice);
    
    // NEW: Append additional fields
    formData.append('gender', gender);
    formData.append('designType', designType);
    
    // NEW: Append image-color pairs using the new API format
    validImageSlots.forEach((slot, index) => {
      formData.append(`image_${index}`, slot.file);
      formData.append(`color_${index}`, slot.color);
    });
    
    // Use default sizes with optional XXL
    const sizes = getDefaultSizes();
    sizes.forEach(size => formData.append('sizes', size));
    
    // Extract unique colors for the colors field
    const uniqueColors = [...new Set(validImageSlots.map(slot => slot.color))];
    uniqueColors.forEach(color => formData.append('colors', color));

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const token = await getToken();
      const response = await axios.post('/api/product/add', formData, {
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
        setName('');
        setDescription('');
        setCategory('Drop Shoulder');
        setPrice('');
        setOfferPrice('');
        setGender('both');
        setDesignType('customized');
        setImageSlots([{ file: null, color: 'Black' }]);
        setIncludeXXL(false);
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
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dynamic Product Images with Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Images (max 10 images)
          </label>
          <div className="space-y-4">
            {imageSlots.map((slot, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex-1">
                  <label 
                    htmlFor={`image${index}`}
                    className="block w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {slot.file ? (
                      <img 
                        src={URL.createObjectURL(slot.file)} 
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span>Image {index + 1}</span>
                      </div>
                    )}
                  </label>
                  <input
                    onChange={(e) => updateImageSlot(index, 'file', e.target.files[0])}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Description
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* NEW: Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* NEW: Design Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Design Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {/* Default Sizes Display */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default sizes:</span>
              <div className="flex gap-2">
                {['M', 'L', 'XL'].map(size => (
                  <span key={size} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                    {size}
                  </span>
                ))}
              </div>
            </div>
            
            {/* XXL Option */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeXXL"
                checked={includeXXL}
                onChange={(e) => setIncludeXXL(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
              />
              <label htmlFor="includeXXL" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include XXL size
              </label>
              {includeXXL && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded">
                  XXL
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All products include M, L, XL sizes by default. Check the box above to also include XXL.
            </p>
          </div>
        </div>

        {/* Product Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Price ($)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            required
          />
        </div>

        {/* Offer Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offer Price ($) (Optional)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setOfferPrice(e.target.value)}
            value={offerPrice}
          />
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Uploading product...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Please don't close this page while uploading...
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            isUploading 
              ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'UPLOADING...' : 'ADD PRODUCT'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;