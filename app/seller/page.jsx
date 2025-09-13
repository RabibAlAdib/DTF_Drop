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
  
  // NEW: Dynamic image-color pairs (max 10)
  const [imageSlots, setImageSlots] = useState([
    { file: null, color: 'Black' } // Start with one slot
  ]);
  
  // NEW: Custom sizes input
  const [customSizes, setCustomSizes] = useState('M, L, XL');

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

  const parseSizes = (sizeString) => {
    return sizeString.split(',').map(size => size.trim()).filter(size => size.length > 0);
  };

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
    
    // Parse and append sizes
    const sizes = parseSizes(customSizes);
    sizes.forEach(size => formData.append('sizes', size));
    
    // Extract unique colors for the colors field
    const uniqueColors = [...new Set(validImageSlots.map(slot => slot.color))];
    uniqueColors.forEach(color => formData.append('colors', color));

    try {
      const token = await getToken();
      const response = await axios.post('/api/product/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
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
        setCustomSizes('M, L, XL');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
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

        {/* Custom Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Sizes (comma-separated)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., XS, S, M, L, XL, XXL"
            value={customSizes}
            onChange={(e) => setCustomSizes(e.target.value)}
            required
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter sizes separated by commas. Users can select from these options.
          </p>
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

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          ADD PRODUCT
        </button>
      </form>
    </div>
  );
};

export default AddProduct;