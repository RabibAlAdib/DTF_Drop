import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  // Basic offer information
  userId: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  
  // Discount configuration
  discountType: { 
    type: String, 
    required: true,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Validity period
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  
  // Offer status and visibility
  isActive: { type: Boolean, default: true },
  
  // Visual assets
  offerImage: { type: String, required: false }, // Cloudinary URL
  
  // Promo code functionality
  offerCode: { 
    type: String, 
    required: false,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true // Allows multiple null values
  },
  
  // Usage restrictions
  minimumOrderValue: { 
    type: Number, 
    required: false,
    min: 0,
    default: 0
  },
  usageLimit: { 
    type: Number, 
    required: false,
    min: 1
  },
  usedCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Product targeting (empty array means applies to all products)
  applicableProducts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'product' 
  }],
  
  // Display configuration
  offerType: {
    type: String,
    required: true,
    enum: ['banner', 'card', 'popup'],
    default: 'card'
  },
  
  // Priority for display ordering
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  // Offer categories for better organization
  category: {
    type: String,
    enum: ['flash_sale', 'seasonal', 'clearance', 'new_customer', 'bulk_discount', 'festival', 'general'],
    default: 'general'
  },
  
  // Additional display settings
  showCountdown: { type: Boolean, default: true },
  backgroundColor: { type: String, default: '#FF6B6B' },
  textColor: { type: String, default: '#FFFFFF' },
  
}, { 
  timestamps: true
});

// Virtual field to check if offer is currently valid
offerSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         this.validTo >= now &&
         (!this.usageLimit || this.usedCount < this.usageLimit);
});

// Virtual field to check if offer is expired
offerSchema.virtual('isExpired').get(function() {
  return new Date() > this.validTo;
});

// Virtual field to calculate days remaining
offerSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const timeRemaining = this.validTo - now;
  return Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
});

// Instance method to check if offer applies to specific product
offerSchema.methods.appliesToProduct = function(productId) {
  // If no specific products are set, applies to all products
  if (!this.applicableProducts || this.applicableProducts.length === 0) {
    return true;
  }
  // Ensure proper ObjectId comparison by converting both to strings
  const productIdString = productId ? productId.toString() : '';
  return this.applicableProducts.some(id => 
    id.toString() === productIdString
  );
};

// Instance method to calculate discount amount for given price
offerSchema.methods.calculateDiscount = function(originalPrice) {
  if (this.discountType === 'percentage') {
    return (originalPrice * this.discountValue) / 100;
  } else {
    return Math.min(this.discountValue, originalPrice);
  }
};

// Instance method to calculate final price after discount
offerSchema.methods.calculateFinalPrice = function(originalPrice) {
  const discount = this.calculateDiscount(originalPrice);
  return Math.max(0, originalPrice - discount);
};

// Static method to find active offers
offerSchema.statics.findActiveOffers = function(offerType = null) {
  const now = new Date();
  const query = {
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now }
  };
  
  if (offerType) {
    query.offerType = offerType;
  }
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 });
};

// Pre-save middleware to ensure validTo is after validFrom
offerSchema.pre('save', function(next) {
  if (this.validTo <= this.validFrom) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

// Pre-save middleware to ensure discount value is reasonable for percentage type
offerSchema.pre('save', function(next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Percentage discount cannot exceed 100%'));
  } else {
    next();
  }
});

// Add proper database indexes for optimal query performance
offerSchema.index({ userId: 1, isActive: 1 });
offerSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });
offerSchema.index({ offerType: 1, isActive: 1, priority: -1 });
offerSchema.index({ category: 1, isActive: 1 });
offerSchema.index({ createdAt: -1 });

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);
export default Offer;