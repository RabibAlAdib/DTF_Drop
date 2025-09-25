"use client";
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import axios from 'axios';

const ReviewSection = ({ productId }) => {
  const { user, getToken } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Review form state
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  // Fetch reviews
  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reviews?productId=${productId}&status=approved&page=${page}&limit=5&sortBy=newest`);
      
      if (response.data.success) {
        setReviews(response.data.reviews);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalReviews(response.data.pagination.totalReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (!newReview.title.trim() || !newReview.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      
      const response = await axios.post('/api/reviews', {
        productId,
        rating: newReview.rating,
        title: newReview.title.trim(),
        content: newReview.content.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Review submitted successfully! It will be visible after approval.');
        setNewReview({ rating: 5, title: '', content: '' });
        setShowAddReview(false);
        // Refresh reviews to show any approved ones
        fetchReviews();
      } else {
        toast.error(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle star rating click
  const handleRatingClick = (rating) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  // Render star rating
  const renderStars = (rating, interactive = false, onClick = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onClick && onClick(star)}
            className={`text-xl transition-colors ${
              interactive ? 'hover:text-yellow-400 cursor-pointer' : ''
            } ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Reviews ({totalReviews})
        </h3>
        
        {user ? (
          <button
            onClick={() => setShowAddReview(!showAddReview)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAddReview ? 'Cancel' : 'Write Review'}
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            <a href="/sign-in" className="text-blue-600 hover:underline">
              Sign in
            </a> to write a review
          </p>
        )}
      </div>

      {/* Add Review Form */}
      {showAddReview && user && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Write Your Review</h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Rating *</label>
              {renderStars(newReview.rating, true, handleRatingClick)}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Review Title *</label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of your review..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{newReview.title.length}/100 characters</p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Review *</label>
              <textarea
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your experience with this product..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{newReview.content.length}/1000 characters</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddReview(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-lg">No reviews yet</p>
            <p className="text-sm">Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="border border-gray-200 rounded-lg p-6 bg-white dark:bg-gray-800">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {review.reviewer?.imageUrl ? (
                    <Image
                      src={review.reviewer.imageUrl}
                      alt={review.reviewer.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {review.reviewer?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {review.reviewer?.name || 'Anonymous'}
                      </h5>
                      {review.isVerifiedPurchase && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white">
                  {review.title}
                </h6>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {review.content}
                </p>
              </div>

              {/* Review Variant Info */}
              {(review.variant?.color || review.variant?.size) && (
                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                  {review.variant.color && (
                    <span>Color: <strong>{review.variant.color}</strong></span>
                  )}
                  {review.variant.size && (
                    <span>Size: <strong>{review.variant.size}</strong></span>
                  )}
                </div>
              )}

              {/* Helpful Votes */}
              {review.helpfulVotes > 0 && (
                <div className="mt-3 text-sm text-gray-500">
                  {review.helpfulVotes} people found this helpful
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => fetchReviews(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => fetchReviews(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;