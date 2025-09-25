'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from "next/image";
import { useUser } from '@clerk/nextjs';
import Footer from '@/components/Footer';

const CustomizationPage = () => {
  const { getToken, addToCart } = useAppContext();
  const { user } = useUser();
  
  // State management
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leftMenuVisible, setLeftMenuVisible] = useState(true);
  
  // Design state
  const [userDesigns, setUserDesigns] = useState({
    front: { imageUrl: null, position: { x: 50, y: 40 }, size: { width: 25, height: 30 }, rotation: 0 },
    back: { imageUrl: null, position: { x: 50, y: 40 }, size: { width: 25, height: 30 }, rotation: 0 },
    sleeve: { imageUrl: null, position: { x: 80, y: 30 }, size: { width: 12, height: 15 }, rotation: 0 },
    pocket: { imageUrl: null, position: { x: 25, y: 35 }, size: { width: 8, height: 12 }, rotation: 0 }
  });
  
  const [currentView, setCurrentView] = useState('front');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedDesign, setSelectedDesign] = useState(null);
  
  // File upload state
  const [uploadingArea, setUploadingArea] = useState(null);
  
  // Canvas/mockup refs
  const mockupRef = useRef(null);
  
  // Fetch templates on load
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedDesign && userDesigns[selectedDesign].imageUrl) {
        const step = e.shiftKey ? 10 : 1; // Hold Shift for larger steps
        let newPosition = { ...userDesigns[selectedDesign].position };
        
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            newPosition.y = Math.max(0, newPosition.y - step);
            break;
          case 'ArrowDown':
            e.preventDefault();
            newPosition.y = Math.min(100, newPosition.y + step);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            newPosition.x = Math.max(0, newPosition.x - step);
            break;
          case 'ArrowRight':
            e.preventDefault();
            newPosition.x = Math.min(100, newPosition.x + step);
            break;
          default:
            return;
        }
        
        setUserDesigns(prev => ({
          ...prev,
          [selectedDesign]: {
            ...prev[selectedDesign],
            position: newPosition
          }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDesign, userDesigns]);
  
  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/customization/templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
        if (response.data.templates.length > 0) {
          setSelectedTemplate(response.data.templates[0]);
          if (response.data.templates[0].availableColors.length > 0) {
            setSelectedColor(response.data.templates[0].availableColors[0]);
          }
          if (response.data.templates[0].availableSizes.length > 0) {
            setSelectedSize(response.data.templates[0].availableSizes[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load customization options');
    } finally {
      setLoading(false);
    }
  };
  
  // Upload image to Cloudinary with improved error handling
  const uploadImageToCloudinary = async (file) => {
    try {
      const token = await getToken();
      const signatureResponse = await axios.post('/api/cloudinary/signature', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const signatureData = signatureResponse.data;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.api_key);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('signature', signatureData.signature);
      formData.append('folder', 'custom-designs');
      formData.append('transformation', 'c_limit,w_800,h_800,q_auto,f_auto');
      
      const uploadResponse = await axios.post(signatureData.upload_url, formData, {
        timeout: 30000, // 30 second timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      
      return uploadResponse.data.secure_url;
      
    } catch (error) {
      console.error('Upload error:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - please try a smaller image');
      }
      throw new Error('Upload failed - please try again');
    }
  };
  
  // Handle file upload with improved validation
  const handleFileUpload = async (file, area) => {
    if (!file) return;
    
    // Enhanced validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit for better performance
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    try {
      setUploadingArea(area);
      toast.loading('Uploading image...', { id: 'upload' });
      
      const imageUrl = await uploadImageToCloudinary(file);
      
      setUserDesigns(prev => ({
        ...prev,
        [area]: {
          ...prev[area],
          imageUrl
        }
      }));
      
      setSelectedDesign(area); // Auto-select the uploaded design
      toast.success(`${area.charAt(0).toUpperCase() + area.slice(1)} design uploaded successfully`, { id: 'upload' });
    } catch (error) {
      toast.error(error.message || 'Failed to upload image', { id: 'upload' });
    } finally {
      setUploadingArea(null);
    }
  };
  
  // Enhanced drag functionality
  const handleDragStart = useCallback((e, area) => {
    if (area !== currentView) return;
    
    setIsDragging(true);
    setSelectedDesign(area);
    const rect = mockupRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDragOffset({
      x: x - userDesigns[area].position.x,
      y: y - userDesigns[area].position.y
    });
  }, [currentView, userDesigns]);
  
  const handleDragMove = useCallback((e) => {
    if (!isDragging || !mockupRef.current) return;
    
    const rect = mockupRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newX = Math.max(0, Math.min(100, x - dragOffset.x));
    const newY = Math.max(0, Math.min(100, y - dragOffset.y));
    
    setUserDesigns(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        position: { x: newX, y: newY }
      }
    }));
  }, [isDragging, dragOffset, currentView]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Mouse event handlers
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);
  
  // Handle resize
  const handleResize = (area, newWidth, newHeight) => {
    const maxWidth = selectedTemplate?.designAreas?.[area]?.maxWidth || 40;
    const maxHeight = selectedTemplate?.designAreas?.[area]?.maxHeight || 50;
    
    const clampedWidth = Math.max(8, Math.min(maxWidth, newWidth));
    const clampedHeight = Math.max(8, Math.min(maxHeight, newHeight));
    
    setUserDesigns(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        size: { width: clampedWidth, height: clampedHeight }
      }
    }));
  };
  
  // Calculate total price
  const calculatePrice = () => {
    if (!selectedSize) return 0;
    
    let basePrice = selectedSize.price;
    let extraPrice = 0;
    
    if (userDesigns.sleeve.imageUrl) {
      extraPrice += selectedTemplate?.extraImagePrice || 30;
    }
    if (userDesigns.pocket.imageUrl) {
      extraPrice += selectedTemplate?.extraImagePrice || 30;
    }
    
    return basePrice + extraPrice;
  };
  
  // Remove design
  const removeDesign = (area) => {
    setUserDesigns(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        imageUrl: null
      }
    }));
    if (selectedDesign === area) {
      setSelectedDesign(null);
    }
  };
  
  // Add to cart functionality
  const handleAddToCart = () => {
    if (!selectedTemplate || !selectedColor || !selectedSize) {
      toast.error('Please select a product, color, and size');
      return;
    }
    
    if (!userDesigns.front.imageUrl && !userDesigns.back.imageUrl) {
      toast.error('Please upload at least one design (front or back)');
      return;
    }
    
    // Create custom order data
    const customOrderData = {
      templateId: selectedTemplate._id,
      category: selectedTemplate.category,
      color: selectedColor.name,
      size: selectedSize.size,
      basePrice: selectedSize.price,
      designs: userDesigns,
      totalPrice: calculatePrice(),
      specialInstructions: ''
    };
    
    // Add to cart with custom data
    addToCart(selectedTemplate._id, selectedColor.name, selectedSize.size, 1, customOrderData);
    toast.success('Custom design added to cart!');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading customization tools...</p>
        </div>
      </div>
    );
  }
  
  if (templates.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Templates Available</h2>
            <p className="text-gray-600">Please contact admin to add customization templates.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        {/* Professional Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Design Studio</h1>
                <p className="text-gray-600 mt-1">Create your custom drop shoulder design</p>
              </div>
              
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setLeftMenuVisible(!leftMenuVisible)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {leftMenuVisible ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar - Professional Menu */}
          <div className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
            leftMenuVisible ? 'w-80' : 'w-0'
          } lg:w-80 flex-shrink-0 overflow-hidden`}>
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-4">
                
                {/* Step 1: Product Selection */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <h3 className="text-sm font-semibold text-gray-900">Choose Product</h3>
                  </div>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template._id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setSelectedColor(template.availableColors[0] || null);
                          setSelectedSize(template.availableSizes[0] || null);
                        }}
                        className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          selectedTemplate?._id === template._id
                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{template.name}</h4>
                            <p className="text-xs text-gray-500">{template.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-green-600">৳{Math.min(...template.availableSizes.map(s => s.price))}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Color Selection */}
                {selectedTemplate && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <h3 className="text-sm font-semibold text-gray-900">Choose Color</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedTemplate.availableColors.map((color) => (
                        <div
                          key={color.name}
                          onClick={() => setSelectedColor(color)}
                          className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            selectedColor?.name === color.name
                              ? 'border-orange-500 bg-orange-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div
                            className="w-full h-6 rounded-md mb-1 border border-gray-200 shadow-sm"
                            style={{ backgroundColor: color.hexCode }}
                          ></div>
                          <p className="text-xs font-medium text-gray-900 text-center">{color.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Size Selection */}
                {selectedTemplate && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <h3 className="text-sm font-semibold text-gray-900">Choose Size</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.availableSizes.map((sizeInfo) => (
                        <div
                          key={sizeInfo.size}
                          onClick={() => setSelectedSize(sizeInfo)}
                          className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            selectedSize?.size === sizeInfo.size
                              ? 'border-orange-500 bg-orange-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <p className="font-semibold text-gray-900 text-center text-sm">{sizeInfo.size}</p>
                          <p className="text-xs text-green-600 text-center font-medium">৳{sizeInfo.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Upload Designs */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <h3 className="text-sm font-semibold text-gray-900">Upload Designs</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Front Design - Required */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Front Design <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'front')}
                          className="hidden"
                          id="front-upload"
                        />
                        <label
                          htmlFor="front-upload"
                          className={`flex flex-col items-center justify-center w-full h-12 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                            userDesigns.front.imageUrl
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {uploadingArea === 'front' ? (
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                              <span className="text-xs text-gray-600">Uploading...</span>
                            </div>
                          ) : userDesigns.front.imageUrl ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-medium">Front uploaded</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <svg className="mx-auto h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-xs text-gray-500">Upload Front</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Back Design - Required */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Back Design <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'back')}
                          className="hidden"
                          id="back-upload"
                        />
                        <label
                          htmlFor="back-upload"
                          className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                            userDesigns.back.imageUrl
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {uploadingArea === 'back' ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </div>
                          ) : userDesigns.back.imageUrl ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">Back design uploaded</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-sm text-gray-500 mt-1">Upload Back Design</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Sleeve Design - Optional */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sleeve Design <span className="text-gray-500">(+৳{selectedTemplate?.extraImagePrice || 30})</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'sleeve')}
                          className="hidden"
                          id="sleeve-upload"
                        />
                        <label
                          htmlFor="sleeve-upload"
                          className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                            userDesigns.sleeve.imageUrl
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {uploadingArea === 'sleeve' ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </div>
                          ) : userDesigns.sleeve.imageUrl ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">Sleeve design uploaded</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-sm text-gray-500 mt-1">Upload Sleeve Design</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Pocket Design - Optional */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Pocket <span className="text-gray-500">(+৳{selectedTemplate?.extraImagePrice || 30})</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'pocket')}
                          className="hidden"
                          id="pocket-upload"
                        />
                        <label
                          htmlFor="pocket-upload"
                          className={`flex flex-col items-center justify-center w-full h-12 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                            userDesigns.pocket.imageUrl
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {uploadingArea === 'pocket' ? (
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                              <span className="text-xs text-gray-600">Uploading...</span>
                            </div>
                          ) : userDesigns.pocket.imageUrl ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-medium">Pocket uploaded</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <svg className="mx-auto h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-xs text-gray-500">Upload Pocket</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Design Controls */}
                {selectedDesign && userDesigns[selectedDesign].imageUrl && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">⚡</div>
                      <h3 className="text-sm font-semibold text-gray-900">Design Controls</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {selectedDesign.charAt(0).toUpperCase() + selectedDesign.slice(1)} Size
                        </label>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Width</span>
                              <span>{userDesigns[selectedDesign].size.width.toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max={selectedTemplate?.designAreas?.[selectedDesign]?.maxWidth || 40}
                              value={userDesigns[selectedDesign].size.width}
                              onChange={(e) => handleResize(selectedDesign, parseFloat(e.target.value), userDesigns[selectedDesign].size.height)}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Height</span>
                              <span>{userDesigns[selectedDesign].size.height.toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max={selectedTemplate?.designAreas?.[selectedDesign]?.maxHeight || 50}
                              value={userDesigns[selectedDesign].size.height}
                              onChange={(e) => handleResize(selectedDesign, userDesigns[selectedDesign].size.width, parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => removeDesign(selectedDesign)}
                          className="flex-1 px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                        >
                          Remove Design
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-white p-2 rounded-md">
                        <p className="font-medium">💡 Arrow keys to move, Shift for big steps!</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">💰 Pricing</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium">৳{selectedSize?.price || 0}</span>
                    </div>
                    {userDesigns.sleeve.imageUrl && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Sleeve:</span>
                        <span className="font-medium">৳{selectedTemplate?.extraImagePrice || 30}</span>
                      </div>
                    )}
                    {userDesigns.pocket.imageUrl && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Pocket:</span>
                        <span className="font-medium">৳{selectedTemplate?.extraImagePrice || 30}</span>
                      </div>
                    )}
                    <div className="border-t border-green-200 pt-2 flex justify-between font-bold text-sm">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-green-600">৳{calculatePrice()}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                  >
                    Add to Cart
                  </button>
                </div>

                {/* Help Section */}
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">📱 Need Help?</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Contact us on WhatsApp for design assistance.
                  </p>
                  <a
                    href="https://wa.me/+8801344823831"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Professional Preview */}
          <div className="flex-1 flex flex-col bg-gray-100">
            
            {/* Preview Controls */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                  <p className="text-sm text-gray-500">Click and drag to position your designs</p>
                </div>
                
                {/* View Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['front', 'back', 'sleeve', 'pocket'].map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        setCurrentView(view);
                        if (userDesigns[view].imageUrl) {
                          setSelectedDesign(view);
                        }
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        currentView === view
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                      {userDesigns[view].imageUrl && (
                        <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="relative max-w-lg w-full">
                <div
                  ref={mockupRef}
                  className="relative w-full aspect-square bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
                  style={{ aspectRatio: '3/4' }}
                >
                  {/* Mockup Image */}
                  {selectedColor?.mockupImage ? (
                    <img
                      src={selectedColor.mockupImage}
                      alt="Product Mockup"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Select a color to see mockup</p>
                      </div>
                    </div>
                  )}

                  {/* User Design Overlay */}
                  {userDesigns[currentView].imageUrl && (
                    <div
                      className={`absolute cursor-move transition-all duration-200 hover:shadow-lg ${
                        selectedDesign === currentView ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                      }`}
                      style={{
                        left: `${userDesigns[currentView].position.x}%`,
                        top: `${userDesigns[currentView].position.y}%`,
                        width: `${userDesigns[currentView].size.width}%`,
                        height: `${userDesigns[currentView].size.height}%`,
                        transform: `translate(-50%, -50%) rotate(${userDesigns[currentView].rotation}deg)`,
                        zIndex: 10
                      }}
                      onMouseDown={(e) => handleDragStart(e, currentView)}
                      onClick={() => setSelectedDesign(currentView)}
                    >
                      <img
                        src={userDesigns[currentView].imageUrl}
                        alt={`${currentView} design`}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      
                      {/* Resize Handle */}
                      {selectedDesign === currentView && (
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full cursor-se-resize border-2 border-white shadow-lg"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsResizing(true);
                          }}
                        ></div>
                      )}
                    </div>
                  )}

                  {/* Drop Zone Overlay */}
                  {!userDesigns[currentView].imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-5">
                      <div className="text-center text-gray-500">
                        <svg className="mx-auto h-16 w-16 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-lg font-medium">Upload your {currentView} design</p>
                        <p className="text-sm mt-1">Use the menu on the left to get started</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Design Info */}
                {userDesigns[currentView].imageUrl && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      {currentView.charAt(0).toUpperCase() + currentView.slice(1)} design at {userDesigns[currentView].position.x.toFixed(0)}%, {userDesigns[currentView].position.y.toFixed(0)}%
                    </p>
                    {selectedDesign === currentView && (
                      <p className="text-xs text-orange-600 mt-1">
                        Use arrow keys or drag to reposition
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />

      {/* Custom Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  );
};

export default CustomizationPage;