'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AddProduct = () => {
  const { getToken } = useAppContext();
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Earphone');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  
  // NEW: State for color and size selection
  const [selectedColors, setSelectedColors] = useState(['Black', 'White']);
  const [selectedSizes, setSelectedSizes] = useState(['M', 'L', 'XL']);

  // Available options
  const AVAILABLE_COLORS = ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'];
  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = await getToken();
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('offerPrice', offerPrice);
      
      // NEW: Add selected colors and sizes
      selectedColors.forEach(color => {
        formData.append('colors', color);
      });
      
      selectedSizes.forEach(size => {
        formData.append('sizes', size);
      });

      // Add images
      for (let i = 0; i < files.length; i++) {
        if (files[i]) {
          formData.append('images', files[i]);
        }
      }

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
        setCategory('');
        setPrice('');
        setOfferPrice('');
        setFiles([]);
        setSelectedColors(['Black', 'White']);
        setSelectedSizes(['M', 'L', 'XL']);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    }
  };

  // NEW: Handle color selection
  const handleColorChange = (color) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        return prev.filter(c => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  // NEW: Handle size selection
  const handleSizeChange = (size) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      } else {
        return [...prev, size];
      }
    });
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <div className="md:p-8 p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-4xl m-auto">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-bold">Add Product</p>
            <p className="text-gray-500">Add new product with variants</p>
          </div>

          {/* Product Images */}
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-semibold">Product Image</h4>
            <div className="flex gap-2">
              {[...Array(4)].map((_, index) => (
                <label key={index} htmlFor={`image${index}`} className="cursor-pointer">
                  <Image
                    className="w-20 h-20 object-cover border-2 border-gray-300 rounded-lg"
                    src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                    alt="upload"
                    width={80}
                    height={80}
                  />
                  <input
                    onChange={(e) => {
                      const updatedFiles = [...files];
                      updatedFiles[index] = e.target.files[0];
                      setFiles(updatedFiles);
                    }}
                    type="file"
                    id={`image${index}`}
                    hidden
                    accept="image/*"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Product Name */}
          <div className="flex flex-col gap-1">
            <label className="text-lg font-semibold">Product Name</label>
            <input
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
              placeholder="Enter product name"
            />
          </div>

          {/* Product Description */}
          <div className="flex flex-col gap-1">
            <label className="text-lg font-semibold">Product Description</label>
            <textarea
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              required
              placeholder="Enter product description"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-lg font-semibold">Category</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value=""></option>
              <option value="DropShoulder">Drop Shoulder</option>
              <option value="T-Shirt">T-shirt</option>
              {/* <option value="Watch">Watch</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Laptop">Laptop</option>
              <option value="Camera">Camera</option>
              <option value="Accessories">Accessories</option> */}
            </select>
          </div>

          {/* Product Price */}
          <div className="flex flex-col gap-1">
            <label className="text-lg font-semibold">Product Price</label>
            <input
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Enter product price"
            />
          </div>

          {/* Offer Price */}
          <div className="flex flex-col gap-1">
            <label className="text-lg font-semibold">Offer Price (Optional)</label>
            <input
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter offer price"
            />
          </div>

          {/* NEW: Color Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold">Available Colors</label>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_COLORS.map((color) => (
                <label key={color} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColors.includes(color)}
                    onChange={() => handleColorChange(color)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{color}</span>
                  <div 
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColors.includes(color) 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-300'
                    }`}
                    style={{
                      backgroundColor: color === 'Black' ? '#000000' :
                                     color === 'White' ? '#FFFFFF' :
                                     color === 'Lite Pink' ? '#FFB6C1' :
                                     color === 'Coffee' ? '#6F4E37' :
                                     color === 'Offwhite' ? '#F5F5DC' :
                                     color === 'NevyBlue' ? '#000080' : '#CCCCCC'
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500">Selected: {selectedColors.join(', ') || 'None'}</p>
          </div>

          {/* NEW: Size Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold">Available Sizes</label>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_SIZES.map((size) => (
                <label key={size} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(size)}
                    onChange={() => handleSizeChange(size)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{size}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500">Selected: {selectedSizes.join(', ') || 'None'}</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!name || !description || !price || selectedColors.length === 0 || selectedSizes.length === 0}
          >
            ADD PRODUCT
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;