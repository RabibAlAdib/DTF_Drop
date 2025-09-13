'use client'
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';
import { assets } from '@/assets/assets';

const HeaderSliderManagement = () => {
  const { getToken, products } = useAppContext();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    shortText: '',
    productImage: null,
    buyButtonText: 'Buy Now',
    buyButtonAction: 'addToCart',
    buyButtonLink: '',
    learnMoreButtonText: 'Learn More',
    learnMoreLink: '',
    isVisible: true
  });

  const fetchSlides = async () => {
    try {
      const response = await axios.get('/api/header-slider');
      if (response.data.success) {
        setSlides(response.data.slides);
      }
    } catch (error) {
      console.error('Failed to fetch slides:', error);
      toast.error('Failed to load header slides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        productImage: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = await getToken();
      const submitData = new FormData();
      
      submitData.append('title', formData.title);
      submitData.append('shortText', formData.shortText);
      submitData.append('productImage', formData.productImage);
      submitData.append('buyButtonText', formData.buyButtonText);
      submitData.append('buyButtonAction', formData.buyButtonAction);
      submitData.append('buyButtonLink', formData.buyButtonLink);
      submitData.append('learnMoreButtonText', formData.learnMoreButtonText);
      submitData.append('learnMoreLink', formData.learnMoreLink);
      submitData.append('isVisible', formData.isVisible.toString());

      const response = await axios.post('/api/header-slider', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Header slide created successfully!');
        // Reset form
        setFormData({
          title: '',
          shortText: '',
          productImage: null,
          buyButtonText: 'Buy Now',
          buyButtonAction: 'addToCart',
          buyButtonLink: '',
          learnMoreButtonText: 'Learn More',
          learnMoreLink: '',
          isVisible: true
        });
        // Clear file input
        document.getElementById('productImageInput').value = '';
        // Refresh slides
        fetchSlides();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error creating slide:', error);
      toast.error(error.response?.data?.message || 'Failed to create header slide');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSlideVisibility = async (slideId, currentVisibility) => {
    try {
      const token = await getToken();
      const response = await axios.put(`/api/header-slider/${slideId}`, 
        { isVisible: !currentVisibility },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Slide visibility updated!');
        fetchSlides();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating slide:', error);
      toast.error('Failed to update slide visibility');
    }
  };

  const deleteSlide = async (slideId) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const token = await getToken();
      const response = await axios.delete(`/api/header-slider/${slideId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Slide deleted successfully!');
        fetchSlides();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast.error('Failed to delete slide');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Header Slider Management</h1>

        {/* Create New Slide Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create New Header Slide</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter slide title"
                  required
                />
              </div>

              {/* Short Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Text (Offer/Promotional Text) *
                </label>
                <input
                  type="text"
                  name="shortText"
                  value={formData.shortText}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Limited Time Offer 30% Off"
                  required
                />
              </div>
            </div>

            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Image (Transparent Background Recommended) *
              </label>
              <input
                type="file"
                id="productImageInput"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.productImage && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Selected: {formData.productImage.name}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Buy Button Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Buy/Order Button</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    name="buyButtonText"
                    value={formData.buyButtonText}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action Type
                  </label>
                  <select
                    name="buyButtonAction"
                    value={formData.buyButtonAction}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="addToCart">Add to Cart</option>
                    <option value="redirect">Redirect to URL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.buyButtonAction === 'addToCart' ? 'Product' : 'URL'}
                  </label>
                  {formData.buyButtonAction === 'addToCart' ? (
                    <select
                      name="buyButtonLink"
                      value={formData.buyButtonLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="url"
                      name="buyButtonLink"
                      value={formData.buyButtonLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Learn More Button Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Learn More Button</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    name="learnMoreButtonText"
                    value={formData.learnMoreButtonText}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link URL *
                  </label>
                  <input
                    type="url"
                    name="learnMoreLink"
                    value={formData.learnMoreLink}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Visibility Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isVisible"
                id="isVisible"
                checked={formData.isVisible}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="isVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show in header slider (visible to users)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Header Slide'}
            </button>
          </form>
        </div>

        {/* Existing Slides List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Existing Header Slides ({slides.length})
          </h2>
          
          {slides.length === 0 ? (
            <div className="text-center py-12">
              <Image 
                src={assets.upload_area} 
                alt="No slides" 
                className="mx-auto mb-4 opacity-50"
                width={100}
                height={100}
              />
              <p className="text-gray-500 dark:text-gray-400">No header slides created yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Create your first slide using the form above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide) => (
                <div
                  key={slide._id}
                  className={`p-4 border rounded-lg ${
                    slide.isVisible 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{slide.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          slide.isVisible 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {slide.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{slide.shortText}</p>
                      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Buy: {slide.buyButtonText}</span>
                        <span>Learn: {slide.learnMoreButtonText}</span>
                        <span>Created: {new Date(slide.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleSlideVisibility(slide._id, slide.isVisible)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          slide.isVisible
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100'
                        }`}
                      >
                        {slide.isVisible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => deleteSlide(slide._id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200 dark:bg-red-800 dark:text-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderSliderManagement;