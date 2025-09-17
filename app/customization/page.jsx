'use client'
import React, { useState, useEffect, useRef } from "react";
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
  
  // Design state
  const [userDesigns, setUserDesigns] = useState({
    front: { imageUrl: null, position: { x: 50, y: 40 }, size: { width: 25, height: 30 }, rotation: 0 },
    back: { imageUrl: null, position: { x: 50, y: 40 }, size: { width: 25, height: 30 }, rotation: 0 },
    sleeve: { imageUrl: null, position: { x: 80, y: 30 }, size: { width: 12, height: 15 }, rotation: 0 },
    pocket: { imageUrl: null, position: { x: 25, y: 35 }, size: { width: 8, height: 12 }, rotation: 0 }
  });
  
  const [currentView, setCurrentView] = useState('front'); // front, back, sleeve, pocket
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // File upload state
  const [uploadingArea, setUploadingArea] = useState(null);
  
  // Canvas/mockup refs
  const mockupRef = useRef(null);
  
  // Fetch templates on load
  useEffect(() => {
    fetchTemplates();
  }, []);
  
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
  
  // Upload image to Cloudinary
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
      
      const uploadResponse = await axios.post(signatureData.upload_url, formData);
      return uploadResponse.data.secure_url;
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (file, area) => {
    if (!file) return;
    
    // Validate file
    if (!file.type.includes('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image size should be less than 10MB');
      return;
    }
    
    try {
      setUploadingArea(area);
      const imageUrl = await uploadImageToCloudinary(file);
      
      setUserDesigns(prev => ({
        ...prev,
        [area]: {
          ...prev[area],
          imageUrl
        }
      }));
      
      toast.success(`${area.charAt(0).toUpperCase() + area.slice(1)} image uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingArea(null);
    }
  };
  
  // Handle drag and drop
  const handleDragStart = (e, area) => {
    if (area !== currentView) return;
    
    setIsDragging(true);
    const rect = mockupRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDragOffset({
      x: x - userDesigns[area].position.x,
      y: y - userDesigns[area].position.y
    });
  };
  
  const handleDragMove = (e) => {
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
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };
  
  // Handle resize
  const handleResize = (area, newWidth, newHeight) => {
    const maxWidth = selectedTemplate?.designAreas[area]?.maxWidth || 30;
    const maxHeight = selectedTemplate?.designAreas[area]?.maxHeight || 40;
    
    const clampedWidth = Math.max(5, Math.min(maxWidth, newWidth));
    const clampedHeight = Math.max(5, Math.min(maxHeight, newHeight));
    
    setUserDesigns(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        size: { width: clampedWidth, height: clampedHeight }
      }
    }));
  };
  
  // Calculate pricing
  const calculatePrice = () => {
    if (!selectedSize) return 0;
    
    const basePrice = selectedSize.price;
    let extraImagesCount = 0;
    
    // Count extra images (excluding front and back)
    if (userDesigns.sleeve.imageUrl) extraImagesCount++;
    if (userDesigns.pocket.imageUrl) extraImagesCount++;
    
    const extraImagePrice = selectedTemplate?.extraImagePrice || 30;
    return basePrice + (extraImagesCount * extraImagePrice);
  };
  
  // Add to cart
  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      return;
    }
    
    if (!selectedTemplate || !selectedColor || !selectedSize) {
      toast.error('Please select template, color, and size');
      return;
    }
    
    if (!userDesigns.front.imageUrl && !userDesigns.back.imageUrl) {
      toast.error('Please upload at least one design (front or back)');
      return;
    }
    
    try {
      const token = await getToken();
      const orderData = {
        templateId: selectedTemplate._id,
        selectedColor: selectedColor.name,
        selectedSize: selectedSize.size,
        userDesigns,
        userEmail: user.emailAddresses[0].emailAddress,
        customerNotes: ''
      };
      
      const response = await axios.post('/api/customization/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Add to regular cart for checkout flow
        const cartItem = {
          _id: `custom-${Date.now()}`,
          name: `Custom ${selectedTemplate.name} - ${selectedColor.name}`,
          category: selectedTemplate.category,
          price: calculatePrice(),
          images: [selectedColor.mockupImage],
          size: selectedSize.size,
          quantity: 1,
          isCustom: true,
          customOrderId: response.data.order.orderId
        };
        
        addToCart(cartItem);
        
        toast.success('Custom design added to cart!');
        
        // Show WhatsApp instruction
        setTimeout(() => {
          toast((t) => (
            <div className="flex flex-col gap-2">
              <span className="font-medium">📱 Important: Send Design Files</span>
              <span className="text-sm">
                For best quality, please send your design files via WhatsApp: +8801344823831
              </span>
              <span className="text-xs text-gray-500">
                Order ID: {response.data.order.orderId}
              </span>
            </div>
          ), { duration: 8000 });
        }, 1000);
        
      }
    } catch (error) {
      console.error('Error creating custom order:', error);
      toast.error('Failed to create custom order');
    }
  };
  
  // Remove design from area
  const removeDesign = (area) => {
    setUserDesigns(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        imageUrl: null
      }
    }));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (templates.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Templates Available</h2>
          <p className="text-gray-600 dark:text-gray-400">Please contact admin to add customization templates.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Design Your Custom Product
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Create unique designs with our easy-to-use customization tools
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Panel - Options */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Template Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">1. Choose Product</h3>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setSelectedColor(template.availableColors[0] || null);
                        setSelectedSize(template.availableSizes[0] || null);
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedTemplate?._id === template._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.category}</p>
                      <p className="text-sm font-semibold text-green-600">From ৳{Math.min(...template.availableSizes.map(s => s.price))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              {selectedTemplate && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">2. Choose Color</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedTemplate.availableColors.map((color) => (
                      <div
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedColor?.name === color.name
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded mb-2 border"
                          style={{ backgroundColor: color.hexCode }}
                        ></div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white text-center">{color.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {selectedTemplate && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">3. Choose Size</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTemplate.availableSizes.map((sizeInfo) => (
                      <div
                        key={sizeInfo.size}
                        onClick={() => setSelectedSize(sizeInfo)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedSize?.size === sizeInfo.size
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900 dark:text-white text-center">{sizeInfo.size}</p>
                        <p className="text-sm text-green-600 text-center">৳{sizeInfo.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Price:</span>
                    <span className="font-medium">৳{selectedSize?.price || 0}</span>
                  </div>
                  {userDesigns.sleeve.imageUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sleeve Design:</span>
                      <span className="font-medium">৳{selectedTemplate?.extraImagePrice || 30}</span>
                    </div>
                  )}
                  {userDesigns.pocket.imageUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pocket Design:</span>
                      <span className="font-medium">৳{selectedTemplate?.extraImagePrice || 30}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">৳{calculatePrice()}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedTemplate || !selectedColor || !selectedSize || (!userDesigns.front.imageUrl && !userDesigns.back.imageUrl)}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Center Panel - Mockup Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
                
                {/* View Selector */}
                <div className="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {['front', 'back', 'sleeve', 'pocket'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setCurrentView(view)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        currentView === view
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Mockup Container */}
                <div 
                  ref={mockupRef}
                  className="relative w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                >
                  {/* Mockup Image */}
                  {selectedColor?.mockupImage && (
                    <img
                      src={selectedColor.mockupImage}
                      alt="Product Mockup"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  )}

                  {/* User Design Overlay */}
                  {userDesigns[currentView].imageUrl && (
                    <div
                      className="absolute cursor-move"
                      style={{
                        left: `${userDesigns[currentView].position.x}%`,
                        top: `${userDesigns[currentView].position.y}%`,
                        width: `${userDesigns[currentView].size.width}%`,
                        height: `${userDesigns[currentView].size.height}%`,
                        transform: `translate(-50%, -50%) rotate(${userDesigns[currentView].rotation}deg)`,
                      }}
                      onMouseDown={(e) => handleDragStart(e, currentView)}
                    >
                      <img
                        src={userDesigns[currentView].imageUrl}
                        alt={`${currentView} design`}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      
                      {/* Resize Handles */}
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing(true);
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Drop Zone Overlay */}
                  {!userDesigns[currentView].imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Drop your {currentView} design here
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Current View Controls */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {currentView.charAt(0).toUpperCase() + currentView.slice(1)} Design
                    </span>
                    {userDesigns[currentView].imageUrl && (
                      <button
                        onClick={() => removeDesign(currentView)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Size Controls */}
                  {userDesigns[currentView].imageUrl && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width: {userDesigns[currentView].size.width.toFixed(0)}%</label>
                        <input
                          type="range"
                          min="5"
                          max={selectedTemplate?.designAreas[currentView]?.maxWidth || 30}
                          value={userDesigns[currentView].size.width}
                          onChange={(e) => handleResize(currentView, parseFloat(e.target.value), userDesigns[currentView].size.height)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height: {userDesigns[currentView].size.height.toFixed(0)}%</label>
                        <input
                          type="range"
                          min="5"
                          max={selectedTemplate?.designAreas[currentView]?.maxHeight || 40}
                          value={userDesigns[currentView].size.height}
                          onChange={(e) => handleResize(currentView, userDesigns[currentView].size.width, parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Design Tools */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Upload Areas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">4. Upload Your Designs</h3>
                
                <div className="space-y-4">
                  {/* Front Design */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Front Design (Required)
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
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          userDesigns.front.imageUrl
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {uploadingArea === 'front' ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        ) : userDesigns.front.imageUrl ? (
                          <div className="text-green-600 text-sm font-medium">✓ Front design uploaded</div>
                        ) : (
                          <div className="text-center">
                            <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-sm text-gray-500">Upload Front Design</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Back Design */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Back Design (Required)
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
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          userDesigns.back.imageUrl
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {uploadingArea === 'back' ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        ) : userDesigns.back.imageUrl ? (
                          <div className="text-green-600 text-sm font-medium">✓ Back design uploaded</div>
                        ) : (
                          <div className="text-center">
                            <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-sm text-gray-500">Upload Back Design</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Sleeve Design */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sleeve Design (Optional - ৳{selectedTemplate?.extraImagePrice || 30} extra)
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
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          userDesigns.sleeve.imageUrl
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {uploadingArea === 'sleeve' ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        ) : userDesigns.sleeve.imageUrl ? (
                          <div className="text-green-600 text-sm font-medium">✓ Sleeve design uploaded</div>
                        ) : (
                          <div className="text-center">
                            <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-sm text-gray-500">Upload Sleeve Design</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Pocket Design */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pocket Design (Optional - ৳{selectedTemplate?.extraImagePrice || 30} extra)
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
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          userDesigns.pocket.imageUrl
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {uploadingArea === 'pocket' ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        ) : userDesigns.pocket.imageUrl ? (
                          <div className="text-green-600 text-sm font-medium">✓ Pocket design uploaded</div>
                        ) : (
                          <div className="text-center">
                            <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-sm text-gray-500">Upload Pocket Design</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Guidelines */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">💡 Design Tips</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Use high-resolution images (at least 300 DPI)</li>
                  <li>• PNG files with transparent backgrounds work best</li>
                  <li>• Front and back designs are included in base price</li>
                  <li>• Sleeve and pocket designs cost ৳{selectedTemplate?.extraImagePrice || 30} extra each</li>
                  <li>• Drag and resize your designs on the preview</li>
                  <li>• Send high-res files via WhatsApp for best print quality</li>
                </ul>
              </div>

              {/* WhatsApp Contact */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3">📱 Need Help?</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  Contact us on WhatsApp for design assistance or to send high-resolution files.
                </p>
                <a
                  href="https://wa.me/+8801344823831"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CustomizationPage;