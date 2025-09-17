'use client'
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from "next/image";

const CustomizationAdmin = () => {
  const { getToken } = useAppContext();
  
  // State for templates list
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Drop Shoulder',
    description: '',
    basePrice: '',
    extraImagePrice: 30,
    availableColors: [],
    availableSizes: [],
    designAreas: {
      front: { x: 50, y: 40, maxWidth: 30, maxHeight: 40 },
      back: { x: 50, y: 40, maxWidth: 30, maxHeight: 40 },
      sleeve: { x: 80, y: 30, maxWidth: 15, maxHeight: 20 },
      pocket: { x: 25, y: 35, maxWidth: 10, maxHeight: 15 }
    }
  });
  
  // Color management
  const [newColor, setNewColor] = useState({ name: 'Black', hexCode: '#000000', mockupImages: [] });
  const [isUploadingMockup, setIsUploadingMockup] = useState(false);
  
  // Size management  
  const [newSize, setNewSize] = useState({ size: 'M', price: '' });
  
  // Available options
  const CATEGORIES = ['Drop Shoulder', 'T-shirt', 'Polo T-shirt', 'Hoodie', 'Tank Top'];
  const COLOR_OPTIONS = ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue', 'Red', 'Green', 'Yellow', 'Purple'];
  const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  // Color hex codes
  const COLOR_HEX = {
    'Black': '#000000',
    'White': '#FFFFFF', 
    'Lite Pink': '#FFB6C1',
    'Coffee': '#6F4E37',
    'Offwhite': '#FAF0E6',
    'NevyBlue': '#000080',
    'Red': '#FF0000',
    'Green': '#008000',
    'Yellow': '#FFFF00',
    'Purple': '#800080'
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/customization/templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Upload mockup image to Cloudinary
  const uploadMockupImage = async (file) => {
    try {
      setIsUploadingMockup(true);
      
      // Get Cloudinary signature
      const token = await getToken();
      const signatureResponse = await axios.post('/api/cloudinary/signature', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const signatureData = signatureResponse.data;
      
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.api_key);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('signature', signatureData.signature);
      formData.append('folder', 'customization-mockups');
      formData.append('transformation', 'c_limit,w_800,h_800,q_auto,f_auto');
      
      const uploadResponse = await axios.post(signatureData.upload_url, formData);
      return uploadResponse.data.secure_url;
      
    } catch (error) {
      console.error('Mockup upload error:', error);
      toast.error('Failed to upload mockup image');
      throw error;
    } finally {
      setIsUploadingMockup(false);
    }
  };

  // Handle multiple mockup file selection
  const handleMockupFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate file types
    const invalidFiles = files.filter(file => !file.type.includes('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Please select only valid image files');
      return;
    }
    
    // Limit to maximum 5 mockup images per color
    if (newColor.mockupImages.length + files.length > 5) {
      toast.error('Maximum 5 mockup images per color allowed');
      return;
    }
    
    try {
      setIsUploadingMockup(true);
      const uploadPromises = files.map(file => uploadMockupImage(file));
      const imageUrls = await Promise.all(uploadPromises);
      
      setNewColor(prev => ({ 
        ...prev, 
        mockupImages: [...prev.mockupImages, ...imageUrls] 
      }));
      toast.success(`${files.length} mockup image(s) uploaded successfully`);
    } catch (error) {
      // Error already handled in uploadMockupImage
    } finally {
      setIsUploadingMockup(false);
    }
  };
  
  // Remove mockup image from color
  const removeMockupImage = (index) => {
    setNewColor(prev => ({
      ...prev,
      mockupImages: prev.mockupImages.filter((_, i) => i !== index)
    }));
  };

  // Add color to template
  const addColorToTemplate = () => {
    if (!newColor.name || !newColor.hexCode || newColor.mockupImages.length === 0) {
      toast.error('Please fill all color fields and upload at least one mockup image');
      return;
    }
    
    const colorExists = formData.availableColors.some(c => c.name === newColor.name);
    if (colorExists) {
      toast.error('Color already exists in template');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      availableColors: [...prev.availableColors, { ...newColor }]
    }));
    
    setNewColor({ name: 'Black', hexCode: '#000000', mockupImages: [] });
    toast.success('Color added to template');
  };

  // Remove color from template
  const removeColorFromTemplate = (colorName) => {
    setFormData(prev => ({
      ...prev,
      availableColors: prev.availableColors.filter(c => c.name !== colorName)
    }));
  };

  // Add size to template
  const addSizeToTemplate = () => {
    if (!newSize.size || !newSize.price) {
      toast.error('Please fill all size fields');
      return;
    }
    
    const sizeExists = formData.availableSizes.some(s => s.size === newSize.size);
    if (sizeExists) {
      toast.error('Size already exists in template');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      availableSizes: [...prev.availableSizes, { 
        size: newSize.size, 
        price: parseFloat(newSize.price) 
      }]
    }));
    
    setNewSize({ size: 'M', price: '' });
    toast.success('Size added to template');
  };

  // Remove size from template
  const removeSizeFromTemplate = (size) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.filter(s => s.size !== size)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.basePrice) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (formData.availableColors.length === 0) {
      toast.error('Please add at least one color');
      return;
    }
    
    if (formData.availableSizes.length === 0) {
      toast.error('Please add at least one size');
      return;
    }
    
    try {
      const token = await getToken();
      const url = editingTemplate 
        ? `/api/customization/templates/${editingTemplate._id}`
        : '/api/customization/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await axios({
        method,
        url,
        data: {
          ...formData,
          basePrice: parseFloat(formData.basePrice),
          extraImagePrice: parseFloat(formData.extraImagePrice)
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        resetForm();
        fetchTemplates();
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Drop Shoulder',
      description: '',
      basePrice: '',
      extraImagePrice: 30,
      availableColors: [],
      availableSizes: [],
      designAreas: {
        front: { x: 50, y: 40, maxWidth: 30, maxHeight: 40 },
        back: { x: 50, y: 40, maxWidth: 30, maxHeight: 40 },
        sleeve: { x: 80, y: 30, maxWidth: 15, maxHeight: 20 },
        pocket: { x: 25, y: 35, maxWidth: 10, maxHeight: 15 }
      }
    });
    setEditingTemplate(null);
    setNewColor({ name: 'Black', hexCode: '#000000', mockupImages: [] });
    setNewSize({ size: 'M', price: '' });
  };

  // Edit template
  const handleEditTemplate = (template) => {
    // Handle backward compatibility: convert old mockupImage to mockupImages array
    const updatedTemplate = {
      ...template,
      availableColors: template.availableColors.map(color => ({
        ...color,
        mockupImages: color.mockupImages || (color.mockupImage ? [color.mockupImage] : [])
      }))
    };
    
    setFormData(updatedTemplate);
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const token = await getToken();
      const response = await axios.delete(`/api/customization/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
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
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customization Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your product customization templates, colors, and mockups</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + Add New Template
        </button>
      </div>

      {/* Templates List */}
      {!isFormOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{template.category}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{template.description}</p>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Base Price: </span>
                  <span className="text-green-600 font-semibold">৳{template.basePrice}</span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Colors: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.availableColors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                        title={color.name}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sizes: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.availableSizes.map((size, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                      >
                        {size.size} (৳{size.price})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Premium Drop Shoulder"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Describe your product template"
                required
              ></textarea>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Price (BDT) *
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="500"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extra Image Price (BDT)
                </label>
                <input
                  type="number"
                  value={formData.extraImagePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, extraImagePrice: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="30"
                  min="0"
                />
              </div>
            </div>

            {/* Color Management */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Colors</h3>
              
              {/* Add New Color */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Color</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color Name</label>
                    <select
                      value={newColor.name}
                      onChange={(e) => setNewColor(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        hexCode: COLOR_HEX[e.target.value] || '#000000'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    >
                      {COLOR_OPTIONS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hex Code</label>
                    <input
                      type="color"
                      value={newColor.hexCode}
                      onChange={(e) => setNewColor(prev => ({ ...prev, hexCode: e.target.value }))}
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mockup Images (PNG) - Max 5</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMockupFileChange}
                      disabled={isUploadingMockup}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white disabled:opacity-50"
                    />
                    {isUploadingMockup && (
                      <p className="text-blue-600 text-xs mt-1">Uploading...</p>
                    )}
                  </div>
                  
                  <div>
                    <button
                      type="button"
                      onClick={addColorToTemplate}
                      disabled={isUploadingMockup || newColor.mockupImages.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      {isUploadingMockup ? 'Uploading...' : 'Add Color'}
                    </button>
                  </div>
                </div>
                
                {newColor.mockupImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mockup Preview ({newColor.mockupImages.length}/5)</p>
                    <div className="flex flex-wrap gap-2">
                      {newColor.mockupImages.map((imageUrl, imgIndex) => (
                        <div key={imgIndex} className="relative group">
                          <img 
                            src={imageUrl} 
                            alt={`Mockup preview ${imgIndex + 1}`} 
                            className="w-16 h-16 object-cover rounded border" 
                          />
                          <button
                            type="button"
                            onClick={() => removeMockupImage(imgIndex)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Current Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.availableColors.map((color, index) => {
                  // Handle backward compatibility: convert single mockupImage to mockupImages array
                  const mockupImages = color.mockupImages || (color.mockupImage ? [color.mockupImage] : []);
                  
                  return (
                    <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color.hexCode }}
                          ></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{color.name}</p>
                            <p className="text-sm text-gray-500">{color.hexCode}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeColorFromTemplate(color.name)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {mockupImages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Mockups ({mockupImages.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {mockupImages.map((imageUrl, imgIndex) => (
                              <img 
                                key={imgIndex}
                                src={imageUrl} 
                                alt={`${color.name} mockup ${imgIndex + 1}`} 
                                className="w-12 h-12 object-cover rounded border" 
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Size Management */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Sizes</h3>
              
              {/* Add New Size */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Size</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
                    <select
                      value={newSize.size}
                      onChange={(e) => setNewSize(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    >
                      {SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (BDT)</label>
                    <input
                      type="number"
                      value={newSize.price}
                      onChange={(e) => setNewSize(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="500"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <button
                      type="button"
                      onClick={addSizeToTemplate}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Add Size
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Current Sizes */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {formData.availableSizes.map((sizeInfo, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-center">
                    <div className="font-medium text-gray-900 dark:text-white">{sizeInfo.size}</div>
                    <div className="text-sm text-green-600 font-semibold">৳{sizeInfo.price}</div>
                    <button
                      type="button"
                      onClick={() => removeSizeFromTemplate(sizeInfo.size)}
                      className="text-red-600 hover:text-red-800 text-xs mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomizationAdmin;