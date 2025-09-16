import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  // Review identification
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true,
    index: true
  },
  userId: { 
    type: String, 
    required: true, 
    ref: 'User',
    index: true
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    required: false // Only for verified purchases
  },
  
  // Review content
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000 
  },
  
  // Review media
  images: [{
    url: { type: String, required: true }, // Cloudinary URL
    publicId: { type: String, required: true }, // For deletion
    caption: { type: String, required: false }
  }],
  
  // Review metadata
  isVerifiedPurchase: { 
    type: Boolean, 
    default: false 
  },
  helpfulVotes: { 
    type: Number, 
    default: 0 
  },
  reportedCount: { 
    type: Number, 
    default: 0 
  },
  
  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  moderationReason: {
    type: String,
    required: false
  },
  
  // User information (cached for performance)
  reviewer: {
    name: { type: String, required: true },
    imageUrl: { type: String, required: false }
  },
  
  // Product variant information
  variant: {
    color: { type: String, required: false },
    size: { type: String, required: false }
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, rating: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });

// Prevent duplicate reviews per user per product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Virtual to calculate review age
ReviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Pre-save middleware to update timestamps
ReviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods for common queries
ReviewSchema.statics.findByProduct = function(productId, status = 'approved') {
  return this.find({ productId, status }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

ReviewSchema.statics.getProductRatingStats = async function(productId) {
  const pipeline = [
    { $match: { productId: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: '$productId',
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratings: {
          $push: '$rating'
        }
      }
    },
    {
      $addFields: {
        ratingDistribution: {
          5: { $size: { $filter: { input: '$ratings', cond: { $eq: ['$$this', 5] } } } },
          4: { $size: { $filter: { input: '$ratings', cond: { $eq: ['$$this', 4] } } } },
          3: { $size: { $filter: { input: '$ratings', cond: { $eq: ['$$this', 3] } } } },
          2: { $size: { $filter: { input: '$ratings', cond: { $eq: ['$$this', 2] } } } },
          1: { $size: { $filter: { input: '$ratings', cond: { $eq: ['$$this', 1] } } } }
        }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: 1
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
};

ReviewSchema.statics.getPendingReviews = function() {
  return this.find({ status: 'pending' })
    .populate('productId', 'name images')
    .sort({ createdAt: -1 });
};

// Instance methods
ReviewSchema.methods.approve = function() {
  this.status = 'approved';
  this.moderationReason = '';
  return this.save();
};

ReviewSchema.methods.reject = function(reason = '') {
  this.status = 'rejected';
  this.moderationReason = reason;
  return this.save();
};

ReviewSchema.methods.hide = function(reason = '') {
  this.status = 'hidden';
  this.moderationReason = reason;
  return this.save();
};

ReviewSchema.methods.markHelpful = function() {
  this.helpfulVotes += 1;
  return this.save();
};

ReviewSchema.methods.report = function() {
  this.reportedCount += 1;
  // Auto-hide if too many reports
  if (this.reportedCount >= 5) {
    this.status = 'hidden';
    this.moderationReason = 'Auto-hidden due to multiple reports';
  }
  return this.save();
};

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;