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
  const [designType, setDesignType] = useState('Customized');
  
  // Progress bar state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // NEW: Dynamic image-color pairs (max 10)
  const [imageSlots, setImageSlots] = useState([
    { file: null, color: 'Black', url: null, uploading: false } // Start with one slot
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
  const DESIGN_TYPES = ['Anime', 'Typography', 'Game', 'WWE', 'Sports', 'Motivational', 'Jokes', 'Islamic', 'Customized', 'Cartoon', 'Movie/TV', 'Music/Band', 'Minimalist', 'Abstract', 'Nature', 'Festival/Seasonal', 'Couple/Friendship', 'Quotes', 'Retro/Vintage', 'Geek/Tech', 'Streetwear', 'Hip-Hop/Rap', 'Graffiti/Urban', 'Fantasy/Mythology', 'Sci-Fi', 'Superheroes/Comics', 'Animals/Pets', 'Cars/Bikes', 'Food/Drinks', 'Travel/Adventure', 'National/Patriotic', 'Memes', 'Spiritual/Inspirational', 'Kids/Family', 'Occupations (Doctor, Engineer, etc.)', 'College/University Life', 'Fitness/Gym', 'Luxury/High Fashion', 'Gaming Esports Teams'];
  const GENDERS = ['male', 'female', 'both'];

  // Simple direct upload - no signature needed
  const uploadToCloudinary = async (file, slotIndex) => {
    try {
      // Update slot to show uploading status
      updateImageSlot(slotIndex, 'uploading', true);

      // Prepare form data for direct upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload directly to our server endpoint
      const uploadResponse = await axios.post('/api/cloudinary/upload', formData, {
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

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || 'Upload failed');
      }

      // Update slot with URL and stop uploading status
      updateImageSlot(slotIndex, 'url', uploadResponse.data.url);
      updateImageSlot(slotIndex, 'uploading', false);
      
      toast.success(`Image ${slotIndex + 1} uploaded successfully!`);
      return uploadResponse.data.url;

    } catch (error) {
      updateImageSlot(slotIndex, 'uploading', false);
      updateImageSlot(slotIndex, 'file', null);
      updateImageSlot(slotIndex, 'url', null);
      
      console.error('Cloudinary upload error:', error);
      toast.error(`Failed to upload image ${slotIndex + 1}: ${error.response?.data?.message || error.message}`);
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
    
    // Validate that at least one image was uploaded
    if (validImageSlots.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    // Prepare JSON data instead of FormData (no more files!)
    const productData = {
      name,
      description,
      category,
      price: parseFloat(price),
      offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
      gender,
      designType,
      // Send image URLs and colors
      imageUrls: validImageSlots.map(slot => slot.url),
      imageColors: validImageSlots.map(slot => slot.color),
      // Use default sizes with optional XXL
      sizes: getDefaultSizes(),
      // Extract unique colors for the colors field
      colors: [...new Set(validImageSlots.map(slot => slot.color))]
    };

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const token = await getToken();
      const response = await axios.post('/api/product/add', productData, {
        headers: {
          'Content-Type': 'application/json',
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
        setDesignType('Customized');
        setImageSlots([{ file: null, color: 'Black', url: null, uploading: false }]);
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

  // Function to delete image from Cloudinary and clear the slot
  const deleteImageFromCloudinary = async (slotIndex) => {
    const slot = imageSlots[slotIndex];
    if (!slot.url) return;

    try {
      const token = await getToken();
      const response = await axios.delete('/api/cloudinary/delete', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        data: {
          imageUrl: slot.url
        }
      });

      if (response.data.success) {
        // Clear the image slot
        updateImageSlot(slotIndex, 'url', null);
        updateImageSlot(slotIndex, 'file', null);
        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image: ' + response.data.message);
      }
    } catch (error) {
      console.error('Delete image error:', error);
      toast.error('Failed to delete image');
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
                        <div className="absolute top-1 right-1 flex gap-1">
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteImageFromCloudinary(index);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                            title="Delete image from storage"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
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
                        <span>Image {index + 1}</span>
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
            <option value="Shirt">Shirt</option>
            <option value="Half Sleeve T-shirt">Half Sleeve T-shirt</option>
            <option value="Full Sleeve T-shirt">Full Sleeve T-shirt</option>
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
              {includeXXL && (
                <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
                  ⚠️ XXL size will have an additional BDT 60 charge for customers
                </span>
              )}
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